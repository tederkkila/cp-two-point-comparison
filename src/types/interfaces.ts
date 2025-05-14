
export interface MMPDataPoint extends Record<string, number> {
  time: number;
  power: number;
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
}

export type PTEstimationProps = {
  width: number;
  height: number;
  mmpData: MMPDataPoint[];
  initialParams: PTSolution;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export type DistanceScenariosProps = {
  width: number;
  height: number;
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