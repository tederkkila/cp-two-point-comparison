export const plotXY = (
  x: number,
  slope: number,
  intercept: number
) => {
  return slope * x + intercept
}

export const plotCP = (
  x: number,
  cp: number,
  w: number
) => {
  return w / x + cp
}

export const calculateSlope = (
  x0: number, x1: number, y0: number, y1: number
): number => {
  return (y1 - y0) / (x1 - x0);
}

export const calculateIntercept = (
  slope: number, x0: number, y0: number,
): number => {
  return y0 - (slope * x0);
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

