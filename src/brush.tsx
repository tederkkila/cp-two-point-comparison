import React from 'react';
import { createRoot } from 'react-dom/client';
import ParentSize from '@visx/responsive/lib/components/ParentSize';

import './sandbox-styles.css';
import BrushChartExample from "./components/BrushChartExample.tsx";

const root = createRoot(document.getElementById('root')!);

root.render(
  <ParentSize>{({ width, height }) => <BrushChartExample width={width} height={height} />}</ParentSize>,
);