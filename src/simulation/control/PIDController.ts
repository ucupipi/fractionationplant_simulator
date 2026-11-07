import { ControllerConfig } from '../../data/control-config';

export class PIDController {
  public config: ControllerConfig;
  public sp: number;
  public mv: number; // 0 to 100%
  public mode: 'MAN' | 'AUTO' | 'CAS';
  private integralSum: number = 0;
  private prevError: number = 0;
  private prevPV: number = 0;

  constructor(config: ControllerConfig) {
    this.config = { ...config };
    this.sp = config.spDefault;
    this.mv = config.outputDefault;
    this.mode = config.defaultMode;
    this.integralSum = config.outputDefault; // Pre-load integral term for bumpless start
  }

  public update(dt: number, pv: number): number {
    if (this.mode === 'MAN') {
      // In MAN mode, integral tracks MV to ensure bumpless transfer to AUTO
      this.integralSum = this.mv;
      this.prevPV = pv;
      this.prevError = (this.config.action === 'DIRECT' ? (pv - this.sp) : (this.sp - pv));
      return this.mv;
    }

    // Error calculation based on direct/reverse action
    // DIRECT: PV increases -> MV increases (e.g. liquid level controller or pressure vent)
    // REVERSE: PV decreases -> MV increases (e.g. steam reboiler heating)
    const error = this.config.action === 'DIRECT' ? (pv - this.sp) : (this.sp - pv);

    // Proportional Term
    const P = this.config.kp * error;

    // Integral Term with Anti-windup
    if (this.config.ti > 0) {
      // Only integrate if output is not saturated or error is pushing away from saturation
      const isSaturatedHigh = this.mv >= this.config.outputMax && error > 0;
      const isSaturatedLow = this.mv <= this.config.outputMin && error < 0;

      if (!isSaturatedHigh && !isSaturatedLow) {
        this.integralSum += (this.config.kp / this.config.ti) * error * dt;
      }
      // Clamp integral sum
      this.integralSum = Math.max(this.config.outputMin, Math.min(this.config.outputMax, this.integralSum));
    }

    // Derivative Term on PV (prevents derivative kick on SP change)
    let D = 0;
    if (this.config.td > 0 && dt > 0) {
      const dPV = (pv - this.prevPV) / dt;
      D = -this.config.kp * this.config.td * (this.config.action === 'DIRECT' ? dPV : -dPV);
    }

    // Raw calculated output
    let rawMV = P + this.integralSum + D;

    // Output clamping
    this.mv = Math.max(this.config.outputMin, Math.min(this.config.outputMax, rawMV));

    this.prevPV = pv;
    this.prevError = error;

    return this.mv;
  }

  public setMode(newMode: 'MAN' | 'AUTO' | 'CAS'): void {
    if (this.mode === newMode) return;

    if (newMode === 'AUTO') {
      // Bumpless transfer from MAN to AUTO: align integral sum with current manual MV
      this.integralSum = this.mv;
    }
    this.mode = newMode;
  }

  public setSP(newSP: number): void {
    this.sp = newSP;
  }

  public setManualMV(newMV: number): void {
    this.mv = Math.max(this.config.outputMin, Math.min(this.config.outputMax, newMV));
    this.integralSum = this.mv;
  }

  public reset(sp?: number, mv?: number, mode?: 'MAN' | 'AUTO' | 'CAS'): void {
    this.sp = sp !== undefined ? sp : this.config.spDefault;
    this.mv = mv !== undefined ? mv : this.config.outputDefault;
    this.mode = mode !== undefined ? mode : this.config.defaultMode;
    this.integralSum = this.mv;
    this.prevError = 0;
    this.prevPV = this.sp;
  }
}
