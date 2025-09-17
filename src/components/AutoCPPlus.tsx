import { AutoCPProps, StrydPDC, ExtendedSolution, MMPDataPoint, DataPoint } from "../types/interfaces.ts";
import { Group } from "@visx/group";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { coerceNumber, scaleLinear, scaleLog } from "@visx/scale";
import { Circle, LinePath } from "@visx/shape";
import { curveBasis } from "@visx/curve";
import { useMemo } from "react";
import {
  createPointData,
  generateExtendedCurveDataFromOne
} from "../libs/curveGeneration.ts";
import { gradientDescentExtended, lossExtended } from "../libs/optimization.ts";
import { findBest } from "../libs/calculations_extended.ts";

const background = '#f3f3f3';
const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

const minT: number = 1;
const maxT: number = 4 * 60*60;
const tStep = 5;
const logValues = [minT, 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 60 * 60, maxT];

const cpValidTimeMin = 2*60; //2min
const cpValidTimeMax = 22*60; //

let currentParams: ExtendedSolution = {
  paa     : 0,
  paadec  : 0,
  cp      : 0,
  tau     : 0,
  taudel  : 0,
  cpdel   : 0,
  cpdec   : 0,
  cpdecdel: 0,
};

const targetTimePoints = [10, 20, 30, 60, 90, 180, 300, 60*10, 60*12, 60*20, 60*30, 60*60, 60*90, 60*120, 60*180]
// const userTimePoints = [10, 60, 180, 300, 60*10, 60*12, 60*20, 60*30, 60*60, 60*90, 60*120, 60*180]
// const userTimePoints = [5, 120, 60*7, 60*60]


const timeIntervals : Record <string, number> = {
  sanI1: 5,
  sanI2: 60,
  anI1 : 90,
  anI2 : 60*3,
  aeI1 : 60*7,
  aeI2 : 60*60,
  laeI1: 60*60,
  laeI2: 60*500,
}

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;
const pointC = (d: DataPoint) => d.color;

export default function AutoCP({ width, height, jsonData, initialParams, setExtendedSolution, margin = defaultMargin }: AutoCPProps) {

  width = Math.floor(width);
  // graph bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  if (currentParams.cp === 0) {
    currentParams = initialParams;
  }

  let optimizedParams = initialParams;
  //console.log(optimizedParams)

  const pdc: StrydPDC = jsonData;

  //get sample points for optimization
  const mmpData: MMPDataPoint[] = [];
  targetTimePoints.map((point, i) => {
    //console.log(point, pdc.breakdown.total[point-1])
    if (pdc.breakdown.total[point-1] != undefined) {
      mmpData[i] = {time:point, power: pdc.breakdown.total[point-1]}
    }
  })

  const bestIntervals : Record <string, Record <string, number>> = useMemo(() => {
    //find the highest power output in specific intervals

    const bestSAN = findBest(
      timeIntervals.sanI1,
      timeIntervals.sanI2,
      pdc.curve.power_list)
    console.log("bestSAN", bestSAN);

    const bestAN = findBest(
      timeIntervals.anI1,
      timeIntervals.anI2,
      pdc.curve.power_list)
    console.log("bestAN", bestAN);

    const bestAE = findBest(
      timeIntervals.aeI1,
      timeIntervals.aeI2,
      pdc.curve.power_list)
    console.log("bestAE", bestAE);

    const bestLAE = findBest(
      timeIntervals.laeI1,
      timeIntervals.laeI2,
      pdc.curve.power_list)
    console.log("bestLAE", bestLAE);

    return {
      bestSAN: bestSAN,
      bestAN: bestAN,
      bestAE: bestAE,
      bestLAE: bestLAE,
    }
  }, [pdc])

  /*** Estimate Params from data ***/
  const calculatedParams = useMemo(() => {
    let i : number = 0;
    const params: ExtendedSolution = {...currentParams}

    // estimate paa
    params.paa = bestIntervals.bestSAN.power;
    console.log("params.paa", params.paa);

    //estimate cp
    i = bestIntervals.bestAE.t/60;
    params.cp = (bestIntervals.bestAE.power - params.paa * (1.20-0.20*Math.exp(-1*i)) * Math.exp(params.paadec*i)) / (1-Math.exp(params.taudel*i)) / (1-Math.exp(params.cpdel*i)) / (1+params.cpdec*Math.exp(params.cpdecdel/i)) / ( 1 + params.tau/i);
    console.log("params.cp", params.cp)

    const cp =  (bestIntervals.bestAE.power - params.paa * (1.10-(1.10-1)*Math.exp(-8*i)) * Math.exp(params.paadec*i)) / (1+params.cpdec*Math.exp(params.cpdecdel/i)) / (1-Math.exp(params.cpdel*i) + Math.pow(1-Math.exp(params.taudel*i),2) * params.tau/i);
    console.log("cp 6.3", cp)

    // const cp7 = (bestIntervals.bestAE.power - 300 * Math.exp(params.paadec*Math.pow(i, 1.05))) / (1-Math.exp(params.taudel*i/60.0)) / (1-Math.exp(params.cpdel*i/60.0)) / (1+params.cpdec*Math.exp(params.cpdecdel/(i/60.0))) / ( 1 + params.tau/(i/60.0));
    // console.log("cp 7", cp7)

    //estimate tau
    params.tau = ((bestIntervals.bestAN.power - params.paa * (1.20-0.20*Math.exp(-1*(bestIntervals.bestAN.t/60.0))) * Math.exp(params.paadec*(bestIntervals.bestAN.t/60.0))) /params.cp / (1-Math.exp(params.taudel*(bestIntervals.bestAN.t/60.0))) / (1-Math.exp(params.cpdel*(bestIntervals.bestAN.t/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(bestIntervals.bestAN.t/60.0))) - 1) * (bestIntervals.bestAN.t/60.0);
    console.log("params.tau", params.tau);

    params.paadec = Math.log((bestIntervals.bestSAN.power - params.cp * (1-Math.exp(params.taudel*(bestIntervals.bestSAN.t/60.0))) * (1-Math.exp(params.cpdel*(bestIntervals.bestSAN.t/60.0))) * (1+params.cpdec * Math.exp(params.cpdecdel/(bestIntervals.bestSAN.t/60.0))) * ( 1 + params.tau/(bestIntervals.bestSAN.t/60.0)) ) / params.paa / (1.20-0.20 * Math.exp(-1*(bestIntervals.bestSAN.t/60.0))) ) / (bestIntervals.bestSAN.t/60.0);
    console.log("params.paadec", params.paadec);

    params.paa = (bestIntervals.bestSAN.power - params.cp * (1-Math.exp(params.taudel*(bestIntervals.bestSAN.t/60.0))) * (1-Math.exp(params.cpdel*(bestIntervals.bestSAN.t/60.0))) * (1+params.cpdec*Math.exp(params.cpdecdel/(bestIntervals.bestSAN.t/60.0))) * ( 1 + params.tau/(bestIntervals.bestSAN.t/60.0))) / Math.exp(params.paadec*(bestIntervals.bestSAN.t/60.0)) / (1.20-0.20*Math.exp(-1*(bestIntervals.bestSAN.t/60.0)));
    console.log("params.paa", params.paa);

    return params
  }, [bestIntervals])


  const userData: MMPDataPoint[] = useMemo(() => {
    return []
  }, []);

  Object.entries(bestIntervals).forEach(([key, value], index) => {
    userData[index] = {time: value.t, power: value.power}
  })

  //remove the first value in the userData as we don't want to use it to fit
  //const userDataForFit = userData.slice(1);

  currentParams = {
    ...calculatedParams,
  }

  /*** CALCULATE EXTENDED SOLUTION ***/
  const optimizationSolution = useMemo(() => {

    //console.log("Running optimizationSolution", mmpData)
    const iterations: number = 10000;
    const learningDecay: number = 0.99995;
    const minMSEDelta: number = 0.00001;
    const parameterBounds = {
      cp : [100, 700],
      cpdec : [-5, 0],
      cpdecdel : [-360, -1],
      cpdel : [-5, -0.1],
      paa : [100, 2000],
      paadec : [-10, -0.9],
      tau : [0.4, 2.5],
      taudel: [-10, -0.5],
    };
    const learningRate: ExtendedSolution = {
      cp      : 0.1,
      cpdec   : 0.001,
      cpdecdel: 0.00000000001,//2.5,
      cpdel   : 0.00000000001,
      paa     : 0.05,
      paadec  : 0.0001,
      tau     : 0.00001,
      taudel  : 0.00000000001,
    };

    console.log("currentParams", currentParams);
    const optimizationGD = gradientDescentExtended(
      lossExtended,
      currentParams,
      userData,
      learningRate,
      learningDecay,
      iterations,
      parameterBounds,
      minMSEDelta
    )

    //currentParams = {...optimizationGD.params};
    console.log(optimizationGD)
    console.log(
      optimizationGD.params.paa + '\n' +
      optimizationGD.params.paadec + '\n' +
      optimizationGD.params.cp + '\n' +
      optimizationGD.params.tau + '\n' +
      optimizationGD.params.taudel + '\n' +
      optimizationGD.params.cpdel + '\n' +
      optimizationGD.params.cpdec + '\n' +
      optimizationGD.params.cpdecdel
    )

    return optimizationGD
  } , [userData]);

  const finalIterations = optimizationSolution.iterations;
  optimizedParams = optimizationSolution.params

  const extendedCurveData = generateExtendedCurveDataFromOne(optimizedParams, maxT, tStep);
  const extendedPointData = createPointData(userData);

  //const areaKeys = ['c1', 'c2', 'c3'];
  //const areaData =  [...extendedCurveData]

  // scales
  const maxPoint = Math.max(...pdc.breakdown.total);
  const maxCurve = Math.max(...pdc.curve.power_list) ;

  const yScale = scaleLinear<number>({
    domain: [
      0, // Math.min(...graphData.map((d) => Math.min(t1(d), t2(d)))),
      Math.max(maxPoint, maxCurve),
    ],
    range: [yMax, 0],
    nice  : false,
  });

  const getMinMax = (vals: (number | { valueOf(): number })[]) => {
    const numericVals = vals.map(coerceNumber);
    return [Math.min(...numericVals), Math.max(...numericVals)];
  };

  const logScale = scaleLog<number>({
    domain: getMinMax(logValues),
    range : [0, width - 75],
    nice  : false,
  });

// for finding unused memo
// console.log("rendering return output AutoCPPlus", width)

  return width < 10 ? null : (
    <div>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={background} rx={14}/>
        <Group left={margin.left} top={margin.top}>
          <GridColumns scale={logScale} width={xMax} height={yMax} stroke="#e0e0e0"/>
          <GridRows scale={yScale} width={xMax} height={yMax} stroke={'#222'} strokeOpacity={0.5}/>
          <AxisBottom top={yMax} scale={logScale} numTicks={width > 520 ? 10 : 5}/>
          <AxisLeft scale={yScale} />

          {/*axis and title*/}
          <text x={20} y={-10} fontSize={16} fillOpacity={0.4}>[ GC Extened CP | iterations: {finalIterations} ] </text>
          <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>Power (Watts)</text>
          <text x={width - 200} y={height - 100} fontSize={10}>Time (seconds)</text>
          <text x={logScale(cpValidTimeMin) + 10} y={18} fontSize={10}>
            2-point CP valid region ({cpValidTimeMin/60}-{cpValidTimeMax/60}min)
          </text>

          {/*key*/}

          {/*model results*/}
          <text x={width - 190} y="40" style={{ fontWeight: 700 }}>Extended CP</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={34} y2={34}
                stroke={'purple'}
                strokeWidth={1.5}
          />
          <text x={width - 190} y="60">CP: {Math.round(optimizedParams.cp * 10) / 10} W</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={54} y2={54}
                stroke={'purple'}
                strokeWidth={2}
                strokeOpacity={0.8}
                strokeDasharray="2,2"
          />
          <text x={width - 190} y="75">paa: {Math.round(optimizedParams.paa)} j</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={69} y2={69}
                stroke="#164e63" //cyan-900
                strokeWidth={1.5}
                strokeOpacity={3.0}
                strokeDasharray="2,2"
          />
          <text x={width - 190} y="90">W': {Math.round(optimizedParams.cp * optimizedParams.tau * 60)} j</text>
          <text x={width - 190} y="105">CPdecdel: {Math.round(-optimizedParams.cpdecdel)}</text>
          <text x={width - 190} y="120">CPdec: {Math.round(optimizedParams.cpdec*100)/100} </text>




          {/*c1 line*/}
          <LinePath
            data={pdc.breakdown.alactic}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke="teal"
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,8"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c1) ?? 0}
            stroke="black"
            strokeWidth={1}
            strokeOpacity={0.8}
            //strokeDasharray="1,8"
          />

          {/*c2 line*/}
          <LinePath
            data={pdc.breakdown.anaerobic}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke="#10b981"
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,8"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c2) ?? 0}
            stroke="black"
            strokeWidth={1}
            strokeOpacity={0.8}
            //strokeDasharray="1,8"
          />

          {/*c3 line*/}
          <LinePath
            data={pdc.breakdown.aerobic}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke={"purple"}
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c3) ?? 0}
            stroke="black"
            strokeWidth={1}
            strokeOpacity={0.8}
            //strokeDasharray="1,8"
          />


          {/*total line*/}
          <LinePath
            data={pdc.breakdown.total}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke="purple"
            strokeWidth={3.0}
            strokeOpacity={0.5}
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.total) ?? 0}
            stroke="black"
            strokeWidth={1}
            strokeOpacity={0.8}
            //strokeDasharray="1,8"
          />



          {/*all dots*/}
          {extendedPointData.map((point, i) => (
            <Circle
              key={`point-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={3}
              fill={pointC(point)}
            />
          ))}

        </Group>
      </svg>
    </div>
  )
}