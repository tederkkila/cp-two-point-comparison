import { useState } from 'react';
import JsonFileLoader from './components/JsonFileLoader.tsx'
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import AutoCPComponents from "./components/AutoCPComponents.tsx";
import { ExtendedSolution, MMPDataPoint, StrydPDC } from "./types/interfaces.ts";
import AutoCPGC from "./components/AutoCPGC.tsx";
import StrydAutoCPSideBar from "./components/StrydAutoCPSidebar.tsx";

const initialParamsDefault: ExtendedSolution = {
  cp      : 300,
  cpdec   : -0.1,
  cpdecdel: -180,
  cpdel   : -0.9,
  paa     : 300,
  paadec  : -5,
  tau     : 0.4,
  taudel  : -4.8,
};

const initialMMPData: MMPDataPoint[] = [
  { time: 10, power: 0,},
  { time: 20, power: 0,},
  { time: 60*3, power: 0,},
  { time: 60*12, power: 0,},
  { time: 60*60, power: 0},
];

const initialParams = initialParamsDefault;

const updateMMPDataFromFile  = (
  pdc: StrydPDC,
  currentMMPData: MMPDataPoint[],
) : MMPDataPoint[] => {

  return currentMMPData.map (mmpData => ({
    ...mmpData,
      power: Math.round(pdc.curve.power_list[mmpData.time -1]),
  }));
}

function StrydAutoCPApp() {

  const [mmpData, setMMPData] = useState<MMPDataPoint[]>(initialMMPData);
  const [receivedPDC, setReceivedPDC] = useState<StrydPDC | null>(null);

  const handleFileFromChild = (data: JSON) => {
    console.log('Received JSON data from child:', data);
    //absolutely NOT validated conversion of jsonData to object
    const jsonString = JSON.stringify(data);
    const parsedPDC: StrydPDC = JSON.parse(jsonString);

    const updatedMMPData = updateMMPDataFromFile(parsedPDC, initialMMPData)
    // console.log(updatedMMPData);
    setMMPData(updatedMMPData);

    setReceivedPDC(parsedPDC);
  };

  const handleResetClick = () => {
    if (receivedPDC) {
      const updatedMMPData = updateMMPDataFromFile(receivedPDC, initialMMPData)
      // console.log(updatedMMPData);
      setMMPData(updatedMMPData);
    }
  }

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">Stryd AutoCP Model Viewer</h1>
      </div>
      <div className="flex shrink-0 items-end rounded-lg bg-gray-50 p-4">
        <JsonFileLoader onDataSubmit={handleFileFromChild}/>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">

        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 min-w-min">
          {receivedPDC ? (
            <StrydAutoCPSideBar mmpData={mmpData} setMMPData={setMMPData} />

          ) : (
            <div></div>
          )}

          {receivedPDC ? (
          <button
            onClick={handleResetClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c93c5',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              // Add more styling as needed
            }}
          >Reset</button>
          ) : (
            <div></div>
          )}



        </div>

        <div className="flex gap-2 flex-col grow w-full">



          <div>
            {receivedPDC ? (
              <ParentSize>{({ width }) =>
                <div>{width ? (
                  <AutoCPGC
                    width={width}
                    height={400}
                    pdc={receivedPDC}
                    initialParams={initialParams}
                    forecastData={mmpData}
                    verbose={false}
                  />
                ) : (<div>Calculating Extended Parameters from User Data...</div>) }
                </div>
              }</ParentSize>
            ) : (<div></div>
            )}
          </div>

          <div>
            {receivedPDC ? (
              <ParentSize>{({ width }) =>
                <div>{width ? (
                  <AutoCPComponents
                    width={width}
                    height={400}
                    pdc={receivedPDC}
                    initialParams={initialParams}
                    verbose={false}
                  />
                ) : (<div>Fitting Extended Parameters from Stryd Curves...</div>) }
                </div>
              }</ParentSize>
            ) : (
              <div>(Please select a file)</div>
            )}
          </div>



        </div>

      </div>
    </main>
  )
}

export default StrydAutoCPApp;