import { PageHeader } from '@/components/layout/PageHeader';
import { APP_NAME_ZH, APP_NAME_EN, APP_VERSION, SUPPORT_EMAIL } from '@/lib/constants';

export default function About() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="关于我们" />
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand shadow-lg">
            <div className="flex items-end gap-0.5">
              <div className="h-4 w-1 rounded-full bg-white" />
              <div className="h-6 w-1 rounded-full bg-white" />
              <div className="h-5 w-1 rounded-full bg-white" />
              <div className="h-3 w-1 rounded-full bg-white" />
            </div>
          </div>
          <h1 className="mt-4 text-xl font-bold text-stone-900">{APP_NAME_ZH}</h1>
          <p className="text-sm text-stone-400">{APP_NAME_EN}</p>
          <p className="mt-1 text-xs text-stone-300">版本 {APP_VERSION}</p>
        </div>

        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-stone-600">
            {APP_NAME_ZH} 是一款安全、可靠的即时通讯应用，致力于为用户提供简洁高效的沟通体验。
          </p>

          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-700">核心特性</h3>
            <ul className="mt-2 space-y-1 text-sm text-stone-500">
              <li>端到端即时通讯</li>
              <li>单聊与群聊</li>
              <li>语音和视频通话</li>
              <li>图片和文件分享</li>
              <li>完善的隐私保护</li>
            </ul>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-stone-700">联系我们</h3>
            <p className="mt-2 text-sm text-stone-500">{SUPPORT_EMAIL}</p>
          </div>

          <p className="text-xs text-stone-300">
            © {new Date().getFullYear()} {APP_NAME_EN}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
