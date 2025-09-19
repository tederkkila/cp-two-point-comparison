import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PTApp from './PTApp.tsx'
import AutoCPApp from './AutoCPApp.tsx'
import AutoCPPlusApp from './AutoCPPlusApp.tsx'
import AutoCPGCApp from './AutoCPGCApp.tsx'
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/strydinstructions",
    element: <StrydInstructions />,
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

console.log("creating Root")

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} future={{
        v7_startTransition: true,
      }}/>
  </StrictMode>,
)
