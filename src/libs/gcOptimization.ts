import { ExtendedSolution, MMPDataPoint, StrydPDC } from "../types/interfaces.ts";
import { iterateExtendedParams } from "./calculations_extended.ts";

export const lossTimeIntervals = (
  timeIntervals: Record<string, number>,
  perfectSolution: ExtendedSolution,
  pdc: StrydPDC,
): number => {
  let mse: number = 0;

  //using timeParams given find gc solution for params
  //set min values from perfect solution
  const params : ExtendedSolution = {
    ...perfectSolution,
    paa: 300,
    paadec: -2,
    tau: 1.0,
    cp: 300,
    cpdec: -1,
  };

  const maxLoops = 15;
  const modelVersion = 5; //use 5!
  const functionalData: MMPDataPoint[] = [];

  const roundedTimeEntries = Object.entries(timeIntervals).map(([key, value]) => {
    return [key, Math.round(value)];
  })

  const roundedTimeIntervals = Object.fromEntries(roundedTimeEntries);

  const gcSolution: ExtendedSolution =  iterateExtendedParams (
    maxLoops,
    [...pdc.curve.power_list],
    roundedTimeIntervals,
    functionalData,
    {...params},
    modelVersion,
  )

  //console.log(gcSolution);

  let j: keyof Record<string, number>;
  for (j in perfectSolution) {
    //console.log(gcSolution[j] , perfectSolution[j]);
    mse += Math.pow(gcSolution[j] - perfectSolution[j], 2);
  }

  //console.log(mse);
  return mse / Object.keys(perfectSolution).length;
}

export const gradientDescentTimeIntervals = (
  loss: (
    timeIntervals : Record<string, number>,
    perfectParams: ExtendedSolution,
    pdc:StrydPDC,
  ) => number,
  timeIntervals: Record<string, number>,
  perfectSolution : ExtendedSolution,
  pdc: StrydPDC,
  learningRate: Record<string, number>,
  learningDecay: number,
  iterations: number,
  parameterBounds:Record<string, number[]>,
  minMSEDelta:number,
)=> {

  //console.log("optimization", {...initialParams})


  const params = {...timeIntervals};
  const mse0 = loss(timeIntervals, perfectSolution, pdc);
  let mseLast: number = mse0;
  let finalIterationCount: number = 0;
  for (let i = 0; i < iterations; i++) {

    //console.log("iteration", i);
    const grad = numericalGradientTimeIntervals(loss, params, perfectSolution, pdc);
    //console.log(grad);
    console.log(JSON.stringify(grad))

    let delta: number;
    let j: keyof Record<string, number>;
    for (j in params) {
      learningRate[j] *= learningDecay;
      delta = learningRate[j] * grad[j];
      params[j] -= delta;
      params[j] = Math.max(parameterBounds[j][0], Math.min(parameterBounds[j][1], params[j]));
    }
    console.log(JSON.stringify(params))

    const mseCurrent = loss(params, perfectSolution, pdc);
    console.log("change mse", mseCurrent, mseLast, Math.abs(mseCurrent - mseLast))
    finalIterationCount = i + 1;

    if (Math.abs(mseCurrent - mseLast) < minMSEDelta) {
      console.log(`stopping iterations at ${i} for min delta ${minMSEDelta}`)

      i = iterations

    } else if(mseCurrent < 0.00005){
      //good luck getting this perfect!!!
      console.log(`stopping iterations at ${i} for mse under 0.00005`)
      i = iterations
    } else if (i != iterations - 1) {
      mseLast = mseCurrent;
    }

  }

  const mse = loss(params, perfectSolution, pdc);
  let j: keyof Record<string, number>;
  for (j in params) {
      params[j] = Math.round(params[j]*10000)/10000;
  }

  const mseRound = loss(params, perfectSolution, pdc);

  return {
    params      : { ...params },
    iterations  : finalIterationCount,
    mse0        : Math.round(mse0 * 10000) / 10000,
    mseStop     : Math.round(mse * 10000000) / 10000000,
    mseEffective: Math.round(mseRound * 10000000) / 10000000,
    msePrev     : Math.round(mseLast * 10000000) / 10000000,
  };
}

export const numericalGradientTimeIntervals = (
  loss: (
    params:Record<string, number>,
    perfectSolution: ExtendedSolution,
    pdc:StrydPDC
  ) => number,
  params: Record<string, number>,
  perfectSolution: ExtendedSolution,
  pdc: StrydPDC,
)=> {
  const grad: Record<string, number> = {
    maxI1: 0,
    maxI2: 0,
    sanI1: 0,
    sanI2: 0,
    anI1 : 0,
    anI2 : 0,
    aeI1 : 0,
    aeI2 : 0,
    laeI1: 0,
    laeI2: 0,
  };
  let delta = 1.0; //0.000001;
  let j: keyof Record<string, number>;
  //console.log(params)
  for (j in params) {

    const initialValue = params[j];
    if (j == 'maxI1' || j == 'maxI2') {
      delta = 1.0;
    } else if (j == 'sanI1' || j == 'sanI2') {
      delta = 10.0;
    } else if (j == 'anI1' || j == 'anI2') {
      delta = 20.0;
    } else {
      delta = 100;
    }
    params[j] = initialValue + delta;
    const lossPlusDelta: number = loss(params, perfectSolution, pdc);
    params[j] = initialValue - delta;
    const lossMinusDelta: number = loss(params, perfectSolution, pdc);

    grad[j] = (lossPlusDelta - lossMinusDelta) / (2 * delta);
    params[j] = initialValue;
    //console.log(j, delta, lossPlusDelta, lossMinusDelta, grad[j] );
  }

  return grad;
}