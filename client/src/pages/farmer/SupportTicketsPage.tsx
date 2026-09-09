import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { SupportTicket, Centre } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';

export const SupportTicketsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // New ticket state
  const [category, setCategory] = useState('Slot Reschedule Request');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [centreId, setCentreId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  // Fetch Tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['tickets'],
    queryFn: () => apiRequest('/tickets'),
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setNewTicketModalOpen(false);
      setSubject('');
      setDescription('');
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      apiRequest(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setReplyMessage('');
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          comments: [...selectedTicket.comments, { ...newComment, isStaff: false, user: {} }],
        });
      }
    },
  });

  // Submit Feedback Mutation
  const feedbackMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setFeedbackModalOpen(false);
      setFeedbackComments('');
      alert('Thank you! Your feedback helps improve mandi operations.');
    },
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate({
      category,
      priority,
      centreId: centreId || undefined,
      subject,
      description,
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim(),
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-emerald-600" />
            Kisan Grievance & Support Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit issues regarding weighing accuracy, slot reschedules, or DBT payment tracking.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFeedbackModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Star className="w-4 h-4 text-amber-500" /> Share Centre Feedback
          </Button>
          <Button
            variant="primary"
            onClick={() => setNewTicketModalOpen(true)}
            className="text-xs flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4" /> Raise Grievance Ticket
          </Button>
        </div>
      </div>

      {/* Ticket List & Thread View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            My Tickets ({tickets.length})
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-400">
              No active support tickets. Click 'Raise Grievance Ticket' if you require assistance.
            </Card>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <Card
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 cursor-pointer transition-all text-xs space-y-2 ${
                    isSelected ? 'border-emerald-600 ring-1 ring-emerald-500 bg-emerald-50/40' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{t.ticketNumber}</span>
                    <Badge variant={t.status === 'RESOLVED' ? 'success' : 'harvest'}>
                      {t.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                  <span className="text-[11px] text-slate-500 block">{t.category}</span>
                </Card>
              );
            })
          )}
        </div>

        {/* Thread Details Card */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="flex flex-col h-[520px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedTicket.ticketNumber}</span>
                    <Badge variant={selectedTicket.status === 'RESOLVED' ? 'success' : 'harvest'}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mt-1">{selectedTicket.subject}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white text-xs">
                {selectedTicket.comments?.map((c, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${c.isStaff ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">
                      {c.isStaff ? 'Mandi Support Officer' : 'You (Farmer)'}
                    </span>
                    <div
                      className={`max-w-md p-3 rounded-2xl leading-relaxed ${
                        c.isStaff
                          ? 'bg-slate-100 text-slate-900 rounded-tl-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {c.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50">
                <Input
                  placeholder="Type your response to support staff..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="text-xs"
                />
                <Button
                  type="submit"
                  isLoading={addCommentMutation.isPending}
                  disabled={!replyMessage.trim()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="h-[520px] flex items-center justify-center text-center p-8 text-slate-400 text-xs">
              Select a ticket on the left to review messages and reply.
            </Card>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal
        isOpen={newTicketModalOpen}
        onClose={() => setNewTicketModalOpen(false)}
        title="Raise Kisan Grievance Ticket"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Slot Reschedule Request">Slot Reschedule Request</option>
              <option value="Quality & Moisture Grade Dispute">Quality & Moisture Grade Dispute</option>
              <option value="Payment Delay Inquiry">Payment Delay / DBT UTR Inquiry</option>
              <option value="Centre Outage / Logistics Issue">Centre Outage / Logistics Issue</option>
              <option value="Platform Usability">Platform Usability</option>
            </Select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Related Procurement Centre</label>
            <Select value={centreId} onChange={(e) => setCentreId(e.target.value)}>
              <option value="">None / General Inquiry</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Subject (विषय)"
            placeholder="Brief summary of your grievance..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description (विस्तार से बताएं)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue with vehicle number, batch, or date details..."
              className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            ></textarea>
          </div>

          <Button type="submit" isLoading={createTicketMutation.isPending} className="w-full">
            Submit Support Ticket
          </Button>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Rate Procurement Centre Experience"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-center">
          <p className="text-slate-600">How would you rate the digital weighing, queue time, and staff transparency?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={feedbackComments}
            onChange={(e) => setFeedbackComments(e.target.value)}
            placeholder="Any suggestions to improve weighing speed or facilities?"
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          ></textarea>

          <Button
            onClick={() =>
              feedbackMutation.mutate({
                centreId: centres[0]?.id,
                rating,
                comments: feedbackComments,
                aspectScores: { queue: rating, staff: rating, transparency: rating, facilities: rating },
              })
            }
            isLoading={feedbackMutation.isPending}
            className="w-full font-bold"
          >
            Submit Feedback
          </Button>
        </div>
      </Modal>
    </div>
  );
};
