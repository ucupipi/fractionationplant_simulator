export class PumpModel {
  public id: string;
  public running: boolean;
  public available: boolean;
  public tripped: boolean;
  public speedFraction: number; // 0 to 1.0
  public currentAmps: number;
  public maxAmps: number;
  public designFlow: number;
  public designHead: number;
  public suctionPressureAvailable: boolean = true;
  public electricalPowerAvailable: boolean = true;
  public tauSpinUp: number = 1.5; // seconds to full speed
  public tauSpinDown: number = 2.5; // seconds coast down

  constructor(id: string, initialRunning: boolean, maxAmps: number = 40, designFlow: number = 50, designHead: number = 70) {
    this.id = id;
    this.running = initialRunning;
    this.available = true;
    this.tripped = false;
    this.speedFraction = initialRunning ? 1.0 : 0.0;
    this.maxAmps = maxAmps;
    this.designFlow = designFlow;
    this.designHead = designHead;
    this.currentAmps = initialRunning ? maxAmps * 0.75 : 0.0;
  }

  public update(dt: number, flowDemand: number): void {
    if (this.tripped || !this.electricalPowerAvailable) {
      this.running = false;
    }

    const targetSpeed = this.running ? 1.0 : 0.0;
    const tau = this.running ? this.tauSpinUp : this.tauSpinDown;
    const alpha = Math.min(1.0, dt / (tau + dt));
    this.speedFraction += alpha * (targetSpeed - this.speedFraction);

    if (this.speedFraction < 0.01) {
      this.speedFraction = 0.0;
      this.currentAmps = 0.0;
    } else {
      // Amps proportional to flow load and speed
      const loadFraction = Math.min(1.2, flowDemand / Math.max(1, this.designFlow));
      this.currentAmps = this.maxAmps * (0.35 + 0.65 * loadFraction) * this.speedFraction;
    }
  }

  public start(): boolean {
    // Permissive check: must be available, not tripped, and have power
    if (this.tripped || !this.available || !this.electricalPowerAvailable) {
      return false;
    }
    this.running = true;
    return true;
  }

  public stop(): void {
    this.running = false;
  }

  public trip(): void {
    this.running = false;
    this.tripped = true;
  }

  public resetTrip(): void {
    this.tripped = false;
  }

  public getEffectiveHead(): number {
    return this.designHead * Math.pow(this.speedFraction, 2);
  }

  public getEffectiveMaxFlow(): number {
    return this.designFlow * this.speedFraction;
  }

  public reset(running: boolean): void {
    this.running = running;
    this.tripped = false;
    this.available = true;
    this.speedFraction = running ? 1.0 : 0.0;
    this.currentAmps = running ? this.maxAmps * 0.75 : 0.0;
  }
}
