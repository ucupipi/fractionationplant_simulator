import { create } from 'zustand';
import { TagLiveValue, TAG_METADATA_REGISTRY } from '../data/tags';
import { INITIAL_CONDITIONS } from '../data/initial-conditions';
import { simulationEngine } from '../simulation/engine';
import { simWorkerClient } from '../workers/simWorkerClient';

export interface TrendDataPoint {
  time: number;
  pv: number;
  sp?: number;
  mv?: number;
}

export interface SimulationStoreState {
  simTimeSeconds: number;
  isRunning: boolean;
  simSpeed: number;
  tags: Record<string, TagLiveValue>;
  pumps: Record<string, { running: boolean; available: boolean; tripped: boolean; amps: number }>;
  activeFaults: string[];
  unackAlarmCount: number;
  history: Record<string, TrendDataPoint[]>;

  // Actions
  tick: (dt: number) => void;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  setControllerMode: (tagId: string, mode: 'MAN' | 'AUTO' | 'CAS') => void;
  setControllerSP: (tagId: string, sp: number) => void;
  setControllerMV: (tagId: string, mv: number) => void;
  startPump: (pumpId: string) => void;
  stopPump: (pumpId: string) => void;
  resetPumpTrip: (pumpId: string) => void;
  injectFault: (scenarioId: string, severity?: number, rampSeconds?: number) => void;
  clearFault: (scenarioId: string) => void;
  acknowledgeAlarm: (alarmId: string) => void;
  acknowledgeAllAlarms: () => void;
  loadSnapshot: (snapshotId: string, customSnapshot?: any) => void;
  updateTelemetry: (telemetry: any) => void;
}

// Initial state snapshot
const initialTelemetry = simulationEngine.getLiveTelemetry();

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  simTimeSeconds: initialTelemetry.simTimeSeconds,
  isRunning: true,
  simSpeed: 1.0,
  tags: initialTelemetry.tags,
  pumps: initialTelemetry.pumps,
  activeFaults: initialTelemetry.activeFaults,
  unackAlarmCount: initialTelemetry.unackAlarmCount,
  history: {},

  tick: (dt: number) => {
    const { isRunning, simSpeed, history } = get();
    if (!isRunning) return;

    // Step the physics engine
    simulationEngine.step(dt * simSpeed);
    const telemetry = simulationEngine.getLiveTelemetry();

    // Update trend history buffers (limit 300 points per tag)
    const newHistory = { ...history };
    const currentTime = telemetry.simTimeSeconds;

    for (const [tagId, tag] of Object.entries(telemetry.tags)) {
      if (!newHistory[tagId]) {
        newHistory[tagId] = [];
      }
      newHistory[tagId].push({
        time: currentTime,
        pv: tag.measuredValue,
        sp: tag.sp,
        mv: tag.mv
      });
      if (newHistory[tagId].length > 300) {
        newHistory[tagId].shift();
      }
    }

    set({
      simTimeSeconds: telemetry.simTimeSeconds,
      isRunning: telemetry.isRunning,
      simSpeed: telemetry.simSpeed,
      tags: telemetry.tags,
      pumps: telemetry.pumps,
      activeFaults: telemetry.activeFaults,
      unackAlarmCount: telemetry.unackAlarmCount,
      history: newHistory
    });
  },

  setRunning: (running) => {
    simulationEngine.isRunning = running;
    simWorkerClient.postMessage({ type: running ? 'START' : 'STOP' });
    set({ isRunning: running });
  },

  setSpeed: (speed) => {
    simulationEngine.simSpeed = speed;
    simWorkerClient.postMessage({ type: 'SET_SPEED', payload: { speed } });
    set({ simSpeed: speed });
  },

  setControllerMode: (tagId, mode) => {
    const ctrl = simulationEngine.controllers.get(tagId);
    if (ctrl) {
      ctrl.setMode(mode);
    }
    simWorkerClient.postMessage({ type: 'SET_CONTROLLER_MODE', payload: { tagId, mode } });
    const tags = { ...get().tags };
    if (tags[tagId]) {
      tags[tagId] = { ...tags[tagId], mode };
      set({ tags });
    }
  },

  setControllerSP: (tagId, sp) => {
    const ctrl = simulationEngine.controllers.get(tagId);
    if (ctrl) {
      ctrl.setSP(sp);
    }
    simWorkerClient.postMessage({ type: 'SET_CONTROLLER_SP', payload: { tagId, sp } });
    const tags = { ...get().tags };
    if (tags[tagId]) {
      tags[tagId] = { ...tags[tagId], sp };
      set({ tags });
    }
  },

  setControllerMV: (tagId, mv) => {
    const ctrl = simulationEngine.controllers.get(tagId);
    if (ctrl) {
      ctrl.setManualMV(mv);
    }
    simWorkerClient.postMessage({ type: 'SET_CONTROLLER_MV', payload: { tagId, mv } });
    const tags = { ...get().tags };
    if (tags[tagId]) {
      tags[tagId] = { ...tags[tagId], mv };
      set({ tags });
    }
  },

  startPump: (pumpId) => {
    const pump = simulationEngine.pumps.get(pumpId);
    if (pump) {
      pump.start();
    }
    simWorkerClient.postMessage({ type: 'START_PUMP', payload: { pumpId } });
    const pumps = { ...get().pumps };
    if (pumps[pumpId]) {
      pumps[pumpId] = { ...pumps[pumpId], running: true, tripped: false, amps: 28.5 };
      set({ pumps });
    }
  },

  stopPump: (pumpId) => {
    const pump = simulationEngine.pumps.get(pumpId);
    if (pump) {
      pump.stop();
    }
    simWorkerClient.postMessage({ type: 'STOP_PUMP', payload: { pumpId } });
    const pumps = { ...get().pumps };
    if (pumps[pumpId]) {
      pumps[pumpId] = { ...pumps[pumpId], running: false, amps: 0 };
      set({ pumps });
    }
  },

  resetPumpTrip: (pumpId) => {
    const pump = simulationEngine.pumps.get(pumpId);
    if (pump) {
      pump.resetTrip();
    }
    simWorkerClient.postMessage({ type: 'RESET_PUMP_TRIP', payload: { pumpId } });
    const pumps = { ...get().pumps };
    if (pumps[pumpId]) {
      pumps[pumpId] = { ...pumps[pumpId], tripped: false, available: true };
      set({ pumps });
    }
  },

  injectFault: (scenarioId, severity = 70, rampSeconds = 10) => {
    simulationEngine.injectScenario(scenarioId, severity, rampSeconds);
    simWorkerClient.postMessage({ type: 'INJECT_FAULT', payload: { scenarioId, severity, rampSeconds } });
    const telemetry = simulationEngine.getLiveTelemetry();
    set({
      activeFaults: telemetry.activeFaults,
      tags: telemetry.tags
    });
  },

  clearFault: (scenarioId) => {
    simulationEngine.clearScenario(scenarioId);
    simWorkerClient.postMessage({ type: 'CLEAR_FAULT', payload: { scenarioId } });
    const telemetry = simulationEngine.getLiveTelemetry();
    set({
      activeFaults: telemetry.activeFaults,
      tags: telemetry.tags
    });
  },

  acknowledgeAlarm: (alarmId) => {
    simulationEngine.alarmEngine.acknowledgeAlarm(alarmId, simulationEngine.simTimeSeconds);
    simWorkerClient.postMessage({ type: 'ACKNOWLEDGE_ALARM', payload: { alarmId } });
    const telemetry = simulationEngine.getLiveTelemetry();
    set({
      unackAlarmCount: telemetry.unackAlarmCount,
      tags: telemetry.tags
    });
  },

  acknowledgeAllAlarms: () => {
    simulationEngine.alarmEngine.acknowledgeAll(simulationEngine.simTimeSeconds);
    simWorkerClient.postMessage({ type: 'ACKNOWLEDGE_ALL_ALARMS' });
    const telemetry = simulationEngine.getLiveTelemetry();
    set({
      unackAlarmCount: telemetry.unackAlarmCount,
      tags: telemetry.tags
    });
  },

  loadSnapshot: (snapshotId, customSnapshot) => {
    if (INITIAL_CONDITIONS[snapshotId]) {
      simulationEngine.loadSnapshot(INITIAL_CONDITIONS[snapshotId]);
      simWorkerClient.postMessage({ type: 'LOAD_SNAPSHOT', payload: { snapshotId } });
    } else if (customSnapshot) {
      simulationEngine.loadSnapshot(customSnapshot);
      simWorkerClient.postMessage({ type: 'LOAD_SNAPSHOT', payload: { customSnapshot } });
    }
    const telemetry = simulationEngine.getLiveTelemetry();
    set({
      simTimeSeconds: telemetry.simTimeSeconds,
      isRunning: telemetry.isRunning,
      tags: telemetry.tags,
      pumps: telemetry.pumps,
      activeFaults: telemetry.activeFaults,
      unackAlarmCount: telemetry.unackAlarmCount,
      history: {}
    });
  },

  updateTelemetry: (telemetry) => {
    set({
      simTimeSeconds: telemetry.simTimeSeconds,
      isRunning: telemetry.isRunning,
      simSpeed: telemetry.simSpeed,
      tags: telemetry.tags,
      pumps: telemetry.pumps,
      activeFaults: telemetry.activeFaults,
      unackAlarmCount: telemetry.unackAlarmCount
    });
  }
}));
