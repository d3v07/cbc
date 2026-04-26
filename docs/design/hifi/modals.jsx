// Mean It hi-fi — modal dialogs (download, save, share trace, start over).
// Letterpress treatment — postage, wax seals, deckle paper.

// ─────────── shared bits ───────────

function StampMark({ children, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '6px 14px',
      border: `2px solid ${color || 'var(--t-accent)'}`,
      color: color || 'var(--t-accent)',
      fontFamily: 'var(--t-stamp)',
      fontSize: 12,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      transform: 'rotate(-2deg)',
      borderRadius: 1,
      background: 'transparent',
      animation: 'stamp-in 360ms cubic-bezier(.2,1.4,.4,1) both',
      opacity: 0.92,
    }}>{children}</div>
  );
}

function CopyLine({ url }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    try { navigator.clipboard.writeText(url); } catch(e){}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: '1px dashed var(--t-ink-faint)',
      borderRadius: 'var(--t-radius)',
      padding: '8px 10px 8px 14px',
      background: 'var(--t-paper-warm)',
      gap: 10,
    }}>
      <span style={{
        flex: 1, fontFamily: 'var(--t-mono)', fontSize: 12,
        color: 'var(--t-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{url}</span>
      <button className="btn sm" onClick={onCopy}>{copied ? '✓ copied' : 'copy'}</button>
    </div>
  );
}

// ─────────── DOWNLOAD ───────────

function DownloadDialog({ onClose, openImageCard }) {
  const [format, setFormat] = React.useState('pdf');
  const [includeTrace, setIncludeTrace] = React.useState(true);
  const [stampVisible, setStampVisible] = React.useState(true);
  const [done, setDone] = React.useState(false);

  const formats = [
    { id: 'pdf',   name: 'PDF',         sub: 'formatted artifact, print-ready', glyph: '📄' },
    { id: 'txt',   name: 'plain text',  sub: 'just the words, no formatting',   glyph: '⌘' },
    { id: 'image', name: 'image card',  sub: 'shareable snapshot',              glyph: '◫' },
  ];

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        <div className="eyebrow">step 06 · take it with you</div>
        <h2 className="h-display tiny" style={{ marginTop: 8, marginBottom: 6 }}>Download</h2>
        <div className="body-prose" style={{ fontSize: 16, marginBottom: 22 }}>
          Choose how you want it on paper.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {formats.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className={'card ' + (format === f.id ? 'selected' : 'outlined')}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto',
                gap: 14, alignItems: 'center', textAlign: 'left',
                cursor: 'pointer', padding: '14px 18px', fontFamily: 'inherit', color: 'inherit',
              }}>
              <div style={{
                fontFamily: 'var(--t-display)', fontSize: 26,
                color: format === f.id ? 'var(--t-accent)' : 'var(--t-ink-soft)',
                textAlign: 'center',
              }}>{f.glyph}</div>
              <div>
                <div className="serif-italic" style={{ fontSize: 19, color: 'var(--t-ink)' }}>{f.name}</div>
                <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 2 }}>{f.sub}</div>
              </div>
              <div style={{ fontFamily: 'var(--t-mono)', fontSize: 10, color: 'var(--t-ink-faint)', letterSpacing: '0.14em' }}>
                {format === f.id ? '●' : '○'}
              </div>
            </button>
          ))}
        </div>

        <div className="plate deep" style={{ padding: '14px 16px', marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>included on the artifact</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={stampVisible} onChange={e => setStampVisible(e.target.checked)}/>
            <span className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)' }}>'Mean It' wordmark + 100% yours stamp</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeTrace} onChange={e => setIncludeTrace(e.target.checked)}/>
            <span className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)' }}>provenance trace appendix · the questions + your verbatim answers</span>
          </label>
        </div>

        {/* preview thumb */}
        <div style={{
          background: 'var(--t-paper-warm)',
          border: '1px solid var(--t-ink-ghost)',
          borderRadius: 'var(--t-radius)',
          padding: 18,
          marginBottom: 22,
          position: 'relative',
        }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>preview · {format}</div>
          <div style={{
            background: 'var(--t-paper)',
            border: '1px solid var(--t-ink-ghost)',
            borderRadius: 'var(--t-radius)',
            padding: '20px 24px',
            position: 'relative',
            fontFamily: 'var(--t-body)',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--t-ink)',
            minHeight: 120,
            boxShadow: 'inset 0 1px 0 var(--t-paper-highlight), inset 0 -1px 0 var(--t-paper-shadow)',
          }}>
            {stampVisible && (
              <div style={{ position: 'absolute', top: 8, right: 8, transform: 'rotate(8deg)' }}>
                <div className="postmark" style={{ width: 50, height: 50, borderWidth: 1.5, padding: 4 }}>
                  <div className="pm-mid" style={{ fontSize: 7 }}>100%</div>
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center', fontFamily: 'var(--t-mono)', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink-faint)', marginBottom: 8 }}>
              for tomas · saturday
            </div>
            <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
              "His hands tuned the radio dial like it was a violin string."
            </div>
            <div style={{ textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
              "The world is wide and the kitchen is small."
            </div>
            {includeTrace && (
              <div style={{ marginTop: 14, paddingTop: 8, borderTop: '1px dashed var(--t-ink-ghost)', fontFamily: 'var(--t-mono)', fontSize: 7, color: 'var(--t-ink-faint)', letterSpacing: '0.1em' }}>
                ── appendix · trace ──<br/>
                q3 · "when you picture his hands…" → "his hands tuned the radio…"<br/>
                q4 · "was there a phrase only he used?" → "the world is wide…"
              </div>
            )}
            {stampVisible && (
              <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 10, color: 'var(--t-seal)' }}>
                Mean It<span style={{ color: 'var(--t-accent)' }}>.</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10 }}>
            stays on this device · nothing uploaded
          </span>
          <button className="btn primary" onClick={() => {
            if (format === 'image' && openImageCard) { onClose(); openImageCard(); return; }
            setDone(true);
          }}>{format === 'image' ? '→ pick format & layout' : '↓ download ' + format}</button>
        </div>

        {done && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'color-mix(in srgb, var(--t-paper) 96%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 18,
            animation: 'fadein 240ms ease',
          }}>
            <StampMark color="var(--t-verified)">delivered</StampMark>
            <div className="serif-italic" style={{ fontSize: 22, color: 'var(--t-ink)' }}>Saved to your downloads.</div>
            <button className="btn sm" onClick={onClose}>close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── SAVE ───────────

function SaveDialog({ onClose }) {
  const [title, setTitle] = React.useState('For Tomas · Saturday');
  const [saved, setSaved] = React.useState(false);
  const url = 'meanit.app/letter/tomas-' + (Math.random().toString(36).slice(2, 7));

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        <div className="eyebrow">save · personal</div>
        <h2 className="h-display tiny" style={{ marginTop: 8, marginBottom: 6 }}>Keep this letter.</h2>
        <div className="body-prose" style={{ fontSize: 16, marginBottom: 24 }}>
          Saved to your library — and reachable by anyone you share the link with.
        </div>

        {!saved && (
          <>
            <div className="eyebrow" style={{ marginBottom: 6 }}>title</div>
            <input className="input-stroke" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 22, fontSize: 22 }}/>

            <div className="plate" style={{ padding: '14px 16px', marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)' }}>
                <span>guide · the documentarian</span>
                <span>theme · quiet</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)', marginTop: 6 }}>
                <span>6 verified lines</span>
                <span>5 questions answered</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="vis" defaultChecked/>
                <span className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)' }}>private · only you can read it</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="vis"/>
                <span className="serif-italic" style={{ fontSize: 16, color: 'var(--t-ink)' }}>unlisted · anyone with the link can read</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn ghost sm" onClick={onClose}>not now</button>
              <button className="btn primary" onClick={() => setSaved(true)}>♡ save to library</button>
            </div>
          </>
        )}

        {saved && (
          <div style={{ animation: 'fadein 360ms ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <StampMark color="var(--t-verified)">saved · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</StampMark>
            </div>
            <div className="serif-italic" style={{ fontSize: 24, color: 'var(--t-ink)', textAlign: 'center', marginBottom: 6 }}>
              {title}
            </div>
            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, textAlign: 'center', letterSpacing: '0.14em', marginBottom: 22 }}>
              kept · readable by link
            </div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>your share-back link</div>
            <CopyLine url={url}/>

            <div className="divider-flourish"><span className="ornament-glyph">·</span></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn ghost sm">view library</button>
              <button className="btn sm" onClick={onClose}>back to letter</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── SHARE TRACE ───────────

function ShareDialog({ onClose }) {
  const [audience, setAudience] = React.useState('public');
  const [step, setStep] = React.useState('compose'); // compose | shared
  const url = 'meanit.app/share/tomas-r3-trace';

  const audiences = [
    { id: 'recipient', name: 'just the recipient', sub: 'they read the letter, hover any line for the trace' },
    { id: 'public',    name: 'public · social',    sub: 'artifact + ‘every word verified yours’ badge' },
    { id: 'audit',     name: 'skeptics · audit',   sub: 'full provenance · every Q + A + match type' },
  ];

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        <div className="eyebrow accent">share · the trace stays attached</div>
        <h2 className="h-display tiny" style={{ marginTop: 8, marginBottom: 6 }}>Send the proof,<br/>not just the words.</h2>
        <div className="body-prose" style={{ fontSize: 16, marginBottom: 22 }}>
          Pick who you're sharing with. The trace becomes the receipt.
        </div>

        {step === 'compose' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {audiences.map(a => (
                <button key={a.id} onClick={() => setAudience(a.id)}
                  className={'card ' + (audience === a.id ? 'selected' : 'outlined')}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    padding: '14px 18px', fontFamily: 'inherit', color: 'inherit',
                  }}>
                  <div className="serif-italic" style={{ fontSize: 19, color: 'var(--t-ink)' }}>{a.name}</div>
                  <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 4 }}>{a.sub}</div>
                </button>
              ))}
            </div>

            {/* preview card per audience */}
            <div className="plate deep" style={{ padding: 18, marginBottom: 22, position: 'relative' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>recipients see</div>
              {audience === 'recipient' && (
                <div style={{ fontFamily: 'var(--t-body)', fontSize: 14, color: 'var(--t-ink)', textAlign: 'center', padding: 8 }}>
                  <div style={{ fontStyle: 'italic', marginBottom: 6 }}>"His hands tuned the radio dial like it was a violin string."</div>
                  <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, letterSpacing: '0.14em' }}>
                    hover any line · see the question that prompted it
                  </div>
                </div>
              )}
              {audience === 'public' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--t-body)', fontSize: 14, color: 'var(--t-ink)', fontStyle: 'italic' }}>
                    "I tune the dial the same way now. I never told him."
                  </div>
                  <div className="postmark" style={{ width: 64, height: 64, borderWidth: 2, padding: 4 }}>
                    <div className="pm-top" style={{ fontSize: 6 }}>verified</div>
                    <div className="pm-mid" style={{ fontSize: 9 }}>100%</div>
                    <div className="pm-bot" style={{ fontSize: 6 }}>yours</div>
                  </div>
                </div>
              )}
              {audience === 'audit' && (
                <div style={{ fontFamily: 'var(--t-mono)', fontSize: 11, color: 'var(--t-ink-soft)', lineHeight: 1.7 }}>
                  <div>q1 · phone greeting → "Pronto, who's calling…" · <span style={{ color: 'var(--t-verified)' }}>verbatim</span></div>
                  <div>q2 · notebook of names → "wrote down strangers' names" · <span style={{ color: 'var(--t-verified)' }}>paraphrased ✓</span></div>
                  <div>q3 · hands → "tuned the dial like a violin string" · <span style={{ color: 'var(--t-verified)' }}>verbatim</span></div>
                  <div>q4 · phrase → "world is wide…" · <span style={{ color: 'var(--t-verified)' }}>verbatim</span></div>
                  <div>q5 · what you didn't say → "I tune the dial…" · <span style={{ color: 'var(--t-verified)' }}>verbatim</span></div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn ghost sm" onClick={onClose}>cancel</button>
              <button className="btn primary" onClick={() => setStep('shared')}>↗ generate share link</button>
            </div>
          </>
        )}

        {step === 'shared' && (
          <div style={{ animation: 'fadein 360ms ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <StampMark color="var(--t-verified)">link · sealed</StampMark>
            </div>
            <div className="serif-italic" style={{ fontSize: 22, color: 'var(--t-ink)', textAlign: 'center', marginBottom: 18 }}>
              The trace is attached forever.
            </div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>share-trace link</div>
            <CopyLine url={url}/>

            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>or send to</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['email', 'sms', 'twitter', 'bluesky', 'qr code'].map(c => (
                  <button key={c} className="btn ghost sm" style={{ textTransform: 'uppercase' }}>{c}</button>
                ))}
              </div>
            </div>

            <div className="divider-flourish"><span className="ornament-glyph">·</span></div>

            <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, textAlign: 'center', letterSpacing: '0.14em' }}>
              audience · {audience === 'recipient' ? 'private viewer' : audience === 'public' ? 'public + verified badge' : 'full audit log'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn sm" onClick={onClose}>done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────── START OVER ───────────

function StartOverDialog({ onClose, confirm }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>esc · close</button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <StampMark>begin again</StampMark>
        </div>

        <h2 className="h-display tiny" style={{ textAlign: 'center', marginBottom: 14 }}>Start a new letter?</h2>
        <div className="body-prose" style={{ fontSize: 16, textAlign: 'center', marginBottom: 22 }}>
          This one is safe — already saved to your library. We'll begin fresh: a new moment, a new guide, a new spine.
        </div>

        <div className="plate" style={{ padding: '14px 18px', marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>this letter stays</div>
          <div className="serif-italic" style={{ fontSize: 17, color: 'var(--t-ink)' }}>For Tomas · Saturday</div>
          <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 10, marginTop: 4 }}>kept in library · share-link active</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button className="btn ghost sm" onClick={onClose}>not yet</button>
          <button className="btn primary" onClick={confirm}>begin again →</button>
        </div>

        <div className="muted" style={{ fontFamily: 'var(--t-mono)', fontSize: 9, textAlign: 'center', letterSpacing: '0.14em', marginTop: 18, textTransform: 'uppercase' }}>
          you can write a different letter for the same person, too
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DownloadDialog, SaveDialog, ShareDialog, StartOverDialog, StampMark, CopyLine });
