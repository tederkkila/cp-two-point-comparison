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



