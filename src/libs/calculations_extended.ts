import { ExtendedSolution } from "../types/interfaces.ts";

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
  return (paa * (1.2 - 0.2 * Math.exp(-1 * t /60)) * Math.exp(paadec * (t/60)))
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

  return (cp * (1-Math.exp(taudel*t/60)) *(1-Math.exp(cpdel*t/60)) * (1+cpdec*Math.exp(cpdecdel/(t/60))) * (tau/(t/60)))
}

export const plotC3 = (
  t: number,
  cp : number,
  taudel : number,
  cpdel : number,
  cpdec : number,
  cpdecdel : number,
) => {

  return (cp*(1-Math.exp(taudel*(t/60)))*(1-Math.exp(cpdel*(t/60)))*(1+cpdec*Math.exp(cpdecdel/(t/60)))*(1))
}