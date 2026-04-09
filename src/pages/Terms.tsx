import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, SUPPORT_EMAIL } from '@/lib/constants';

export default function Terms() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="服务条款" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-sm prose-stone max-w-none">
          <p className="text-xs text-stone-400">最后更新：2025年1月1日</p>

          <h2 className="text-base font-semibold">1. 服务说明</h2>
          <p>{APP_NAME_ZH}（{APP_NAME_EN}）是一款即时通讯应用程序，提供文字聊天、图片分享、语音和视频通话等通讯功能。</p>

          <h2 className="text-base font-semibold">2. 用户注册</h2>
          <p>您需要使用有效的电子邮件地址注册账户。您有责任保管账户安全，不得将账户转让给他人。</p>

          <h2 className="text-base font-semibold">3. 用户行为规范</h2>
          <p>使用本服务时，您同意不会：</p>
          <ul className="list-disc pl-4 text-sm">
            <li>发送垃圾信息或骚扰他人</li>
            <li>发布色情、暴力或其他违法内容</li>
            <li>冒充他人或进行欺诈行为</li>
            <li>传播恶意软件或进行网络攻击</li>
            <li>利用服务进行任何违法活动</li>
          </ul>

          <h2 className="text-base font-semibold">4. 内容管理</h2>
          <p>我们有权对违反社区规范的内容采取措施，包括但不限于删除内容、限制账户或终止服务。</p>

          <h2 className="text-base font-semibold">5. 举报与拉黑</h2>
          <p>您可以举报违规用户和消息，也可以拉黑不想联系的用户。我们会根据举报内容进行审查和处理。</p>

          <h2 className="text-base font-semibold">6. 账户删除</h2>
          <p>您可以随时在设置中申请删除账户。删除请求提交后有7天冷却期，之后账户和相关数据将被永久删除。</p>

          <h2 className="text-base font-semibold">7. 免责声明</h2>
          <p>本服务按"现状"提供，我们不对服务的持续可用性做出保证。对于因使用本服务产生的直接或间接损失，我们不承担责任。</p>

          <h2 className="text-base font-semibold">8. 条款修改</h2>
          <p>我们保留随时修改本条款的权利。修改后的条款将在发布时生效，继续使用服务即表示同意修改后的条款。</p>

          <h2 className="text-base font-semibold">9. 联系我们</h2>
          <p>如有任何疑问，请联系：{SUPPORT_EMAIL}</p>
        </div>
      </div>
    </div>
  );
}
