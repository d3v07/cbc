// Mean It hi-fi — eulogy demo data + screen components.

const SCRIPT = {
  recipient: 'my grandfather, Tomas',
  occasion: 'eulogy',
  form: 'a short letter — read aloud',
  guide: 'documentarian',
  mascot: 'wren',
  theme: 'quiet',

  interview: [
    { q: "What did he always say when he answered the phone?",
      a: "He'd say 'Pronto, who's calling my house?' — like he was offended you'd dare. He wasn't.",
      mood: 'curious' },
    { q: "What's a thing he did that nobody else would have done?",
      a: "He kept a notebook in his coat pocket. Wrote down strangers' names on the bus so he could greet them next time.",
      mood: 'moved' },
    { q: "When you picture his hands — what are they doing?",
      a: "Fixing the radio. Always the same radio. Tuning the dial like it was a violin string.",
      mood: 'listening' },
    { q: "Was there a phrase only he used?",
      a: "'The world is wide and the kitchen is small.' He'd say it before any meal that took effort.",
      mood: 'moved' },
    { q: "What didn't you get to say?",
      a: "That I learned the radio thing. I tune the dial the same way now. I never told him.",
      mood: 'sad' },
  ],

  spineCandidates: [
    { t: "tuning the dial like it was a violin string", from: "q3 · his hands", picked: true },
    { t: "the world is wide and the kitchen is small", from: "q4 · his phrase" },
    { t: "I tune the dial the same way now", from: "q5 · what you didn't say" },
  ],

  structure: [
    { label: 'memory', sub: 'the radio, his hands' },
    { label: 'phrase', sub: '"world is wide…"' },
    { label: 'inheritance', sub: 'the dial · the silence · what wasn\'t said' },
  ],

  draft: [
    { text: "Tomas kept a notebook in his coat pocket.", verified: true, src: 'q2' },
    { text: "He wrote down strangers' names so he could greet them next time.", verified: true, src: 'q2' },
    { text: "His hands tuned the radio dial like it was a violin string.", verified: true, src: 'q3' },
    { text: "He used to say: the world is wide and the kitchen is small.", verified: true, src: 'q4' },
    { text: "He was forever in our hearts.", verified: false, src: null, flag: 'cliche' },
    { text: "I tune the dial the same way now.", verified: true, src: 'q5' },
    { text: "I never told him.", verified: true, src: 'q5' },
  ],
};

// ─────────── PICK THE MOMENT (B+C hybrid: feeling cards → conversational parse) ───────────

function PickMoment({ go }) {
  const [feeling, setFeeling] = React.useState(null);
  const [text, setText] = React.useState('');

  const feelings = [
    { id: 'goodbye',     h: 'a goodbye',     s: 'eulogy · final letter' },
    { id: 'celebration', h: 'a celebration', s: 'birthday · wedding'    },
    { id: 'thanks',      h: 'a thank you',   s: 'gratitude · just because' },
    { id: 'apology',     h: 'an apology',    s: 'making it right'       },
    { id: 'love',        h: 'a love note',   s: 'partner · friend'      },
    { id: 'else',        h: 'something else',s: 'tell me more'          },
  ];

  React.useEffect(() => {
    if (feeling === 'goodbye') {
      setText("My grandfather, Tomas. He passed last month. The service is Saturday. I want to say something true.");
    }
  }, [feeling]);

  return (
    <div className="stage" style={{ paddingTop: 56 }}>
      <div className="eyebrow">a moment that matters</div>
      <h1 className="h-display" style={{ marginTop: 8, marginBottom: 18 }}>
        What kind of moment<br/>is this?
      </h1>
      <div className="body-prose" style={{ maxWidth: 540, marginBottom: 32 }}>
        Pick by feeling. We'll figure out the form together.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {feelings.map(f => (
          <button
            key={f.id}
            onClick={() => setFeeling(f.id)}
            className={'card ' + (feeling === f.id ? 'selected' : feeling ? 'bare' : 'outlined')}
            style={{
              textAlign: 'left', cursor: 'pointer', minHeight: 120,
              padding: '20px 22px',
              fontFamily: 'inherit', color: 'inherit',
              transition: 'all 300ms',
            }}
          >
            <div className="serif-italic" style={{ fontSize: 26, lineHeight: 1.1, color: 'var(--t-ink)' }}>{f.h}</div>
            <div className="eyebrow" style={{ marginTop: 8 }}>{f.s}</div>
          </button>
        ))}
      </div>

      {feeling && (
        <div style={{ marginTop: 40 }}>
          <div className="eyebrow">tell me what's going on</div>
          <textarea
            className="textarea-prose"
            style={{ marginTop: 12, fontSize: 19 }}
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="who · the occasion · anything specific you want to say…"
          />
          {text.length > 30 && (
            <div style={{ marginTop: 22, animation: 'fadein 600ms ease' }}>
              <div className="eyebrow">i heard…</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <span className="tag on">recipient · grandfather, Tomas</span>
                <span className="tag on">occasion · eulogy</span>
                <span className="tag on">when · Saturday</span>
                <span className="tag">tone · still listening</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, alignItems: 'center' }}>
                <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11 }}>edit any pill — or keep going</span>
                <button className="btn primary" onClick={go}>pick a guide →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────── GUIDE PICKER (variant C with mascot inside) ───────────

function GuidePicker({ go, openCreateGuide }) {
  const [pick, setPick] = React.useState('wren');
  const guides = [
    { id: 'wren',   tag: 'memory · specifics',         desc: 'pulls for moments only one person remembers. low-key, patient.', sample: '"What did he always say when he answered the phone?"' },
    { id: 'pip',    tag: 'sensory noticing',           desc: 'pulls for the smell, the sound, the small thing nobody else saw.', sample: '"What\'s a smell that means home?"' },
    { id: 'cassio', tag: 'unresolved feeling',         desc: 'pulls for what didn\'t get said. comfortable with quiet.',           sample: '"What didn\'t you get to say?"' },
  ];

  return (
    <div className="stage">
      <div className="eyebrow">three ways of being listened to</div>
      <h1 className="h-display smaller" style={{ marginTop: 8, marginBottom: 8 }}>Pick the kind of attention<br/>this moment needs.</h1>
      <div className="body-prose" style={{ maxWidth: 580, marginBottom: 28 }}>
        Each one asks differently. None of them write for you. Ever.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {guides.map(g => {
          const M = MASCOTS[g.id];
          return (
            <button key={g.id} onClick={() => setPick(g.id)}
              className={'card ' + (pick === g.id ? 'selected' : 'outlined')}
              style={{
                display: 'grid', gridTemplateColumns: '90px 1fr auto',
                gap: 22, alignItems: 'center',
                textAlign: 'left', cursor: 'pointer', padding: '18px 22px',
                fontFamily: 'inherit', color: 'inherit',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MascotView id={g.id} emotion={pick === g.id ? 'curious' : 'listening'} size={72}/>
              </div>
              <div>
                <div className="serif-italic" style={{ fontSize: 24, color: 'var(--t-ink)' }}>{M.guide}</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>pulls for · {g.tag}</div>
                <div className="body-prose" style={{ fontSize: 15, marginTop: 8, color: 'var(--t-ink-soft)' }}>{g.desc}</div>
                <div className="serif-italic" style={{ fontSize: 14, fontStyle: 'italic', marginTop: 8, color: 'var(--t-ink-faint)' }}>
                  sample · {g.sample}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--t-mono)', fontSize: 10, color: 'var(--t-ink-faint)', letterSpacing: '0.14em' }}>
                {pick === g.id ? '● selected' : '○ pick'}
              </div>
            </button>
          );
        })}

        <div className="card bare" onClick={openCreateGuide} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', cursor: 'pointer',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            border: '1.5px dashed var(--t-ink-faint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--t-ink-faint)',
          }}>+</div>
          <div style={{ flex: 1 }}>
            <div className="serif-italic" style={{ fontSize: 20, color: 'var(--t-ink)' }}>Create your own guide</div>
            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11, marginTop: 2 }}>
              describe how you want to be paid attention to · share it via link
            </div>
          </div>
        </div>
      </div>

      <div className="divider-flourish"/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11 }}>
          guide rules: ask · mirror · propose structure · never draft
        </span>
        <button className="btn primary" onClick={go}>begin with {MASCOTS[pick].name} →</button>
      </div>
    </div>
  );
}

// ─────────── INTERVIEW (split A — with live mascot emotion) ───────────

function Interview({ go, setEmotion }) {
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState(SCRIPT.interview.map(() => ''));
  const [showMirror, setShowMirror] = React.useState(false);
  const cur = SCRIPT.interview[qIdx];

  React.useEffect(() => { setEmotion(cur.mood); }, [qIdx]);

  const onChange = e => {
    const next = [...answers]; next[qIdx] = e.target.value;
    setAnswers(next);
    if (e.target.value.length > 60 && !showMirror) setShowMirror(true);
  };
  const next = () => {
    setShowMirror(false);
    if (qIdx < SCRIPT.interview.length - 1) setQIdx(qIdx + 1);
    else go();
  };

  // pre-fill demo answers when stepping
  React.useEffect(() => {
    if (!answers[qIdx]) {
      const t = setTimeout(() => {
        const next = [...answers]; next[qIdx] = SCRIPT.interview[qIdx].a;
        setAnswers(next);
        setShowMirror(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [qIdx]);

  return (
    <div className="stage" style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div className="eyebrow">interview · {MASCOTS[SCRIPT.mascot].guide}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>q{qIdx + 1} / {SCRIPT.interview.length}</span>
          <div className="progress-dots">
            {SCRIPT.interview.map((_, i) => <div key={i} className={'d ' + (i <= qIdx ? 'on' : '')}/>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
        {/* LEFT — guide side */}
        <div style={{ paddingTop: 8, position: 'relative' }}>
          <div style={{ marginBottom: 22 }}>
            <MascotView id={SCRIPT.mascot} emotion={cur.mood} size={84}/>
          </div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>the guide is asking</div>
          <div className="serif-italic" style={{ fontSize: 36, lineHeight: 1.2, color: 'var(--t-ink)' }}>
            {cur.q}
          </div>

          {showMirror && qIdx > 0 && (
            <div className="card" style={{
              marginTop: 28, padding: '14px 18px',
              borderLeft: '2px solid var(--t-accent)',
              animation: 'fadein 600ms ease',
            }}>
              <div className="eyebrow" style={{ color: 'var(--t-accent)' }}>holding · from your last answer</div>
              <div className="serif-italic" style={{ fontSize: 18, fontStyle: 'italic', marginTop: 6, color: 'var(--t-ink)' }}>
                "<span className="hl">{SCRIPT.interview[qIdx-1].a.split(/[.!?]/)[0]}</span>"
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — user side */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>your turn · take your time</div>
          <textarea
            className="textarea-prose"
            value={answers[qIdx]}
            onChange={onChange}
            rows={7}
            placeholder="something specific. one detail is enough."
            style={{ fontSize: 19, minHeight: 200 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, alignItems: 'center' }}>
            <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>
              {answers[qIdx].split(/\s+/).filter(Boolean).length} words · all yours
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm">↺ rephrase</button>
              <button className="btn primary" onClick={next}>
                {qIdx < SCRIPT.interview.length - 1 ? 'next →' : 'find the spine →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SCRIPT, PickMoment, GuidePicker, Interview });
