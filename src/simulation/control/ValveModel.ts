export class ValveModel {
  public id: string;
  public commandedPosition: number; // 0 to 100%
  public actualPosition: number; // 0 to 100%
  public cvMax: number;
  public tauActuator: number = 1.0; // actuator lag (seconds)
  public isStuck: boolean = false;
  public stuckPosition: number = 0;
  public stictionDeadband: number = 0; // % stiction
  public stictionSlipJump: number = 0; // % slip jump
  private internalAccumulatedForce: number = 0;

  constructor(id: string, initialPosition: number, cvMax: number = 100) {
    this.id = id;
    this.commandedPosition = initialPosition;
    this.actualPosition = initialPosition;
    this.cvMax = cvMax;
  }

  public update(dt: number, commandedPos: number): number {
    this.commandedPosition = Math.max(0, Math.min(100, commandedPos));

    if (this.isStuck) {
      this.actualPosition = this.stuckPosition;
      return this.actualPosition;
    }

    if (this.stictionDeadband > 0) {
      // Non-linear stiction model (Chou & Kano model)
      const diff = this.commandedPosition - this.actualPosition;
      this.internalAccumulatedForce += diff;

      if (Math.abs(this.internalAccumulatedForce) >= this.stictionDeadband) {
        // Slip happens
        const sign = Math.sign(this.internalAccumulatedForce);
        this.actualPosition += sign * (this.stictionSlipJump + Math.abs(diff) * 0.5);
        this.internalAccumulatedForce = 0;
      }
    } else {
      // Linear first-order actuator lag: dx/dt = (cmd - x) / tau
      const alpha = Math.min(1.0, dt / (this.tauActuator + dt));
      this.actualPosition += alpha * (this.commandedPosition - this.actualPosition);
    }

    this.actualPosition = Math.max(0, Math.min(100, this.actualPosition));
    return this.actualPosition;
  }

  public getFlowCapacity(): number {
    // Equal percentage or linear valve flow characteristic
    // f(x) = (x/100)^1.5 for slight equal-percentage curve
    const openFraction = this.actualPosition / 100;
    return Math.pow(openFraction, 1.3) * this.cvMax;
  }

  public setStuck(stuck: boolean, pos?: number): void {
    this.isStuck = stuck;
    if (stuck && pos !== undefined) {
      this.stuckPosition = pos;
      this.actualPosition = pos;
    }
  }

  public reset(pos: number): void {
    this.commandedPosition = pos;
    this.actualPosition = pos;
    this.isStuck = false;
    this.stictionDeadband = 0;
    this.stictionSlipJump = 0;
  }
}
