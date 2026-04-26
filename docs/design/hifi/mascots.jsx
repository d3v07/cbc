// Mean It hi-fi — mascot system. Hand-drawn ink-line, 6 emotional states.
// Three built-in mascots: Wren (documentarian), Pip (poet), Cassio (songwriter).
// All emotions for all mascots. Decoupled from guides so any pairing works.

// Each mascot is a function(emotion) → JSX <svg>.
// 6 emotions: listening | curious | moved | sad | hopeful | silence
// Single ink-line aesthetic. Eyes + mouth shift; body silhouette stays.

const STROKE = 'var(--t-ink)';

const ink = (extra={}) => ({
  fill: 'none',
  stroke: STROKE,
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...extra,
});

// shared eye + mouth library — composed onto each silhouette
function Eyes({ emotion, x1=26, x2=42, y=30, scale=1 }) {
  const s = ink({ strokeWidth: 1.4 });
  // listening — small dots, attentive
  if (emotion === 'listening') return (
    <g>
      <circle cx={x1} cy={y} r={1.4} fill={STROKE}/>
      <circle cx={x2} cy={y} r={1.4} fill={STROKE}/>
    </g>
  );
  // curious — one slightly raised arch, small dots
  if (emotion === 'curious') return (
    <g>
      <path d={`M ${x1-3} ${y-3} q 3 -2 6 0`} {...s}/>
      <circle cx={x1} cy={y} r={1.4} fill={STROKE}/>
      <circle cx={x2} cy={y} r={1.4} fill={STROKE}/>
    </g>
  );
  // moved — soft closed-arc eyes (touched)
  if (emotion === 'moved') return (
    <g>
      <path d={`M ${x1-3} ${y} q 3 2 6 0`} {...s}/>
      <path d={`M ${x2-3} ${y} q 3 2 6 0`} {...s}/>
    </g>
  );
  // sad — downturned arcs, small tear hint
  if (emotion === 'sad') return (
    <g>
      <path d={`M ${x1-3} ${y+2} q 3 -3 6 0`} {...s}/>
      <path d={`M ${x2-3} ${y+2} q 3 -3 6 0`} {...s}/>
      <path d={`M ${x2+1} ${y+4} q 1 4 0 6`} {...ink({stroke:'var(--t-accent)', strokeWidth:1})}/>
    </g>
  );
  // hopeful — looking up
  if (emotion === 'hopeful') return (
    <g>
      <circle cx={x1+1} cy={y-1.5} r={1.4} fill={STROKE}/>
      <circle cx={x2+1} cy={y-1.5} r={1.4} fill={STROKE}/>
    </g>
  );
  // silence — closed, calm horizontal lines
  if (emotion === 'silence') return (
    <g>
      <path d={`M ${x1-3} ${y} h 6`} {...s}/>
      <path d={`M ${x2-3} ${y} h 6`} {...s}/>
    </g>
  );
  return null;
}

function Mouth({ emotion, cx=34, cy=40 }) {
  const s = ink();
  if (emotion === 'listening') return <path d={`M ${cx-3} ${cy} h 6`} {...s}/>;
  if (emotion === 'curious')   return <path d={`M ${cx-3} ${cy-1} q 3 3 6 0`} {...s}/>;
  if (emotion === 'moved')     return <path d={`M ${cx-3} ${cy-1} q 3 2 6 -1`} {...s}/>;
  if (emotion === 'sad')       return <path d={`M ${cx-4} ${cy+1} q 4 -3 8 0`} {...s}/>;
  if (emotion === 'hopeful')   return <path d={`M ${cx-3} ${cy-1} q 3 4 6 0`} {...s}/>;
  if (emotion === 'silence')   return <path d={`M ${cx-2} ${cy} h 4`} {...ink({strokeWidth:1.2})}/>;
  return null;
}

// ── Wren — feathered creature (documentarian)
function Wren({ emotion = 'listening', size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" className="anim-mascot">
      {/* body — single brushy stroke */}
      <path d="M 12 50 Q 8 32, 22 18 Q 38 8, 54 22 Q 60 36, 50 50 Q 48 56, 40 56 Q 22 58, 12 50 Z" {...ink({strokeWidth:1.6})}/>
      {/* feather strokes */}
      <path d="M 18 46 Q 26 40, 34 46" {...ink({strokeWidth:0.9})} opacity="0.55"/>
      <path d="M 22 50 Q 30 46, 40 50" {...ink({strokeWidth:0.9})} opacity="0.5"/>
      {/* beak */}
      <path d="M 50 28 l 6 2 l -5 3 z" {...ink({strokeWidth:1.2})} fill="var(--t-paper)"/>
      <Eyes emotion={emotion} x1={28} x2={42} y={28}/>
      <Mouth emotion={emotion} cx={36} cy={38}/>
    </svg>
  );
}

// ── Pip — round petal-bodied creature (poet of small things)
function Pip({ emotion = 'curious', size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" className="anim-mascot">
      {/* leaf-y petals around */}
      <path d="M 14 30 q -6 -10 4 -16 q 8 -3 12 6" {...ink({strokeWidth:1})} opacity="0.55"/>
      <path d="M 54 30 q 6 -10 -4 -16 q -8 -3 -12 6" {...ink({strokeWidth:1})} opacity="0.55"/>
      {/* round body */}
      <path d="M 16 36 Q 16 18, 34 16 Q 52 18, 52 36 Q 52 54, 34 56 Q 16 54, 16 36 Z" {...ink({strokeWidth:1.6})}/>
      {/* small stem */}
      <path d="M 34 16 q 0 -4 3 -6" {...ink({strokeWidth:1})}/>
      <Eyes emotion={emotion} x1={28} x2={42} y={32}/>
      <Mouth emotion={emotion} cx={34} cy={42}/>
    </svg>
  );
}

// ── Cassio — long-form crescent (songwriter, late-night)
function Cassio({ emotion = 'moved', size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" className="anim-mascot">
      {/* crescent body */}
      <path d="M 50 14 q -28 4 -28 22 q 0 18 28 22 q -16 -8 -16 -22 q 0 -14 16 -22 z" {...ink({strokeWidth:1.6})}/>
      {/* small scribble — like a melody */}
      <path d="M 16 56 q 4 -3 8 0 t 8 0" {...ink({strokeWidth:0.9})} opacity="0.5"/>
      <Eyes emotion={emotion} x1={30} x2={42} y={32}/>
      <Mouth emotion={emotion} cx={36} cy={42}/>
    </svg>
  );
}

const MASCOTS = {
  wren:   { name: 'Wren',   guide: 'The Documentarian',     comp: Wren,   theme: 'quiet' },
  pip:    { name: 'Pip',    guide: 'The Poet of Small Things', comp: Pip,  theme: 'warm' },
  cassio: { name: 'Cassio', guide: 'The Songwriter',         comp: Cassio, theme: 'noir' },
};

const EMOTIONS = ['listening', 'curious', 'moved', 'sad', 'hopeful', 'silence'];

function MascotView({ id = 'wren', emotion = 'listening', size = 96 }) {
  const M = MASCOTS[id]?.comp;
  if (!M) return null;
  return <M emotion={emotion} size={size}/>;
}

Object.assign(window, { MASCOTS, EMOTIONS, MascotView, Wren, Pip, Cassio });
