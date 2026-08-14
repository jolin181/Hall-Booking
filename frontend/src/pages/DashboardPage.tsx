import { useState, useEffect, useCallback } from 'react';
import {
  Users, MapPin, Clock, Calendar, Search,
  CheckCircle2, Plus, Loader2, RefreshCw,
  Building2,
} from 'lucide-react';
import * as api from '../api';
import type { Hall } from '../types';
import { useWebSocket } from '../contexts/WebSocketContext';
import { format, addYears } from 'date-fns';
import toast from 'react-hot-toast';
import BookingModal from '../components/BookingModal';
import BookedHallModal from '../components/BookedHallModal';
import HallBookingsModal from '../components/HallBookingsModal';

export default function DashboardPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookedOnly, setShowBookedOnly] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addYears(new Date(), 1), 'yyyy-MM-dd');
  
  const [filterDate, setFilterDate] = useState(today);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  
  const [availableHalls, setAvailableHalls] = useState<Hall[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ hall: Hall } | null>(null);
  const [bookedHallModal, setBookedHallModal] = useState<{ hall: Hall; booking: any } | null>(null);
  const [hallBookingsModal, setHallBookingsModal] = useState<{ hall: Hall } | null>(null);
  
  const { lastBookingUpdate } = useWebSocket();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const hallsRes = await api.getAllHalls();
      setHalls(hallsRes.data);
    } catch {
      toast.error('Failed to load hall data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastBookingUpdate) {
      const updateHallList = (list: Hall[]) => 
        list.map(hall => {
          if (hall.id === lastBookingUpdate.hall.id) {
            // If the booking is active and it's for today, it might be the new active booking
            // (For simplicity in this demo, if the event matches today, we update it)
            if (lastBookingUpdate.status === 'ACTIVE' && lastBookingUpdate.eventDate === today) {
              return { ...hall, activeBooking: lastBookingUpdate };
            }
            if (lastBookingUpdate.status === 'CANCELLED' && hall.activeBooking?.id === lastBookingUpdate.id) {
              return { ...hall, activeBooking: undefined };
            }
          }
          return hall;
        });

      setHalls(prev => updateHallList(prev));
      if (availableHalls) {
        setAvailableHalls(prev => prev ? updateHallList(prev) : null);
      }
    }
  }, [lastBookingUpdate, today]);

  const searchAvailability = async () => {
    if (!filterDate || !filterStart || !filterEnd) {
      toast.error('Please set date, start time, and end time to search.');
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.getAvailableHalls({
        capacity: filterCapacity ? parseInt(filterCapacity) : 1,
        date: filterDate,
        start: filterStart,
        end: filterEnd,
      });
      setAvailableHalls(res.data);
    } catch {
      toast.error('Availability search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setAvailableHalls(null);
    setFilterStart('');
    setFilterEnd('');
    setFilterCapacity('');
  };

  const getHallStatus = (hall: Hall) => {
    const booking = hall.activeBooking;
    if (!booking) return { status: 'free', booking: null };
    
    const nowTime = format(new Date(), 'HH:mm:ss');
    if (booking.startTime <= nowTime && booking.endTime > nowTime) {
      return { status: 'booked', booking };
    }
    return { status: 'upcoming', booking };
  };

  const displayHalls = availableHalls ?? halls;
  const filteredHalls = showBookedOnly
    ? displayHalls.filter((h) => {
        const s = getHallStatus(h);
        return s.status === 'booked' || s.status === 'upcoming';
      })
    : displayHalls;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book a Hall</h1>
          <p className="text-slate-500 font-medium mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy')} · {halls.length} halls available
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary gap-2 hover:bg-white">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>

      {/* Filter Bar (BookMyShow Style Chips) */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-surface-border">
        <div className="flex items-center bg-white rounded-full border border-surface-border px-4 py-2 shadow-sm focus-within:border-brand-500 transition-colors">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="date"
            min={today}
            max={maxDate}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none w-32"
          />
        </div>
        
        <div className="flex items-center bg-white rounded-full border border-surface-border px-4 py-2 shadow-sm focus-within:border-brand-500 transition-colors">
          <Clock className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="time"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none w-24"
          />
          <span className="text-slate-400 mx-1">-</span>
          <input
            type="time"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none w-24"
          />
        </div>

        <div className="flex items-center bg-white rounded-full border border-surface-border px-4 py-2 shadow-sm focus-within:border-brand-500 transition-colors">
          <Users className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="number"
            min={1}
            value={filterCapacity}
            onChange={(e) => setFilterCapacity(e.target.value)}
            placeholder="Seats"
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none w-16 placeholder-slate-400"
          />
        </div>

        <button
          onClick={searchAvailability}
          disabled={searchLoading}
          className="rounded-full px-5 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20 disabled:opacity-50"
        >
          {searchLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : <Search className="w-4 h-4 inline mr-1" />}
          Search
        </button>

        {availableHalls && (
          <button onClick={clearSearch} className="rounded-full px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 pl-4">
          <button
            onClick={() => setShowBookedOnly(!showBookedOnly)}
            className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
              showBookedOnly 
                ? 'bg-brand-50 text-brand-600 border-brand-200' 
                : 'bg-white text-slate-600 border-surface-border hover:bg-slate-50'
            }`}
          >
            Show booked only
          </button>
        </div>
      </div>

      {availableHalls && (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 w-fit">
          <CheckCircle2 className="w-4 h-4" />
          Showing {availableHalls.length} available hall{availableHalls.length !== 1 ? 's' : ''} for your criteria
        </div>
      )}

      {/* Hall Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredHalls.map((hall) => {
          const { status, booking } = getHallStatus(hall);
          const isAvailableSearch = availableHalls?.some((h) => h.id === hall.id);

          return (
            <div
              key={hall.id}
              className={`hall-card flex flex-col group ${
                status === 'free' ? 'hall-card-free' :
                status === 'upcoming' ? 'border-amber-200 hover:shadow-amber-500/10' :
                'hall-card-booked'
              }`}
            >
              {/* Poster Image / Banner */}
              <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden flex items-center justify-center border-b border-surface-border">
                {hall.imageUrl ? (
                  <img src={hall.imageUrl} alt={hall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                )}
                
                {/* Status Badge top right (BookMyShow style) */}
                <div className="absolute top-3 right-3">
                  {status === 'free' && <span className="badge-free shadow-sm border-white bg-white/90 backdrop-blur-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Available</span>}
                  {status === 'upcoming' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-amber-600 border border-white shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Upcoming
                    </span>
                  )}
                  {status === 'booked' && <span className="badge-booked shadow-sm border-white bg-white/90 backdrop-blur-sm"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />Booked</span>}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-brand-600 transition-colors line-clamp-1">{hall.name}</h3>

                <div className="mt-2.5 flex items-center gap-4 text-slate-500 text-xs font-semibold">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {hall.capacity} Seats
                  </div>
                  {hall.location && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5" />
                      {hall.location}
                    </div>
                  )}
                </div>

                {booking && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 bg-slate-50 -mx-5 px-5 pb-3">
                    <p className="text-sm text-slate-800 font-bold truncate">{booking.title}</p>
                    <p className="text-xs text-slate-500 font-semibold">
                      {booking.startTime.slice(0,5)} – {booking.endTime.slice(0,5)}
                    </p>
                    <p className="text-xs text-brand-600 font-semibold pt-1">Booked by {booking.bookedBy.name}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col justify-end gap-2">
                  {status === 'free' ? (
                    <>
                      <button
                        onClick={() => setBookingModal({ hall })}
                        className="w-full py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors"
                      >
                        Book Now
                      </button>
                      <button
                        onClick={() => setHallBookingsModal({ hall })}
                        className="w-full py-2 text-sm font-bold text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
                      >
                        Show Bookings
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setHallBookingsModal({ hall })}
                      className="w-full py-2.5 text-sm font-bold text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
                    >
                      Show Bookings
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredHalls.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-slate-500 text-lg font-bold tracking-tight">No halls found</p>
            {availableHalls && (
              <button onClick={clearSearch} className="mt-3 text-brand-600 font-semibold hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {bookingModal && (
        <BookingModal
          hall={bookingModal.hall}
          defaultDate={filterDate}
          defaultStart={filterStart}
          defaultEnd={filterEnd}
          onClose={() => setBookingModal(null)}
          onSuccess={() => {
            setBookingModal(null);
            loadData();
          }}
        />
      )}

      {bookedHallModal && (
        <BookedHallModal
          hall={bookedHallModal.hall}
          booking={bookedHallModal.booking}
          onClose={() => setBookedHallModal(null)}
          onRefresh={loadData}
        />
      )}

      {hallBookingsModal && (
        <HallBookingsModal
          hall={hallBookingsModal.hall}
          onClose={() => setHallBookingsModal(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
