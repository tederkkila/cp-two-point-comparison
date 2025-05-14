import {useMemo} from "react";
import {
  CPLinePoint, CPSolution,
  DataPoint,
  MMPDataPoint,
  PTEstimationProps,
  PTLinePoint,
  PTSolution
} from "../types/interfaces.ts"
import { plotFRC, plotFTP, plotTTE, plotCP } from "../libs/geometry.ts";
import { calculateLineOfBestFit } from "../libs/lineOfBestFit.ts";
import { loss, gradientDescent } from "../libs/optimization.ts";
import { Group } from '@visx/group';
import { curveBasis } from "@visx/curve";
import { Circle, LinePath, AreaStack } from "@visx/shape";
import { coerceNumber, scaleLinear, scaleLog } from "@visx/scale";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { SeriesPoint } from '@visx/shape/lib/types';
import { LinearGradient } from '@visx/gradient';
import { PatternLines } from "@visx/pattern";

export const background = '#f3f3f3';

const minT: number = 5;
const maxT: number = 4 * 60*60;
const tStep = 5;
const logValues = [minT, 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 60 * 60, maxT];

const cpValidTimeMin = 2*60; //2min
const cpValidTimeMax = 22*60; //

//Curve generation

const generateCPCurveData = (
  cpSolution: CPSolution
):CPLinePoint[] => {
  //keep CP line above 30s
  const arrayCount = maxT / tStep - 30 / tStep + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generateCPCurveRow(i, cpSolution)
  );
}

const generateCPCurveRow = (
  x: number,
  cpSolution: CPSolution
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

const generatePTCurveData =(
  ptSolution: PTSolution,
):PTLinePoint[] => {

  const lowCount = (minT === tStep) ? 0 : minT / tStep;
  const arrayCount = maxT / tStep - lowCount + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generatePTCurveRow(i, ptSolution)
  );
}

const generatePTCurveRow = (
  x: number,
  ptSolution: PTSolution,
): PTLinePoint => {

  const t:number = minT + x * tStep;
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

//Point Generation
const createPTPointData = (
  mmpData: MMPDataPoint[],
): DataPoint[] => {
  const dataPoints: DataPoint[] = [];
  for (const row in mmpData) {
    dataPoints.push(generatePointRow(mmpData[row].time, mmpData[row].power, 'black'));
  }
  return dataPoints
};

const generatePointRow = (
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

const getX = (d: PTLinePoint) => d.x;
const getFRC = (d: PTLinePoint) => d.frc;
const getFTP = (d: PTLinePoint) => d.ftp;
const getTTE = (d: PTLinePoint) => d.tte;
const getTotal = (d: PTLinePoint) => d.total;

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;
const pointC = (d: DataPoint) => d.color;
//const pointText1 = (d: DataPoint) => d.text1;
//const pointText2 = (d: DataPoint) => d.text2;

const getCPX = (d: CPLinePoint) => d.x;
const getCPY = (d: CPLinePoint) => d.y;

const getAreaX =(d: PTLinePoint) => d.x;
const getAreaY0 =(d: SeriesPoint<PTLinePoint>) => d[0];
const getAreaY1 =(d: SeriesPoint<PTLinePoint>) => d[1];

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };
let currentParams: PTSolution = {
  FRC : 0,
  Pmax : 0,
  FTP : 0,
  tau2 : 0,
  TTE: 0,
  a : 0,
};

export default function PTEstimation({ width, height, mmpData, initialParams, margin = defaultMargin }: PTEstimationProps) {

  //console.log("PTEstimation|mmpData",mmpData);
  //console.log("PTEstimation|initialParams",initialParams);
  width = Math.floor(width);

  if (currentParams.FRC === 0) {
    currentParams = initialParams;
  }
  //console.log(currentParams)

  // graph bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

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


  const cpCurveData = generateCPCurveData(cpSolution)
  const cpPointData = createPTPointData(mmpDataCPSubset);

  /*** IF CP and W then use them in current params ***/
  //console.log("cpSolution.W", cpSolution.W, typeof cpSolution.W)
  currentParams.FRC = cpSolution.W;
  currentParams.Pmax = 2.5 * cpSolution.CP;
  currentParams.FTP = cpSolution.CP;



  /*** CALCULATE PT SOLUTION ***/
  const optimizationSolution = useMemo(() => {

    //console.log("Running optimizationSolution", mmpData)
    const iterations: number = 30000;
    const learningDecay: number = 0.9998;
    const minMSEDelta: number = 0.000001;
    const parameterBounds = {
      FRC : [5000, 35000],
      Pmax : [300, 1500],
      FTP : [100, 700],
      tau2 : [12, 13],
      TTE: [180, 1200],
      a : [5, 20],
    };
    const learningRate: PTSolution = {
      FRC : 500,
      Pmax : 1,
      FTP : 1,
      tau2 : 0.001,
      TTE: 1,
      a : 0.001,
    };

    const optimizationGD = gradientDescent(
      loss,
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

    return optimizationGD
  } , [mmpData]);

  // console.log("Optimization.js parameters:\n", optimizationSolution);
  const finalIterations = optimizationSolution.iterations;
  const optimizedParams = optimizationSolution.params

  const ptCurveData = generatePTCurveData(optimizedParams);
  const ptCurveDataCleanTTE: PTLinePoint[] = ptCurveData.filter((d) => d.tte !== 0 );
  console.log(ptCurveDataCleanTTE)
  const ptPointData = createPTPointData(mmpData);

  const areaKeys = ['frc', 'ftpX', 'tte'];
  //const areaColors: Record<string, string> = {frc:'teal', tte:'red', ftpX:'purple'};
  //console.log("areaKeys: " + JSON.stringify(areaKeys));
  const areaData =  [...ptCurveData]




  // scales
  const yScale = scaleLinear<number>({
    domain: [
      0, // Math.min(...graphData.map((d) => Math.min(t1(d), t2(d)))),
      Math.max(...ptCurveData.map((d) => getTotal(d))),
    ],
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

  yScale.range([yMax, 0]);


  return width < 10 ? null : (
    <div>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={background} rx={14}/>
        <Group left={margin.left} top={margin.top}>
          <PatternLines
            id = "diagonal-frc"
            height={5}
            width={5}
            stroke="blue"
            strokeWidth={1}
            orientation={['diagonal']} />

          <GridColumns scale={logScale} width={xMax} height={yMax} stroke="#e0e0e0"/>
          <GridRows scale={yScale} width={xMax} height={yMax} stroke={'#222'} strokeOpacity={0.5}/>
          <AxisBottom top={yMax} scale={logScale} numTicks={width > 520 ? 10 : 5}/>
          <AxisLeft scale={yScale} />

{/*axis and title*/}
          <text x={20} y={-10} fontSize={16} fillOpacity={0.4}>[ Peronnet & Tibault (modified) / 2-point CP | iterations: {finalIterations} ] </text>
          <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>Power (Watts)</text>
          <text x={width - 200} y={height - 100} fontSize={10}>Time (seconds)</text>
          <text x={logScale(cpValidTimeMin) + 10} y={18} fontSize={10}>
            2-point CP valid region ({cpValidTimeMin/60}-{cpValidTimeMax/60}min)
          </text>

  {/*key*/}

    {/*pt results*/}
          <text x={width - 270} y="40" style={{ fontWeight: 700 }}>Peronnet & Tibault (mod.)</text>
          <line x1={width - 270 -13} x2={width - 270 - 2} y1={34} y2={34}
                stroke={'purple'}
                strokeWidth={1.5}
          />
          <text x={width - 270} y="60">MAP: {Math.round(optimizedParams.FTP * 10) / 10} W</text>
          <line x1={width - 270 -13} x2={width - 270 - 2} y1={54} y2={54}
                stroke={'purple'}
                strokeWidth={2}
                strokeOpacity={0.8}
                strokeDasharray="2,2"
          />
          <text x={width - 270} y="75">AWC': {Math.round(optimizedParams.FRC)} j</text>
          <line x1={width - 270 -13} x2={width - 270 - 2} y1={69} y2={69}
                stroke="#164e63" //cyan-900
                strokeWidth={1.5}
                strokeOpacity={3.0}
                strokeDasharray="2,2"
          />
          <text x={width - 270} y="90">TTE: {Math.round(optimizedParams.TTE)} s</text>
          <text x={width - 270} y="105">tau2: {Math.round(optimizedParams.tau2*10)/10} </text>
          <text x={width - 270} y="120">a: {Math.round(optimizedParams.a*10)/10} </text>

  {/*cp results*/}
          <text x={width - 270} y="140" style={{ fontWeight: 700 }}>2-point CP</text>
          <line x1={width - 270 -13} x2={width - 270 - 2} y1={134} y2={134}
                stroke="#222"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                strokeDasharray="1,2"
          />
          <text x={width - 270} y="160">CP: {Math.round(cpSolution.CP * 10) / 10} W</text>
          <text x={width - 270} y="175">W': {Math.round(cpSolution.W)} j</text>

          {/*CP valid area*/}
          <rect x={logScale(cpValidTimeMin)} y={0} width={logScale(cpValidTimeMax)-logScale(cpValidTimeMin)} height={yMax} fill={'yellow'} fillOpacity={0.05}/>
          <rect x={logScale(cpValidTimeMin)} y={0} width={1} height={yMax} fill={'#854d0e'} fillOpacity={0.3}/>
          <rect x={logScale(cpValidTimeMax)-1} y={0} width={1} height={yMax} fill={'#854d0e'} fillOpacity={0.3}/>

          <LinearGradient id={"gradient-frc"}
                          from="#164e63" fromOpacity={1.0}
                          to="cyan" toOpacity={0.5}
                          toOffset={"90%"}
                          rotate="0" vertical={true}/>
          <LinearGradient id={"gradient-ftpX"}
                          from="purple" fromOpacity={1.0}
                          to="violet" toOpacity={0.5}
                          rotate="0" vertical={true}  />
          <LinearGradient id={"gradient-tte"}
                          from="red" fromOpacity={1.0}
                          to="red" toOpacity={1.0}
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

{/*total line*/}
          <LinePath
            data={ptCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getTotal(d)) ?? 0}
            stroke="purple"
            strokeWidth={3.0}
            strokeOpacity={0.5}

          />
          <LinePath
            data={ptCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getTotal(d)) ?? 0}
            stroke="purple"
            strokeWidth={1.0}
            strokeOpacity={1}
            strokeDasharray="1,2"
          />
{/*frc line*/}
          <LinePath
            data={ptCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getFRC(d)) ?? 0}
            stroke="cyan"
            strokeWidth={7.0}
            strokeOpacity={0.2}
          />
          <LinePath
            data={ptCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getFRC(d)) ?? 0}
            stroke="turquoise"
            strokeWidth={1.5}
            strokeOpacity={3.0}
            strokeDasharray="1,5"
          />

{/*ftp line*/}
          <LinePath
            data={ptCurveData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getFTP(d)) ?? 0}
            stroke={"purple"}
            strokeWidth={2}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
          />

{/*tte line*/}
          <LinePath
            data={ptCurveDataCleanTTE}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(getTTE(d)) ?? 0}
            stroke="red"
            strokeWidth={3}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
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
          {ptPointData.map((point, i) => (
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