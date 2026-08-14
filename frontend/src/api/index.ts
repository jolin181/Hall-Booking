import api from './axios';
import type {
  AuthResponse,
  Booking,
  BookingRequest,
  CreateAdminRequest,
  Hall,
  Notification,
  User,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { email, password });

export const getMe = () =>
  api.get<User>('/api/auth/me');

// ── Halls ─────────────────────────────────────────────────────────────────────
export const getAllHalls = () =>
  api.get<Hall[]>('/api/halls');

export const getAvailableHalls = (params: {
  capacity: number;
  date: string;
  start: string;
  end: string;
}) => api.get<Hall[]>('/api/halls/available', { params });

export const createHall = (data: Omit<Hall, 'id' | 'activeBooking'>) =>
  api.post<Hall>('/api/halls', data);

export const updateHall = (id: number, data: Omit<Hall, 'id' | 'activeBooking'>) =>
  api.put<Hall>(`/api/halls/${id}`, data);

export const deleteHall = (id: number) =>
  api.delete(`/api/halls/${id}`);

// ── Bookings ──────────────────────────────────────────────────────────────────
export const createBooking = (data: BookingRequest) =>
  api.post<Booking>('/api/bookings', data);

export const getAllBookings = () =>
  api.get<Booking[]>('/api/bookings');

export const getMyBookings = () =>
  api.get<Booking[]>('/api/bookings/my');

export const cancelBooking = (id: number) =>
  api.post<Booking>(`/api/bookings/${id}/cancel`);

export const getHallBookings = (hallId: number, date?: string) =>
  api.get<Booking[]>(`/api/bookings/hall/${hallId}${date ? `?date=${date}` : ''}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const createAdmin = (data: CreateAdminRequest) =>
  api.post<User>('/api/admin/create-admin', data);

export const getAdmins = () =>
  api.get<User[]>('/api/admin/admins');

export const getAllUsers = () =>
  api.get<User[]>('/api/admin/users');

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () =>
  api.get<Notification[]>('/api/notifications');

export const getUnreadCount = () =>
  api.get<{ count: number }>('/api/notifications/unread-count');

export const markNotificationRead = (id: number) =>
  api.post<Notification>(`/api/notifications/${id}/read`);

// ── Health ────────────────────────────────────────────────────────────────────
export const health = () =>
  api.get('/api/health');

// ── Chatbot ───────────────────────────────────────────────────────────────────
export const sendChatbotQuery = (message: string) =>
  api.post<{ response: string }>('/api/chatbot/query', { message });
