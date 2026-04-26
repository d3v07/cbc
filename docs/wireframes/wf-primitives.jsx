// Mean It — shared wireframe primitives.

const Chrome = ({ step, total, byline = null, theme = 'warm' }) => (
  <div className="wf-chrome">
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <span className="wf-logo">Mean It<span style={{color:'var(--accent)'}}>.</span></span>
      {step != null && (
        <span style={{fontFamily:'var(--mono)', fontSize:9, opacity:0.5}}>
          step {step} / {total}
        </span>
      )}
    </div>
    <div style={{display:'flex', alignItems:'center', gap:14}}>
      {byline != null && (
        <div className="wf-byline" title="byline meter — % of words verified yours">
          <span className="wf-byline-dot"/>
          <span>{byline}% yours</span>
        </div>
      )}
      <span style={{fontFamily:'var(--mono)', fontSize:9, opacity:0.5}}>theme · {theme}</span>
    </div>
  </div>
);

// curved arrow with optional label
const Arrow = ({ d, label, style = {}, flip = false }) => (
  <div className="wf-annot" style={style}>
    {label && <div style={{marginBottom:2, transform: flip?'translateX(8px)':''}}>{label}</div>}
    <svg width="80" height="50" viewBox="0 0 80 50">
      <path d={d} className="arrow-stroke"/>
      <path d="M 0 0 L 8 4 L 4 8 Z" className="arrow-stroke" fill="var(--accent)"
            transform={`translate(${flip?72:8}, ${flip?42:38}) rotate(${flip?-30:200})`}/>
    </svg>
  </div>
);

// generic placeholder block
const Ph = ({ label, h = 60, style = {} }) => (
  <div className="wf-ph" style={{height: h, ...style}}>{label}</div>
);

// mascot/character — abstract blob with eyes (style varies)
const Mascot = ({ kind = 'blob', size = 64 }) => {
  const s = size;
  if (kind === 'blob') return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      <path d="M14 30 Q 10 14, 28 12 Q 50 10, 54 26 Q 58 46, 42 52 Q 22 58, 14 44 Z"
            fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5"/>
      <circle cx="26" cy="30" r="2" fill="var(--ink)"/>
      <circle cx="40" cy="30" r="2" fill="var(--ink)"/>
      <path d="M 28 38 Q 32 41, 36 38" stroke="var(--ink)" strokeWidth="1.25" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (kind === 'feather') return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      <path d="M 12 50 Q 30 14, 52 12 Q 50 36, 32 48 Q 22 54, 12 50 Z"
            fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5"/>
      <path d="M 14 49 L 48 16" stroke="var(--ink)" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
  if (kind === 'moon') return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      <path d="M 44 14 a 22 22 0 1 0 0 36 a 16 16 0 1 1 0 -36 z"
            fill="var(--ink)" stroke="var(--ink)" strokeWidth="1.5"/>
    </svg>
  );
  if (kind === 'mark') return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="22" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
      <text x="32" y="40" textAnchor="middle" fontFamily="serif"
            fontSize="22" fontStyle="italic" fill="var(--ink)">&ldquo;</text>
    </svg>
  );
  return null;
};

// small note card "Variation A — explanation"
const VariantNote = ({ label, children }) => (
  <div className="wf-note-card" style={{position:'absolute', top:-30, left:0, maxWidth:'92%'}}>
    <strong style={{color:'var(--accent)'}}>{label}</strong> — {children}
  </div>
);

Object.assign(window, { Chrome, Arrow, Ph, Mascot, VariantNote });
