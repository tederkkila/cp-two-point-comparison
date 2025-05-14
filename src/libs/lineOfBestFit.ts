/**
 * Calculates the slope and y-intercept of the line of best fit for a set of points
 * using the least squares method.
 *
 * @param points An array of points, where each point is an object with x and y properties.
 * The function handles the case where points is empty, or contains only one point.
 * @returns An object containing the slope and y-intercept of the line of best fit.
 * Returns an object with slope and intercept set to NaN if no line can be fitted.
 */
export function calculateLineOfBestFit(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  if (!points || points.length === 0) {
    return { slope: NaN, intercept: NaN };
  }

  if (points.length === 1) {
    return {slope: NaN, intercept: points[0].y};
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  const n = points.length;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    // The points are all on a vertical line, so the slope is undefined.
    // Return NaN for slope and a suitable intercept (x-intercept would be more appropriate, but we return NaN).
    return { slope: NaN, intercept: NaN };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY * sumX2 - sumX * sumXY) / denominator;

  return { slope, intercept };
}

// // Example usage:
// const dataPoints = [
//   { x: 1, y: 2 },
//   { x: 2, y: 3 },
//   { x: 3, y: 5 },
//   { x: 4, y: 6 },
//   { x: 5, y: 8 },
// ];
//
// const result = calculateLineOfBestFit(dataPoints);
//
// if (isNaN(result.slope) || isNaN(result.intercept)) {
//   console.log("No line of best fit can be calculated.");
// } else {
//   console.log(`Slope: ${result.slope}`);
//   console.log(`Y-intercept: ${result.intercept}`);
//
//   // Example of using the slope and intercept to predict a y-value:
//   const x = 6;
//   const predictedY = result.slope * x + result.intercept;
//   console.log(`For x = ${x}, predicted y = ${predictedY}`);
// }
//
// // Example with a single point
// const singlePoint = [{x: 1, y: 2}];
// const resultSingle = calculateLineOfBestFit(singlePoint);
// console.log(`Single point: Slope: ${resultSingle.slope}, Intercept: ${resultSingle.intercept}`);
//
// // Example with no points
// const noPoints: {x: number, y:number}[] = [];
// const resultNoPoints = calculateLineOfBestFit(noPoints);
// console.log(`No points: Slope: ${resultNoPoints.slope}, Intercept: ${resultNoPoints.intercept}`);
