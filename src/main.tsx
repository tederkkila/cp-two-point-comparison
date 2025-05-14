import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PTApp from './PTApp.tsx'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/pt",
    element: <PTApp />,
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
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
