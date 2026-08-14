import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Building2, Clock, Loader2, Calendar } from 'lucide-react';
import * as api from '../api';
import type { Booking } from '../types';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastBookingUpdate } = useWebSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMyBookings();
      setBookings(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep list fresh if a booking update arrives (e.g. SuperAdmin cancels yours)
  useEffect(() => {
    if (lastBookingUpdate) {
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === lastBookingUpdate.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = lastBookingUpdate;
          return updated;
        }
        return prev;
      });
    }
  }, [lastBookingUpdate]);

  const active = bookings.filter((b) => b.status === 'ACTIVE');
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tickets</h1>
        <p className="text-slate-500 font-medium mt-1">{active.length} active · {cancelled.length} cancelled</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center bg-white border-dashed">
          <CalendarCheck className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-900 font-bold text-lg">No tickets yet.</p>
          <p className="text-slate-500 mt-1">Book a hall to see your tickets here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Active */}
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}

          {/* Cancelled */}
          {cancelled.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const isActive = b.status === 'ACTIVE';

  return (
    <div className={`relative flex flex-col bg-white rounded-2xl border ${isActive ? 'border-brand-200 shadow-xl shadow-brand-500/10' : 'border-slate-200 shadow-md opacity-75'}`}>
      {/* Top half - Hall info */}
      <div className="p-6 pb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isActive ? 'bg-brand-50' : 'bg-slate-100'}`}>
            <Building2 className={`w-6 h-6 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
          </div>
          <div className="text-right">
            {isActive 
              ? <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white tracking-wide uppercase shadow-sm">Confirmed</span>
              : <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 tracking-wide uppercase shadow-sm">Cancelled</span>}
          </div>
        </div>
        <h3 className="font-extrabold text-slate-900 text-xl leading-tight">{b.title}</h3>
        <p className="text-sm font-semibold text-slate-500 mt-1">{b.hall.name}</p>
      </div>

      {/* Ticket Divider */}
      <div className="relative h-px flex items-center">
        <div className="absolute -left-3 w-6 h-6 bg-surface rounded-full border-r border-slate-200"></div>
        <div className="w-full border-t-2 border-dashed border-slate-200"></div>
        <div className="absolute -right-3 w-6 h-6 bg-surface rounded-full border-l border-slate-200"></div>
      </div>

      {/* Bottom half - Date/Time info */}
      <div className={`p-6 pt-8 rounded-b-2xl ${isActive ? 'bg-brand-50/50' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" />
              {format(new Date(b.eventDate), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
            <p className="text-sm font-bold text-slate-900 flex items-center justify-end gap-1.5">
              <Clock className="w-4 h-4 text-brand-500" />
              {b.startTime.slice(0,5)} – {b.endTime.slice(0,5)}
            </p>
          </div>
        </div>
        {b.cancelledBy && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-red-500 text-center">
              Cancelled by {b.cancelledBy.name} on {format(new Date(b.cancelledAt!), 'dd MMM')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
