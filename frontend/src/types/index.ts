// Shared TypeScript types matching the backend DTOs

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN';
  createdAt: string;
}

export interface Hall {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  description?: string;
  imageUrl?: string;
  activeBooking?: Booking;
}

export interface Booking {
  id: number;
  hall: Hall;
  bookedBy: User;
  title: string;
  eventDate: string;    // ISO date string
  startTime: string;    // HH:mm:ss
  endTime: string;      // HH:mm:ss
  status: 'ACTIVE' | 'CANCELLED';
  cancelledBy?: User;
  cancelledAt?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  message: string;
  relatedBookingId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BookingRequest {
  hallId: number;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}
