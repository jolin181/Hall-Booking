import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Booking, Hall, Notification } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: boolean;
  lastBookingUpdate: Booking | null;
  lastHallUpdate: Hall | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastBookingUpdate: null,
  lastHallUpdate: null,
});

export function WebSocketProvider({
  children,
  onBookingUpdate,
  onNotification,
}: {
  children: React.ReactNode;
  onBookingUpdate?: (booking: Booking) => void;
  onNotification?: (notification: Notification) => void;
}) {
  const { token, user, isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastBookingUpdate, setLastBookingUpdate] = useState<Booking | null>(null);
  const [lastHallUpdate, setLastHallUpdate] = useState<Hall | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        // Subscribe to global booking updates
        client.subscribe('/topic/bookings', (message) => {
          const booking: Booking = JSON.parse(message.body);
          setLastBookingUpdate(booking);
          onBookingUpdate?.(booking);
        });

        // Subscribe to global hall updates
        client.subscribe('/topic/halls', (message) => {
          const hall: Hall = JSON.parse(message.body);
          setLastHallUpdate(hall);
        });

        // Subscribe to user-specific notifications
        if (user?.email) {
          client.subscribe(`/user/queue/notifications`, (message) => {
            const notification: Notification = JSON.parse(message.body);
            onNotification?.(notification);
            toast(notification.message, {
              icon: '🔔',
              duration: 6000,
              style: {
                background: '#312e81',
                border: '1px solid #4f46e5',
                color: '#e0e7ff',
              },
            });
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, user?.email]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastBookingUpdate, lastHallUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
