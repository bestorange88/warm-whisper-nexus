import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useSearchUsers } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearchUsers(query);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('common.search')} />
      <div className="px-4 py-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('contacts.searchPlaceholder2')}
            className="pl-9"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner className="mt-8" />
        ) : query.length < 2 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title={t('contacts.searchKeyword')} description={t('contacts.minChars')} />
        ) : !results || results.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title={t('contacts.noResults')} description={t('contacts.noResultsDesc')} />
        ) : (
          <div className="divide-y divide-stone-50">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/profile/${u.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50"
              >
                <UserAvatar src={u.avatar_url} name={u.display_name || u.username} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{u.display_name || u.username}</p>
                  <p className="truncate text-xs text-stone-400">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
