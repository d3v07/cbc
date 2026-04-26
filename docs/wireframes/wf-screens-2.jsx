// Mean It — Screens 3, 4, 5: Interview, Spine, Drafting

// ─────────── INTERVIEW (split layout per user pick) ───────────

const Interview_A = () => (
  <div className="wf">
    <Chrome step={3} total={6} byline={42}/>
    <div className="wf-body" style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:0}}>
      {/* LEFT — guide */}
      <div style={{padding:'18px 18px 18px 22px', borderRight:'1.25px dashed var(--ink-ghost)', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">guide · poet of small things</div>
        <div className="wf-h2" style={{fontSize:22, lineHeight:1.2}}>What's a smell that means home, when you think of her?</div>
        <div className="wf-p" style={{fontSize:13, fontStyle:'italic', color:'var(--ink-faint)', borderLeft:'2px solid var(--accent)', paddingLeft:8}}>
          a meta-note · the best small details are ones only one person knew.
        </div>
        <div style={{flex:1}}/>
        <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>question 4 of ~10 · adapting to your answers</div>
      </div>
      {/* RIGHT — user */}
      <div style={{padding:'18px 22px 18px 6px', display:'flex', flexDirection:'column', gap:8}}>
        <div className="wf-eyebrow">your turn</div>
        <div className="wf-card" style={{flex:1, padding:14, fontFamily:'var(--hand-body)', fontSize:15, lineHeight:1.5}}>
          Her hands always smelled like garlic and orange peel. She'd press them to my cheeks before bed and I'd smell it on my pillow.<span style={{borderLeft:'2px solid var(--ink)', marginLeft:1, animation:'blink 1s infinite'}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span className="wf-mono" style={{fontSize:9, opacity:0.5}}>33 words · all yours</span>
          <button className="wf-btn">next question →</button>
        </div>
        <div className="wf-card wf-card-soft" style={{padding:8, fontSize:12, fontStyle:'italic', color:'var(--accent)'}}>
          ✦ that line — "garlic and orange peel" — I'm holding onto it.
        </div>
      </div>
    </div>
    <Arrow style={{bottom:60, left:'46%'}}
      d="M 8 8 Q 28 30, 70 38"
      label="guide mirrors striking phrases · never drafts"/>
  </div>
);

const Interview_B = () => (
  <div className="wf">
    <Chrome step={3} total={6} byline={42}/>
    <div className="wf-body" style={{flex:1, display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:16, padding:0}}>
      <div style={{padding:'18px 18px 18px 22px', borderRight:'1.25px dashed var(--ink-ghost)', display:'flex', flexDirection:'column', gap:8}}>
        <div className="wf-eyebrow">conversation</div>
        {[
          {who:'guide', t:'What did she always say when she answered the phone?'},
          {who:'you', t:'"Pronto, tesoro" — Italian for hello, treasure.'},
          {who:'guide', t:'Hold "tesoro" for a second. Did she ever call anyone else that?'},
          {who:'you', t:'Just me. My cousins got "amore."'},
          {who:'guide', t:'What\'s a smell that means home, when you think of her?'},
        ].map((m,i)=>(
          <div key={i} style={{
            alignSelf: m.who==='you'?'flex-end':'flex-start',
            maxWidth:'88%',
            background: m.who==='you'?'var(--paper)':'var(--paper-card)',
            border:'1.25px solid '+(m.who==='you'?'var(--ink)':'var(--ink-faint)'),
            borderRadius:6, padding:'7px 10px',
            fontFamily: m.who==='you'?'var(--hand-body)':'var(--hand)',
            fontSize:13, lineHeight:1.4,
            boxShadow: m.who==='you'?'1.5px 1.5px 0 var(--ink)':'none',
          }}>{m.t}</div>
        ))}
        <div className="wf-card" style={{padding:8, marginTop:6}}>
          <input className="wf-input-stroke" style={{fontSize:14}} placeholder="type your answer…" defaultValue="Garlic and orange peel."/>
        </div>
      </div>
      <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">phrases the guide is holding</div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-p" style={{fontSize:13, margin:0}}>"<span className="wf-highlight">pronto, tesoro</span>"</div>
          <div className="wf-mono" style={{fontSize:8, opacity:0.5, marginTop:2}}>q1 · verbatim from your answer</div>
        </div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-p" style={{fontSize:13, margin:0}}>"<span className="wf-highlight">just me. cousins got amore.</span>"</div>
          <div className="wf-mono" style={{fontSize:8, opacity:0.5, marginTop:2}}>q2 · spine candidate</div>
        </div>
        <div style={{flex:1}}/>
        <div className="wf-eyebrow">progress</div>
        <div style={{display:'flex', gap:3}}>
          {Array.from({length:10}).map((_,i)=>
            <div key={i} style={{flex:1, height:6, background: i<4?'var(--accent)':'var(--ink-ghost)', borderRadius:1}}/>
          )}
        </div>
        <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>q4 / ~10 · {/* — */}guide may pivot if answers go thin</div>
      </div>
    </div>
    <VariantNote label="CHOSEN · split">turn-taking left, "what guide is holding" right.</VariantNote>
  </div>
);

const Interview_C = () => (
  <div className="wf">
    <Chrome step={3} total={6} byline={42}/>
    <div className="wf-body" style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:0}}>
      <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:10, background:'var(--paper)'}}>
        <div className="wf-eyebrow">guide · documentarian</div>
        <div className="wf-h2">What's a thing he did that nobody else would have done?</div>
        <div className="wf-p" style={{fontSize:12, color:'var(--ink-faint)', marginTop:6}}>
          (still here. take your time.)
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex', gap:6}}>
          <button className="wf-btn wf-btn-ghost" style={{fontSize:12, padding:'4px 10px'}}>↺ rephrase</button>
          <button className="wf-btn wf-btn-ghost" style={{fontSize:12, padding:'4px 10px'}}>↷ skip</button>
        </div>
      </div>
      <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">your answer · q4 / ~10</div>
        <textarea className="wf-input" style={{flex:1, resize:'none', fontFamily:'var(--hand-body)', fontSize:14, lineHeight:1.5}}
          defaultValue="He used to leave little notes in my school lunch box. Every single day, in red pen — sometimes just a smiley face, sometimes a riddle."/>
        <div className="wf-mono" style={{fontSize:9, opacity:0.5}}>everything you type stays yours · auditable later</div>
      </div>
    </div>
    <VariantNote label="VARIANT · focused">one question, one answer, no chat history.</VariantNote>
  </div>
);

// ─────────── SPINE + STRUCTURE ───────────

const SpineScreen = () => (
  <div className="wf">
    <Chrome step={4} total={6} byline={58}/>
    <div className="wf-body">
      <div className="wf-eyebrow">spine · the line everything else hangs from</div>
      <div className="wf-h scribble-under" style={{alignSelf:'flex-start'}}>Pick the line that's the heart of it.</div>
      <div className="wf-p">three phrases — all your own words. one of them is the spine of this poem.</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:6}}>
        {[
          {t:'her hands always smelled like garlic and orange peel', src:'q4 · what smells like home', picked:true},
          {t:'pronto, tesoro', src:'q1 · what she said on the phone'},
          {t:'just me — cousins got amore', src:'q2 · only-one-person details'},
        ].map((p,i)=>(
          <div key={i} className="wf-card" style={{
            padding:14, position:'relative',
            border: p.picked?'1.5px solid var(--accent)':'1.5px solid var(--ink)',
            boxShadow: p.picked?'2px 2px 0 var(--accent)':'1.5px 1.5px 0 var(--ink)',
          }}>
            <div className="wf-eyebrow">phrase 0{i+1}</div>
            <div className="wf-p" style={{fontSize:16, fontStyle:'italic', margin:'4px 0 6px'}}>"{p.t}"</div>
            <hr className="wf-divider"/>
            <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>from · {p.src}</div>
            {p.picked && <div className="wf-tag wf-tag-accent" style={{position:'absolute', top:-10, right:8}}>this is the spine</div>}
          </div>
        ))}
      </div>
      <div className="wf-eyebrow" style={{marginTop:8}}>structure the guide proposes</div>
      <div className="wf-card wf-card-soft" style={{flexDirection:'row', gap:14, padding:14}}>
        {['memory · the smell','feeling · what it means now','wish · for this birthday'].map((s,i)=>(
          <div key={i} style={{flex:1, display:'flex', flexDirection:'column', gap:4}}>
            <div className="wf-mono" style={{fontSize:9, color:'var(--accent)'}}>stanza {i+1}</div>
            <div className="wf-h2" style={{fontSize:16}}>{s}</div>
            <div className="wf-ph" style={{height:46, marginTop:4}}>your words go here</div>
          </div>
        ))}
      </div>
      <div className="wf-p" style={{fontSize:12, fontStyle:'italic', color:'var(--ink-faint)'}}>
        ← swap any stanza · ← drop one · the guide proposes, you decide.
      </div>
      <div style={{display:'flex', justifyContent:'flex-end'}}>
        <button className="wf-btn wf-btn-primary">draft →</button>
      </div>
    </div>
  </div>
);

// ─────────── DRAFTING ───────────

const Drafting_A = () => (
  <div className="wf">
    <Chrome step={5} total={6} byline={87}/>
    <div className="wf-body" style={{flex:1, display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, padding:0}}>
      <div style={{padding:'18px 18px 18px 22px', borderRight:'1.25px dashed var(--ink-ghost)', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">your draft · stanza 1 of 3</div>
        <div style={{flex:1, fontFamily:'var(--hand-body)', fontSize:16, lineHeight:1.7, color:'var(--ink)'}}>
          Her hands always smelled<br/>
          like <u style={{textDecorationStyle:'wavy', textDecorationColor:'var(--accent)'}}>garlic and orange peel</u>,<br/>
          and the world was simpler then —<br/>
          <span style={{background:'var(--accent-soft)'}}>forever in our hearts.</span>
        </div>
        <div className="wf-mono" style={{fontSize:9, opacity:0.5}}>87% verified yours · keep going</div>
      </div>
      <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:10}}>
        <div className="wf-eyebrow">guide · critique</div>
        <div className="wf-card" style={{padding:10, borderColor:'var(--accent)', boxShadow:'2px 2px 0 var(--accent)'}}>
          <div className="wf-mono" style={{fontSize:9, color:'var(--accent)'}}>cliché · last line</div>
          <div className="wf-p" style={{fontSize:13, margin:'4px 0'}}>"forever in our hearts" is a stock phrase. you noticed garlic on a pillow — keep going specific.</div>
          <div style={{display:'flex', gap:6}}>
            <button className="wf-btn wf-btn-ghost" style={{fontSize:12, padding:'3px 8px'}}>cut it</button>
            <button className="wf-btn wf-btn-ghost" style={{fontSize:12, padding:'3px 8px'}}>i'll keep it</button>
          </div>
        </div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-mono" style={{fontSize:9}}>question · line 3</div>
          <div className="wf-p" style={{fontSize:13, margin:'4px 0 0'}}>"the world was simpler then" — did you mean simpler, or quieter? both are yours, just choose.</div>
        </div>
        <div className="wf-card wf-card-soft" style={{padding:10}}>
          <div className="wf-mono" style={{fontSize:9, color:'var(--verified)'}}>✓ verified yours</div>
          <div className="wf-p" style={{fontSize:13, margin:'4px 0 0'}}>"garlic and orange peel" — direct from q4. keep it.</div>
        </div>
        <div style={{flex:1}}/>
        <button className="wf-btn">render the artifact →</button>
      </div>
    </div>
    <VariantNote label="VARIANT A · streaming critique">guide flags as you type. never substitutes.</VariantNote>
  </div>
);

const Drafting_B = () => (
  <div className="wf">
    <Chrome step={5} total={6} byline={87}/>
    <div className="wf-body" style={{flex:1, padding:0, display:'flex', flexDirection:'column'}}>
      <div style={{padding:'14px 22px', borderBottom:'1.25px dashed var(--ink-ghost)'}}>
        <div className="wf-eyebrow">change history · scrub through your edits</div>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
          <span className="wf-mono" style={{fontSize:9, opacity:0.6}}>blank</span>
          <div style={{flex:1, height:24, position:'relative', display:'flex', alignItems:'center'}}>
            <div style={{position:'absolute', left:0, right:0, height:2, background:'var(--ink-faint)'}}/>
            {[5,18,34,52,68,82,95].map((p,i)=>(
              <div key={i} style={{position:'absolute', left:p+'%', width:10, height:10, borderRadius:50,
                background: i===5?'var(--accent)':'var(--paper-card)', border:'1.5px solid var(--ink)'}}/>
            ))}
          </div>
          <span className="wf-mono" style={{fontSize:9, opacity:0.6}}>now</span>
        </div>
        <div className="wf-mono" style={{fontSize:9, opacity:0.5, marginTop:6}}>v6 · 4 min ago · added "and the world was simpler then"</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', flex:1}}>
        <div style={{padding:'18px 22px', borderRight:'1.25px dashed var(--ink-ghost)', fontFamily:'var(--hand-body)', fontSize:16, lineHeight:1.7}}>
          Her hands always smelled<br/>like <span className="wf-highlight">garlic and orange peel</span>,<br/>
          <span style={{background:'var(--verified-soft)', padding:'0 2px'}}>and the world was simpler then —</span><br/>
          forever in our hearts.
        </div>
        <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:8}}>
          <div className="wf-eyebrow">guide · just one note</div>
          <div className="wf-card">
            <div className="wf-p" style={{fontSize:13, margin:0}}>the new line is yours — but "forever in our hearts" still flags. cut?</div>
          </div>
          <div className="wf-mono" style={{fontSize:9, marginTop:6}}>diff vs v5</div>
          <div className="wf-card wf-card-soft" style={{padding:8, fontFamily:'var(--mono)', fontSize:11}}>
            <div style={{color:'var(--verified)'}}>+ and the world was simpler then —</div>
            <div style={{color:'var(--ink-faint)'}}>  forever in our hearts.</div>
          </div>
        </div>
      </div>
    </div>
    <VariantNote label="VARIANT B · drafting timeline">scrub your own history — addresses 'visual change' idea.</VariantNote>
  </div>
);

const Drafting_C = () => (
  <div className="wf">
    <Chrome step={5} total={6} byline={87}/>
    <div className="wf-body" style={{flex:1, padding:'18px 22px', display:'flex', flexDirection:'column', gap:14}}>
      <div className="wf-eyebrow">single column · request a critique when you're ready</div>
      <div style={{flex:1, fontFamily:'var(--hand-body)', fontSize:18, lineHeight:1.8, padding:'10px 16px',
                   border:'1.25px dashed var(--ink-ghost)', borderRadius:4, background:'#fffdf6'}}>
        Her hands always smelled like garlic and orange peel.<br/>
        She'd press them to my cheeks before bed,<br/>
        and I'd smell it on my pillow until morning.
      </div>
      <div style={{display:'flex', gap:10, alignItems:'center'}}>
        <button className="wf-btn wf-btn-primary">ask the guide for a critique ✦</button>
        <span className="wf-mono" style={{fontSize:9, opacity:0.5}}>no streaming · less interruptive</span>
      </div>
    </div>
    <VariantNote label="VARIANT C · cut-line fallback">simpler if streaming critique runs over budget.</VariantNote>
  </div>
);

Object.assign(window, {
  Interview_A, Interview_B, Interview_C,
  SpineScreen,
  Drafting_A, Drafting_B, Drafting_C,
});
