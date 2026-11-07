export class TransmitterModel {
  public id: string;
  public trueValue: number;
  public measuredValue: number;
  public bias: number = 0;
  public frozen: boolean = false;
  public frozenValue: number = 0;
  public lagSeconds: number = 0.5;
  public noiseAmplitude: number = 0;
  public rangeMin: number;
  public rangeMax: number;

  constructor(id: string, initialValue: number, rangeMin: number, rangeMax: number) {
    this.id = id;
    this.trueValue = initialValue;
    this.measuredValue = initialValue;
    this.rangeMin = rangeMin;
    this.rangeMax = rangeMax;
  }

  public update(dt: number, newTrueValue: number): void {
    this.trueValue = Math.max(this.rangeMin, Math.min(this.rangeMax, newTrueValue));

    if (this.frozen) {
      this.measuredValue = this.frozenValue;
      return;
    }

    // Target with bias and random noise
    const noise = (Math.random() - 0.5) * 2 * this.noiseAmplitude;
    const target = this.trueValue + this.bias + noise;

    // First-order sensor lag: dy/dt = (target - y) / tau
    if (this.lagSeconds > 0) {
      const alpha = Math.min(1.0, dt / (this.lagSeconds + dt));
      this.measuredValue += alpha * (target - this.measuredValue);
    } else {
      this.measuredValue = target;
    }

    // Clamp to transmitter range
    this.measuredValue = Math.max(this.rangeMin, Math.min(this.rangeMax, this.measuredValue));
  }

  public setBias(bias: number): void {
    this.bias = bias;
  }

  public freeze(freezeVal?: number): void {
    this.frozen = true;
    this.frozenValue = freezeVal !== undefined ? freezeVal : this.measuredValue;
  }

  public unfreeze(): void {
    this.frozen = false;
  }

  public reset(val: number): void {
    this.trueValue = val;
    this.measuredValue = val;
    this.bias = 0;
    this.frozen = false;
    this.frozenValue = val;
  }
}
