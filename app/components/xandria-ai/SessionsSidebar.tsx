interface Session {
  session_id: string;
  last_updated: string;
  message_count: number;
  summary?: string;
}

interface SessionsSidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  darkMode: boolean;
}

const SessionsSidebar = ({ sessions, currentSessionId, onSelectSession, darkMode, onClose}: SessionsSidebarProps) => {
  const cardClass = darkMode 
    ? 'bg-[#111827] bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <>
    <div 
      className="fixed inset-0 z-[9] bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className={`${cardClass} border-r ${borderClass} absolute lg:left-64 top-20 bottom-0 w-64 p-4 overflow-y-auto z-10 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`font-semibold ${textClass}`}>Your Conversations</h2>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg ${hoverClass} transition-colors`}
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        {sessions.map((session) => (
          <button
            key={session.session_id}
            onClick={() => onSelectSession(session.session_id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${hoverClass} ${
              session.session_id === currentSessionId ? 'bg-purple-600/15 border border-purple-500/30' : ''
            }`}
          >
            <div className={`text-sm font-medium truncate ${textClass} mb-1`}>
              {session.summary || `Conversation ${session.session_id.slice(0, 8)}...`}
            </div>
            <div className={`text-xs ${mutedClass} flex items-center gap-2`}>
              <span>{session.message_count} message{session.message_count !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{new Date(session.last_updated).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
        {sessions.length === 0 && (
          <p className={`${mutedClass} text-sm text-center py-8`}>
            No previous conversations
          </p>
        )}
      </div>
    </div>
    </>
  );
};

export default SessionsSidebar;