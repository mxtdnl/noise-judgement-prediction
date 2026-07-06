// app.jsx — main shell + station map + library + games + final reports + persistence

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "difficulty": "regular",
  "bayesScenario": 0,
  "showHints": true,
  "compactNav": false
}/*EDITMODE-END*/;

const STATIONS = [
  { id:'signal',      n:'01', label:'Spot the Signal',   blurb:'Tell trends from noise',            concept:'Signal vs. noise',          color:'var(--noise)',    moduleKey:'signal' },
  { id:'calibration', n:'02', label:'Calibration Quiz',  blurb:'How sure are you, really?',         concept:'Confidence calibration',    color:'var(--signal)',   moduleKey:'calibration' },
  { id:'brier',       n:'03', label:'Brier Arena',       blurb:'Probabilities, scored',             concept:'Brier scoring rule',        color:'var(--gold)',     moduleKey:'brier' },
  { id:'baseRate',    n:'04', label:'Base Rate Trap',    blurb:'The 1%-disease puzzle',             concept:'Priors & base rates',       color:'var(--noise-2)',  moduleKey:'baseRate' },
  { id:'bayes',       n:'05', label:'Bayesian Theater',  blurb:'Move beliefs with evidence',        concept:'Bayesian updating',         color:'var(--signal-2)', moduleKey:'bayes' },
  { id:'crowd',       n:'06', label:'Wisdom of Crowds',  blurb:'You vs. the aggregate',             concept:'Aggregation & sample size', color:'var(--leaf)',     moduleKey:'crowd' },
];

const SIMS = [
  // Drills (short)
  { id:'tournament', label:"Forecaster's Tournament", blurb:'Rapid probability calls, scored by Brier', concept:'Brier scoring · category calibration', cat:'drills', color:'var(--gold)' },
  { id:'drift',      label:'Drift Detector',          blurb:'Mark where a time series shifts',         concept:'Change-point detection',            cat:'drills', color:'var(--noise)' },
  { id:'anchor',     label:'Anchoring Lab',           blurb:'Measure your own anchoring bias',         concept:'Anchoring · cognitive bias',        cat:'drills', color:'var(--gold)' },
  { id:'crowdVs',    label:'Versus the Crowd',        blurb:'Update toward the crowd · or not',        concept:'Aggregation · independence',        cat:'drills', color:'var(--leaf)' },
  // Domain (medium)
  { id:'election',   label:'Election Night',          blurb:'Update P(D wins) as precincts report',    concept:'Sequential Bayesian · sample size',  cat:'domain', color:'var(--signal)' },
  { id:'outbreak',   label:'Outbreak Tracker',        blurb:'Forecast an epidemic peak in real time',  concept:'Exponential growth · sequential updates', cat:'domain', color:'var(--noise)' },
  { id:'abTest',     label:'A/B Test Director',       blurb:'STOP / KEEP / SHIP on partial data',       concept:'Hypothesis testing · stopping rules', cat:'domain', color:'var(--signal)' },
  { id:'hiring',     label:'Hiring Roulette',         blurb:'Read 12 candidates with budget for 5',     concept:'Signal extraction · base rates',     cat:'domain', color:'var(--signal-2)' },
  // Decision (deep)
  { id:'detective',  label:'Detective',               blurb:'Solve a murder by likelihood ratios',     concept:'Bayesian reasoning · evidence',     cat:'decision', color:'var(--noise-2)' },
  { id:'trial',      label:'Trial Lawyer',            blurb:'Update on evidence, set a threshold',     concept:'Sequential Bayes · decision threshold', cat:'decision', color:'var(--noise-2)' },
  { id:'stock',      label:'Stock Picker',            blurb:'Bet your bankroll on noisy signals',      concept:'Calibration under risk',            cat:'decision', color:'var(--gold)' },
  { id:'vc',         label:'VC Portfolio',            blurb:'Allocate $10M across 8 startups',         concept:'Power-law payoffs · diversification', cat:'decision', color:'var(--gold)' },
  { id:'inspector',  label:'Inspector',               blurb:'Tune a fraud detector\'s threshold',      concept:'Sensitivity vs specificity',        cat:'decision', color:'var(--leaf)' },
  { id:'whistle',    label:'Whistleblower',           blurb:'Five rumors, varying independence',       concept:'Correlated evidence',               cat:'decision', color:'var(--noise-2)' },
];

const SIM_CATEGORIES = [
  { id:'drills',   label:'Quick drills',     blurb:'5-10 minute mini-games on a single skill' },
  { id:'domain',   label:'Domain sims',      blurb:'Longer, scenario-based simulations' },
  { id:'decision', label:'Decision sims',    blurb:'Multi-step reasoning under information' },
];

// ─── Persistence ────────────────────────────────────────────────────────
const STORAGE_KEY = 'signal-noise-lab/v2';

const loadState = () => {
  const fallback = { scores:{}, modulesSeen:{}, gameScores:{}, simsUnlocked:false, libraryModulesSeen:{} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) { return fallback; }
};
const saveState = (state) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
};

// ─── Logo + Topbar ──────────────────────────────────────────────────────
const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="16" fill="var(--ink)"/>
    <path d="M3 19 Q 7 11, 11 19 T 19 19 T 27 19 T 31 19" fill="none" stroke="var(--noise)" strokeWidth="1.4" strokeLinecap="round" opacity=".8"/>
    <path d="M 5 17 L 11 17 L 14 9 L 20 25 L 23 17 L 29 17" fill="none" stroke="var(--bg-card)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Topbar = ({ current, scores, gameScores, onJump, onHome, t, onReset }) => {
  const playedSims = Object.keys(gameScores).length;
  return (
    <div className="topbar">
      <div style={{ maxWidth:1320, margin:'0 auto', padding:'14px 28px', display:'flex', alignItems:'center', gap:18 }}>
        <button onClick={onHome} className="btn" style={{ display:'flex', alignItems:'center', gap:10, background:'transparent', padding:0 }}>
          <Logo/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1.05 }}>
            <span className="serif" style={{ fontWeight:600, letterSpacing:'-.02em', fontSize:21 }}>Signal &amp; Noise Lab</span>
            <span className="serif" style={{ fontSize:11, fontStyle:'italic', color:'var(--ink-3)', fontWeight:400, marginTop:2 }}>Maxted Neal</span>
          </div>
        </button>
        <div style={{ flex:1, display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
          <NavLink active={current === 'home'} onClick={onHome}>Home</NavLink>
          <NavLink active={current === 'library' || current?.startsWith('library-')} onClick={()=>onJump('library')}>Library</NavLink>
          <NavLink active={SIMS.find(s=>s.id===current)} onClick={()=>onJump('sim-shelf')}>Simulations</NavLink>
          <NavLink active={current === 'report' || current === 'sim-report'} onClick={()=>onJump('report')}>Report</NavLink>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>
            {Object.keys(scores).length}/{STATIONS.length} · {playedSims} sims
          </span>
          {(Object.keys(scores).length > 0 || playedSims > 0) && (
            <button onClick={onReset} className="btn" title="Reset progress"
              style={{ background:'transparent', color:'var(--ink-4)', padding:'4px 8px', fontSize:12, borderRadius:6 }}>↺</button>
          )}
        </div>
      </div>
    </div>
  );
};

const NavLink = ({ active, onClick, children }) => (
  <button onClick={onClick} className="btn" style={{
    padding:'8px 14px', borderRadius:999, fontSize:13.5, fontWeight:500,
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--bg-card)' : 'var(--ink-2)',
    border:`1px solid ${active ? 'var(--ink)' : 'transparent'}`,
  }}>{children}</button>
);

// ─── Password unlock ────────────────────────────────────────────────────
const PasswordUnlock = ({ onUnlock }) => {
  const [val, setVal] = React.useState('');
  const [err, setErr] = React.useState(false);
  const submit = () => {
    if (val.trim().toLowerCase() === 'prediction') { onUnlock(); setErr(false); }
    else { setErr(true); setTimeout(()=>setErr(false), 1400); }
  };
  return (
    <div style={{ padding:'18px 22px', borderRadius:14, background:'var(--bg-card)', border:'1px dashed var(--line-2)', marginBottom:24, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
      <div style={{ flex:'1 1 280px', minWidth:240 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:4 }}>Instructor unlock</div>
        <div style={{ fontSize:14, color:'var(--ink-2)' }}>Have a course password? Skip the prerequisite and jump straight to simulations.</div>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && submit()}
          placeholder="password"
          style={{ padding:'10px 14px', borderRadius:10, fontSize:14, border:`1.5px solid ${err ? 'var(--noise)' : 'var(--line-2)'}`, background:'var(--bg-card)', color:'var(--ink)', outline:'none', fontFamily:'"Geist Mono",monospace', width:180 }}/>
        <Button onClick={submit} variant="soft">Unlock</Button>
        {err && <span style={{ fontSize:12, color:'var(--bad)' }}>incorrect</span>}
      </div>
    </div>
  );
};

// ─── Home page ──────────────────────────────────────────────────────────
const Home = ({ onStart, onLearn, onOpenLibrary, onOpenSimShelf, scores, gameScores, modulesSeen, libraryModulesSeen, simsUnlocked, onUnlockSims, onJump }) => {
  const baseDone = Object.keys(scores).length >= STATIONS.length;
  const simsAccessible = baseDone || simsUnlocked;
  const playedSims = Object.keys(gameScores).length;

  return (
    <div style={{ maxWidth:1240, margin:'0 auto', padding:'56px 28px 80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <Chip tone="gold">Forecasting Lab · for non-stats undergrads</Chip>
        <Chip tone="signal">6 core · 20+ concepts · 14 sims</Chip>
      </div>
      <h1 className="serif" style={{ margin:0, fontSize:64, lineHeight:1.02, letterSpacing:'-.03em', maxWidth:900 }}>
        Learn to <em>see</em> through the noise.
      </h1>
      <p style={{ fontSize:19, color:'var(--ink-2)', maxWidth:680, marginTop:18, lineHeight:1.5 }}>
        Six core exercises train the essential skills behind good forecasting. An optional concept library covers 20+ more ideas. Once you're warm, 14 simulations test all of it in scenarios.
      </p>

      <div style={{ display:'flex', gap:12, marginTop:28, alignItems:'center', flexWrap:'wrap' }}>
        <Button size="lg" onClick={()=>onStart(STATIONS[0].id)} variant="primary">
          {Object.keys(scores).length === 0 ? 'Begin →' : Object.keys(scores).length < STATIONS.length ? 'Continue lab →' : 'See report →'}
        </Button>
        <Button size="lg" variant="ghost" onClick={onOpenLibrary}>Browse concept library</Button>
        {(Object.keys(scores).length > 0 || playedSims > 0) && (
          <Button size="lg" variant="ghost" onClick={()=>onJump('report')}>Lab report</Button>
        )}
      </div>

      {/* Core stations */}
      <SectionHeader label="Core stations" sub="concept + exercise · 6 stations"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
        {STATIONS.map((s) => {
          const done = scores[s.id] != null;
          const learned = modulesSeen[s.moduleKey];
          return (
            <div key={s.id} className="card" style={{
              padding:'22px 24px 18px', borderRadius:22, position:'relative', overflow:'hidden',
              minHeight:200, display:'flex', flexDirection:'column', justifyContent:'space-between'
            }}>
              <div style={{ position:'absolute', top:0, left:24, right:24, height:3, background:s.color, borderRadius:'0 0 4px 4px'}}/>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', letterSpacing:'.18em'}}>STATION {s.n}</span>
                  {done && <Chip tone="leaf">✓ done</Chip>}
                </div>
                <h3 className="serif" style={{ margin:'6px 0 4px', fontSize:24, color:'var(--ink)', fontWeight:600 }}>{s.label}</h3>
                <div style={{ fontSize:14, color:'var(--ink-3)' }}>{s.blurb}</div>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:14 }}>{s.concept}</div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button onClick={()=>onLearn(s.id)} className="btn" style={{ flex:'0 0 auto', padding:'8px 12px', borderRadius:999, fontSize:12.5, fontWeight:500, background: learned ? 'var(--bg-soft)' : 'var(--bg-card)', color:'var(--ink-2)', border:'1px solid var(--line-2)' }}>
                  {learned ? '↻ Re-read concept' : '◔ Learn concept'}
                </button>
                <button onClick={()=>onStart(s.id)} className="btn" style={{ flex:1, padding:'8px 14px', borderRadius:999, fontSize:13, fontWeight:600, background:'var(--ink)', color:'var(--bg-card)', border:'1px solid var(--ink)' }}>
                  {done ? '↻ Retry exercise' : 'Start exercise →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Concept Library teaser */}
      <SectionHeader label="Concept library" sub="optional · 21 modules across 4 pillars"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:18 }}>
        {LibraryPillars.map(p => {
          const seenCount = p.modules.filter(m => libraryModulesSeen[m]).length;
          return (
            <button key={p.id} className="btn" onClick={()=>onOpenLibrary(p.id)}
              style={{
                textAlign:'left', padding:'22px 22px', borderRadius:20,
                background:'var(--bg-card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-sm)',
                position:'relative', overflow:'hidden', cursor:'pointer'
              }}>
              <div style={{ position:'absolute', top:0, left:22, right:22, height:3, background:p.color, borderRadius:'0 0 4px 4px'}}/>
              <div className="mono" style={{ fontSize:10.5, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.18em' }}>pillar</div>
              <div className="serif" style={{ fontSize:20, fontWeight:600, marginTop:4, lineHeight:1.2 }}>{p.label}</div>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', marginTop:10 }}>{p.modules.length} modules · {seenCount} read</div>
            </button>
          );
        })}
      </div>

      {/* Simulations */}
      <SectionHeader label="Simulations" sub={simsAccessible ? `${SIMS.length} sims · ${playedSims} played` : `complete ${STATIONS.length - Object.keys(scores).length} more station${STATIONS.length - Object.keys(scores).length === 1 ? '' : 's'} to unlock`}/>
      {!simsAccessible && <PasswordUnlock onUnlock={onUnlockSims}/>}

      <div style={{ opacity: simsAccessible ? 1 : .55 }}>
        {SIM_CATEGORIES.map(cat => {
          const inCat = SIMS.filter(s => s.cat === cat.id);
          return (
            <div key={cat.id} style={{ marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:12 }}>
                <h3 className="serif" style={{ fontSize:22, margin:0, fontWeight:600, letterSpacing:'-.01em' }}>{cat.label}</h3>
                <span className="mono" style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.14em' }}>{cat.blurb}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
                {inCat.map(s => {
                  const done = gameScores[s.id] != null;
                  return (
                    <button key={s.id} className="btn" onClick={()=> simsAccessible && onJump(s.id)} disabled={!simsAccessible}
                      style={{
                        textAlign:'left', padding:'18px 20px 14px', borderRadius:18,
                        background: 'var(--bg-card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-sm)',
                        position:'relative', overflow:'hidden',
                        cursor: simsAccessible ? 'pointer' : 'not-allowed', minHeight:180,
                        display:'flex', flexDirection:'column', justifyContent:'space-between'
                      }}>
                      <div style={{ position:'absolute', top:0, left:20, right:20, height:3, background:s.color, borderRadius:'0 0 4px 4px'}}/>
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                          <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', letterSpacing:'.14em' }}>SIM</span>
                          {done && <Chip tone="leaf">✓ played</Chip>}
                        </div>
                        <h4 className="serif" style={{ margin:'4px 0 2px', fontSize:18, color:'var(--ink)', fontWeight:600 }}>{s.label}</h4>
                        <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.4 }}>{s.blurb}</div>
                      </div>
                      <div className="mono" style={{ fontSize:10.5, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:10 }}>{s.concept}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {playedSims >= 3 && (
        <div className="fadeup" style={{ marginTop:8, display:'flex', justifyContent:'center' }}>
          <Button size="lg" variant="primary" onClick={()=>onJump('sim-report')}>View simulation performance report →</Button>
        </div>
      )}

      <div style={{ marginTop:60, padding:'24px 28px', borderRadius:20, background:'var(--bg-card)', border:'1px dashed var(--line-2)'}}>
        <div className="serif" style={{ fontSize:22, fontWeight:600 }}>Why this matters</div>
        <p style={{ color:'var(--ink-2)', maxWidth:780, marginBottom:0, marginTop:8 }}>
          Most everyday "data-driven" mistakes aren't about math. They're about reading patterns where there aren't any, ignoring how often something happens before looking, and stating beliefs more confidently than the evidence justifies. The Lab makes those mistakes visible — and then trainable.
        </p>
      </div>
    </div>
  );
};

const SectionHeader = ({ label, sub }) => (
  <div style={{ display:'flex', alignItems:'baseline', gap:14, marginTop:60, marginBottom:18 }}>
    <h2 className="serif" style={{ fontSize:30, margin:0, letterSpacing:'-.015em' }}>{label}</h2>
    <span className="mono" style={{ fontSize:12, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.14em' }}>{sub}</span>
  </div>
);

// ─── Library page ───────────────────────────────────────────────────────
const LibraryPage = ({ libraryModulesSeen, onOpen, focusPillar }) => (
  <div style={{ maxWidth:1140, margin:'0 auto', padding:'48px 28px 80px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <Chip tone="signal">Concept library</Chip>
      <Chip>{Object.keys(LibraryModules).length} modules</Chip>
    </div>
    <h1 className="serif" style={{ fontSize:54, margin:0, letterSpacing:'-.02em', lineHeight:1.05 }}>The whole map.</h1>
    <p style={{ fontSize:18, color:'var(--ink-2)', maxWidth:680, marginTop:14, lineHeight:1.5 }}>
      Twenty-one short concept modules covering everything a non-stats forecaster should know. Read in any order. ~2-3 minutes each.
    </p>

    {LibraryPillars.map(p => (
      <div key={p.id} style={{ marginTop:40 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${p.color}` }}>
          <h2 className="serif" style={{ fontSize:26, margin:0, fontWeight:600, letterSpacing:'-.015em' }}>{p.label}</h2>
          <span className="mono" style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.14em' }}>{p.modules.length} modules</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {p.modules.map(mid => {
            const mod = LibraryModules[mid];
            if (!mod) return null;
            const seen = libraryModulesSeen[mid];
            return (
              <button key={mid} className="btn" onClick={()=>onOpen(mid)}
                style={{
                  textAlign:'left', padding:'18px 20px', borderRadius:16,
                  background:'var(--bg-card)', border:'1px solid var(--line)',
                  position:'relative', overflow:'hidden', cursor:'pointer',
                  display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:140
                }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span className="mono" style={{ fontSize:10.5, color:'var(--ink-4)', letterSpacing:'.14em', textTransform:'uppercase' }}>module</span>
                    {seen && <Chip tone="leaf">✓ read</Chip>}
                  </div>
                  <div className="serif" style={{ fontSize:18, fontWeight:600, marginTop:4, lineHeight:1.2 }}>{mod.title}</div>
                </div>
                <div className="mono" style={{ fontSize:10.5, color:'var(--ink-4)', marginTop:10, textTransform:'uppercase', letterSpacing:'.12em' }}>{mod.frames.length} frames</div>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── Lab Report ─────────────────────────────────────────────────────────
const FinalReport = ({ scores, gameScores, onRestart, onJump }) => {
  const cal = scores.calibration;
  const brier = scores.brier;
  const signal = scores.signal;
  const baseRate = scores.baseRate;
  const crowd = scores.crowd;
  const bayes = scores.bayes;

  const completion = Object.keys(scores).length;
  const calGap = cal ? cal.buckets.reduce((s, b) => s + b.n * Math.abs(b.p - b.freq), 0) / (cal.log.length || 1) : 0;

  return (
    <div style={{ maxWidth:1140, margin:'0 auto', padding:'48px 28px 80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <Chip tone="gold">Lab report</Chip>
        <Chip>{completion}/{STATIONS.length} stations</Chip>
        {Object.keys(gameScores).length > 0 && <Chip tone="leaf">{Object.keys(gameScores).length} sim{Object.keys(gameScores).length === 1 ? '' : 's'}</Chip>}
      </div>
      <h1 className="serif" style={{ fontSize:54, margin:0, letterSpacing:'-.02em', lineHeight:1.05 }}>Your forecasting profile</h1>

      <div style={{ marginTop:36, display:'grid', gridTemplateColumns:'1.1fr .9fr', gap:24 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <h3 className="serif" style={{ margin:0, fontSize:24 }}>Calibration</h3>
            {cal ? <Stamp label={calGap < .08 ? 'well calibrated' : calGap < .15 ? 'modest gap' : 'overconfident'} tone={calGap < .08 ? 'good' : calGap < .15 ? 'gold' : 'bad'}/> : <Chip>incomplete</Chip>}
          </div>
          {cal ? (
            <div>
              <CalibrationPlot buckets={cal.buckets} w={400} h={320} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:8 }}>
                <Stat label="Avg. confidence" value={`${Math.round(cal.log.reduce((s, e) => s + e.conf, 0) / cal.log.length)}%`}/>
                <Stat label="Actual accuracy" value={`${Math.round(cal.correct / cal.total * 100)}%`}/>
                <Stat label="Gap" value={`${Math.abs(Math.round(cal.log.reduce((s,e) => s + e.conf, 0) / cal.log.length) - Math.round(cal.correct / cal.total * 100))}pt`} tone="signal"/>
              </div>
            </div>
          ) : <EmptyTile onClick={() => onJump('calibration')} label="Take the calibration quiz"/>}
        </div>

        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <h3 className="serif" style={{ margin:0, fontSize:24 }}>Brier scoring</h3>
            {brier ? <Stamp label={brier.avg < 0.15 ? 'sharp' : brier.avg < 0.25 ? 'fair' : 'noisy'} tone={brier.avg < 0.15 ? 'good' : brier.avg < 0.25 ? 'gold' : 'bad'}/> : <Chip>incomplete</Chip>}
          </div>
          {brier ? (
            <div>
              <div style={{ background:'var(--bg-soft)', border:'1px solid var(--line)', borderRadius:14, padding:14 }}>
                <BrierHistory rounds={brier.rounds} w={420} h={160}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
                <Stat label="Avg. Brier" value={brier.avg.toFixed(3)} tone={brier.avg < 0.15 ? 'good' : brier.avg < 0.25 ? 'neutral' : 'bad'} sub="lower = sharper"/>
                <Stat label="Best possible" value={(brier.rounds.reduce((s,r) => s + r.optimal, 0) / brier.rounds.length).toFixed(3)} sub="with full base rates"/>
              </div>
            </div>
          ) : <EmptyTile onClick={() => onJump('brier')} label="Try the Brier Arena"/>}
        </div>
      </div>

      <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        <MiniTile title="Signal-spotting" score={signal} onJump={() => onJump('signal')}>
          {signal && <Stat label="Calls" value={`${signal.correct}/${signal.total}`} tone={signal.correct >= 4 ? 'good' : 'neutral'}/>}
        </MiniTile>
        <MiniTile title="Base rates" score={baseRate} onJump={() => onJump('baseRate')}>
          {baseRate && <Stat label="You guessed" value={`${baseRate.guess}%`} sub={`truth was ${baseRate.truth}%`}/>}
        </MiniTile>
        <MiniTile title="Bayesian updating" score={bayes} onJump={() => onJump('bayes')}>
          {bayes && <Stat label="Posterior" value={`${Math.round(bayes.posterior * 100)}%`} sub={`from ${bayes.applied} pieces of evidence`}/>}
        </MiniTile>
        <MiniTile title="Wisdom of crowds" score={crowd} onJump={() => onJump('crowd')}>
          {crowd && <Stat label="Your error" value={Math.abs(crowd.mid - crowd.truth).toString()} tone={Math.abs(crowd.mid - crowd.truth) < Math.abs(crowd.median - crowd.truth) ? 'good' : 'neutral'} sub={`crowd error ${Math.abs(crowd.median - crowd.truth)}`}/>}
        </MiniTile>
      </div>

      {Object.keys(gameScores).length > 0 && (
        <div style={{ marginTop:32 }}>
          <h2 className="serif" style={{ fontSize:24, margin:'0 0 14px' }}>Simulations played</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
            {SIMS.filter(s => gameScores[s.id]).map(s => (
              <div key={s.id} className="card" style={{ padding:'18px 20px' }}>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>{s.label}</div>
                <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:2 }}>{s.blurb}</div>
                <Button size="sm" variant="ghost" onClick={()=>onJump(s.id)} style={{ marginTop:8, padding:'4px 10px' }}>↻ replay</Button>
              </div>
            ))}
          </div>
          {Object.keys(gameScores).length >= 3 && (
            <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
              <Button size="lg" onClick={()=>onJump('sim-report')}>Full sim performance report →</Button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop:36, padding:'28px 30px', borderRadius:22, background:'var(--bg-card)', border:'1px solid var(--line)'}}>
        <div className="serif" style={{ fontSize:26, marginBottom:14 }}>Five takeaways</div>
        <ol style={{ margin:0, paddingLeft:22, lineHeight:1.7, color:'var(--ink-2)', fontSize:15.5 }}>
          <li><strong>Most patterns aren't.</strong> Noisy data produces stories the brain can't help telling. Demand replication before belief.</li>
          <li><strong>Confidence is a claim about reality.</strong> If you say 90% all day, you should be wrong 1 in 10. Most beginners are wrong 3 in 10.</li>
          <li><strong>Base rates first, evidence second.</strong> A scary positive on a rare condition is usually still rare.</li>
          <li><strong>Update on odds, not feelings.</strong> Multiply prior odds by the likelihood ratio. Strong evidence is a big multiplier — not a hunch.</li>
          <li><strong>Aggregate when you can.</strong> Errors cancel when biases are uncorrelated. A median of strangers often beats a single expert.</li>
        </ol>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32 }}>
        <Button variant="ghost" onClick={onRestart}>↺ Restart lab</Button>
        <Button size="lg" onClick={() => onJump('home')}>Back to map →</Button>
      </div>
    </div>
  );
};

// ─── Sim Report (now generalized for any played sims) ───────────────────
const SimReport = ({ gameScores, onBack }) => {
  const played = SIMS.filter(s => gameScores[s.id]);
  if (played.length === 0) {
    return (
      <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 28px 80px' }}>
        <h1 className="serif" style={{ fontSize:48, margin:0 }}>No sims played yet.</h1>
        <Button size="lg" onClick={onBack} style={{ marginTop:20 }}>Back to lab →</Button>
      </div>
    );
  }

  const grade = (sim) => {
    const g = gameScores[sim.id];
    if (sim.id === 'election') {
      if (g.avgBrier < 0.12) return { tone:'good', verdict:'Excellent', note:'Forecast tracked truth closely all night. Right calibration on small vs large precincts.' };
      if (g.avgBrier < 0.20) return { tone:'gold', verdict:'Solid', note:'Reasonable through the night. Watch over-reactions to early small precincts.' };
      return { tone:'bad', verdict:'Noisy', note:'Forecast swung too much on small samples and not enough on big ones.' };
    }
    if (sim.id === 'detective') {
      const score = g.avgGap + (g.right ? 0 : 12);
      if (score < 12) return { tone:'good', verdict:'Sharp updater', note:`Caught the killer at ${g.finalProb}%. Bayesian instincts solid.` };
      if (score < 24) return { tone:'gold', verdict:'Reasonable', note:`${g.right ? 'Right answer' : 'Wrong accusation'} — updates ${g.avgGap.toFixed(0)} pts from optimal per step.` };
      return { tone:'bad', verdict:'Over-reactive', note:'Updates were too wild. Strong evidence should move more, weak evidence less.' };
    }
    if (sim.id === 'stock') {
      if (g.totalReturn > 0.15 && g.avgBrier < 0.20) return { tone:'good', verdict:'Sharp & profitable', note:'Read signals well and sized bets reasonably.' };
      if (g.totalReturn > 0) return { tone:'gold', verdict:'Profitable', note:'Above water. Sharper probabilities would unlock bigger bets.' };
      return { tone:'bad', verdict:'Underwater', note:'Likely betting too hard on coin-flippy calls.' };
    }
    if (sim.id === 'tournament') {
      if (g.avg < 0.15) return { tone:'good', verdict:'Sharp', note:`Avg Brier ${g.avg.toFixed(3)}. Top-tier forecasting across categories.` };
      if (g.avg < 0.25) return { tone:'gold', verdict:'Solid', note:`Avg Brier ${g.avg.toFixed(3)}. Look for weak categories in the breakdown.` };
      return { tone:'bad', verdict:'Wobbly', note:`Avg Brier ${g.avg.toFixed(3)}. Either overconfident or guessing.` };
    }
    if (sim.id === 'drift') {
      if (g.correct >= 4) return { tone:'good', verdict:'Sharp eye', note:`${g.correct}/${g.total} change-points called correctly.` };
      if (g.correct >= 2) return { tone:'gold', verdict:'Decent', note:`${g.correct}/${g.total}. Some real shifts missed or false alarms raised.` };
      return { tone:'bad', verdict:'Noisy', note:'Big trouble spotting real shifts vs phantom ones.' };
    }
    if (sim.id === 'anchor') {
      if (Math.abs(g.r) < 0.15) return { tone:'good', verdict:'Anchor-resistant', note:'Your guesses barely correlated with the irrelevant anchors. Rare.' };
      if (Math.abs(g.r) < 0.40) return { tone:'gold', verdict:'Mild bias', note:`r = ${g.r.toFixed(2)}. Some anchoring, but tighter than most.` };
      return { tone:'bad', verdict:'Heavily anchored', note:`r = ${g.r.toFixed(2)}. Irrelevant numbers pulled your guesses strongly.` };
    }
    if (sim.id === 'crowdVs') {
      if (g.updatedAvg < 0.15) return { tone:'good', verdict:'Crowd-aware', note:`Updated Brier ${g.updatedAvg.toFixed(3)} vs initial ${g.initialAvg.toFixed(3)} — used the crowd well.` };
      if (g.improved) return { tone:'gold', verdict:'Improving', note:'Updated answers were better than initial. But not by much.' };
      return { tone:'bad', verdict:'Ignored crowd', note:'Updated answers were no better (or worse). Either stubbornness or over-adjustment.' };
    }
    if (sim.id === 'outbreak') {
      if (g.brier < 0.15) return { tone:'good', verdict:'On the curve', note:`Caught the inflection. Final P(peak) was within 12 pts of correct.` };
      if (g.brier < 0.30) return { tone:'gold', verdict:'Late but adequate', note:'Right direction, but updates lagged the data.' };
      return { tone:'bad', verdict:'Missed it', note:'Exponential growth fooled you. The early "small" numbers were the warning sign.' };
    }
    if (sim.id === 'abTest') {
      if (g.correct >= 5) return { tone:'good', verdict:'Disciplined', note:`${g.correct}/${g.total} optimal decisions. Resisted peeking and shipping prematurely.` };
      if (g.acceptable >= 5) return { tone:'gold', verdict:'Defensible', note:`${g.acceptable}/${g.total} defensible. Some premature ships or kills.` };
      return { tone:'bad', verdict:'Trigger-happy', note:'You shipped or killed too soon on weak data.' };
    }
    if (sim.id === 'hiring') {
      if (g.yourAvg >= 0.72) return { tone:'good', verdict:'Sharp reader', note:`${Math.round(g.yourAvg*100)}% avg true score on your hires.` };
      if (g.yourAvg >= 0.60) return { tone:'gold', verdict:'Mixed', note:`${Math.round(g.yourAvg*100)}% avg. Some good picks, some prestige-bias misses.` };
      return { tone:'bad', verdict:'Pattern-matching', note:`${Math.round(g.yourAvg*100)}% avg. Resume signals fooled you.` };
    }
    if (sim.id === 'trial') {
      if (g.calibrated) return { tone:'good', verdict:'Calibrated juror', note:`Final P(guilty) ${Math.round(g.finalBelief*100)}% — within 10 pts of optimal.` };
      return { tone:'gold', verdict:'Off the math', note:`Final belief was off from Bayes-optimal by ${Math.round(Math.abs(g.finalBelief-g.finalOptimal)*100)} points.` };
    }
    if (sim.id === 'vc') {
      if (g.portfolioMult >= 4) return { tone:'good', verdict:'Power-law winner', note:`${g.portfolioMult.toFixed(2)}× portfolio. Concentrated where it mattered.` };
      if (g.portfolioMult >= 1.5) return { tone:'gold', verdict:'Acceptable', note:`${g.portfolioMult.toFixed(2)}×. Missed the biggest winners but not catastrophic.` };
      return { tone:'bad', verdict:'Spread thin', note:`${g.portfolioMult.toFixed(2)}×. You either diversified into bad picks or missed the unicorns.` };
    }
    if (sim.id === 'inspector') {
      if (g.savings >= 30000) return { tone:'good', verdict:'Threshold pro', note:`Saved $${(g.savings/1000).toFixed(1)}k — near-optimal threshold.` };
      if (g.savings >= 15000) return { tone:'gold', verdict:'Decent', note:`Saved $${(g.savings/1000).toFixed(1)}k. Slight over- or under-tuning.` };
      return { tone:'bad', verdict:'Mis-tuned', note:`Only $${(g.savings/1000).toFixed(1)}k. Threshold either too loose (alarm fatigue) or too strict (missed fraud).` };
    }
    if (sim.id === 'whistle') {
      if (g.gap < .15) return { tone:'good', verdict:'Correlation-aware', note:`Within ${Math.round(g.gap*100)} pts of correlation-corrected optimal.` };
      if (g.gap < .30) return { tone:'gold', verdict:'Some over-counting', note:`${Math.round(g.gap*100)}pt gap. Probably gave correlated rumors too much weight.` };
      return { tone:'bad', verdict:'Triple-counted', note:`Way off optimal. You treated correlated sources as if they were independent.` };
    }
    return { tone:'gold', verdict:'Played', note:'Played.' };
  };

  const grades = played.map(s => ({ sim: s, g: gameScores[s.id], v: grade(s) }));
  const good = grades.filter(x => x.v.tone === 'good').length;
  const bad = grades.filter(x => x.v.tone === 'bad').length;
  const composite = good >= played.length * 0.6 ? { label:'Calibrated forecaster', tone:'good' }
                  : bad >= played.length * 0.4 ? { label:'Room to grow', tone:'bad' }
                  : { label:'Improving forecaster', tone:'gold' };

  return (
    <div style={{ maxWidth:1140, margin:'0 auto', padding:'48px 28px 80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <Chip tone="gold">Simulation report</Chip>
        <Chip>{played.length}/{SIMS.length} sims played</Chip>
      </div>
      <h1 className="serif" style={{ fontSize:54, margin:0, letterSpacing:'-.02em', lineHeight:1.05 }}>Simulation performance</h1>

      <div style={{ marginTop:28, padding:'24px 28px', borderRadius:20, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>composite grade</div>
            <div className="serif" style={{ fontSize:34, fontWeight:600, lineHeight:1.1, marginTop:4 }}>{composite.label}</div>
          </div>
          <Stamp label={`${good}/${played.length} aced`} tone={composite.tone}/>
        </div>
      </div>

      <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:14 }}>
        {grades.map(({ sim, v }) => (
          <div key={sim.id} className="card" style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
              <div>
                <h3 className="serif" style={{ margin:0, fontSize:22 }}>{sim.label}</h3>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>{sim.concept}</div>
              </div>
              <Stamp label={v.verdict} tone={v.tone === 'good' ? 'good' : v.tone === 'bad' ? 'bad' : 'gold'}/>
            </div>
            <div style={{ padding:'12px 14px', borderRadius:12, background: v.tone==='good'?'var(--leaf-soft)':v.tone==='bad'?'var(--noise-soft)':'var(--gold-soft)', border:`1px solid ${v.tone==='good'?'var(--leaf)':v.tone==='bad'?'var(--noise)':'var(--gold)'}` }}>
              <div style={{ fontSize:14.5, color:'var(--ink-2)', lineHeight:1.5 }}>{v.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:32 }}>
        <Button size="lg" onClick={onBack}>Back to lab →</Button>
      </div>
    </div>
  );
};

const EmptyTile = ({ onClick, label }) => (
  <button className="btn" onClick={onClick} style={{
    width:'100%', padding:'38px 20px', borderRadius:14, marginTop:8,
    background:'var(--bg-soft)', border:'1px dashed var(--line-2)', color:'var(--ink-3)', fontSize:14
  }}>{label} →</button>
);
const MiniTile = ({ title, score, onJump, children }) => (
  <div className="card" style={{ padding:'18px 20px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em'}}>{title}</span>
      {!score && <button className="btn" onClick={onJump} style={{ background:'transparent', color:'var(--signal)', fontSize:12, fontWeight:600, padding:0 }}>do it →</button>}
    </div>
    {score ? children : <div style={{ color:'var(--ink-4)', fontSize:13 }}>Not yet played.</div>}
  </div>
);

// ─── Tweaks ──────────────────────────────────────────────────────────────
const Tweaks = ({ t, setTweak }) => (
  <TweaksPanel>
    <TweakSection label="Visual"/>
    <TweakRadio label="Theme" value={t.theme} options={['warm','cool','dark']} onChange={(v)=>setTweak('theme', v)}/>

    <TweakSection label="Challenge"/>
    <TweakRadio label="Signal noise" value={t.difficulty} options={['easy','regular','hard']} onChange={(v)=>setTweak('difficulty', v)}/>

    <TweakSection label="Bayesian Theater"/>
    <TweakSelect label="Scenario" value={t.bayesScenario} options={[{value:0,label:'Hire'},{value:1,label:'A/B test'}]} onChange={(v)=>setTweak('bayesScenario', +v)}/>
  </TweaksPanel>
);

// ─── App ─────────────────────────────────────────────────────────────────
const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('home');
  const [state, setState] = React.useState(loadState);

  React.useEffect(() => { saveState(state); }, [state]);

  const themeClass = t.theme === 'dark' ? 'theme-dark' : t.theme === 'cool' ? 'theme-cool' : '';

  const recordScore = (id, data) => setState((s) => ({ ...s, scores: { ...s.scores, [id]: data } }));
  const recordGameScore = (id, data) => setState((s) => ({ ...s, gameScores: { ...s.gameScores, [id]: data } }));
  const markModuleSeen = (key) => setState((s) => ({ ...s, modulesSeen: { ...s.modulesSeen, [key]: true } }));
  const markLibraryModuleSeen = (key) => setState((s) => ({ ...s, libraryModulesSeen: { ...s.libraryModulesSeen, [key]: true } }));

  const startStation = (id) => { setRoute(id); window.scrollTo({top:0}); };
  const openModule = (id) => { setRoute(`module-${id}`); window.scrollTo({top:0}); };
  const openLibrary = (pillarId) => { setRoute('library'); window.scrollTo({top:0}); };
  const openLibraryModule = (id) => { setRoute(`library-${id}`); window.scrollTo({top:0}); };

  const onComplete = (id) => {
    const i = STATIONS.findIndex((s) => s.id === id);
    if (i >= 0) {
      const next = STATIONS[i + 1];
      if (next) { setRoute(next.id); window.scrollTo({top:0}); return; }
      setRoute('report'); window.scrollTo({top:0}); return;
    }
    setRoute('home'); window.scrollTo({top:0});
  };

  const restart = () => {
    setState({ scores:{}, modulesSeen:{}, gameScores:{}, simsUnlocked:false, libraryModulesSeen:{} });
    setRoute('home');
  };

  const renderRoute = () => {
    if (route === 'home') return <Home
      onStart={startStation}
      onLearn={openModule}
      onOpenLibrary={openLibrary}
      onOpenSimShelf={()=>setRoute('sim-shelf')}
      scores={state.scores}
      gameScores={state.gameScores}
      modulesSeen={state.modulesSeen}
      libraryModulesSeen={state.libraryModulesSeen}
      simsUnlocked={state.simsUnlocked}
      onUnlockSims={()=>setState((s)=>({...s, simsUnlocked:true}))}
      onJump={setRoute}/>;

    if (route === 'library') return <LibraryPage libraryModulesSeen={state.libraryModulesSeen} onOpen={openLibraryModule}/>;

    if (route === 'report') return <FinalReport scores={state.scores} gameScores={state.gameScores} onRestart={restart} onJump={setRoute}/>;
    if (route === 'sim-report') return <SimReport gameScores={state.gameScores} onBack={()=>setRoute('home')}/>;
    if (route === 'sim-shelf') { setTimeout(()=>setRoute('home'),0); return null; }

    if (route.startsWith('library-')) {
      const id = route.slice('library-'.length);
      const mod = LibraryModules[id];
      if (!mod) { setRoute('library'); return null; }
      return (
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 28px 80px' }}>
          <TeachingModule
            title={mod.title}
            intro={mod.intro}
            frames={mod.frames}
            accent={mod.accent}
            onFinish={()=>{ markLibraryModuleSeen(id); setRoute('library'); window.scrollTo({top:0}); }}
            onSkip={()=>{ markLibraryModuleSeen(id); setRoute('library'); window.scrollTo({top:0}); }}/>
        </div>
      );
    }

    if (route.startsWith('module-')) {
      const id = route.slice('module-'.length);
      const station = STATIONS.find((s) => s.id === id);
      if (!station) { setRoute('home'); return null; }
      const mod = Modules[station.moduleKey];
      return (
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 28px 80px' }}>
          <TeachingModule
            title={mod.title}
            intro={mod.intro}
            frames={mod.frames}
            accent={mod.accent}
            onFinish={()=>{ markModuleSeen(station.moduleKey); setRoute(id); window.scrollTo({top:0}); }}
            onSkip={()=>{ markModuleSeen(station.moduleKey); setRoute(id); window.scrollTo({top:0}); }}/>
        </div>
      );
    }

    // Stations
    const wrap = (el, maxW=920) => <div style={{ maxWidth:maxW, margin:'0 auto', padding:'40px 28px 80px' }}>{el}</div>;
    if (route === 'signal')      return wrap(<StationSignal onComplete={()=>onComplete('signal')} recordScore={recordScore} difficulty={t.difficulty}/>);
    if (route === 'calibration') return wrap(<StationCalibration onComplete={()=>onComplete('calibration')} recordScore={recordScore}/>);
    if (route === 'brier')       return wrap(<StationBrier onComplete={()=>onComplete('brier')} recordScore={recordScore}/>);
    if (route === 'baseRate')    return wrap(<StationBaseRate onComplete={()=>onComplete('baseRate')} recordScore={recordScore}/>, 1020);
    if (route === 'bayes')       return wrap(<StationBayes onComplete={()=>onComplete('bayes')} recordScore={recordScore} scenarioIdx={t.bayesScenario}/>, 1040);
    if (route === 'crowd')       return wrap(<StationCrowd onComplete={()=>onComplete('crowd')} recordScore={recordScore}/>, 1000);

    // Sims — return to home (sim report unlocks at 3+ played)
    const afterSim = () => {
      const played = SIMS.filter(s => state.gameScores[s.id]).length;
      // we can't read updated state immediately; safe to just go home
      setRoute('home');
      window.scrollTo({top:0});
    };

    // Original 3
    if (route === 'election')   return wrap(<StationElection onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'detective')  return wrap(<StationDetective onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'stock')      return wrap(<StationStock onComplete={afterSim} recordScore={recordGameScore}/>, 980);

    // Drills
    if (route === 'tournament') return wrap(<StationTournament onComplete={afterSim} recordScore={recordGameScore}/>, 920);
    if (route === 'drift')      return wrap(<StationDrift onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'anchor')     return wrap(<StationAnchor onComplete={afterSim} recordScore={recordGameScore}/>, 920);
    if (route === 'crowdVs')    return wrap(<StationCrowdVs onComplete={afterSim} recordScore={recordGameScore}/>, 920);

    // Domain
    if (route === 'outbreak')   return wrap(<StationOutbreak onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'abTest')     return wrap(<StationAB onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'hiring')     return wrap(<StationHiring onComplete={afterSim} recordScore={recordGameScore}/>, 1020);

    // Decision
    if (route === 'trial')      return wrap(<StationTrial onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'vc')         return wrap(<StationVC onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'inspector')  return wrap(<StationInspector onComplete={afterSim} recordScore={recordGameScore}/>, 980);
    if (route === 'whistle')    return wrap(<StationWhistle onComplete={afterSim} recordScore={recordGameScore}/>, 980);

    return null;
  };

  return (
    <div className={`shell paper ${themeClass}`}>
      <Topbar current={route} scores={state.scores} gameScores={state.gameScores} onJump={setRoute} onHome={()=>setRoute('home')} t={t} onReset={restart}/>
      <div style={{ flex:1 }}>{renderRoute()}</div>
      <Tweaks t={t} setTweak={setTweak}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
