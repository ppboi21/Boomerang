import { imgUrl } from '../../utils/image';
import { initials } from '../../utils/format';

const TINTS = ['bg-zap text-night', 'bg-grape text-night', 'bg-cobalt text-white', 'bg-sun text-night', 'bg-coral text-night'];
const SIZES = { xs: 'size-7 text-[10px]', sm: 'size-9 text-xs', md: 'size-11 text-sm', lg: 'size-16 text-lg', xl: 'size-24 text-2xl' };

export function Avatar({ user, size = 'md', online, className = '' }) {
  const tint = TINTS[[...(user?.id || user?.name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {user?.avatarUrl ? (
        <img src={imgUrl(user.avatarUrl, 200)} alt="" className={`${SIZES[size]} rounded-full object-cover ring-1 ring-ink-700`} />
      ) : (
        <span aria-hidden className={`${SIZES[size]} ${tint} inline-flex items-center justify-center rounded-full font-display font-bold`}>
          {initials(user?.name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-ink-900 ${online ? 'bg-zap' : 'bg-ink-500'}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
