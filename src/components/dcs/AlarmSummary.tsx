import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { ALARM_CONFIG_REGISTRY } from '../../data/alarm-config';
import { AlertTriangle, Bell, CheckCircle2, History, Filter } from 'lucide-react';

export const AlarmSummary: React.FC = () => {
  const { tags, acknowledgeAlarm, acknowledgeAllAlarms } = useSimulationStore();
  const { openFaceplate } = useDCSStore();
  const [filterUnit, setFilterUnit] = useState<string>('ALL');

  // Collect all active alarms
  const activeAlarms = Object.values(tags).filter(
    (t) => t.alarmState === 'ACTIVE_UNACK' || t.alarmState === 'ACTIVE_ACK' || t.alarmState === 'RTN_UNACK'
  );

  return (
    <div className="h-full w-full p-4 bg-[#080d16] text-gray-200 font-mono text-xs overflow-y-auto select-none">
      {/* Header & Global Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400" />
          <h1 className="text-sm font-bold text-red-300 tracking-wider">
            LEVEL 4 — ISA-18.2 ALARM SUMMARY & SEQUENCE OF EVENTS (SOE)
          </h1>
          <span className="text-[11px] text-gray-400">
            ({activeAlarms.length} ACTIVE ALARMS)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Unit Filter */}
          <div className="flex items-center gap-1.5 bg-[#101726] px-2 py-1 rounded border border-gray-700">
            <Filter size={12} className="text-gray-400" />
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="bg-transparent text-cyan-300 text-xs outline-none"
            >
              <option value="ALL">ALL UNITS (PLANT-3)</option>
              <option value="SCRUB">3C-1 SCRUB SECTION</option>
              <option value="DE_ETHANIZER">3C-4 DE-ETHANIZER</option>
              <option value="DE_PROPANIZER">3C-6 DE-PROPANIZER</option>
              <option value="DE_BUTANIZER">3C-8 DE-BUTANIZER</option>
              <option value="REFRIGERATION">REFRIGERATION</option>
            </select>
          </div>

          <button
            onClick={acknowledgeAllAlarms}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow"
          >
            <Bell size={12} />
            ACKNOWLEDGE ALL
          </button>
        </div>
      </div>

      {/* Active Alarm Table */}
      <div className="bg-[#0c121e] border border-gray-800 rounded-lg overflow-hidden mb-6">
        <div className="bg-[#121927] px-4 py-2 border-b border-gray-700 font-bold text-cyan-400 text-xs flex justify-between">
          <span>ACTIVE PROCESS ALARMS</span>
          <span className="text-[11px] text-gray-400">PRIORITY SORTED</span>
        </div>

        {activeAlarms.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <span>NO ACTIVE ALARMS — PLANT PROCESS NORMAL</span>
          </div>
        ) : (
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#090e18] text-gray-400 border-b border-gray-800 uppercase">
              <tr>
                <th className="p-2.5">PRIORITY</th>
                <th className="p-2.5">TAG ID</th>
                <th className="p-2.5">ALARM CONDITION</th>
                <th className="p-2.5">PV VALUE</th>
                <th className="p-2.5">ALARM MESSAGE & CONSEQUENCE</th>
                <th className="p-2.5">STATE</th>
                <th className="p-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeAlarms.map((tag) => {
                const alarmCfg = ALARM_CONFIG_REGISTRY.find((a) => a.tagId === tag.id);
                const isUnack = tag.alarmState === 'ACTIVE_UNACK';
                const isCritical = tag.alarmSeverity === 'CRITICAL';

                return (
                  <tr
                    key={tag.id}
                    className={`hover:bg-[#141d2e] transition-colors ${
                      isUnack
                        ? isCritical
                          ? 'bg-red-950/40 text-red-100 font-bold animate-pulse'
                          : 'bg-amber-950/40 text-amber-100 font-bold'
                        : 'text-gray-300'
                    }`}
                  >
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {tag.alarmSeverity}
                      </span>
                    </td>
                    <td
                      className="p-2.5 font-bold text-cyan-300 cursor-pointer hover:underline"
                      onClick={() => openFaceplate(tag.id)}
                    >
                      {tag.id}
                    </td>
                    <td className="p-2.5 text-amber-300 font-bold">{alarmCfg?.condition || 'TRIP'}</td>
                    <td className="p-2.5 font-bold text-white">{typeof tag.measuredValue === 'number' && !isNaN(tag.measuredValue) ? tag.measuredValue.toFixed(2) : String(tag.measuredValue ?? '0.00')}</td>
                    <td className="p-2.5">
                      <div>{alarmCfg?.message || `Abnormal condition on ${tag.id}`}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        Consequence: {alarmCfg?.consequence}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {tag.alarmState}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {isUnack ? (
                        <button
                          onClick={() => acknowledgeAlarm(alarmCfg ? alarmCfg.id : `ALM_${tag.id}`)}
                          className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded font-bold text-[10px] shadow"
                        >
                          ACK
                        </button>
                      ) : (
                        <span className="text-gray-500 text-[10px]">ACKED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Alarm Philosophy / Guidance Note */}
      <div className="bg-[#0f1726] border border-gray-800 rounded-lg p-3 text-[11px] text-gray-400 space-y-1">
        <div className="font-bold text-gray-300">OPERATOR TRAINING GUIDELINES (ISA-18.2):</div>
        <div>• Acknowledging an alarm does <strong>NOT</strong> clear the process upset; it only confirms receipt of information.</div>
        <div>• Return to normal occurs automatically once the process variable returns to the safe operating window.</div>
        <div>• Always check the cause of the alarm on the Level 2 Unit screen or Faceplate before making adjustments.</div>
      </div>
    </div>
  );
};
