'use client';

import { useState } from 'react';
import { ChevronDown, Check, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemoScenario } from '@/lib/demoScenarios';

interface ScenarioSelectorProps {
  scenarios: DemoScenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  className?: string;
}

export function ScenarioSelector({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  className,
}: ScenarioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <div className={cn('relative', className)}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'bg-white border-2 border-purple-200 rounded-xl shadow-sm',
          'hover:border-purple-400 transition-colors',
          isOpen && 'border-purple-500'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Play className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">
                {activeScenario?.name || 'Select Scenario'}
              </span>
              {activeScenario?.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-full',
                  activeScenario.badge === 'Urgent' && 'bg-red-100 text-red-700',
                  activeScenario.badge === 'IROP' && 'bg-orange-100 text-orange-700',
                  activeScenario.badge === 'Handoff' && 'bg-yellow-100 text-yellow-700',
                  activeScenario.badge === 'Espanol' && 'bg-blue-100 text-blue-700',
                  !['Urgent', 'IROP', 'Handoff', 'Espanol'].includes(activeScenario.badge) && 'bg-gray-100 text-gray-700',
                )}>
                  {activeScenario.badge}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {activeScenario?.shortDescription}
            </span>
          </div>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  onSelectScenario(scenario.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 flex items-start gap-3 text-left',
                  'hover:bg-purple-50 transition-colors',
                  scenario.id === activeScenarioId && 'bg-purple-50'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  scenario.id === activeScenarioId
                    ? 'border-purple-600 bg-purple-600'
                    : 'border-gray-300'
                )}>
                  {scenario.id === activeScenarioId && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Scenario info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {scenario.name}
                    </span>
                    {scenario.badge && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-bold rounded-full',
                        scenario.badge === 'Urgent' && 'bg-red-100 text-red-700',
                        scenario.badge === 'IROP' && 'bg-orange-100 text-orange-700',
                        scenario.badge === 'Handoff' && 'bg-yellow-100 text-yellow-700',
                        scenario.badge === 'Espanol' && 'bg-blue-100 text-blue-700',
                        !['Urgent', 'IROP', 'Handoff', 'Espanol'].includes(scenario.badge) && 'bg-gray-100 text-gray-700',
                      )}>
                        {scenario.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {scenario.shortDescription}
                  </p>
                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-1">
                    {scenario.features.slice(0, 4).map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confirmation code preview */}
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-sm text-gray-400">
                    {scenario.reservation.confirmationCode}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
