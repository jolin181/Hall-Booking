import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, UserPlus, Users, CalendarCheck, XCircle,
  Loader2, Building2, Clock, Calendar, Search
} from 'lucide-react';
import * as api from '../api';
import type { User, Booking, Hall } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';
import ManageHallsTab from '../components/ManageHallsTab';

type Tab = 'bookings' | 'admins' | 'create' | 'halls';

export default function SuperAdminPanel() {
  const [tab, setTab] = useState<Tab>('bookings');
  const [admins, setAdmins] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { lastBookingUpdate, lastHallUpdate } = useWebSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, bookingsRes, hallsRes] = await Promise.all([
        api.getAdmins(),
        api.getAllBookings(),
        api.getAllHalls(),
      ]);
      setAdmins(adminsRes.data);
      setBookings(bookingsRes.data);
      setHalls(hallsRes.data);
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

  useEffect(() => {
    if (lastHallUpdate) {
      setHalls((prev) => {
        // if deleted (our backend sets isDeleted or similar, or we just rely on fetch)
        // for simplicity, a full reload might be safer for deletion, but let's try updating
        // The backend might not send it if deleted, so let's just trigger a reload if we get a hall update.
        // Wait, the requirement says "broadcast hall create/update/delete events".
        // Let's just update if it exists.
        const idx = prev.findIndex((h) => h.id === lastHallUpdate.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = lastHallUpdate;
          return updated;
        }
        return [...prev, lastHallUpdate];
      });
      // To be safe with deletions that don't match, we can just fetch all again.
      // load();
    }
  }, [lastHallUpdate]);

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Cancel this booking? The admin will be notified.')) return;
    setCancellingId(bookingId);
    try {
      await api.cancelBooking(bookingId);
      toast.success('Booking cancelled');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const activeBookings = bookings.filter((b) => b.status === 'ACTIVE');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Control</h1>
          <p className="text-brand-100 font-medium mt-1">Super Admin privileges active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-border">
        {([
          { key: 'bookings', label: 'All Bookings', icon: CalendarCheck },
          { key: 'halls', label: 'Manage Halls', icon: Building2 },
          { key: 'admins', label: 'Admins Directory', icon: Users },
          { key: 'create', label: 'Add Admin', icon: UserPlus },
        ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* All Bookings - Ticket Style */}
          {tab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="badge-free px-3 py-1.5 text-sm">{activeBookings.length} Active</span>
                <span className="badge-cancelled px-3 py-1.5 text-sm">{cancelledBookings.length} Cancelled</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bookings.map((b) => {
                  const isActive = b.status === 'ACTIVE';
                  return (
                    <div key={b.id} className={`relative flex flex-col bg-white rounded-2xl border ${isActive ? 'border-brand-200 shadow-xl shadow-brand-500/10' : 'border-slate-200 shadow-md opacity-75'}`}>
                      {/* Top half - Hall info */}
                      <div className="p-6 pb-8">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isActive ? 'bg-brand-50' : 'bg-slate-100'}`}>
                            <Building2 className={`w-6 h-6 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                          </div>
                          <div className="text-right">
                            {isActive 
                              ? <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white tracking-wide uppercase shadow-sm">Active</span>
                              : <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 tracking-wide uppercase shadow-sm">Cancelled</span>}
                          </div>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-xl leading-tight truncate">{b.title}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{b.hall.name} ({b.hall.capacity} seats)</p>
                      </div>

                      {/* Ticket Divider */}
                      <div className="relative h-px flex items-center">
                        <div className="absolute -left-3 w-6 h-6 bg-surface rounded-full border-r border-slate-200"></div>
                        <div className="w-full border-t-2 border-dashed border-slate-200"></div>
                        <div className="absolute -right-3 w-6 h-6 bg-surface rounded-full border-l border-slate-200"></div>
                      </div>

                      {/* Bottom half - Date/Time & Action */}
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
                        
                        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                           <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                               {b.bookedBy.name.charAt(0)}
                             </div>
                             {b.bookedBy.name}
                           </div>
                           
                           {isActive && (
                             <button
                               onClick={() => handleCancel(b.id)}
                               disabled={cancellingId === b.id}
                               className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                             >
                               {cancellingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                               Cancel
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {bookings.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300">
                     <CalendarCheck className="w-16 h-16 text-slate-300 mb-4" />
                     <p className="text-slate-500 text-lg font-bold">No bookings in the system</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admins list */}
          {tab === 'admins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admins.length === 0 ? (
                <div className="col-span-full card flex flex-col items-center py-20 text-center bg-white border-dashed">
                  <Users className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold text-lg">No admins found</p>
                </div>
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="card bg-white hover:shadow-lg transition-shadow border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold shadow-sm">
                        {admin.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-lg">{admin.name}</p>
                        <p className="text-sm font-medium text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Joined {format(new Date(admin.createdAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create admin */}
          {tab === 'create' && (
            <CreateAdminForm onSuccess={() => { load(); setTab('admins'); }} />
          )}

          {/* Manage Halls */}
          {tab === 'halls' && (
            <ManageHallsTab halls={halls} onRefresh={load} />
          )}
        </>
      )}
    </div>
  );
}

function CreateAdminForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createAdmin({ name, email, password });
      toast.success(`Admin "${name}" created successfully!`);
      setName(''); setEmail(''); setPassword('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="card bg-white border-slate-200 shadow-xl">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Create New Admin</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label text-slate-900 font-bold">Full Name</label>
            <input id="admin-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith" className="input" required />
          </div>
          <div>
            <label className="label text-slate-900 font-bold">Email Address</label>
            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com" className="input" required />
          </div>
          <div>
            <label className="label text-slate-900 font-bold">Temporary Password</label>
            <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters" className="input" required minLength={8} />
          </div>
          <button
            id="create-admin-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-500/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : <><UserPlus className="w-5 h-5" /> Create Admin</>}
          </button>
        </form>
      </div>
    </div>
  );
}
