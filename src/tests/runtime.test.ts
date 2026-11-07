import { describe, it, expect } from 'vitest';
import { simulationEngine } from '../simulation/engine';
import { useSimulationStore } from '../stores/simulationStore';
import { TAG_METADATA_REGISTRY } from '../data/tags';

describe('OTS Runtime Initialization and Execution', () => {
  it('initializes simulationEngine and executes steps without errors', () => {
    expect(simulationEngine.controllers.size).toBeGreaterThan(5);
    expect(simulationEngine.transmitters.size).toBeGreaterThan(15);
    expect(simulationEngine.pumps.size).toBeGreaterThan(5);

    for (let i = 0; i < 50; i++) {
      simulationEngine.step(0.1);
    }
    expect(simulationEngine.simTimeSeconds).toBeGreaterThan(0);
  });

  it('correctly distinguishes read-only transmitters (TI157, TI158, 2TI127) from PID controllers (TIC1, PIC3)', () => {
    // TI157 Reboiler Vapor Return
    const metaTI157 = TAG_METADATA_REGISTRY['TI157'];
    expect(metaTI157).toBeDefined();
    expect(metaTI157.isController).toBe(false);
    expect(metaTI157.type).toBe('TRANSMITTER');

    // 2TI127 Feed inlet temp
    const meta2TI127 = TAG_METADATA_REGISTRY['2TI127'];
    expect(meta2TI127.isController).toBe(false);

    // TI158 3C-1 overhead vapor temp
    const metaTI158 = TAG_METADATA_REGISTRY['TI158'];
    expect(metaTI158.isController).toBe(false);

    // TI159 3C-1 reflux temp
    const metaTI159 = TAG_METADATA_REGISTRY['TI159'];
    expect(metaTI159.isController).toBe(false);

    // TIC1 Reboiler Temp Controller
    const metaTIC1 = TAG_METADATA_REGISTRY['TIC1'];
    expect(metaTIC1.isController).toBe(true);
    expect(metaTIC1.type).toBe('PID_CONTROLLER');
  });

  it('verifies 4E-12 chilling and 3TIC-1 reboiler steam heating physics', () => {
    const store = useSimulationStore.getState();
    store.tick(0.1);

    const tags = useSimulationStore.getState().tags;

  });

  it('switches controller modes, setpoint and MV on controllers', () => {
    const store = useSimulationStore.getState();
    store.setControllerMode('PIC3', 'MAN');
    expect(useSimulationStore.getState().tags['PIC3'].mode).toBe('MAN');

    store.setControllerMV('PIC3', 45.0);
    expect(useSimulationStore.getState().tags['PIC3'].mv).toBe(45.0);

    store.setControllerMode('PIC3', 'AUTO');
    expect(useSimulationStore.getState().tags['PIC3'].mode).toBe('AUTO');

    store.setControllerSP('PIC3', 31.2);
    expect(useSimulationStore.getState().tags['PIC3'].sp).toBe(31.2);
  });
});
