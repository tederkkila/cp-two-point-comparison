import {
  DistanceScenariosProps, PTSolution
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

interface Scenario {
  title: string;
  RE: number;
  a: number;
  RE0: number;
  RE1: number;
  RE2: number;
}

type TitleRE = 'RE0' | 'RE1' | 'RE2';

const iterateRunPower = (
  ptSolution: PTSolution,
  distance: number,
  kg: number,
  re: number,
  a: number = 10,
): {power: number, time: number} => {

  const currentPTSolution = {
    ...ptSolution,
    a: a,
  }

  let runningSpeed = currentPTSolution.FTP / kg * re;
  let timeToRun = distance / runningSpeed;
  let power = currentPTSolution.FTP;

  const iterations = 10;
  for (let i = 0; i < iterations; i++){
    power = pt_model(timeToRun, currentPTSolution);
    runningSpeed = power / kg * re;
    timeToRun = distance / runningSpeed;
  }

  return {
    power: Math.round(power*10)/10,
    time: Math.round(timeToRun),
  }

}

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

// accessors
const getTitle = (d:Scenario) => d.title;


export default function DistanceScenarios({ width, height, margin = defaultMargin }: DistanceScenariosProps) {

  width = Math.floor(width);
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const distanceMeters = {
    fiveK: 5000,
    tenK: 10000,
    halfMarathon: 21097.5,
    fullMarathon: 42195
  };

  const kg: number = 78;
  const re: number = 0.96; //runningEffectiveness
  const reOffset: number = 0.02;
  const ptSolutionDefault: PTSolution = {
    FRC : 13266,
    Pmax : 925,
    FTP : 303,
    tau2 : 12,
    TTE: 698,
    a : 12.7,
  };
  const ptSolutionAsya: PTSolution = {
    FRC : 7817,
    Pmax : 547,
    FTP : 187,
    tau2 : 12,
    TTE: 593,
    a : 7.9,
  };
  const aOffset: number = 2;


  const ptSolution: PTSolution = ptSolutionAsya
  const distance = distanceMeters.halfMarathon;

  const dataTargets: Scenario[] = useMemo (() => {

    const reTargets: number[] = [
      re + reOffset,
      re,
      re - reOffset,
    ]

    const aTargets: number[] = [
      ptSolution.a - aOffset,
      ptSolution.a,
      ptSolutionAsya.a + aOffset,
    ]

    const dataArray = new Array(0);

    //each main group is based on a values
    for (const aTarget in aTargets) {

      const aObject: Record<string, string | number> = {
        title:  `a=${aTargets[aTarget]}`,
        a: aTargets[aTarget],
        RE: re,
      }

      let lastTime: number = 0;
      for (const reTarget in reTargets) {

        const { power, time } = iterateRunPower(
          ptSolution,
          distance,
          kg,
          reTargets[reTarget],
          aTargets[aTarget],
        );

        console.log(aTargets[aTarget], reTargets[reTarget], power, time)

        aObject[`RE${reTarget}`] = time - lastTime;
        lastTime = time;

      }

      dataArray.push(aObject);
    }

    return dataArray as Scenario[]
  }, [ptSolution, distance]);

  console.log("dataTargets", dataTargets);





  const dataTemp:Scenario[] = [
    {
      title: "A",
      RE: 0.96,
      a: 12,
      RE0: 3*60*60 + 29*60 + 48,
      RE1: 3*60*60 + 34*60 + 30 - (3*60*60 + 29*60 + 48),
      RE2: 3*60*60 + 39*60 + 25 - (3*60*60 + 34*60 + 30),
    },
    {
      title: "B",
      RE: 0.96,
      a: 10,
      RE0: 3*60*60 + 33*60 + 6,
      RE1: 3*60*60 + 37*60 + 56 - (3*60*60 + 33*60 + 6),
      RE2: 3*60*60 + 42*60 + 58 - (3*60*60 + 37*60 + 56),
    },
    {
      title: "C",
      RE: 0.96,
      a: 8,
      RE0: 3*60*60 + 36*60 + 31,
      RE1: 3*60*60 + 41*60 + 29 - (3*60*60 + 36*60 + 31),
      RE2: 3*60*60 + 46*60 + 40 - (3*60*60 + 41*60 + 29),
    },
  ]
  // console.log("dataTemp", dataTemp);

  const data = [...dataTargets];

  const keys = Object.keys(data[0]).filter((d) => d === 'RE0' || d === 'RE1' || d === 'RE2') as TitleRE[];
  console.log(typeof keys)

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

  const titleScale = scaleBand<string>({
    domain: ["a=10.7", "a=12.7", "a=14.7"],
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