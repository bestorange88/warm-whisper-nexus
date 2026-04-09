import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, SUPPORT_EMAIL } from '@/lib/constants';

export default function Privacy() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="隐私政策" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-sm prose-stone max-w-none">
          <p className="text-xs text-stone-400">最后更新：2025年1月1日</p>

          <h2 className="text-base font-semibold">1. 信息收集</h2>
          <p>{APP_NAME_ZH}（{APP_NAME_EN}）收集以下类型的信息：</p>
          <ul className="list-disc pl-4 text-sm">
            <li><strong>账户信息：</strong>注册时提供的电子邮件、用户名</li>
            <li><strong>个人资料：</strong>您选择填写的昵称、头像、个性签名</li>
            <li><strong>通讯数据：</strong>发送和接收的消息内容</li>
            <li><strong>设备信息：</strong>设备类型、操作系统版本</li>
          </ul>

          <h2 className="text-base font-semibold">2. 信息使用</h2>
          <p>我们使用收集的信息用于：</p>
          <ul className="list-disc pl-4 text-sm">
            <li>提供和维护即时通讯服务</li>
            <li>验证用户身份</li>
            <li>改善服务质量和用户体验</li>
            <li>处理举报和维护社区安全</li>
          </ul>

          <h2 className="text-base font-semibold">3. 信息存储</h2>
          <p>您的数据存储在安全的云服务器上，采用行业标准的加密和安全措施进行保护。我们会定期审查和更新安全措施。</p>

          <h2 className="text-base font-semibold">4. 信息共享</h2>
          <p>我们不会出售您的个人信息。仅在以下情况下可能共享：</p>
          <ul className="list-disc pl-4 text-sm">
            <li>经您明确同意</li>
            <li>法律法规要求</li>
            <li>保护用户安全或公共利益</li>
          </ul>

          <h2 className="text-base font-semibold">5. 用户权利</h2>
          <p>您有权：</p>
          <ul className="list-disc pl-4 text-sm">
            <li>查看和修改您的个人资料</li>
            <li>删除您的账户及相关数据</li>
            <li>控制隐私设置（在线状态、已读回执等）</li>
            <li>拉黑不想联系的用户</li>
          </ul>

          <h2 className="text-base font-semibold">6. 数据安全</h2>
          <p>我们采用行级安全（RLS）策略确保数据隔离，消息只能被会话成员访问，个人设置按用户隔离。</p>

          <h2 className="text-base font-semibold">7. 未成年人保护</h2>
          <p>本服务面向年满13周岁的用户。我们不会故意收集未满13周岁儿童的个人信息。</p>

          <h2 className="text-base font-semibold">8. 政策更新</h2>
          <p>我们可能会不定期更新本隐私政策。更新后的政策将在应用内发布，继续使用服务即表示同意更新后的政策。</p>

          <h2 className="text-base font-semibold">9. 联系我们</h2>
          <p>如有隐私相关疑问，请联系：{SUPPORT_EMAIL}</p>
        </div>
      </div>
    </div>
  );
}
