import { useState } from 'react'
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import ExtendedEstimation from "./components/ExtendedEstimation.tsx";
import { ExtendedSolution, MMPDataPoint } from "./types/interfaces.ts"
import PTSideBar from "./components/PTSidebar.tsx";

const defaultMMPData: MMPDataPoint[] = [
  { time: 5, power: 1117 },
  { time: 60, power: 684 },
  { time: 300, power: 435 },
  // { time: 720, power: 369},
  { time: 1200, power: 365 },
  { time: 2400, power: 343 },
  { time: 3600, power: 332 },
  { time: 7200, power: 323 },
  { time: 10800, power: 311 },
]

const henryMMPDataA: MMPDataPoint[] = [
  { time: 180, power: 449 },
  { time: 727, power: 384 },
  { time: 7560, power: 340 },
]

const henryMMPDataB: MMPDataPoint[] = [
  { time: 180, power: 455 },
  { time: 1094, power: 386, distance: 5000 },
]

const henryMMPDataC: MMPDataPoint[] = [
  // { time: 30, power: 830 },
  // { time: 60, power: 644 },
  { time: 180, power: 455 },
  { time: 1094, power: 386 },
  { time: 180, power: 449 },
  { time: 727, power: 384 },
  { time: 7560, power: 340 },
]

const tedMMPData: MMPDataPoint[] = [
  { time: 20, power: 700 },
  { time: 60, power: 480 },
  { time: 180, power: 375 },
  { time: 391, power: 331 },
  { time: 21 * 60 + 49, power: 309 },
  { time: 45 * 60 + 41, power: 296 },
  { time: 3600 + 42 * 60 + 4, power: 280 },
  { time: 3 * 3600 + 40 * 60 + 50, power: 261 },
]

const asyaMMPData: MMPDataPoint[] = [
  { time: 60, power: 252 },
  { time: 120, power: 220 + 30 }, //underperformed
  { time: 1231, power: 192 },
  { time: 60 * 68 + 6, power: 174 },
  { time: 120 * 60 + 24 * 60 + 13, power: 165 },
]

const magnusMMPData: MMPDataPoint[] = [
  { time: 60, power: 630 },
  { time: 181, power: 457 + 28 },
  { time: 720, power: 408 + 9 },
  { time: 60 * 39 + 49, power: 383 },
  { time: 3 * 60 * 60 + 12 * 60 + 49, power: 339 },
]

const dimasAMMPData: MMPDataPoint[] = [
  //{ time: 180, power: 315 +10, distance: 724 }, //Oct 2, 2024
  //{ time: 600, power: 284, distance: 2120 }, //Oct 2, 2024
  { time: 175, power: 319 + 9, distance: 710 }, //Oct 2, 2024
  { time: 600, power: 284, distance: 2090 }, //Oct 2, 2024
  { time: 60 * 60 + 53 * 60 + 46, power: 256, distance: 21480 }, //Oct 13, 2024
]
const dimasBMMPData: MMPDataPoint[] = [
  //{ time: 179, power: 309, distance: 630 }, //May 6, 2025
  { time: 159 + 21, power: 315 + 5 + 8, distance: 696 }, //May 6, 2025
  //{ time: 719, power: 279, distance: 2530 }, //May 6, 2025
  { time: 696, power: 283, distance: 2470 }, //May 6, 2025
  //{ time: 180, power: 311, distance: 718 }, //April 10, 2025
  //{ time: 721, power: 272, distance: 2460 }, //April 10, 2025
]

const brianAMMPData: MMPDataPoint[] = [
  { time: 183, power: 349, distance: 930 },
  { time: 595, power: 303, distance: 2.650 },
  { time: 3 * 3600 + 10 * 60 + 18, power: 240, distance: 42640 },
]

const brianBMMPData: MMPDataPoint[] = [
  { time: 180, power: 343, distance: 954 },
  { time: 720, power: 296, distance: 3300 },
]

const mpMMPData: MMPDataPoint[] = [
  { time: 1.7 * 60, power: 400, },
  { time: 2.2 * 60, power: 350, },
  { time: 3.1 * 60, power: 300, },
  { time: 4 * 60, power: 275, },
]

const vanhataloMMPData: MMPDataPoint[] = [
  { time: 160, power: 453, },
  { time: 205, power: 430, },
  { time: 260, power: 405, },
  { time: 430, power: 375, },
  { time: 685, power: 360, },
]

const yiqiaoMMPData: MMPDataPoint[] = [
  { time: 5, power: 539,},
  { time: 60, power: 401,},
  { time: 180, power: 365,},
  { time: 300, power: 362,},
  { time: 19*60 + 34, power: 333, distance: 4910},
  { time: 35*60 + 25, power: 335, distance: 10090},
  { time: 60*60, power: 310, },
]
const masahiroMMPData: MMPDataPoint[] = [
  { time: 10, power: 438,},
  { time: 302, power: 319,},
  { time: 60*10+55, power: 297,},
  { time: 38*60 + 33, power: 280, distance: 10000},
]

const datasets = {
  default  : { data: defaultMMPData, kg: 75 },
  henryA   : { data: henryMMPDataA, kg: 75 },
  henryB   : { data: henryMMPDataB, kg: 75 },
  henryC   : { data: henryMMPDataC, kg: 75 },
  ted      : { data: tedMMPData, kg: 78 },
  asya     : { data: asyaMMPData, kg: 65 },
  magnus   : { data: magnusMMPData, kg: 88 },
  dimasA   : { data: dimasAMMPData, kg: 77 },
  dimasB   : { data: dimasBMMPData, kg: 77 },
  brianA   : { data: brianAMMPData, kg: 61 },
  brianB   : { data: brianBMMPData, kg: 61 },
  mp       : { data: mpMMPData, kg: 61 },
  vanhatalo: { data: vanhataloMMPData, kg: 61 },
  yiqiao: {data: yiqiaoMMPData, kg:61},
  masahiro: {data: masahiroMMPData, kg:61},

}

const initialParamsDefault: ExtendedSolution = {
  cp      : 300,
  cpdec   : 0, //-0.583,
  cpdecdel: -180,
  cpdel   : -0.9,
  paa     : 300,
  paadec  : -2,
  tau     : 1,
  taudel  : -4.8,
};

// const initialParamsPerfect: ExtendedSolution = {
//   cp      : 368.307779086647,
//   cpdec   : -0.172873679728639,
//   cpdecdel: -25.6332667882639,
//   cpdel   : -3.71759146408344,
//   paa     : 1199.97640109532,
//   paadec  : -8.22147030800883,
//   tau     : 0.904442912161157,
//   taudel  : -6.78717293919494,
// }

// const distanceMeters = {
//   fiveK: 5000,
//   tenK: 10000,
//   halfMarathon: 21097.5,
//   fullMarathon: 42195
// };

function ExtendedApp() {

  const currentDataset = datasets.masahiro
  const [mmpData, setMMPData] = useState<MMPDataPoint[]>(currentDataset.data);

  const kg: number = currentDataset.kg;
  const reRun = currentDataset.data[2];

  let re;
  if (currentDataset.data[2] && currentDataset.data[2].distance) {
    re = Math.round(currentDataset.data[2].distance / (reRun.time) / (reRun.power / kg) * 100) / 100;
  } else {
    re = 0.95;
  }
  console.log("re", re)

  const initialParams = initialParamsDefault;
  //console.log("PTApp|initialParams",initialParams);

  const [extendedSolution, setExtendedSolution] = useState<ExtendedSolution | null>(null);
  console.log("extendedSolution", extendedSolution);

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">2-Point CP Calculation Comparison</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <PTSideBar mmpData={mmpData} setMMPData={setMMPData}/>
        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow w-full">

          <div>
            <ParentSize>{({ width }) =>
              <ExtendedEstimation
                width={width}
                height={500}
                mmpData={mmpData}
                initialParams={initialParams}
                setExtendedSolution={setExtendedSolution}
              />
            }</ParentSize>
          </div>


        </div>

      </div>
    </main>
  );
}

export default ExtendedApp
