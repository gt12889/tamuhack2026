'use client';

import { CheckCircle, XCircle, Clock, Plane, Armchair, Briefcase, Accessibility } from 'lucide-react';
import type { FamilyAction } from '@/types';

interface ActionHistoryProps {
  actions: FamilyAction[];
}

const actionIcons: Record<string, React.ReactNode> = {
  change_flight: <Plane className="h-4 w-4" />,
  cancel_flight: <XCircle className="h-4 w-4" />,
  select_seat: <Armchair className="h-4 w-4" />,
  add_bags: <Briefcase className="h-4 w-4" />,
  request_wheelchair: <Accessibility className="h-4 w-4" />,
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ActionHistory({ actions }: ActionHistoryProps) {
  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action History</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Clock className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm">No actions taken yet</p>
          <p className="text-xs text-gray-400 mt-1">Actions you take will appear here</p>
        </div>
      </div>
    );
  }

  // Group actions by date
  const groupedActions: Record<string, FamilyAction[]> = {};
  actions.forEach((action) => {
    const dateKey = formatDate(action.created_at);
    if (!groupedActions[dateKey]) {
      groupedActions[dateKey] = [];
    }
    groupedActions[dateKey].push(action);
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Action History</h3>
        <p className="text-sm text-gray-500 mt-1">{actions.length} action{actions.length !== 1 ? 's' : ''} taken</p>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedActions).map(([date, dateActions]) => (
          <div key={date} className="mb-4 last:mb-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{date}</p>
            <div className="space-y-3">
              {dateActions.map((action, index) => (
                <div
                  key={action.id}
                  className={`
                    relative flex items-start pl-6 pb-3
                    ${index !== dateActions.length - 1 ? 'border-l-2 border-gray-200 ml-2' : 'ml-2'}
                  `}
                >
                  {/* Timeline dot */}
                  <div className={`
                    absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center
                    ${action.status === 'executed' ? 'bg-green-100' : 'bg-red-100'}
                  `}>
                    {action.status === 'executed' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                  </div>

                  {/* Action content */}
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="flex items-center gap-2">
                      <span className={`
                        p-1 rounded
                        ${action.status === 'executed' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}
                      `}>
                        {actionIcons[action.action_type] || <Clock className="h-4 w-4" />}
                      </span>
                      <span className="font-medium text-gray-900 text-sm">
                        {action.display_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(action.created_at)}
                      </span>
                    </div>

                    <p className={`
                      text-sm mt-1
                      ${action.status === 'executed' ? 'text-gray-600' : 'text-red-600'}
                    `}>
                      {action.result_message}
                    </p>

                    {action.family_notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Note: {action.family_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
