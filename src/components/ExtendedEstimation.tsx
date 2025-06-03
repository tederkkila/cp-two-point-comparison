import {
  CPLinePoint,
  DataPoint,
  ExtendedEstimationProps,
  ExtendedLinePoint,
  ExtendedSolution,
} from "../types/interfaces.ts";
import { Group } from "@visx/group";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { coerceNumber, scaleLinear, scaleLog } from "@visx/scale";
import { useEffect, useMemo } from "react";
import { createPointData, generateCPCurveData, generateExtendedCurveData } from "../libs/curveGeneration.ts";
import { AreaStack, Circle, LinePath } from "@visx/shape";
import { curveBasis } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { SeriesPoint } from "@visx/shape/lib/types";
import { gradientDescentExtended, lossExtended } from "../libs/optimization.ts";
import { calculateLineOfBestFit } from "../libs/lineOfBestFit.ts";
import { plotCP } from "../libs/calculations_cp.ts";


const background = '#f3f3f3';
const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

const minT: number = 5;
const maxT: number = 4 * 60*60;
const tStep = 5;
const logValues = [minT, 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 60 * 60, maxT];

const cpValidTimeMin = 2*60; //2min
const cpValidTimeMax = 22*60; //

const getX = (d: ExtendedLinePoint) => d.x;
const getC1 = (d: ExtendedLinePoint) => d.c1;
const getC2 = (d: ExtendedLinePoint) => d.c2;
const getC3 = (d: ExtendedLinePoint) => d.c3;
const getTotal = (d: ExtendedLinePoint) => d.total;

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;
const pointC = (d: DataPoint) => d.color;

const getCPX = (d: CPLinePoint) => d.x;
const getCPY = (d: CPLinePoint) => d.y;

const getAreaX =(d: ExtendedLinePoint) => d.x;
const getAreaY0 =(d: SeriesPoint<ExtendedLinePoint>) => d[0];
const getAreaY1 =(d: SeriesPoint<ExtendedLinePoint>) => d[1];

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

export default function ExtendedEstimation({ width, height, mmpData, initialParams, setExtendedSolution, margin = defaultMargin }: ExtendedEstimationProps) {

  width = Math.floor(width);

  if (currentParams.cp === 0) {
    currentParams = initialParams;
  }

  // graph bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  let optimizedParams = initialParams

  /*** CALCULATE CP FIRST TO FEED IN FTP AND FRC VALUES TO PTSOLUTION ***/

  const mmpDataCPSubset = mmpData.filter(x => x.time >= cpValidTimeMin -1 && x.time <= cpValidTimeMax + 1);
  //console.log(mmpDataCPSubset)

  //create cp dataPoints from cp valid time range
  const dataPoints: {x:number, y:number}[] = useMemo(() => {
    const dataPointsTemp: {x:number, y:number}[] = [];
    for (const d in mmpDataCPSubset) {
      dataPointsTemp.push({ x: mmpDataCPSubset[d].time, y: (mmpDataCPSubset[d].time * mmpDataCPSubset[d].power) });
    }
    return dataPointsTemp;
  }, [mmpDataCPSubset])

  //calculate slope and intercept
  const cpSolution = useMemo(() => {
    const lineOfBestFitResult = calculateLineOfBestFit(dataPoints);

    if (isNaN(lineOfBestFitResult.slope) || isNaN(lineOfBestFitResult.intercept)) {
      console.log("No line of best fit can be calculated.");
    } else {
      //console.log(`Slope: ${lineOfBestFitResult.slope} Y-intercept: ${lineOfBestFitResult.intercept}`);
    }

    return {
      CP: Math.round(lineOfBestFitResult.slope * 10) / 10,
      W: Math.round(lineOfBestFitResult.intercept),
    }
  }, [dataPoints])


  const cpCurveData = generateCPCurveData(cpSolution, maxT, tStep)
  const cpPointData = createPointData(mmpDataCPSubset);

  /*** IF CP and W then use them in current params ***/
  //console.log("cpSolution.W", cpSolution.W, typeof cpSolution.W)
  if (cpSolution.W && cpSolution.CP) {
    //currentParams.tau = cpSolution.W / cpSolution.CP / 60 ;
    // console.log("tau from CP", currentParams.tau);
    //currentParams.cp = cpSolution.CP;
    currentParams.paa = cpSolution.CP * 3;
  }

  /*** Estimate Params from data ***/
  const calculatedParams = useMemo(() => {

    const params: ExtendedSolution = {...currentParams}

    const best1hour = plotCP(60*60, cpSolution.CP, cpSolution.W);
    console.log("best1hour", best1hour);
    params.cp = (best1hour - params.paa * (1.20-0.20*Math.exp(-1*(3600/60.0))) * + Math.exp(params.paadec*(3600/60.0))) / (1-Math.exp(params.taudel*(3600/60.0))) / (1-Math.exp(params.cpdel*(3600/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(3600/60.0))) / ( 1 + params.tau/(3600/60.0));
    console.log("cp from GC", params.cp)

    const best5min = plotCP(60*5, cpSolution.CP, cpSolution.W);
    console.log("best5min", best5min);
    params.tau = ((best5min - params.paa * (1.20-0.20*Math.exp(-1*(300/60.0))) * + Math.exp(params.paadec*(300/60.0))) /params.cp / (1-Math.exp(params.taudel*(300/60.0))) / (1-Math.exp(params.cpdel*(300/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(300/60.0))) - 1) * (300/60.0);
    console.log("tau from GC", params.tau);
    //params.tau = 0.9;

    const best1min = 0.8 * plotCP(60, cpSolution.CP, cpSolution.W);
    console.log("best1min", best1min);
    params.paadec = Math.log((best1min - params.cp * (1-Math.exp(params.taudel*(60/60.0))) * (1-Math.exp(params.cpdel*(60/60.0))) * (1+params.cpdec * Math.exp(params.cpdecdel/(60/60.0))) * ( 1 + params.tau/(60/60.0)) ) / params.paa / (1.20-0.20 * Math.exp(-1*(60/60.0))) ) / (60/60.0);
    console.log("paadec from GC", params.paadec);

    const best5s = plotCP(35, cpSolution.CP, cpSolution.W);
    console.log("best5s", best5s);
    params.paa = (best5s - params.cp * (1-Math.exp(params.taudel*(5/60.0))) * (1-Math.exp(params.cpdel*(5/60.0))) * (1+params.cpdec*Math.exp(params.cpdecdel/(5/60.0))) * ( 1 + params.tau/(5/60.0))) / Math.exp(params.paadec*(5/60.0)) / (1.20-0.20*Math.exp(-1*(5/60.0)));
    console.log("paa from GC", params.paa);


    return params
  }, [cpSolution.CP, cpSolution.W])

  currentParams = {
    ...calculatedParams,
  }
  //console.log(currentParams)


  /*** CALCULATE EXTENDED SOLUTION ***/
  const optimizationSolution = useMemo(() => {

    //console.log("Running optimizationSolution", mmpData)
    const iterations: number = 50000;
    const learningDecay: number = 0.99995;
    const minMSEDelta: number = 0.00001;
    const parameterBounds = {
      cp : [100, 700],
      cpdec : [-5, 0],
      cpdecdel : [-180, -1],
      cpdel : [-5, -0.1],
      paa : [100, 2500],
      paadec : [-10, -3],
      tau : [0.5, 1.2],
      taudel: [-10, -2],
    };
    const learningRate: ExtendedSolution = {
      cp      : 0.05,
      cpdec   : 0.000001,
      cpdecdel: 0.001,
      cpdel   : 0.00001,
      paa     : 0.1,
      paadec  : 0.00001,
      tau     : 0.0000001,
      taudel  : 0.000001,
    };

    const optimizationGD = gradientDescentExtended(
      lossExtended,
      currentParams,
      mmpData,
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
  } , [mmpData]);

  const finalIterations = optimizationSolution.iterations;
  optimizedParams = optimizationSolution.params




  const extendedCurveData = generateExtendedCurveData(optimizedParams, minT, maxT, tStep);
  const extendedPointData = createPointData(mmpData);

  const areaKeys = ['c1', 'c2', 'c3'];
  const areaData =  [...extendedCurveData]

// scales
  const maxPoint = Math.max(...extendedPointData.map((d) => d.y));
  const maxCurve = Math.max(...extendedCurveData.map((d) => getTotal(d))) ;

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

  useEffect(() => {
    setExtendedSolution (optimizedParams)
  }, [setExtendedSolution, optimizedParams]);

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
          <text x={20} y={-10} fontSize={16} fillOpacity={0.4}>[ GC Extened CP / 2-point CP | iterations: {finalIterations} ] </text>
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

          {/*cp results*/}
          <text x={width - 190} y="140" style={{ fontWeight: 700 }}>2-point CP</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={134} y2={134}
                stroke="#222"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                strokeDasharray="1,2"
          />
          <text x={width - 190} y="160">CP: {Math.round(cpSolution.CP * 10) / 10} W</text>
          <text x={width - 190} y="175">W': {Math.round(cpSolution.W)} j</text>

          {/*CP valid area*/}
          <rect x={logScale(cpValidTimeMin)} y={0} width={logScale(cpValidTimeMax)-logScale(cpValidTimeMin)} height={yMax} fill={'yellow'} fillOpacity={0.05}/>
          <rect x={logScale(cpValidTimeMin)} y={0} width={1} height={yMax} fill={'#854d0e'} fillOpacity={0.3}/>
          <rect x={logScale(cpValidTimeMax)-1} y={0} width={1} height={yMax} fill={'#854d0e'} fillOpacity={0.3}/>


          <LinearGradient id={"gradient-c1"}
                          from="#164e63" fromOpacity={1.0}
                          to="cyan" toOpacity={0.5}
                          toOffset={"90%"}
                          rotate="0" vertical={true}/>
          <LinearGradient id={"gradient-c2"}
                          from="#047857" fromOpacity={1.0}
                          to="#4ade80" toOpacity={0.5}
                          rotate="0" vertical={true}  />
          <LinearGradient id={"gradient-c3"}
                          from="purple" fromOpacity={1.0}
                          to="violet" toOpacity={1.0}
                          rotate="0" vertical={true}  />

          <AreaStack
            top={margin.top}
            left={margin.left}
            keys={areaKeys}
            data={areaData}
            x={(d) => logScale(getAreaX(d.data)) ?? 0}
            y0={(d) => yScale(getAreaY0(d)) ?? 0}
            y1={(d) => yScale(getAreaY1(d)) ?? 0}
          >
            {({ stacks, path }) =>
              stacks.map((stack) => (
                <path
                  key={`stack-${stack.key}`}
                  d={path(stack) || ''}
                  stroke="transparent"
                  // fill="url(#stacked-area-orangered)"
                  //fill={areaColors[stack.key]}
                  fill={`url(#gradient-${stack.key})`}
                  opacity={0.5}
                />
              ))
            }
          </AreaStack>

          {/*c1 line*/}
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getC1(d)) ?? 0}
            stroke="teal"
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,8"
          />

          {/*c2 line*/}
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getC2(d)) ?? 0}
            stroke="#10b981"
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,8"
          />

          {/*c3 line*/}
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getC3(d)) ?? 0}
            stroke={"purple"}
            strokeWidth={2.5}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
          />


          {/*total line*/}
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getTotal(d)) ?? 0}
            stroke="purple"
            strokeWidth={3.0}
            strokeOpacity={0.5}
          />

          {/*cp dots (yellow)*/}
          {cpPointData.map((point, i) => (
            <Circle
              key={`point-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={5}
              fill={'yellow'}
            />
          ))}

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

          {/*cp solution*/}
          <LinePath
            data={cpCurveData}
            curve={curveBasis}
            x={(d) => logScale(getCPX(d)) ?? 0}
            y={(d) => yScale(getCPY(d)) ?? 0}
            stroke="black"
            strokeWidth={1.5}
            strokeOpacity={0.8}
            strokeDasharray="1,2"
          />

          {/*cp line and text*/}
          <line
            x1={logScale(minT)}
            x2={logScale(maxT)}
            y1={yScale(cpSolution.CP)}
            y2={yScale(cpSolution.CP)}
            stroke={'black'}
          />
          <text
            x={-20}
            y={yScale(cpSolution.CP) + 6}
            fontSize={12}
            fill={'black'}
            fillOpacity={0.9}
            fontWeight={600}
          >CP
          </text>

        </Group>

      </svg>
    </div>
  )

}