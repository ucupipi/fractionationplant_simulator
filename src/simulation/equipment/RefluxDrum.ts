export class RefluxDrum {
  public id: string;
  public level: number; // % (0-100)
  public temperature: number; // °C
  public volumeM3: number;
  public nominalTemp: number;

  constructor(id: string, initialLevel: number = 38.2, nominalTemp: number = -20.0, volumeM3: number = 20.0) {
    this.id = id;
    this.level = initialLevel;
    this.temperature = nominalTemp;
    this.volumeM3 = volumeM3;
    this.nominalTemp = nominalTemp;
  }

  public step(
    dt: number,
    condensedInflow: number, // m3/h liquid condensed
    inflowTemp: number, // °C
    refluxOutflow: number, // m3/h to column
    distillateOutflow: number = 0.0, // m3/h letdown / export
    drainOutflow: number = 0.0 // m3/h manual drain / blowdown to flare / pit
  ): void {
    // Mass balance: dLevel/dt = (Fin - Fout) / Volume * (100 / 3600) * dt
    const totalInflow = condensedInflow;
    const totalOutflow = refluxOutflow + distillateOutflow + drainOutflow;
    const netFlow = totalInflow - totalOutflow;
    const dLevelPercent = (netFlow / this.volumeM3) * (100 / 3600) * dt;
    this.level = Math.max(0, Math.min(100, this.level + dLevelPercent));

    // Energy balance: thermal mixing with time constant
    const tauThermal = 6.0;
    this.temperature += (dt / (tauThermal + dt)) * (inflowTemp - this.temperature);
  }

  public reset(lvl?: number): void {
    this.level = lvl !== undefined ? lvl : 38.2;
    this.temperature = this.nominalTemp;
  }
}
