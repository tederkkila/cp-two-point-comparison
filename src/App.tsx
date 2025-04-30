//TODO add parameters to url for linking
//TODO update colors for red.green color blindness

import { useState } from 'react'
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import LinearThreshold from "./components/LinearThreshold.tsx";
import CPThreshold from "./components/CPThreshold.tsx";
import SideBar from "./components/SideBar.tsx";


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

function App() {

  //console.log("running app")

  const defaultLinearData:LinearGraphData = {
    testOneShortTime: 180,
    testOneShortWatt: 316,
    testOneLongTime : 600,
    testOneLongWatt : 286,
    testTwoShortTime: 180,
    testTwoShortWatt: 341,
    testTwoLongTime : 600,
    testTwoLongWatt : 287,
  }

  const [linearData, setLinearData] = useState<LinearGraphData>(defaultLinearData);
  const [expandZones, setExpandZones] = useState<boolean>(false);

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">2-Point CP Calculation Comparison</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <SideBar
            linearData={linearData}
            setLinearData={setLinearData}
            expandZones={expandZones}
            setExpandZones={setExpandZones}
          />

        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow">
          <div>
            <ParentSize>{({ width }) =>
              <LinearThreshold width={width} height={250} data={linearData}/>
            }</ParentSize>
          </div>
          <div>
            <ParentSize>{({ width }) =>
              <CPThreshold width={width} height={600} data={linearData} expandZones={expandZones}/>
            }</ParentSize>
          </div>
        </div>

      </div>
    </main>
  );
}

export default App
