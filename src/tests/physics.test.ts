import { describe, it, expect, beforeEach } from 'vitest';
import { Plant3Model } from '../simulation/units/Plant3Model';
import { INITIAL_CONDITIONS } from '../data/initial-conditions';

describe('Plant-3 Directional Physics & Dynamic Model Validation', () => {
  let sim: Plant3Model;

  beforeEach(() => {
    sim = new Plant3Model();
    sim.loadSnapshot(INITIAL_CONDITIONS['NormalTrainingBaseline']);
  });

  it('V01: Condenser capacity loss (S06) causes column pressure to increase', () => {
    const initialPressure = sim.transmitters.get('PIC3')!.trueValue;
    expect(initialPressure).toBeCloseTo(30.0, 1);

    // Inject S06: 3E-5 refrigeration degradation
    sim.injectScenario('S06', 80, 5);

    // Simulate 30 seconds
    for (let i = 0; i < 300; i++) {
      sim.step(0.1);
    }

    const upsetPressure = sim.transmitters.get('PIC3')!.trueValue;
    expect(upsetPressure).toBeGreaterThan(initialPressure + 0.5);
  });

  it('V02: Reflux pump trip (S02) causes reflux flow to drop and top temperature to rise', () => {
    const initialReflux = sim.transmitters.get('FIC6')!.trueValue;
    expect(initialReflux).toBeGreaterThan(20);

    // Inject S02: 3G-2 Reflux Pump trip
    sim.injectScenario('S02', 100, 1);

    // Step 5 seconds
    for (let i = 0; i < 50; i++) {
      sim.step(0.1);
    }

    const droppedReflux = sim.transmitters.get('FIC6')!.trueValue;
    expect(droppedReflux).toBeLessThan(2.0);

    // Step another 30 seconds
    for (let i = 0; i < 300; i++) {
      sim.step(0.1);
    }

    const topTemp = sim.transmitters.get('TI171')!.trueValue;
    expect(topTemp).toBeGreaterThan(-30.8);
  });

  it('V03: Reboiler steam valve stuck open (S10) increases vapor traffic and column dP', () => {
    const initialDP = sim.transmitters.get('3C-4_DP')!.trueValue;

    // Inject S10: Steam valve stuck open
    sim.injectScenario('S10', 100, 2);

    for (let i = 0; i < 200; i++) {
      sim.step(0.1);
    }

    const highDP = sim.transmitters.get('3C-4_DP')!.trueValue;
    expect(highDP).toBeGreaterThan(initialDP);
  });

  it('V05: Transmitter bias (S15) changes measured value instantly while true value moves via controller action', () => {
    const initialTrue = sim.transmitters.get('PIC3')!.trueValue;
    const initialMeasured = sim.transmitters.get('PIC3')!.measuredValue;
    expect(initialTrue).toBeCloseTo(30.0, 1);
    expect(initialMeasured).toBeCloseTo(30.0, 1);

    // Inject S15: +3.0 kg/cm² bias
    sim.injectScenario('S15', 100, 0);
    for (let i = 0; i < 15; i++) {
      sim.step(0.1);
    }

    const biasedMeasured = sim.transmitters.get('PIC3')!.measuredValue;
    const biasedTrue = sim.transmitters.get('PIC3')!.trueValue;

    // Measured value jumps by ~3.0
    expect(biasedMeasured).toBeGreaterThanOrEqual(32.5);
    // True value remains close to 30.0 initially (before controller drives it down)
    expect(Math.abs(biasedTrue - 30.0)).toBeLessThan(0.5);
  });

  it('V06: Level transmitter frozen (S16) keeps measured value static while true level moves', () => {
    sim.injectScenario('S16', 100, 0);
    sim.step(0.1);

    const initialFrozenMeasured = sim.transmitters.get('LIC4')!.measuredValue;

    // Trip pump to induce mass imbalance
    sim.injectScenario('S02', 100, 1);
    for (let i = 0; i < 200; i++) {
      sim.step(0.1);
    }

    const laterMeasured = sim.transmitters.get('LIC4')!.measuredValue;
    const laterTrue = sim.transmitters.get('LIC4')!.trueValue;

    expect(laterMeasured).toBe(initialFrozenMeasured);
    expect(laterTrue).not.toBe(initialFrozenMeasured);
  });

  it('V08: Deterministic reset restores initial condition accurately', () => {
    // Cause upset
    sim.injectScenario('S06', 90, 5);
    for (let i = 0; i < 150; i++) {
      sim.step(0.1);
    }

    // Reset snapshot
    sim.loadSnapshot(INITIAL_CONDITIONS['NormalTrainingBaseline']);

    expect(sim.transmitters.get('PIC3')!.trueValue).toBeCloseTo(30.0, 1);
    expect(sim.transmitters.get('FIC6')!.trueValue).toBeCloseTo(INITIAL_CONDITIONS['NormalTrainingBaseline'].tags['FIC6'].trueValue, 1);
    expect(sim.activeFaults.size).toBe(0);
  });

  it('V11: Scrub column TIC1 increase causes 3C-1 level (LIC2) to drop and 3C-2 level (LIC3) to rise', () => {
    sim.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
    const initialLIC2 = sim.transmitters.get('LIC2')!.trueValue;
    const initialLIC3 = sim.transmitters.get('LIC3')!.trueValue;

    // Increase TIC1 SP / MV to simulate more reboiler steam
    const tic1 = sim.controllers.get('TIC1')!;
    tic1.setMode('MAN');
    tic1.setManualMV(85.0); // Increase steam from 55% to 85%

    // Simulate 30 seconds
    for (let i = 0; i < 300; i++) {
      sim.step(0.1);
    }

    const newLIC2 = sim.transmitters.get('LIC2')!.trueValue;
    const newLIC3 = sim.transmitters.get('LIC3')!.trueValue;
    const newRebVap = sim.transmitters.get('TI157')!.trueValue;

    // Reboiler vapor temperature increased
    expect(newRebVap).toBeGreaterThan(110.0);
    // LIC2 (3C-1 level) dropped because more liquid was boiled off
    expect(newLIC2).toBeLessThan(initialLIC2);
    // LIC3 (3C-2 level) rose because more overhead vapor was condensed
    expect(newLIC3).toBeGreaterThan(initialLIC3);
  });

  it('V12: Butane recycle (HIC110/FIC1) increase causes 3C-2 level (LIC3) to rise', () => {
    sim.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
    const initialLIC3 = sim.transmitters.get('LIC3')!.trueValue;

    // Increase HIC110 manual loader
    const hic110 = sim.controllers.get('HIC110')!;
    hic110.setManualMV(60.0); // Increase from 37.3% to 60.0%

    // Simulate 20 seconds
    for (let i = 0; i < 200; i++) {
      sim.step(0.1);
    }

    const newLIC3 = sim.transmitters.get('LIC3')!.trueValue;
    expect(newLIC3).toBeGreaterThan(initialLIC3);
  });

  it('V13: Scrub reflux pump trip (S01) drops reflux flow, warms TI158 overhead, and increases LIC3', () => {
    sim.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
    const initialTI158 = sim.transmitters.get('TI158')!.trueValue;
    const initialLIC3 = sim.transmitters.get('LIC3')!.trueValue;

    // Inject S01: 3G-1 Reflux pump trip
    sim.injectScenario('S01', 100, 1);

    for (let i = 0; i < 200; i++) {
      sim.step(0.1);
    }

    const droppedReflux = sim.transmitters.get('FIC3')!.trueValue;
    const newTI158 = sim.transmitters.get('TI158')!.trueValue;
    const newLIC3 = sim.transmitters.get('LIC3')!.trueValue;

    expect(droppedReflux).toBeLessThan(1.0);
    expect(newTI158).toBeGreaterThan(initialTI158); // Overhead warmed up due to lack of reflux
    expect(newLIC3).toBeGreaterThan(initialLIC3); // Drum accumulated liquid
  });

  it('V14: Increasing bottom flow to 3C-4 (FIC2) causes 3C-1 level (LIC2) to decrease', () => {
    sim.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
    const initialLIC2 = sim.transmitters.get('LIC2')!.trueValue;
    const initialFIC2 = sim.transmitters.get('FIC2')!.trueValue;

    // Increase FIC2 SP from 87 to 115 m3/h
    const fic2 = sim.controllers.get('FIC2')!;
    fic2.setMode('AUTO');
    fic2.setSP(115.0);

    // Simulate 30 seconds
    for (let i = 0; i < 300; i++) {
      sim.step(0.1);
    }

    const newFIC2 = sim.transmitters.get('FIC2')!.trueValue;
    const newLIC2 = sim.transmitters.get('LIC2')!.trueValue;

    // Bottom flow increased
    expect(newFIC2).toBeGreaterThan(initialFIC2 + 10.0);
    // Level 3C-1 (LIC2) decreased due to higher bottom drainage rate to 3C-4
    expect(newLIC2).toBeLessThan(initialLIC2 - 0.2);
  });
});
