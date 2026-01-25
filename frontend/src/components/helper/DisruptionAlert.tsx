'use client';

import { useState } from 'react';
import type { IROPStatus, RebookingOption, ConnectionRisk } from '@/types';

interface DisruptionAlertProps {
  iropStatus: IROPStatus;
  onAcceptRebooking: (optionId: string) => Promise<void>;
  onAcknowledgeDisruption: (disruptionId: string) => Promise<void>;
  loading?: boolean;
}

export function DisruptionAlert({
  iropStatus,
  onAcceptRebooking,
  onAcknowledgeDisruption,
  loading = false,
}: DisruptionAlertProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);

  if (!iropStatus.has_disruption || !iropStatus.disruption) {
    return null;
  }

  const { disruption } = iropStatus;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDisruptionTypeConfig = (type: string) => {
    switch (type) {
      case 'delay':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Flight Delayed',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-800',
          iconBg: 'bg-yellow-100',
        };
      case 'cancellation':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          title: 'Flight Cancelled',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100',
        };
      case 'missed_connection':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          title: 'Missed Connection',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-400',
          textColor: 'text-orange-800',
          iconBg: 'bg-orange-100',
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          title: 'Flight Disruption',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-800',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const getRiskBadge = (risk: ConnectionRisk['risk_level']) => {
    switch (risk) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">High Risk</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium Risk</span>;
      case 'low':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low Risk</span>;
      default:
        return null;
    }
  };

  const config = getDisruptionTypeConfig(disruption.disruption_type);
  const autoRebooked = disruption.auto_rebooked_option;
  const otherOptions = disruption.rebooking_options.filter(
    (opt) => opt.option_id !== autoRebooked?.option_id
  );

  const handleAcceptRebooking = async (optionId: string) => {
    setSelectedOption(optionId);
    await onAcceptRebooking(optionId);
    setSelectedOption(null);
  };

  return (
    <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className={`px-6 py-4 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center ${config.textColor}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${config.textColor}`}>
              {config.title}
            </h3>
            <p className={`text-sm ${config.textColor} opacity-80`}>
              Flight {disruption.flight_number}
              {disruption.delay_minutes && ` - ${Math.floor(disruption.delay_minutes / 60)}h ${disruption.delay_minutes % 60}m delay`}
            </p>
          </div>
          {iropStatus.requires_action && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium text-red-700">Action Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <p className="text-gray-700">{disruption.message}</p>

        {/* Original vs New Time */}
        {disruption.new_estimated_departure_time && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Original Departure</span>
              <p className="text-lg font-bold text-gray-400 line-through">
                {formatTime(disruption.original_departure_time)}
              </p>
              <p className="text-xs text-gray-400">{formatDate(disruption.original_departure_time)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-xs text-yellow-600 uppercase tracking-wide">New Departure</span>
              <p className="text-lg font-bold text-yellow-800">
                {formatTime(disruption.new_estimated_departure_time)}
              </p>
              <p className="text-xs text-yellow-600">{formatDate(disruption.new_estimated_departure_time)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Connection Risks */}
      {disruption.connection_risks.length > 0 && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Connection at Risk
          </h4>
          {disruption.connection_risks.map((risk, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">
                  {risk.origin} → {risk.destination}
                </span>
                {getRiskBadge(risk.risk_level)}
              </div>
              <p className="text-sm text-gray-600">
                Connection time: {risk.connection_time_minutes} min (minimum: {risk.minimum_connection_time} min)
              </p>
              <p className="text-sm text-orange-700 mt-1">{risk.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Auto-Rebooked Option (AA Recovery) */}
      {autoRebooked && iropStatus.auto_rebooking_available && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AA Auto-Recovery Available
          </h4>
          <div className="bg-white rounded-xl p-4 border-2 border-green-300">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-2xl font-bold text-gray-800">{autoRebooked.flight_number}</span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Recommended
                </span>
              </div>
              {autoRebooked.seat && (
                <span className="text-sm text-gray-600">Seat: {autoRebooked.seat}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="font-medium">{autoRebooked.origin}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{autoRebooked.destination}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Departs: </span>
                <span className="font-medium text-gray-800">
                  {formatTime(autoRebooked.departure_time)} - {formatDate(autoRebooked.departure_time)}
                </span>
              </div>
              {autoRebooked.gate && (
                <span className="text-gray-600">Gate: {autoRebooked.gate}</span>
              )}
            </div>
            {autoRebooked.acceptance_deadline && (
              <p className="text-xs text-orange-600 mt-2">
                Accept by: {formatTime(autoRebooked.acceptance_deadline)}
              </p>
            )}
            <button
              onClick={() => handleAcceptRebooking(autoRebooked.option_id)}
              disabled={loading || selectedOption === autoRebooked.option_id}
              className="mt-4 w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {selectedOption === autoRebooked.option_id ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept AA Auto-Recovery
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Other Rebooking Options */}
      {otherOptions.length > 0 && (
        <div className="px-6 py-4 bg-white">
          <button
            onClick={() => setShowAllOptions(!showAllOptions)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-semibold text-gray-800">
              Other Flight Options ({otherOptions.length})
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showAllOptions ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAllOptions && (
            <div className="mt-4 space-y-3">
              {otherOptions.map((option) => (
                <RebookingOptionCard
                  key={option.option_id}
                  option={option}
                  onSelect={() => handleAcceptRebooking(option.option_id)}
                  loading={loading || selectedOption === option.option_id}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Acknowledge Button (if no rebooking needed) */}
      {!iropStatus.auto_rebooking_available && !disruption.acknowledged && (
        <div className="px-6 py-4 bg-white">
          <button
            onClick={() => onAcknowledgeDisruption(disruption.id)}
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Processing...' : 'Acknowledge Disruption'}
          </button>
        </div>
      )}

      {/* Already Acknowledged */}
      {disruption.acknowledged && (
        <div className="px-6 py-4 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Acknowledged</span>
            {disruption.acknowledged_at && (
              <span className="text-sm text-green-600">
                at {formatTime(disruption.acknowledged_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for rebooking option cards
function RebookingOptionCard({
  option,
  onSelect,
  loading,
  formatTime,
  formatDate,
}: {
  option: RebookingOption;
  onSelect: () => void;
  loading: boolean;
  formatTime: (s: string) => string;
  formatDate: (s: string) => string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-800">{option.flight_number}</span>
        {option.connection_risk && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            option.connection_risk === 'high'
              ? 'bg-red-100 text-red-800'
              : option.connection_risk === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {option.connection_risk} risk
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span>{option.origin}</span>
        <span className="text-gray-400">→</span>
        <span>{option.destination}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {formatTime(option.departure_time)} - {formatDate(option.departure_time)}
        </span>
        <button
          onClick={onSelect}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Selecting...' : 'Select'}
        </button>
      </div>
    </div>
  );
}
