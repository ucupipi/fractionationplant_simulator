import { Plant3Model } from '../simulation/units/Plant3Model';
import { INITIAL_CONDITIONS } from '../data/initial-conditions';

const sim = new Plant3Model();

let intervalTimer: any = null;
const PHYSICS_DT = 0.1; // 100ms internal physics step
const PUBLISH_INTERVAL_MS = 250; // 250ms UI update rate (4 Hz telemetry)

function startLoop() {
  if (intervalTimer) return;
  intervalTimer = setInterval(() => {
    // Run physics steps
    sim.step(PHYSICS_DT);

    // Send telemetry to main thread
    const telemetry = sim.getLiveTelemetry();
    self.postMessage({ type: 'TELEMETRY', payload: telemetry });
  }, PHYSICS_DT * 1000);
}

function stopLoop() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START':
      sim.isRunning = true;
      startLoop();
      break;

    case 'STOP':
      sim.isRunning = false;
      stopLoop();
      break;

    case 'SET_SPEED':
      sim.simSpeed = payload.speed;
      break;

    case 'SET_CONTROLLER_MODE': {
      const ctrl = sim.controllers.get(payload.tagId);
      if (ctrl) {
        ctrl.setMode(payload.mode);
      }
      break;
    }

    case 'SET_CONTROLLER_SP': {
      const ctrl = sim.controllers.get(payload.tagId);
      if (ctrl) {
        ctrl.setSP(payload.sp);
      }
      break;
    }

    case 'SET_CONTROLLER_MV': {
      const ctrl = sim.controllers.get(payload.tagId);
      if (ctrl) {
        ctrl.setManualMV(payload.mv);
      }
      break;
    }

    case 'START_PUMP': {
      const pump = sim.pumps.get(payload.pumpId);
      if (pump) {
        pump.start();
      }
      break;
    }

    case 'STOP_PUMP': {
      const pump = sim.pumps.get(payload.pumpId);
      if (pump) {
        pump.stop();
      }
      break;
    }

    case 'RESET_PUMP_TRIP': {
      const pump = sim.pumps.get(payload.pumpId);
      if (pump) {
        pump.resetTrip();
      }
      break;
    }

    case 'INJECT_FAULT':
      sim.injectScenario(payload.scenarioId, payload.severity, payload.rampSeconds);
      break;

    case 'CLEAR_FAULT':
      sim.clearScenario(payload.scenarioId);
      break;

    case 'ACKNOWLEDGE_ALARM':
      sim.alarmEngine.acknowledgeAlarm(payload.alarmId, sim.simTimeSeconds);
      break;

    case 'ACKNOWLEDGE_ALL_ALARMS':
      sim.alarmEngine.acknowledgeAll(sim.simTimeSeconds);
      break;

    case 'LOAD_SNAPSHOT':
      if (INITIAL_CONDITIONS[payload.snapshotId]) {
        sim.loadSnapshot(INITIAL_CONDITIONS[payload.snapshotId]);
      } else if (payload.customSnapshot) {
        sim.loadSnapshot(payload.customSnapshot);
      }
      break;

    case 'GET_DIAGNOSTIC_DATA': {
      // Returns full true vs measured comparison for instructor view
      const diagData: any = {};
      for (const [id, tx] of sim.transmitters) {
        diagData[id] = {
          trueValue: tx.trueValue,
          measuredValue: tx.measuredValue,
          bias: tx.bias,
          frozen: tx.frozen
        };
      }
      self.postMessage({ type: 'DIAGNOSTIC_DATA', payload: diagData });
      break;
    }
  }
};


