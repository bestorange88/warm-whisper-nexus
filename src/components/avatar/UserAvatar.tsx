import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {src ? (
        <AvatarImage src={src} alt={name || 'User'} />
      ) : (
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      )}
    </Avatar>
  );
}
