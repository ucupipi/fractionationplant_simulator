import React, { useState } from 'react';
import { useInstructorStore } from '../../stores/instructorStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { SCENARIO_LIBRARY, ScenarioCategory } from '../../data/scenarios';
import { INITIAL_CONDITIONS } from '../../data/initial-conditions';
import {
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertOctagon,
  Download,
  Eye,
  Sliders,
  Award
} from 'lucide-react';

export const InstructorPanel: React.FC = () => {
  const {
    selectedScenarioId,
    selectScenario,
    customSeverity,
    setSeverity,
    customRampSeconds,
    setRamp,
    isArmed,
    armScenario,
    disarmScenario,
    injectActiveScenario,
    activeScenarioId,
    stopActiveScenario,
    calculateScore,
    sessionScore
  } = useInstructorStore();

  const {
    tags,
    pumps,
    isRunning,
    setRunning,
    simSpeed,
    setSpeed,
    loadSnapshot,
    activeFaults
  } = useSimulationStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);

  const selectedDef = SCENARIO_LIBRARY[selectedScenarioId];

  const filteredScenarios = Object.values(SCENARIO_LIBRARY).filter(
    (s) => categoryFilter === 'ALL' || s.category === categoryFilter
  );

  const handleExportDebriefJSON = () => {
    const score = sessionScore || calculateScore();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(score, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Plant3_OTS_Debrief_${selectedScenarioId}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="h-full w-full p-4 bg-[#070b14] text-gray-200 font-mono text-xs overflow-y-auto select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-800/80 mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-purple-400" />
          <h1 className="text-sm font-bold text-purple-300 tracking-wider">
            INSTRUCTOR INTERFERENCE STATION — ABNORMAL SCENARIO INJECTION & ASSESSMENT
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">SNAPSHOT:</span>
          <select
            onChange={(e) => loadSnapshot(e.target.value)}
            className="bg-[#121927] border border-gray-700 text-cyan-300 px-2 py-1 rounded text-xs outline-none"
          >
            <option value="ScreenshotBaseline_2024-05-27">Screenshot Baseline (27-May-2024)</option>
            <option value="NormalTrainingBaseline">Normal Training Baseline (100% Rate)</option>
            <option value="ReducedRateBaseline">Reduced Rate Baseline (70% Load)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Scenario Library (S01 - S20) */}
        <div className="col-span-4 bg-[#0c121e] border border-gray-800 rounded-lg p-3 flex flex-col h-[75vh]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-cyan-400">SCENARIO LIBRARY (20 SCENARIOS)</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#151d2e] border border-gray-700 text-[10px] text-gray-300 px-1.5 py-0.5 rounded outline-none"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="EQUIPMENT">EQUIPMENT</option>
              <option value="UTILITY">UTILITY</option>
              <option value="PROCESS">PROCESS</option>
              <option value="INSTRUMENT">INSTRUMENT</option>
              <option value="COMPOUND">COMPOUND</option>
            </select>
          </div>

          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
            {filteredScenarios.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              const isActive = activeFaults.includes(sc.id);

              return (
                <div
                  key={sc.id}
                  onClick={() => selectScenario(sc.id)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md text-white'
                      : 'bg-[#0f1726] border-gray-800 hover:bg-[#162133] text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-300">{sc.id}</span>
                      <span className="font-semibold text-xs truncate max-w-[170px]">{sc.title}</span>
                    </div>
                    {isActive && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{sc.unit}</span>
                    <span className="text-purple-400 font-bold">{sc.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Selected Scenario Parameters, ARM, & INJECT */}
        <div className="col-span-5 bg-[#0c121e] border border-gray-800 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
              <div>
                <span className="font-bold text-lg text-purple-300 mr-2">{selectedDef?.id}</span>
                <span className="font-bold text-white text-sm">{selectedDef?.title}</span>
              </div>
              <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-bold border border-purple-600">
                {selectedDef?.difficulty}
              </span>
            </div>

            <div className="text-gray-400 text-xs mb-4">{selectedDef?.description}</div>

            {/* Parameter Adjustment Controls */}
            <div className="space-y-4 bg-[#080d16] p-3 rounded border border-gray-800 mb-4">
              {/* Severity Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 font-bold">SEVERITY / DISTURBANCE MAGNITUDE:</span>
                  <span className="text-cyan-400 font-bold text-sm">{customSeverity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={customSeverity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Ramp Time */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 font-bold">RAMP TIME (SECONDS):</span>
                  <span className="text-amber-400 font-bold">{customRampSeconds} s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={customRampSeconds}
                  onChange={(e) => setRamp(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* Hidden Instructor Learning Context */}
            <div className="bg-[#0f1726] border border-purple-900/60 rounded p-2.5 space-y-2 text-[11px]">
              <div className="font-bold text-purple-300">EXPECTED SYMPTOM SEQUENCE:</div>
              <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                {selectedDef?.firstIndicators.map((ind, idx) => (
                  <li key={idx}>{ind}</li>
                ))}
              </ul>

              <div className="font-bold text-emerald-400 pt-1">RECOMMENDED OPERATOR ACTION:</div>
              <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                {selectedDef?.recommendedActions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ARM & INJECT Buttons (2-step Interlock) */}
          <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
            {activeScenarioId ? (
              <button
                onClick={stopActiveScenario}
                className="col-span-2 py-2.5 rounded bg-red-700 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <AlertOctagon size={16} />
                STOP & REPAIR ACTIVE FAULT ({activeScenarioId})
              </button>
            ) : (
              <>
                <button
                  onClick={() => (isArmed ? disarmScenario() : armScenario())}
                  className={`py-2.5 rounded font-bold flex items-center justify-center gap-2 transition-colors ${
                    isArmed
                      ? 'bg-amber-600 text-white shadow-lg animate-pulse'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                  }`}
                >
                  <Zap size={14} />
                  {isArmed ? 'DISARM FAULT' : '1. ARM FAULT'}
                </button>

                <button
                  onClick={injectActiveScenario}
                  disabled={!isArmed}
                  className={`py-2.5 rounded font-bold flex items-center justify-center gap-2 shadow-lg ${
                    isArmed
                      ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-800'
                  }`}
                >
                  <Play size={14} fill="currentColor" />
                  2. INJECT FAULT
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic True vs Measured Monitor & Debrief Score */}
        <div className="col-span-3 bg-[#0c121e] border border-gray-800 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
              <span className="font-bold text-cyan-400">PHYSICS TRUTH VS MEASURED</span>
              <Eye size={14} className="text-cyan-400" />
            </div>

            {/* Diagnostic Table */}
            <div className="space-y-2 mb-4">
              {['PIC3', 'TI171', 'FIC6', 'LIC4', 'LIC5', '3C-4_DP'].map((tagId) => {
                const tag = tags[tagId];
                if (!tag) return null;
                const isBiased = tag.bias && tag.bias !== 0;

                return (
                  <div key={tagId} className="bg-[#080d16] p-1.5 rounded border border-gray-800 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-cyan-300">{tagId}:</span>
                    <div className="text-right">
                      <span className="text-emerald-400 mr-2">True: {tag.trueValue.toFixed(1)}</span>
                      <span className={isBiased ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                        HMI: {tag.measuredValue.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trainee Evaluation & Score Summary */}
            <div className="bg-[#0f1726] border border-purple-900/60 rounded p-2.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-300 text-xs">TRAINEE SCORE:</span>
                <button
                  onClick={() => calculateScore()}
                  className="px-2 py-0.5 rounded bg-purple-800 hover:bg-purple-700 text-white text-[10px] font-bold"
                >
                  CALCULATE
                </button>
              </div>

              {sessionScore ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Alarm Response:</span>
                    <span className="text-emerald-400 font-bold">{sessionScore.alarmResponseScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Diagnosis Speed:</span>
                    <span className="text-cyan-400 font-bold">{sessionScore.diagnosisLatencyScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action Correctness:</span>
                    <span className="text-purple-300 font-bold">{sessionScore.actionSequenceScore}/100</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-800 text-xs font-bold">
                    <span className="text-white">OVERALL SCORE:</span>
                    <span className="text-emerald-300 text-sm">{sessionScore.totalScore} %</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-gray-500">Run an exercise to evaluate trainee timeline.</div>
              )}
            </div>
          </div>

          {/* Export JSON Report */}
          <button
            onClick={handleExportDebriefJSON}
            className="w-full py-2 rounded bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-gray-700 font-bold flex items-center justify-center gap-1 text-[11px] shadow mt-4"
          >
            <Download size={13} />
            EXPORT DEBRIEF JSON REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
