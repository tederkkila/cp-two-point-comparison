import { AutoCPProps, StrydPDC, ExtendedSolution, MMPDataPoint, DataPoint } from "../types/interfaces.ts";
import { Group } from "@visx/group";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { coerceNumber, scaleLinear, scaleLog } from "@visx/scale";
import { AreaClosed, Circle, LinePath } from "@visx/shape";
import { curveBasis } from "@visx/curve";
import { useMemo } from "react";
import {
  createPointData,
  generateCPCurveData,
  generateExtendedCurveDataFromOne
} from "../libs/curveGeneration.ts";
import { calculateLineOfBestFit } from "../libs/lineOfBestFit.ts";
import { gradientDescentExtended, lossExtended } from "../libs/optimization.ts";

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
  if (cpSolution.W && cpSolution.CP) {
    //currentParams.tau = cpSolution.W / cpSolution.CP / 60 ;
    //currentParams.paa = cpSolution.CP * 3;
  }

  /*** Estimate Params from data ***/
  const calculatedParams = useMemo(() => {

    const params: ExtendedSolution = {...currentParams}

    const best5s = pdc.breakdown.total[5-1];
    console.log("best5s", best5s);
    params.paa = best5s;
    console.log("paa", params.paa);

    const best1hour = pdc.breakdown.total[60*60-1];
    console.log("best1hour", best1hour);
    // console.log(params.paa * (1.20-0.20*Math.exp(-1*(3600/60.0))));
    // console.log(Math.exp(params.paadec*(3600/60.0)))
    // console.log((1-Math.exp(params.taudel*(3600/60.0))))
    // console.log((1-Math.exp(params.cpdel*(3600/60.0))))
    // console.log((1+params.cpdec*Math.exp(params.cpdecdel/(3600/60.0))))
    // console.log(params.tau, ( 1 + params.tau/(3600/60.0)))
    params.cp = (best1hour - params.paa * (1.20-0.20*Math.exp(-1*(3600/60.0))) * Math.exp(params.paadec*(3600/60.0))) / (1-Math.exp(params.taudel*(3600/60.0))) / (1-Math.exp(params.cpdel*(3600/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(3600/60.0))) / ( 1 + params.tau/(3600/60.0));
    console.log("cp from GC", params.cp)
    // if (params.cp < cpSolution.CP) {
    //   console.log(`using CP 2 point estimate of ${cpSolution.CP} instead of ${params.cp}`)
    //   params.cp = cpSolution.CP;
    // }

    const best20min = pdc.breakdown.total[60*20-1];
    console.log("best20min", best20min);
    params.cp = (best20min - params.paa * (1.20-0.20*Math.exp(-1*(1200/60.0))) * Math.exp(params.paadec*(1200/60.0))) / (1-Math.exp(params.taudel*(1200/60.0))) / (1-Math.exp(params.cpdel*(1200/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(1200/60.0))) / ( 1 + params.tau/(1200/60.0));
    console.log("test20minCP", params.cp);
    params.tau = ((best20min - params.paa * (1.20-0.20*Math.exp(-1*(1200/60.0))) * Math.exp(params.paadec*(1200/60.0))) /params.cp / (1-Math.exp(params.taudel*(1200/60.0))) / (1-Math.exp(params.cpdel*(1200/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(1200/60.0))) - 1) * (1200/60.0);
    console.log("tau from 20min GC", params.tau);

    const best10min = pdc.breakdown.total[60*10-1];
    console.log("best10min", best10min);
    params.tau = ((best10min - params.paa * (1.20-0.20*Math.exp(-1*(600/60.0))) * Math.exp(params.paadec*(600/60.0))) /params.cp / (1-Math.exp(params.taudel*(600/60.0))) / (1-Math.exp(params.cpdel*(600/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(600/60.0))) - 1) * (600/60.0);
    console.log("tau from 10min GC", params.tau);

    const best3min = pdc.breakdown.total[60*3-1];
    console.log("best3min", best3min);
    params.tau = ((best3min - params.paa * (1.20-0.20*Math.exp(-1*(180/60.0))) * Math.exp(params.paadec*(180/60.0))) /params.cp / (1-Math.exp(params.taudel*(180/60.0))) / (1-Math.exp(params.cpdel*(180/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(180/60.0))) - 1) * (180/60.0);
    console.log("tau from 3min GC", params.tau);

    const best5min = pdc.breakdown.total[60*5-1];
    console.log("best5min", best5min);
    params.tau = ((best5min - params.paa * (1.20-0.20*Math.exp(-1*(300/60.0))) * Math.exp(params.paadec*(300/60.0))) /params.cp / (1-Math.exp(params.taudel*(300/60.0))) / (1-Math.exp(params.cpdel*(300/60.0))) / (1+params.cpdec*Math.exp(params.cpdecdel/(300/60.0))) - 1) * (300/60.0);
    console.log("tau from 5min GC", params.tau);

    const best1min = pdc.breakdown.total[60-1];
    console.log("best1min", best1min);
    params.paadec = Math.log((best1min - params.cp * (1-Math.exp(params.taudel*(60/60.0))) * (1-Math.exp(params.cpdel*(60/60.0))) * (1+params.cpdec * Math.exp(params.cpdecdel/(60/60.0))) * ( 1 + params.tau/(60/60.0)) ) / params.paa / (1.20-0.20 * Math.exp(-1*(60/60.0))) ) / (60/60.0);
    console.log("paadec from GC", params.paadec);


    params.paa = (best5s - params.cp * (1-Math.exp(params.taudel*(5/60.0))) * (1-Math.exp(params.cpdel*(5/60.0))) * (1+params.cpdec*Math.exp(params.cpdecdel/(5/60.0))) * ( 1 + params.tau/(5/60.0))) / Math.exp(params.paadec*(5/60.0)) / (1.20-0.20*Math.exp(-1*(5/60.0)));
    console.log("paa from GC", params.paa);


    return params
  }, [cpSolution, pdc])

  currentParams = {
    ...calculatedParams,
  }

  /*** CALCULATE EXTENDED SOLUTION ***/
  const optimizationSolution = useMemo(() => {

    //console.log("Running optimizationSolution", mmpData)
    const iterations: number = 50000;
    const learningDecay: number = 0.99995;
    const minMSEDelta: number = 0.00001;
    const parameterBounds = {
      cp : [100, 700],
      cpdec : [-5, 0],
      cpdecdel : [-360, -1],
      cpdel : [-5, -0.1],
      paa : [100, 2000],
      paadec : [-10, -1],
      tau : [0.4, 2.5],
      taudel: [-10, -0.5],
    };
    const learningRate: ExtendedSolution = {
      cp      : 0.0001,
      cpdec   : 0.0001,
      cpdecdel: 0.000000000001,//2.5,
      cpdel   : 0.000000000001,
      paa     : 0.005,
      paadec  : 0.00001,
      tau     : 0.00001,
      taudel  : 0.000000000001,
    };

    console.log("currentParams", currentParams);
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

  const extendedCurveData = generateExtendedCurveDataFromOne(optimizedParams, maxT, tStep);
  const extendedPointData = createPointData(mmpData);

  // const areaKeys = ['c1', 'c2', 'c3'];
  // const areaData =  [...extendedCurveData]

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
          <text x={width - 190} y="25" style={{ fontWeight: 700 }}>Extended CP</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={19} y2={19}
                stroke={'purple'}
                strokeWidth={1.5}
          />
          <text x={width - 190} y="45">CP: {Math.round(optimizedParams.cp * 100) / 100} W</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={39} y2={39}
                stroke={'purple'}
                strokeWidth={2}
                strokeOpacity={0.8}
                strokeDasharray="2,2"
          />
          <text x={width - 190} y="60">paa: {Math.round(optimizedParams.paa)} j</text>
          <line x1={width - 190 -13} x2={width - 190 - 2} y1={54} y2={54}
                stroke="#164e63" //cyan-900
                strokeWidth={1.5}
                strokeOpacity={3.0}
                strokeDasharray="2,2"
          />
          <text x={width - 190} y="75">tau: {Math.round(optimizedParams.tau * 1000) / 1000} j</text>

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
          {(Math.round(optimizedParams.paadec*100)/100 <= -3) ? (
            <AreaClosed
              data={extendedCurveData}
              x={(d) => logScale(d.x) ?? 0}
              y={(d) => yScale(d.c1) ?? 0}
              yScale={yScale}
              //strokeWidth={1}
              //stroke="black"
              fill="red"
              opacity={0.1}
            />
          ) : (<div></div>)}

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
          {(Math.round(optimizedParams.tau*100)/100 <= 0.51) ? (
            <AreaClosed
              data={extendedCurveData}
              x={(d) => logScale(d.x) ?? 0}
              y={(d) => yScale(d.c2) ?? 0}
              yScale={yScale}
              //strokeWidth={1}
              //stroke="black"
              fill="red"
              opacity={0.1}
            />
          ) : (<div></div>)}

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

        </Group>
      </svg>
    </div>
  )
}