import { X, Building2, MapPin, Users, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import type { Hall, Booking } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Props {
  hall: Hall;
  booking: Booking;
  onClose: () => void;
  onRefresh: () => void;
}

export default function BookedHallModal({ hall, booking, onClose, onRefresh }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Can only cancel own bookings
  const canCancel = user?.id === booking.bookedBy.id;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setLoading(true);
    try {
      await api.cancelBooking(booking.id);
      toast.success('Booking cancelled successfully');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        
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
        <div className="p-6 space-y-6">
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100">
             <div className="w-10 h-10 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center font-bold shadow-inner">
               {booking.bookedBy.name.charAt(0).toUpperCase()}
             </div>
             <div>
               <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Booked By</p>
               <p className="text-sm font-bold text-slate-900">{booking.bookedBy.name}</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Event Title</p>
              <p className="text-base font-bold text-slate-900">{booking.title}</p>
            </div>
            
            <div className="flex items-center justify-between py-3 border-y border-slate-100">
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
                   {booking.startTime.slice(0,5)} – {booking.endTime.slice(0,5)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        {canCancel && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 sm:rounded-b-2xl">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-3 rounded-xl text-red-600 font-bold text-sm bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
