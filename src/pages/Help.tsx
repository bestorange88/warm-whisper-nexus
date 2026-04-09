import { PageHeader } from '@/components/layout/PageHeader';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { Mail, MessageCircle, Shield, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation();

  const faqs = [
    { icon: MessageCircle, q: t('help.faqAddFriend'), a: t('help.faqAddFriendAnswer') },
    { icon: MessageCircle, q: t('help.faqCreateGroup'), a: t('help.faqCreateGroupAnswer') },
    { icon: Shield, q: t('help.faqReport'), a: t('help.faqReportAnswer') },
    { icon: Shield, q: t('help.faqBlock'), a: t('help.faqBlockAnswer') },
    { icon: HelpCircle, q: t('help.faqDeleteAccount'), a: t('help.faqDeleteAccountAnswer') },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('help.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-light p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-brand" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">{t('help.contactSupport')}</h3>
                <p className="text-sm text-stone-500">{SUPPORT_EMAIL}</p>
              </div>
            </div>
          </div>

          <h2 className="text-base font-semibold text-stone-900">{t('help.faq')}</h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="rounded-lg border border-stone-200 p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                  <faq.icon className="h-4 w-4 text-brand" />
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-stone-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
