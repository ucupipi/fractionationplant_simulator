import React, { useEffect } from 'react';
import { useDCSStore } from '../stores/dcsStore';
import { useSimulationStore } from '../stores/simulationStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import { DCSHeader } from '../components/dcs/DCSHeader';
import { AlarmBanner } from '../components/dcs/AlarmBanner';
import { DCSBottomNav } from '../components/dcs/DCSBottomNav';
import { FaceplatePID } from '../components/dcs/FaceplatePID';
import { PumpPopup } from '../components/dcs/PumpPopup';
import { TransmitterPopup } from '../components/dcs/TransmitterPopup';

// Process Graphics & Pages
import { OverviewGraphic } from '../graphics/plant3/OverviewGraphic';
import { DeEthanizerGraphic } from '../graphics/plant3/DeEthanizerGraphic';
import { ScrubColumnGraphic } from '../graphics/plant3/ScrubColumnGraphic';
import { DePropanizerGraphic } from '../graphics/plant3/DePropanizerGraphic';
import { DeButanizerGraphic } from '../graphics/plant3/DeButanizerGraphic';
import { RefrigerationGraphic } from '../graphics/plant3/RefrigerationGraphic';
import { TrendViewer } from '../components/dcs/TrendViewer';
import { AlarmSummary } from '../components/dcs/AlarmSummary';
import { InstructorPanel } from '../components/instructor/InstructorPanel';
import { AboutPage } from '../pages/AboutPage';

export const App: React.FC = () => {
  const { activeScreen, setActiveScreen, userRole, toggleHornSilence } = useDCSStore();
  const { unackAlarmCount, isRunning, setRunning, acknowledgeAllAlarms } = useSimulationStore();

  // Simulation tick loop: runs physics at 10 Hz (100ms)
  useEffect(() => {
    const timer = setInterval(() => {
      useSimulationStore.getState().tick(0.1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener: F1-F12, Space, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useDCSStore.getState().closeFaceplate();
        useDCSStore.getState().closePumpPopup();
        useDCSStore.getState().closeTransmitterPopup();
      } else if (e.key === 'F1') {
        e.preventDefault();
        setActiveScreen('OVERVIEW');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveScreen('SCRUB');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveScreen('DE_ETHANIZER');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveScreen('DE_PROPANIZER');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveScreen('DE_BUTANIZER');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveScreen('REFRIGERATION');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveScreen('TREND');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveScreen('ALARMS');
      } else if (e.key === 'F9') {
        e.preventDefault();
        useLayoutStore.getState().toggleEditMode();
      } else if (e.key === 'F10') {
        e.preventDefault();
        toggleHornSilence();
      } else if (e.key === 'F11') {
        e.preventDefault();
        acknowledgeAllAlarms();
      } else if (e.key === 'F12') {
        e.preventDefault();
        setRunning(!isRunning);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, setActiveScreen, toggleHornSilence, acknowledgeAllAlarms, setRunning]);

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'OVERVIEW':
        return <OverviewGraphic />;
      case 'SCRUB':
        return <ScrubColumnGraphic />;
      case 'DE_ETHANIZER':
        return <DeEthanizerGraphic />;
      case 'DE_PROPANIZER':
        return <DePropanizerGraphic />;
      case 'DE_BUTANIZER':
        return <DeButanizerGraphic />;
      case 'REFRIGERATION':
        return <RefrigerationGraphic />;
      case 'TREND':
        return <TrendViewer />;
      case 'ALARMS':
        return <AlarmSummary />;
      case 'INSTRUCTOR':
        return <InstructorPanel />;
      case 'ABOUT':
        return <AboutPage />;
      default:
        return <OverviewGraphic />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#000000] text-gray-200 overflow-hidden font-mono select-none">
      {/* DCS Top Header */}
      <DCSHeader />

      {/* Flashing Top Alarm Banner */}
      <AlarmBanner />

      {/* Main Process Graphic / Workspace */}
      <main className="flex-1 min-h-0 min-w-0 w-full h-full relative overflow-hidden flex items-center justify-center bg-[#000000]">
        {renderActiveScreen()}

        {/* Floating Modals & Popups */}
        <FaceplatePID />
        <PumpPopup />
        {userRole === 'INSTRUCTOR' && <TransmitterPopup />}
      </main>

      {/* 12-Button Yokogawa Operator Softkeys */}
      <DCSBottomNav />

      {/* Bottom Status Line (Yokogawa CENTUM VP bottom status bar) */}
      <footer className="bg-[#0b1219] border-t border-[#141f2c] px-3 py-0.5 text-[10.5px] font-mono text-gray-400 flex items-center justify-between select-none z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="text-white font-bold">SIMULATION: {isRunning ? 'REALTIME ODE SOLVER (100ms)' : 'FREEZED'}</span>
          </span>
          <span className="text-gray-600">|</span>
          <span>STATION: OTS-HIS-01</span>
          <span className="text-gray-600">|</span>
          <span>DOMAIN: PLANT-3 (TRAIN-H)</span>
          <span className="text-gray-600">|</span>
          <span>ROLE: {userRole}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-500">HOTKEYS: [F1..F12] / [ESC: CLOSE POPUP]</span>
          <span className="text-gray-600">|</span>
          <span className="text-cyan-400 font-bold tracking-wider">BADAK LNG OTS — YOKOGAWA CENTUM VP</span>
        </div>
      </footer>
    </div>
  );
};
