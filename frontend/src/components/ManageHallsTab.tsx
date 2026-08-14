import { useState } from 'react';
import { Building2, Edit2, Trash2, Loader2, Plus, X } from 'lucide-react';
import * as api from '../api';
import type { Hall } from '../types';
import toast from 'react-hot-toast';

interface ManageHallsTabProps {
  halls: Hall[];
  onRefresh: () => void;
}

export default function ManageHallsTab({ halls, onRefresh }: ManageHallsTabProps) {
  const [editingHall, setEditingHall] = useState<Partial<Hall> | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hall? This action cannot be undone if there are no active bookings.')) return;
    setDeletingId(id);
    try {
      await api.deleteHall(id);
      toast.success('Hall deleted successfully');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Cannot delete hall with active bookings');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { id, activeBooking, ...data } = editingHall as Hall;
      if (id) {
        await api.updateHall(id, data);
        toast.success('Hall updated successfully');
      } else {
        await api.createHall(data);
        toast.success('Hall created successfully');
      }
      setEditingHall(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save hall');
    } finally {
      setLoading(false);
    }
  };

  if (editingHall) {
    return (
      <div className="card bg-white border-slate-200 shadow-xl max-w-2xl mx-auto mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">
            {editingHall.id ? 'Edit Hall' : 'Add New Hall'}
          </h2>
          <button onClick={() => setEditingHall(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label text-slate-900 font-bold">Hall Name</label>
              <input type="text" value={editingHall.name || ''} onChange={(e) => setEditingHall({...editingHall, name: e.target.value})}
                placeholder="e.g. Sapphire Room" className="input" required />
            </div>
            <div>
              <label className="label text-slate-900 font-bold">Capacity</label>
              <input type="number" min="1" value={editingHall.capacity || ''} onChange={(e) => setEditingHall({...editingHall, capacity: parseInt(e.target.value)})}
                placeholder="Number of seats" className="input" required />
            </div>
            <div className="md:col-span-2">
              <label className="label text-slate-900 font-bold">Location (Optional)</label>
              <input type="text" value={editingHall.location || ''} onChange={(e) => setEditingHall({...editingHall, location: e.target.value})}
                placeholder="e.g. Ground Floor, Block A" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label text-slate-900 font-bold">Image URL (Optional)</label>
              <input type="url" value={editingHall.imageUrl || ''} onChange={(e) => setEditingHall({...editingHall, imageUrl: e.target.value})}
                placeholder="https://example.com/image.jpg" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label text-slate-900 font-bold">Description (Optional)</label>
              <textarea value={editingHall.description || ''} onChange={(e) => setEditingHall({...editingHall, description: e.target.value})}
                placeholder="Describe the hall..." className="input min-h-[100px]" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-500/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Hall'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Manage Halls</h2>
          <p className="text-slate-500 font-medium">Add, update, or remove halls</p>
        </div>
        <button onClick={() => setEditingHall({ name: '', capacity: 10 })} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Hall
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Hall Name</th>
              <th className="p-4">Capacity</th>
              <th className="p-4">Location</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {halls.map((hall) => (
              <tr key={hall.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand-500" />
                    </div>
                    <span className="font-bold text-slate-900">{hall.name}</span>
                  </div>
                </td>
                <td className="p-4 font-semibold text-slate-600">{hall.capacity} Seats</td>
                <td className="p-4 text-slate-500">{hall.location || '—'}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingHall(hall)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Edit Hall"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hall.id)}
                      disabled={deletingId === hall.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Hall"
                    >
                      {deletingId === hall.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {halls.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                  No halls found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
