import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(expenseId) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (!expenseId) return;
    const token = localStorage.getItem('access_token');
    let wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

    // Auto-correct http/https to ws/wss in case of configuration typos
    if (wsBase.startsWith('https://')) {
      wsBase = wsBase.replace('https://', 'wss://');
    } else if (wsBase.startsWith('http://')) {
      wsBase = wsBase.replace('http://', 'ws://');
    }

    const url = `${wsBase}/ws/expense/${expenseId}/?token=${token}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        if (wsRef.current) wsRef.current.close();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setMessages((prev) => [...prev, msg]);
        } catch {}
      };
    } catch (err) {
      console.error('WebSocket connection failed to initialize:', err);
      setConnected(false);
      // Try reconnecting after 3s
      setTimeout(connect, 3000);
    }
  }, [expenseId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  return { messages, connected, sendMessage, setMessages };
}
