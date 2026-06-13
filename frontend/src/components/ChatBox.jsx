import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getMessages } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatCurrency';

export default function ChatBox({ expenseId }) {
  const { user } = useAuth();
  const { messages: wsMessages, connected, sendMessage, setMessages } = useWebSocket(expenseId);
  const [input, setInput] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!expenseId) return;
    getMessages(expenseId)
      .then((res) => {
        const history = res.data.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          created_at: m.created_at,
        }));
        setMessages(history);
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [expenseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [wsMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    sendMessage(input.trim());
    setInput('');
  };

  const allMessages = wsMessages;

  return (
    <div className="card flex flex-col h-96">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 text-sm">Expense Chat</h3>
        <span className={`text-xs flex items-center gap-1 ${connected ? 'text-brand-600' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-brand-500' : 'bg-slate-300'}`}></span>
          {connected ? 'live' : 'connecting…'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!historyLoaded && (
          <p className="text-xs text-slate-400 text-center">Loading messages…</p>
        )}
        {historyLoaded && allMessages.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-8">No messages yet. Start the conversation!</p>
        )}
        {allMessages.map((msg, i) => {
          const isMe = msg.sender?.id === user?.id;
          return (
            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && (
                  <span className="text-xs text-slate-500 mb-1 ml-1">{msg.sender?.name}</span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${isMe
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400 mt-1 mx-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  }) : ''}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 pb-4 pt-2 border-t border-slate-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="input flex-1 text-sm"
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="btn-primary text-sm px-4"
        >
          Send
        </button>
      </form>
    </div>
  );
}
