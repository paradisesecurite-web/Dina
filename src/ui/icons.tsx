import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';

// Jeu d'icônes dessinées pour l'application (traits fins, coins arrondis).
export type IconName =
  | 'meteo' | 'actu_france' | 'actu_monde' | 'libre' | 'veille' | 'sport' | 'crypto' | 'bourse' | 'musique' | 'cine'
  | 'evenements' | 'trafic' | 'carburant' | 'air' | 'marees' | 'saint' | 'histoire' | 'citation' | 'horoscope' | 'mot'
  | 'bonne_nouvelle' | 'bienetre' | 'settings' | 'play' | 'pause' | 'next' | 'prev' | 'stop' | 'mic' | 'keyboard'
  | 'close' | 'check' | 'plus' | 'star' | 'starFill' | 'up' | 'down' | 'thumbUp' | 'thumbDown' | 'external' | 'refresh'
  | 'sparkle' | 'chevron' | 'pin' | 'bell' | 'user' | 'palette' | 'voice' | 'clock' | 'shield' | 'trash' | 'send';

export function Icon({ name, size = 22, color = '#000', strokeWidth = 1.8, fill }: { name: IconName | string; size?: number; color?: string; strokeWidth?: number; fill?: string }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const f = { fill: fill ?? color, stroke: 'none' };
  const n = name.startsWith('veille:') ? 'veille' : name;
  let c: React.ReactNode;
  switch (n) {
    case 'meteo': c = <><Circle cx={9} cy={8.5} r={3.2} {...p} /><Path d="M9 2.5v1.2M3 8.5h1.2M4.8 4.3l.9.9M13.2 4.3l-.9.9" {...p} /><Path d="M8 20h9.2a3.6 3.6 0 0 0 .2-7.2 5 5 0 0 0-9.5 1.4A2.9 2.9 0 0 0 8 20z" {...p} /></>; break;
    case 'actu_france': c = <><Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5V19a1 1 0 0 0 2 0V9h1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...p} /><Path d="M7 8h7M7 11.5h7M7 15h4" {...p} /></>; break;
    case 'actu_monde': c = <><Circle cx={12} cy={12} r={9} {...p} /><Ellipse cx={12} cy={12} rx={3.8} ry={9} {...p} /><Path d="M3.5 9h17M3.5 15h17" {...p} /></>; break;
    case 'libre': case 'veille': c = <><Circle cx={10.5} cy={10.5} r={6} {...p} /><Path d="M15 15l5.5 5.5" {...p} /><Path d="M10.5 7.8v5.4M7.8 10.5h5.4" {...p} /></>; break;
    case 'sport': c = <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4z" {...p} /><Path d="M12 3v4.6M15.4 10.1l4.8-1.6M14.1 14.1l2.9 4M9.9 14.1l-2.9 4M8.6 10.1L3.8 8.5" {...p} /></>; break;
    case 'crypto': c = <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M9.5 7.5h3.7a2 2 0 0 1 0 4H9.5h4.2a2.1 2.1 0 0 1 0 4.2H9.5zM10.8 6v1.5M10.8 15.7v1.8M12.8 6v1.5M12.8 15.7v1.8" {...p} /></>; break;
    case 'bourse': c = <><Polyline points="3,17 9,11 13,14.5 20.5,7" {...p} /><Path d="M15 7h5.5v5.5" {...p} /><Path d="M3 21h18" {...p} /></>; break;
    case 'musique': c = <><Path d="M9 18V6l11-2.2v12" {...p} /><Circle cx={6.5} cy={18} r={2.5} {...p} /><Circle cx={17.5} cy={15.8} r={2.5} {...p} /></>; break;
    case 'cine': c = <><Rect x={3} y={9} width={18} height={11} rx={2} {...p} /><Path d="M3.4 9L19.5 4.6l.9 3.3M8 7.6l2-3M13.5 6.1l2-3" {...p} /></>; break;
    case 'evenements': c = <><Path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z" {...p} /><Path d="M14 6.5v1.5M14 11v2M14 16v1.5" {...p} /></>; break;
    case 'trafic': c = <><Path d="M4.5 16.5v-4l2.2-5.2A1.5 1.5 0 0 1 8.1 6.4h7.8a1.5 1.5 0 0 1 1.4.9l2.2 5.2v4z" {...p} /><Path d="M4.5 12.5h15" {...p} /><Circle cx={8} cy={17} r={1.7} {...p} /><Circle cx={16} cy={17} r={1.7} {...p} /></>; break;
    case 'carburant': c = <><Rect x={4} y={4} width={10} height={16.5} rx={1.6} {...p} /><Path d="M6.5 8h5M14 9.5h2.2a1.3 1.3 0 0 1 1.3 1.3v5.7a1.5 1.5 0 0 0 3 0V8.2L18.3 6" {...p} /></>; break;
    case 'air': case 'bienetre': c = <><Path d="M5 19.5C5 11 10.8 5 20 4.5 19.7 13.4 13.6 19.4 5 19.5z" {...p} /><Path d="M5 19.5l8.2-8.2" {...p} /></>; break;
    case 'marees': c = <><Path d="M3 8c2 0 2-1.8 4.5-1.8S10 8 12 8s2.2-1.8 4.5-1.8S19 8 21 8M3 13c2 0 2-1.8 4.5-1.8S10 13 12 13s2.2-1.8 4.5-1.8S19 13 21 13M3 18c2 0 2-1.8 4.5-1.8S10 18 12 18s2.2-1.8 4.5-1.8S19 18 21 18" {...p} /></>; break;
    case 'saint': c = <><Rect x={9} y={10.5} width={6} height={10} rx={1.2} {...p} /><Path d="M12 3.2c1.4 1.8 2.1 3 2.1 4.2a2.1 2.1 0 0 1-4.2 0c0-1.2.7-2.4 2.1-4.2z" {...p} /></>; break;
    case 'histoire': c = <><Path d="M7 3h10M7 21h10M8 3c0 5.2 8 4.6 8 9s-8 3.8-8 9M16 3c0 5.2-8 4.6-8 9s8 3.8 8 9" {...p} /></>; break;
    case 'citation': c = <><Path d="M5 17.5c2.3-.6 3.6-2.6 3.6-5.5H5V7h4.6v5c0 3.6-1.8 5.6-4.6 5.5zM14 17.5c2.3-.6 3.6-2.6 3.6-5.5H14V7h4.6v5c0 3.6-1.8 5.6-4.6 5.5z" {...p} /></>; break;
    case 'horoscope': case 'sparkle': c = <><Path d="M12 3l1.9 6.6L20.5 12l-6.6 1.9L12 20.5l-1.9-6.6L3.5 12l6.6-2.4z" {...p} /></>; break;
    case 'mot': c = <><Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16h0A1.5 1.5 0 0 1 4 14.5z" {...p} /><Path d="M8 9.5h8M8 12.5h5" {...p} /></>; break;
    case 'bonne_nouvelle': c = <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" {...p} /><Circle cx={9} cy={10} r={0.9} {...f} /><Circle cx={15} cy={10} r={0.9} {...f} /></>; break;
    case 'settings': c = <><Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...p} /><Circle cx={15} cy={7} r={2.2} {...p} /><Circle cx={9} cy={17} r={2.2} {...p} /></>; break;
    case 'play': c = <Path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" {...f} />; break;
    case 'pause': c = <><Rect x={6.5} y={5} width={4} height={14} rx={1.2} {...f} /><Rect x={13.5} y={5} width={4} height={14} rx={1.2} {...f} /></>; break;
    case 'next': c = <><Path d="M5 6.2v11.6a.8.8 0 0 0 1.2.7l9-5.8a.8.8 0 0 0 0-1.4l-9-5.8A.8.8 0 0 0 5 6.2z" {...f} /><Rect x={17} y={5.5} width={2.6} height={13} rx={1} {...f} /></>; break;
    case 'prev': c = <><Path d="M19 6.2v11.6a.8.8 0 0 1-1.2.7l-9-5.8a.8.8 0 0 1 0-1.4l9-5.8a.8.8 0 0 1 1.2.7z" {...f} /><Rect x={4.4} y={5.5} width={2.6} height={13} rx={1} {...f} /></>; break;
    case 'stop': c = <Rect x={6} y={6} width={12} height={12} rx={2} {...f} />; break;
    case 'mic': c = <><Rect x={9} y={3} width={6} height={11.5} rx={3} {...p} /><Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" {...p} /></>; break;
    case 'keyboard': c = <><Rect x={3} y={6} width={18} height={12} rx={2} {...p} /><Path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" {...p} /></>; break;
    case 'close': c = <Path d="M6 6l12 12M18 6L6 18" {...p} />; break;
    case 'check': c = <Polyline points="5,12.5 10,17 19,7.5" {...p} />; break;
    case 'plus': c = <Path d="M12 5v14M5 12h14" {...p} />; break;
    case 'star': c = <Path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" {...p} />; break;
    case 'starFill': c = <Path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" {...p} fill={color} />; break;
    case 'up': c = <Polyline points="6,15 12,9 18,15" {...p} />; break;
    case 'down': c = <Polyline points="6,9 12,15 18,9" {...p} />; break;
    case 'chevron': c = <Polyline points="9,6 15,12 9,18" {...p} />; break;
    case 'thumbUp': c = <><Path d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11zM7 11l3.6-6.6c1.5 0 2.6 1.1 2.3 2.6L12.4 10h5.9a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 17.1 20H7" {...p} /></>; break;
    case 'thumbDown': c = <><Path d="M17 13V4h2.5A1.5 1.5 0 0 1 21 5.5v6a1.5 1.5 0 0 1-1.5 1.5zM17 13l-3.6 6.6c-1.5 0-2.6-1.1-2.3-2.6l.5-3H5.7a2 2 0 0 1-2-2.4l1.2-6A2 2 0 0 1 6.9 4H17" {...p} /></>; break;
    case 'external': c = <><Path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" {...p} /></>; break;
    case 'refresh': c = <><Path d="M20 11.5a8 8 0 1 1-2.4-5.7L20 8M20 3.5V8h-4.5" {...p} /></>; break;
    case 'pin': c = <><Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" {...p} /><Circle cx={12} cy={10} r={2.4} {...p} /></>; break;
    case 'bell': c = <><Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 0 0 4 0" {...p} /></>; break;
    case 'user': c = <><Circle cx={12} cy={8} r={4} {...p} /><Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" {...p} /></>; break;
    case 'palette': c = <><Path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-2-.5-1.4.5-2.6 1.9-2.6H17a4 4 0 0 0 4-4C21 7 17 3 12 3z" {...p} /><Circle cx={7.5} cy={11} r={1.1} {...f} /><Circle cx={10} cy={7} r={1.1} {...f} /><Circle cx={15} cy={7.5} r={1.1} {...f} /></>; break;
    case 'voice': c = <><Path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" {...p} /></>; break;
    case 'clock': c = <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7v5l3.2 2" {...p} /></>; break;
    case 'shield': c = <><Path d="M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z" {...p} /><Polyline points="8.8,12 11.2,14.4 15.5,9.8" {...p} /></>; break;
    case 'trash': c = <><Path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" {...p} /></>; break;
    case 'send': c = <><Path d="M4 12l16-8-6 16-2.6-6.4z" {...p} /></>; break;
    default: c = <Circle cx={12} cy={12} r={8} {...p} />;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24">{c}</Svg>;
}
