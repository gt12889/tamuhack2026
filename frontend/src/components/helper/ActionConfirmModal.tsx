'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { FamilyActionType, FlightOption } from '@/types';

interface ActionConfirmModalProps {
  isOpen: boolean;
  actionType: FamilyActionType;
  actionData?: Record<string, unknown>;
  onConfirm: (notes: string) => Promise<void>;
  onCancel: () => void;
}

const actionDetails: Record<FamilyActionType, {
  title: string;
  description: string;
  confirmText: string;
  warning?: string;
}> = {
  change_flight: {
    title: 'Confirm Flight Change',
    description: 'Are you sure you want to change to this flight?',
    confirmText: 'Change Flight',
  },
  cancel_flight: {
    title: 'Confirm Cancellation',
    description: 'Are you sure you want to cancel this reservation?',
    confirmText: 'Cancel Reservation',
    warning: 'This action cannot be undone. The passenger will need to make a new booking.',
  },
  select_seat: {
    title: 'Confirm Seat Selection',
    description: 'Are you sure you want to select this seat?',
    confirmText: 'Select Seat',
  },
  add_bags: {
    title: 'Confirm Add Baggage',
    description: 'Are you sure you want to add checked bags?',
    confirmText: 'Add Bags',
  },
  request_wheelchair: {
    title: 'Confirm Wheelchair Request',
    description: 'Are you sure you want to request wheelchair assistance?',
    confirmText: 'Request Assistance',
  },
};

export default function ActionConfirmModal({
  isOpen,
  actionType,
  actionData,
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const details = actionDetails[actionType];

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  function getActionSummary() {
    switch (actionType) {
      case 'change_flight': {
        const flight = actionData?.flight as FlightOption | undefined;
        if (flight) {
          return (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-gray-700">New Flight:</p>
              <p className="text-sm text-gray-900">{flight.flight_number}</p>
              <p className="text-xs text-gray-500">
                {flight.origin} → {flight.destination}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(flight.departure_time).toLocaleString()}
              </p>
            </div>
          );
        }
        return null;
      }
      case 'select_seat': {
        const seat = actionData?.seat as string | undefined;
        if (seat) {
          return (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-gray-700">Selected Seat:</p>
              <p className="text-lg font-bold text-gray-900">{seat}</p>
            </div>
          );
        }
        return null;
      }
      case 'add_bags': {
        const count = actionData?.bag_count as number | undefined;
        if (count) {
          return (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-gray-700">Bags to Add:</p>
              <p className="text-lg font-bold text-gray-900">{count} bag{count !== 1 ? 's' : ''}</p>
            </div>
          );
        }
        return null;
      }
      case 'request_wheelchair': {
        const type = actionData?.assistance_type as string | undefined;
        const typeLabels: Record<string, string> = {
          wheelchair: 'Wheelchair',
          wheelchair_ramp: 'Wheelchair with Ramp',
          escort: 'Escort Assistance',
        };
        if (type) {
          return (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-gray-700">Assistance Type:</p>
              <p className="text-lg font-bold text-gray-900">{typeLabels[type] || type}</p>
            </div>
          );
        }
        return null;
      }
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {details.title}
            </h3>
            <p className="text-gray-600 text-sm">{details.description}</p>

            {/* Action summary */}
            {getActionSummary()}

            {/* Warning */}
            {details.warning && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{details.warning}</p>
              </div>
            )}

            {/* Notes input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add a note (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., reason for change, special instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                  ${actionType === 'cancel_flight'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {details.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
