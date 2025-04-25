import { createRoot } from 'react-dom/client';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import './sandbox-styles.css';
import LinearThreshold from "./components/LinearThreshold.tsx";

const root = createRoot(document.getElementById('root')!);

root.render(
  <ParentSize>{({ width, height }) => <LinearThreshold width={width} height={height} />}</ParentSize>,
);
