import { NavLink } from 'react-router';
import { useSocket } from '../../context/SocketContext';
import { TYPE } from '../../utils/constants';
import { timeAgo } from '../../utils/format';
import { Avatar } from '../ui/Avatar';

export function ConversationList({ conversations, meId }) {
  const { isOnline } = useSocket();
  return (
    <ul className="space-y-1" aria-label="Conversations">
      {conversations.map((c) => {
        const mine = c.lastMessage?.sender === meId;
        return (
          <li key={c.id}>
            <NavLink
              to={`/messages/${c.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl p-3 transition-colors ${isActive ? 'bg-ink-800 ring-1 ring-ink-700' : 'hover:bg-ink-850'}`
              }
            >
              <Avatar user={c.other} size="md" online={c.other ? isOnline(c.other.id) : undefined} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate font-semibold ${c.unread ? 'text-ink-50' : 'text-ink-100'}`}>{c.other?.name || 'Deleted user'}</p>
                  {c.lastMessage && <span className="shrink-0 text-[11px] text-ink-500">{timeAgo(c.lastMessage.createdAt)}</span>}
                </div>
                <p className="truncate text-xs">
                  {c.item ? (
                    <span className={TYPE[c.item.type].accent}>{TYPE[c.item.type].label}: {c.item.title}</span>
                  ) : (
                    <span className="text-ink-500">Report deleted</span>
                  )}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${c.unread ? 'font-medium text-ink-100' : 'text-ink-400'}`}>
                    {c.lastMessage ? `${mine ? 'You: ' : ''}${c.lastMessage.text}` : 'No messages yet - say hi 👋'}
                  </p>
                  {c.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-zap px-1.5 text-[11px] font-bold text-night">
                      {c.unread > 99 ? '99+' : c.unread}
                    </span>
                  )}
                </div>
              </div>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}
