import { ExtendedSolution, ExtendedSolutionIterated, MMPDataPoint } from "../types/interfaces.ts";

// P = paa* exp(paa_dec*(x/60)^z) + ecp * (1-exp(tau_del*x/60)) * (1-exp(ecp_del*x/60)) * (1+ecp_dec*exp(-180/x/60) (1 + etau/(x/60))


export const extended_model = (
  t: number,
  extendedSolution: ExtendedSolution
)=> {

  const c1: number = plotC1(
    t,
    extendedSolution.paa,
    extendedSolution.paadec,
  );
  const c2: number = plotC2(
    t,
    extendedSolution.cp,
    extendedSolution.tau,
    extendedSolution.taudel,
    extendedSolution.cpdel,
    extendedSolution.cpdec,
    extendedSolution.cpdecdel,
  );
  const c3: number = plotC3(
    t,
    extendedSolution.cp,
    extendedSolution.taudel,
    extendedSolution.cpdel,
    extendedSolution.cpdec,
    extendedSolution.cpdecdel,
  );

  return c1 + c2 + c3;
}

export const plotC1 = (
  t: number,
  paa : number,
  paadec : number,
) => {

  //Pi(t)=Paa⋅(1.20−0.20exp(−t/60))⋅exp(−λPaa,dec⋅t/60)
  let c1 = (paa * (1.2 - 0.2 * Math.exp(-1 * t /60)) * Math.exp(paadec * (t/60)));

  if (c1 < 0.0000001) {
    c1 = 0;
  } else {
    c1 = Math.round(c1 * 1000000) / 1000000;
  }

  return c1
}

export const plotC2 = (
  t: number,
  cp : number,
  tau : number,
  taudel : number,
  cpdel : number,
  cpdec : number,
  cpdecdel : number,
) => {


  let c2 = (cp * (1-Math.exp(taudel*t/60)) *(1-Math.exp(cpdel*t/60)) * (1+cpdec*Math.exp(cpdecdel/(t/60))) * (tau/(t/60)));

  if (c2 < 0.0000001) {
    c2 = 0;
  } else {
    c2 = Math.round(c2 * 1000000) / 1000000;
  }

  return c2
}

export const plotC3 = (
  t: number,
  cp : number,
  taudel : number,
  cpdel : number,
  cpdec : number,
  cpdecdel : number,
) => {

  let c3 = (cp*(1-Math.exp(taudel*(t/60)))*(1-Math.exp(cpdel*(t/60)))*(1+cpdec*Math.exp(cpdecdel/(t/60)))*(1));

  if (c3 < 0.0000001) {
    c3 = 0;
  } else {
    c3 = Math.round(c3 * 1000000) / 1000000;
  }

  return c3
}

export const plotFull = (
  t: number,
  params: ExtendedSolution,
  version: number = 5,
): number => {

  const x = t / 60;
  let power = 0;

  if (version == 5) {
    power = (params.paa * (1.20 - 0.20 * Math.exp(-1 * x)) * Math.exp(params.paadec * x))
    + (params.cp
      * (1 - Math.exp(params.taudel * x))
      * (1 - Math.exp(params.cpdel * x))
      * (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
      * (1 + params.tau / (x))
      )
    ;
  } else if (version == 6) {
    power = (params.paa * (1.10 - 0.10 * Math.exp(-8 * x)) * Math.exp(params.paadec * x))
      + (params.cp
        * (1 + params.cpdec * Math.exp(params.cpdecdel/(x)))
        * (1 * (1 - Math.exp(params.cpdel * x)) + Math.pow((1 - Math.exp(params.taudel * x)),2) * params.tau/(x))
      )
    ;

  }

  return power
}

export const solve_cp = (
  t: number,
  power: number,
  params: ExtendedSolution,
  version: number = 5,
) :number => {

  const x = t / 60;
  let cp = 0;

  if (version == 5) {
    cp = (power - (params.paa * (1.20-0.20 * Math.exp(-1 * x)) * Math.exp(params.paadec * x)))
      / (1 - Math.exp(params.taudel * x))
      / (1 - Math.exp(params.cpdel * x))
      / (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
      / (1 + params.tau / (x))
    ;
  } else if (version == 6) {
    cp = (power - (params.paa * (1.10 - 0.10 * Math.exp(-8 * x)) * Math.exp(params.paadec * x)))
      / (1 + params.cpdec*Math.exp(params.cpdecdel / (x)))
      / (
        (1-Math.exp(params.cpdel * x))
        + Math.pow((1 - Math.exp(params.taudel * x)),2) * params.tau / (x)
      )
    ;
  }

  return cp
}

export const solve_tau = (
  t: number,
  power: number,
  params: ExtendedSolution,
  version: number = 5,
) :number => {

  const x = t / 60;
  let tau = 0;

  if (version == 5) {
    tau = (
      (
        (power - (params.paa * (1.20-0.20 * Math.exp(-1 * x)) * Math.exp(params.paadec * x)))
          / params.cp
          / (1 - Math.exp(params.taudel * x))
          / (1 - Math.exp(params.cpdel * x))
          / (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
      ) - 1
      ) * x
    ;
  } else if (version == 6) {
    tau = (
      (power - params.paa * (1.10 - 0.10 * Math.exp(-8 * x)) * Math.exp(params.paadec * x))
      / params.cp
      / (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
      - 1 * (1 - Math.exp(params.cpdel * x))
    ) * (x) / Math.pow((1 - Math.exp(params.taudel*x)),2);
  }

  return tau
}

export const solve_paadec = (
  t: number,
  power: number,
  params: ExtendedSolution,
  version: number = 5,
) :number => {

  const x = t / 60;
  let paadec = 0;

  if (version == 5) {

    paadec = Math.log (
      (power - (params.cp
        * (1 - Math.exp(params.taudel * x))
        * (1 - Math.exp(params.cpdel * x))
        * (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
        * (1 + params.tau / (x))
      ))
    / (params.paa * (1.20-0.20 * Math.exp(-1 * x)))
    ) / x
    ;
  } else if (version == 6) {
    paadec = 0
  }

  return paadec
}

export const solve_paa = (
  t: number,
  power: number,
  params: ExtendedSolution,
  version: number = 5,
) :number => {

  const x = t / 60;
  let paa = 0;

  if (version == 5) {
    paa =
      (power
        - (params.cp
          * (1 - Math.exp(params.taudel * x))
          * (1 - Math.exp(params.cpdel * x))
          * (1 + params.cpdec * Math.exp(params.cpdecdel / (x)))
          * (1 + params.tau / (x))
          )
      )
      / (1.20-0.20 * Math.exp(-1 * x))
      / Math.exp(params.paadec * x)
    ;
  }

  return paa

}

export const solve_cpdec = (
  t: number,
  power: number,
  params: ExtendedSolution,
  version: number = 5,
) :number => {

  const x = t / 60;
  let cpdec = 0;
  
  if (version == 5) {
  cpdec =
    (
      (
        (power - (params.paa * (1.20-0.20 * Math.exp(-1 * x)) * Math.exp(params.paadec * x)))
        / params.cp
        / (1 - Math.exp(params.taudel * x))
        / (1 - Math.exp(params.cpdel * x))
        / (1 + params.tau / (x))
      ) - 1
    ) / Math.exp(params.cpdecdel / (x))
    ;
  }

  return cpdec

}
export const findBest = (
  t0: number,
  t1: number,
  data: number[],
): Record <string, number> => {

  const best : Record <string, number> = {
    t : 1,
    power: 0,
  };

  for (let t: number = t0; t < t1; t++) {
    // if (t < 100) {
    //   console.log(t, data[t-1]);
    // }
    if (data[t-1] >= best.power) {
      best.t = t;
      best.power = data[t-1];
    }
  }
  return best
}

export const iterateExtendedParams = (
  maxLoops: number,
  powerArray: number[],
  timeIntervals: Record<string, number>,
  functionalData: MMPDataPoint[],
  params: ExtendedSolution,
  modelVersion: number = 5,
  verbose: boolean = false,
): ExtendedSolutionIterated => {

  const deltaMax_tau = 0.0001;
  const deltaMax_paa = 0.01;
  const deltaMax_paadec = 0.0001;
  console.log(timeIntervals)

  let iteration = 0;
  while (true) { // An infinite loop that will be broken

    if (iteration++ >= maxLoops) {
      console.log(`Breaking loop after ${maxLoops} iterations.`);
      break;
    }

    functionalData.forEach((value) => {
      value.time = 0;
      value.power = 0;
    })

    const previousParams = {...params};

    if (verbose) console.log (`*** Current iteration: ${iteration}`, "cp", params.cp, "tau", params.tau);
    //console.log({...params});

    // Solve for CP [asymptote]
    params.cp = 0; //set estimate to zero
    for (let i: number = timeIntervals.aeI1; i <= timeIntervals.aeI2; i++) {

      const i_cp = solve_cp(i, powerArray[i-1], { ...params }, modelVersion);

      if (params.cp < i_cp) {
        params.cp = i_cp;
        functionalData[3] = { time: i, power: powerArray[i-1] };
      }
    }

    if (verbose) console.log("functional data cp", functionalData[3].time, functionalData[3].power);
    if (verbose) console.log(iteration, "params.cp", params.cp, previousParams.cp, params.cp - previousParams.cp);

    // SOLVE FOR TAU [curvature constant]
    params.tau = 0.5; // drop current estimate down to min
    for (let i: number = timeIntervals.anI1; i <= timeIntervals.anI2; i++) {

      const i_tau = solve_tau(i, powerArray[i-1], { ...params }, modelVersion);
      //console.log(i_tau);

      if (params.tau < i_tau ) {
        params.tau = i_tau;
        //console.log(i_tau);
        functionalData[2] = { time: i, power: powerArray[i-1] };
      } else if (i == timeIntervals.anI1) {
        functionalData[2] = { time: timeIntervals.anI1, power: powerArray[timeIntervals.anI1-1] };
      }

    }
    if (verbose) console.log(iteration, "params.tau", params.tau, previousParams.tau, params.tau - previousParams.tau)
    if (verbose) console.log("function data tau", functionalData[2].time, functionalData[2].power);


    const min_paadec = -3;
    const max_paadec = -0.25;
    // SOLVE FOR PAA_DEC [decay rate for ATP-PCr energy system]
    let avg_paadec = 0;
    let count_paadec = 1;
    params.paadec = min_paadec; //drop value for iteration to min

    for (let i: number = timeIntervals.sanI1; i <= timeIntervals.sanI2; i++) {

      const i_paadec = solve_paadec(i, powerArray[i-1], { ...params }, modelVersion);
      avg_paadec = ((count_paadec - 1) * avg_paadec + i_paadec) / count_paadec;
      //console.log("i_paadec", i_paadec);
      //console.log("avg_paadec", avg_paadec);

      if (params.paadec < i_paadec && i_paadec < max_paadec) {
        //console.log("update paadec")
        params.paadec = i_paadec;
        functionalData[1] = {time: i, power: powerArray[i-1]};
      }

      count_paadec++;
    }

    if (verbose)console.log(iteration, "params.paadec", params.paadec, previousParams.paadec, params.paadec - previousParams.paadec);

    // SOLVE FOR PAA [max power]
    let avg_paa = 0;
    let count_paa = 1;
    for (let i: number = timeIntervals.maxI1; i <= timeIntervals.maxI2; i++) {

      const i_paa = solve_paa(i, powerArray[i-1], { ...params }, modelVersion);
      avg_paa = ((count_paa - 1) * avg_paa + i_paa) / count_paa;
      //console.log("i_paa", i_paa, "avg_paa", avg_paa);

      if (params.paa < i_paa) {
        //console.log("update paa")
        params.paa = i_paa;
        functionalData[0] = {time: i, power: powerArray[i-1]};
      }

      count_paa++;
    }

    if (verbose)console.log(iteration, "params.paa", params.paa,  "avg_paa", avg_paa);
    if (avg_paa < 0.99 * params.paa) {
      params.paa = avg_paa;
    }
    //params.paa = avg_paa;
    // params.paa = (params.paa + avg_paa)/2;

    if (verbose)console.log(iteration, "params.paa", params.paa, previousParams.paa, params.paa - previousParams.paa);


    // SOLVE FOR cpdec [decline in cp over time]
    let avg_cpdec = 0;
    let count_cpdec = 1;
    params.cpdec = -5;

    for (let i: number = timeIntervals.laeI1; i <= timeIntervals.laeI2; i = i + 120) {

      if (powerArray[i-1]){
        let i_cpdec = solve_cpdec(i, powerArray[i-1], { ...params }, modelVersion);
        avg_cpdec = ((count_cpdec - 1) * avg_cpdec + i_cpdec) / count_cpdec;
        //console.log("i", i, "i_cpdec", i_cpdec, "avg_cpdec", avg_cpdec);

        if (i_cpdec > 0) {
          i_cpdec = 0;
        }

        if (params.cpdec < i_cpdec) {
          params.cpdec = i_cpdec;
          //console.log("i", i, "i_cpdec", i_cpdec, "avg_cpdec", avg_cpdec);
          functionalData[4] = {time: i, power: powerArray[i-1]};
        }
        count_cpdec++;
      }

    }

    if (verbose) console.log(iteration, "params.cpdec", params.cpdec, previousParams.cpdec, params.cpdec - previousParams.cpdec);

    let breakForDeltaMax = false

    if (iteration > 1) {

      if (
        Math.abs(params.tau - previousParams.tau) < deltaMax_tau
      ) {
        console.log("Breaking loop for minimum change tau.", params.tau);
        breakForDeltaMax = true;
      }

      if (
        Math.abs(params.paadec - previousParams.paadec) < deltaMax_paadec
      ) {
        console.log("Breaking loop for minimum change paadec.", params.paadec);
        //breakForDeltaMax = true;
      }

      if (
        Math.abs(params.paa - previousParams.paa) < deltaMax_paa
      ) {
        console.log("Breaking loop for minimum change paa.", params.paa);
        breakForDeltaMax = true;
      }



    }

    if (breakForDeltaMax) {
      break;
    }

  }

  return {...params, iterations: iteration}
}