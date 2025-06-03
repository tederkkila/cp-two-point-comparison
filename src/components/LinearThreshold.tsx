import { Group } from '@visx/group';
import { curveBasis } from '@visx/curve';
import { Circle, LinePath } from '@visx/shape';
import { Threshold } from '@visx/threshold';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { calculateIntercept, calculateSlope, plotXY } from "../libs/calculations_cp.ts";

export const background = '#f3f3f3';

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
}

// data accessors
const getX = (d: LineDataPoint) => d.x;
const t1 = (d: LineDataPoint) => d.t1;
const t2 = (d: LineDataPoint) => d.t2;

const pointX = (d: DataPoint) => d.x;
const pointY = (d: DataPoint) => d.y;
const pointC = (d: DataPoint) => d.color;

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

const createLinearDataLine = (
  t1slope: number,
  t1intercept: number,
  t2slope: number,
  t2intercept: number,
  maxX: number,
) => {
  return new Array(maxX).fill(null).map((_, i) =>
    generateDataRow(i, t1slope, t1intercept, t2slope, t2intercept)
  );
}

const generateDataRow = (
  x: number,
  t1slope: number,
  t1intercept: number,
  t2slope: number,
  t2intercept: number,
): LineDataPoint => {
  return {
    x : x,
    t1: plotXY(x, t1slope, t1intercept),
    t2: plotXY(x, t2slope, t2intercept)
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
  t2color: string,
): DataPoint[] => {

  const dataPoints: DataPoint[] = [];
  dataPoints.push(generatePointRow(t1x0, t1y0, 'gray'));
  dataPoints.push(generatePointRow(t1x1, t1y1, 'gray'));
  dataPoints.push(generatePointRow(t2x0, t2y0, t2color));
  dataPoints.push(generatePointRow(t2x1, t2y1, t2color));

  return dataPoints
}

const generatePointRow = (
  x: number,
  y: number,
  color: string,
): DataPoint => {
  return {
    x    : x,
    y    : y,
    color: color,
  }
}

export type ThresholdProps = {
  width: number;
  height: number;
  data: LinearGraphData;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function LinearThreshold({ width, height, data, margin = defaultMargin }: ThresholdProps) {

  // const data:LinearGraphData = {
  //   testOneShortTime: 180,
  //   testOneShortWatt: 316,
  //   testOneLongTime : 600,
  //   testOneLongWatt : 286,
  //   testTwoShortTime: 180,
  //   testTwoShortWatt: 341,
  //   testTwoLongTime : 600,
  //   testTwoLongWatt : 287,
  // }

  //console.log("Updating LinearThreshold");
  // console.log(data);

  width = Math.floor(width);

  const maxX: number = Math.max(data.testOneLongTime, data.testTwoLongTime) + 100;

  const t1x0: number = data.testOneShortTime;
  const t1x1: number = data.testOneLongTime;
  const t1y0: number = t1x0 * data.testOneShortWatt;
  const t1y1: number = t1x1 * data.testOneLongWatt;

  const t2x0: number = data.testTwoShortTime;
  const t2x1: number = data.testTwoLongTime;
  const t2y0: number = t2x0 * data.testTwoShortWatt;
  const t2y1: number = t2x1 * data.testTwoLongWatt;

  const t1slope = calculateSlope(t1x0, t1x1, t1y0, t1y1);
  const t2slope = calculateSlope(t2x0, t2x1, t2y0, t2y1);
  const t1intercept = calculateIntercept(t1slope, t1x0, t1y0);
  const t2intercept = calculateIntercept(t2slope, t2x0, t2y0);
  //console.log(`Test One: y = ${t1slope} x + ${t1intercept}`);
  //console.log(`Test Two: y = ${t2slope} x + ${t2intercept}`);

  const graphData = createLinearDataLine(
    t1slope, t1intercept, t2slope, t2intercept, maxX
  );

  let test2SlopeColor = '#222'
  if (Math.round(t1slope*10)/10 < Math.round(t2slope*10)/10) {
    test2SlopeColor = 'green';
  } else if (Math.round(t1slope*10)/10 > Math.round(t2slope*10)/10) {
    test2SlopeColor = 'red';
  }

  const pointData = createPointData(
    t1x0, t1x1, t1y0, t1y1, t2x0, t2x1, t2y0, t2y1, test2SlopeColor
  );

  // console.log(graphData);

  // scales
  const xScale = scaleLinear<number>({
    domain: [0, maxX],
  });
  const yScale = scaleLinear<number>({
    domain: [
      Math.min(...graphData.map((d) => Math.min(t1(d), t2(d)))),
      Math.max(...graphData.map((d) => Math.max(t1(d), t2(d)))),
    ],
    nice  : true,
  });

  if (width < 10) return null;

  // bounds
  const xMax = width - margin.left - margin.right - 20;
  const yMax = height - margin.top - margin.bottom;

  // update scale output ranges
  xScale.range([0, width - 100]);
  yScale.range([yMax, 0]);

  const colorUnderShade: string = (t1slope < t2slope) ? 'green' : 'white';
  const colorOverShade: string = (t1slope >= t2slope) ? 'red' : 'white';

  let test2InterceptColor: string = "#222";
  if (Math.round(t1intercept) < Math.round(t2intercept)) {
    test2InterceptColor = 'green';
  } else if (Math.round(t1intercept) > Math.round(t2intercept)) {
    test2InterceptColor = 'red';
  }
  // Function to transform tick values (e.g., add a prefix)
  const transformTickValues = (value: number) => value / 1000;

  return (
    <div>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={background} rx={14}/>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={xScale} width={xMax} height={yMax} stroke="#e0e0e0"/>
          <GridColumns scale={xScale} width={xMax} height={yMax} stroke="#e0e0e0"/>
          <line x1={xMax} x2={xMax} y1={0} y2={yMax} stroke="#e0e0e0"/>
          <AxisBottom top={yMax} scale={xScale}/>
          <AxisLeft
            scale={yScale}
            // @ts-expect-error tickFormat expect certain format
            tickFormat={transformTickValues}
          />

          <text x={20} y={-10} fontSize={16} fillOpacity={0.4}>[ linearized two-parameter critical power model ]</text>
          <text x="-90" y="15" transform="rotate(-90)" fontSize={10}>Energy (kilojoules)</text>
          <text x={width-200} y={height-100} fontSize={10}>Time (seconds)</text>

          <text x="40" y="20" style={{ fontWeight: 700 }}>Previous Test</text>
          <line x1={25} x2={35} y1={14} y2={14}
                stroke="#222"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                strokeDasharray="1,2"
          />
          <text x="40" y="35">CP: {Math.round(t1slope * 10) / 10} W</text>
          <text x="40" y="50">W': {Math.round(t1intercept)} j</text>
          <text x="168" y="20" style={{ fontWeight: 700 }}>Current Test</text>
          <line x1={155} x2={166} y1={14} y2={14}
                stroke={test2SlopeColor}
                strokeWidth={1.5}
          />
          <text x="168" y="35" style={{ fill: test2SlopeColor }}>CP: {Math.round(t2slope * 10) / 10} W</text>
          <text x="168" y="50" style={{ fill: test2InterceptColor }}>W': {Math.round(t2intercept)} j</text>
          <Threshold<LineDataPoint>
            id={`${Math.random()}`}
            data={graphData}
            x={(d) => xScale(getX(d)) ?? 0}
            y0={(d) => yScale(t1(d)) ?? 0}
            y1={(d) => yScale(t2(d)) ?? 0}
            clipAboveTo={0}
            clipBelowTo={yMax}
            curve={curveBasis}
            belowAreaProps={{
              fill       : colorOverShade,
              fillOpacity: 0.2,
            }}
            aboveAreaProps={{
              fill       : colorUnderShade,
              fillOpacity: 0.2,
            }}
          />
          <LinePath
            data={graphData}
            curve={curveBasis}
            x={(d) => xScale(getX(d)) ?? 0}
            y={(d) => yScale(t1(d)) ?? 0}
            stroke="#222"
            strokeWidth={1.5}
            strokeOpacity={0.8}
            strokeDasharray="1,2"
          />
          <LinePath
            data={graphData}
            curve={curveBasis}
            x={(d) => xScale(getX(d)) ?? 0}
            y={(d) => yScale(t2(d)) ?? 0}
            stroke={test2SlopeColor}
            strokeWidth={1.5}
          />
          {pointData.map((point, i) => (
            <Circle
              key={`point-${i}`}
              className="dot"
              cx={xScale(pointX(point))}
              cy={yScale(pointY(point))}
              r={2}
              fill={pointC(point)}
            />
          ))}
        </Group>
      </svg>
    </div>
  );
}
