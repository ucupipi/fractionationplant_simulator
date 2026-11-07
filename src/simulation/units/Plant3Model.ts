import { DistillationColumn } from '../equipment/DistillationColumn';
import { RefluxDrum } from '../equipment/RefluxDrum';
import { PumpModel } from '../control/PumpModel';
import { ValveModel } from '../control/ValveModel';
import { PIDController } from '../control/PIDController';
import { TransmitterModel } from '../core/TransmitterModel';
import { AlarmEngine } from '../alarms/AlarmEngine';
import { CONTROLLER_CONFIGS } from '../../data/control-config';
import { TAG_METADATA_REGISTRY, TagLiveValue } from '../../data/tags';
import { INITIAL_CONDITIONS, SnapshotData } from '../../data/initial-conditions';
import { SCENARIO_LIBRARY } from '../../data/scenarios';

export interface ActiveFaultState {
  scenarioId: string;
  severity: number; // 0 to 100%
  rampSeconds: number;
  elapsedSeconds: number;
  currentEffectiveSeverity: number;
}

export class Plant3Model {
  // Columns
  public scrubColumn: DistillationColumn;
  public deEthanizer: DistillationColumn;
  public dePropanizer: DistillationColumn;
  public deButanizer: DistillationColumn;

  // Reflux & Condensate Drums
  public drum3C2: RefluxDrum;
  public drum3C5: RefluxDrum;
  public drum3C7: RefluxDrum;
  public drum3C9: RefluxDrum;

  // Equipment Models
  public pumps: Map<string, PumpModel> = new Map();
  public valves: Map<string, ValveModel> = new Map();
  public controllers: Map<string, PIDController> = new Map();
  public transmitters: Map<string, TransmitterModel> = new Map();
  public alarmEngine: AlarmEngine;

  // Simulation Time & State
  public simTimeSeconds: number = 0;
  public isRunning: boolean = true;
  public simSpeed: number = 1.0;

  // Active Scenarios / Fault Injections
  public activeFaults: Map<string, ActiveFaultState> = new Map();

  // Utility Headers
  public lpSteamHeaderAvailability: number = 1.0; // 0 to 1.0
  public coolingWaterAvailability: number = 1.0;
  public propaneRefrigerantAvailability: number = 1.0;

  // Inter-column flow state (computed in executeProcessDynamics, used in updateTransmitters)
  private _scrubBottomFlow: number = 63.75;
  private _feedFlow3C4: number = 63.75;
  private _bottomsOutflow3C4: number = 44.68;
  private _feedFlow3C6: number = 44.68;
  private _bottomsOutflow3C6: number = 30.0;
  private _feedFlow3C8: number = 30.0;
  private _bottomsOutflow3C8: number = 6.0;
  private _deEthRefluxFlow: number = 40.0;
  private _dePropRefluxFlow: number = 32.0;
  private _deButRefluxFlow: number = 20.0;
  private _c2DistillateFlow: number = 5.0;
  private _c3DistillateFlow: number = 6.13;
  private _c4DistillateFlow: number = 3.0;

  constructor() {
    this.alarmEngine = new AlarmEngine();

    // 1. Initialize Distillation Columns
    this.scrubColumn = new DistillationColumn({
      id: '3C-1',
      name: 'Scrub Column',
      nominalPressure: 38.0,
      nominalTopTemp: -24.66,
      nominalMidTemp: -3.59,
      nominalBottomTemp: 90.33,
      nominalFeedTemp: -24.66,
      nominalDP: 0.28,
      floodingThresholdVapor: 180,
      sumpVolumeM3: 25.0,
      kPressure: 0.008,
      tauThermal: 15.0
    });

    this.deEthanizer = new DistillationColumn({
      id: '3C-4',
      name: 'De-Ethanizer',
      nominalPressure: 30.00,
      nominalTopTemp: -30.09,
      nominalMidTemp: 33.13,
      nominalBottomTemp: 130.67,
      nominalFeedTemp: 33.13,
      nominalDP: 1.55,
      floodingThresholdVapor: 75,
      sumpVolumeM3: 18.0,
      kPressure: 0.012, // Responsive column pressure for 3E-5 scenario
      tauThermal: 12.0
    });

    this.dePropanizer = new DistillationColumn({
      id: '3C-6',
      name: 'De-Propanizer',
      nominalPressure: 15.16,
      nominalTopTemp: 47.47,
      nominalMidTemp: 95.03,
      nominalBottomTemp: 107.84,
      nominalFeedTemp: 95.03,
      nominalDP: 1.568,
      floodingThresholdVapor: 90,
      sumpVolumeM3: 15.0,
      kPressure: 0.015,
      tauThermal: 10.0
    });

    this.deButanizer = new DistillationColumn({
      id: '3C-8',
      name: 'De-Butanizer',
      nominalPressure: 6.00,
      nominalTopTemp: 59.62,
      nominalMidTemp: 105.37,
      nominalBottomTemp: 122.33,
      nominalFeedTemp: 105.37,
      nominalDP: 1.573,
      floodingThresholdVapor: 70,
      sumpVolumeM3: 12.0,
      kPressure: 0.012,
      tauThermal: 10.0
    });


    // 2. Initialize Drums
    this.drum3C2 = new RefluxDrum('3C-2', 38.25, -50.32, 20.0);
    this.drum3C5 = new RefluxDrum('3C-5', 34.5, -34.9, 15.0);
    this.drum3C7 = new RefluxDrum('3C-7', 57.7, 48.0, 15.0);
    this.drum3C9 = new RefluxDrum('3C-9', 54.1, 32.9, 12.0);

    // 3. Initialize Pumps
    this.initPumps();

    // 4. Initialize Valves
    this.initValves();

    // 5. Initialize Controllers
    this.initControllers();

    // 6. Initialize Transmitters
    this.initTransmitters();

    // 7. Load Default Snapshot
    this.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
  }

  private initPumps(): void {
    const pumpDefs = [
      { id: '3G-1A', running: true, amps: 45, flow: 150, head: 65 },
      { id: '3G-1B', running: false, amps: 45, flow: 150, head: 65 },
      { id: '3G-2A', running: true, amps: 35, flow: 45, head: 80 },
      { id: '3G-2B', running: false, amps: 35, flow: 45, head: 80 },
      { id: '3G-6A', running: false, amps: 40, flow: 90, head: 75 },
      { id: '3G-6B', running: true, amps: 40, flow: 90, head: 75 },
      { id: '3G-6C', running: false, amps: 40, flow: 90, head: 75 },
      { id: '3G-7A', running: true, amps: 30, flow: 65, head: 65 },
      { id: '3G-7B', running: false, amps: 30, flow: 65, head: 65 },
      { id: '3G-11A', running: true, amps: 25, flow: 20, head: 50 },
      { id: '3G-11B', running: false, amps: 25, flow: 20, head: 50 },
      { id: '3G-5A', running: false, amps: 25, flow: 25, head: 60 },
      { id: '3G-5B', running: true, amps: 25, flow: 25, head: 60 },
    ];

    for (const p of pumpDefs) {
      this.pumps.set(p.id, new PumpModel(p.id, p.running, p.amps, p.flow, p.head));
    }
  }

  private initValves(): void {
    const valveDefs = [
      { id: '3G-1_VALVE', pos: 82.67, cv: 150 },
      { id: '3LV-2_VALVE', pos: 40.69, cv: 150 },
      { id: 'HIC110_VALVE', pos: 37.28, cv: 50 },
      { id: '3G-2_VALVE', pos: 55, cv: 50 },
      { id: '3G-6_VALVE', pos: 62, cv: 100 },
      { id: '3G-7_VALVE', pos: 58, cv: 75 },
      { id: '3G-11_VALVE', pos: 40, cv: 30 },
      { id: '3TV-1_STEAM_VALVE', pos: 55, cv: 100 },
      { id: '4E-12_CHILLER_VALVE', pos: 70, cv: 100 },
      { id: '3E-4_STEAM_VALVE', pos: 58, cv: 80 },
      { id: '3E-5_COOLING_VALVE', pos: 65, cv: 90 },
      { id: '3E-6_STEAM_VALVE', pos: 54, cv: 85 },
      { id: '3E-7_CW_VALVE', pos: 52, cv: 100 },
      { id: '3E-8_STEAM_VALVE', pos: 50, cv: 70 },
      { id: '3E-9_CW_VALVE', pos: 48, cv: 80 },
      { id: 'FIC80_VALVE', pos: 0, cv: 100 },
      { id: 'HIC1_VALVE', pos: 0, cv: 100 },
      { id: 'HV_3E18_VALVE', pos: 0, cv: 150 },
      { id: 'TIC193_VALVE', pos: 0, cv: 50 },
      { id: '3PV-30_VALVE', pos: 0, cv: 80 },
      { id: 'HIC16_VALVE', pos: 0, cv: 50 },
      { id: '3PV-5B_VALVE', pos: 0, cv: 60 },
      { id: 'HIC17_VALVE', pos: 0, cv: 50 },
      { id: '3PV-7B_VALVE', pos: 0, cv: 50 },
      { id: 'HIC31_VALVE', pos: 0, cv: 50 },
      { id: 'HIC111_VALVE', pos: 99, cv: 50 },
      { id: 'FIC82_VALVE', pos: 0, cv: 50 },
      { id: 'FIC83_VALVE', pos: 0, cv: 50 },
    ];

    for (const v of valveDefs) {
      this.valves.set(v.id, new ValveModel(v.id, v.pos, v.cv));
    }
  }

  private initControllers(): void {
    for (const [id, cfg] of Object.entries(CONTROLLER_CONFIGS)) {
      this.controllers.set(id, new PIDController(cfg));
    }
  }

  private initTransmitters(): void {
    for (const [id, meta] of Object.entries(TAG_METADATA_REGISTRY)) {
      this.transmitters.set(id, new TransmitterModel(id, (meta.rangeMin + meta.rangeMax) / 2, meta.rangeMin, meta.rangeMax));
    }
  }

  public step(dt: number): void {
    if (!this.isRunning) return;

    const scaledDt = dt * this.simSpeed;
    this.simTimeSeconds += scaledDt;

    // 1. Update Injected Faults and Severity Ramps
    this.updateFaultRamps(scaledDt);

    // 2. Read Controller PVs and execute PID Loops
    this.executeControlLoops(scaledDt);

    // 3. Update Valve and Actuator Dynamics
    this.updateActuators(scaledDt);

    // 4. Update Pumps
    this.updatePumpDynamics(scaledDt);

    // 5. Execute Dynamic Process Balance (Mass, Energy, Pressure, VLE)
    this.executeProcessDynamics(scaledDt);

    // 6. Update Transmitters (Physics True Value -> Measured Value with Bias/Lag/Noise)
    this.updateTransmitters(scaledDt);

    // 7. Update Alarm State Engine
    const currentMeasuredTags: Record<string, number> = {};
    for (const [id, tx] of this.transmitters) {
      currentMeasuredTags[id] = tx.measuredValue;
    }
    this.alarmEngine.update(this.simTimeSeconds, currentMeasuredTags);
  }

  private updateFaultRamps(dt: number): void {
    // Reset utility availabilities to nominal before applying faults
    this.lpSteamHeaderAvailability = 1.0;
    this.coolingWaterAvailability = 1.0;
    this.propaneRefrigerantAvailability = 1.0;

    for (const [scenarioId, fault] of this.activeFaults) {
      fault.elapsedSeconds += dt;
      const progress = fault.rampSeconds > 0 ? Math.min(1.0, fault.elapsedSeconds / fault.rampSeconds) : 1.0;
      fault.currentEffectiveSeverity = (fault.severity / 100) * progress;

      // Apply Scenario Mutations
      switch (scenarioId) {
        case 'S01': // 3G-1 Scrub reflux pump trip
          this.pumps.get('3G-1A')?.trip();
          break;
        case 'S02': // 3G-2 De-Ethanizer reflux pump trip
          this.pumps.get('3G-2A')?.trip();
          break;
        case 'S03': // 3G-6 De-Propanizer reflux pump trip
          this.pumps.get('3G-6B')?.trip();
          break;
        case 'S04': // 3G-7 De-Butanizer reflux pump trip
          this.pumps.get('3G-7A')?.trip();
          break;
        case 'S05': // 3G-11 De-Butanizer bottom pump trip
          this.pumps.get('3G-11A')?.trip();
          break;
        case 'S06': // 3E-5 Refrigeration degradation
          this.propaneRefrigerantAvailability = Math.max(0.05, 1.0 - fault.currentEffectiveSeverity);
          break;
        case 'S07': // 3E-7 Cooling water degradation
          this.coolingWaterAvailability = Math.max(0.1, 1.0 - fault.currentEffectiveSeverity);
          break;
        case 'S08': // 3E-9 Cooling water degradation
          this.coolingWaterAvailability = Math.max(0.1, 1.0 - fault.currentEffectiveSeverity);
          break;
        case 'S09': // LP Steam header drop
          this.lpSteamHeaderAvailability = Math.max(0.2, 1.0 - fault.currentEffectiveSeverity);
          break;
        case 'S10': // Reboiler steam valve stuck open
          this.valves.get('3E-4_STEAM_VALVE')?.setStuck(true, 100);
          break;
        case 'S11': // Reboiler steam valve stuck closed
          this.valves.get('3E-4_STEAM_VALVE')?.setStuck(true, 0);
          break;
        case 'S15': // Pressure transmitter bias
          this.transmitters.get('PIC3')?.setBias(3.0 * (fault.severity / 100));
          break;
        case 'S16': // Level transmitter frozen
          this.transmitters.get('LIC4')?.freeze(34.5);
          break;
        case 'S17': // FIC12 controller left in MAN
          this.controllers.get('FIC12')?.setMode('MAN');
          break;
        case 'S18': // Valve stiction on 3E-8
          const v3E8 = this.valves.get('3E-8_STEAM_VALVE');
          if (v3E8) {
            v3E8.stictionDeadband = 6.0;
            v3E8.stictionSlipJump = 5.0;
          }
          break;
      }
    }
  }

  private executeControlLoops(dt: number): void {
    // 3C-4 De-Ethanizer loops
    const txPIC3 = this.transmitters.get('PIC3')?.measuredValue || 30.0;
    const txTIC3 = this.transmitters.get('TIC3')?.measuredValue || 105.4;
    const txLIC4 = this.transmitters.get('LIC4')?.measuredValue || 34.5;
    const txLIC5 = this.transmitters.get('LIC5')?.measuredValue || 50.4;
    const txFIC6 = this.transmitters.get('FIC6')?.measuredValue || 28.25;

    this.controllers.get('PIC3')?.update(dt, txPIC3);
    this.controllers.get('TIC3')?.update(dt, txTIC3);
    this.controllers.get('LIC4')?.update(dt, txLIC4);
    this.controllers.get('LIC5')?.update(dt, txLIC5);
    this.controllers.get('FIC6')?.update(dt, txFIC6);
    const ctrlH5 = this.controllers.get('H5PIC30') || this.controllers.get('H5PIC030');
    ctrlH5?.update(dt, this.transmitters.get('H5PIC30')?.measuredValue || this.transmitters.get('H5PIC030')?.measuredValue || txPIC3);
    this.controllers.get('HIC16')?.update(dt, this.transmitters.get('HIC16')?.measuredValue || 0.0);

    // 3C-6 De-Propanizer loops
    const txPIC5 = this.transmitters.get('PIC5')?.measuredValue || 16.10;
    const txTIC5 = this.transmitters.get('TIC5')?.measuredValue || 104.9;
    const txLIC10 = this.transmitters.get('LIC10')?.measuredValue || 57.7;
    const txLIC9 = this.transmitters.get('LIC9')?.measuredValue || 51.7;
    const txFIC12 = this.transmitters.get('FIC12')?.measuredValue || 63.5;

    this.controllers.get('PIC5')?.update(dt, txPIC5);
    this.controllers.get('PIC5B')?.update(dt, this.transmitters.get('PIC5B')?.measuredValue || txPIC5);
    this.controllers.get('TIC5')?.update(dt, txTIC5);
    this.controllers.get('LIC10')?.update(dt, txLIC10);
    this.controllers.get('LIC9')?.update(dt, txLIC9);
    this.controllers.get('FIC12')?.update(dt, txFIC12);
    this.controllers.get('HIC17')?.update(dt, this.transmitters.get('HIC17')?.measuredValue || 0.0);

    // 3C-8 De-Butanizer loops
    const txPIC7 = this.transmitters.get('PIC7')?.measuredValue || 6.01;
    const txTIC6 = this.transmitters.get('TIC6')?.measuredValue || 106.0;
    const txLIC12 = this.transmitters.get('LIC12')?.measuredValue || 54.1;
    const txLIC11 = this.transmitters.get('LIC11')?.measuredValue || 59.0;
    const txFIC15 = this.transmitters.get('FIC15')?.measuredValue || 46.2;

    this.controllers.get('PIC7')?.update(dt, txPIC7);
    this.controllers.get('PIC7B')?.update(dt, this.transmitters.get('PIC7B')?.measuredValue || txPIC7);
    this.controllers.get('TIC6')?.update(dt, txTIC6);
    this.controllers.get('LIC12')?.update(dt, txLIC12);
    this.controllers.get('LIC11')?.update(dt, txLIC11);
    this.controllers.get('FIC15')?.update(dt, txFIC15);
    this.controllers.get('HIC31')?.update(dt, this.transmitters.get('HIC31')?.measuredValue || 0.0);

    // Scrub loops (Calibrated with real operating values)
    const txTIC1 = this.transmitters.get('TIC1')?.measuredValue || -3.60;
    const txLIC2 = this.transmitters.get('LIC2')?.measuredValue || 60.00;
    const txFIC3 = this.transmitters.get('FIC3')?.measuredValue || 94.65;
    const txLIC3 = this.transmitters.get('LIC3')?.measuredValue || 38.25;
    const txFIC2 = this.transmitters.get('FIC2')?.measuredValue || 63.75;
    const txFIC1 = this.transmitters.get('FIC1')?.measuredValue || 20.68;
    const txHIC110 = this.transmitters.get('HIC110')?.measuredValue || 37.28;
    const txTIC193 = this.transmitters.get('TIC193')?.measuredValue || 29.04;
    const txFIC80 = this.transmitters.get('FIC80')?.measuredValue || 0.0;
    const txHIC1 = this.transmitters.get('HIC1')?.measuredValue || 0.0;

    this.controllers.get('TIC1')?.update(dt, txTIC1);
    this.controllers.get('LIC2')?.update(dt, txLIC2);
    this.controllers.get('FIC3')?.update(dt, txFIC3);
    this.controllers.get('LIC3')?.update(dt, txLIC3);
    this.controllers.get('FIC2')?.update(dt, txFIC2);
    this.controllers.get('FIC1')?.update(dt, txFIC1);
    this.controllers.get('HIC110')?.update(dt, txHIC110);
    this.controllers.get('TIC193')?.update(dt, txTIC193);
    this.controllers.get('FIC80')?.update(dt, txFIC80);
    this.controllers.get('HIC1')?.update(dt, txHIC1);
  }

  private updateActuators(dt: number): void {
    // 3C-1 Reboiler Steam Valve 3TV-1 (manipulated by 3TIC-1)
    const tic1MV = this.controllers.get('TIC1')?.mv ?? 55.0;
    const v3TV1Pos = Math.max(25, tic1MV); // 25% minimum stop limit on 3TV-1 stem to prevent tube freeze-up
    this.valves.get('3TV-1_STEAM_VALVE')?.update(dt, v3TV1Pos);

    // 3C-1 Reflux Valve (manipulated by 3FIC-3)
    const fic3MV = this.controllers.get('FIC3')?.mv ?? 83.0;
    this.valves.get('3G-1_VALVE')?.update(dt, fic3MV);

    // Startup Gas Heater Valve & Flare Valve
    const fic80MV = this.controllers.get('FIC80')?.mv ?? 0.0;
    this.valves.get('FIC80_VALVE')?.update(dt, fic80MV);
    const hic1MV = this.controllers.get('HIC1')?.mv ?? 0.0;
    this.valves.get('HIC1_VALVE')?.update(dt, hic1MV);
    const hv3e18MV = this.controllers.get('HV_3E18')?.mv ?? 0.0;
    this.valves.get('HV_3E18_VALVE')?.update(dt, hv3e18MV);

    const tic193MV = this.controllers.get('TIC193')?.mv ?? 30.0;
    this.valves.get('TIC193_VALVE')?.update(dt, tic193MV);

    // 3C-1 Bottoms Valve 3LV-2 (manipulated by 3FIC-2 / 3LIC-2)
    const fic2Ctrl = this.controllers.get('FIC2');
    const lic2Ctrl = this.controllers.get('LIC2');
    let v3LV2Target = 58.0;
    if (lic2Ctrl && lic2Ctrl.mode === 'MAN') {
      v3LV2Target = lic2Ctrl.mv;
    } else if (fic2Ctrl) {
      v3LV2Target = fic2Ctrl.mv;
    }
    this.valves.get('3LV-2_VALVE')?.update(dt, v3LV2Target);

    // Butane Recycle Valve (manipulated by HIC110 / FIC1)
    const hic110Ctrl = this.controllers.get('HIC110');
    const fic1Ctrl = this.controllers.get('FIC1');
    let vHIC110Target = 37.3;
    if (fic1Ctrl && fic1Ctrl.mode === 'AUTO') {
      vHIC110Target = fic1Ctrl.mv;
    } else if (hic110Ctrl) {
      vHIC110Target = hic110Ctrl.mv;
    }
    this.valves.get('HIC110_VALVE')?.update(dt, vHIC110Target);

    // 4E-12 Chiller Valve
    const v4E12Pos = 70.0;
    this.valves.get('4E-12_CHILLER_VALVE')?.update(dt, v4E12Pos);

    // De-Ethanizer Actuators
    const pic3MV = this.controllers.get('PIC3')?.mv ?? 65;
    const tic3MV = this.controllers.get('TIC3')?.mv ?? 58;
    const fic6MV = this.controllers.get('FIC6')?.mv ?? 55;
    const h5pic30MV = (this.controllers.get('H5PIC30') || this.controllers.get('H5PIC030'))?.mv ?? 0;
    const hic16MV = this.controllers.get('HIC16')?.mv ?? 0;
    const hic111MV = this.controllers.get('HIC111')?.mv ?? 99;

    this.valves.get('3E-5_COOLING_VALVE')?.update(dt, pic3MV);
    this.valves.get('3E-4_STEAM_VALVE')?.update(dt, tic3MV);
    this.valves.get('3G-2_VALVE')?.update(dt, fic6MV);
    this.valves.get('3PV-30_VALVE')?.update(dt, h5pic30MV);
    this.valves.get('HIC16_VALVE')?.update(dt, hic16MV);
    this.valves.get('HIC111_VALVE')?.update(dt, hic111MV);

    // De-Propanizer Actuators
    const pic5MV = this.controllers.get('PIC5')?.mv ?? 52;
    const pic5bMV = this.controllers.get('PIC5B')?.mv ?? 0;
    const tic5MV = this.controllers.get('TIC5')?.mv ?? 54;
    const fic12MV = this.controllers.get('FIC12')?.mv ?? 62;
    const hic17MV = this.controllers.get('HIC17')?.mv ?? 0;

    this.valves.get('3E-7_CW_VALVE')?.update(dt, pic5MV);
    this.valves.get('3PV-5B_VALVE')?.update(dt, pic5bMV);
    this.valves.get('3E-6_STEAM_VALVE')?.update(dt, tic5MV);
    this.valves.get('3G-6_VALVE')?.update(dt, fic12MV);
    this.valves.get('HIC17_VALVE')?.update(dt, hic17MV);

    // De-Butanizer Actuators
    const pic7MV = this.controllers.get('PIC7')?.mv ?? 48;
    const pic7bMV = this.controllers.get('PIC7B')?.mv ?? 0;
    const tic6MV = this.controllers.get('TIC6')?.mv ?? 50;
    const fic15MV = this.controllers.get('FIC15')?.mv ?? 58;
    const lic11MV = this.controllers.get('LIC11')?.mv ?? 40;
    const hic31MV = this.controllers.get('HIC31')?.mv ?? 0;

    this.valves.get('3E-9_CW_VALVE')?.update(dt, pic7MV);
    this.valves.get('3PV-7B_VALVE')?.update(dt, pic7bMV);
    this.valves.get('3E-8_STEAM_VALVE')?.update(dt, tic6MV);
    this.valves.get('3G-7_VALVE')?.update(dt, fic15MV);
    this.valves.get('3G-11_VALVE')?.update(dt, lic11MV);
    this.valves.get('HIC31_VALVE')?.update(dt, hic31MV);
  }

  private updatePumpDynamics(dt: number): void {
    for (const [_, pump] of this.pumps) {
      pump.update(dt, pump.designFlow);
    }
  }

  private executeProcessDynamics(dt: number): void {
    // ----------------- 1. SCRUB SECTION (3C-1, 4E-12, 4E-14, 3E-1, 3C-2) -----------------
    const feedFlowStep = this.activeFaults.get('S12')?.currentEffectiveSeverity || 0;
    const feedFlow3C1 = 280.0 * (1.0 + feedFlowStep * 0.25); // kNm3/h
    
    // 4E-12 Medium Level Propane Evaporator chilling natural gas feed
    const v4E12Pos = this.valves.get('4E-12_CHILLER_VALVE')?.actualPosition || 70;
    const chillerDuty4E12 = (v4E12Pos / 100) * 10.0 * this.propaneRefrigerantAvailability;
    const feedTempInlet = 0.57; // 2TI127 (Nominal 0.57°C)
    
    // Inlet feed gas chilled by 4E-12 continuous heat balance towards column feed tray
    const feedTemp3C1 = feedTempInlet - (chillerDuty4E12 / 10.0) * (feedTempInlet - (-24.66));

    // 3G-1A/B Scrub Reflux Pump & Flow
    const pump3G1Running = Boolean(this.pumps.get('3G-1A')?.running || this.pumps.get('3G-1B')?.running);
    const pump3G1FlowCapacity = (this.pumps.get('3G-1A')?.running ? 114.5 : 0) +
                                (this.pumps.get('3G-1B')?.running ? 114.5 : 0);
    const drum3C2Level = this.drum3C2.level;
    const suctionFactor3C2 = drum3C2Level > 1.0 ? 1.0 : Math.max(0, drum3C2Level / 1.0);
    const v3G1Actual = this.valves.get('3G-1_VALVE')?.actualPosition ?? 82.67;
    
    // Real reflux flow (FIC3) pumped from 3C-2 into 3C-1 top tray #9
    const scrubRefluxFlow = (v3G1Actual / 100.0) * pump3G1FlowCapacity * suctionFactor3C2;

    // Butane Recycle from 3C-9 / 3G-5 into 3C-2 overhead line (FIC1 / HIC110)
    const vHIC110Actual = this.controllers.get('HIC110')?.mv ?? (this.valves.get('HIC110_VALVE')?.actualPosition ?? 37.28);
    const butaneRecycleFlow = (vHIC110Actual / 37.28) * 20.68; // m3/h (FIC1)

    // LP Steam 50# to 3E-1 Reboiler (controlled by 3TIC-1)
    const steamPressure = 1.273 * this.lpSteamHeaderAvailability; // kg/cm2G (PI163)
    const v3TV1Actual = this.valves.get('3TV-1_STEAM_VALVE')?.actualPosition ?? 55.0;
    const scrubReboilerDuty = (v3TV1Actual / 55.0) * 8.5 * this.lpSteamHeaderAvailability;
    
    // Bottoms Outflow to 3C-4 (controlled by 3LIC-2 / 3FIC-2 / 3LV-2)
    const v3LV2Actual = this.valves.get('3LV-2_VALVE')?.actualPosition ?? 40.69;
    const scrubBottomFlow = (v3LV2Actual / 40.69) * 63.75; // m3/h (FIC2)

    // Execute 3C-1 Column Step (boilup, sump level LIC2, overhead temp TI158, tray1 TIC1, reboiler TI157)
    this.scrubColumn.step(
      dt,
      feedFlow3C1 * 0.2,
      feedTemp3C1,
      scrubReboilerDuty,
      6.5 * this.propaneRefrigerantAvailability,
      scrubRefluxFlow,
      scrubBottomFlow,
      steamPressure,
      butaneRecycleFlow
    );

    // 4E-14 & 4E-40 Overhead Condenser Chilling:
    // Vapor from 3C-1 top (TI158) + Butane Recycle (FIC1) is condensed and cooled down to TI176
    const targetTI176 = -50.32 + (this.scrubColumn.topTemp - (-24.66)) * 0.25 - (this.propaneRefrigerantAvailability - 1.0) * 2.5;
    
    // Boilup from 3E-1 directly adds overhead vapor to 4E-14/4E-40
    const nominalBoilup = 50.0;
    const boilupFactor = this.scrubColumn.boilupRate / nominalBoilup;
    const baseCondensationRate = 74.02; // m3/h at nominal
    const condensationRate3C2 = (baseCondensationRate + (boilupFactor - 1.0) * 35.0 + (feedFlow3C1 / 280.0 - 1.0) * 15.0) * this.propaneRefrigerantAvailability;

    // Total Liquid Inflow to 3C-2 = Condensation + Butane Recycle
    const totalLiquidInflow3C2 = Math.max(0, condensationRate3C2 + butaneRecycleFlow);

    // Mixed Liquid Inflow Temperature to 3C-2
    const mixedInflowTemp3C2 = (condensationRate3C2 * targetTI176 + butaneRecycleFlow * (-37.0)) / Math.max(1, totalLiquidInflow3C2);

    // 3C-2 Letdown Outflow to 3C-4 (FI35 / 3LV-3)
    const lic3MV = this.controllers.get('LIC3')?.mv || 0;
    // FI35 letdown valve is controlled by LIC3. Nominally closed at MV <= 20.71.
    const drum3C2Distillate = Math.max(0, (lic3MV - 20.71) * 1.5);

    // Total Liquid Outflow from 3C-2 = Reflux to 3C-1 (FIC3) + Distillate/Letdown to 3C-4 (FI35)
    const totalLiquidOutflow3C2 = scrubRefluxFlow + drum3C2Distillate;

    // Step 3C-2 Drum with rigorous differential mass & thermal balance:
    // d(LIC3)/dt = (totalLiquidInflow3C2 - totalLiquidOutflow3C2) / volume * (100 / 3600) * dt
    this.drum3C2.step(dt, totalLiquidInflow3C2, mixedInflowTemp3C2, totalLiquidOutflow3C2, 0.0);

    // Reflux temperature TI159 is the temperature of the liquid pumped from 3C-2 to 3C-1 top tray
    const targetRefluxTemp = pump3G1Running ? this.drum3C2.temperature + 0.5 : this.scrubColumn.topTemp;
    const alphaReflux = pump3G1Running ? (dt / (2.0 + dt)) : (dt / (300.0 + dt)); // fast flush vs slow thermal soak
    this.scrubColumn.refluxTemp += alphaReflux * (targetRefluxTemp - this.scrubColumn.refluxTemp);

    // Overhead Gas Flow to 5E-1 (FI4) - Continuous Mass Balance: Inflow - Liquid out
    const overheadGasFlow = Math.max(0, 238.02 * (feedFlow3C1 / 280.0) + (this.scrubColumn.topTemp - (-24.66)) * 0.4 - (condensationRate3C2 - 74.02) * 0.35);

    // ----------------- 2. DE-ETHANIZER (3C-4) -----------------
    const feedCoolerLoss = this.activeFaults.get('S13')?.currentEffectiveSeverity || 0;
    const feedTemp3C4 = 33.3 + feedCoolerLoss * 15.0; // °C
    const feedFlow3C4 = scrubBottomFlow + drum3C2Distillate; // Inter-unit mass transfer from Scrub

    // 3E-4 Reboiler Duty
    const v3E4Pos = this.valves.get('3E-4_STEAM_VALVE')?.actualPosition || 58;
    const reboilerDuty3C4 = (v3E4Pos / 100) * 14.5 * this.lpSteamHeaderAvailability;

    // 3E-5 Condenser Cooling Duty (Propane Chilled)
    const v3E5Pos = this.valves.get('3E-5_COOLING_VALVE')?.actualPosition || 65;
    const condenserDuty3C4 = (v3E5Pos / 100) * 13.0 * this.propaneRefrigerantAvailability;

    // 3G-2 Reflux Pump & Flow
    const pump3G2FlowCapacity = (this.pumps.get('3G-2A')?.running ? 51.36 : 0) + 
                                (this.pumps.get('3G-2B')?.running ? 51.36 : 0);
    const v3G2Pos = (this.valves.get('3G-2_VALVE')?.actualPosition || 55) / 100;
    const drum3C5Level = this.drum3C5.level;
    const suctionFactor3C5 = drum3C5Level > 2.0 ? 1.0 : drum3C5Level / 2.0;
    const deEthanizerRefluxFlow = pump3G2FlowCapacity * v3G2Pos * suctionFactor3C5;

    // Distillate C2 and Bottom Outflows
    const c2DistillateFlow = ((this.controllers.get('LIC4')?.mv || 20) / 100) * 15.0 * suctionFactor3C5;
    const bottomsOutflow3C4 = ((this.controllers.get('LIC5')?.mv || 46) / 100) * 70.0; // max ~70 t/h (Exaquantum: FIC14=44.68)

    // Column & Reflux Drum Step
    const v3PV30Pos = this.valves.get('3PV-30_VALVE')?.actualPosition ?? 100;
    const vHIC16Pos = this.valves.get('HIC16_VALVE')?.actualPosition ?? 0;
    const offgasVented3C4 = ((v3PV30Pos / 100) * 12.0) + ((vHIC16Pos / 100) * 20.0);
    const drainOutflow3C5 = (vHIC16Pos / 100) * 10.0;

    this.deEthanizer.step(dt, feedFlow3C4, feedTemp3C4, reboilerDuty3C4, condenserDuty3C4, deEthanizerRefluxFlow, bottomsOutflow3C4, steamPressure, 0, offgasVented3C4, 36.0);
    const condensationRate3C4 = condenserDuty3C4 * 3.284;
    this.drum3C5.step(dt, condensationRate3C4, this.deEthanizer.topTemp, deEthanizerRefluxFlow, c2DistillateFlow, drainOutflow3C5);

    // Store inter-column flows for transmitter updates
    this._feedFlow3C4 = feedFlow3C4;
    this._bottomsOutflow3C4 = bottomsOutflow3C4;
    this._deEthRefluxFlow = deEthanizerRefluxFlow;
    this._c2DistillateFlow = c2DistillateFlow;

    // ----------------- 3. DE-PROPANIZER (3C-6) -----------------
    const feedFlow3C6 = bottomsOutflow3C4; // cascaded from De-Ethanizer bottom
    const feedTemp3C6 = this.deEthanizer.bottomTemp; // direct bottom temp from De-Ethanizer

    const v3E6Pos = this.valves.get('3E-6_STEAM_VALVE')?.actualPosition || 54;
    const reboilerDuty3C6 = (v3E6Pos / 100) * 12.0 * this.lpSteamHeaderAvailability;

    const v3E7Pos = this.valves.get('3E-7_CW_VALVE')?.actualPosition || 52;
    const condenserDuty3C6 = (v3E7Pos / 100) * 11.5 * this.coolingWaterAvailability;

    const pump3G6FlowCapacity = (this.pumps.get('3G-6A')?.running ? 112.36 : 0) + 
                                (this.pumps.get('3G-6B')?.running ? 112.36 : 0) + 
                                (this.pumps.get('3G-6C')?.running ? 112.36 : 0);
    const v3G6Pos = (this.valves.get('3G-6_VALVE')?.actualPosition || 62) / 100;
    const dePropanizerRefluxFlow = pump3G6FlowCapacity * v3G6Pos;
    const c3DistillateFlow = ((this.controllers.get('LIC10')?.mv || 18) / 100) * 25.0;
    const bottomsOutflow3C6 = ((this.controllers.get('LIC9')?.mv || 51.5) / 100) * 60.0; // max ~60 t/h

    const v3PV5BPos = this.valves.get('3PV-5B_VALVE')?.actualPosition ?? 0;
    const vHIC17Pos = this.valves.get('HIC17_VALVE')?.actualPosition ?? 0;
    const offgasVented3C6 = ((v3PV5BPos / 100) * 18.0) + ((vHIC17Pos / 100) * 20.0);
    const drainOutflow3C7 = (vHIC17Pos / 100) * 10.0;

    this.dePropanizer.step(dt, feedFlow3C6, feedTemp3C6, reboilerDuty3C6, condenserDuty3C6, dePropanizerRefluxFlow, bottomsOutflow3C6, steamPressure, 0, offgasVented3C6, 20.0);
    this.drum3C7.step(dt, condenserDuty3C6 * 10.083, this.dePropanizer.topTemp, dePropanizerRefluxFlow, c3DistillateFlow, drainOutflow3C7);

    // Store inter-column flows for transmitter updates
    this._feedFlow3C6 = feedFlow3C6;
    this._bottomsOutflow3C6 = bottomsOutflow3C6;
    this._dePropRefluxFlow = dePropanizerRefluxFlow;
    this._c3DistillateFlow = c3DistillateFlow;

    // ----------------- 4. DE-BUTANIZER (3C-8) -----------------
    const feedFlow3C8 = bottomsOutflow3C6; // cascaded from De-Propanizer bottom
    const feedTemp3C8 = this.dePropanizer.bottomTemp; // direct bottom temp from De-Propanizer

    const v3E8Pos = this.valves.get('3E-8_STEAM_VALVE')?.actualPosition || 50;
    const reboilerDuty3C8 = (v3E8Pos / 100) * 10.0 * this.lpSteamHeaderAvailability;

    const v3E9Pos = this.valves.get('3E-9_CW_VALVE')?.actualPosition || 48;
    const condenserDuty3C8 = (v3E9Pos / 100) * 9.5 * this.coolingWaterAvailability;

    const pump3G7FlowCapacity = (this.pumps.get('3G-7A')?.running ? 60.0 : 0) + 
                                (this.pumps.get('3G-7B')?.running ? 60.0 : 0);
    const v3G7Pos = (this.valves.get('3G-7_VALVE')?.actualPosition || 58) / 100;
    const deButanizerRefluxFlow = pump3G7FlowCapacity * v3G7Pos;
    const c4DistillateFlow = ((this.controllers.get('LIC12')?.mv || 15) / 100) * 20.0;

    const pump3G11FlowCapacity = (this.pumps.get('3G-11A')?.running ? 19.05 : 0) + 
                                 (this.pumps.get('3G-11B')?.running ? 19.05 : 0);
    const v3G11Pos = (this.valves.get('3G-11_VALVE')?.actualPosition || 40) / 100;
    const bottomsOutflow3C8 = pump3G11FlowCapacity * v3G11Pos * 0.8;

    const v3PV7BPos = this.valves.get('3PV-7B_VALVE')?.actualPosition ?? 0;
    const vHIC31Pos = this.valves.get('HIC31_VALVE')?.actualPosition ?? 0;
    const offgasVented3C8 = ((v3PV7BPos / 100) * 15.0) + ((vHIC31Pos / 100) * 18.0);
    const drainOutflow3C9 = (vHIC31Pos / 100) * 8.0;

    this.deButanizer.step(dt, feedFlow3C8, feedTemp3C8, reboilerDuty3C8, condenserDuty3C8, deButanizerRefluxFlow, bottomsOutflow3C8, steamPressure, 0, offgasVented3C8, 7.50);
    this.drum3C9.step(dt, condenserDuty3C8 * 8.925, this.deButanizer.topTemp, deButanizerRefluxFlow, c4DistillateFlow, drainOutflow3C9);

    // Store inter-column flows for transmitter updates
    this._feedFlow3C8 = feedFlow3C8;
    this._bottomsOutflow3C8 = bottomsOutflow3C8;
    this._deButRefluxFlow = deButanizerRefluxFlow;
    this._c4DistillateFlow = c4DistillateFlow;
  }

  private updateTransmitters(dt: number): void {
    // 1. Scrub Column 3C-1 & Associated Instruments (Calibrated with real plant telemetry)
    const feedFlowStep = this.activeFaults.get('S12')?.currentEffectiveSeverity || 0;
    const feedFlow3C1 = 280.0 * (1.0 + feedFlowStep * 0.25);
    const feedTempInlet = 0.57; // 2TI127

    const pump3G1FlowCapacity = (this.pumps.get('3G-1A')?.running ? 114.5 : 0) + 
                                (this.pumps.get('3G-1B')?.running ? 114.5 : 0);
    const pump3G1Running = pump3G1FlowCapacity > 0;
    const valve3G1Pos = this.valves.get('3G-1_VALVE')?.actualPosition || 82.67;
    const drum3C2Level = this.drum3C2.level;
    const suctionFactor3C2 = drum3C2Level > 1.0 ? 1.0 : Math.max(0, drum3C2Level / 1.0);
    const scrubRefluxFlow = (valve3G1Pos / 100.0) * pump3G1FlowCapacity * suctionFactor3C2;

    const vHIC110Pos = this.valves.get('HIC110_VALVE')?.actualPosition || 37.28;
    const butaneRecycleFlow = (vHIC110Pos / 37.28) * 20.68;

    const v3LV2Pos = this.valves.get('3LV-2_VALVE')?.actualPosition ?? 40.69;
    const scrubBottomFlow = (v3LV2Pos / 40.69) * 63.75;
    const steamPressure = 1.27 * this.lpSteamHeaderAvailability;
    
    const nominalBoilup = 50.0;
    const boilupFactor = this.scrubColumn.boilupRate / nominalBoilup;
    const baseCondensationRate = 74.02;
    const condensationRate3C2 = (baseCondensationRate + (boilupFactor - 1.0) * 35.0 + (feedFlow3C1 / 280.0 - 1.0) * 15.0) * this.propaneRefrigerantAvailability;
    const overheadGasFlow = Math.max(0, 238.02 * (feedFlow3C1 / 280.0) + (this.scrubColumn.topTemp - (-24.66)) * 0.5 - (condensationRate3C2 - 74.02) * 0.4);

    const targetTI176 = -50.32 + (this.scrubColumn.topTemp - (-24.66)) * 0.25 - (this.propaneRefrigerantAvailability - 1.0) * 2.5;
    const lic3MV = this.controllers.get('LIC3')?.mv || 0;
    const drum3C2Distillate = Math.max(0, (lic3MV - 20.71) * 1.5);

    // Update Scrub Transmitters
    this.transmitters.get('2TI127')?.update(dt, feedTempInlet);
    this.transmitters.get('TI158')?.update(dt, this.scrubColumn.topTemp); // 3C-1 Overhead Temp (-24.66°C nominal)
    this.transmitters.get('TI159')?.update(dt, this.scrubColumn.refluxTemp); // 3C-1 Reflux Temp (-48.31°C nominal)
    this.transmitters.get('TIC1')?.update(dt, this.scrubColumn.tray1Temp); // 3C-1 Tray #1 (-3.59°C nominal)
    this.transmitters.get('TI157')?.update(dt, this.scrubColumn.reboilerVaporTemp); // 3E-1 Reboiler Vapor Return (90.59°C nominal)
    this.transmitters.get('TI160')?.update(dt, this.scrubColumn.sumpTemp); // 3C-1 Sump Bottom (22.64°C nominal)
    this.transmitters.get('TI52')?.update(dt, this.scrubColumn.reboilerSteamOutTemp); // 3E-1 Steam Out (33.61°C nominal)
    this.transmitters.get('TI161')?.update(dt, this.scrubColumn.bottomTemp); // 3C-1 Bottom to 3C-4 (90.33°C nominal)
    this.transmitters.get('TI176')?.update(dt, targetTI176); // 4E-14/4E-40 outlet to 3C-2 (-50.32°C nominal)
    this.transmitters.get('LIC2')?.update(dt, this.scrubColumn.bottomLevel); // 3C-1 Sump Level (60.0% nominal)
    this.transmitters.get('FIC2')?.update(dt, scrubBottomFlow); // 3C-1 Bottom Flow (63.75 m3/h nominal)
    this.transmitters.get('FIC3')?.update(dt, scrubRefluxFlow); // 3C-1 Reflux Flow (94.65 m3/h nominal)
    this.transmitters.get('LIC3')?.update(dt, this.drum3C2.level); // 3C-2 Condensate Drum Level (38.25% nominal)
    this.transmitters.get('FIC1')?.update(dt, butaneRecycleFlow); // Butane Recycle Flow (20.68 m3/h nominal)
    this.transmitters.get('HIC110')?.update(dt, vHIC110Pos); // Butane Recycle Loader (37.28% nominal)
    this.transmitters.get('FI4')?.update(dt, overheadGasFlow); // 3C-2 Overhead Gas Flow (238.02 t/h nominal)
    this.transmitters.get('PI163')?.update(dt, steamPressure); // LP Steam Pressure (1.273 kg/cm2G)

    const vFIC80Pos = this.valves.get('FIC80_VALVE')?.actualPosition ?? 0.0;
    const vHIC1Pos = this.valves.get('HIC1_VALVE')?.actualPosition ?? 0.0;
    const vHV3E18Pos = this.valves.get('HV_3E18_VALVE')?.actualPosition ?? 0.0;
    
    const feedGasFlow = (vHV3E18Pos / 100.0) * 150.0;
    const currentPI12 = this.transmitters.get('PI12')?.measuredValue ?? 0.0;
    
    // Outflow depends on downstream valves (FIC80, HIC1) and upstream pressure (PI12)
    // Driving force approx proportional to pressure. Max out at ~2.0 kg/cm2g
    const pressureFactor = Math.max(0, currentPI12 / 1.5);
    const outCapacity = ((vFIC80Pos / 100.0) * 100.0) + ((vHIC1Pos / 100.0) * 150.0);
    const totalOutFlow = Math.min(outCapacity * pressureFactor, 250); 
    
    // Dynamic pressure calculation for PI12 (pressure rises when feed > outflow)
    let newPI12 = currentPI12 + (feedGasFlow - totalOutFlow) * (dt * 0.005);
    newPI12 = Math.max(-0.002, Math.min(newPI12, 14.0)); // bounded between ambient and 3C-2 top pressure
    this.transmitters.get('PI12')?.update(dt, newPI12);
    
    // Distribution of actual flows
    const fic80Flow = totalOutFlow > 0 ? totalOutFlow * (((vFIC80Pos / 100.0) * 100.0) / outCapacity) : 0;
    const hic1Flow = totalOutFlow > 0 ? totalOutFlow * (((vHIC1Pos / 100.0) * 150.0) / outCapacity) : 0;

    this.transmitters.get('FIC80')?.update(dt, fic80Flow);
    this.transmitters.get('HIC1')?.update(dt, vHIC1Pos);

    const tic193ValvePos = this.valves.get('TIC193_VALVE')?.actualPosition ?? 0.0;
    const steamHeat = (tic193ValvePos / 100.0) * 80.0;
    // Cold feed gas cools the heater down
    const flowCooling = (feedGasFlow / 100.0) * 20.0;
    const ambientTIC193 = 26.15;
    const feedTemp = this.scrubColumn.topTemp || -24.66;
    
    let targetTIC193 = ambientTIC193;
    if (steamHeat > 0 && feedGasFlow === 0) {
        targetTIC193 = ambientTIC193 + steamHeat; // pure heating
    } else if (steamHeat === 0 && feedGasFlow > 0) {
        targetTIC193 = feedTemp + 5.0; // cold gas cools it to near feed temp
    } else if (steamHeat > 0 && feedGasFlow > 0) {
        targetTIC193 = feedTemp + steamHeat - flowCooling; // dynamic mix
    }
    
    const currentTIC193 = this.transmitters.get('TIC193')?.measuredValue || 26.15;
    const newTIC193 = currentTIC193 + (targetTIC193 - currentTIC193) * (dt / 15.0);
    this.transmitters.get('TIC193')?.update(dt, newTIC193);
    
    // TI191 LTSS Header Temperature
    const ltssAmbient = 24.4;
    let targetTI191 = ltssAmbient;
    // HIC1 routes hot gas from 3E-18 to the LTSS Header
    if (hic1Flow > 0.1) {
      targetTI191 = newTIC193; 
    }
    const currentTI191 = this.transmitters.get('TI191')?.measuredValue || 24.4;
    const newTI191 = currentTI191 + (targetTI191 - currentTI191) * (dt / 25.0);
    this.transmitters.get('TI191')?.update(dt, newTI191);
    this.transmitters.get('FI35')?.update(dt, drum3C2Distillate);

    // AI25 Gas Composition Analyzers
    this.transmitters.get('AI25A')?.update(dt, this.scrubColumn.compN2);
    this.transmitters.get('AI25B')?.update(dt, this.scrubColumn.compC1);
    this.transmitters.get('AI25C')?.update(dt, this.scrubColumn.compC2);
    this.transmitters.get('AI25D')?.update(dt, this.scrubColumn.compC3);
    this.transmitters.get('AI25E')?.update(dt, this.scrubColumn.compIC4);
    this.transmitters.get('AI25F')?.update(dt, this.scrubColumn.compNC4);
    this.transmitters.get('AI25G')?.update(dt, this.scrubColumn.compIC5);
    this.transmitters.get('AI25H')?.update(dt, this.scrubColumn.hhv);

    this.transmitters.get('AI25_N2')?.update(dt, this.scrubColumn.compN2);
    this.transmitters.get('AI25_C1')?.update(dt, this.scrubColumn.compC1);
    this.transmitters.get('AI25_C2')?.update(dt, this.scrubColumn.compC2);
    this.transmitters.get('AI25_C3')?.update(dt, this.scrubColumn.compC3);
    this.transmitters.get('AI25_IC4')?.update(dt, this.scrubColumn.compIC4);
    this.transmitters.get('AI25_NC4')?.update(dt, this.scrubColumn.compNC4);
    // ----------------- 2. DE-ETHANIZER (3C-4 / 3C-5) Transmitters -----------------
    const vHIC16Pos = this.valves.get('HIC16_VALVE')?.actualPosition ?? 0.0;
    const vHIC17Pos = this.valves.get('HIC17_VALVE')?.actualPosition ?? 0.0;
    const vHIC31Pos = this.valves.get('HIC31_VALVE')?.actualPosition ?? 0.0;

    // Continuous stage gradient calculations for 3C-4 (De-Ethanizer)
    const deEthTopT = this.deEthanizer.topTemp;
    const deEthBotT = this.deEthanizer.bottomTemp;
    const deEthDeltaT = deEthBotT - deEthTopT;

    this.transmitters.get('PIC3')?.update(dt, this.deEthanizer.pressure);
    this.transmitters.get('H5PIC30')?.update(dt, this.deEthanizer.pressure);
    this.transmitters.get('H5PIC030')?.update(dt, this.deEthanizer.pressure);
    this.transmitters.get('HIC16')?.update(dt, vHIC16Pos);
    this.transmitters.get('HIC111')?.update(dt, this.valves.get('HIC111_VALVE')?.actualPosition ?? 99.0);
    this.transmitters.get('FIC82')?.update(dt, (this.controllers.get('FIC82')?.mv || 0) * 0.03 + 0.98);
    this.transmitters.get('TI171')?.update(dt, deEthTopT); // -30.09°C nominal
    this.transmitters.get('TI172')?.update(dt, 33.13 + (this.scrubColumn.bottomTemp - 90.33) * 0.15 - (this.coolingWaterAvailability - 1.0) * 5.0); // 33.13°C feed
    this.transmitters.get('TDIC3')?.update(dt, Math.abs(deEthDeltaT - 160.76) + 11.6); // Differential across column
    this.transmitters.get('TI175')?.update(dt, deEthTopT + 0.2177 * deEthDeltaT); // ~4.9°C overhead vapor (Tray stage fraction alpha=0.2177)
    this.transmitters.get('TIC3')?.update(dt, deEthTopT + 0.8224 * deEthDeltaT); // 102.12°C tray temp (Tray stage fraction alpha=0.8224)
    this.transmitters.get('TI170')?.update(dt, deEthBotT); // 130.67°C bottom
    this.transmitters.get('TI197')?.update(dt, deEthTopT + 0.9435 * deEthDeltaT); // 121.59°C reboiler vapor return (Tray stage fraction alpha=0.9435)
    this.transmitters.get('TI174')?.update(dt, deEthBotT + 2.99 * (this._bottomsOutflow3C4 / Math.max(1, 69.28))); // 133.66°C bottom out coupled with flow
    this.transmitters.get('3C-4_DP')?.update(dt, this.deEthanizer.dP);
    this.transmitters.get('LIC4')?.update(dt, 36.26 + (this.propaneRefrigerantAvailability - 1.0) * 5.0); // 36.26% 3E-5 accumulator
    this.transmitters.get('LIC5')?.update(dt, this.deEthanizer.bottomLevel); // 50.4% 3C-4 Sump Level
    this.transmitters.get('LIC6')?.update(dt, this.drum3C5.level); // 56.2% 3C-5 Reflux Drum Level
    this.transmitters.get('FIC6')?.update(dt, this._deEthRefluxFlow); // 3C-4 Reflux Flow (FIC6)
    this.transmitters.get('FIC7')?.update(dt, this._c2DistillateFlow); // C2 Distillate Flow (FIC7)
    this.transmitters.get('FIC8')?.update(dt, this._c2DistillateFlow * 0.5 + ((this.controllers.get('FIC8')?.mv || 50) / 100) * 2.5); // C2 to STG (FIC8)
    this.transmitters.get('FI89')?.update(dt, 1968.58 * (this._feedFlow3C4 / 63.75));
    this.transmitters.get('TI168')?.update(dt, 70.0 + (this.lpSteamHeaderAvailability - 1.0) * 10.0);
    this.transmitters.get('FI5')?.update(dt, 2.81 * (this._feedFlow3C4 / 63.75));
    this.transmitters.get('FI36')?.update(dt, 0.0);
    this.transmitters.get('PI35A')?.update(dt, 8.999);
    this.transmitters.get('TI177')?.update(dt, -37.16 - (this.propaneRefrigerantAvailability - 1.0) * 2.5); // Propane chiller temperature
    this.transmitters.get('TI178')?.update(dt, -35.47 - (this.propaneRefrigerantAvailability - 1.0) * 2.2);
    this.transmitters.get('TI179')?.update(dt, -34.68 - (this.propaneRefrigerantAvailability - 1.0) * 2.0);
    this.transmitters.get('FIC34')?.update(dt, 0.0);
    this.transmitters.get('3E-5_DUTY')?.update(dt, (this.valves.get('3E-5_COOLING_VALVE')?.actualPosition || 65) * 0.13 * this.propaneRefrigerantAvailability);
    this.transmitters.get('TI301')?.update(dt, deEthTopT + 0.036 * deEthDeltaT); // Subcooled liquid out of 3E-5
    this.transmitters.get('TI302')?.update(dt, deEthTopT + 0.187 * deEthDeltaT);
    this.transmitters.get('TI307')?.update(dt, this.drum3C5.temperature);
    this.transmitters.get('AI23_C3')?.update(dt, this.deEthanizer.heavyKeyInOverhead);

    // ----------------- 3. DE-PROPANIZER (3C-6 / 3C-7) Transmitters -----------------
    const dePropTopT = this.dePropanizer.topTemp;
    const dePropBotT = this.dePropanizer.bottomTemp;
    const dePropDeltaT = dePropBotT - dePropTopT;

    this.transmitters.get('PIC5')?.update(dt, this.dePropanizer.pressure); // 15.16 kg/cm2g
    this.transmitters.get('PIC5B')?.update(dt, this.dePropanizer.pressure); // 15.16 kg/cm2g
    this.transmitters.get('HIC17')?.update(dt, vHIC17Pos);
    this.transmitters.get('FIC11')?.update(dt, this._bottomsOutflow3C4); // 3C-4 bottom outflow = 3C-6 feed (69.28 m3/h nominal)
    this.transmitters.get('FIC12')?.update(dt, this._dePropRefluxFlow); // 113.20 t/h nominal
    this.transmitters.get('FIC14')?.update(dt, this._feedFlow3C6); // 44.68 t/h nominal
    this.transmitters.get('FIC83')?.update(dt, (this.controllers.get('FIC83')?.mv || 50) * 0.0388); // 1.94 t/h
    this.transmitters.get('FIC95')?.update(dt, 0.629);
    this.transmitters.get('FIC13')?.update(dt, (this.controllers.get('FIC13')?.mv || 50) * 0.00556); // 0.28 t/h
    this.transmitters.get('PDIC6')?.update(dt, this.dePropanizer.dP); // 1.57 kg/cm2
    this.transmitters.get('TI167')?.update(dt, dePropTopT); // 47.47°C overhead vapor
    this.transmitters.get('TI165')?.update(dt, dePropTopT - 4.40 - (this.coolingWaterAvailability - 1.0) * 3.0); // 43.07°C reflux liquid
    this.transmitters.get('TIC5')?.update(dt, this.dePropanizer.midTemp); // 95.03°C tray control
    this.transmitters.get('TI164')?.update(dt, dePropTopT + 0.9712 * dePropDeltaT); // 106.10°C stripping tray
    this.transmitters.get('TI166')?.update(dt, dePropBotT); // 107.84°C bottom
    this.transmitters.get('LIC9')?.update(dt, this.dePropanizer.bottomLevel); // 51.7%
    this.transmitters.get('LIC10')?.update(dt, this.drum3C7.level); // 57.7%
    this.transmitters.get('AI21_C3')?.update(dt, Math.max(50, 100 - this.dePropanizer.heavyKeyInOverhead * 10));
    this.transmitters.get('AI21_IC4')?.update(dt, this.dePropanizer.heavyKeyInOverhead * 0.5);

    // ----------------- 4. DE-BUTANIZER (3C-8 / 3C-9) Transmitters -----------------
    const deButTopT = this.deButanizer.topTemp;
    const deButBotT = this.deButanizer.bottomTemp;
    const deButDeltaT = deButBotT - deButTopT;

    this.transmitters.get('PIC7')?.update(dt, this.deButanizer.pressure); // 6.00 kg/cm2g
    this.transmitters.get('PIC7A')?.update(dt, this.deButanizer.pressure); // 6.00 kg/cm2g
    this.transmitters.get('PIC7B')?.update(dt, this.deButanizer.pressure); // 6.00 kg/cm2g
    this.transmitters.get('HIC31')?.update(dt, vHIC31Pos);
    this.transmitters.get('PDIC8')?.update(dt, this.deButanizer.dP); // 1.57 kg/cm2
    this.transmitters.get('TI183')?.update(dt, deButTopT); // 59.62°C overhead vapor
    this.transmitters.get('TIC6')?.update(dt, this.deButanizer.midTemp); // 105.37°C tray control
    this.transmitters.get('TI184')?.update(dt, deButTopT + 0.9638 * deButDeltaT); // 120.06°C stripping tray
    this.transmitters.get('TI182')?.update(dt, deButBotT); // 122.33°C bottom
    this.transmitters.get('LIC11')?.update(dt, this.deButanizer.bottomLevel); // 59.0%
    this.transmitters.get('FI16')?.update(dt, this._bottomsOutflow3C8); // 6.13 t/h
    this.transmitters.get('LIC12')?.update(dt, this.drum3C9.level); // 54.1%
    this.transmitters.get('FIC15')?.update(dt, this._deButRefluxFlow); // 32.07 t/h
    this.transmitters.get('TI180')?.update(dt, this.drum3C9.temperature); // 31.76°C
    this.transmitters.get('TR310')?.update(dt, 29.32 + (1.0 - this.coolingWaterAvailability) * 3.5); // 3E-9 CW return temp
    this.transmitters.get('PI35')?.update(dt, (this.pumps.get('3G-7B')?.running || this.pumps.get('3G-7A')?.running) ? 9.14 : 6.00);
    this.transmitters.get('AI26')?.update(dt, 0.000);
    this.transmitters.get('TI9')?.update(dt, 250.0);

    // ----------------- 5. REFRIGERATION & QUALITY ANALYZERS -----------------
    this.transmitters.get('PI33')?.update(dt, 9.58);
    this.transmitters.get('TIC155')?.update(dt, -38.64);
    this.transmitters.get('LIC8')?.update(dt, 42.93);
    this.transmitters.get('LIC35')?.update(dt, 30.83);
    this.transmitters.get('FIC92')?.update(dt, 19.68);
    this.transmitters.get('FIC94')?.update(dt, 6.76);
    this.transmitters.get('FIC9')?.update(dt, 4.86);
    this.transmitters.get('FIC10')?.update(dt, 2.19);
    this.transmitters.get('HIC114')?.update(dt, 65.0);
    this.transmitters.get('HIC116')?.update(dt, 62.0);

    // Online Gas Chromatographs
    this.transmitters.get('AI21A')?.update(dt, 0.0012);
    this.transmitters.get('AI21B')?.update(dt, 0.0860);
    this.transmitters.get('AI21C')?.update(dt, 0.0032);

    this.transmitters.get('AI23A')?.update(dt, 0.0000);
    this.transmitters.get('AI23B')?.update(dt, 0.0000);
    this.transmitters.get('AI23C')?.update(dt, 0.0000);
    this.transmitters.get('AI23D')?.update(dt, 1.9990);
    this.transmitters.get('AI23E')?.update(dt, 0.0000);

    this.transmitters.get('AI24A')?.update(dt, 4.9817);
    this.transmitters.get('AI24B')?.update(dt, 0.0000);
    this.transmitters.get('AI24C')?.update(dt, 0.0000);
    this.transmitters.get('AI24D')?.update(dt, 0.0000);
    this.transmitters.get('AI24E')?.update(dt, 1.9928);
  }


  public injectScenario(scenarioId: string, customSeverity?: number, customRamp?: number): boolean {
    const def = SCENARIO_LIBRARY[scenarioId];
    if (!def) return false;

    this.activeFaults.set(scenarioId, {
      scenarioId,
      severity: customSeverity !== undefined ? customSeverity : def.defaultSeverity,
      rampSeconds: customRamp !== undefined ? customRamp : def.defaultRampSeconds,
      elapsedSeconds: 0,
      currentEffectiveSeverity: 0
    });
    return true;
  }

  public clearScenario(scenarioId: string): void {
    this.activeFaults.delete(scenarioId);

    // Re-enable equipment or transmitters if repaired
    if (scenarioId === 'S01') this.pumps.get('3G-1A')?.resetTrip();
    if (scenarioId === 'S02') this.pumps.get('3G-2A')?.resetTrip();
    if (scenarioId === 'S03') this.pumps.get('3G-6B')?.resetTrip();
    if (scenarioId === 'S04') this.pumps.get('3G-7A')?.resetTrip();
    if (scenarioId === 'S05') this.pumps.get('3G-11A')?.resetTrip();
    if (scenarioId === 'S10' || scenarioId === 'S11') this.valves.get('3E-4_STEAM_VALVE')?.reset(58);
    if (scenarioId === 'S15') this.transmitters.get('PIC3')?.setBias(0);
    if (scenarioId === 'S16') this.transmitters.get('LIC4')?.unfreeze();
    if (scenarioId === 'S18') this.valves.get('3E-8_STEAM_VALVE')?.reset(50);
  }

  public loadSnapshot(snapshot: SnapshotData): void {
    this.activeFaults.clear();
    this.alarmEngine.reset();
    this.simTimeSeconds = 0;

    for (const [tagId, val] of Object.entries(snapshot.tags)) {
      const tx = this.transmitters.get(tagId);
      if (tx) {
        tx.reset(val.trueValue);
        tx.measuredValue = val.measuredValue;
      }
      const ctrl = this.controllers.get(tagId);
      if (ctrl) {
        ctrl.reset(val.sp, val.mv, val.mode);
      }
    }

    for (const [pumpId, pState] of Object.entries(snapshot.pumps)) {
      const pump = this.pumps.get(pumpId);
      if (pump) {
        pump.reset(pState.running);
        pump.currentAmps = pState.amps;
      }
    }

    // Align column states with snapshot values
    this.deEthanizer.reset(snapshot.tags['PIC3']?.trueValue || 30.0, snapshot.tags['LIC5']?.trueValue || 50.4);
    this.drum3C5.reset(snapshot.tags['LIC6']?.trueValue || 56.2);
    this.dePropanizer.reset(snapshot.tags['PIC5']?.trueValue || 15.16, snapshot.tags['LIC9']?.trueValue || 51.7);
    this.drum3C7.reset(snapshot.tags['LIC10']?.trueValue || 57.7);
    this.deButanizer.reset(snapshot.tags['PIC7']?.trueValue || 6.01, snapshot.tags['LIC11']?.trueValue || 59.0);
    this.drum3C9.reset(snapshot.tags['LIC12']?.trueValue || 54.1);
    this.scrubColumn.reset(38.0, snapshot.tags['LIC2']?.trueValue || 100.0);
    this.drum3C2.reset(snapshot.tags['LIC3']?.trueValue || 38.2);

    // Reset valves to snapshot controller output positions
    this.valves.get('3TV-1_STEAM_VALVE')?.reset(snapshot.tags['TIC1']?.mv ?? 55.0);
    this.valves.get('3LV-2_VALVE')?.reset(snapshot.tags['FIC2']?.mv ?? 40.69);
    this.valves.get('3G-1_VALVE')?.reset(snapshot.tags['FIC3']?.mv ?? 82.67);
    this.valves.get('HIC110_VALVE')?.reset(snapshot.tags['HIC110']?.mv ?? 37.28);
    this.valves.get('3G-2_VALVE')?.reset(snapshot.tags['FIC6']?.mv ?? 55.0);
    this.valves.get('3E-4_STEAM_VALVE')?.reset(snapshot.tags['TIC3']?.mv ?? 58.0);
    this.valves.get('3E-5_COOLING_VALVE')?.reset(snapshot.tags['PIC3']?.mv ?? 65.0);
    this.valves.get('3PV-30_VALVE')?.reset(snapshot.tags['H5PIC30']?.mv ?? snapshot.tags['H5PIC030']?.mv ?? 0.0);
    this.valves.get('HIC16_VALVE')?.reset(snapshot.tags['HIC16']?.mv ?? 0.0);
    this.valves.get('HIC111_VALVE')?.reset(snapshot.tags['HIC111']?.mv ?? 99.0);
    this.valves.get('3G-6_VALVE')?.reset(snapshot.tags['FIC12']?.mv ?? 62.0);
    this.valves.get('3E-6_STEAM_VALVE')?.reset(snapshot.tags['TIC5']?.mv ?? 54.0);
    this.valves.get('3E-7_CW_VALVE')?.reset(snapshot.tags['PIC5']?.mv ?? 52.0);
    this.valves.get('3PV-5B_VALVE')?.reset(snapshot.tags['PIC5B']?.mv ?? 0.0);
    this.valves.get('HIC17_VALVE')?.reset(snapshot.tags['HIC17']?.mv ?? 0.0);
    this.valves.get('3G-7_VALVE')?.reset(snapshot.tags['FIC15']?.mv ?? 58.0);
    this.valves.get('3G-11_VALVE')?.reset(snapshot.tags['LIC11']?.mv ?? 40.0);
    this.valves.get('3E-8_STEAM_VALVE')?.reset(snapshot.tags['TIC6']?.mv ?? 50.0);
    this.valves.get('3E-9_CW_VALVE')?.reset(snapshot.tags['PIC7']?.mv ?? snapshot.tags['PIC7A']?.mv ?? 48.0);
    this.valves.get('3PV-7B_VALVE')?.reset(snapshot.tags['PIC7B']?.mv ?? 0.0);
    this.valves.get('HIC31_VALVE')?.reset(snapshot.tags['HIC31']?.mv ?? 0.0);
  }

  public getLiveTelemetry(): {
    simTimeSeconds: number;
    isRunning: boolean;
    simSpeed: number;
    tags: Record<string, TagLiveValue>;
    pumps: Record<string, { running: boolean; available: boolean; tripped: boolean; amps: number }>;
    activeFaults: string[];
    unackAlarmCount: number;
  } {
    const tagsObj: Record<string, TagLiveValue> = {};

    for (const [id, tx] of this.transmitters) {
      const ctrl = this.controllers.get(id);
      const activeAlarm = Array.from(this.alarmEngine.activeAlarms.values()).find(a => a.tagId === id);

      tagsObj[id] = {
        id,
        trueValue: tx.trueValue,
        measuredValue: tx.measuredValue,
        quality: tx.frozen ? 'BAD' : 'GOOD',
        alarmState: activeAlarm ? activeAlarm.state : 'NORMAL',
        alarmSeverity: activeAlarm ? activeAlarm.priority : 'NORMAL',
        sp: ctrl?.sp,
        mv: ctrl?.mv,
        mode: ctrl?.mode,
        outputMin: ctrl?.config.outputMin,
        outputMax: ctrl?.config.outputMax,
        bias: tx.bias,
        frozen: tx.frozen
      };
    }

    const pumpsObj: Record<string, { running: boolean; available: boolean; tripped: boolean; amps: number }> = {};
    for (const [id, pump] of this.pumps) {
      pumpsObj[id] = {
        running: pump.running,
        available: pump.available,
        tripped: pump.tripped,
        amps: pump.currentAmps
      };
    }

    return {
      simTimeSeconds: this.simTimeSeconds,
      isRunning: this.isRunning,
      simSpeed: this.simSpeed,
      tags: tagsObj,
      pumps: pumpsObj,
      activeFaults: Array.from(this.activeFaults.keys()),
      unackAlarmCount: this.alarmEngine.getUnackCount()
    };
  }
}
