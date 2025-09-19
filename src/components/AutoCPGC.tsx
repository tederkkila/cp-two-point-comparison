import { AutoCPGCProps, ExtendedSolution, MMPDataPoint, DataPoint } from "../types/interfaces.ts";
import { Group } from "@visx/group";
import { GridColumns, GridRows } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { coerceNumber, scaleLinear, scaleLog } from "@visx/scale";
import { AreaClosed, Circle, LinePath } from "@visx/shape";
import { curveBasis } from "@visx/curve";
import { useMemo } from "react";
import {
  createPointData,
  generateExtendedCurveDataFromOne
} from "../libs/curveGeneration.ts";
import { findBest, iterateExtendedParams} from "../libs/calculations_extended.ts";

const background = '#f3f3f3';
const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

const minT: number = 1;
const maxT: number = 4 * 60*60;
const tStep = 5;
const logValues = [minT, 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 60 * 60, maxT];

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
  maxI1: 2,
  maxI2: 10,
  sanI1: 20, //20
  sanI2: 90,
  anI1 : 125,//125
  anI2 : 60*5,//300
  aeI1 : 60*9,//480
  aeI2 : 60*30,//1800
  laeI1: 60*50,//3600
  laeI2: 60*180,//30000
}

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;

export default function AutoCPGC({ width, height, pdc, initialParams, forecastData, verbose, margin = defaultMargin }: AutoCPGCProps) {

  console.log("AutoCP running...")
  width = Math.floor(width);
  // graph bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  if (currentParams.cp === 0) {
    currentParams = initialParams;
  }

  let optimizedParams = initialParams;
  //console.log(optimizedParams)

  //copy of power_list for display and calculations
  const fieldPointData: DataPoint[] = useMemo(() => {
    return []
  }, [])

  const powerArray = useMemo(() => {

    const powerArray = [...pdc.curve.power_list];

    powerArray.forEach((value, index) => {
      fieldPointData[index] = {x: index+1, y: value, color: '#aaaaaa'}
    })


    if (forecastData) {
      forecastData.forEach((item: MMPDataPoint) => {

          //first find last point before time that is greater than the power
          let lastTimePoint = 0;
          for (const power of powerArray) {

            if (Math.ceil(power) < item.power && lastTimePoint <= item.time) {
              break;
            }
            lastTimePoint++
          }

          for (let j = lastTimePoint; j <= item.time; j++) {
            //console.log("pwerARRay", j, powerArray[j-1], fieldPointData[j])
            powerArray[j-1] = item.power;
            fieldPointData[j-1] = {x: j, y: item.power, color: 'red'}
          }

      })
    }

    return powerArray
  }, [forecastData, pdc, fieldPointData]);
//console.log(fieldPointData)
//console.log(powerArray);

  //get sample points for optimization
  const mmpData:MMPDataPoint[] = useMemo(() => {
    return []
  }, []);

  targetTimePoints.map((point, i) => {
    //console.log(point, pdc.breakdown.total[point-1])
    if (pdc.breakdown.total[point-1] != undefined) {
      mmpData[i] = {time:point, power: pdc.breakdown.total[point-1]}
    }
  })

  const bestIntervals : Record <string, Record <string, number>> = useMemo(() => {
    //find the highest power output in specific intervals

    const bestMAX = findBest(
      timeIntervals.maxI1,
      timeIntervals.maxI2,
      powerArray)
    if (verbose) console.log("bestMAX", bestMAX);

    const bestSAN = findBest(
      timeIntervals.sanI1,
      timeIntervals.sanI2,
      powerArray)
    if (verbose) console.log("bestSAN", bestSAN);

    const bestAN = findBest(
      timeIntervals.anI1,
      timeIntervals.anI2,
      powerArray)
    if (verbose) console.log("bestAN", bestAN);

    const bestAE = findBest(
      timeIntervals.aeI1,
      timeIntervals.aeI2,
      powerArray)
    if (verbose)  console.log("bestAE", bestAE);

    const bestLAE = findBest(
      timeIntervals.laeI1,
      timeIntervals.laeI2,
      powerArray)
    if (verbose) console.log("bestLAE", bestLAE);

    return {
      bestMAX: bestMAX,
      bestSAN: bestSAN,
      bestAN: bestAN,
      bestAE: bestAE,
      bestLAE: bestLAE,
    }
  }, [powerArray, verbose])

  const userData: MMPDataPoint[] = useMemo(() => {
    return []
  }, []);

  Object.entries(bestIntervals).forEach((x, index) => {
    userData[index] = {time: x[1].t, power: x[1].power}
  })

  const functionalData: MMPDataPoint[] = useMemo(() => {
    return []
  }, []);

  // console.log(currentParams)
 //GC eCP v5.3 ripoff code :)
  const gcSolution: ExtendedSolution = useMemo(() => {

    const params : ExtendedSolution = {...currentParams};

    //use min values from GC
    params.paa = 1000;
    //params.paa = bestIntervals.bestMAX.power;
    params.paadec = -2;
    params.tau = 1.2;
    params.cp = 300;
    params.cpdec = -0.6;

    const maxLoops = 25;
    const modelVersion = 5; //use 5!

    return iterateExtendedParams (
      maxLoops,
      powerArray,
      timeIntervals,
      functionalData,
      {...params},
      modelVersion,
      verbose,
    )

  }, [functionalData, powerArray, verbose])

  const finalIterations = gcSolution.iterations;
  console.log({...gcSolution});
  optimizedParams = gcSolution

  const extendedCurveData = generateExtendedCurveDataFromOne(optimizedParams, maxT, tStep);
  //const extendedPointData = createPointData(userData);

  //remove missing data
  const functionalDataFiltered = functionalData.filter(value => value.time !== 0)
  const functionalPointData = createPointData(functionalDataFiltered);


  //const areaKeys = ['c1', 'c2', 'c3'];
  //const areaData =  [...extendedCurveData]

  // scales
  const maxPoint = Math.max(...pdc.breakdown.total);
  const maxCurve = Math.max(...powerArray) ;

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
          <GridColumns scale={logScale} width={xMax} height={yMax} stroke={'#222'} strokeOpacity={0.05}/>
          <GridRows scale={yScale} width={xMax} height={yMax} stroke={'#222'} strokeOpacity={0.05}/>
          <AxisBottom top={yMax} scale={logScale} numTicks={width > 520 ? 10 : 5}/>
          <AxisLeft scale={yScale} />

          {/*axis and title*/}
          <text x={10} y={-15} fontSize={16} fillOpacity={0.4}>[ GC Extended CP | iterations: {finalIterations} ] </text>
          <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>Power (Watts)</text>
          <text x={width - 200} y={height - 100} fontSize={10}>Time (seconds)</text>


          {/*key*/}
          <Group left={width-190} top={margin.top -3}>
            {/*model results*/}
            <Group left={0} top={-2}>
              <text x={0} y={0} style={{ fontWeight: 700 }}>Extended CP</text>
              <line x1={-13} x2={-2} y1={-4} y2={-4}
                    stroke={'purple'}
                    strokeWidth={1.5}
              />
            </Group>
            <Group left={0} top={14}>
              <text x={0} y={0}>CP: {Math.round(optimizedParams.cp * 100) / 100} W</text>
              <line x1={-13} x2={-2} y1={-4} y2={-4}
                    stroke={'purple'}
                    strokeWidth={2}
                    strokeOpacity={0.8}
                    strokeDasharray="2,2"
              />
            </Group>

            <Group left={0} top={2*14}>
              <text x={0} y={0}>paa: {Math.round(optimizedParams.paa)} j</text>
              <line x1={-13} x2={-2} y1={-4} y2={-4}
                    stroke="#164e63" //cyan-900
                    strokeWidth={1.5}
                    strokeOpacity={3.0}
                    strokeDasharray="2,2"
              />
            </Group>

            <Group left={0} top={3*14}>
              <text x={0} y={0}
              fill={(Math.round(optimizedParams.paadec*100)/100 <= -2.95) ? 'red' : 'default'}
              >paadec: {Math.round(optimizedParams.paadec * 100)/100}</text>
            </Group>

            <Group left={0} top={4*14}>
              <text x={0} y={0}
              fill={(Math.round(optimizedParams.tau*100)/100 <= 0.51) ? 'red' : 'default'}
              >tau: {Math.round(optimizedParams.tau * 1000) / 1000}</text>
              <line x1={-13} x2={-2} y1={-4} y2={-4}
                    stroke={'#10b981'}
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    strokeDasharray="2,2"
              />
            </Group>

            <Group left={0} top={5*14}>
              <text x={0} y={0}>W': {Math.round(optimizedParams.cp * optimizedParams.tau * 60)} j</text>
            </Group>

            <Group left={0} top={6*14}>
              <text x={0} y={0}>CPdec: {Math.round(optimizedParams.cpdec*100)/100}</text>
            </Group>


          </Group>



          {/*Interval Pmax valid area*/}
          <rect x={logScale(timeIntervals.maxI1)} y={0} width={logScale(timeIntervals.maxI2)-logScale(timeIntervals.maxI1)} height={yMax} fill={'#FF00C7'} fillOpacity={0.05}/>
          <rect x={logScale(timeIntervals.maxI1)} y={0} width={1} height={yMax} fill={'#FF00C7'} fillOpacity={0.2}/>
          <rect x={logScale(timeIntervals.maxI2)-1} y={0} width={1} height={yMax} fill={'#FF00C7'} fillOpacity={0.2}/>
          <text x={logScale(timeIntervals.maxI1) + 10} y={10} fontSize={10}>
            <tspan x={logScale(timeIntervals.maxI1) + 5}>Paa</tspan>
            <tspan x={logScale(timeIntervals.maxI1) + 5} dy={10}>{timeIntervals.maxI1}-{timeIntervals.maxI2}s</tspan>
          </text>

          {/*Interval SAN valid area*/}
          <rect x={logScale(timeIntervals.sanI1)} y={0} width={logScale(timeIntervals.sanI2)-logScale(timeIntervals.sanI1)} height={yMax} fill={'#a600ff'} fillOpacity={0.05}/>
          <rect x={logScale(timeIntervals.sanI1)} y={0} width={1} height={yMax} fill={'#a600ff'} fillOpacity={0.2}/>
          <rect x={logScale(timeIntervals.sanI2)-1} y={0} width={1} height={yMax} fill={'#a600ff'} fillOpacity={0.2}/>
          <text x={logScale(timeIntervals.sanI1) + 10} y={10} fontSize={10}>
            <tspan x={logScale(timeIntervals.sanI1) + 5}>Paa dec</tspan>
            <tspan x={logScale(timeIntervals.sanI1) + 5} dy={10}>{timeIntervals.sanI1}-{timeIntervals.sanI2}s</tspan>
          </text>

          {/*Interval AN valid area*/}
          <rect x={logScale(timeIntervals.anI1)} y={0} width={logScale(timeIntervals.anI2)-logScale(timeIntervals.anI1)} height={yMax} fill={'#41A4FF'} fillOpacity={0.1}/>
          <rect x={logScale(timeIntervals.anI1)} y={0} width={1} height={yMax} fill={'#41A4FF'} fillOpacity={0.2}/>
          <rect x={logScale(timeIntervals.anI2)-1} y={0} width={1} height={yMax} fill={'#41A4FF'} fillOpacity={0.2}/>
          <text x={logScale(timeIntervals.anI1) + 10} y={10} fontSize={10}>
            <tspan x={logScale(timeIntervals.anI1) + 5}>Tau</tspan>
            <tspan x={logScale(timeIntervals.anI1) + 5} dy={10}>{timeIntervals.anI1}-{timeIntervals.anI2}s</tspan>
          </text>

          {/*Interval AE valid area*/}
          <rect x={logScale(timeIntervals.aeI1)} y={0} width={logScale(timeIntervals.aeI2)-logScale(timeIntervals.aeI1)} height={yMax} fill={'#7CDFFF'} fillOpacity={0.15}/>
          <rect x={logScale(timeIntervals.aeI1)} y={0} width={1} height={yMax} fill={'#4cb7da'} fillOpacity={0.4}/>
          <rect x={logScale(timeIntervals.aeI2)-1} y={0} width={1} height={yMax} fill={'#4cb7da'} fillOpacity={0.4}/>
          <text x={logScale(timeIntervals.aeI1) + 10} y={10} fontSize={10}>
            <tspan x={logScale(timeIntervals.aeI1) + 5}>CP</tspan>
            <tspan x={logScale(timeIntervals.aeI1) + 5} dy={10}>{timeIntervals.aeI1}-{timeIntervals.aeI2}s</tspan>
          </text>

          {/*Interval AE valid area*/}
          <rect x={logScale(timeIntervals.laeI1)} y={0} width={logScale(timeIntervals.laeI2)-logScale(timeIntervals.laeI1)} height={yMax} fill={'#727478'} fillOpacity={0.1}/>
          <rect x={logScale(timeIntervals.laeI1)} y={0} width={1} height={yMax} fill={'#727478'} fillOpacity={0.4}/>
          <rect x={logScale(timeIntervals.laeI2)-1} y={0} width={1} height={yMax} fill={'#727478'} fillOpacity={0.4}/>
          <text x={logScale(timeIntervals.laeI1) + 10} y={10} fontSize={10}>
            <tspan x={logScale(timeIntervals.laeI1) + 5}>CP dec</tspan>
            <tspan x={logScale(timeIntervals.laeI1) + 5} dy={10}>{timeIntervals.laeI1}-{timeIntervals.laeI2}s</tspan>
          </text>



          {/*c1 line*/}
          <LinePath
            data={pdc.breakdown.alactic}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke="teal"
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeDasharray="1,2"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c1) ?? 0}
            stroke="teal"
            strokeWidth={2}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
          />
          {/*When value is too close to -3*/}
          {(Math.round(optimizedParams.paadec*100)/100 <= -2.95) ? (
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
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeDasharray="1,2"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c2) ?? 0}
            stroke="#10b981"
            strokeWidth={2}
            strokeOpacity={0.8}
            strokeDasharray="1,5"
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
            strokeWidth={1}
            strokeOpacity={0.7}
            strokeDasharray="1,2"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.c3) ?? 0}
            stroke="purple"
            strokeWidth={2}
            strokeOpacity={0.7}
            strokeDasharray="1,5"
          />


          {/*total line*/}
          <LinePath
            data={pdc.breakdown.total}
            curve={curveBasis}
            x={(d:number, index:number) => logScale(index + 1) ?? d}
            y={(d) => yScale(d) ?? 0}
            stroke="indigo"
            strokeWidth={1.0}
            strokeOpacity={0.5}
            strokeDasharray="1,5"
          />
          <LinePath
            data={extendedCurveData}
            curve={curveBasis}
            x={(d) => logScale(d.x) ?? 0}
            y={(d) => yScale(d.total) ?? 0}
            stroke="indigo"
            strokeWidth={2}
            strokeOpacity={0.8}
            //strokeDasharray="1,8"
          />



          {/*all dots*/}
          {fieldPointData.map((point, i) => (
            <Circle
              key={`fieldpoint-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={1}
              fill={point.color}
              fillOpacity={0.9}
            />

          ))}
          {/*{extendedPointData.map((point, i) => (*/}
          {/*  <Circle*/}
          {/*    key={`point-${i}`}*/}
          {/*    className="dot"*/}
          {/*    cx={logScale(pointX(point))}*/}
          {/*    cy={yScale(pointY(point))}*/}
          {/*    r={4}*/}
          {/*    fill={pointC(point)}*/}
          {/*    fillOpacity={0.5}*/}
          {/*  />*/}
          {/*))}*/}
          {functionalPointData.map((point, i) => (
              <Circle
              key={`fpoint-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={3}
              fill={'green'}
            />
          ))}
          {functionalPointData.map((point, i) => (
            <text
              key={`fpointText-${i}`}
              fontSize={9}
              x={logScale(pointX(point)) + 2}
              y={yScale(pointY(point)) - 4}
            >({point.x}, {Math.round(point.y)})</text>
          ))}

        </Group>
      </svg>
    </div>
  )
}