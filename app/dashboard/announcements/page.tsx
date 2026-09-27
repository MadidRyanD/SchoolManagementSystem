'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store';
import { AuthService } from '@/lib/auth';
import { AnnouncementItem } from '@/lib/types';
import { Megaphone, Plus, Trash2, Edit, CheckCircle, Clock, User, ShieldCheck } from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | '5-days' | '2-days' | 'teachers' | 'students'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const currentUser = AuthService.getSession();
  const role = currentUser?.role;

  const canPost = role === 'admin' || role === 'mudir' || role === 'cashier';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAnnouncements(DataStore.getAnnouncements());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      DataStore.saveAnnouncement({
        id: editingId,
        title: title.trim(),
        content: content.trim(),
        author: currentUser?.name || 'Administration',
        authorRole: role || 'admin',
        targetAudience,
      });
      setMsg('Announcement updated successfully!');
      setEditingId(null);
    } else {
      DataStore.saveAnnouncement({
        title: title.trim(),
        content: content.trim(),
        author: currentUser?.name || 'Administration',
        authorRole: role || 'admin',
        targetAudience,
      });
      setMsg('Announcement published successfully!');
    }

    setTitle('');
    setContent('');
    loadData();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (ann: AnnouncementItem) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setTargetAudience(ann.targetAudience);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this announcement?')) {
      DataStore.deleteAnnouncement(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-800" />
            <span>Madrasah Announcements & Directives</span>
          </h1>
          <p className="text-sm text-slate-500">
            Institutional notices, departmental bulletins, and financial reminders.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Announcement Form for Authorized Roles */}
        {canPost && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">
              {editingId ? 'Edit Announcement' : 'Publish Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Headline / Subject *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2nd Dawr Exams Schedule Released"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="all">All Community (الجميع)</option>
                  <option value="5-days">5-Days Department Only</option>
                  <option value="2-days">2-Days Department Only</option>
                  <option value="teachers">Faculty & Teachers Only</option>
                  <option value="students">Students Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notice Body *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear instructions or notice details here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingId ? 'Update Notice' : 'Broadcast Notice'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setTitle('');
                      setContent('');
                    }}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Announcements Stream */}
        <div className={canPost ? 'lg:col-span-2 space-y-4' : 'col-span-3 space-y-4'}>
          {announcements.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
              No notices published yet.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                      Audience: {ann.targetAudience}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{ann.title}</h3>
                  </div>

                  {canPost && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(ann)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{ann.author}</span>
                    <span className="text-slate-400">({ann.authorRole.toUpperCase()})</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{ann.createdAt}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
