import React, { useState } from 'react';
import { useDCSStore, DCSScreenId } from '../../stores/dcsStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldAlert,
  Key,
  Sparkles
} from 'lucide-react';

export const DCSHeader: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    userRole,
    setUserRole,
    hornSilenced,
    toggleHornSilence,
    openFaceplate
  } = useDCSStore();

  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const toggleEditMode = useLayoutStore((s) => s.toggleEditMode);

  const {
    simTimeSeconds,
    isRunning,
    setRunning,
    simSpeed,
    setSpeed,
    unackAlarmCount,
    loadSnapshot
  } = useSimulationStore();

  const [commandInput, setCommandInput] = useState<string>('');

  // Format simulated time into HH:MM:SS
  const formatTime = (secs: number) => {
    const totalSecs = Math.floor(secs);
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toUpperCase();
    if (!cmd) return;

    const screenMap: Record<string, DCSScreenId> = {
      GRH0033: 'SCRUB',
      SCRUB: 'SCRUB',
      '3C-1': 'SCRUB',
      GRH0034: 'DE_ETHANIZER',
      DE_ETHANIZER: 'DE_ETHANIZER',
      DEETH: 'DE_ETHANIZER',
      '3C-4': 'DE_ETHANIZER',
      GRH0035: 'DE_PROPANIZER',
      DE_PROPANIZER: 'DE_PROPANIZER',
      DEPROP: 'DE_PROPANIZER',
      '3C-6': 'DE_PROPANIZER',
      GRH0036: 'DE_BUTANIZER',
      DE_BUTANIZER: 'DE_BUTANIZER',
      DEBUT: 'DE_BUTANIZER',
      '3C-8': 'DE_BUTANIZER',
      OVERVIEW: 'OVERVIEW',
      REFRIG: 'REFRIGERATION',
      REFRIGERATION: 'REFRIGERATION',
      '4K-1': 'REFRIGERATION',
      TREND: 'TREND',
      ALARMS: 'ALARMS',
      INSTRUCTOR: 'INSTRUCTOR'
    };

    if (screenMap[cmd]) {
      setActiveScreen(screenMap[cmd]);
      setCommandInput('');
      return;
    }

    // Direct ISA tag entry
    openFaceplate(cmd);
    setCommandInput('');
  };

  return (
    <header className="bg-[#1b2737] text-gray-200 text-xs select-none border-b border-[#0a0f18] z-30 font-mono">
      {/* ==================== 1. TOPMOST CENTUM VP SYSTEM TITLE BAR ==================== */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-[#253549] border-b border-[#141f2c] h-9">
        {/* Left: Alarm Status Annunciators */}
        <div className="flex items-center gap-1">
          {/* Red/White Critical Light */}
          <div className="flex items-center gap-1 bg-[#15202d] px-1.5 py-0.5 border border-gray-600">
            <span className={`w-2.5 h-2.5 ${unackAlarmCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className="font-bold text-[10.5px] text-white">ALM: {unackAlarmCount}</span>
          </div>

          {/* Yellow Warning */}
          <div className="flex items-center gap-1 bg-[#15202d] px-1.5 py-0.5 border border-gray-600">
            <span className="w-2.5 h-2.5 bg-amber-400"></span>
            <span className="font-bold text-[10.5px] text-amber-300">PROC</span>
          </div>

          {/* Green System OK */}
          <div className="flex items-center gap-1 bg-[#15202d] px-1.5 py-0.5 border border-gray-600">
            <span className="w-2.5 h-2.5 bg-emerald-400"></span>
            <span className="font-bold text-[10.5px] text-emerald-300">FCS OK</span>
          </div>

          {/* Silence Horn Button */}
          <button
            onClick={toggleHornSilence}
            className={`p-1 border ml-1 ${
              hornSilenced ? 'bg-amber-900 border-amber-500 text-amber-300' : 'bg-[#1e2a38] border-gray-600 text-gray-300'
            }`}
            title={hornSilenced ? 'Horn Silenced' : 'Silence Horn'}
          >
            {hornSilenced ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>

        {/* Center: Command Input Bar */}
        <form onSubmit={handleCommandSubmit} className="flex-1 max-w-lg mx-3">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="ENTER GRAPHIC (e.g. GRH0033) OR TAG (e.g. TIC1, TI157, 4E-12)"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="w-full bg-[#000000] text-white font-mono font-bold text-[11px] px-2 py-0.5 border border-gray-500 focus:outline-none focus:border-cyan-400 placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="absolute right-1 text-cyan-400 hover:text-white font-bold text-[10px] px-1"
            >
              ↵
            </button>
          </div>
        </form>

        {/* Right: Clock, Speed, Role, Yokogawa Logo & User Key */}
        <div className="flex items-center gap-2 text-xs">
          {/* Simulation Run / Freeze */}
          <div className="flex items-center gap-0.5 bg-[#121a24] p-0.5 border border-gray-700">
            <button
              onClick={() => setRunning(!isRunning)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold border ${
                isRunning ? 'bg-emerald-700 text-white border-emerald-500' : 'bg-amber-600 text-white border-amber-400 animate-pulse'
              }`}
            >
              {isRunning ? <Play size={9} fill="white" /> : <Pause size={9} fill="white" />}
              {isRunning ? 'RUN' : 'FREEZE'}
            </button>

            <button
              onClick={() => loadSnapshot('ScreenshotBaseline_2024-05-27')}
              className="p-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
              title="Reset to Baseline"
            >
              <RotateCcw size={9} />
            </button>

            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-1 py-0.5 text-[9px] font-bold border ${
                  simSpeed === spd ? 'bg-blue-600 text-white border-blue-400' : 'text-gray-400 border-transparent hover:bg-gray-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center bg-[#121a24] p-0.5 border border-gray-700 text-[9.5px]">
            <button
              onClick={() => setUserRole('TRAINEE')}
              className={`px-1.5 py-0.5 font-bold ${
                userRole === 'TRAINEE' ? 'bg-emerald-800 text-white' : 'text-gray-400'
              }`}
            >
              TRAINEE
            </button>
            <button
              onClick={() => setUserRole('INSTRUCTOR')}
              className={`px-1.5 py-0.5 font-bold ${
                userRole === 'INSTRUCTOR' ? 'bg-purple-800 text-white' : 'text-gray-400'
              }`}
            >
              INSTRUCTOR
            </button>
          </div>

          {/* Instructor Fault Injector Button */}
          {userRole === 'INSTRUCTOR' && (
            <button
              onClick={() => setActiveScreen('INSTRUCTOR')}
              className={`flex items-center gap-1 px-2 py-0.5 font-mono font-bold text-[9.5px] border ${
                activeScreen === 'INSTRUCTOR'
                  ? 'bg-purple-800 text-white border-purple-400'
                  : 'bg-purple-950 text-purple-200 border-purple-700 hover:bg-purple-900'
              }`}
            >
              <ShieldAlert size={10} />
              FAULT INJECTOR
            </button>
          )}

          {/* Layout Editor Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold border transition-colors ${
              isEditMode
                ? 'bg-cyan-500 text-black border-cyan-300 animate-pulse'
                : 'bg-[#121a24] text-cyan-400 border-cyan-800 hover:bg-[#1e2a38] hover:text-white'
            }`}
            title="Toggle Drag-and-Drop Layout Editor (F9)"
          >
            <Sparkles size={9} />
            <span>{isEditMode ? 'EDITING (F9)' : 'EDIT UI (F9)'}</span>
          </button>

          {/* Realtime Date & Sim Clock */}
          <div className="font-mono text-gray-100 text-[10.5px] font-bold bg-[#0e1620] px-2 py-0.5 border border-gray-700">
            27-MAY-2024 {formatTime(simTimeSeconds)}
          </div>

          {/* Yokogawa Brand Logo */}
          <div className="flex items-center gap-1 font-bold text-white tracking-wider text-[10.5px]">
            <span className="w-2 h-2 bg-blue-500 transform rotate-45 inline-block"></span>
            <span>YOKOGAWA</span>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-1 text-[10px] text-gray-300 font-mono">
            <Key size={10} className="text-amber-400" />
            <span>ENGUSER (S3)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
