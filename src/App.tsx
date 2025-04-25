import { useState } from 'react'
// import './App.css'
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import LinearThreshold from "./components/LinearThreshold.tsx";
import CPThreshold from "./components/CPThreshold.tsx";
import SideBar from "./components/SideBar.tsx";

// import Graphs from "./components/Graphs.tsx";

function App() {

  const [linearData, setLinearData] = useState({
    testOneShortTime: 180,
    testOneShortWatt: 316,
    testOneLongTime : 600,
    testOneLongWatt : 286,
    testTwoShortTime: 180,
    testTwoShortWatt: 341,
    testTwoLongTime : 600,
    testTwoLongWatt : 287,
  });

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-3xl text-neutral-50">2-Point CP Calculation Comparison</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <SideBar linearData={linearData} setLinearData={setLinearData}/>

        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow  ">
          <div>
            <ParentSize>{({ width }) =>
              <LinearThreshold width={width} height={300} data={linearData}/>
            }</ParentSize>
          </div>
          <div>
            <ParentSize>{({ width }) =>
              <CPThreshold width={width} height={500} data={linearData}/>
            }</ParentSize>
          </div>
        </div>

      </div>
    </main>
  );
}

export default App
