import { useState } from 'react';
import { X, Loader2, Calendar as CalendarIcon, Clock, FileText, Building2, MapPin, Users } from 'lucide-react';
import type { Hall } from '../types';
import * as api from '../api';
import toast from 'react-hot-toast';
import { format, addDays, addYears, isSameDay, parseISO } from 'date-fns';

interface Props {
  hall: Hall;
  defaultDate?: string;
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({
  hall,
  defaultDate = '',
  defaultStart = '',
  defaultEnd = '',
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState('');
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const maxDate = format(addYears(today, 1), 'yyyy-MM-dd');

  // Validate defaultDate
  let initialDate = defaultDate || todayStr;
  if (initialDate < todayStr) initialDate = todayStr;
  if (initialDate > maxDate) initialDate = maxDate;

  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);

  // Generate next 14 days for the date strip
  const dateStrip = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  // Check if selected date and time is in the past
  const isTimeInPast = () => {
    if (!date || !start) return false;

    // Only validate if booking for today
    if (date === todayStr) {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      return start <= currentTime;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please enter an event title'); return; }
    if (!date) { toast.error('Please select a date'); return; }
    if (!start || !end) { toast.error('Please set start and end times'); return; }
    if (start >= end) { toast.error('Start time must be before end time'); return; }

    // Validate time is not in the past
    if (isTimeInPast()) {
      toast.error('Cannot book a hall for past time. Please select a future time.');
      return;
    }

    setLoading(true);
    try {
      await api.createBooking({
        hallId: hall.id,
        title: title.trim(),
        eventDate: date,
        startTime: start + ':00',
        endTime: end + ':00',
      });
      toast.success(`"${hall.name}" booked successfully!`);
      onSuccess();
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || 'Failed to create booking';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header - Movie Info Style */}
        <div className="relative overflow-hidden bg-slate-900 text-white p-6 sm:rounded-t-2xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-start gap-4 pr-10">
            <div className="w-16 h-16 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{hall.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                  <Users className="w-4 h-4" /> {hall.capacity} Seats
                </span>
                {hall.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" /> {hall.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Date Strip */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-brand-500" /> Select Date
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 snap-x hide-scrollbar">
              {dateStrip.map((d) => {
                const dStr = format(d, 'yyyy-MM-dd');
                const isSelected = date === dStr;
                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setDate(dStr)}
                    className={`snap-start shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold uppercase ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                      {format(d, 'MMM')}
                    </span>
                    <span className="text-lg font-bold leading-none mt-1">
                      {format(d, 'dd')}
                    </span>
                  </button>
                );
              })}
              
              <div className="shrink-0 flex items-center justify-center h-16 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 relative overflow-hidden group hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold group-hover:text-brand-600">More Dates</span>
                <input
                  type="date"
                  min={todayStr}
                  max={maxDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            {date > maxDate && (
              <p className="text-red-500 text-xs font-semibold">Cannot book more than 1 year in advance.</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Select Time
            </label>
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Start Time</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  min={date === todayStr ? format(new Date(), 'HH:mm') : undefined}
                  className="w-full bg-transparent border-none text-lg font-bold text-slate-900 focus:outline-none p-0"
                  required
                />
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">End Time</label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-transparent border-none text-lg font-bold text-slate-900 focus:outline-none p-0"
                  required
                />
              </div>
            </div>
            {isTimeInPast() && (
              <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
                ⚠️ Cannot book for past time. Please select a future time.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" /> Event Details
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quarterly Review Meeting"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-slate-100 sm:rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleSubmit}
            disabled={loading || !date || !start || !end || !title.trim() || date > maxDate || isTimeInPast()}
            className="w-full py-4 rounded-xl text-white font-bold text-lg bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-brand-500/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Book Now'}
          </button>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
