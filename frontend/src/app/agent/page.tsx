'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneIncoming,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Plane,
  ArrowRight,
  RefreshCw,
  Filter,
  Bell,
  Headphones,
} from 'lucide-react';
import { getActiveHandoffs } from '@/lib/api';
import { getDemoHandoffsList, getDemoHandoffCounts } from '@/lib/handoffDemoData';
import type { HandoffDossier, SentimentScore, HandoffStatus } from '@/types';

// Sentiment badge colors
const SENTIMENT_CONFIG: Record<SentimentScore, { bg: string; text: string; dot: string }> = {
  calm: { bg: 'bg-green-900/50', text: 'text-green-300', dot: 'bg-green-400' },
  neutral: { bg: 'bg-gray-700', text: 'text-gray-300', dot: 'bg-gray-400' },
  frustrated: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  urgent: { bg: 'bg-orange-900/50', text: 'text-orange-300', dot: 'bg-orange-400' },
  angry: { bg: 'bg-red-900/50', text: 'text-red-300', dot: 'bg-red-400' },
};

// Priority badge colors
const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; pulse?: boolean }> = {
  normal: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700' },
  urgent: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700', pulse: true },
};

// Status config
const STATUS_CONFIG: Record<HandoffStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', label: 'Waiting' },
  agent_joined: { bg: 'bg-blue-900/50', text: 'text-blue-300', label: 'Connected' },
  in_progress: { bg: 'bg-purple-900/50', text: 'text-purple-300', label: 'In Progress' },
  resolved: { bg: 'bg-green-900/50', text: 'text-green-300', label: 'Resolved' },
  abandoned: { bg: 'bg-gray-700', text: 'text-gray-400', label: 'Abandoned' },
};

type FilterType = 'all' | 'pending' | 'in_progress' | 'resolved';

function formatTimeAgo(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function AgentConsolePage() {
  const router = useRouter();
  const [handoffs, setHandoffs] = useState<HandoffDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, resolved: 0 });

  // Fetch handoffs
  const fetchHandoffs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Try real API first
      const data = await getActiveHandoffs();
      setHandoffs(data.handoffs);
      setCounts({
        pending: data.handoffs.filter((h) => h.status === 'pending').length,
        in_progress: data.handoffs.filter((h) => h.status === 'agent_joined' || h.status === 'in_progress').length,
        resolved: data.handoffs.filter((h) => h.status === 'resolved').length,
      });
    } catch {
      // Fallback to demo data
      const demoHandoffs = getDemoHandoffsList();
      setHandoffs(demoHandoffs);
      setCounts(getDemoHandoffCounts());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHandoffs();
    // Poll every 5 seconds
    const interval = setInterval(() => fetchHandoffs(false), 5000);
    return () => clearInterval(interval);
  }, [fetchHandoffs]);

  // Filter handoffs
  const filteredHandoffs = handoffs.filter((h) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return h.status === 'pending';
    if (filter === 'in_progress') return h.status === 'agent_joined' || h.status === 'in_progress';
    if (filter === 'resolved') return h.status === 'resolved';
    return true;
  });

  // Handle clicking a handoff
  const handleHandoffClick = (handoffId: string) => {
    router.push(`/agent/${handoffId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading console...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded-lg">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Agent Console</h1>
                <p className="text-sm text-gray-400">Elder Strolls Handoffs</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                  <PhoneIncoming className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">{counts.pending}</span>
                  <span className="text-yellow-400/70 text-sm">waiting</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 font-bold">{counts.in_progress}</span>
                  <span className="text-blue-400/70 text-sm">active</span>
                </div>
              </div>

              {/* Refresh */}
              <button
                onClick={() => fetchHandoffs(true)}
                disabled={refreshing}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all', 'pending', 'in_progress', 'resolved'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && counts.pending > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-xs rounded-full">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Handoff List */}
        {filteredHandoffs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-400 mb-2">No Handoffs</h2>
            <p className="text-gray-500">
              {filter === 'all' ? 'No active handoffs at the moment' : `No ${filter} handoffs`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredHandoffs.map((handoff) => {
                const sentiment = SENTIMENT_CONFIG[handoff.sentiment_score];
                const priority = PRIORITY_CONFIG[handoff.priority];
                const status = STATUS_CONFIG[handoff.status];
                const isPending = handoff.status === 'pending';

                return (
                  <motion.div
                    key={handoff.handoff_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={() => handleHandoffClick(handoff.handoff_id)}
                    className={`bg-gray-800 rounded-xl border ${
                      isPending ? 'border-yellow-600/50 hover:border-yellow-500' : 'border-gray-700 hover:border-gray-600'
                    } p-5 cursor-pointer transition-all hover:bg-gray-750`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Priority indicator */}
                          <span className={`relative px-2 py-0.5 rounded text-xs font-bold border ${priority.bg} ${priority.text} ${priority.border}`}>
                            {priority.pulse && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                            {handoff.priority.toUpperCase()}
                          </span>

                          {/* Status */}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>

                          {/* Sentiment */}
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${sentiment.bg} ${sentiment.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
                            {handoff.sentiment_score}
                          </span>

                          {/* Time */}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(handoff.created_at)}
                          </span>
                        </div>

                        {/* Customer name and flight */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-white">
                              {handoff.metadata.passenger_name || 'Unknown Customer'}
                            </span>
                          </div>
                          {handoff.metadata.flight_number && (
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Plane className="w-3 h-3" />
                              {handoff.metadata.flight_number}
                            </div>
                          )}
                          {handoff.metadata.confirmation_code && (
                            <span className="font-mono text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
                              {handoff.metadata.confirmation_code}
                            </span>
                          )}
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {handoff.conversation_summary}
                        </p>

                        {/* Handoff reason */}
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Reason: {handoff.handoff_reason.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Right side - Action */}
                      <div className="flex items-center gap-3">
                        {isPending && (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Bell className="w-4 h-4 animate-pulse" />
                            <span className="text-sm font-medium">Needs Agent</span>
                          </div>
                        )}
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Alert sound indicator for pending */}
      {counts.pending > 0 && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-yellow-600 text-yellow-100 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{counts.pending} customer{counts.pending > 1 ? 's' : ''} waiting</span>
          </div>
        </div>
      )}
    </main>
  );
}
