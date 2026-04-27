// Mean It — Screens 6, 7, 8: Render+Trace, Create-your-own-guide, Share import, Theme spectrum

// ─────────── RENDER + PROVENANCE TRACE ───────────

const Render_A = () => (
  <div className="wf midfi">
    <Chrome step={6} total={6} byline={100}/>
    <div className="wf-body" style={{padding:'40px 60px', alignItems:'center', justifyContent:'center', gap:18}}>
      <div className="wf-eyebrow" style={{textAlign:'center'}}>for ines · on her 80th</div>
      <div style={{maxWidth:480, textAlign:'center', fontFamily:'var(--serif)', fontSize:22, lineHeight:1.7, fontStyle:'italic'}}>
        <span className="wf-trace-line">Her hands always smelled</span><br/>
        <span className="wf-trace-line">like garlic and orange peel,</span><br/>
        <span className="wf-trace-line">and she'd press them to my cheeks</span><br/>
        <span className="wf-trace-line">before bed.</span>
        <br/><br/>
        <span className="wf-trace-line">Cousins got <em>amore</em>.</span><br/>
        <span className="wf-trace-line">I got <em>tesoro</em>.</span><br/>
        <span className="wf-trace-line">Treasure.</span>
        <br/><br/>
        <span className="wf-trace-line">May the kitchen still smell like that</span><br/>
        <span className="wf-trace-line">when she's a hundred.</span>
      </div>
      <div className="wf-mono" style={{fontSize:10, opacity:0.5, marginTop:24}}>hover any line · see your exact words</div>
      <div style={{display:'flex', gap:8, marginTop:6}}>
        <button className="wf-btn wf-btn-ghost" style={{fontSize:13}}>↓ download</button>
        <button className="wf-btn wf-btn-ghost" style={{fontSize:13}}>♡ save</button>
        <button className="wf-btn wf-btn-ghost" style={{fontSize:13}}>↗ share trace</button>
      </div>
    </div>
    {/* hover trace popover */}
    <div style={{position:'absolute', top:120, right:32, width:240, transform:'rotate(1deg)'}}>
      <div className="wf-card" style={{padding:10, background:'#fffdf2'}}>
        <div className="wf-mono" style={{fontSize:9, color:'var(--accent)'}}>trace · line 2</div>
        <div className="wf-mono" style={{fontSize:9, opacity:0.6, margin:'4px 0 2px'}}>question</div>
        <div className="wf-p" style={{fontSize:12, margin:0}}>"What's a smell that means home?"</div>
        <div className="wf-mono" style={{fontSize:9, opacity:0.6, margin:'8px 0 2px'}}>your verbatim answer</div>
        <div className="wf-p" style={{fontSize:12, margin:0, fontStyle:'italic'}}>"Her hands always smelled like garlic and orange peel. She'd press them to my cheeks before bed and I'd smell it on my pillow."</div>
        <hr className="wf-divider"/>
        <div className="wf-mono" style={{fontSize:9, color:'var(--verified)'}}>✓ exact substring · verified yours</div>
      </div>
    </div>
    <Arrow style={{top:140, left:24}} d="M 8 8 Q 30 30, 70 38" label="byline 100% — every word from your interview"/>
  </div>
);

// ─────────── CREATE YOUR OWN GUIDE ───────────

const CreateGuide_A = () => (
  <div className="wf">
    <Chrome theme="warm"/>
    <div className="wf-body" style={{flex:1, display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:18, padding:0}}>
      <div style={{padding:'18px 22px', borderRight:'1.25px dashed var(--ink-ghost)', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">create your own guide · symmetrical interview</div>
        <div className="wf-h2">Describe the kind of guide you want.</div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-p" style={{fontSize:13, margin:0}}>
            "Someone like my late uncle — gentle, curious, a librarian who made you feel important."
          </div>
        </div>
        <div className="wf-eyebrow" style={{marginTop:6}}>2 / 5 follow-ups</div>
        <div className="wf-card" style={{padding:10}}>
          <div className="wf-mono" style={{fontSize:9, color:'var(--accent)'}}>guide-generator</div>
          <div className="wf-p" style={{fontSize:13, margin:'4px 0 0'}}>What's a question your uncle would ask that no one else would?</div>
        </div>
        <input className="wf-input" placeholder="type your answer…" defaultValue="'Have you read anything strange this week?'"/>
        <div className="wf-card wf-card-soft" style={{padding:8, fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)'}}>
          ⓘ this generator refuses prompts that try to dismantle guardrails. immutable rules stay.
        </div>
      </div>
      <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:8, background:'#fffdf6'}}>
        <div className="wf-eyebrow">live preview · guide.md</div>
        <div className="wf-card" style={{padding:12, fontFamily:'var(--mono)', fontSize:10, lineHeight:1.6}}>
          <div style={{color:'var(--ink-faint)'}}>---</div>
          <div><span style={{color:'var(--accent)'}}>name:</span> The Librarian</div>
          <div><span style={{color:'var(--accent)'}}>sensibility:</span> gentle, curious...</div>
          <div><span style={{color:'var(--accent)'}}>voice_rules:</span></div>
          <div>  - patient with silence</div>
          <div>  - asks about books, walks, rooms</div>
          <div><span style={{color:'var(--accent)'}}>forbidden:</span> <span style={{color:'var(--ink-faint)'}}>(immutable)</span></div>
          <div>  - drafting any line</div>
          <div>  - completing your sentences</div>
          <div>  - more than 5 contiguous words</div>
          <div><span style={{color:'var(--accent)'}}>question_bank:</span> [generating…]</div>
          <div style={{color:'var(--ink-faint)'}}>---</div>
        </div>
        <div className="wf-eyebrow">test drive</div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-p" style={{fontSize:13, margin:0, fontStyle:'italic'}}>"Have you read anything strange this week?"</div>
          <div className="wf-mono" style={{fontSize:9, opacity:0.5, marginTop:4}}>sample question · sounds right?</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex', gap:8}}>
          <button className="wf-btn wf-btn-ghost" style={{flex:1}}>edit fields</button>
          <button className="wf-btn wf-btn-primary" style={{flex:1}}>save · share ↗</button>
        </div>
      </div>
    </div>
    <VariantNote label="META · the act of choosing how you're paid attention to is itself creative.">
      Generator interviews users the same way the main app does.
    </VariantNote>
  </div>
);

// ─────────── SHARE IMPORT ───────────

const ShareImport = () => (
  <div className="wf">
    <Chrome/>
    <div className="wf-body" style={{justifyContent:'center', alignItems:'center', gap:14}}>
      <div className="wf-mono" style={{fontSize:9, opacity:0.5, wordBreak:'break-all', maxWidth:380, textAlign:'center'}}>
        meanit.app/?guide=eJyrVk8s...gz9bA==
      </div>
      <div className="wf-h" style={{textAlign:'center'}}>Someone shared a guide with you.</div>
      <div className="wf-card" style={{maxWidth:340, alignItems:'center', padding:18}}>
        <Mascot kind="mark" size={48}/>
        <div className="wf-h2" style={{marginTop:6}}>The Librarian</div>
        <div className="wf-p" style={{textAlign:'center', fontSize:13}}>gentle, curious — pulls for what nobody else asks.</div>
        <hr className="wf-divider" style={{width:'100%'}}/>
        <div className="wf-p" style={{fontSize:12, fontStyle:'italic'}}>"Have you read anything strange this week?"</div>
      </div>
      <div className="wf-card wf-card-soft" style={{maxWidth:340, padding:10, flexDirection:'row', gap:8, alignItems:'center'}}>
        <span style={{color:'var(--verified)', fontSize:18}}>✓</span>
        <div className="wf-mono" style={{fontSize:10}}>guardrails re-applied on import · forbidden list locked</div>
      </div>
      <div style={{display:'flex', gap:10, marginTop:6}}>
        <button className="wf-btn wf-btn-ghost">decline</button>
        <button className="wf-btn wf-btn-primary">add to my picker</button>
      </div>
    </div>
  </div>
);

// ─────────── THEME SLIDER SHOWCASE ───────────

const ThemeSpectrum = () => {
  const themes = [
    {cls:'theme-cute',   name:'cute',    sub:'kid birthdays'},
    {cls:'theme-warm',   name:'warm',    sub:'family · default'},
    {cls:'theme-quiet',  name:'quiet',   sub:'apologies · letters'},
    {cls:'theme-noir',   name:'noir',    sub:'love · longing'},
    {cls:'theme-gothic', name:'gothic',  sub:'eulogies · weight'},
  ];
  return (
    <div className="wf" style={{background:'#fbf7ef'}}>
      <Chrome/>
      <div className="wf-body" style={{gap:10}}>
        <div className="wf-eyebrow">theme · how the page wants to be looked at</div>
        <div className="wf-h scribble-under" style={{alignSelf:'flex-start'}}>Slide it.</div>
        <div className="wf-p">a single user-controlled spectrum. same words; the page changes its weight.</div>

        {/* slider track */}
        <div style={{padding:'12px 6px', marginTop:4}}>
          <div style={{position:'relative', height:36, display:'flex', alignItems:'center'}}>
            <div style={{position:'absolute', left:0, right:0, height:4, borderRadius:2,
              background:'linear-gradient(90deg, #fef0f3, #f6f1e8, #f1f1ee, #1a1814, #16131a)'}}/>
            {themes.map((t,i)=>(
              <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative'}}>
                <div style={{width:14, height:14, borderRadius:50, background:'var(--paper-card)',
                             border: '1.5px solid '+(i===2?'var(--accent)':'var(--ink)'),
                             boxShadow: i===2?'0 0 0 4px var(--accent-soft)':'none'}}/>
              </div>
            ))}
          </div>
          <div style={{display:'flex', marginTop:6}}>
            {themes.map((t,i)=>(
              <div key={i} style={{flex:1, textAlign:'center'}}>
                <div className="wf-mono" style={{fontSize:9, color: i===2?'var(--accent)':'var(--ink-faint)'}}>
                  {t.name}
                </div>
                <div className="wf-mono" style={{fontSize:8, opacity:0.5}}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* mini-previews — same poem, 5 themes */}
        <div className="wf-eyebrow" style={{marginTop:6}}>same poem · five readings</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8}}>
          {themes.map((t,i)=>(
            <div key={i} className={t.cls} style={{
              background:'var(--t-bg)', color:'var(--t-ink)',
              border:'1.25px solid '+(i===2?'var(--accent)':'var(--ink-faint)'),
              borderRadius:4, padding:'12px 10px', minHeight:140,
              display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center', gap:4,
              fontFamily: i<2?'var(--hand)': i===2?'var(--serif)':'"Iowan Old Style", Georgia, serif',
              fontStyle: i>=3?'italic':'normal',
            }}>
              <div style={{fontSize:11, opacity:0.7}}>for ines</div>
              <div style={{fontSize: i===0?15: i>=3?13:14, lineHeight:1.5}}>
                garlic and<br/>orange peel
              </div>
              <div style={{fontSize:8, color:'var(--t-accent)', marginTop:6, letterSpacing:'0.1em', textTransform:'uppercase'}}>{t.name}</div>
            </div>
          ))}
        </div>
        <div className="wf-p" style={{fontSize:12, fontStyle:'italic', color:'var(--ink-faint)'}}>
          guide also shifts: cute → playful prompts; gothic → patient with silence.
        </div>
      </div>
    </div>
  );
};

// ─────────── MID-FI CHOSEN DIRECTION ───────────

const MidFi_Render = () => (
  <div className="wf midfi" style={{background:'#faf6ec'}}>
    <div style={{padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center',
                 borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
      <div style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:18}}>Mean It<span style={{color:'var(--accent)'}}>.</span></div>
      <div style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,0,0,0.5)'}}>
        100% yours · trace ✓
      </div>
    </div>
    <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 60px'}}>
      <div style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
                   color:'rgba(0,0,0,0.4)', marginBottom:30}}>for ines, on her 80th</div>
      <div style={{fontFamily:'"Cormorant Garamond", "Iowan Old Style", Georgia, serif', fontSize:26, lineHeight:1.7,
                   fontStyle:'italic', textAlign:'center', maxWidth:520, color:'#1a1612'}}>
        Her hands always smelled<br/>
        like garlic and orange peel,<br/>
        and she'd press them to my cheeks<br/>
        before bed.
        <div style={{height:24}}/>
        Cousins got <em>amore</em>.<br/>
        I got <em>tesoro</em>.<br/>
        Treasure.
        <div style={{height:24}}/>
        May the kitchen still smell like that<br/>
        when she's a hundred.
      </div>
      <div style={{marginTop:40, fontFamily:'var(--mono)', fontSize:9, color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em'}}>
        every line · hover · see the question that prompted it
      </div>
    </div>
  </div>
);

const MidFi_Interview = () => (
  <div className="wf midfi" style={{background:'#faf6ec'}}>
    <div style={{padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center',
                 borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
      <div style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:18}}>Mean It<span style={{color:'var(--accent)'}}>.</span></div>
      <div style={{display:'flex', gap:14, fontFamily:'var(--mono)', fontSize:10, color:'rgba(0,0,0,0.5)', letterSpacing:'0.1em', textTransform:'uppercase'}}>
        <span>q4 / 10</span><span>·</span><span>poet of small things</span>
      </div>
    </div>
    <div style={{flex:1, display:'grid', gridTemplateColumns:'1.1fr 1fr'}}>
      <div style={{padding:'40px 32px 40px 48px', borderRight:'1px solid rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', justifyContent:'center', gap:14}}>
        <div style={{fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(0,0,0,0.4)'}}>
          the guide is asking
        </div>
        <div style={{fontFamily:'var(--serif)', fontSize:30, lineHeight:1.25, fontStyle:'italic', color:'#1a1612'}}>
          What's a smell that<br/>means home, when<br/>you think of her?
        </div>
        <div style={{fontFamily:'"Iowan Old Style", Georgia, serif', fontSize:13, lineHeight:1.6, fontStyle:'italic',
                     color:'rgba(0,0,0,0.55)', borderLeft:'2px solid var(--accent)', paddingLeft:12, marginTop:8}}>
          The best small details are ones only one person knew.
        </div>
      </div>
      <div style={{padding:'40px 48px 40px 32px', display:'flex', flexDirection:'column', justifyContent:'center', gap:14}}>
        <div style={{fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(0,0,0,0.4)'}}>
          your turn
        </div>
        <div style={{fontFamily:'"Iowan Old Style", Georgia, serif', fontSize:18, lineHeight:1.6, color:'#1a1612'}}>
          Her hands always smelled like garlic and orange peel. She'd press them to my cheeks before bed and I'd smell it on my pillow.
          <span style={{display:'inline-block', width:1.5, height:18, background:'#1a1612', marginLeft:2, verticalAlign:'middle', animation:'blink 1s infinite'}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
          <span style={{fontFamily:'var(--mono)', fontSize:9, color:'rgba(0,0,0,0.4)'}}>33 words · all yours</span>
          <button style={{background:'var(--accent)', color:'#fff8ee', border:'none', padding:'8px 18px',
                          fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, cursor:'pointer', borderRadius:2}}>
            next →
          </button>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  Render_A,
  CreateGuide_A,
  ShareImport,
  ThemeSpectrum,
  MidFi_Render,
  MidFi_Interview,
});
