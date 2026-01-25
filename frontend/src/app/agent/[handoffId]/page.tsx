'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  User,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Copy,
  Check,
  Plane,
  MessageSquare,
  FileText,
  Zap,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  getHandoff,
  agentJoinHandoff,
  agentSendMessage,
  updateHandoffStatus,
  getHandoffMessages,
} from '@/lib/api';
import {
  getOrCreateDemoHandoff,
  updateDemoHandoffStatus,
  addDemoHandoffMessage,
} from '@/lib/handoffDemoData';
import type {
  HandoffDossier,
  HandoffTranscriptMessage,
  SentimentScore,
  HandoffStatus,
} from '@/types';

// Sentiment badge colors
const SENTIMENT_CONFIG: Record<SentimentScore, { bg: string; text: string; label: string }> = {
  calm: { bg: 'bg-green-100', text: 'text-green-800', label: 'Calm' },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Neutral' },
  frustrated: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Frustrated' },
  urgent: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Urgent' },
  angry: { bg: 'bg-red-100', text: 'text-red-800', label: 'Angry' },
};

// Priority badge colors
const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

// Status badge config
const STATUS_CONFIG: Record<HandoffStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Waiting for Agent' },
  agent_joined: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Agent Connected' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
  abandoned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Abandoned' },
};

export default function AgentHandoffPage() {
  const params = useParams();
  const handoffId = params.handoffId as string;

  const [dossier, setDossier] = useState<HandoffDossier | null>(null);
  const [messages, setMessages] = useState<HandoffTranscriptMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);

  // Resolution
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if this is a demo handoff (starts with "demo-handoff-")
  const isDemoHandoff = handoffId.startsWith('demo-handoff-');

  // Fetch handoff data
  const fetchHandoff = useCallback(async () => {
    try {
      let data: HandoffDossier;

      if (isDemoHandoff) {
        // Use demo data for demo handoffs
        data = getOrCreateDemoHandoff(handoffId);
      } else {
        // Try real API
        data = await getHandoff(handoffId);
      }

      setDossier(data);
      setMessages(data.transcript);
      setHasJoined(data.status !== 'pending');
      setError(null);
    } catch (err) {
      // Fallback to demo data if API fails
      if (handoffId.includes('demo')) {
        const demoData = getOrCreateDemoHandoff(handoffId);
        setDossier(demoData);
        setMessages(demoData.transcript);
        setHasJoined(demoData.status !== 'pending');
        setError(null);
      } else {
        setError('Unable to load handoff. The link may be invalid or expired.');
      }
    } finally {
      setLoading(false);
    }
  }, [handoffId, isDemoHandoff]);

  // Poll for message updates
  const fetchMessages = useCallback(async () => {
    if (!hasJoined) return;
    try {
      const data = await getHandoffMessages(handoffId);
      setMessages(data.messages);
    } catch (err) {
      console.log('Failed to fetch messages');
    }
  }, [handoffId, hasJoined]);

  useEffect(() => {
    fetchHandoff();
  }, [fetchHandoff]);

  // Poll for updates when agent has joined
  useEffect(() => {
    if (!hasJoined) return;

    const interval = setInterval(() => {
      fetchMessages();
      fetchHandoff();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasJoined, fetchMessages, fetchHandoff]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join handoff
  const handleJoin = async () => {
    setJoining(true);
    try {
      if (isDemoHandoff) {
        // Demo mode: update local state
        const updated = updateDemoHandoffStatus(handoffId, 'agent_joined');
        if (updated) {
          setDossier(updated);
          setHasJoined(true);
        }
      } else {
        const result = await agentJoinHandoff(handoffId);
        setDossier(result.handoff);
        setHasJoined(true);
      }
    } catch (err) {
      setError('Failed to join handoff. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (isDemoHandoff) {
        // Demo mode: add message locally
        const msg = addDemoHandoffMessage(handoffId, 'agent', newMessage.trim());
        if (msg) {
          setMessages((prev) => [...prev, msg]);
        }
        setNewMessage('');
      } else {
        await agentSendMessage(handoffId, newMessage.trim());
        setNewMessage('');
        await fetchMessages();
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Copy suggested response
  const handleCopySuggestion = () => {
    if (dossier?.suggested_first_response) {
      navigator.clipboard.writeText(dossier.suggested_first_response);
      setCopiedSuggestion(true);
      setNewMessage(dossier.suggested_first_response);
      setTimeout(() => setCopiedSuggestion(false), 2000);
    }
  };

  // Resolve handoff
  const handleResolve = async () => {
    setResolving(true);
    try {
      if (isDemoHandoff) {
        // Demo mode: update status locally
        const updated = updateDemoHandoffStatus(handoffId, 'resolved');
        if (updated) {
          setDossier(updated);
        }
      } else {
        await updateHandoffStatus(handoffId, 'resolved', resolutionNotes);
        await fetchHandoff();
      }
    } catch (err) {
      setError('Failed to resolve handoff.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading handoff...</p>
        </div>
      </main>
    );
  }

  if (error && !dossier) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-900/50 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Handoff Not Found</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!dossier) return null;

  const sentiment = SENTIMENT_CONFIG[dossier.sentiment_score];
  const priority = PRIORITY_CONFIG[dossier.priority];
  const status = STATUS_CONFIG[dossier.status];

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2 rounded-lg">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent Handoff Console</h1>
              <p className="text-sm text-gray-400">
                ID: {handoffId.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${priority.bg} ${priority.text} ${priority.border}`}>
              {dossier.priority.toUpperCase()} Priority
            </span>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Alert Banner for Pending */}
        {dossier.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-900/50 border border-yellow-600 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="font-bold text-yellow-300">Customer Waiting for Agent</p>
                  <p className="text-sm text-yellow-400/80">
                    Click "Join Call" to connect with the customer
                  </p>
                </div>
              </div>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {joining ? 'Connecting...' : 'Join Call'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Context Dossier */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Summary Card */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Context Dossier
              </h2>

              {/* Sentiment */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Sentiment</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${sentiment.bg} ${sentiment.text}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {sentiment.label}
                </span>
                {dossier.sentiment_reason && (
                  <p className="text-sm text-gray-400 mt-1">{dossier.sentiment_reason}</p>
                )}
              </div>

              {/* Summary */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Conversation Summary</p>
                <p className="text-sm text-gray-300 bg-gray-700/50 rounded-lg p-3">
                  {dossier.conversation_summary}
                </p>
              </div>

              {/* AI Actions Taken */}
              {dossier.ai_actions_taken.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">AI Actions Taken</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {dossier.ai_actions_taken.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Handoff Reason */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Handoff Reason</p>
                <p className="text-sm text-gray-300">
                  {dossier.handoff_reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                {dossier.handoff_reason_detail && (
                  <p className="text-xs text-gray-400 mt-1">{dossier.handoff_reason_detail}</p>
                )}
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Customer Details
              </h2>

              <div className="space-y-3">
                {dossier.metadata.passenger_name && (
                  <div>
                    <p className="text-xs text-gray-500">Passenger Name</p>
                    <p className="font-medium">{dossier.metadata.passenger_name}</p>
                  </div>
                )}
                {dossier.metadata.confirmation_code && (
                  <div>
                    <p className="text-xs text-gray-500">Confirmation Code</p>
                    <p className="font-mono font-bold text-blue-400">
                      {dossier.metadata.confirmation_code}
                    </p>
                  </div>
                )}
                {dossier.metadata.flight_number && (
                  <div>
                    <p className="text-xs text-gray-500">Flight</p>
                    <p className="font-medium flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      {dossier.metadata.flight_number}
                    </p>
                  </div>
                )}
                {dossier.metadata.passenger_phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{dossier.metadata.passenger_phone}</p>
                  </div>
                )}
                {dossier.metadata.passenger_email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm">{dossier.metadata.passenger_email}</p>
                  </div>
                )}
                {dossier.metadata.aadvantage_number && (
                  <div>
                    <p className="text-xs text-gray-500">AAdvantage #</p>
                    <p className="font-mono">{dossier.metadata.aadvantage_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Response Card */}
            {dossier.suggested_first_response && (
              <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-700">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Suggested Response
                </h2>
                <p className="text-sm text-blue-100 bg-blue-900/50 rounded-lg p-3 mb-3">
                  "{dossier.suggested_first_response}"
                </p>
                <button
                  onClick={handleCopySuggestion}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {copiedSuggestion ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied to Input
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Use This Response
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Resolution Card */}
            {hasJoined && dossier.status !== 'resolved' && (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-400" />
                  Resolve Handoff
                </h2>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Resolution notes (optional)..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm mb-3 focus:border-green-500 focus:outline-none"
                  rows={2}
                />
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {resolving ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700 h-[calc(100vh-240px)] flex flex-col">
              {/* Transcript Header */}
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Full Transcript
                </h2>
                <span className="text-sm text-gray-400">
                  {messages.length} messages
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user'
                            ? 'bg-blue-600'
                            : msg.role === 'agent'
                            ? 'bg-green-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : msg.role === 'agent' ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      {/* Message */}
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : msg.role === 'agent'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-xs opacity-70 mb-1">
                          {msg.role === 'user'
                            ? 'Customer'
                            : msg.role === 'agent'
                            ? 'Agent (You)'
                            : 'AI Assistant'}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {hasJoined && dossier.status !== 'resolved' && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-700"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the customer..."
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </form>
              )}

              {/* Resolved Banner */}
              {dossier.status === 'resolved' && (
                <div className="p-4 border-t border-gray-700 bg-green-900/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="font-bold text-green-300">Handoff Resolved</p>
                      <p className="text-sm text-green-400/80">
                        Resolved at {new Date(dossier.resolved_at!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bridge Message Notification */}
      {dossier.bridge_message && (
        <div className="fixed bottom-6 right-6 max-w-md">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-2xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Customer was told:
            </p>
            <p className="text-sm text-gray-300 italic">
              "{dossier.bridge_message}"
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
