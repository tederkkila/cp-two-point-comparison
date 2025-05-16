import {
  DistanceScenariosProps, PTSolution, Scenario
} from "../types/interfaces.ts"
import { BarStackHorizontal } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleLinear, scaleBand, scaleOrdinal } from "@visx/scale";
import { pt_model } from "../libs/optimization.ts";
import { useMemo } from "react";

const purple1 = '#6c5efb';
const purple2 = '#c998ff';
const purple3 = '#a44afe';
export const background = '#f3f3f3';



type TitleRE = 'RE0' | 'RE1' | 'RE2';

const formatSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round((totalSeconds % 60)*1000)/1000;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const iterateRunPower = (
  ptSolution: PTSolution,
  distance: number,
  re: number,
  a: number = 10,
): {power: number, time: number} => {
  let kg = 75;
  if (ptSolution.kg) {
    kg = ptSolution.kg;
  }
  const currentPTSolution = {
    ...ptSolution,
    a: a,
  }

  let runningSpeed = currentPTSolution.FTP / kg * re;
  //console.log("runningSpeed", runningSpeed, currentPTSolution.FTP, kg, re)
  let timeToRun = distance / runningSpeed;
  console.log("timeToRun pre", timeToRun, formatSeconds(timeToRun))
  let power = currentPTSolution.FTP;

  const iterations = 10;
  for (let i = 0; i < iterations; i++){
    power = pt_model(timeToRun, currentPTSolution);
    runningSpeed = power / kg * re;
    timeToRun = distance / runningSpeed;
    //console.log("iterating", i, power, timeToRun, formatSeconds(timeToRun))
  }
  //console.log("runningSpeed", runningSpeed, currentPTSolution.FTP, kg, re)
  console.log("timeToRun post", timeToRun, formatSeconds(timeToRun))
  return {
    power: Math.round(power*10)/10,
    time: Math.round(timeToRun),
  }

}



const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

// accessors
const getTitle = (d:Scenario) => d.title;


export default function DistanceScenarios({ width, height, ptSolution, distance, kg, re, margin = defaultMargin }: DistanceScenariosProps) {

  if (!ptSolution.kg) {
    ptSolution.kg = kg;
  }
  console.log("ptSolution", ptSolution)

  width = Math.floor(width);
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const reOffset: number = 0.02;
  const aOffset: number = 3;

  const dataTargets: Scenario[] = useMemo (() => {

    const reTargets: number[] = [
      re + reOffset,
      re,
      re - reOffset,
    ]

    const aTargets: number[] = [
      Math.round((ptSolution.a - aOffset)*10)/10,
      Math.round((ptSolution.a)*10)/10,
      Math.round((ptSolution.a + aOffset)*10)/10,
    ]

    const dataArray = new Array(0);

    //each main group is based on a values
    for (const aTarget in aTargets) {
      console.log(aTargets[aTarget])
      const aObject: Record<string, string | number> = {
        title: aTargets[aTarget],
        a: aTargets[aTarget],
        RE: re,
      }

      let lastTime: number = 0;

      //minor group is based on RE
      for (const reTarget in reTargets) {

        const { power, time } = iterateRunPower(
          ptSolution,
          distance,
          reTargets[reTarget],
          aTargets[aTarget],
        );

        console.log(aTargets[aTarget], reTargets[reTarget], power, time, formatSeconds(time))

        aObject[`RE${reTarget}`] = time - lastTime;
        lastTime = time;

      }

      dataArray.push(aObject);
    }

    return dataArray as Scenario[]
  }, [ptSolution, distance]);

  console.log("dataTargets", dataTargets);

  const data = [...dataTargets];

  const keys = Object.keys(data[0]).filter((d) => d === 'RE0' || d === 'RE1' || d === 'RE2') as TitleRE[];

  const timeTotals = data.reduce((allTotals, currentScenario: Scenario) => {
    const totalTime = keys.reduce((scenarioTotal, k) => {
      scenarioTotal += Number(currentScenario[k]);
      return scenarioTotal;
    }, 0);
    allTotals.push(totalTime);
    return allTotals;
  }, [] as number[]);

  const timeScale = scaleLinear<number>({
    domain: [0, Math.max(...timeTotals)],
    range: [0,xMax],
    nice: true,
  });

  const titles = data.map((d) => d.title);

  const titleScale = scaleBand<string>({
    domain: titles,
    range: [yMax, 0],
    padding: 0.2,
  });

  const colorScale = scaleOrdinal<TitleRE, string>({
    domain: keys,
    range: [purple1, purple2, purple3],
    unknown: "red"
  });


  return width < 10 ? null : (
    <>
      <div>
        <svg width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} fill={background} rx={14}/>
          <Group top={margin.top} left={margin.left}>
            <BarStackHorizontal <Scenario, TitleRE>
              data={data}
              keys={keys}
              height={yMax}
              y={getTitle}
              xScale={timeScale}
              yScale={titleScale}
              color={colorScale}
            >
              {(barStacks) =>
                barStacks.map((barStack) =>
                  barStack.bars.map((bar) => (
                    <rect
                      key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}

                    />
                  )),
                )
              }
            </BarStackHorizontal>
            <AxisLeft
              hideAxisLine
              hideTicks
              scale={titleScale}
              //tickFormat={formatDate}
              stroke={purple3}
              tickStroke={purple3}
              tickLabelProps={{
                fill: purple3,
                fontSize: 11,
                textAnchor: 'end',
                dy: '0.33em',
              }}
            />
            <AxisBottom
              top={yMax}
              scale={timeScale}
              stroke={purple3}
              tickStroke={purple3}
              tickLabelProps={{
                fill: purple3,
                fontSize: 11,
                textAnchor: 'middle',
              }}
            />
          </Group>
        </svg>
      </div>

    </>
  )
}