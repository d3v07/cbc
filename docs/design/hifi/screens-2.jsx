// Mean It hi-fi — Spine, Drafting, Render screens.

// ─────────── SPINE + STRUCTURE ───────────

function Spine({ go, setEmotion }) {
  const [pick, setPick] = React.useState(0);
  React.useEffect(() => { setEmotion('moved'); }, []);

  return (
    <div className="stage">
      <div className="eyebrow">spine · the line everything else hangs from</div>
      <h1 className="h-display smaller" style={{ marginTop: 8, marginBottom: 8 }}>
        Three of your phrases.<br/>One of them is the heart.
      </h1>
      <div className="body-prose" style={{ maxWidth: 580, marginBottom: 28 }}>
        Every phrase below is your verbatim text. Pick the one this letter is built around.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {SCRIPT.spineCandidates.map((p, i) => (
          <button key={i} onClick={() => setPick(i)}
            className={'card ' + (pick === i ? 'selected' : 'outlined')}
            style={{ textAlign: 'left', cursor: 'pointer', padding: '20px 22px',
                     fontFamily: 'inherit', color: 'inherit', minHeight: 200,
                     display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">phrase 0{i+1}</div>
              <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1.3, marginTop: 10, color: 'var(--t-ink)' }}>
                "{p.t}"
              </div>
            </div>
            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 16 }}>
              {pick === i ? '● this is the spine' : 'from · ' + p.from}
            </div>
          </button>
        ))}
      </div>

      <div className="divider-flourish"/>

      <div className="eyebrow" style={{ marginBottom: 12 }}>structure the guide proposes — three movements</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {SCRIPT.structure.map((s, i) => (
          <div key={i} className="card outlined" style={{ padding: '18px 22px' }}>
            <div className="eyebrow" style={{ color: 'var(--t-accent)' }}>movement {i+1}</div>
            <div className="serif-italic" style={{ fontSize: 22, marginTop: 6, color: 'var(--t-ink)' }}>{s.label}</div>
            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 4 }}>{s.sub}</div>
            <div style={{
              marginTop: 16, padding: '14px 12px',
              border: '1px dashed var(--t-ink-faint)', borderRadius: 'var(--t-radius)',
              fontFamily: 'var(--t-mono)', fontSize: 10, color: 'var(--t-ink-faint)',
              textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>your words · go here</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
        <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11 }}>swap or drop any movement · this is yours</span>
        <button className="btn primary" onClick={go}>start writing →</button>
      </div>
    </div>
  );
}

// ─────────── DRAFTING (streaming critique, A) ───────────

function Drafting({ go, setEmotion }) {
  const [text, setText] = React.useState('');
  const [critiques, setCritiques] = React.useState([]);
  const target = SCRIPT.draft.map(d => d.text).join('\n');
  const [step, setStep] = React.useState(0);

  React.useEffect(() => { setEmotion('listening'); }, []);

  // simulate typing on mount
  React.useEffect(() => {
    if (step >= target.length) return;
    const t = setTimeout(() => {
      setText(target.slice(0, step + 1));
      setStep(step + 1);
      // mood beats while typing
      const ch = target[step];
      if (ch === '\n') {
        const lineIdx = target.slice(0, step).split('\n').length - 1;
        const line = SCRIPT.draft[lineIdx];
        if (line) {
          if (line.flag === 'cliche') {
            setEmotion('sad');
            setCritiques(c => [...c, {
              kind: 'cliche', line: line.text,
              note: 'this one is borrowed. you noticed a notebook of strangers\' names — keep going specific.',
            }]);
          } else if (line.verified) {
            setEmotion('moved');
            setCritiques(c => [...c, {
              kind: 'verified', line: line.text,
              note: 'verified yours · from ' + line.src,
            }]);
          }
        }
      }
    }, 18);
    return () => clearTimeout(t);
  }, [step]);

  const lines = text.split('\n');
  const bylinePct = Math.round(
    (SCRIPT.draft.slice(0, lines.length).filter(d => d.verified).length / Math.max(lines.length, 1)) * 100
  );

  return (
    <div className="stage" style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div className="eyebrow">drafting · streaming critique</div>
        <div className="byline">
          <span className="byline-dot"/>
          <span>{bylinePct}% verified yours · {lines.length} / {SCRIPT.draft.length} lines</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
        {/* LEFT — draft */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>your letter · for tomas</div>
          <div className="card outlined" style={{
            padding: '32px 36px', minHeight: 380,
            fontFamily: 'var(--t-body)', fontSize: 19, lineHeight: 1.75,
            color: 'var(--t-ink)',
          }}>
            {lines.map((ln, i) => {
              const meta = SCRIPT.draft[i];
              const flagged = meta && meta.flag === 'cliche';
              return (
                <div key={i} style={{
                  background: flagged ? 'var(--t-accent-soft)' : 'transparent',
                  textDecoration: flagged ? 'underline wavy var(--t-accent)' : 'none',
                  borderRadius: 2, padding: '0 2px',
                }}>
                  {ln || <span style={{ opacity: 0.3 }}>·</span>}
                </div>
              );
            })}
            <span style={{
              display: 'inline-block', width: 1.5, height: 20, background: 'var(--t-ink)',
              animation: 'blink 1s infinite', verticalAlign: 'middle',
            }}/>
          </div>
        </div>

        {/* RIGHT — critique stream */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <MascotView id={SCRIPT.mascot} emotion={critiques.find(c=>c.kind==='cliche') ? 'sad' : 'listening'} size={48}/>
            <div className="eyebrow">guide · just notes</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460, overflow: 'auto' }} className="no-scrollbar">
            {critiques.slice().reverse().map((c, i) => (
              <div key={i} className="card outlined" style={{
                padding: '12px 16px',
                borderColor: c.kind === 'cliche' ? 'var(--t-accent)' : 'var(--t-ink-ghost)',
                borderLeft: '2px solid ' + (c.kind === 'cliche' ? 'var(--t-accent)' : 'var(--t-verified)'),
                animation: 'fadein 400ms ease',
              }}>
                <div className="eyebrow" style={{ color: c.kind === 'cliche' ? 'var(--t-accent)' : 'var(--t-verified)' }}>
                  {c.kind === 'cliche' ? '⚠ cliché · borrowed phrase' : '✓ verified yours'}
                </div>
                <div style={{ fontFamily: 'var(--t-body)', fontSize: 14, marginTop: 6, color: 'var(--t-ink-soft)', lineHeight: 1.5 }}>
                  {c.note}
                </div>
                {c.kind === 'cliche' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn ghost sm">cut it</button>
                    <button className="btn ghost sm">i'll keep it</button>
                  </div>
                )}
              </div>
            ))}
            {critiques.length === 0 && (
              <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11, padding: 12 }}>
                listening as you write…
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button className="btn primary" onClick={go}>render the artifact →</button>
      </div>
    </div>
  );
}

// ─────────── RENDER + HOVER TRACE ───────────

function Render({ openDownload, openSave, openShare, openStartOver, openReel, setEmotion }) {
  const [hovered, setHovered] = React.useState(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  React.useEffect(() => { setEmotion('hopeful'); }, []);

  // skip the cliché line — user "cut it"
  const finalLines = SCRIPT.draft.filter(d => d.verified);
  const total = finalLines.reduce((n, d) => n + d.text.split(/\s+/).length, 0);
  const verified = total; // 100% after cut

  const lineToQuestion = (src) => SCRIPT.interview.find((_, i) => 'q' + (i+1) === src);

  return (
    <div className="stage" style={{ maxWidth: 760, paddingTop: 64 }}>
      {/* postmark — top right of the artifact */}
      <div className="corner-stamp">
        <div className="postmark">
          <div className="pm-top">verified · yours</div>
          <div className="pm-mid">100%</div>
          <div className="pm-bot">mean it · 2025</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div className="eyebrow">for tomas · read aloud, saturday</div>
        <div className="ornament" style={{ marginTop: 12 }}>
          <svg width="120" height="14" viewBox="0 0 120 14" style={{ display: 'inline' }}>
            <path d="M 4 7 Q 30 2, 60 7 T 116 7" stroke="currentColor" strokeWidth="1" fill="none"/>
            <circle cx="60" cy="7" r="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <article style={{
        fontFamily: 'var(--t-body)',
        fontSize: 24,
        lineHeight: 1.75,
        textAlign: 'center',
        color: 'var(--t-ink)',
      }}>
        {finalLines.map((ln, i) => {
          const q = lineToQuestion(ln.src);
          return (
            <div key={i}
              className="trace-line"
              style={{ marginBottom: i === finalLines.length - 2 ? 18 : 4 }}
              onMouseEnter={e => { setHovered({ ln, q }); setPos({ x: e.clientX, y: e.clientY }); }}
              onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHovered(null)}
            >
              {ln.text}
            </div>
          );
        })}
      </article>

      <div className="divider-flourish" style={{ marginTop: 64 }}>
        <span className="ornament-glyph">❦</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div className="seal" style={{ width: 44, height: 44 }}>
          <span className="seal-glyph" style={{ fontSize: 18 }}>M</span>
        </div>
        <div className="serif-italic" style={{ fontSize: 22, color: 'var(--t-ink)' }}>
          One hundred percent your words.
        </div>
      </div>
      <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, textAlign: 'center', letterSpacing: '0.14em' }}>
        every line · hover · see the question that prompted it
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
        <button className="btn ghost sm" onClick={openDownload}>↓ download</button>
        <button className="btn ghost sm" onClick={openSave}>♡ save</button>
        <button className="btn ghost sm" onClick={openShare}>↗ share trace</button>
        <button className="btn sm" onClick={openStartOver}>start over</button>
      </div>

      {/* MAKE IT MOVE — featured CTA */}
      <div className="divider-flourish" style={{ marginTop: 36 }}><span className="ornament-glyph">·</span></div>
      <div className="card raised" style={{
        marginTop: 8, padding: '22px 26px',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
        background: 'var(--t-paper-warm)', position: 'relative', overflow: 'hidden',
      }}>
        {/* tiny phone-frame accent */}
        <div style={{ position: 'absolute', top: -10, right: 130, transform: 'rotate(6deg)', opacity: 0.85 }}>
          <div style={{
            width: 46, height: 84, borderRadius: 8,
            border: '2px solid var(--t-ink)',
            background: 'linear-gradient(155deg, color-mix(in srgb, var(--t-accent) 50%, var(--t-paper)), var(--t-paper-warm))',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)', width: 12, height: 2, background: 'var(--t-ink)', borderRadius: 1 }}/>
            <div style={{ position: 'absolute', left: 4, right: 4, bottom: 6, fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 5.5, lineHeight: 1.1, color: 'var(--t-ink)', textAlign: 'center' }}>
              "the world is wide…"
            </div>
          </div>
        </div>
        <div>
          <div className="eyebrow accent">new · for letters that should be seen</div>
          <h3 className="serif-italic" style={{ fontSize: 28, color: 'var(--t-ink)', marginTop: 6, marginBottom: 6, fontStyle: 'italic' }}>
            Make it move.
          </h3>
          <div className="body-prose" style={{ fontSize: 14, maxWidth: 540 }}>
            Turn this letter into a 30-second reel. Drop in photos, read it aloud in your voice, and we'll cut it to 9:16 — captions, your audio, and the trace badge on the end card.
          </div>
        </div>
        <button className="btn primary" onClick={openReel} style={{ whiteSpace: 'nowrap' }}>
          ▶ make a reel
        </button>
      </div>

      {hovered && (
        <div className="trace-pop" style={{
          left: Math.min(pos.x + 16, window.innerWidth - 340),
          top: Math.max(pos.y - 100, 20),
        }}>
          <div className="eyebrow" style={{ color: 'var(--t-accent)' }}>trace · {hovered.ln.src}</div>
          <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, marginTop: 8 }}>question</div>
          <div className="serif-italic" style={{ fontSize: 14, marginTop: 2, color: 'var(--t-ink)' }}>
            "{hovered.q?.q}"
          </div>
          <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, marginTop: 10 }}>your verbatim answer</div>
          <div style={{ fontSize: 13, marginTop: 4, color: 'var(--t-ink-soft)', fontStyle: 'italic' }}>
            "{hovered.q?.a}"
          </div>
          <div style={{
            marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--t-ink-ghost)',
            fontFamily: 'var(--t-mono)', fontSize: 9, color: 'var(--t-verified)', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>✓ exact substring · verified yours</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Spine, Drafting, Render });
