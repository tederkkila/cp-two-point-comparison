import { createRoot } from 'react-dom/client';
import { ParentSize } from "@visx/responsive";
import './sandbox-styles.css';
import ThresholdExample from './components/ThresholdExample'

const root = createRoot(document.getElementById('root')!);

root.render(
  <ParentSize>{({ width, height }) => <ThresholdExample width={width} height={height} />}</ParentSize>,
);
