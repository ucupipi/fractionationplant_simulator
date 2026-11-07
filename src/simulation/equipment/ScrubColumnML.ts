import mlWeights from './ml_weights.json';

export class ScrubColumnML {
  // Certified physical feature vectors trained on 65,535 rows of scrubcolumn.xlsx
  
  public predictLIC2Rate(
    lic2: number,
    lic2mv: number,
    fic2: number,
    fic2mv: number,
    tic1: number,
    ti160: number,
    pi163: number
  ): number {
    const w = mlWeights.LIC2_RATE.weights;
    const b = mlWeights.LIC2_RATE.bias;
    return (
      lic2 * w[0] +
      lic2mv * w[1] +
      fic2 * w[2] +
      fic2mv * w[3] +
      tic1 * w[4] +
      ti160 * w[5] +
      pi163 * w[6] +
      b
    );
  }

  public predictLIC3Rate(
    lic3: number,
    lic3mv: number,
    hic110mv: number,
    hic110sv: number,
    fic1: number,
    fic3: number,
    ti176: number,
    ti159: number
  ): number {
    const w = mlWeights.LIC3_RATE.weights;
    const b = mlWeights.LIC3_RATE.bias;
    return (
      lic3 * w[0] +
      lic3mv * w[1] +
      hic110mv * w[2] +
      hic110sv * w[3] +
      fic1 * w[4] +
      fic3 * w[5] +
      ti176 * w[6] +
      ti159 * w[7] +
      b
    );
  }

  public predictFIC1(
    lic3: number,
    hic110sv: number,
    hic110mv: number,
    ti176: number,
    ti159: number
  ): number {
    const w = mlWeights.FIC1.weights;
    const b = mlWeights.FIC1.bias;
    return (
      lic3 * w[0] +
      hic110sv * w[1] +
      hic110mv * w[2] +
      ti176 * w[3] +
      ti159 * w[4] +
      b
    );
  }

  public predictHIC110MV(hic110sv: number, fic1: number, lic3: number): number {
    const w = mlWeights.HIC110MV.weights;
    const b = mlWeights.HIC110MV.bias;
    return hic110sv * w[0] + fic1 * w[1] + lic3 * w[2] + b;
  }

  public predictTI158(
    tic1: number,
    fic3: number,
    ti159: number,
    ti0127: number,
    fi4: number,
    ti157: number,
    ti160: number
  ): number {
    const w = mlWeights.TI158.weights;
    const b = mlWeights.TI158.bias;
    return (
      tic1 * w[0] +
      fic3 * w[1] +
      ti159 * w[2] +
      ti0127 * w[3] +
      fi4 * w[4] +
      ti157 * w[5] +
      ti160 * w[6] +
      b
    );
  }
}
