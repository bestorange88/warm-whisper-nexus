-- 启用 pg_net 扩展（如已启用则忽略）
create extension if not exists pg_net with schema extensions;

-- 通用：调用 send-push edge function（异步）
create or replace function public._call_send_push(_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _supabase_url text;
  _service_key text;
begin
  -- 这两个值必须由 Lovable Cloud 项目级配置注入
  _supabase_url := current_setting('app.supabase_url', true);
  _service_key := current_setting('app.service_role_key', true);

  -- 如未配置，使用硬编码的项目 URL（service key 必须从 GUC 读取）
  if _supabase_url is null then
    _supabase_url := 'https://ozkbiywqvbfqpjgqvkdq.supabase.co';
  end if;

  if _service_key is null then
    -- 没有 service key 就跳过，避免无鉴权调用
    return;
  end if;

  perform extensions.http_post(
    url := _supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := _payload
  );
end;
$$;

-- 触发器函数：消息插入时推送给除发送者外的所有成员
create or replace function public.trigger_push_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _user_ids uuid[];
  _sender_name text;
  _conv_type text;
  _conv_name text;
  _title text;
  _body text;
begin
  -- 取除发送者外、且未静音的成员
  select array_agg(cm.user_id)
    into _user_ids
  from public.conversation_members cm
  where cm.conversation_id = NEW.conversation_id
    and cm.user_id <> NEW.sender_id
    and coalesce(cm.is_muted, false) = false;

  if _user_ids is null or array_length(_user_ids, 1) is null then
    return NEW;
  end if;

  -- 取发送者名称
  select coalesce(p.display_name, p.username, 'Someone')
    into _sender_name
  from public.profiles p
  where p.id = NEW.sender_id;

  -- 取会话信息（群聊在标题前缀群名）
  select c.type, c.name into _conv_type, _conv_name
  from public.conversations c
  where c.id = NEW.conversation_id;

  if _conv_type = 'group' and _conv_name is not null then
    _title := _conv_name;
    _body := coalesce(_sender_name, 'Someone') || ': ' ||
             case
               when NEW.type = 'image' then '[Image]'
               when NEW.type = 'file' then '[File]'
               when NEW.type = 'audio' then '[Voice]'
               when NEW.type = 'video' then '[Video]'
               else coalesce(NEW.content, '')
             end;
  else
    _title := coalesce(_sender_name, 'New message');
    _body := case
               when NEW.type = 'image' then '[Image]'
               when NEW.type = 'file' then '[File]'
               when NEW.type = 'audio' then '[Voice]'
               when NEW.type = 'video' then '[Video]'
               else coalesce(NEW.content, '')
             end;
  end if;

  -- 截断超长正文
  if length(_body) > 120 then
    _body := substring(_body from 1 for 120) || '…';
  end if;

  perform public._call_send_push(jsonb_build_object(
    'userIds', to_jsonb(_user_ids),
    'title', _title,
    'body', _body,
    'collapseId', 'msg:' || NEW.conversation_id::text,
    'threadId', NEW.conversation_id::text,
    'data', jsonb_build_object(
      'type', 'message',
      'conversationId', NEW.conversation_id,
      'messageId', NEW.id
    )
  ));

  return NEW;
exception
  when others then
    -- 推送失败不阻塞消息发送
    raise warning 'push_on_new_message failed: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_push_on_new_message on public.messages;
create trigger trg_push_on_new_message
after insert on public.messages
for each row
execute function public.trigger_push_on_new_message();

-- 触发器函数：好友申请插入时推送给接收方
create or replace function public.trigger_push_on_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _sender_name text;
begin
  if NEW.status is distinct from 'pending' then
    return NEW;
  end if;

  select coalesce(p.display_name, p.username, 'Someone')
    into _sender_name
  from public.profiles p
  where p.id = NEW.sender_id;

  perform public._call_send_push(jsonb_build_object(
    'userIds', jsonb_build_array(NEW.receiver_id),
    'title', 'New friend request',
    'body', coalesce(_sender_name, 'Someone') || ' wants to be your friend',
    'collapseId', 'fr:' || NEW.id::text,
    'data', jsonb_build_object(
      'type', 'friend_request',
      'requestId', NEW.id
    )
  ));

  return NEW;
exception
  when others then
    raise warning 'push_on_friend_request failed: %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists trg_push_on_friend_request on public.friend_requests;
create trigger trg_push_on_friend_request
after insert on public.friend_requests
for each row
execute function public.trigger_push_on_friend_request();