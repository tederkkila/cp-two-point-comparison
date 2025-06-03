import {
  MMPDataPoint,
  DataPoint,
  CPSolution,
  CPLinePoint,
  ExtendedSolution,
  ExtendedLinePoint,
  PTSolution,
  PTLinePoint,
} from "../types/interfaces.ts";
import { plotCP } from "./calculations_cp.ts";
import { plotFRC, plotFTP, plotTTE } from "./calculations_pt.ts";
import { plotC1, plotC2, plotC3 } from "./calculations_extended.ts";

export const createPointData = (
  mmpData: MMPDataPoint[],
): DataPoint[] => {
  const dataPoints: DataPoint[] = [];
  for (const row in mmpData) {
    dataPoints.push(generatePointRow(mmpData[row].time, mmpData[row].power, 'black'));
  }
  return dataPoints
};

export const generatePointRow = (
  x: number,
  y: number,
  color: string,
  text1?: string,
  text2?: string,
): DataPoint => {
  return {
    x    : x,
    y    : y,
    color: color,
    text1: text1,
    text2: text2,
  }
}

//CP
export const generateCPCurveData = (
  cpSolution: CPSolution,
  maxT: number,
  tStep: number,
):CPLinePoint[] => {
  //keep CP line above 30s
  const arrayCount = maxT / tStep - 30 / tStep + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generateCPCurveRow(i, cpSolution, tStep)
  );
}

export const generateCPCurveRow = (
  x: number,
  cpSolution: CPSolution,
  tStep: number,
): CPLinePoint => {
  //keep CP line above 30s
  const t:number = 30 + x * tStep;
  const power: number = plotCP(
    t,
    cpSolution.CP,
    cpSolution.W,
  );

  return {
    x : t,
    y : power,
  }
}

//PT modified
export const generatePTCurveData =(
  ptSolution: PTSolution,
  minT: number,
  maxT: number,
  tStep: number,
):PTLinePoint[] => {

  const lowCount = (minT === tStep) ? 0 : minT / tStep;
  const arrayCount = maxT / tStep - lowCount + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generatePTCurveRow(i, ptSolution, minT, tStep)
  );
}

export const generatePTCurveRow = (
  x: number,
  ptSolution: PTSolution,
  minT: number,
  tStep: number,
): PTLinePoint => {

  const t: number = minT + x * tStep;
  const frc: number = plotFRC(
    t,
    ptSolution.FRC,
    ptSolution.Pmax,
  );
  const ftp: number = plotFTP(
    t,
    ptSolution.FTP,
    ptSolution.tau2,
  );
  const tte: number = plotTTE(
    t,
    ptSolution.TTE,
    ptSolution.a,
  );
  const total = frc + ftp - tte;
  const ftpX = ftp - tte;

  return {
    x : t,
    frc: frc,
    ftp: ftp,
    tte: tte,
    total : total,
    ftpX : ftpX,
  }
}

//Extended
export const generateExtendedCurveData =(
  extendedSolution: ExtendedSolution,
  minT: number,
  maxT: number,
  tStep: number,
):ExtendedLinePoint[] => {

  const lowCount = (minT === tStep) ? 0 : minT / tStep;
  const arrayCount = maxT / tStep - lowCount + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generateExtendedCurveRow(i, extendedSolution, minT, tStep)
  );
}

export const generateExtendedCurveRow = (
  x: number,
  extendedSolution: ExtendedSolution,
  minT: number,
  tStep: number,
): ExtendedLinePoint => {

  const t: number = minT + x * tStep;
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
  const total = c1 + c2 + c3;

  return {
    x : t,
    c1: c1,
    c2: c2,
    c3: c3,
    total : total,
  }
}