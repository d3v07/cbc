// Mean It hi-fi — Reel composer flow + Image card export.
// 5 reel screens: photos → voice → storyboard → render → result.
// + ImageCardDialog (format + layout picker).

// ─────────── shared: photo placeholder visual ───────────
function PhotoTile({ idx, src, descr, onRemove }) {
  return (
    <div className="plate" style={{
      position: 'relative', padding: 0, overflow: 'hidden',
      aspectRatio: '1', background: 'var(--t-paper-warm)',
    }}>
      {/* fake photo: gradient + index, like a polaroid placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background: src || `linear-gradient(${135 + idx * 30}deg, color-mix(in srgb, var(--t-accent) 30%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 20%, var(--t-paper-warm)))`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}/>
      {/* corner: index */}
      <div style={{
        position: 'absolute', top: 6, left: 6,
        fontFamily: 'var(--t-stamp)', fontSize: 11, color: 'var(--t-paper)',
        background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 1,
      }}>#{String(idx + 1).padStart(2,'0')}</div>
      {onRemove && (
        <button onClick={onRemove} style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(0,0,0,0.55)', color: 'var(--t-paper)',
          border: 'none', borderRadius: 1, padding: '2px 7px', cursor: 'pointer',
          fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.1em',
        }}>×</button>
      )}
      {/* AI description chip */}
      {descr && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '8px 10px',
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6))',
          color: 'var(--t-paper)',
          fontFamily: 'var(--t-body)', fontSize: 11, fontStyle: 'italic',
          lineHeight: 1.3,
        }}>{descr}</div>
      )}
    </div>
  );
}

// ─────────── REEL FLOW ───────────

const REEL_STEPS = [
  { id: 'photos',     label: '01 · photos'     },
  { id: 'voice',      label: '02 · voice'      },
  { id: 'storyboard', label: '03 · storyboard' },
  { id: 'render',     label: '04 · render'     },
  { id: 'result',     label: '05 · result'     },
];

function ReelFlow({ onClose, theme }) {
  const [step, setStep] = React.useState('photos');
  const [photos, setPhotos] = React.useState([
    { id: 1, descr: 'a man bent over a small radio · evening light · kitchen' },
    { id: 2, descr: 'kitchen table · a cup of espresso, half full' },
    { id: 3, descr: 'a small notebook, page filled with handwriting' },
  ]);
  const [voice, setVoice] = React.useState({ recorded: false, duration: 38 });
  const [shots, setShots] = React.useState([
    { id: 's1', t: 0,    dur: 4,   line: 'Tomas kept a notebook in his coat pocket.', photo: 3 },
    { id: 's2', t: 4,    dur: 5,   line: "He wrote down strangers' names so he could greet them next time.", photo: 3 },
    { id: 's3', t: 9,    dur: 7,   line: 'His hands tuned the radio dial like it was a violin string.', photo: 1 },
    { id: 's4', t: 16,   dur: 7,   line: 'He used to say: the world is wide and the kitchen is small.', photo: 2 },
    { id: 's5', t: 23,   dur: 6,   line: 'I tune the dial the same way now.', photo: 1 },
    { id: 's6', t: 29,   dur: 5,   line: 'I never told him.', photo: 1 },
  ]);

  const stepIdx = REEL_STEPS.findIndex(s => s.id === step);
  const next = () => {
    if (stepIdx < REEL_STEPS.length - 1) setStep(REEL_STEPS[stepIdx + 1].id);
  };
  const back = () => {
    if (stepIdx > 0) setStep(REEL_STEPS[stepIdx - 1].id);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 1080, width: '100%', padding: 0 }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        {/* reel chrome — sub-stepper */}
        <div style={{
          padding: '20px 36px 16px',
          borderBottom: '1px solid var(--t-ink-ghost)',
          background: 'var(--t-paper-warm)',
          position: 'relative',
        }}>
          <div className="tape tl" style={{ left: 36 }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow accent">make it move</div>
              <div className="serif-italic" style={{ fontSize: 24, color: 'var(--t-ink)', marginTop: 2 }}>
                A reel · for Tomas
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {REEL_STEPS.map((s, i) => (
                <button key={s.id} onClick={() => setStep(s.id)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: 'var(--t-mono)', fontSize: 10, letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: s.id === step ? 'var(--t-ink)' : i < stepIdx ? 'var(--t-ink-soft)' : 'var(--t-ink-faint)',
                    opacity: i <= stepIdx ? 1 : 0.5,
                    position: 'relative',
                    paddingBottom: 2,
                    borderBottom: s.id === step ? '1px solid var(--t-seal)' : '1px solid transparent',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px 36px 28px' }}>
          {step === 'photos'     && <ReelPhotos photos={photos} setPhotos={setPhotos} next={next}/>}
          {step === 'voice'      && <ReelVoice voice={voice} setVoice={setVoice} back={back} next={next}/>}
          {step === 'storyboard' && <ReelStoryboard shots={shots} setShots={setShots} photos={photos} back={back} next={next}/>}
          {step === 'render'     && <ReelRender shots={shots} photos={photos} back={back} next={next} theme={theme}/>}
          {step === 'result'     && <ReelResult onClose={onClose} regen={() => setStep('storyboard')}/>}
        </div>
      </div>
    </div>
  );
}

// ─────────── 01 · photos ───────────

function ReelPhotos({ photos, setPhotos, next }) {
  const [drag, setDrag] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);

  const fakeAdd = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setPhotos(p => [...p, { id: Date.now(), descr: 'analysing · finding subject, mood, light…' }]);
      setTimeout(() => {
        setPhotos(p => p.map((ph, i) => i === p.length - 1
          ? { ...ph, descr: 'a hand holding a coffee cup · warm light · interior' }
          : ph));
        setAnalyzing(false);
      }, 1200);
    }, 200);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="eyebrow">step 01 · bring in the images</div>
          <h2 className="h-display tiny" style={{ marginTop: 6 }}>Photos for the reel.</h2>
          <div className="body-prose" style={{ fontSize: 14, marginTop: 4 }}>
            Drop in 3–8 photos. We'll read them for subject, light, and mood — you can rearrange later.
          </div>
        </div>
        <div className="postmark" style={{ width: 78, height: 78, transform: 'rotate(4deg)', borderWidth: 2 }}>
          <div className="pm-top" style={{ fontSize: 7 }}>processing</div>
          <div className="pm-mid" style={{ fontSize: 11 }}>{photos.length}/8</div>
          <div className="pm-bot" style={{ fontSize: 7 }}>photos in</div>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); fakeAdd(); }}
        onClick={fakeAdd}
        style={{
          border: '1.5px dashed ' + (drag ? 'var(--t-accent)' : 'var(--t-ink-faint)'),
          borderRadius: 'var(--t-radius)',
          padding: '36px 24px',
          textAlign: 'center',
          background: drag ? 'var(--t-accent-soft)' : 'var(--t-paper-warm)',
          cursor: 'pointer',
          marginBottom: 22,
          transition: 'all 200ms',
        }}>
        <div style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--t-ink)', marginBottom: 4 }}>
          drop photos here
        </div>
        <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          or click to browse · jpg · png · heic · up to 8 images
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 10 }}>gallery · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
        {photos.map((p, i) => (
          <PhotoTile key={p.id} idx={i} descr={p.descr} onRemove={() => setPhotos(arr => arr.filter(x => x.id !== p.id))}/>
        ))}
        {photos.length < 8 && (
          <button onClick={fakeAdd} className="card bare" style={{
            aspectRatio: '1', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--t-ink-faint)', fontSize: 32, fontFamily: 'var(--t-display)',
            fontStyle: 'italic',
          }}>+</button>
        )}
      </div>

      <div className="plate deep" style={{ padding: '12px 16px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="byline-dot"/>
          <div style={{ flex: 1, fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)', letterSpacing: '0.1em' }}>
            {analyzing
              ? 'photo reader · sonnet 4.6 vision · analysing latest…'
              : 'photo reader ready · ' + photos.length + ' descriptions captured'}
          </div>
          <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.14em' }}>
            descriptions never leave your session
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn primary" onClick={next} disabled={photos.length < 1}>
          record your voice →
        </button>
      </div>
    </div>
  );
}

// ─────────── 02 · voice ───────────

function ReelVoice({ voice, setVoice, back, next }) {
  const [recording, setRecording] = React.useState(false);
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    if (!recording) return;
    const i = setInterval(() => setTime(t => t + 0.1), 100);
    return () => clearInterval(i);
  }, [recording]);

  const start = () => { setRecording(true); setTime(0); setVoice({ recorded: false, duration: 0 }); };
  const stop = () => { setRecording(false); setVoice({ recorded: true, duration: time }); };
  const retake = () => { setRecording(false); setTime(0); setVoice({ recorded: false, duration: 0 }); };

  // fake waveform bars
  const bars = Array.from({ length: 60 }, (_, i) => {
    if (recording) return Math.abs(Math.sin(time * 4 + i * 0.4)) * 0.7 + Math.random() * 0.3;
    if (voice.recorded) return Math.abs(Math.sin(i * 0.3)) * 0.6 + 0.2;
    return 0.06;
  });

  return (
    <div>
      <div className="eyebrow">step 02 · your voice carries it</div>
      <h2 className="h-display tiny" style={{ marginTop: 6 }}>Read it out loud.</h2>
      <div className="body-prose" style={{ fontSize: 14, marginTop: 4, marginBottom: 22, maxWidth: 580 }}>
        Read the letter slowly. Your voice — not a synth — gives the reel its weight. We'll align captions to the timing of each line.
      </div>

      <div className="plate raised" style={{ padding: '28px 32px', marginBottom: 22, position: 'relative' }}>
        {/* the script user reads */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>read aloud · for tomas</div>
        <div style={{
          fontFamily: 'var(--t-body)', fontSize: 18, lineHeight: 1.7, color: 'var(--t-ink)',
          paddingBottom: 18, borderBottom: '1px dashed var(--t-ink-ghost)', marginBottom: 22,
          fontStyle: 'italic',
        }}>
          Tomas kept a notebook in his coat pocket. He wrote down strangers' names so he could greet them next time. His hands tuned the radio dial like it was a violin string. He used to say: the world is wide and the kitchen is small. I tune the dial the same way now. I never told him.
        </div>

        {/* waveform */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, height: 72,
          padding: '0 8px', marginBottom: 14, justifyContent: 'center',
        }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: 3, height: `${h * 100}%`,
              background: recording ? 'var(--t-accent)' : voice.recorded ? 'var(--t-ink)' : 'var(--t-ink-ghost)',
              borderRadius: 1,
              transition: 'height 80ms',
              minHeight: 2,
            }}/>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--t-mono)', fontSize: 12, color: 'var(--t-ink-soft)', letterSpacing: '0.14em' }}>
            {recording ? '● recording · ' : voice.recorded ? '✓ captured · ' : 'ready · '}
            {(voice.recorded ? voice.duration : time).toFixed(1)}s
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!recording && !voice.recorded && (
              <button className="btn primary" onClick={start}>● start recording</button>
            )}
            {recording && (
              <button className="btn primary" onClick={stop} style={{ background: 'var(--t-ink)', borderColor: 'var(--t-ink)' }}>■ stop</button>
            )}
            {voice.recorded && (
              <>
                <button className="btn ghost sm" onClick={retake}>↺ retake</button>
                <button className="btn sm">▶ play back</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* hidden status: transcription */}
      {voice.recorded && (
        <div className="plate deep" style={{ padding: '12px 16px', marginBottom: 22, animation: 'fadein 320ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="byline-dot"/>
            <div style={{ flex: 1, fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)', letterSpacing: '0.1em' }}>
              transcribing · whisper · 6 lines aligned to timestamps
            </div>
            <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9 }}>0:{voice.duration.toFixed(0).padStart(2,'0')}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn ghost sm" onClick={back}>← back</button>
        <button className="btn primary" onClick={next} disabled={!voice.recorded} style={{ opacity: voice.recorded ? 1 : 0.4 }}>
          plan the storyboard →
        </button>
      </div>
    </div>
  );
}

// ─────────── 03 · storyboard ───────────

function ReelStoryboard({ shots, setShots, photos, back, next }) {
  const move = (i, dir) => {
    if (i + dir < 0 || i + dir >= shots.length) return;
    const arr = [...shots]; [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
    setShots(arr);
  };
  const setPhoto = (i, photoIdx) => {
    setShots(arr => arr.map((s, idx) => idx === i ? { ...s, photo: photoIdx + 1 } : s));
  };
  const totalDur = shots.reduce((n, s) => n + s.dur, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="eyebrow">step 03 · the curator's plan</div>
          <h2 className="h-display tiny" style={{ marginTop: 6 }}>The storyboard.</h2>
          <div className="body-prose" style={{ fontSize: 14, marginTop: 4 }}>
            Sonnet paired each line with a photo. Reorder shots, swap photos — no AI rewrites.
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow">total runtime</div>
          <div className="serif-italic" style={{ fontSize: 28, color: 'var(--t-ink)' }}>{totalDur.toFixed(0)}s</div>
        </div>
      </div>

      {/* timeline strip */}
      <div className="plate" style={{ padding: '14px 18px', marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>timeline · drag-edit shot durations</div>
        <div style={{ display: 'flex', height: 32, borderRadius: 1, overflow: 'hidden', border: '1px solid var(--t-ink-ghost)' }}>
          {shots.map((s, i) => (
            <div key={s.id} style={{
              flex: s.dur, position: 'relative',
              background: i % 2 === 0 ? 'var(--t-accent-soft)' : 'var(--t-paper-warm)',
              borderRight: i < shots.length - 1 ? '1px solid var(--t-ink-ghost)' : 'none',
              fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.1em',
              color: 'var(--t-ink-soft)', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.dur}s</div>
          ))}
        </div>
      </div>

      {/* shot rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
        {shots.map((s, i) => (
          <div key={s.id} className="card outlined" style={{
            display: 'grid',
            gridTemplateColumns: '38px 80px 1fr auto',
            gap: 14, alignItems: 'center',
            padding: '12px 16px',
          }}>
            {/* shot number */}
            <div style={{
              fontFamily: 'var(--t-stamp)', fontSize: 14,
              color: 'var(--t-accent)', textAlign: 'center',
            }}>0{i + 1}</div>

            {/* photo thumbnail */}
            <div style={{
              aspectRatio: '9/16', borderRadius: 1,
              background: `linear-gradient(${135 + s.photo * 30}deg, color-mix(in srgb, var(--t-accent) 30%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 20%, var(--t-paper-warm)))`,
              border: '1px solid var(--t-ink-ghost)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                fontFamily: 'var(--t-stamp)', fontSize: 9, color: 'var(--t-paper)',
                background: 'rgba(0,0,0,0.55)', padding: '1px 4px', borderRadius: 1,
              }}>#{String(s.photo).padStart(2,'0')}</div>
            </div>

            {/* line + timestamp */}
            <div>
              <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.14em', marginBottom: 4, textTransform: 'uppercase' }}>
                {s.t.toFixed(1)}s → {(s.t + s.dur).toFixed(1)}s · {s.dur}s
              </div>
              <div className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{s.line}"
              </div>
            </div>

            {/* controls */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn ghost sm" style={{ padding: '4px 8px' }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="btn ghost sm" style={{ padding: '4px 8px' }} onClick={() => move(i, 1)} disabled={i === shots.length - 1}>↓</button>
              <select
                value={s.photo - 1}
                onChange={e => setPhoto(i, parseInt(e.target.value))}
                style={{
                  fontFamily: 'var(--t-mono)', fontSize: 10, padding: '4px 6px',
                  background: 'var(--t-paper)', border: '1px solid var(--t-ink-ghost)',
                  color: 'var(--t-ink)', borderRadius: 1,
                }}>
                {photos.map((_, j) => <option key={j} value={j}>swap · #{String(j + 1).padStart(2,'0')}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn ghost sm" onClick={back}>← back</button>
        <button className="btn primary" onClick={next}>render preview →</button>
      </div>
    </div>
  );
}

// ─────────── 04 · render preview ───────────

function ReelRender({ shots, photos, back, next, theme }) {
  const [shotIdx, setShotIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [progress, setProgress] = React.useState(0); // 0..1 within current shot
  const totalDur = shots.reduce((n, s) => n + s.dur, 0);

  React.useEffect(() => {
    if (!playing) return;
    const cur = shots[shotIdx];
    const i = setInterval(() => {
      setProgress(p => {
        if (p >= 1) {
          setShotIdx(idx => (idx + 1) % shots.length);
          return 0;
        }
        return p + 0.1 / cur.dur;
      });
    }, 100);
    return () => clearInterval(i);
  }, [playing, shotIdx, shots]);

  const cur = shots[shotIdx];
  const elapsedTime = shots.slice(0, shotIdx).reduce((n, s) => n + s.dur, 0) + cur.dur * progress;

  return (
    <div>
      <div className="eyebrow">step 04 · live preview</div>
      <h2 className="h-display tiny" style={{ marginTop: 6, marginBottom: 18 }}>Watch it through.</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 36 }}>
        {/* the 9:16 canvas */}
        <div style={{
          aspectRatio: '9/16',
          width: 300,
          background: 'var(--t-ink)',
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 18px 56px rgba(0,0,0,0.4), inset 0 0 0 1px var(--t-ink)',
        }}>
          {/* photo with ken burns */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(${135 + cur.photo * 30}deg, color-mix(in srgb, var(--t-accent) 60%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 50%, var(--t-paper-warm)))`,
            transform: `scale(${1.05 + progress * 0.12})`,
            transition: 'transform 100ms linear',
          }}/>
          {/* darken overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)',
          }}/>
          {/* caption */}
          <div style={{
            position: 'absolute', left: 16, right: 16, bottom: 70,
            fontFamily: 'var(--t-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            color: 'var(--t-paper)',
            fontSize: 17,
            lineHeight: 1.3,
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            opacity: progress < 0.05 ? progress / 0.05 : progress > 0.95 ? (1 - progress) / 0.05 : 1,
          }}>"{cur.line}"</div>
          {/* corner postmark */}
          <div style={{ position: 'absolute', top: 12, right: 12, transform: 'rotate(8deg)' }}>
            <div className="postmark" style={{ width: 50, height: 50, borderWidth: 1.5, padding: 4, color: 'var(--t-paper)', borderColor: 'var(--t-paper)' }}>
              <div className="pm-mid" style={{ fontSize: 8, color: 'var(--t-paper)' }}>100%</div>
            </div>
          </div>
          {/* end-card cue at last shot */}
          {shotIdx === shots.length - 1 && progress > 0.6 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              opacity: (progress - 0.6) / 0.4,
            }}>
              <div style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--t-paper)' }}>
                Mean It<span style={{ color: 'var(--t-accent)' }}>.</span>
              </div>
              <div style={{ fontFamily: 'var(--t-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'var(--t-paper)', marginTop: 6, textTransform: 'uppercase' }}>
                every word verified yours
              </div>
            </div>
          )}
          {/* progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.18)' }}>
            <div style={{
              height: '100%',
              width: `${(elapsedTime / totalDur) * 100}%`,
              background: 'var(--t-accent)',
              transition: 'width 100ms linear',
            }}/>
          </div>
        </div>

        {/* status panel */}
        <div>
          <div className="plate deep" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>now showing</div>
            <div className="serif-italic" style={{ fontSize: 18, color: 'var(--t-ink)', fontStyle: 'italic', marginBottom: 6 }}>
              "{cur.line}"
            </div>
            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, letterSpacing: '0.12em' }}>
              shot 0{shotIdx + 1} / 0{shots.length} · {elapsedTime.toFixed(1)}s of {totalDur.toFixed(1)}s
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <button className="btn sm" onClick={() => setPlaying(p => !p)}>{playing ? '❚❚ pause' : '▶ play'}</button>
            <button className="btn ghost sm" onClick={() => { setShotIdx(0); setProgress(0); }}>↺ restart</button>
            <button className="btn ghost sm" onClick={() => setShotIdx(i => (i + 1) % shots.length)}>⏵ next shot</button>
          </div>

          <div className="plate" style={{ padding: '14px 18px', marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>render specs</div>
            <div style={{ fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)', lineHeight: 1.7 }}>
              <div>format · 1080 × 1920 · 9:16 · 30 fps</div>
              <div>codec · h.264 mp4 · ~6 mbps</div>
              <div>theme · {theme} · captions in {theme} palette</div>
              <div>motion · ken burns + caption fades</div>
              <div>audio · your voice · {totalDur.toFixed(0)}s</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn ghost sm" onClick={back}>← edit storyboard</button>
            <button className="btn primary" onClick={next}>render reel →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── 05 · result ───────────

function ReelResult({ onClose, regen }) {
  const [showShare, setShowShare] = React.useState(false);

  return (
    <div style={{ animation: 'fadein 360ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <StampMark color="var(--t-verified)">rendered · ready</StampMark>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 36, alignItems: 'center' }}>
        {/* finished reel poster */}
        <div style={{
          aspectRatio: '9/16', width: 300,
          background: 'var(--t-ink)',
          borderRadius: 6, overflow: 'hidden', position: 'relative',
          boxShadow: '0 18px 56px rgba(0,0,0,0.4)',
        }}>
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(155deg, color-mix(in srgb, var(--t-accent) 60%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 50%, var(--t-paper-warm)))',
          }}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.65) 100%)' }}/>
          <div style={{
            position: 'absolute', left: 20, right: 20, bottom: 90,
            fontFamily: 'var(--t-display)', fontStyle: 'italic', fontWeight: 600,
            color: 'var(--t-paper)', fontSize: 22, lineHeight: 1.25, textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>"His hands tuned the radio dial like it was a violin string."</div>
          <div style={{
            position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
            fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--t-paper)',
          }}>Mean It<span style={{ color: 'var(--t-accent)' }}>.</span></div>
          <div style={{ position: 'absolute', top: 12, right: 12, transform: 'rotate(8deg)' }}>
            <div className="postmark" style={{ width: 56, height: 56, borderWidth: 2, padding: 4, color: 'var(--t-paper)', borderColor: 'var(--t-paper)' }}>
              <div className="pm-top" style={{ fontSize: 6, color: 'var(--t-paper)' }}>verified</div>
              <div className="pm-mid" style={{ fontSize: 9, color: 'var(--t-paper)' }}>100%</div>
              <div className="pm-bot" style={{ fontSize: 6, color: 'var(--t-paper)' }}>yours</div>
            </div>
          </div>
          {/* play badge */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'var(--t-paper)',
          }}>▶</div>
        </div>

        <div>
          <div className="eyebrow">your reel · for tomas</div>
          <h2 className="h-display tiny" style={{ marginTop: 6, marginBottom: 12 }}>It's ready.</h2>
          <div className="body-prose" style={{ fontSize: 15, marginBottom: 22 }}>
            38 seconds · 1080×1920 · your voice · six lines, all yours. Trace badge on the end card.
          </div>

          <div className="plate" style={{ padding: '14px 18px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)' }}>
              <span>file · for-tomas.mp4</span>
              <span>5.4 MB</span>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 8 }}>save it</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            <button className="btn primary">↓ download mp4</button>
            <button className="btn sm" onClick={() => setShowShare(s => !s)}>↗ share</button>
            <button className="btn ghost sm" onClick={regen}>↺ re-render</button>
          </div>

          {showShare && (
            <div className="plate deep" style={{ padding: '14px 16px', animation: 'fadein 240ms ease' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>send direct to</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['tiktok', 'instagram reels', 'twitter / X', 'bluesky', 'youtube short', 'qr code'].map(c => (
                  <button key={c} className="btn ghost sm" style={{ textTransform: 'uppercase' }}>{c}</button>
                ))}
              </div>
              <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, marginTop: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                trace link is appended to the caption · receivers can verify
              </div>
            </div>
          )}

          <div className="divider-flourish"><span className="ornament-glyph">·</span></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>
              the artifact stays in your library
            </span>
            <button className="btn sm" onClick={onClose}>back to letter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── IMAGE CARD DIALOG (full format + layout picker) ───────────

function ImageCardDialog({ onClose }) {
  const [format, setFormat] = React.useState('1x1');
  const [layout, setLayout] = React.useState('hero');
  const [done, setDone] = React.useState(false);

  const formats = [
    { id: '1x1',    name: '1 : 1',   sub: 'instagram feed',          ratio: 1 },
    { id: '4x5',    name: '4 : 5',   sub: 'instagram portrait',      ratio: 4/5 },
    { id: '9x16',   name: '9 : 16',  sub: 'stories · tiktok',        ratio: 9/16 },
    { id: '16x9',   name: '16 : 9',  sub: 'twitter · linkedin',      ratio: 16/9 },
    { id: 'letter', name: 'letter',  sub: 'the artifact, photographed', ratio: 8.5/11 },
  ];

  const layouts = [
    { id: 'paper',    name: 'letter on paper', sub: 'verbatim text · postmark' },
    { id: 'hero',     name: 'single hero line', sub: 'one line · big type' },
    { id: 'photo',    name: 'photo + caption', sub: 'your image · line overlaid' },
    { id: 'carousel', name: 'carousel',        sub: 'multiple slides · trace' },
  ];

  // figure out preview frame size while keeping ratio
  const f = formats.find(x => x.id === format);
  const prevW = f.ratio >= 1 ? 280 : 280 * f.ratio;
  const prevH = f.ratio >= 1 ? 280 / f.ratio : 280;

  const previewBg = layout === 'photo'
    ? 'linear-gradient(155deg, color-mix(in srgb, var(--t-accent) 60%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 60%, var(--t-paper-warm)))'
    : 'var(--t-paper)';

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 920, padding: 0 }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        <div style={{ padding: '32px 36px 28px' }}>
          <div className="eyebrow accent">image card · shareable</div>
          <h2 className="h-display tiny" style={{ marginTop: 6, marginBottom: 6 }}>Make a snapshot.</h2>
          <div className="body-prose" style={{ fontSize: 15, marginBottom: 24 }}>
            Pick the size, pick the layout. The trace badge lives in the corner.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 36 }}>
            {/* options */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>format</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                {formats.map(fmt => (
                  <button key={fmt.id} onClick={() => setFormat(fmt.id)}
                    className={'card ' + (format === fmt.id ? 'selected' : 'outlined')}
                    style={{
                      cursor: 'pointer', padding: '10px 14px', minWidth: 90,
                      fontFamily: 'inherit', color: 'inherit', textAlign: 'center',
                    }}>
                    <div className="serif-italic" style={{ fontSize: 17, color: 'var(--t-ink)' }}>{fmt.name}</div>
                    <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, marginTop: 2, letterSpacing: '0.12em' }}>{fmt.sub}</div>
                  </button>
                ))}
              </div>

              <div className="eyebrow" style={{ marginBottom: 10 }}>layout</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
                {layouts.map(lay => (
                  <button key={lay.id} onClick={() => setLayout(lay.id)}
                    className={'card ' + (layout === lay.id ? 'selected' : 'outlined')}
                    style={{
                      cursor: 'pointer', padding: '12px 14px', textAlign: 'left',
                      fontFamily: 'inherit', color: 'inherit',
                    }}>
                    <div className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)' }}>{lay.name}</div>
                    <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, marginTop: 2, letterSpacing: '0.12em' }}>{lay.sub}</div>
                  </button>
                ))}
              </div>

              <div className="plate deep" style={{ padding: '12px 16px', fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)' }}>
                output · {format === '1x1' ? '1080 × 1080' : format === '4x5' ? '1080 × 1350' : format === '9x16' ? '1080 × 1920' : format === '16x9' ? '1920 × 1080' : '2550 × 3300'} px · png
              </div>
            </div>

            {/* preview */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>preview</div>
              <div style={{
                width: 300, height: 320,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--t-paper-warm)', borderRadius: 'var(--t-radius)',
                border: '1px dashed var(--t-ink-faint)',
              }}>
                <div style={{
                  width: prevW, height: prevH,
                  background: previewBg,
                  borderRadius: layout === 'paper' ? 1 : 4,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: '0 8px 24px var(--t-paper-shadow), inset 0 1px 0 var(--t-paper-highlight)',
                  border: layout === 'paper' ? '1px solid var(--t-ink-ghost)' : 'none',
                  fontFamily: 'var(--t-body)', color: layout === 'photo' ? 'var(--t-paper)' : 'var(--t-ink)',
                }}>
                  {/* postmark — always present */}
                  <div style={{ position: 'absolute', top: 6, right: 6, transform: 'rotate(8deg)' }}>
                    <div className="postmark" style={{
                      width: 38, height: 38, borderWidth: 1.2, padding: 2,
                      color: layout === 'photo' ? 'var(--t-paper)' : 'var(--t-accent)',
                      borderColor: layout === 'photo' ? 'var(--t-paper)' : 'var(--t-accent)',
                    }}>
                      <div className="pm-mid" style={{ fontSize: 6, color: 'inherit' }}>100%</div>
                    </div>
                  </div>

                  {/* layouts */}
                  {layout === 'paper' && (
                    <div style={{ padding: 14, fontSize: 9, lineHeight: 1.55, fontStyle: 'italic', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontFamily: 'var(--t-mono)', fontStyle: 'normal', fontSize: 6, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink-faint)', marginBottom: 6 }}>for tomas</div>
                      <div>"His hands tuned the radio dial like it was a violin string."</div>
                      <div style={{ marginTop: 8 }}>"The world is wide and the kitchen is small."</div>
                      <div style={{ marginTop: 14, fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 9, color: 'var(--t-seal)' }}>Mean It<span style={{ color: 'var(--t-accent)' }}>.</span></div>
                    </div>
                  )}
                  {layout === 'hero' && (
                    <div style={{ padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.15, color: 'var(--t-ink)' }}>
                        "the world is wide and the kitchen is small."
                      </div>
                      <div style={{ fontFamily: 'var(--t-mono)', fontSize: 7, letterSpacing: '0.22em', color: 'var(--t-ink-faint)', marginTop: 12, textTransform: 'uppercase' }}>
                        — for tomas
                      </div>
                    </div>
                  )}
                  {layout === 'photo' && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6))' }}/>
                      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 14, textAlign: 'center', fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--t-paper)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        "I tune the dial the same way now."
                      </div>
                    </>
                  )}
                  {layout === 'carousel' && (
                    <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className="eyebrow" style={{ fontSize: 6 }}>1 / 4</div>
                      <div style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.2, color: 'var(--t-ink)' }}>
                        "Tomas kept a notebook in his coat pocket."
                      </div>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        {[0,1,2,3].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? 'var(--t-accent)' : 'var(--t-ink-ghost)' }}/>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="divider-flourish"><span className="ornament-glyph">·</span></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>rendered locally · trace badge always on</span>
            <button className="btn primary" onClick={() => setDone(true)}>↓ download {format} png</button>
          </div>

          {done && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'color-mix(in srgb, var(--t-paper) 96%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16, animation: 'fadein 240ms ease',
            }}>
              <StampMark color="var(--t-verified)">delivered</StampMark>
              <button className="btn sm" onClick={onClose}>close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReelFlow, ImageCardDialog, PhotoTile });
