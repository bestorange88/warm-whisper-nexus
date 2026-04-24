-- 通话来电推送触发器：被叫方在 App 后台/锁屏时也能收到来电提醒
create or replace function public.trigger_push_on_incoming_call()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  _caller_name text;
  _title text;
  _body text;
begin
  -- 仅 ringing 状态触发（initiated 是占位，ringing 才是已就绪可呼叫）
  if NEW.status is distinct from 'ringing' then
    return NEW;
  end if;

  -- 取拨打方姓名
  select coalesce(p.display_name, p.username, 'Someone')
    into _caller_name
  from public.profiles p
  where p.id = NEW.caller_id;

  if NEW.call_type = 'video' then
    _title := coalesce(_caller_name, '来电') || ' 邀请你视频通话';
    _body := '点击接听';
  else
    _title := coalesce(_caller_name, '来电') || ' 邀请你语音通话';
    _body := '点击接听';
  end if;

  perform public._call_send_push(jsonb_build_object(
    'userIds', jsonb_build_array(NEW.callee_id),
    'title', _title,
    'body', _body,
    'collapseId', 'call:' || NEW.id::text,
    'data', jsonb_build_object(
      'type', 'incoming_call',
      'callSessionId', NEW.id,
      'conversationId', NEW.conversation_id,
      'callType', NEW.call_type,
      'callerId', NEW.caller_id
    )
  ));

  return NEW;
exception
  when others then
    raise warning 'push_on_incoming_call failed: %', SQLERRM;
    return NEW;
end;
$function$;

drop trigger if exists push_on_incoming_call on public.call_sessions;

create trigger push_on_incoming_call
after insert on public.call_sessions
for each row
execute function public.trigger_push_on_incoming_call();