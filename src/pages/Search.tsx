import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useSearchUsers } from '@/hooks/useContacts';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Search() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearchUsers(query);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="搜索" />
      <div className="px-4 py-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户名或昵称..."
            className="pl-9"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner className="mt-8" />
        ) : query.length < 2 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="输入关键词搜索" description="至少输入2个字符" />
        ) : !results || results.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="未找到用户" description="换个关键词试试" />
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
