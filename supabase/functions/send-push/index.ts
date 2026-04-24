/**
 * send-push: 接收一条通知载荷，查目标用户的 device_tokens，
 * 通过 APNs HTTP/2 发送原生推送（iOS）。
 *
 * 请求体：
 *   {
 *     userIds: string[],           // 接收用户的 UUID 列表
 *     title: string,               // 推送标题
 *     body: string,                // 推送正文
 *     data?: Record<string, any>,  // 自定义数据（如 conversationId）
 *     collapseId?: string,         // 同 id 通知会合并
 *     threadId?: string,           // iOS 通知分组
 *   }
 *
 * 调用方：DB trigger 通过 pg_net 调用 / 或前端 supabase.functions.invoke('send-push', { body })
 * 鉴权：调用方需带 SUPABASE_SERVICE_ROLE_KEY（来自 trigger 的 service role）
 *
 * 配置 secrets（缺任一项时跳过推送，返回 skipped:true，不报错）：
 *   APNS_TEAM_ID       — Apple Developer Team ID（10 位）
 *   APNS_KEY_ID        — APNs Auth Key 的 Key ID（10 位）
 *   APNS_BUNDLE_ID     — App Bundle ID，本项目为 chat.archime.app
 *   APNS_AUTH_KEY      — .p8 文件全文（包含 -----BEGIN PRIVATE KEY----- 行）
 *   APNS_USE_SANDBOX   — "true" 走 sandbox（开发/TestFlight），其他走生产，默认 false
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  collapseId?: string;
  threadId?: string;
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/* ===================== APNs JWT 签名 ===================== */

function base64UrlEncode(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedJwt: { token: string; expiresAt: number } | null = null;

async function buildApnsJwt(teamId: string, keyId: string, p8: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // APNs JWT 有效期 < 1 小时；这里 50 分钟内复用
  if (cachedJwt && cachedJwt.expiresAt - now > 600) return cachedJwt.token;

  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const claims = { iss: teamId, iat: now };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const claimsB64 = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;

  const keyBuf = pemToArrayBuffer(p8);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuf,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const sigB64 = base64UrlEncode(sigBuf);
  const token = `${signingInput}.${sigB64}`;

  cachedJwt = { token, expiresAt: now + 3000 };
  return token;
}

/* ===================== 主入口 ===================== */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = (await req.json()) as PushPayload;
    if (!payload?.userIds?.length || !payload.title) {
      return jsonResponse(400, { error: 'userIds and title are required' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse(500, { error: 'Supabase env not configured' });
    }

    const teamId = Deno.env.get('APNS_TEAM_ID');
    const keyId = Deno.env.get('APNS_KEY_ID');
    const bundleId = Deno.env.get('APNS_BUNDLE_ID');
    const p8 = Deno.env.get('APNS_AUTH_KEY');
    const useSandbox = (Deno.env.get('APNS_USE_SANDBOX') ?? 'false').toLowerCase() === 'true';

    // 缺凭证时静默跳过，避免阻塞 trigger
    if (!teamId || !keyId || !bundleId || !p8) {
      console.log('[send-push] APNs not configured, skipping');
      return jsonResponse(200, { skipped: true, reason: 'apns_not_configured' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 取目标用户的 iOS 设备 token
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .in('user_id', payload.userIds)
      .eq('platform', 'ios');

    if (error) {
      console.error('[send-push] Failed to fetch tokens:', error);
      return jsonResponse(500, { error: error.message });
    }
    if (!tokens || tokens.length === 0) {
      return jsonResponse(200, { sent: 0, reason: 'no_ios_tokens' });
    }

    const jwt = await buildApnsJwt(teamId, keyId, p8);
    const host = useSandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';

    const apsBody = JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        'mutable-content': 1,
        ...(payload.threadId ? { 'thread-id': payload.threadId } : {}),
      },
      ...(payload.data ?? {}),
    });

    let success = 0;
    let failed = 0;
    const failedTokens: string[] = [];

    await Promise.all(
      tokens.map(async (t) => {
        try {
          const headers: Record<string, string> = {
            authorization: `bearer ${jwt}`,
            'apns-topic': bundleId,
            'apns-push-type': 'alert',
            'apns-priority': '10',
            'content-type': 'application/json',
          };
          if (payload.collapseId) headers['apns-collapse-id'] = payload.collapseId;

          const res = await fetch(`https://${host}/3/device/${t.token}`, {
            method: 'POST',
            headers,
            body: apsBody,
          });
          if (res.ok) {
            success++;
          } else {
            failed++;
            const err = await res.text();
            console.warn('[send-push] APNs error', res.status, err, 'token:', t.token.slice(0, 12));
            // 410 Unregistered / BadDeviceToken：标记此 token 失效
            if (res.status === 410 || /BadDeviceToken|Unregistered/.test(err)) {
              failedTokens.push(t.token);
            }
          }
        } catch (e) {
          failed++;
          console.error('[send-push] fetch error:', e);
        }
      }),
    );

    // 清理失效 token
    if (failedTokens.length > 0) {
      await supabase.from('device_tokens').delete().in('token', failedTokens);
    }

    return jsonResponse(200, { sent: success, failed, cleaned: failedTokens.length });
  } catch (err) {
    console.error('[send-push] Unexpected error:', err);
    return jsonResponse(500, { error: (err as Error).message });
  }
});