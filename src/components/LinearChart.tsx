import { max } from '@visx/vendor/d3-array';
import * as allCurves from '@visx/curve';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { MarkerCircle } from '@visx/marker';
import { calculateIntercept, calculateSlope, plotXY } from "../libs/geometry";


type CurveType = keyof typeof allCurves;

export type CurveProps = {
  width: number;
  height: number;
  data: LinearGraphData;
};

interface DataPoint {
  x: number;
  y: number;
}

interface LinearGraphData {
    testOneShortTime: number;
    testOneShortWatt: number;
    testOneLongTime : number;
    testOneLongWatt : number;
    testTwoShortTime: number;
    testTwoShortWatt: number;
    testTwoLongTime : number;
    testTwoLongWatt : number;
}

const createLinearDataLine = (
  data: LinearGraphData,
  variant: number,
  maxX:number,
) => {
  // console.log(data);

  const x0:number = (variant === 0) ? data.testOneShortTime: data.testTwoShortTime;
  const x1:number = (variant === 0) ? data.testOneLongTime: data.testTwoLongTime;
  let y0:number = (variant === 0) ? data.testOneShortWatt: data.testTwoShortWatt;
  let y1:number = (variant === 0) ? data.testOneLongWatt: data.testTwoLongWatt;

  y0 = x0 * y0;
  y1 = x1 * y1;

  // console.log(y0)
  // console.log(y1)

  const slope = calculateSlope (x0, x1, y0, y1);
  console.log("slope "+slope);
  const intercept = calculateIntercept(slope, x0, y0)
  console.log("intercept "+intercept);

  const dataPoints:DataPoint[] = [];
  dataPoints.push({x:0, y:plotXY(0, slope, intercept)})
  dataPoints.push({x:x0, y:plotXY(x0, slope, intercept)})
  dataPoints.push({x:x1, y:plotXY(x1, slope, intercept)})
  dataPoints.push({x:maxX, y:plotXY(maxX, slope, intercept)})

  return dataPoints
}

export default function LinearChart({
  width,
  height,
  data
}: CurveProps) {
  console.log("Updating LinearChart");
  // console.log(data);

  const maxX:number = Math.max(data.testOneLongTime, data.testTwoLongTime)

  const graphData = new Array(2).fill(null).map((_, i) =>
      createLinearDataLine (data, i, maxX)
  );

  // console.log(graphData);
  const graphDataCombined = graphData.reduce((rec, d) => rec.concat(d), []);
  // console.log(graphDataCombined);

  // data accessors
  const getX = (d: DataPoint) => d.x;
  const getY = (d: DataPoint) => d.y;

// scales
  const xScale = scaleLinear<number>({
    domain: [0, max(graphDataCombined, getX) as number],
  });
  const yScale = scaleLinear<number>({
    domain: [0, max(graphDataCombined, getY) as number],
  });

  const curveType:CurveType = 'curveNatural';
  const showPoints = true;
  const svgHeight = height;
  const lineHeight = svgHeight;

  // update scale output ranges
  xScale.range([0, width - 50]);
  yScale.range([lineHeight - 2, 0]);

  return (
    <div className="visx-curves-demo">

      <svg width={width} height={svgHeight}>

        <MarkerCircle id="marker-circle" fill="#333" size={2} refX={2} />

        <rect width={width} height={svgHeight} fill="#efefef" rx={14} ry={14} />
        {width > 8 &&
          graphData.map((lineData, i) => {
            // console.log(lineData);
            const markerStart = ""//"url(#marker-circle)";
            const markerEnd = ""//"url(#marker-circle)";
            return (
              <Group key={`lines-${i}`} top={10} left={13}>
                {showPoints &&
                  lineData.map((d, j) => (
                    <circle
                      key={i + j}
                      r={0}
                      cx={xScale(getX(d))}
                      cy={yScale(getY(d))}
                      stroke="rgba(33,33,33,0.5)"
                      fill="transparent"
                    />
                  ))}
                <LinePath<DataPoint>
                  curve={allCurves[curveType]}
                  data={lineData}
                  x={(d) => xScale(getX(d)) ?? 0}
                  y={(d) => yScale(getY(d)) ?? 0}
                  stroke="#333"
                  strokeWidth= '2'
                  strokeOpacity= '1'
                  shapeRendering="geometricPrecision"
                  markerMid="url(#marker-circle)"
                  markerStart={markerStart}
                  markerEnd={markerEnd}
                />
              </Group>
            );
          })}
      </svg>

    </div>
  );

}