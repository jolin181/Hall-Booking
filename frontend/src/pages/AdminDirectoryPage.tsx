import { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Loader2, CalendarCheck, Clock } from 'lucide-react';
import * as api from '../api';
import type { User, Booking } from '../types';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function AdminDirectoryPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastBookingUpdate } = useWebSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, bookingsRes] = await Promise.all([
        api.getAllUsers(),
        api.getAllBookings(),
      ]);
      setAdmins(adminsRes.data.filter((u: User) => u.role === 'ADMIN'));
      setBookings(bookingsRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (lastBookingUpdate) {
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === lastBookingUpdate.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = lastBookingUpdate;
          return updated;
        }
        return [lastBookingUpdate, ...prev];
      });
    }
  }, [lastBookingUpdate]);

  const getActiveBookingsForAdmin = (adminId: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return bookings.filter(
      (b) => b.bookedBy.id === adminId && b.status === 'ACTIVE' && b.eventDate >= today
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Directory</h1>
        <p className="text-slate-500 font-medium mt-1">{admins.length} admins in the system</p>
      </div>

      {admins.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center bg-white border-dashed border-slate-300">
          <Users className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold text-lg">No admins yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {admins.map((admin) => {
            const activeBookings = getActiveBookingsForAdmin(admin.id);
            return (
              <div key={admin.id} className="card bg-white border-slate-200 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/10 transition-all">
                {/* Admin header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl shadow-sm border border-brand-100">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{admin.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{admin.email}</p>
                  </div>
                </div>

                {/* Bookings */}
                <div className="pt-4 border-t border-slate-100">
                  {activeBookings.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium italic">No upcoming bookings</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Upcoming / Active ({activeBookings.length})
                      </p>
                      {activeBookings.slice(0, 3).map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-brand-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-900 font-bold truncate">{b.hall.name}</p>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                              <CalendarCheck className="w-3.5 h-3.5 text-brand-400" />
                              {format(new Date(b.eventDate), 'dd MMM')} · {b.startTime.slice(0,5)} – {b.endTime.slice(0,5)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activeBookings.length > 3 && (
                        <p className="text-xs font-semibold text-slate-500 pl-2">+{activeBookings.length - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
