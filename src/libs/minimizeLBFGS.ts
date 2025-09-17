import { plotFRC, plotFTP, plotTTE } from "./calculations_pt.ts";
import { MMPDataPoint } from "../types/interfaces.ts";

interface LBFGSParams {
  m?: number; // Number of correction vectors to store (default: 10)
  epsilon?: number; // Tolerance for convergence (default: 1e-5)
  maxIterations?: number; // Maximum number of iterations (default: 100)
  verbose?: boolean;
}

export class minimizeLBFGS
{

  mmpData: MMPDataPoint[];
  bounds: number[][];
  learningWeights: number[];
  verbose?: boolean;
  penaltyLearningRate: number = 10;
  maxPenaltyWeight = 1000;
  minPenaltyWeight = 0.1;

  constructor(mmpData: MMPDataPoint[], bounds: number[][], learningWeights: number[]) {
    this.mmpData = mmpData;
    this.bounds = bounds;
    this.learningWeights = learningWeights;
  }

  minimizeLBFGS(
    initialGuess: number[],
    params: LBFGSParams = {}
  ): { solution: number[]; value: number; iterations: number } {

    const func:(
      x: number[],
      penaltyX: number[],
      silent?: boolean,
    ) => number = this.constrainedLossFunction;

    const { m = 10, epsilon = 1e-5, maxIterations = 100, verbose = false } = params;
    this.verbose = verbose;
    let x = [...initialGuess];
    let penaltyX: number[] = new Array(x.length).fill(0.1);

    if (this.verbose) console.log("minimizeLBGGS | x: " + x)

    //let f = func(x, penaltyX);

    let grad = this.numericalGradient(func, x, penaltyX);
    //console.log("grad (initial):\n" + grad);
    const s: number[][] = [];
    const y: number[][] = [];
    let iterations = 0;


    while (iterations < maxIterations && this.norm2(grad) > epsilon) {

      if (this.verbose) console.log("\n\n\n\n\nminimizeLBGGS: i = " + iterations)
      if (verbose) console.log("x: " + x)
      //console.log("minimizeLBGGS: this.norm2(grad) = " + this.norm2(grad))
      const rho: number[] = [];
      const alpha: number[] = [];
      let q = [...grad];

      for (let i = s.length - 1; i >= 0; i--) {
        rho[i] = 1 / this.dot(y[i], s[i]);
        alpha[i] = rho[i] * this.dot(s[i], q);
        q = this.subtract(q, this.multiply(y[i], alpha[i]));
      }

      let r = this.multiply(q, this.approximateHessian(s, y));


      for (let i = 0; i < s.length; i++) {
        const beta = rho[i] * this.dot(y[i], r);
        r = this.add(r, this.multiply(s[i], alpha[i] - beta));
      }


      const descentDirection = this.multiply(r, -1);

      // for (const j in descentDirection) {
      //   while (Math.abs(descentDirection[j]) > 10) {
      //     descentDirection[j] /= 2;
      //   }
      // }
      const learningRate = this.lineSearch(func, x, penaltyX, descentDirection);
      const directionalLearningRate = this.multiply(descentDirection, learningRate);
      const xNew = this.add(x, directionalLearningRate);

      if (verbose) console.log("descentDirection: " + descentDirection);
      if (verbose) console.log("learningRate: " + learningRate);
      if (verbose) console.log("xNew:\n" + xNew);
      //for (const j in xNew) {
        //xNew[j] = Math.max(this.bounds[j][0], Math.min(this.bounds[j][1], xNew[j]));
      //}

      //console.log("xNew (bounds update):\n" + xNew);

      //update weights
      const penaltyX0 = this.calculatePenalties(xNew, penaltyX, 'updatePenalties') as number[];
      if (verbose) console.log(penaltyX)
      if (verbose) console.log(penaltyX0)
      penaltyX = penaltyX0;


      const gradNew = this.numericalGradient(func, xNew, penaltyX);

      s.push(this.subtract(xNew, x));
      y.push(this.subtract(gradNew, grad));

      if (s.length > m) {
        s.shift();
        y.shift();
      }

      x = xNew;
      //f = fNew;
      grad = gradNew;
      //console.log(grad)
      iterations++;


    }
    const fNew = func(x, penaltyX);
    return { solution: x ,value: fNew, iterations };
  }

  numericalGradient(
    func: (x: number[], penaltyX: number[], silent?: boolean) => number,
    x: number[],
    penaltyX: number[],
    h: number = 1e-4,
  ): number[] {
    const grad: number[] = [];
    for (let i = 0; i < x.length; i++) {
      const xPlusH = [...x];
      xPlusH[i] += h;
      const xMinusH = [...x];
      xMinusH[i] -= h;
      // console.log("  numericalGradient " + i + "\n  " + func(xPlusH, penaltyX, true) + "\n  " + func(xMinusH, penaltyX, true));
      // console.log(func(xPlusH, penaltyX, true) - func(xMinusH, penaltyX, true))
      grad[i] = (func(xPlusH, penaltyX, true) - func(xMinusH, penaltyX, true)) / (2 * h);
      grad[i] *= this.learningWeights[i];
    }

    //no penalties or weights applied at numerical gradient as it is used for many tasks

    return grad;
  }

 lineSearch(
    func: (x: number[], penaltyX: number[], silent?: boolean) => number,
    x: number[],
    penaltyX: number[],
    descentDirection: number[],
    alpha: number = 1.0,
    rho: number = 0.5,
    c: number = 1e-4
  ): number {
    const f = func(x, penaltyX, true);
    let alphaCurrent = alpha;
    while (
      func(
        this.add(x, this.multiply(descentDirection, alphaCurrent)),
        penaltyX,
        true)
      > f + c * alphaCurrent * this.dot(this.numericalGradient(
      func,
      x,
      penaltyX,
    ), descentDirection) && alphaCurrent > 0.001) {
      //console.log("alphaCurrent: " + alphaCurrent);
      alphaCurrent *= rho;
    }
    return alphaCurrent;
  }

  approximateHessian(
    s: number[][],
    y: number[][],
  ): number {
    if (s.length === 0) {
      return 1;
    }
    const sk: number[] = s[s.length - 1];
    const yk: number[] = y[y.length - 1];
    return this.dot(sk, yk) / this.dot(yk, yk);
  }

  private dot(a: number[], b: number[]): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  private norm2(a: number[]): number {
    return Math.sqrt(this.dot(a, a));
  }

  private subtract(a: number[], b: number[]): number[] {
    return a.map((val, index) => val - b[index]);
  }

  private add(a: number[], b: number[]): number[] {
    return a.map((val, index) => val + b[index]);
  }

  private multiply(a: number[], scalar: number): number[] {
    return a.map((val) => val * scalar);
  }

  private pt_model = (
    t: number,
    params: Array<number>
  ) => {

    const frc: number = plotFRC(
      t,
      params[0], //FRC
      params[1],//Pmax
    );

    const ftp: number = plotFTP(
      t, //t
      params[2], //FTP
      params[3], //tau2
    );

    const tte: number = plotTTE(
      t, //t
      params[4], //TTE
      params[5], //a
    );
    //console.log("model: " + t, frc, ftp, tte, frc + ftp - tte);
    return frc + ftp - tte;
  };

  constrainedLossFunction = (
    params: Array<number>,
    penaltyX: number[],
    silent?: boolean,
  ): number => {
    let mse: number = 0;

    for (let i: number = 0; i < this.mmpData.length; i++) {
      const predicted = this.pt_model(this.mmpData[i].time, params);
      //if (!silent && this.verbose) console.log(params);
      //if (!silent && this.verbose) console.log(predicted);
      //console.log(this.mmpData[i].time, this.mmpData[i].power, predicted)
      mse += Math.pow(predicted - this.mmpData[i].power, 2);
    }
    if (!silent && this.verbose) console.log("    mse:      " + mse);

    const penalty = this.calculatePenalties (
      params,
      penaltyX,
      'applyPenalty',
      silent,
    ) as number;

    if (!silent && this.verbose) console.log("    penaltyX: " + penaltyX);
    if (!silent && this.verbose) console.log("    penalty : " + penalty);
    //console.log(mse / this.mmpData.length)
    //console.log(penalty)
    return mse / this.mmpData.length + penalty
  };

  calculatePenalties = (
    params: Array<number>,
    penaltyX: number[],
    type: string,
    silent?: boolean,
  )=> {

    if (!silent && this.verbose) console.log(`calculatePenalties: ${type}`);

    let penalty = 0;
    const penaltyX0 = [...penaltyX];
    let i: number;

    const predicted5s = this.pt_model(5, params);
    if (!silent && this.verbose) console.log("predicted5s: " + predicted5s)
    //FRC Constraints
    // 5000 < 15*Prediction*5s) < FRC < 35000
    i = 0;
    const minFRC = this.bounds[i][0];
    const maxFRC = this.bounds[i][1];

    if (params[i] < minFRC) {
      if (!silent && this.verbose) console.log(`❌FRC < ${minFRC}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * 10 * (minFRC - params[i])
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (params[i] < 15 * predicted5s) {
      if (!silent && this.verbose) console.log(`❌FRC < ${15 * predicted5s}`)
      if (type == 'applyPenalty') {
      penalty += penaltyX0[i] * 10 * (15 * predicted5s - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxFRC < params[i]) {
      if (!silent && this.verbose) console.log(`❌FRC > ${maxFRC}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * 10 * (params[i] - maxFRC);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty') {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          //✅
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    //Pmax Constraints
    //300 < 2.5 FTP < Pmax < 2000
    i = 1
    const minPmax = this.bounds[i][0];
    const maxPmax = this.bounds[i][1];

    if (params[i] < minPmax) {
      if (!silent && this.verbose) console.log(`❌PMax < ${minPmax}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (minPmax - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (params[i] < 2.5 * params[2]) {
      if (!silent && this.verbose) console.log(`❌PMax < ${2.5 * params[2]}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (2.5 * params[2] - params[i])
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxPmax < params[i]) {
      if (!silent && this.verbose) console.log(`❌PMax > ${maxPmax}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (params[i] - maxPmax);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty') {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    //FTP Contraints
    //100 < FTP < 750
    i = 2;
    const minFTP = this.bounds[i][0];
    const maxFTP = this.bounds[i][1];

    if (params[i] < minFTP) {
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (minFTP - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxFTP < params[i]) {
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (params[i] - maxFTP);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty')
      {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    //tau2 Contrainst
    // keep tau2 near 12.8
    i = 3;
    const mintau2 = this.bounds[i][0];
    const maxtau2 = this.bounds[i][1];

    // if (Math.round(params[i] * 10) / 10 !== 12.8) {
    //   if (!silent && this.verbose) console.log(penaltyX0[i] * (10 * (12.8 - params[i])) ** 2)
    //   penalty += 2 * (10 * (12.8 - params[i])) ** 2;
    // }

    if (params[i] < mintau2) {
      if (!silent && this.verbose) console.log(`❌tau2 < ${mintau2}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (mintau2 - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxtau2 < params[i]) {
      if (!silent && this.verbose) console.log(`❌tau2 > ${maxtau2}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (params[i] - maxtau2);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty') {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    //TTE Contraints
    //180 < FTP < 1200
    i = 4;
    const minTTE = this.bounds[i][0];
    const maxTTE = this.bounds[i][1];

    if (params[i] < minTTE) {
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (minTTE - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxTTE < params[i]) {
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (params[i] - maxTTE);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty') {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    //a Constraints
    // 10 < a < 20
    i = 5;
    const mina = this.bounds[i][0];
    const maxa = this.bounds[i][1];

    if (params[i] < mina) {
      if (!silent && this.verbose) console.log(`❌a < ${mina}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (mina - params[i]);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else if (maxa < params[i]) {
      if (!silent && this.verbose) console.log(`❌a > ${maxa}`)
      if (type == 'applyPenalty') {
        penalty += penaltyX0[i] * (params[i] - maxa);
      } else {
        penaltyX0[i] = Math.min(this.maxPenaltyWeight, penaltyX0[i] + this.penaltyLearningRate);
      }
    } else {
      if (type != 'applyPenalty') {
        if (penaltyX0[i] > this.minPenaltyWeight) {
          penaltyX0[i] = Math.min(this.minPenaltyWeight, penaltyX0[i] - this.penaltyLearningRate);
        } else {
          penaltyX0[i] = this.minPenaltyWeight;
        }
      }
    }

    if (type == 'applyPenalty') {
      return penalty;
    }
    return penaltyX0;
  };
}
