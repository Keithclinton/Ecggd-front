import { useEffect, useState } from 'react';
import { messages, notifications } from '../lib/api';
import RequireAuth from '../components/RequireAuth';

interface Message {
  id: number;
  sender: string;
  content: string;
  created_at: string;
}

interface Notification {
  id: number;
  content: string;
  created_at: string;
}

export default function MessagingPage() {
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      messages.list().then((res: { data: Message[] }) => setMessageList(res.data)),
      notifications.list().then((res: { data: Notification[] }) => setNotificationList(res.data))
    ]).finally(() => setLoading(false));
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage) return;
    setSending(true);
    await messages.send({ content: newMessage });
    setNewMessage('');
    messages.list().then((res: { data: Message[] }) => setMessageList(res.data));
    setSending(false);
  };

  return (
    <RequireAuth>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Messages & Notifications</h1>
        {loading && <div>Loading...</div>}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Notifications</h2>
          <ul>
            {notificationList.map(n => (
              <li key={n.id} className="mb-2 border rounded p-2">
                <div>{n.content}</div>
                <div className="text-xs text-gray-500">{n.created_at}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Messages</h2>
          <ul>
            {messageList.map(m => (
              <li key={m.id} className="mb-2 border rounded p-2">
                <div><strong>{m.sender}:</strong> {m.content}</div>
                <div className="text-xs text-gray-500">{m.created_at}</div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <textarea
              className="w-full border rounded p-2 mb-2"
              rows={2}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white"
              onClick={handleSendMessage}
              disabled={sending || !newMessage}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
