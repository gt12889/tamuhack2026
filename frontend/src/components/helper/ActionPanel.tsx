'use client';

import { useState } from 'react';
import { Plane, XCircle, Armchair, Briefcase, Accessibility, ChevronRight } from 'lucide-react';
import type { AvailableAction, FamilyActionType } from '@/types';

interface ActionPanelProps {
  actions: AvailableAction[];
  onActionSelect: (actionType: FamilyActionType) => void;
  disabled?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  plane: <Plane className="h-5 w-5" />,
  'x-circle': <XCircle className="h-5 w-5" />,
  armchair: <Armchair className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  accessibility: <Accessibility className="h-5 w-5" />,
};

export default function ActionPanel({ actions, onActionSelect, disabled = false }: ActionPanelProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
        <p className="text-gray-500 text-sm">No actions available for this reservation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500 mt-1">Help manage this reservation directly</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.action_type}
              onClick={() => onActionSelect(action.action_type)}
              disabled={!action.enabled || disabled}
              onMouseEnter={() => setHoveredAction(action.action_type)}
              onMouseLeave={() => setHoveredAction(null)}
              className={`
                relative flex items-center p-4 rounded-lg border-2 text-left transition-all
                ${action.enabled && !disabled
                  ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3
                ${action.enabled && !disabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}
              `}>
                {actionIcons[action.icon] || <Plane className="h-5 w-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${action.enabled && !disabled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {action.display_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {action.description}
                </p>
              </div>

              <ChevronRight className={`
                h-5 w-5 flex-shrink-0 ml-2 transition-transform
                ${hoveredAction === action.action_type ? 'transform translate-x-1' : ''}
                ${action.enabled && !disabled ? 'text-gray-400' : 'text-gray-300'}
              `} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
