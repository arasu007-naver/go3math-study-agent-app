import Svg, { Path, Rect } from 'react-native-svg';

// Study Log(채팅) 아이콘 — assets/images/study-log.svg를 옮겨 그린 것(SVG import 변환기가 없어 PencilFab처럼 직접 그린다).
// 선 색만 color로 바꾼다(탭 활성/비활성 색).
export function StudyLogIcon({ size, color }: { size: number; color: string }) {
  const line = { stroke: color, strokeWidth: 0.9, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.75} y={2.75} width={18.5} height={18.5} rx={0.93} {...line} />
      <Path
        d="M18.5 2.75V5.18H17.39C16.76 5.18 16.25 5.69 16.25 6.33C16.25 6.97 16.76 7.47 17.39 7.47H18.5V10.94H17.39C16.76 10.94 16.25 11.45 16.25 12.08C16.25 12.71 16.76 13.23 17.39 13.23H18.5V16.56H17.51C16.88 16.56 16.37 17.07 16.37 17.70C16.37 18.33 16.88 18.84 17.51 18.84H18.5V21.25"
        {...line}
      />
      <Path d="M5.5 6.75H12" {...line} />
      <Path d="M5.5 12.24H14.5" {...line} />
      <Path d="M5.5 17.73H14.5" {...line} />
    </Svg>
  );
}
