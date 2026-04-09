import { PageHeader } from '@/components/layout/PageHeader';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { Mail, MessageCircle, Shield, HelpCircle } from 'lucide-react';

export default function Help() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="帮助中心" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-light p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-brand" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">联系客服</h3>
                <p className="text-sm text-stone-500">{SUPPORT_EMAIL}</p>
              </div>
            </div>
          </div>

          <h2 className="text-base font-semibold text-stone-900">常见问题</h2>

          <div className="space-y-3">
            <details className="rounded-lg border border-stone-200 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <MessageCircle className="h-4 w-4 text-brand" />
                如何添加好友？
              </summary>
              <p className="mt-2 text-sm text-stone-500">
                在联系人页面点击"添加好友"，通过用户名或昵称搜索用户，找到后点击"添加"发送好友请求。对方接受后即可开始聊天。
              </p>
            </details>

            <details className="rounded-lg border border-stone-200 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <MessageCircle className="h-4 w-4 text-brand" />
                如何创建群聊？
              </summary>
              <p className="mt-2 text-sm text-stone-500">
                在联系人页面点击"创建群聊"，输入群名称并选择要加入的好友，点击"创建"即可。
              </p>
            </details>

            <details className="rounded-lg border border-stone-200 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <Shield className="h-4 w-4 text-brand" />
                如何举报不良内容？
              </summary>
              <p className="mt-2 text-sm text-stone-500">
                在聊天中长按消息可以选择"举报"，或在用户资料页面点击"举报"按钮。选择举报原因并提交即可，我们会尽快处理。
              </p>
            </details>

            <details className="rounded-lg border border-stone-200 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <Shield className="h-4 w-4 text-brand" />
                如何拉黑用户？
              </summary>
              <p className="mt-2 text-sm text-stone-500">
                在用户资料页面点击"拉黑"按钮。拉黑后双方将无法互相发送消息。您可以在设置 &gt; 黑名单中管理已拉黑的用户。
              </p>
            </details>

            <details className="rounded-lg border border-stone-200 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                <HelpCircle className="h-4 w-4 text-brand" />
                如何删除账户？
              </summary>
              <p className="mt-2 text-sm text-stone-500">
                在设置 &gt; 账号管理 &gt; 删除账户中可以提交删除请求。提交后有7天的冷却期，期间可以取消。冷却期结束后，账户和所有数据将被永久删除。
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
