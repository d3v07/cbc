// Mean It hi-fi — Create-Your-Own-Guide flow (hybrid: single screen, guided sequence inside).

function CreateGuideDialog({ onClose }) {
  const [step, setStep] = React.useState(0); // 0..4 = guided questions; 5 = preview/edit; 6 = done
  const [data, setData] = React.useState({
    name: '',
    pulls_for: '',
    voice: '',
    sample_q: '',
    never: '',
    mascot: 'wren',
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const questions = [
    {
      id: 'pulls_for',
      eyebrow: 'question 01 · what do they pull for',
      q: 'What does this guide listen for?',
      sub: 'The thing they hear when nobody else is hearing it.',
      placeholder: 'e.g. "the small, specific gesture nobody noticed but you"',
      examples: ['memory · specifics', 'the unsaid feeling', 'sensory detail', 'the contradiction'],
    },
    {
      id: 'voice',
      eyebrow: 'question 02 · how do they sound',
      q: 'How would you describe their voice?',
      sub: 'Three words is plenty. Or a sentence. Or a feeling.',
      placeholder: 'e.g. "patient. low-key. comfortable with silence."',
      examples: ['curious · gentle', 'sharp · interrupting', 'warm · slow'],
    },
    {
      id: 'sample_q',
      eyebrow: 'question 03 · the kind of question they ask',
      q: 'Write a question they\'d ask you.',
      sub: 'One sample question that captures how they pull a story.',
      placeholder: 'e.g. "When you picture their hands — what are they doing?"',
      examples: [],
    },
    {
      id: 'never',
      eyebrow: 'question 04 · the rule they live by',
      q: 'What would they never do?',
      sub: 'Hard limits. The things you don\'t want this guide saying.',
      placeholder: 'e.g. "never finish your sentence. never offer a metaphor."',
      examples: ['never write for me', 'never cliché', 'never rush'],
    },
    {
      id: 'name',
      eyebrow: 'question 05 · the name',
      q: 'What\'s their name?',
      sub: 'A name and a one-line title. The mascot art comes from us.',
      placeholder: 'e.g. "Marsh — the slow listener"',
      examples: [],
    },
  ];

  const cur = questions[step];
  const filled = step <= 4 ? !!data[cur.id]?.trim() : true;

  const next = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else setStep(5);
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 760, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        {/* tape decoration */}
        <div className="tape tl"/>
        <div className="tape tr"/>

        <div style={{ padding: '36px 40px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <div className="eyebrow accent">create your own guide</div>
              <h2 className="h-display tiny" style={{ marginTop: 6 }}>
                {step <= 4 ? 'A guided interview · for the guide.' : 'Here they are.'}
              </h2>
            </div>
            <div className="progress-dots">
              {[0,1,2,3,4,5].map(i => <div key={i} className={'d ' + (i <= step ? 'on' : '')}/>)}
            </div>
          </div>

          {step <= 4 && (
            <div style={{ marginTop: 28, animation: 'fadein 300ms ease' }} key={step}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{cur.eyebrow}</div>
              <div className="serif-italic" style={{ fontSize: 32, lineHeight: 1.18, color: 'var(--t-ink)', marginBottom: 6 }}>
                {cur.q}
              </div>
              <div className="body-prose" style={{ fontSize: 15, marginBottom: 18, color: 'var(--t-ink-soft)' }}>
                {cur.sub}
              </div>

              <textarea
                className="textarea-prose"
                rows={cur.id === 'sample_q' || cur.id === 'voice' ? 3 : 2}
                value={data[cur.id]}
                onChange={e => set(cur.id, e.target.value)}
                placeholder={cur.placeholder}
                style={{ fontSize: 17 }}
                autoFocus
              />

              {cur.examples.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>or borrow one</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cur.examples.map(ex => (
                      <button key={ex} className="tag" onClick={() => set(cur.id, ex)}>{ex}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* live preview — small card showing the guide forming */}
              <div style={{ marginTop: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>forming…</div>
                <div className="plate" style={{
                  padding: '14px 18px',
                  display: 'grid', gridTemplateColumns: '60px 1fr', gap: 14, alignItems: 'center',
                }}>
                  <div style={{
                    width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px dashed var(--t-ink-faint)', borderRadius: '50%',
                  }}>
                    <span style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--t-ink-faint)' }}>?</span>
                  </div>
                  <div>
                    <div className="serif-italic" style={{ fontSize: 20, color: 'var(--t-ink)' }}>
                      {data.name || <span className="muted">— unnamed —</span>}
                    </div>
                    <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 4, letterSpacing: '0.12em' }}>
                      pulls for · {data.pulls_for || '—'}
                    </div>
                    {data.voice && (
                      <div className="body-prose" style={{ fontSize: 13, marginTop: 6, color: 'var(--t-ink-soft)' }}>
                        voice · {data.voice}
                      </div>
                    )}
                    {data.sample_q && (
                      <div className="serif-italic" style={{ fontSize: 13, fontStyle: 'italic', marginTop: 6, color: 'var(--t-ink-faint)' }}>
                        sample · "{data.sample_q}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <button className="btn ghost sm" onClick={prev} disabled={step === 0} style={{ opacity: step === 0 ? 0.4 : 1 }}>← back</button>
                <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>
                  {step + 1} of {questions.length}
                </span>
                <button className="btn primary" onClick={next} disabled={!filled} style={{ opacity: filled ? 1 : 0.4 }}>
                  {step < questions.length - 1 ? 'next →' : 'preview →'}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ marginTop: 24, animation: 'fadein 360ms ease' }}>
              <div className="body-prose" style={{ fontSize: 16, marginBottom: 22 }}>
                Here's what you made. Edit any field directly — or stamp it and use it.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 28 }}>
                {/* LEFT — the guide card preview */}
                <div className="plate raised" style={{ padding: 22, position: 'relative' }}>
                  <div className="corner-stamp" style={{ top: 12, right: 12 }}>
                    <div style={{
                      border: '1.5px solid var(--t-accent)', color: 'var(--t-accent)',
                      fontFamily: 'var(--t-stamp)', fontSize: 9, padding: '3px 8px',
                      letterSpacing: '0.12em', textTransform: 'uppercase', transform: 'rotate(-4deg)',
                    }}>custom</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <MascotView id={data.mascot} emotion="curious" size={84}/>
                  </div>
                  <div className="serif-italic" style={{ fontSize: 26, color: 'var(--t-ink)', textAlign: 'center', marginBottom: 4 }}>
                    {data.name || 'Unnamed'}
                  </div>
                  <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.16em', textAlign: 'center', marginBottom: 14, textTransform: 'uppercase' }}>
                    pulls for · {data.pulls_for || '—'}
                  </div>

                  <div className="body-prose" style={{ fontSize: 14, marginBottom: 12 }}>
                    {data.voice || <span className="muted">— no voice description —</span>}
                  </div>

                  <div className="serif-italic" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--t-ink-soft)', borderLeft: '2px solid var(--t-accent)', paddingLeft: 12, marginBottom: 12 }}>
                    "{data.sample_q}"
                  </div>

                  {data.never && (
                    <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-accent)', letterSpacing: '0.12em' }}>
                      never · {data.never}
                    </div>
                  )}

                  <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px dashed var(--t-ink-ghost)' }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>mascot art · pick one</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      {['wren', 'pip', 'cassio'].map(m => (
                        <button key={m} onClick={() => set('mascot', m)}
                          style={{
                            background: 'transparent', cursor: 'pointer',
                            border: data.mascot === m ? '1.5px solid var(--t-accent)' : '1.5px solid var(--t-ink-ghost)',
                            borderRadius: 'var(--t-radius)', padding: 4,
                          }}>
                          <MascotView id={m} emotion="listening" size={42}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT — editable raw fields */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>raw fields · editable</div>
                  {[
                    { k: 'name',       label: 'name + title' },
                    { k: 'pulls_for',  label: 'pulls for' },
                    { k: 'voice',      label: 'voice' },
                    { k: 'sample_q',   label: 'sample question' },
                    { k: 'never',      label: 'never · hard limit' },
                  ].map(f => (
                    <div key={f.k} style={{ marginBottom: 12 }}>
                      <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.14em', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</div>
                      <input
                        type="text"
                        value={data[f.k]}
                        onChange={e => set(f.k, e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--t-paper-warm)',
                          border: '1px solid var(--t-ink-ghost)',
                          borderRadius: 'var(--t-radius)',
                          padding: '8px 10px',
                          fontFamily: 'var(--t-body)', fontSize: 14,
                          color: 'var(--t-ink)', outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider-flourish"><span className="ornament-glyph">❦</span></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn ghost sm" onClick={() => setStep(0)}>↺ start over</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn sm" onClick={() => setStep(6)}>↗ share guide</button>
                  <button className="btn primary" onClick={() => setStep(6)}>stamp & use →</button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div style={{ padding: '20px 0 8px', textAlign: 'center', animation: 'fadein 400ms ease' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <StampMark color="var(--t-verified)">stamped · ready</StampMark>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <MascotView id={data.mascot} emotion="hopeful" size={96}/>
              </div>

              <div className="serif-italic" style={{ fontSize: 30, color: 'var(--t-ink)', marginBottom: 6 }}>
                {data.name || 'your guide'} is ready.
              </div>
              <div className="body-prose" style={{ fontSize: 15, marginBottom: 22 }}>
                Saved to your guide library. They'll show up next to Wren, Pip, and Cassio.
              </div>

              <div className="eyebrow" style={{ marginBottom: 8 }}>share link · anyone can import them</div>
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <CopyLine url={'meanit.app/guide/' + (data.name || 'unnamed').toLowerCase().replace(/\s+/g, '-').slice(0, 24)}/>
              </div>

              <div className="divider-flourish"><span className="ornament-glyph">·</span></div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button className="btn sm" onClick={() => { setStep(0); setData({ name: '', pulls_for: '', voice: '', sample_q: '', never: '', mascot: 'wren' }); }}>make another</button>
                <button className="btn primary" onClick={onClose}>back to guide picker →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreateGuideDialog });
