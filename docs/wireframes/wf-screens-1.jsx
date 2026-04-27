// Mean It — Screens 1 & 2: Pick the moment + Guide picker

// ─────────── PICK THE MOMENT ───────────

const PickMoment_A = () => (
  <div className="wf">
    <Chrome step={1} total={6}/>
    <div className="wf-body" style={{justifyContent:'center', gap:18}}>
      <div className="wf-eyebrow">a moment that matters</div>
      <div className="wf-h" style={{fontSize:34}}>
        Who are you<br/>writing for?
      </div>
      <input className="wf-input-stroke" placeholder="my grandma, Ines · 80 next month"/>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
        <span className="wf-eyebrow" style={{width:'100%'}}>occasion</span>
        {['birthday','eulogy','apology','love letter','just because','wedding'].map((o,i)=>
          <span key={o} className={'wf-tag '+(i===0?'wf-tag-accent':'')}>{o}</span>
        )}
      </div>
      <div style={{display:'flex', gap:8, marginTop:4}}>
        <span className="wf-eyebrow" style={{width:'100%'}}>form</span>
      </div>
      <div style={{display:'flex', gap:10}}>
        <div className="wf-card" style={{flex:1, alignItems:'center'}}>
          <div className="wf-h2">a poem</div>
          <div className="wf-mono" style={{fontSize:9}}>3 stanzas · ~80 words</div>
        </div>
        <div className="wf-card wf-card-soft" style={{flex:1, alignItems:'center'}}>
          <div className="wf-h2">a short letter</div>
          <div className="wf-mono" style={{fontSize:9}}>~150 words</div>
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
        <button className="wf-btn wf-btn-primary">pick a guide →</button>
      </div>
    </div>
    <Arrow style={{top:80, right:-10}} flip
      d="M 70 10 Q 30 20, 18 40"
      label="three short steps · no decisions about words yet"/>
  </div>
);

const PickMoment_B = () => (
  <div className="wf">
    <Chrome step={1} total={6}/>
    <div className="wf-body">
      <div className="wf-eyebrow">conversational onboarding</div>
      <div className="wf-h">Tell me what's going on.</div>
      <div className="wf-card wf-card-soft" style={{padding:14, gap:8}}>
        <div className="wf-p">
          My grandma turns 80 next month and I want to write her <span className="wf-highlight">a poem.</span> I'm not a poet.
        </div>
      </div>
      <div className="wf-eyebrow">i heard…</div>
      <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
        <span className="wf-tag wf-tag-accent">recipient · grandma</span>
        <span className="wf-tag wf-tag-accent">occasion · birthday (80)</span>
        <span className="wf-tag wf-tag-accent">form · poem</span>
        <span className="wf-tag" style={{borderStyle:'dashed'}}>tone · ?</span>
      </div>
      <div className="wf-p" style={{fontStyle:'italic', color:'var(--ink-faint)'}}>
        edit any pill to adjust — or keep going.
      </div>
      <div style={{flex:1}}/>
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <button className="wf-btn wf-btn-ghost">← edit</button>
        <button className="wf-btn wf-btn-primary">looks right →</button>
      </div>
    </div>
  </div>
);

const PickMoment_C = () => (
  <div className="wf">
    <Chrome step={1} total={6}/>
    <div className="wf-body" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start'}}>
      <div style={{gridColumn:'1/-1'}}>
        <div className="wf-eyebrow">choose by feeling, not category</div>
        <div className="wf-h" style={{marginTop:4}}>What kind of moment is it?</div>
      </div>
      {[
        {h:'a goodbye', s:'eulogy · final letter'},
        {h:'a celebration', s:'birthday · wedding'},
        {h:'a thank you', s:'gratitude · just because'},
        {h:'an apology', s:'making it right'},
        {h:'a love note', s:'partner · friend'},
        {h:'something else', s:'tell me more'},
      ].map(({h,s},i) => (
        <div key={i} className="wf-card" style={{cursor:'pointer'}}>
          <div className="wf-h2">{h}</div>
          <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>{s}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────── GUIDE PICKER ───────────

const guideMeta = [
  {id:'doc',  name:'The Documentarian',     sense:'memory, specifics, low-key', q:'"What did she always say when she answered the phone?"', best:'eulogy · legacy'},
  {id:'poet', name:'The Poet of Small Things', sense:'sensory noticing',         q:'"What\'s a smell that means home?"', best:'birthday · gratitude'},
  {id:'song', name:'The Songwriter',        sense:'unresolved feeling',         q:'"What didn\'t you get to say?"',     best:'love · apology'},
];

// VARIATION A — typography-first (no mascot)
const GuidePicker_A = () => (
  <div className="wf">
    <Chrome step={2} total={6}/>
    <div className="wf-body">
      <div className="wf-eyebrow">choose how you want to be paid attention to</div>
      <div className="wf-h scribble-under" style={{alignSelf:'flex-start'}}>Pick your guide.</div>
      <div className="wf-p">Each one listens differently. They never write for you.</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:8}}>
        {guideMeta.map((g,i) => (
          <div key={g.id} className="wf-card" style={{minHeight:180, position:'relative'}}>
            <div className="wf-eyebrow">guide · 0{i+1}</div>
            <div className="wf-h2" style={{lineHeight:1, marginTop:2}}>{g.name}</div>
            <hr className="wf-divider"/>
            <div className="wf-mono" style={{fontSize:9}}>pulls for · {g.sense}</div>
            <div className="wf-p" style={{fontSize:13, fontStyle:'italic', marginTop:6}}>{g.q}</div>
            <div style={{flex:1}}/>
            <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>best for · {g.best}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:10, marginTop:6}}>
        <button className="wf-btn wf-btn-ghost">+ create your own guide</button>
        <div style={{flex:1}}/>
        <button className="wf-btn wf-btn-primary">begin →</button>
      </div>
    </div>
    <Arrow style={{top:120, right:8}} flip
      d="M 70 8 Q 30 24, 14 44"
      label="quiet · serious moments respected"/>
  </div>
);

// VARIATION B — Duolingo-style mascot
const GuidePicker_B = () => (
  <div className="wf">
    <Chrome step={2} total={6}/>
    <div className="wf-body">
      <div className="wf-eyebrow">meet your guide</div>
      <div className="wf-h scribble-under" style={{alignSelf:'flex-start'}}>Three friends. Pick one.</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:8}}>
        {[
          {kind:'feather', name:'Wren',   sub:'the documentarian'},
          {kind:'blob',    name:'Pip',    sub:'the poet of small things'},
          {kind:'moon',    name:'Cassio', sub:'the songwriter'},
        ].map((g,i)=>(
          <div key={i} className="wf-card" style={{alignItems:'center', textAlign:'center', padding:14}}>
            <Mascot kind={g.kind} size={72}/>
            <div className="wf-h2" style={{marginTop:6}}>{g.name}</div>
            <div className="wf-mono" style={{fontSize:9, opacity:0.6}}>{g.sub}</div>
            <hr className="wf-divider" style={{width:'100%'}}/>
            <div className="wf-p" style={{fontSize:13, fontStyle:'italic'}}>{guideMeta[i].q}</div>
          </div>
        ))}
      </div>
      <div className="wf-card wf-card-soft" style={{flexDirection:'row', alignItems:'center', gap:10}}>
        <Mascot kind="blob" size={36}/>
        <div className="wf-p" style={{margin:0, fontSize:13}}>
          Hi — I'm Pip. I'll ask, you write. I never put words in your mouth. ✿
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end'}}>
        <button className="wf-btn wf-btn-primary">begin with Pip →</button>
      </div>
    </div>
    <VariantNote label="VARIANT B · mascot">
      Friendlier, but the personality may compete with somber moments.
    </VariantNote>
  </div>
);

// VARIATION C — abstract marks (compromise)
const GuidePicker_C = () => (
  <div className="wf">
    <Chrome step={2} total={6}/>
    <div className="wf-body">
      <div className="wf-eyebrow">three listeners</div>
      <div className="wf-h">Each one notices something different.</div>
      <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:6}}>
        {[
          {mark:'feather', n:'The Documentarian', s:'pulls for memory and specifics — eulogies, legacy'},
          {mark:'blob',    n:'The Poet of Small Things', s:'pulls for sensory noticing — birthdays, thanks'},
          {mark:'moon',    n:'The Songwriter', s:'pulls for unresolved feeling — love, apology'},
        ].map((g,i)=>(
          <div key={i} className="wf-card" style={{flexDirection:'row', alignItems:'center', gap:14}}>
            <Mascot kind={g.mark} size={48}/>
            <div style={{flex:1}}>
              <div className="wf-h2" style={{fontSize:18}}>{g.n}</div>
              <div className="wf-p" style={{fontSize:13, margin:'2px 0 0'}}>{g.s}</div>
            </div>
            <button className="wf-btn" style={{padding:'4px 10px', fontSize:13}}>preview ↗</button>
          </div>
        ))}
        <div className="wf-card wf-card-soft" style={{flexDirection:'row', alignItems:'center', gap:14, borderStyle:'dashed'}}>
          <div className="wf-mascot" style={{width:48, height:48, border:'1.5px dashed var(--ink-faint)', borderRadius:50}}>+</div>
          <div className="wf-p" style={{flex:1, fontSize:13, margin:0}}>Create your own guide — describe how you want to be listened to.</div>
          <button className="wf-btn wf-btn-ghost">start →</button>
        </div>
      </div>
    </div>
    <VariantNote label="VARIANT C · abstract mark"> a glyph, not a face — present without performing. </VariantNote>
  </div>
);

Object.assign(window, {
  PickMoment_A, PickMoment_B, PickMoment_C,
  GuidePicker_A, GuidePicker_B, GuidePicker_C,
});
