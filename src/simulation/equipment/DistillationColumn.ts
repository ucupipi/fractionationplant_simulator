export interface ColumnDesignParams {
  id: string;
  name: string;
  nominalPressure: number; // kg/cm2G
  nominalBottomTemp: number; // °C
  nominalTopTemp: number; // °C (TI158 for 3C-1)
  nominalMidTemp: number; // °C (TIC1 for 3C-1)
  nominalFeedTemp: number; // °C (2TI127 for 3C-1)
  nominalDP: number; // kg/cm2
  floodingThresholdVapor: number; // m3/h equivalent
  sumpVolumeM3: number;
  kPressure: number; // pressure response gain
  tauThermal: number; // seconds thermal inertia
}

export class DistillationColumn {
  public params: ColumnDesignParams;
  
  // State variables
  public pressure: number; // kg/cm2G
  public bottomLevel: number; // % (0-100) (LIC2 on 3C-1)
  public topTemp: number; // °C (TI158 3C-1 Overhead)
  public refluxTemp: number; // °C (TI159 3C-1 Reflux from 3G-1/3C-2)
  public midTemp: number; // °C
  public bottomTemp: number; // °C (TI161 on 3C-1)
  public dP: number; // kg/cm2
  public separationEfficiency: number = 1.0; // 0 to 1.0 (drops during flooding)
  public psvOpen: boolean = false;
  public psvReliefFlow: number = 0;
  
  // Multi-zone temperatures (specifically calibrated for real distillation profiles like 3C-1)
  public tray1Temp: number; // °C (TIC1 on 3C-1)
  public feedTrayTemp: number; // °C
  public sumpTemp: number; // °C (TI160 on 3C-1)
  public reboilerVaporTemp: number; // °C (TI157 on 3C-1)
  public reboilerSteamOutTemp: number; // °C (TI52 on 3C-1)
  
  // Real gas composition state (AI25 analyzer suite) - Baseline from ScrubColumn.xlsx (Overhead)
  public compN2: number = 0.0536; // mol% (DCS median)
  public compC1: number = 94.5096; // mol% (DCS median)
  public compC2: number = 2.7181; // mol% (DCS median)
  public compC3: number = 1.6738; // mol% (DCS median)
  public compIC4: number = 0.3913; // mol% (DCS median)
  public compNC4: number = 0.5426; // mol% (DCS median)
  public compIC5: number = 0.000157; // mol% (DCS median)
  public hhv: number = 1076.3876; // BTU/scf (DCS median)
  
  // Hydrodynamic rates
  public boilupRate: number = 50; // m3/h vapor eq
  public vaporOverheadRate: number = 50;
  public internalLiquidRate: number = 50;
  
  // Quality proxies
  public lightKeyInBottom: number = 0.5; // mol%
  public heavyKeyInOverhead: number = 2.0; // mol%

  constructor(params: ColumnDesignParams) {
    this.params = params;
    this.pressure = params.nominalPressure;
    this.bottomLevel = params.id === '3C-1' ? 100.0 : 60.0;
    this.topTemp = params.nominalTopTemp;
    this.refluxTemp = params.id === '3C-1' ? -49.0 : params.nominalTopTemp;
    this.midTemp = params.nominalMidTemp;
    this.bottomTemp = params.nominalBottomTemp;
    this.dP = params.nominalDP;

    // Initialize multi-zone temperatures
    this.tray1Temp = params.id === '3C-1' ? -3.59 : params.nominalMidTemp;
    this.feedTrayTemp = params.id === '3C-1' ? 0.57 : params.nominalFeedTemp;
    this.sumpTemp = params.id === '3C-1' ? 22.64 : params.nominalBottomTemp * 0.3;
    this.reboilerVaporTemp = params.id === '3C-1' ? 90.59 : params.nominalBottomTemp;
    this.reboilerSteamOutTemp = params.id === '3C-1' ? 33.61 : 35.0;
  }

  public step(
    dt: number,
    feedFlow: number,
    feedTemp: number,
    reboilerDuty: number, // Gcal/h or relative 0-15
    condenserDuty: number, // Gcal/h or cooling capacity
    refluxFlow: number, // m3/h (FIC3)
    bottomsOutflow: number, // m3/h (FIC2)
    steamPressure: number = 1.273, // kg/cm2G LP Steam Header
    butaneRecycleFlow: number = 20.68, // m3/h C4 recycle
    offgasVented: number = 0, // m3/h equivalent vapor vented to FG/flare
    psvSetPressure?: number // kg/cm2G set pressure for mechanical safety relief valve
  ): void {
    // Column-specific nominal duties and vapor capacity
    let nomRebDuty = 8.5;
    let nomCondDuty = 6.5;
    let nomVaporCap = 50.0;
    let nomReflux = 94.65;
    let nomVent = 0.0;

    if (this.params.id === '3C-4') {
      nomRebDuty = 8.25;
      nomCondDuty = 9.10;
      nomVaporCap = 45.0;
      nomReflux = 35.0;
      nomVent = 12.0;
    } else if (this.params.id === '3C-6') {
      nomRebDuty = 6.48;
      nomCondDuty = 5.98;
      nomVaporCap = 60.0;
      nomReflux = 113.2;
      nomVent = 0.0;
    } else if (this.params.id === '3C-8') {
      nomRebDuty = 5.0;
      nomCondDuty = 4.56;
      nomVaporCap = 40.0;
      nomReflux = 32.0;
      nomVent = 0.0;
    }

    // 1. Boil-up vapor generation (proportional to reboiler duty and liquid driving force)
    const steamEffectiveDriving = Math.max(0, Math.min(1.0, this.bottomLevel / 20.0));
    const targetBoilup = (reboilerDuty / nomRebDuty) * nomVaporCap * steamEffectiveDriving;
    const tauBoilup = 3.0; // 3 sec thermal boiling lag
    this.boilupRate += (dt / (tauBoilup + dt)) * (targetBoilup - this.boilupRate);

    // 2. Condensation rate (scaled to condenser cooling capacity)
    const condensationRate = (condenserDuty / nomCondDuty) * (nomVaporCap - nomVent);

    // 3. PSV mechanical safety relief (pops open if column pressure exceeds safety limit)
    const psvThreshold = psvSetPressure ?? (this.params.nominalPressure * 1.30);
    if (this.pressure >= psvThreshold) {
      this.psvOpen = true;
      this.psvReliefFlow = (this.pressure - psvThreshold + 0.1) * 35.0;
    } else if (this.pressure < psvThreshold * 0.95) {
      this.psvOpen = false;
      this.psvReliefFlow = 0;
    }

    // 4. Pressure dynamics: dP/dt = K * (Boilup - Condensation - Offgas - PSVRelief)
    const netVaporGeneration = this.boilupRate - condensationRate - offgasVented - this.psvReliefFlow;
    const dPdt = this.params.kPressure * netVaporGeneration;
    this.pressure += dPdt * dt;
    this.pressure = Math.max(0.1, this.pressure);

    // 4. Hydrodynamics & Column Differential Pressure (dP)
    const vaporLoadingRel = this.boilupRate / Math.max(1, nomVaporCap);
    const liquidLoadingRel = (refluxFlow + feedFlow * 0.5) / Math.max(1, nomReflux + feedFlow * 0.5);
    
    // Normal base dP + vapor/liquid hydraulic drag normalized to nominal steady state
    let baseDP = this.params.nominalDP * (0.40 + 0.35 * Math.pow(vaporLoadingRel, 1.8) + 0.25 * Math.pow(liquidLoadingRel, 1.5));
    
    // Flooding condition if vapor loading exceeds threshold (>1.25)
    if (vaporLoadingRel > 1.25) {
      const floodExcess = vaporLoadingRel - 1.25;
      baseDP += 2.5 * Math.pow(floodExcess, 1.8);
      this.separationEfficiency = Math.max(0.2, 1.0 - floodExcess * 1.5);
    } else {
      this.separationEfficiency = Math.min(1.0, this.separationEfficiency + dt * 0.05);
    }
    
    const tauDP = 1.5;
    this.dP += (dt / (tauDP + dt)) * (baseDP - this.dP);

    // 5. Internal liquid traffic and Sump Level (Mass Balance)
    // Inflow from trays = Reflux + condensed fraction of feed
    // Net accumulation = Tray liquid inflow - Bottoms Outflow - Extra boilup vaporization
    const nominalBoilup = nomVaporCap;
    let trayLiquidInflow = 0;
    if (this.params.id === '3C-1') {
      trayLiquidInflow = (refluxFlow * 0.50) + (feedFlow * 0.2933) * (0.8 + 0.2 * this.separationEfficiency);
    } else if (this.params.id === '3C-4') {
      trayLiquidInflow = (refluxFlow * 0.80) + (feedFlow * 0.555) * (0.8 + 0.2 * this.separationEfficiency);
    } else if (this.params.id === '3C-6') {
      trayLiquidInflow = (refluxFlow * 0.65) + (feedFlow * 0.462) * (0.8 + 0.2 * this.separationEfficiency);
    } else if (this.params.id === '3C-8') {
      trayLiquidInflow = (refluxFlow * 0.10) + (feedFlow * 0.0425) * (0.8 + 0.2 * this.separationEfficiency);
    } else {
      trayLiquidInflow = (refluxFlow * 0.65) + (feedFlow * 0.45) * (0.8 + 0.2 * this.separationEfficiency);
    }
    const boilupVaporization = (this.boilupRate - nominalBoilup) * 0.7;
    const liquidNetRate = trayLiquidInflow - bottomsOutflow - boilupVaporization;
    
    // dL/dt = NetRate / Volume * (100 / 3600) * dt
    const dLevelPercent = (liquidNetRate / this.params.sumpVolumeM3) * (100 / 3600) * dt;
    this.bottomLevel = Math.max(0, Math.min(100, this.bottomLevel + dLevelPercent));

    // 6. Thermal Profile & Temperatures
    const pressureDelta = this.pressure - this.params.nominalPressure;
    const tempPressureShift = pressureDelta * 1.8; // ~1.8 °C per kg/cm2 pressure change

    const refluxRatio = refluxFlow / Math.max(0.1, nomReflux);
    const boilupRatio = this.boilupRate / Math.max(0.1, nomVaporCap);

    if (this.params.id === '3C-1') {
      // Rigorous Real Plant Multi-zone thermodynamics for Scrub Column 3C-1
      const steamFactor = (reboilerDuty / 8.5) * steamEffectiveDriving;
      
      // 3E-1 Reboiler vapor return (TI157, 90.59°C nominal)
      const targetRebVapor = 90.59 + (steamFactor - 1.0) * 38.0 - (butaneRecycleFlow - 20.68) * 0.45 + tempPressureShift;
      
      // 3C-1 Bottoms Outflow Temp to 3C-4 (TI161, 90.33°C nominal)
      const targetBottom = 90.33 + (steamFactor - 1.0) * 20.0 - (butaneRecycleFlow - 20.68) * 0.40 + tempPressureShift;
      
      // 2. Sump bottom temp to 3E-1 (TI160, 22.64°C nominal)
      const targetSump = 22.64 + (steamFactor - 1.0) * 10.2 + (feedTemp - (-24.66)) * 0.25;
      
      // 3. Tray 1 Stripping Temp (TIC1, -3.59°C nominal):
      // Controlled by 3TIC-1 manipulating LP steam 3TV-1; responds to reboiler heat and internal reflux liquid wash
      const targetTray1 = -3.59 + (steamFactor - 1.0) * 14.0 - (refluxFlow - 94.65) * 0.05 + (feedTemp - (-24.66)) * 0.20 + tempPressureShift;
      
      // 4. Steam out / condensate pot temp (TI52, 33.61°C nominal)
      const targetSteamOut = 33.61 + (reboilerDuty / 8.5 - 1.0) * 12.0;

      // 3C-1 Overhead Vapor Temp leaving top (TI158, -25.0°C nominal):
      // Directly cooled by reflux liquid (FIC3) at reflux temp (TI159).
      // Heats up if reflux is lost or reboiler steam increases!
      const targetOverhead = -25.0 + (steamFactor - 1.0) * 15.0 - (refluxFlow - 94.65) * 0.18 + (this.refluxTemp - (-49.0)) * 0.45 + (feedTemp - (-24.66)) * 0.25 + tempPressureShift + (1.0 - this.separationEfficiency) * 20.0;

      const alphaThermal = dt / (this.params.tauThermal + dt);
      this.topTemp += alphaThermal * (targetOverhead - this.topTemp);
      this.reboilerVaporTemp += alphaThermal * 1.5 * (targetRebVapor - this.reboilerVaporTemp);
      this.bottomTemp += alphaThermal * (targetBottom - this.bottomTemp);
      this.sumpTemp += alphaThermal * (targetSump - this.sumpTemp);
      this.tray1Temp += alphaThermal * (targetTray1 - this.tray1Temp);
      this.reboilerSteamOutTemp += alphaThermal * (targetSteamOut - this.reboilerSteamOutTemp);
      this.midTemp = this.tray1Temp;

      // 7. Gas Composition Dynamics (AI25) calibrated to scrubcolumn.xlsx & VLE physics
      // When reflux is active and top is cool, heavy hydrocarbons are knocked down into bottoms
      // If top temp warms up (e.g. reflux loss), heavy ends slip into overhead gas following relative volatility curves
      const topTempSlip = Math.max(0, this.topTemp - (-24.66));
      const vleFactorC3 = Math.exp(0.08 * topTempSlip) - 1.0;
      const vleFactorC4 = Math.exp(0.12 * topTempSlip) - 1.0;
      
      const c3Overhead = Math.min(15.0, 1.6738 + vleFactorC3 * 1.25);
      const ic4Overhead = Math.min(8.0, 0.3913 + vleFactorC4 * 0.45 + (butaneRecycleFlow > 20.68 ? (butaneRecycleFlow - 20.68) * 0.05 : 0));
      const nc4Overhead = Math.min(8.0, 0.5426 + vleFactorC4 * 0.55 + (butaneRecycleFlow > 20.68 ? (butaneRecycleFlow - 20.68) * 0.06 : 0));
      const ic5Overhead = Math.min(2.0, 0.000157 + vleFactorC4 * 0.08);
      const c2Overhead = 2.7181 + (topTempSlip > 0 ? topTempSlip * 0.02 : 0);
      const n2Overhead = 0.0536;
      
      // C1 is the balancing component (100% - others)
      const c1Overhead = Math.max(0.0, 100.0 - (n2Overhead + c2Overhead + c3Overhead + ic4Overhead + nc4Overhead + ic5Overhead));
      
      this.compN2 = n2Overhead;
      this.compC1 += alphaThermal * (c1Overhead - this.compC1);
      this.compC2 = c2Overhead;
      this.compC3 += alphaThermal * (c3Overhead - this.compC3);
      this.compIC4 += alphaThermal * (ic4Overhead - this.compIC4);
      this.compNC4 += alphaThermal * (nc4Overhead - this.compNC4);
      this.compIC5 += alphaThermal * (ic5Overhead - this.compIC5);
      
      // Calculate HHV from composition (BTU/scf) calibrated to DCS standard
      this.hhv = this.compC1 * 10.10 + this.compC2 * 17.69 + this.compC3 * 25.17 + this.compIC4 * 32.53 + this.compNC4 * 32.62 + this.compIC5 * 40.0;
    } else {
      // General distillation column formula for other columns (3C-4, 3C-6, 3C-8)
      const targetTopTemp = this.params.nominalTopTemp + tempPressureShift - (refluxRatio - 1.0) * 12.0 + (1.0 - this.separationEfficiency) * 20.0;
      const targetBottomTemp = this.params.nominalBottomTemp + tempPressureShift + (boilupRatio - 1.0) * 15.0;
      const targetMidTemp = (targetTopTemp + targetBottomTemp) / 2 + (feedTemp - this.params.nominalFeedTemp) * 0.3;

      const alphaThermal = dt / (this.params.tauThermal + dt);
      this.topTemp += alphaThermal * (targetTopTemp - this.topTemp);
      this.bottomTemp += alphaThermal * (targetBottomTemp - this.bottomTemp);
      this.midTemp += alphaThermal * (targetMidTemp - this.midTemp);

      this.lightKeyInBottom = Math.max(0.01, 1.5 / Math.max(0.2, boilupRatio) * (2.0 - this.separationEfficiency));
      this.heavyKeyInOverhead = Math.max(0.05, 3.5 / Math.max(0.2, refluxRatio) * (2.0 - this.separationEfficiency));
    }
  }

  public reset(p?: number, lvl?: number): void {
    this.pressure = p !== undefined ? p : this.params.nominalPressure;
    this.bottomLevel = lvl !== undefined ? lvl : (this.params.id === '3C-1' ? 100.0 : 50.0);
    this.topTemp = this.params.nominalTopTemp;
    this.refluxTemp = this.params.id === '3C-1' ? -48.31 : this.params.nominalTopTemp;
    this.midTemp = this.params.nominalMidTemp;
    this.bottomTemp = this.params.nominalBottomTemp;
    this.dP = this.params.nominalDP;
    this.separationEfficiency = 1.0;

    if (this.params.id === '3C-1') {
      this.tray1Temp = -3.59;
      this.feedTrayTemp = 0.57;
      this.sumpTemp = 22.64;
      this.reboilerVaporTemp = 90.59;
      this.reboilerSteamOutTemp = 33.61;
      this.bottomTemp = 90.33;
      this.topTemp = -24.66;
      this.refluxTemp = -48.31;
      this.compN2 = 0.0536;
      this.compC1 = 94.5096;
      this.compC2 = 2.7181;
      this.compC3 = 1.6738;
      this.compIC4 = 0.3913;
      this.compNC4 = 0.5426;
      this.compIC5 = 0.000157;
      this.hhv = 1076.3876;
    }
  }
}

