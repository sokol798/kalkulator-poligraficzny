/** Ikony liniowe z makiet (react-native-svg). Kolor przez `color`. */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface P {
  size?: number;
  color: string;
}

export const CalculatorIcon = ({ size = 18, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Rect x={3} y={2} width={12} height={14} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
    <Path d="M6 6h6M6 9.5h2M10 9.5h2M6 13h2M10 13h2" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const LibraryIcon = ({ size = 18, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Rect x={2.5} y={2.5} width={13} height={13} rx={1.5} fill="none" stroke={color} strokeWidth={1.5} />
    <Path d="M2.5 9h13M9 2.5v13" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const HistoryIcon = ({ size = 18, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Circle cx={9} cy={9} r={6.5} fill="none" stroke={color} strokeWidth={1.5} />
    <Path d="M9 5v4l3 2" fill="none" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const GearIcon = ({ size = 20, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={1.8} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export const ChevronDown = ({ size = 10, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 10 10">
    <Path d="M1 3l4 4 4-4" fill="none" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const ChevronRight = ({ size = 14, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 14 14">
    <Path d="M5 2l5 5-5 5" fill="none" stroke={color} strokeWidth={1.6} />
  </Svg>
);
export const BackIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M10 2L4 8l6 6" fill="none" stroke={color} strokeWidth={1.6} />
  </Svg>
);
export const CloseIcon = ({ size = 14, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 14 14">
    <Path d="M2 2l10 10M12 2L2 12" stroke={color} strokeWidth={1.6} />
  </Svg>
);
export const PlusIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M8 2v12M2 8h12" stroke={color} strokeWidth={1.8} />
  </Svg>
);
export const BookmarkIcon = ({ size = 16, color, filled }: P & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M3 2h10v12l-5-3-5 3z" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const SearchIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Circle cx={7} cy={7} r={5} fill="none" stroke={color} strokeWidth={1.5} />
    <Path d="M11 11l3.5 3.5" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const DownloadIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M8 2v9M4 7l4 4 4-4M2 13h12" fill="none" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const ShareIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M8 10V2M4.5 5.5L8 2l3.5 3.5M3 9v5h10V9" fill="none" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const TrashIcon = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M3 4h10M6 4V2.5h4V4M4.5 4l.7 9.5h5.6L11.5 4M7 7v4M9 7v4" fill="none" stroke={color} strokeWidth={1.4} />
  </Svg>
);
export const StarIcon = ({ size = 14, color, filled }: P & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M8 1.5l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.7l-4.2 2.4 1-4.6L1.3 6.3 6 5.8z" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
  </Svg>
);
