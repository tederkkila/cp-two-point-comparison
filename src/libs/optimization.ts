import { plotFRC, plotFTP, plotTTE } from "./geometry.ts";
import {
  MMPDataPoint,
  PTSolution
} from "../types/interfaces.ts"

export const pt_model = (
  t: number,
  ptSolution: PTSolution
)=> {

  const frc: number = plotFRC(
    t,
    ptSolution.FRC,
    ptSolution.Pmax,
  );

  const ftp: number = plotFTP(
    t,
    ptSolution.FTP,
    ptSolution.tau2,);

  const tte: number = plotTTE(
    t,
    ptSolution.TTE,
    ptSolution.a,
  );

  //console.log(ptSolution.FTP, ptSolution.tau2)
  //console.log(t, frc, ftp, tte)
  return frc + ftp - tte;
}

export const loss = (
    params: PTSolution,
    data: MMPDataPoint[],
): number => {
  let mse: number = 0;

  for (let i: number = 0; i < data.length; i++) {
    const predicted = pt_model(data[i].time, params);
    mse += Math.pow(predicted - data[i].power, 2);
  }
  //console.log(mse);
  //return mse / data.length;
  return mse;
}

// Example using a simple gradient descent
export const gradientDescent = (
  loss: (
    initialParams : PTSolution,
    data: MMPDataPoint[],
    ) => number,
  initialParams : PTSolution,
  data: MMPDataPoint[],
  learningRate: PTSolution,
  learningDecay: number,
  iterations: number,
  parameterBounds:Record<string, Array<number>>,
  minMSEDelta:number,
  )=> {

  //console.log("optimization", {...initialParams})


  const params: PTSolution = {...initialParams};
  const mse0 = loss(initialParams, data);
  let mseLast: number = mse0;
  let finalIterationCount: number = 0;
  for (let i = 0; i < iterations; i++) {


    //console.log("iteration", i);
    const grad = numericalGradient(loss, params, data);

    let j: keyof PTSolution;
    for (j in params) {
      learningRate[j] *= learningDecay;
      const delta = learningRate[j] * grad[j];
      params[j] -= delta;
      params[j] = Math.max(parameterBounds[j][0], Math.min(parameterBounds[j][1], params[j]));

    }
    // console.log(params)
    //correct Pmax < FTP
    if (params["Pmax"] <= params["FTP"] ) {
      console.log(params["Pmax"], params["FTP"])
      params["Pmax"] -= 3 * (params["Pmax"] - params["FTP"]);
    } else if (params["Pmax"] <= 2.5 * params["FTP"] ) {
      params["Pmax"] += 2.5 * (params["Pmax"] - params["FTP"]);
    }

    //Check power at 5s
    const predicted5s = pt_model(5, params);
    //Correct FRC to be 4 times power at 5 sec
    if (params["FRC"] < 15 * predicted5s){
      //console.log("FRC: ", params["FRC"], predicted5s)
      params["FRC"] += 1/15 * predicted5s;
    }

    //Keep Pmax from getting too big compared to FRC
    if (params["Pmax"] > 1.05 * predicted5s){
      //console.log("Pmax: ", params["Pmax"], predicted5s)
      params["Pmax"] *= 0.99;
    }

    const mseCurrent = loss(params, data);
    finalIterationCount = i+1;
    if (Math.abs(mseCurrent - mseLast) < minMSEDelta) {
      console.log(`stopping iterations at ${i} for min delta ${minMSEDelta}`)

      i = iterations

    } else if(mseCurrent < 0.005){
      console.log(`stopping iterations at ${i} for mse under 0.005`)
      i = iterations
    } else {
      mseLast = mseCurrent;
    }

  }

  const mse = loss(params, data);
  let j: keyof PTSolution;
  for (j in params) {
    if (j === "FRC" || j === "Pmax" || j === "TTE") {
      params[j] = Math.round(params[j]);
    } else {
      params[j] = Math.round(params[j]*10)/10;
    }
  }

  const mseRound = loss(params, data);
  //console.log(params)
  return {
    params    : {...params},
    iterations: finalIterationCount,
    mse0      : Math.round(mse0 * 1000) / 1000,
    mse       : Math.round(mse * 1000) / 1000,
    mseRound  : Math.round(mseRound * 1000) / 1000
  };
}

export const numericalGradient = (
  loss: (params:PTSolution, data:MMPDataPoint[]) => number,
  params: PTSolution,
  data: MMPDataPoint[],
  )=> {
  const grad: PTSolution = {
    FRC : 0,
    Pmax : 0,
    FTP : 0,
    tau2 : 0,
    TTE: 0,
    a : 0,
  };
  const delta = 0.0001;
  let j: keyof PTSolution;
  //console.log(params)
  for (j in params) {

    const initialValue = params[j];
    params[j] = initialValue + delta;
    const lossPlusDelta: number = loss(params, data);
    params[j] = initialValue - delta;
    const lossMinusDelta: number = loss(params, data);

    grad[j] = (lossPlusDelta - lossMinusDelta) / (2 * delta);
    params[j] = initialValue;
    //console.log(j, delta, lossPlusDelta, lossMinusDelta, grad[j] );
  }

  return grad;
}
