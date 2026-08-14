import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Users, Calendar as CalendarIcon, Clock, Loader2, User as UserIcon } from 'lucide-react';
import type { Hall, Booking } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';

interface Props {
  hall: Hall;
  onClose: () => void;
  onRefresh: () => void;
}

export default function HallBookingsModal({ hall, onClose, onRefresh }: Props) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, [hall.id]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getHallBookings(hall.id);
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      await api.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      await loadBookings();
      onRefresh();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to cancel booking';
      toast.error(errorMsg);
    } finally {
      setCancellingId(null);
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 text-white p-6 sm:rounded-t-2xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight line-clamp-1">{hall.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md text-xs">
                  <Users className="w-3.5 h-3.5" /> {hall.capacity} Seats
                </span>
                {hall.location && (
                  <span className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {hall.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">No bookings found for this hall</p>
              <p className="text-slate-400 text-sm mt-1">This hall is available for booking</p>
            </div>
          ) : (
            <>
              {/* Active Bookings */}
              {activeBookings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Active Bookings ({activeBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {activeBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        currentUserId={user?.id}
                        onCancel={handleCancel}
                        cancelling={cancellingId === booking.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled Bookings */}
              {cancelledBookings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Cancelled Bookings ({cancelledBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {cancelledBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        currentUserId={user?.id}
                        onCancel={handleCancel}
                        cancelling={cancellingId === booking.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  currentUserId?: number;
  onCancel: (id: number) => void;
  cancelling: boolean;
}

function BookingCard({ booking, currentUserId, onCancel, cancelling }: BookingCardProps) {
  const isActive = booking.status === 'ACTIVE';
  const isOwner = currentUserId === booking.bookedBy.id;

  return (
    <div className={`relative bg-white rounded-xl border p-4 ${
      isActive ? 'border-brand-200 shadow-md' : 'border-slate-200 opacity-60'
    }`}>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 pr-20">
        <div>
          <h4 className="text-base font-bold text-slate-900">{booking.title}</h4>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <UserIcon className="w-3.5 h-3.5" />
            <span className="font-semibold">Booked by {booking.bookedBy.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" /> Date
            </p>
            <p className="text-sm font-bold text-slate-900">
              {format(new Date(booking.eventDate), 'dd MMM yyyy')}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time
            </p>
            <p className="text-sm font-bold text-slate-900">
              {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
            </p>
          </div>
        </div>

        {booking.cancelledBy && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-red-500">
              Cancelled by {booking.cancelledBy.name} on {format(new Date(booking.cancelledAt!), 'dd MMM yyyy')}
            </p>
          </div>
        )}

        {/* Cancel Button - Only for owner's active bookings */}
        {isActive && isOwner && (
          <div className="pt-2">
            <button
              onClick={() => onCancel(booking.id)}
              disabled={cancelling}
              className="w-full py-2 rounded-lg text-red-600 font-bold text-sm bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel My Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
