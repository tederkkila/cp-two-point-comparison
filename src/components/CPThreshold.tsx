//TODO Add constant W' block and change color as as it goes up or down
//TODO box for P zones. Show severe heavy moderate as zones too.

import { Group } from '@visx/group';
import { curveBasis } from '@visx/curve';
import { Circle, LinePath } from '@visx/shape';
import { GlyphDot } from '@visx/glyph'
import { Threshold } from '@visx/threshold';
import { scaleLinear, scaleLog, coerceNumber } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { PatternLines } from '@visx/pattern';
import { LinearGradient } from '@visx/gradient';
import { calculateIntercept, calculateSlope, plotCP } from "../libs/calculations_cp.ts";
import { useState, useEffect } from "react";

export const background = '#f3f3f3';

const minX: number = 30;
const maxX: number = 3000;//60*60;
const xStep = 10;
const logValues = [minX, 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 60 * 60, maxX];
const intervals = [60, 120, 180, 300];

interface LinearGraphData {
  testOneShortTime: number;
  testOneShortWatt: number;
  testOneLongTime: number;
  testOneLongWatt: number;
  testTwoShortTime: number;
  testTwoShortWatt: number;
  testTwoLongTime: number;
  testTwoLongWatt: number;
}

interface LineDataPoint {
  x: number;
  t1: number;
  t2: number;
}

interface DataPoint {
  x: number;
  y: number;
  color: string;
  text1? : string;
  text2? : string;
}

// data accessors
const getX = (d: LineDataPoint) => d.x;
const t1 = (d: LineDataPoint) => d.t1;
const t2 = (d: LineDataPoint) => d.t2;

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;
const pointC = (d: DataPoint) => d.color;
const pointText1 = (d: DataPoint) => d.text1;
const pointText2 = (d: DataPoint) => d.text2;

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

const createCPDataLine = (
  t1slope: number,
  t1intercept: number,
  t2slope: number,
  t2intercept: number,
  minX: number,
  maxX: number,
) => {
  //console.log(data);

  //console.log(`Test One: y = ${t1slope} x + ${t1intercept}`);
  //console.log(`Test Two: y = ${t2slope} x + ${t2intercept}`);


  const arrayCount = maxX / xStep - minX / xStep + 1;
  return new Array(arrayCount).fill(null).map((_, i) =>
    generateDataRow(i, minX, xStep, t1slope, t1intercept, t2slope, t2intercept)
  );
}

const generateDataRow = (
  x: number,
  minX: number,
  xStep: number,
  t1slope: number,
  t1intercept: number,
  t2slope: number,
  t2intercept: number,
): LineDataPoint => {

  return {
    x : minX + x * xStep,
    t1: plotCP(minX + x * xStep, t1slope, t1intercept),
    t2: plotCP(minX + x * xStep, t2slope, t2intercept)
  }
}

const createPointData = (
  t1x0: number,
  t1x1: number,
  t1y0: number,
  t1y1: number,
  t2x0: number,
  t2x1: number,
  t2y0: number,
  t2y1: number,
): DataPoint[] => {

  const dataPoints: DataPoint[] = [];
  dataPoints.push(generatePointRow(t1x0, t1y0, 'gray'));
  dataPoints.push(generatePointRow(t1x1, t1y1, 'gray'));
  dataPoints.push(generatePointRow(t2x0, t2y0, 'black'));
  dataPoints.push(generatePointRow(t2x1, t2y1, 'black'));

  return dataPoints
};

const createIntervalData = (
  t2slope: number,
  t2intercept: number,
): DataPoint[] => {

  const dataPoints: DataPoint[] = [];
  for (const i in intervals) {
    const duration = intervals[i];
    const minutes = Math.floor(duration / 60);
    const y = Math.round(plotCP(duration, t2slope, t2intercept));
    const cpMultiple = Math.round(y/t2slope*100)/100;
    const intervalColor = 'red';
    const pointText1 = `${minutes}min@${y} W`;
    const pointText2 = `(${cpMultiple}CP)`;
    dataPoints.push(
      generatePointRow(
        duration,
        y,
        intervalColor,
        pointText1,
        pointText2,
      )
    );
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

export type ThresholdProps = {
  width: number;
  height: number;
  data: LinearGraphData;
  expandZones: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function CPThreshold({ width, height, data, expandZones, margin = defaultMargin }: ThresholdProps) {


  //console.log("Updating CPThreshold");
  //console.log(data);
  width = Math.floor(width);

  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const defaultZoneWidth = 20;
  const defaultZoneX = xMax-20;

  const [zoneWidth, setZoneWidth] = useState(defaultZoneWidth);
  const [zoneX, setZoneX] = useState(defaultZoneX);
  const [zoneOpacity, setZoneOpacity] = useState(0);
  const [axisColor, setAxisColor] = useState("#e0e0e0");

  useEffect(() => {
    console.log(expandZones)
    if (expandZones) {
      setZoneWidth(defaultZoneWidth + xMax -20);
      setZoneX(defaultZoneX - xMax + 20);
      setZoneOpacity(0.4);
      setAxisColor("#f1f1f1");
    } else {
      setZoneWidth(defaultZoneWidth);
      setZoneX(defaultZoneX);
      setZoneOpacity(0);
      setAxisColor("#e0e0e0");
    }

  }, [defaultZoneWidth, defaultZoneX, expandZones, xMax])

  if (width < 10) return null;

  const t1x0: number = data.testOneShortTime;
  const t1x1: number = data.testOneLongTime;
  const t1y0: number = data.testOneShortWatt;
  const t1y1: number = data.testOneLongWatt;

  const t2x0: number = data.testTwoShortTime;
  const t2x1: number = data.testTwoLongTime;
  const t2y0: number = data.testTwoShortWatt;
  const t2y1: number = data.testTwoLongWatt;

  const t1slope = calculateSlope(t1x0, t1x1, t1x0 * t1y0, t1x1 * t1y1);
  const t2slope = calculateSlope(t2x0, t2x1, t2x0 * t2y0, t2x1 * t2y1);
  const t1intercept = calculateIntercept(t1slope, t1x0, t1x0 * t1y0);
  const t2intercept = calculateIntercept(t2slope, t2x0, t2x0 * t2y0);

  const graphData = createCPDataLine(
    t1slope, t1intercept, t2slope, t2intercept, minX, maxX
  );
  const pointData = createPointData(
    t1x0, t1x1, t1y0, t1y1, t2x0, t2x1, t2y0, t2y1
  );

  const intervalData = createIntervalData(
    t2slope, t2intercept
  );

  //console.log(graphData);
  //console.log(intervalData);


  // scales
  const xScale = scaleLinear<number>({
    domain: [0, maxX],
  });
  const yScale = scaleLinear<number>({
    domain: [
      0, // Math.min(...graphData.map((d) => Math.min(t1(d), t2(d)))),
      Math.max(...graphData.map((d) => Math.max(t1(d), t2(d)))),
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

  //console.log(getMinMax(logValues))
  //console.log(logScale.domain())




  //console.log("width|margin.left|margin.right", width, margin.left, margin.right);
  //console.log("xMax/yMax", xMax, yMax);

  // update scale output ranges
  xScale.range([0, width - 50]);
  yScale.range([yMax, 0]);

  let cpBlockColor = '#222'
  if (Math.round(t1slope * 10) / 10 < Math.round(t2slope * 10) / 10) {
    cpBlockColor = 'green';
  } else if (Math.round(t1slope * 10) / 10 > Math.round(t2slope * 10) / 10) {
    cpBlockColor = 'red';
  }

  // console.log("height: " + height + ' | ' + yScale(height));
  // console.log("0: " + 0 + ' | ' + yScale(0));

  let cpY = yScale(t2slope)
  let cpDiffHeight = yScale(t1slope) - yScale(t2slope);

  if (Math.round(t1slope * 10) / 10 > Math.round(t2slope * 10) / 10) {
    cpY = yScale(t1slope)
    cpDiffHeight = yScale(t2slope) - yScale(t1slope);
  }

  // console.log (yScale(t1slope))
  // console.log (yScale(t2slope))
  // console.log(cpDiffHeight);

  const cpHeight = yScale(0) - yScale(t2slope);
  //console.log("cpHeight: " + cpHeight);
  const cpZ1C = t2slope * 0.80;
  const cpZ1CHeight = yScale(0) - yScale(cpZ1C);

  const cpZ2 = t2slope * 0.87;
  const cpZ2Height = yScale(cpZ1C) - yScale(cpZ2);

  const cpZ3A = t2slope * 0.94;
  const cpZ3AHeight = yScale(cpZ2) - yScale(cpZ3A);

  const cpZ3B = t2slope * 1.01;
  const cpZ3BHeight = yScale(cpZ3A) - yScale(cpZ3B);

  const cpZ4 = t2slope * 1.05;
  const cpZ4Height = yScale(cpZ3B) - yScale(cpZ4);

  const cpZ5 = t2slope * 1.16;
  const cpZ5Height = yScale(cpZ4) - yScale(cpZ5);

  const cpZ6 = t2slope * 1.50;
  const cpZ6Height = yScale(cpZ5) - yScale(cpZ6);

  //const cpZ7 = 0;
  const cpZ7Height = yScale(cpZ6);

  // interval boxes
  const box60Y = plotCP(60, t2slope, t2intercept);
  const box60Height = yScale(t2slope) - yScale(box60Y);

  const box120Y = plotCP(120, t2slope, t2intercept);
  const box120Height = yScale(t2slope) - yScale(box120Y);

  const box180Y = plotCP(180, t2slope, t2intercept);
  const box180Height = yScale(t2slope) - yScale(box180Y);

  const box300Y = plotCP(300, t2slope, t2intercept);
  const box300Height = yScale(t2slope) - yScale(box300Y);



  return (
    <div>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={background} rx={14}/>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={xMax} height={yMax} stroke={axisColor}/>
          <GridColumns scale={logScale} width={xMax} height={yMax} stroke="#e0e0e0"/>
          {/*<line x1={xMax} x2={xMax} y1={0} y2={yMax} stroke="#e0e0e0"/>*/}
          <AxisBottom top={yMax} scale={logScale} numTicks={width > 520 ? 10 : 5}/>
          <AxisLeft scale={yScale} />
          {/*<Axis
            orientation={Orientation.bottom}
            scale={logScale}
          />*/}

          <text x={20} y={-10} fontSize={16} fillOpacity={0.4}>[ resulting hyperbolic power-duration curve (log time
            axis) ]
          </text>
          <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>Power (Watts)</text>
          <text x={width - 200} y={height - 100} fontSize={10}>Time (seconds)</text>

          <Threshold<LineDataPoint>
            id={`${Math.random()}`}
            data={graphData}
            x={(d) => logScale(getX(d)) ?? 0}
            y0={(d) => yScale(t1(d)) ?? 0}
            y1={(d) => yScale(t2(d)) ?? 0}
            clipAboveTo={0}
            clipBelowTo={yMax}
            curve={curveBasis}
            belowAreaProps={{
              fill       : 'green',
              fillOpacity: 0.1,
            }}
            aboveAreaProps={{
              fill       : 'red',
              fillOpacity: 0.1,
            }}
          />
          <LinePath
            data={graphData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(t1(d)) ?? 0}
            stroke="#222"
            strokeWidth={1.0}
            strokeOpacity={0.8}
            strokeDasharray="1,2"
          />
          <LinePath
            data={graphData}
            curve={curveBasis}
            x={(d) => logScale(getX(d)) ?? 0}
            y={(d) => yScale(t2(d)) ?? 0}
            stroke="#222"
            strokeWidth={1.5}
          />

          {pointData.map((point, i) => (
            <Circle
              key={`point-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={2}
              fill={pointC(point)}
            />
          ))}

          {/*Current CP Line*/}
          <line x1={logScale(minX)} x2={logScale(3000)} y1={yScale(t2slope)} y2={yScale(t2slope)}
                stroke={cpBlockColor}/>
          <text
            x={-20}
            y={yScale(t2slope) + 6}
            fontSize={12}
            fill={cpBlockColor}
            fillOpacity={0.9}
            fontWeight={600}
          >CP
          </text>
          {/*Fill: Current CP Diff*/}
          <rect x={0} y={cpY}
                width={logScale(3000)} height={cpDiffHeight}
                fill={cpBlockColor} fillOpacity={0.1}/>
          {/*Fill: Current CP Basic Area*/}
          <rect x={0} y={yScale(t2slope)} width={logScale(3000)} height={cpHeight} fill={'gray'}
                fillOpacity={0.1}/>
          {/*Fill: Current CP 100%*/}
          {/*<rect x={width - 100} y={yScale(t2slope)} width={20} height={cpHeight} fill={'gray'}*/}
          {/*      fillOpacity={0.2}/>*/}



          {/*Previous CP Line*/}
          <line x1={logScale(minX)} x2={logScale(maxX)} y1={yScale(t1slope)} y2={yScale(t1slope)}
                stroke="#222"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                strokeDasharray="1,2"
          />
          <text
            x={-43}
            y={yScale(t1slope) + 6}
            fontSize={12}
            fill="#222"
            fillOpacity={0.2}
            fontWeight={600}
          >Old CP
          </text>

          {/*intervals*/}
          <PatternLines
            id = "diagonal"
            height={5}
            width={5}
            stroke="blue"
            strokeWidth={1}
            orientation={['diagonal']} />
          <rect x={0} y={yScale(box60Y)} width={logScale(60)} height={box60Height}
                fill={`url(#diagonal)`} fillOpacity={0.1} stroke={'blue'} strokeOpacity={0.2}/>
          <rect x={0} y={yScale(box60Y)} width={logScale(60)} height={box60Height} fill={'blue'} fillOpacity={0.1}/>

          <rect x={0} y={yScale(box120Y)} width={logScale(120)} height={box120Height}
                fill={`url(#diagonal)`} fillOpacity={0.08} stroke={'blue'} strokeOpacity={0.15}/>
          <rect x={0} y={yScale(box120Y)} width={logScale(120)} height={box120Height} fill={'blue'} fillOpacity={0.1}/>

          <rect x={0} y={yScale(box180Y)} width={logScale(180)} height={box180Height}
                fill={`url(#diagonal)`} fillOpacity={0.06} stroke={'blue'} strokeOpacity={0.1}/>
          <rect x={0} y={yScale(box180Y)} width={logScale(180)} height={box180Height} fill={'blue'} fillOpacity={0.1}/>

          <rect x={0} y={yScale(box300Y)} width={logScale(300)} height={box300Height}
                fill={`url(#diagonal)`} fillOpacity={0.04} stroke={'blue'} strokeOpacity={0.05}/>
          <rect x={0} y={yScale(box300Y)} width={logScale(300)} height={box300Height} fill={'blue'} fillOpacity={0.1}/>

          {intervalData.map((point, i) => (
            <GlyphDot
              key={`ipoint-${i}`}
              className="dot"
              cx={logScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={2.5}
              fill="none"
              stroke={pointC(point)}
              strokeWidth={1}
            />
          ))}

          {intervalData.map((point, i) => (
            <text
              key={`itext-${i}`}
              x={0}
              y={yScale(pointY(point)) - 30}

              fontSize={12}
              fill={'grey'}
              fillOpacity={0.5}
              fontWeight={400}
            >
              <tspan x={logScale(pointX(point)) + 3} dy={'1em'}>{pointText1(point)}</tspan>
              <tspan x={logScale(pointX(point)) + 3} dy={'1em'}>{pointText2(point)}</tspan>

            </text>
          ))}

          {/*zones*/}

          {/*Fill: Current CP Z1C*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ1C)} width={defaultZoneWidth} height={cpZ1CHeight} fill={'#082f49'}
                fillOpacity={0.5}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ1C)} width={zoneWidth} height={cpZ1CHeight} fill={'#082f49'}
                fillOpacity={0.8 * zoneOpacity}/>
          <text x={width - 100 - 22} y={yScale(cpZ1C) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z1
          </text>
          <text x={width - 100} y={yScale(cpZ1C) + 12} fontSize={12} fill={'white'} fillOpacity={0.5}
                fontWeight={400}>80
          </text>
          <text x={width - 100 + 22} y={yScale(cpZ1C) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 0.80)}</text>

          {/*Fill: Current CP Z2*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ2)} width={defaultZoneWidth} height={cpZ2Height} fill={'#082f49'}
                fillOpacity={0.4}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ2)} width={zoneWidth} height={cpZ2Height+1} fill={'#082f49'}
                fillOpacity={0.5 * zoneOpacity}/>
          <text x={width - 100 - 22} y={yScale(cpZ2) + 11} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z2
          </text>
          <text x={width - 100} y={yScale(cpZ2) + 11} fontSize={12} fill={'#082f49'} fillOpacity={0.5}
                fontWeight={400}>87
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ2) + 11} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 0.87)}</text>

          {/*Fill: Current CP Z3A*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ3A)} width={defaultZoneWidth} height={cpZ3AHeight} fill={'#082f49'}
                fillOpacity={0.3}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ3A)} width={zoneWidth} height={cpZ3AHeight+1} fill={'#082f49'}
             fillOpacity={0.4 * zoneOpacity}/>
          <text x={width - 100 - 24} y={yScale(cpZ3A) + 11} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z3A
          </text>
          <text x={width - 100} y={yScale(cpZ3A) + 11} fontSize={12} fill={'#082f49'} fillOpacity={0.5}
                fontWeight={400}>94
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ3A) + 11} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 0.94)}</text>

          {/*Fill: Current CP Z3B*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ3B)} width={defaultZoneWidth} height={cpZ3BHeight} fill={'#082f49'}
                fillOpacity={0.2}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ3B)} width={zoneWidth} height={cpZ3BHeight+1} fill={'#082f49'}
                fillOpacity={0.2 * zoneOpacity}/>
          <text x={width - 100 - 24} y={yScale(cpZ3B) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z3B
          </text>
          <text x={width - 100} y={yScale(cpZ3B) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>101
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ3B) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 1.01)}</text>

          {/*Fill: Current CP Z4*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ4)} width={defaultZoneWidth} height={cpZ4Height} fill={'red'}
                fillOpacity={0.1}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ4)} width={zoneWidth} height={cpZ4Height+1} fill={'red'}
                fillOpacity={0.1 * zoneOpacity}/>
          <text x={width - 100} y={yScale(cpZ4) + 9} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>105
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ4) + 9} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 1.05)}</text>

          {/*Fill: Current CP Z5*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ5)} width={defaultZoneWidth} height={cpZ5Height} fill={'red'}
                fillOpacity={0.2}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ5)} width={zoneWidth} height={cpZ5Height+1} fill={'red'}
                fillOpacity={0.4 * zoneOpacity}/>
          <text x={width - 100 - 22} y={yScale(cpZ5) + 10} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z5
          </text>
          <text x={width - 100} y={yScale(cpZ5) + 10} fontSize={12} fill={'red'} fillOpacity={0.5}
                fontWeight={400}>116
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ5) + 10} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 1.16)}</text>

          {/*Fill: Current CP Z6*/}
          <rect className="smooth" x={defaultZoneX} y={yScale(cpZ6)} width={defaultZoneWidth} height={cpZ6Height} fill={'red'}
                fillOpacity={0.5}/>
          <rect className="smooth" x={zoneX} y={yScale(cpZ6)} width={zoneWidth} height={cpZ6Height+1} fill={'red'}
                fillOpacity={0.6 * zoneOpacity}/>
          <text x={width - 100 - 22} y={yScale(cpZ6) + 10} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z6
          </text>
          <text x={width - 100} y={yScale(cpZ6) + 10} fontSize={12} fill={'white'} fillOpacity={0.5}
                fontWeight={400}>150
          </text>
          <text x={width - 100 + 21} y={yScale(cpZ6) + 10} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}
          >{Math.round(t2slope * 1.50)}</text>

          {/*Fill: Current CP Z7*/}
          <LinearGradient id="gradientRed0" from={background} to="red" rotate="0" />,
          <LinearGradient id="gradientRed45" from={background} to="red" rotate="-60" />,

          <rect className="smooth" x={defaultZoneX} y={0} width={defaultZoneWidth} height={cpZ7Height}
                fill={"url(#gradientRed0)"} fillOpacity={0.7}/>
          <rect className="smooth" x={zoneX} y={0} width={zoneWidth} height={cpZ7Height+1}
                fill={"url(#gradientRed0)"} fillOpacity={0.85 * zoneOpacity}/>
          <text x={width - 100 - 22} y={yScale(cpZ6) -2} fontSize={12} fill={'black'} fillOpacity={0.5}
                fontWeight={400}>Z7
          </text>
          {/*<text x={width - 100} y={yScale(cpZ7) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}*/}
          {/*      fontWeight={400}>150*/}
          {/*</text>*/}
          {/*<text x={width - 100 + 21} y={yScale(cpZ7) + 12} fontSize={12} fill={'black'} fillOpacity={0.5}*/}
          {/*      fontWeight={400}*/}
          {/*>{Math.round(t2slope * 1.50)}</text>*/}


        </Group>
      </svg>
    </div>
  );
}
