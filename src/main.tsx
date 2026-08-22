import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import InverseOfTime from './InverseOfTime.tsx'
import PTApp from './PTApp'
import AutoCPApp from './AutoCPApp.tsx'
import AutoCPPlusApp from './AutoCPPlusApp.tsx'
import AutoCPGCApp from './AutoCPGCApp'
import ExtendedApp from './ExtendedApp.tsx'
import FITApp from './FITApp.tsx'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import AutoCPComponentsApp from "./AutoCPComponentsApp.tsx";
import AutoCPFindTimeIntervalsApp from "./AutoCPFindTimeIntervalsApp.tsx";
import StrydAutoCPApp from "./StrydAutoCPApp.tsx";
import StrydInstructions from "./StrydInstructions.tsx";
import StrydExplainer from "./StrydExplainer.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/inverse/:testTwoShortTime/:testTwoShortWatt/:testTwoLongTime/:testTwoLongWatt",
    element: <InverseOfTime />,
  },
  {
    path: "/inverse/:testTwoShortTime/:testTwoShortWatt/:testTwoLongTime/:testTwoLongWatt/:testOneShortTime/:testOneShortWatt/:testOneLongTime/:testOneLongWatt",
    element: <InverseOfTime />,
  },
  {
    path: "/inverse",
    element: <InverseOfTime />,
  },
  {
    path: "/strydinstructions",
    element: <StrydInstructions />,
  },
  {
    path: "/strydexplainer",
    element: <StrydExplainer />,
  },
  {
    path: "/pt",
    element: <PTApp />,
  },
  {
    path: "/autoCPPlus",
    element: <AutoCPPlusApp />,
  },
  {
    path: "/autoCPGC",
    element: <AutoCPGCApp />,
  },
  {
    path: "/autoCPComponents",
    element: <AutoCPComponentsApp />,
  },
  {
    path: "/autoCPFindTimeIntervals",
    element: <AutoCPFindTimeIntervalsApp />,
  },
  {
    path: "/autoCP",
    element: <AutoCPApp />,
  },
  {
    path: "/extended",
    element: <ExtendedApp />,
  },
  {
    path: "/fit",
    element: <FITApp />,
  },
  {
    path: "/StrydAutoCP",
    element: <StrydAutoCPApp />,
  },
  {
    path: "/:testTwoShortTime/:testTwoShortWatt/:testTwoLongTime/:testTwoLongWatt",
    element: <App />,
  },
  {
    path: "/:testTwoShortTime/:testTwoShortWatt/:testTwoLongTime/:testTwoLongWatt/:testOneShortTime/:testOneShortWatt/:testOneLongTime/:testOneLongWatt",
    element: <App />,
  },
  // {
  //   path: "*",
  //   element: <App />,
  // },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

//console.log("creating Root")

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} future={{
        v7_startTransition: true,
      }}/>
  </StrictMode>,
)
