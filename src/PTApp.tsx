import { useState} from 'react'
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import PTEstimation from "./components/PTEstimation.tsx";
import { MMPDataPoint, PTSolution } from "./types/interfaces.ts"
import PTSideBar from "./components/PTSidebar.tsx";
import DistanceScenarios from "./components/DistanceScenarios.tsx";

function PTApp() {

  //console.log("running ptapp")

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
    { time: 1094, power: 386 },
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
    // { time: 20, power: 700 },
    { time: 60, power: 520 },
    { time: 180, power: 375 },
    { time: 391, power: 331 },
    { time: 21*60+49, power: 309 },
    { time: 45*60+41, power: 296 },
    { time: 3600+42*60+4, power: 280 },
    { time: 3*3600+40*60+50, power: 261 },
  ]

  const asyaMMPData: MMPDataPoint[] = [
    { time: 120, power: 220 + 30 }, //underperformed
    { time: 1231, power: 192 },
    { time: 60*68+6, power: 174 },
    { time: 120*60+24*60+13, power: 165 },
  ]

  const magnusMMPData: MMPDataPoint[] = [
    { time: 181, power: 457+20 },
    { time: 720, power: 408 },
    { time: 60*39+49, power: 383 },
  ]

  const datasets = {
    defaultMMPData: defaultMMPData,
    henryMMPDataA: henryMMPDataA,
    henryMMPDataB: henryMMPDataB,
    henryMMPDataC: henryMMPDataC,
    tedMMPData: tedMMPData,
    asyaMMPData: asyaMMPData,
    magnusMMPData: magnusMMPData,
  }

  const [mmpData, setMMPData] = useState<MMPDataPoint[]>(datasets.asyaMMPData);
  //const mmpData: MMPDataPoint[] = datasets.asyaMMPData;
  //console.log("PTApp|mmpData", mmpData);

  const initialParamsDefault: PTSolution = {
    FRC : 5000,
    Pmax : 600,
    FTP : 200,
    tau2 : 12.8,
    TTE: 420,
    a : 16.9,
  };

  const initialParams = initialParamsDefault;
  //console.log("PTApp|initialParams",initialParams);

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">2-Point CP Calculation Comparison</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <PTSideBar mmpData={mmpData} setMMPData={setMMPData} />
        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow w-full">

          <div>
            <ParentSize>{({ width }) =>
              <DistanceScenarios
                width={width}
                height={250}
              />
            }</ParentSize>
          </div>

          <div>
            <ParentSize>{({ width }) =>
              <PTEstimation
                width={width}
                height={500}
                mmpData={mmpData}
                initialParams={initialParams}
              />
            }</ParentSize>
          </div>


        </div>

      </div>
    </main>
  );
}

export default PTApp
