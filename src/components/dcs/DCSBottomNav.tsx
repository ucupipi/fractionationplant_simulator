import React from 'react';
import { useDCSStore, DCSScreenId } from '../../stores/dcsStore';
import { useSimulationStore } from '../../stores/simulationStore';

export const DCSBottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, toggleHornSilence, hornSilenced } = useDCSStore();
  const { isRunning, setRunning, acknowledgeAllAlarms, unackAlarmCount } = useSimulationStore();

  const softkeys: {
    key: string;
    label: string;
    action: () => void;
    isActive?: boolean;
    badge?: string | number;
    color?: string;
  }[] = [
    {
      key: 'F1',
      label: 'OVERVIEW',
      action: () => setActiveScreen('OVERVIEW'),
      isActive: activeScreen === 'OVERVIEW'
    },
    {
      key: 'F2',
      label: 'SCRUB 3C-1',
      action: () => setActiveScreen('SCRUB'),
      isActive: activeScreen === 'SCRUB'
    },
    {
      key: 'F3',
      label: 'DE-ETH 3C-4',
      action: () => setActiveScreen('DE_ETHANIZER'),
      isActive: activeScreen === 'DE_ETHANIZER'
    },
    {
      key: 'F4',
      label: 'DE-PROP 3C-6',
      action: () => setActiveScreen('DE_PROPANIZER'),
      isActive: activeScreen === 'DE_PROPANIZER'
    },
    {
      key: 'F5',
      label: 'DE-BUT 3C-8',
      action: () => setActiveScreen('DE_BUTANIZER'),
      isActive: activeScreen === 'DE_BUTANIZER'
    },
    {
      key: 'F6',
      label: 'REFRIG 4E-12',
      action: () => setActiveScreen('REFRIGERATION'),
      isActive: activeScreen === 'REFRIGERATION'
    },
    {
      key: 'F7',
      label: 'TREND (TG)',
      action: () => setActiveScreen('TREND'),
      isActive: activeScreen === 'TREND'
    },
    {
      key: 'F8',
      label: 'ALARM SUMM',
      action: () => setActiveScreen('ALARMS'),
      isActive: activeScreen === 'ALARMS',
      badge: unackAlarmCount > 0 ? unackAlarmCount : undefined
    },
    {
      key: 'F9',
      label: 'CTL GROUPS',
      action: () => {
        // Toggle or open Overview control groups
        setActiveScreen('OVERVIEW');
      }
    },
    {
      key: 'F10',
      label: hornSilenced ? 'HORN OFF' : 'SILENCE',
      action: toggleHornSilence,
      color: hornSilenced ? 'bg-amber-900 text-amber-300 border-amber-600' : undefined
    },
    {
      key: 'F11',
      label: 'ACK ALL',
      action: acknowledgeAllAlarms,
      color: unackAlarmCount > 0 ? 'bg-red-900 text-white border-red-500 animate-pulse' : undefined
    },
    {
      key: 'F12',
      label: isRunning ? 'FREEZE' : 'RESUME',
      action: () => setRunning(!isRunning),
      color: isRunning ? 'bg-emerald-900 text-emerald-200 border-emerald-600' : 'bg-amber-900 text-amber-200 border-amber-500'
    }
  ];

  return (
    <div className="bg-[#121c27] border-t border-[#090f17] p-1 select-none font-mono z-20">
      {/* 12-Button Yokogawa CENTUM VP Operator Keyboard Softkey Strip */}
      <div className="grid grid-cols-12 gap-1">
        {softkeys.map((btn) => (
          <button
            key={btn.key}
            onClick={btn.action}
            className={`flex flex-col items-center justify-center py-1 px-1 border transition-none text-center ${
              btn.color
                ? btn.color
                : btn.isActive
                ? 'bg-[#0f4c81] text-white border-blue-400 font-bold'
                : 'bg-[#212f3f] hover:bg-[#2b3e54] text-gray-200 border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-cyan-300 font-bold">[{btn.key}]</span>
              {btn.badge !== undefined && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </div>
            <span className="text-[10px] font-bold truncate w-full tracking-tighter">
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
