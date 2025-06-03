import { PTSolution } from "../types/interfaces.ts";

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

export const plotFRC = (
  t: number,
  FRC : number,
  Pmax : number,
) => {

  return FRC/t * (1 - Math.exp(-1 * t / (FRC/Pmax)))
}

export const plotFTP = (
  t: number,
  FTP : number,
  tau2 : number,
) => {
  // console.log("FTP: " + t, FTP, tau2)
  //console.log(tau2)
  return FTP * (1-Math.exp(-1 * t / tau2))
}

export const plotTTE = (
  t: number,
  TTE:  number,
  a : number,
) => {

  let y : number;

  if (t >= TTE) {
    y = a * Math.log(t/TTE)
  } else {
    y = 0;
  }
  return y
}