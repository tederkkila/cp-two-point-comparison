import { plotFRC, plotFTP, plotTTE } from "./calculations_cp.ts";
import optimjs from "optimization-js";
import { MMPDataPoint } from "../types/interfaces.ts"

export class OptimjsOptimization {

  mmpData: MMPDataPoint[];
  bounds: number[][]

  constructor(mmpData: MMPDataPoint[], bounds: number[][]) {
    this.mmpData = mmpData;
    this.bounds = bounds;
  }

  modelForLossFunction = (
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

  lossFunctionToMinimize = (
    params: Array<number>,
  ): number => {
    let mse: number = 0;

    for (let i: number = 0; i < this.mmpData.length; i++) {
      const predicted = this.modelForLossFunction(this.mmpData[i].time, params);
      //console.log(data[i].time, data[i].power, predicted)
      mse += Math.pow(predicted - this.mmpData[i].power, 2);
    }
    //console.log(mse);
    return mse / this.mmpData.length;
  }

  gradientFunction = (
    params: Array<number>,
  ) => {
    const fnc =  (
      params: Array<number>,
    )=> {
      return this.lossFunctionToMinimize(params);
    };
    // evaluations++;
    //console.log(params)


    for (const j in params) {
      params[j] = Math.max(this.bounds[j][0], Math.min(this.bounds[j][1], params[j]));

    }

    const grad:Array<number>= optimjs.numerical_gradient(fnc, params);

    return grad
  };

  solutionLBFGS = (
    testParamArray: Array<number>,
  ) => {
    const solution = optimjs.minimize_L_BFGS(
      this.lossFunctionToMinimize,
      this.gradientFunction,
      testParamArray,
    )

    return solution
  };

}