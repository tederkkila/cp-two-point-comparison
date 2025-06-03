import { Dispatch, SetStateAction } from "react";

export interface MMPDataPoint extends Record<string, number|undefined> {
  time: number;
  power: number;
  distance?: number;
}

export interface PTLinePoint {
  x: number;
  frc: number;
  ftp: number;
  tte: number;
  total: number;
  ftpX: number;
}

export interface DataPoint {
  x: number;
  y: number;
  color: string;
  text1? : string;
  text2? : string;
}

export interface PTSolution {
  FRC : number;
  Pmax : number;
  FTP : number;
  tau2 : number;
  TTE: number;
  a : number;
  kg?: number;
}

export type PTEstimationProps = {
  width: number;
  height: number;
  mmpData: MMPDataPoint[];
  initialParams: PTSolution;
  setPTSolution: Dispatch<SetStateAction<PTSolution | null>>;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export interface ExtendedSolution extends Record<string, number> {
  cp: number;
  cpdec: number;
  cpdecdel: number;
  cpdel: number;
  paa: number;
  paadec: number;
  tau: number;
  taudel: number;
}

export interface ExtendedLinePoint {
  x: number;
  c1: number;
  c2: number;
  c3: number;
  total: number;
}

export type ExtendedEstimationProps = {
  width: number;
  height: number;
  mmpData: MMPDataPoint[];
  initialParams: ExtendedSolution;
  setExtendedSolution: Dispatch<SetStateAction<ExtendedSolution | null>>;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export type DistanceScenariosProps = {
  width: number;
  height: number;
  ptSolution: PTSolution;
  distance: number;
  kg: number;
  re: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export interface CPSolution {
  CP : number;
  W : number;
}

export interface CPLinePoint {
  x: number;
  y: number;
}

export interface Scenario {
  title: string;
  RE: number;
  a: number;
  RE0: number;
  RE1: number;
  RE2: number;
}