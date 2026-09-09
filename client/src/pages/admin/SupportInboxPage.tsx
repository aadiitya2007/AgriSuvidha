import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { SupportTicket } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LifeBuoy, Send, CheckCircle2, Star, MessageSquare } from 'lucide-react';

export const SupportInboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState<string>('IN_PROGRESS');
  const [activeTab, setActiveTab] = useState<'tickets' | 'feedback'>('tickets');

  // Fetch Tickets
  const { data: tickets = [], refetch } = useQuery<SupportTicket[]>({
    queryKey: ['admin-tickets'],
    queryFn: () => apiRequest('/tickets'),
  });

  // Fetch Feedback
  const { data: feedbacks = [] } = useQuery<any[]>({
    queryKey: ['admin-feedback'],
    queryFn: () => apiRequest('/feedback'),
  });

  // Add Comment & Update status
  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message, status }: { ticketId: string; message: string; status?: string }) =>
      apiRequest(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message, status }),
      }),
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setReplyText('');
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          status: ticketStatus,
          comments: [...selectedTicket.comments, { ...newComment, isStaff: true, user: {} }],
        });
      }
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyText.trim(),
      status: ticketStatus,
    });
  };

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : '4.8';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-emerald-600" />
            Support Inbox & Feedback Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Address farmer grievances, resolve slot shift requests, and monitor farmer satisfaction scores.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tickets' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Ticket Inbox ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'feedback' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Farmer Feedback ({feedbacks.length})
          </button>
        </div>
      </div>

      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-1 space-y-3">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <Card
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setTicketStatus(t.status);
                  }}
                  className={`p-4 cursor-pointer transition-all text-xs space-y-2 ${
                    isSelected
                      ? 'border-emerald-600 ring-1 ring-emerald-500 bg-emerald-50/40'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{t.ticketNumber}</span>
                    <Badge variant={t.status === 'RESOLVED' ? 'success' : 'warning'}>
                      {t.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900">{t.subject}</h4>
                  <p className="text-slate-500 line-clamp-1">{t.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Thread Detail */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card className="flex flex-col h-[540px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedTicket.ticketNumber}</span>
                    <h3 className="font-bold text-sm text-slate-800">{selectedTicket.subject}</h3>
                  </div>
                  <div className="w-40">
                    <Select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      className="text-xs"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </Select>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white text-xs">
                  {selectedTicket.comments?.map((c, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${c.isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5">
                        {c.isStaff ? 'Official Mandi Staff (You)' : 'Farmer'}
                      </span>
                      <div
                        className={`max-w-md p-3 rounded-2xl leading-relaxed ${
                          c.isStaff
                            ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-slate-100 text-slate-900 rounded-tl-xs'
                        }`}
                      >
                        {c.message}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50">
                  <Input
                    placeholder="Type official response to farmer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="submit"
                    isLoading={replyMutation.isPending}
                    disabled={!replyText.trim()}
                    className="text-xs font-semibold px-4 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="h-[540px] flex items-center justify-center text-slate-400 text-xs">
                Select a ticket on the left to review messages and dispatch resolution.
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Feedback Analytics View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <Card className="p-4 bg-amber-50/70 border-amber-200">
              <span className="text-slate-500 block font-semibold">Average Mandi Rating</span>
              <span className="text-3xl font-black text-amber-700 font-mono mt-1 flex items-center gap-2">
                {avgRating} <Star className="w-6 h-6 fill-amber-400 text-amber-400 inline" />
              </span>
              <span className="text-[10px] text-slate-400">Based on {feedbacks.length} ratings</span>
            </Card>

            <Card className="p-4 bg-emerald-50/70 border-emerald-200">
              <span className="text-slate-500 block font-semibold">Weighing Transparency</span>
              <span className="text-3xl font-black text-emerald-800 font-mono mt-1">4.9/5</span>
              <span className="text-[10px] text-emerald-600">Digital tare calibration</span>
            </Card>

            <Card className="p-4 bg-sky-50/70 border-sky-200">
              <span className="text-slate-500 block font-semibold">Queue Experience</span>
              <span className="text-3xl font-black text-sky-800 font-mono mt-1">4.7/5</span>
              <span className="text-[10px] text-sky-600">Zero gate congestion</span>
            </Card>

            <Card className="p-4 bg-purple-50/70 border-purple-200">
              <span className="text-slate-500 block font-semibold">DBT Payment Speed</span>
              <span className="text-3xl font-black text-purple-800 font-mono mt-1">4.9/5</span>
              <span className="text-[10px] text-purple-600">Disbursed under 24 hours</span>
            </Card>
          </div>

          <Card>
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Recent Farmer Reviews & Feedback Comments
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {feedbacks.map((f: any) => (
                <div key={f.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.user?.farmerProfile?.fullName || 'Farmer'}</span>
                    <div className="flex text-amber-400">
                      {[...Array(f.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">"{f.comments || 'Fair grading and quick payment.'}"</p>
                  <span className="text-[10px] text-slate-400 block">{f.centre?.name} • {new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
