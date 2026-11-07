import React from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { ALARM_CONFIG_REGISTRY } from '../../data/alarm-config';

export const AlarmBanner: React.FC = () => {
  const { tags, acknowledgeAlarm } = useSimulationStore();
  const { setActiveScreen } = useDCSStore();

  // Find all active alarms
  const activeAlarms = Object.values(tags).filter(
    (t) => t.alarmState === 'ACTIVE_UNACK' || t.alarmState === 'ACTIVE_ACK' || t.alarmState === 'RTN_UNACK'
  );

  // Highest priority unacknowledged alarm
  const highestAlarm = activeAlarms.find((t) => t.alarmState === 'ACTIVE_UNACK') || activeAlarms[0];

  if (!highestAlarm) {
    return (
      <div className="h-8 bg-[#05080c] border-b border-[#141f2c] px-3 flex items-center justify-between text-[11px] text-gray-400 font-mono select-none">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span className="text-gray-300 font-bold">PLANT-3 FRACTIONATION TRAIN NORMAL — ALL CONTROL LOOPS STABLE — ZERO UNACK ALARMS</span>
        </div>
        <div className="text-[10px] text-gray-500">ISA-18.2 DCS ALARM ENGINE OK</div>
      </div>
    );
  }

  const alarmCfg = ALARM_CONFIG_REGISTRY.find((a) => a.tagId === highestAlarm.id);
  const isUnack = highestAlarm.alarmState === 'ACTIVE_UNACK';
  const isCritical = highestAlarm.alarmSeverity === 'CRITICAL';

  return (
    <div
      className={`h-8 px-3 flex items-center justify-between text-[11px] font-mono border-b transition-none select-none ${
        isUnack
          ? isCritical
            ? 'bg-red-950 border-red-500 text-red-100 animate-pulse'
            : 'bg-amber-950 border-amber-500 text-amber-100 animate-pulse'
          : 'bg-[#151c28] border-gray-700 text-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertTriangle size={13} className={isCritical ? 'text-red-400' : 'text-amber-400'} />
          <span className="bg-red-700 text-white px-1.5 py-0 text-[9.5px] border border-red-500">
            {highestAlarm.alarmSeverity}
          </span>
          <span className="text-cyan-300 font-bold underline cursor-pointer" onClick={() => setActiveScreen('ALARMS')}>
            {highestAlarm.id}
          </span>
        </div>

        <div className="text-gray-200">
          <span className="font-semibold">{alarmCfg?.message || `Alarm on Tag ${highestAlarm.id}`}</span>
          <span className="text-gray-400 ml-2">
            (PV: {typeof highestAlarm.measuredValue === 'number' && !isNaN(highestAlarm.measuredValue) ? highestAlarm.measuredValue.toFixed(2) : (highestAlarm.measuredValue ?? '0.00')} | SP: {alarmCfg?.setpoint ?? '-'})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400">STATE: {highestAlarm.alarmState}</span>
        {isUnack && (
          <button
            onClick={() => acknowledgeAlarm(alarmCfg ? alarmCfg.id : `ALM_${highestAlarm.id}`)}
            className="bg-red-700 hover:bg-red-600 text-white px-2 py-0.5 font-bold text-[10px] flex items-center gap-1 border border-red-400"
          >
            <Bell size={10} />
            ACK
          </button>
        )}
        <button
          onClick={() => setActiveScreen('ALARMS')}
          className="bg-[#1f2c3d] hover:bg-[#2b3e56] text-cyan-300 px-2 py-0.5 text-[10.5px] border border-gray-600 font-bold"
        >
          ALARM SUMMARY ({activeAlarms.length})
        </button>
      </div>
    </div>
  );
};
