import React from 'react';
import { createRoot } from 'react-dom/client';
import { ParentSize } from "@visx/responsive";

import './sandbox-styles.css';
import BrushChartExample from "./components/BrushChartExample";

const root = createRoot(document.getElementById('root')!);

root.render(
  <ParentSize>
      {({ width, height }) =>
        <BrushChartExample width={width} height={height} />
      }
  </ParentSize>,
);