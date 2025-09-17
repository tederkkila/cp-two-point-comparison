import { useState, useEffect } from "react";
import AutoCPPlus from "./components/AutoCPPlus.tsx";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { ExtendedSolution } from "./types/interfaces.ts"

const initialParamsDefault: ExtendedSolution = {
  cp      : 300,
  cpdec   : -1,
  cpdecdel: -180,
  cpdel   : -0.9,
  paa     : 300,
  paadec  : -0.9,
  tau     : 0.6,
  taudel  : -4.8,
};

// const initialParamsPerfect: ExtendedSolution = {
//   cp      : 285.65,
//   cpdec   : -1.45,
//   cpdecdel: -175,
//   cpdel   : -0.9,
//   paa     : 516.3,
//   paadec  : -1.064,
//   tau     : 0.505,
//   taudel  : -4.8,
// }

const initialParams = initialParamsDefault;

function AutoCPApp() {

  const [jsonData, setJsonData] = useState(null);

  useEffect(() => {
    // fetch('/fit/pdc_ted_june16th_untouched.json')
    // fetch('/fit/pdc_ted_june16th_400w_3min.json')
    // fetch('/fit/pdc_ted_june25th_untouched.json')
      // fetch('/fit/pdc_ted_june25th_350w_3min.json')
      // fetch('/fit/pdc_ted_june25th_400w_3min.json')
      // fetch('/fit/pdc_ted_july29_untouched.json')
      // fetch('/fit/pdc_ted_aug02_untouched.json')
      // fetch('/fit/pdc_ted_aug02_350W.json')
      // fetch('/fit/pdc_ted_aug02_400W.json')
      // fetch('/fit/pdc_ted_aug14_untouched.json')
      // fetch('/fit/pdc_ted_aug26_untouched.json')
      // fetch('/fit/pdc_ted_aug28_untouched.json')
    // fetch('/fit/pdc_masahiro_sep09.json')
      fetch('/fit/pdc_ted_sep09_untouched.json')

      .then(response => response.json())
      .then(data => setJsonData(data))
      .catch(error => console.error('Error fetching JSON:', error));
  }, []);

  const [extendedSolution, setExtendedSolution] = useState<ExtendedSolution | null>(null);
  console.log("extendedSolution", extendedSolution);

  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">Stryd AutoCP Model Viewer</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          {/*TODO add sidebar*/}
        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow w-full">

          <div>
            {jsonData ? (
            <ParentSize>{({ width }) =>
              <AutoCPPlus
                width={width}
                height={500}
                jsonData={jsonData}
                initialParams={initialParams}
                setExtendedSolution={setExtendedSolution}
              />
            }</ParentSize>
            ) : (
              <div>Waiting for Data...</div>
            )}
          </div>


        </div>

      </div>
    </main>
  )
}

export default AutoCPApp