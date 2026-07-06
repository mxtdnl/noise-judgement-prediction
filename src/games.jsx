// games.jsx — extended simulation games

// ─── Election Night ─────────────────────────────────────────────────────
const ElectionPrecincts = [
  { id:1, name:'Pine Hollow', size:80,    lean:'D', skew: 0.06, color:'var(--signal)' },
  { id:2, name:'Westbrook Mill', size:240,lean:'R', skew:-0.05, color:'var(--noise-2)' },
  { id:3, name:'Downtown 14',   size:65,  lean:'mixed', skew: 0.00, color:'var(--ink-3)' },
  { id:4, name:'Riverside East',size:520, lean:'R', skew:-0.08, color:'var(--noise-2)' },
  { id:5, name:'Five Oaks',     size:140, lean:'D', skew: 0.05, color:'var(--signal)' },
  { id:6, name:'Industrial-3',  size:90,  lean:'mixed', skew: 0.00, color:'var(--ink-3)' },
  { id:7, name:'Northgate',     size:780, lean:'D', skew: 0.04, color:'var(--signal)' },
  { id:8, name:'Bellwether HS', size:1200,lean:'mixed', skew: 0.00, color:'var(--gold)' },
];

const StationElection = ({ onComplete, recordScore }) => {
  const TRUE_DSHARE = 0.514;
  // Pre-compute results deterministically
  const results = React.useMemo(() => {
    const rng = mulberry32(33);
    return ElectionPrecincts.map(p => {
      const trueShareHere = TRUE_DSHARE + p.skew;
      const noiseSd = 0.20 / Math.sqrt(p.size);
      const dShareNoisy = Math.max(0.05, Math.min(0.95, trueShareHere + gauss(rng) * noiseSd));
      const dVotes = Math.round(dShareNoisy * p.size);
      return { ...p, dVotes, rVotes: p.size - dVotes, share: dShareNoisy };
    });
  }, []);

  // Reference forecaster: at each checkpoint (k precincts reported), estimate
  // P(D wins) by Monte Carlo over the UNREPORTED precincts. The reference knows
  // only the poll (52% ± error), each precinct's size + historical skew, and the
  // sampling noise 0.20/√size — not the hidden true share. This is what a good
  // Bayesian should believe given the data so far; we grade against it, not the
  // single realised outcome (so a lucky "95% on precinct 1" scores badly).
  const referenceCurve = React.useMemo(() => {
    const POLL = 0.52, POLL_SD = 0.03, SIMS = 500;
    return Array.from({ length: results.length + 1 }, (_, k) => {
      const rng = mulberry32(2000 + k);
      const reportedD = results.slice(0, k).reduce((s,r)=>s+r.dVotes, 0);
      const reportedR = results.slice(0, k).reduce((s,r)=>s+r.rVotes, 0);
      const unreported = results.slice(k);
      let dWins = 0;
      for (let s = 0; s < SIMS; s++) {
        const overall = POLL + gauss(rng) * POLL_SD;
        let dTot = reportedD, rTot = reportedR;
        for (const p of unreported) {
          const share = Math.max(0.02, Math.min(0.98, overall + p.skew + gauss(rng) * (0.20/Math.sqrt(p.size))));
          const dv = Math.round(share * p.size);
          dTot += dv; rTot += (p.size - dv);
        }
        if (dTot > rTot) dWins++;
      }
      return dWins / SIMS;
    });
  }, [results]);

  const [idx, setIdx] = React.useState(0);     // 0..len  -- idx is next-to-report
  const [prob, setProb] = React.useState(55);  // your current P(D wins overall)
  const [log, setLog] = React.useState([]);    // {reportedAfter, prob}
  const [phase, setPhase] = React.useState('start'); // start | precinct | done

  const reportedSoFar = results.slice(0, idx);
  const dRunning = reportedSoFar.reduce((s,r)=>s+r.dVotes, 0);
  const rRunning = reportedSoFar.reduce((s,r)=>s+r.rVotes, 0);
  const totalRunning = dRunning + rRunning;

  const advance = () => {
    const allUpdates = [...log, { reportedAfter: idx, prob }];
    setLog(allUpdates);
    if (idx + 1 >= results.length) {
      // resolve — grade against the reference forecaster trajectory, not the outcome
      const totalD = results.reduce((s,r)=>s+r.dVotes,0);
      const totalR = results.reduce((s,r)=>s+r.rVotes,0);
      const dWon = totalD > totalR;
      const finalProb = prob/100;
      const refGap = allUpdates.reduce((s,u)=>s + Math.abs(u.prob/100 - referenceCurve[u.reportedAfter]), 0) / allUpdates.length;
      const brier = Math.pow(finalProb - (dWon ? 1 : 0), 2); // kept for back-compat
      recordScore('election', { refGap, brier, dWon, totalD, totalR });
      setPhase('done');
      return;
    }
    setIdx(idx + 1);
  };

  if (phase === 'start') {
    return (
      <Panel eyebrow="Simulation · Election Night" title="It's 7:00 PM. Polls just closed." accent="var(--signal)">
        <Callout tone="signal" icon="⚐">
          <strong>The race:</strong> Candidate D vs Candidate R for a state senate seat. <br/>
          <strong>Pre-election polling:</strong> D leads 52% to 48%, but the margin is well within the typical poll error.<br/>
          <strong>Your job:</strong> As precincts report through the night, update your P(D wins) before each result. Lower variance ≠ better — you should move boldly on big signal, cautiously on small samples.
        </Callout>
        <div style={{ marginTop:20, padding:'18px 20px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:10 }}>Precincts queued</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
            {ElectionPrecincts.map(p => (
              <div key={p.id} style={{ padding:'8px 10px', borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--line)', fontSize:12 }}>
                <div style={{ color:'var(--ink)', fontWeight:500 }}>{p.name}</div>
                <div className="mono" style={{ color:'var(--ink-3)', fontSize:11 }}>{p.size} voters · {p.lean==='mixed'?'swing':p.lean+'-leaning'}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('precinct')}>Start the night →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'done') {
    const totalD = results.reduce((s,r)=>s+r.dVotes,0);
    const totalR = results.reduce((s,r)=>s+r.rVotes,0);
    const dWon = totalD > totalR;
    return (
      <Panel eyebrow="Simulation · Election Night" title={dWon ? 'D wins.' : 'R wins.'} accent={dWon ? 'var(--signal)' : 'var(--noise-2)'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={{ padding:'18px 20px', borderRadius:14, background: dWon ? 'var(--signal-soft)':'var(--bg-soft)', border:'1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--signal)', textTransform:'uppercase', letterSpacing:'.14em' }}>Candidate D</div>
            <div className="mono" style={{ fontSize:32, fontWeight:600, color:'var(--ink)' }}>{totalD.toLocaleString()}</div>
            <div className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>{(totalD/(totalD+totalR)*100).toFixed(1)}%</div>
          </div>
          <div style={{ padding:'18px 20px', borderRadius:14, background: !dWon ? 'var(--noise-soft)':'var(--bg-soft)', border:'1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--noise-2)', textTransform:'uppercase', letterSpacing:'.14em' }}>Candidate R</div>
            <div className="mono" style={{ fontSize:32, fontWeight:600, color:'var(--ink)' }}>{totalR.toLocaleString()}</div>
            <div className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>{(totalR/(totalD+totalR)*100).toFixed(1)}%</div>
          </div>
        </div>
        {/* your trajectory */}
        <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:10 }}>Your P(D wins) vs. the reference forecaster</div>
          <svg viewBox="0 0 480 160" width="100%" style={{ maxHeight:160 }}>
            <line x1="30" x2="460" y1="80" y2="80" stroke="var(--ink-4)" strokeDasharray="3 4"/>
            <text x="22" y="20" fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">100</text>
            <text x="22" y="84" fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">50</text>
            <text x="22" y="148" fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">0</text>
            {/* reference forecaster line (log already includes the final forecast) */}
            <polyline fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 4"
              points={log.map((u, i) => {
                const x = 30 + (i / Math.max(log.length-1,1)) * 430;
                const y = 140 - referenceCurve[u.reportedAfter] * 130;
                return `${x},${y}`;
              }).join(' ')}/>
            <polyline fill="none" stroke="var(--signal)" strokeWidth="2.5"
              points={log.map((u, i) => {
                const x = 30 + (i / Math.max(log.length-1,1)) * 430;
                const y = 140 - (u.prob / 100) * 130;
                return `${x},${y}`;
              }).join(' ')}/>
            {log.map((u, i) => {
              const x = 30 + (i / Math.max(log.length-1,1)) * 430;
              const y = 140 - (u.prob / 100) * 130;
              return <circle key={i} cx={x} cy={y} r={3} fill="var(--signal)"/>;
            })}
            <text x="40" y="14" fontSize="10" fill="var(--signal)" className="mono">— you</text>
            <text x="90" y="14" fontSize="10" fill="var(--gold)" className="mono">- - reference forecaster</text>
            {/* truth marker */}
            <line x1="30" x2="460" y1={dWon?18:145} y2={dWon?18:145} stroke="var(--noise-2)" strokeWidth="1.5" strokeDasharray="2 3"/>
            <text x="460" y={dWon?28:158} fontSize="10" fill="var(--noise-2)" textAnchor="end" className="mono">outcome = {dWon?'D':'R'} wins</text>
          </svg>
        </div>
        {(() => {
          const refGap = log.reduce((s,u)=>s+Math.abs(u.prob/100 - referenceCurve[u.reportedAfter]), 0) / (log.length || 1);
          const gapPts = Math.round(refGap*100);
          return (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:14 }}>
                <Stat label="Final P(D)" value={`${prob}%`} tone="signal"/>
                <Stat label="Gap vs. reference" value={`${gapPts} pts`} tone={refGap < .10 ? 'good' : refGap < .20 ? 'neutral' : 'bad'} sub="avg |you − reference|"/>
                <Stat label="Reference (final)" value={`${Math.round(referenceCurve[results.length-1]*100)}%`} sub="before last precinct"/>
              </div>
              <Callout tone={refGap < .10 ? 'good' : refGap < .20 ? 'gold' : 'noise'} icon={refGap < .10 ? '✓' : refGap < .20 ? '◑' : '✗'}>
                <strong>{refGap < .10 ? 'You tracked the reference forecaster closely.' : refGap < .20 ? 'Roughly on the reference line, with some over-reactions.' : 'You swung further from the reference than the data justified.'}</strong> You're scored against what a good Bayesian should have believed at each checkpoint — not the final result — so panicking on a small early precinct costs you even if the outcome happens to match.
              </Callout>
            </div>
          );
        })()}
        <Callout tone="signal" icon="◑">
          <strong>The lesson of small precincts:</strong> early returns from small precincts are mostly noise. Don't swing your forecast on a 65-voter result. The big precincts that report later carry more signal — wait for them.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  const next = results[idx];
  const justReported = idx > 0 ? results[idx-1] : null;

  return (
    <Panel eyebrow={`Simulation · Election Night · ${idx}/${results.length} reported`} title="Update your forecast." accent="var(--signal)">
      {/* state of the race */}
      <div style={{ padding:'16px 20px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:16 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>Running totals</div>
        <div style={{ position:'relative', height:24, borderRadius:6, background:'var(--bg-card)', border:'1px solid var(--line)', overflow:'hidden' }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${(dRunning/(totalRunning||1))*100}%`, background:'var(--signal)' }}/>
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${(rRunning/(totalRunning||1))*100}%`, background:'var(--noise)' }}/>
        </div>
        <div className="mono" style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:'var(--ink-2)' }}>
          <span style={{ color:'var(--signal)' }}>D {dRunning.toLocaleString()} ({totalRunning ? (dRunning/totalRunning*100).toFixed(1) : 0}%)</span>
          <span style={{ color:'var(--ink-4)' }}>{totalRunning} of {results.reduce((s,r)=>s+r.size,0)} votes counted</span>
          <span style={{ color:'var(--noise-2)' }}>({totalRunning ? (rRunning/totalRunning*100).toFixed(1) : 0}%) {rRunning.toLocaleString()} R</span>
        </div>
      </div>

      {justReported && (
        <div className="fadeup" style={{ padding:'14px 16px', borderRadius:12, background: justReported.dVotes > justReported.rVotes ? 'var(--signal-soft)':'var(--noise-soft)', border:`1px solid ${justReported.dVotes > justReported.rVotes ? 'var(--signal)':'var(--noise)'}`, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.14em' }}>just reported · {justReported.lean==='mixed'?'swing district':`${justReported.lean}-leaning`}</div>
              <div className="serif" style={{ fontSize:20, fontWeight:500, marginTop:2 }}>{justReported.name} · <span className="mono" style={{ fontSize:14, color:'var(--ink-3)' }}>{justReported.size} voters</span></div>
            </div>
            <div className="mono" style={{ fontSize:20, fontWeight:600 }}>
              <span style={{ color:'var(--signal)'}}>D {justReported.dVotes}</span> · <span style={{ color:'var(--noise-2)'}}>R {justReported.rVotes}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'16px 20px', borderRadius:14, background:'var(--bg-card)', border:'1px solid var(--line)', marginBottom:16 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:4 }}>NEXT TO REPORT</div>
        <div className="serif" style={{ fontSize:22, fontWeight:500 }}>{next.name}</div>
        <div className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
          {next.size.toLocaleString()} voters · {next.lean==='mixed'?'bellwether swing district':`historically ${next.lean}-leaning`}
        </div>
      </div>

      <div style={{ marginBottom:8, color:'var(--ink-2)' }}>Your current P(D wins overall):</div>
      <ProbabilitySlider value={prob} onChange={setProb} lowLabel="R wins" highLabel="D wins"/>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <Button size="lg" onClick={advance}>{idx+1 >= results.length ? 'Lock in & resolve →' : `Report ${next.name} →`}</Button>
      </div>
    </Panel>
  );
};

// ─── Detective ──────────────────────────────────────────────────────────
const DetectiveCase = {
  title:'The Library Mystery',
  victim:'Professor Ainsworth',
  setting:'found dead in the locked manuscripts room of the university library at 11:47 PM',
  prior:{ A: 1/3, B: 1/3, C: 1/3 },
  suspects: [
    { id:'A', name:'Dr. Mira Vance',     role:'a rival historian',           color:'var(--noise)' },
    { id:'B', name:'Daniel Park',        role:'a graduate student',          color:'var(--signal)' },
    { id:'C', name:'Eleanor Whitcombe',  role:'the head librarian',          color:'var(--gold)' },
  ],
  truth: 'C',
  clues: [
    { id:1, text:'The killer used a master key — the door was relocked from outside.', lr:{ A: 0.4, B: 0.3, C: 2.6 }, note:'Only library staff have master keys.' },
    { id:2, text:'A torn note was found in the victim\'s hand, naming an upcoming publication dispute.', lr:{ A: 2.2, B: 1.1, C: 0.7 }, note:'Dr. Vance is the rival on that publication.' },
    { id:3, text:'Security footage shows Park leaving the building at 11:32 PM, well before the estimated time of death.', lr:{ A: 1.4, B: 0.3, C: 1.4 }, note:'Park has a strong alibi.' },
    { id:4, text:'Vance was at a public faculty dinner from 10:30 PM until midnight, confirmed by 14 witnesses.', lr:{ A: 0.15, B: 1.1, C: 1.6 }, note:'Vance\'s alibi is unusually strong.' },
    { id:5, text:'A unique book from Whitcombe\'s personal cart was found in the locked room, hours before her shift.', lr:{ A: 0.9, B: 0.9, C: 2.0 }, note:'Whitcombe denies bringing it.' },
    { id:6, text:'Ainsworth was about to publish a report exposing Whitcombe for selling rare-book donations on the black market.', lr:{ A: 0.8, B: 0.8, C: 3.5 }, note:'Strong motive for Whitcombe — career-ending.' },
  ]
};

const StationDetective = ({ onComplete, recordScore }) => {
  const suspects = DetectiveCase.suspects;
  const clues = DetectiveCase.clues;
  const initial = { A: Math.round(DetectiveCase.prior.A*100), B: Math.round(DetectiveCase.prior.B*100), C: 100 - Math.round(DetectiveCase.prior.A*100) - Math.round(DetectiveCase.prior.B*100) };

  const [phase, setPhase] = React.useState('intro'); // intro | clue | submitted | accuse | reveal
  const [clueIdx, setClueIdx] = React.useState(0);
  // user belief trajectory: array of {A,B,C} (in %)
  const [trajectory, setTrajectory] = React.useState([initial]);
  // working values for current clue
  const [draft, setDraft] = React.useState({ A: initial.A, B: initial.B, C: initial.C });
  // optimal trajectory (LR-based)
  const optimalTrajectory = React.useMemo(() => {
    const opt = [DetectiveCase.prior];
    let odds = { ...DetectiveCase.prior };
    for (let i = 0; i < clues.length; i++) {
      odds = { A: odds.A * clues[i].lr.A, B: odds.B * clues[i].lr.B, C: odds.C * clues[i].lr.C };
      const tot = odds.A + odds.B + odds.C;
      opt.push({ A: odds.A/tot, B: odds.B/tot, C: odds.C/tot });
    }
    return opt;
  }, []);
  const [accusation, setAccusation] = React.useState(null);

  const currentBelief = trajectory[trajectory.length - 1];
  const draftSum = draft.A + draft.B + draft.C;
  const sumIsValid = Math.abs(draftSum - 100) <= 1;

  const beginClue = (i) => {
    setClueIdx(i);
    setDraft({ ...currentBelief });
    setPhase('clue');
  };

  const submitClue = () => {
    // normalize so they sum to 100
    const s = draft.A + draft.B + draft.C;
    if (s === 0) return;
    const norm = { A: Math.round((draft.A/s)*100), B: Math.round((draft.B/s)*100), C: 0 };
    norm.C = 100 - norm.A - norm.B;
    setTrajectory([...trajectory, norm]);
    setPhase('submitted');
  };

  const nextClue = () => {
    if (clueIdx + 1 >= clues.length) {
      setPhase('accuse');
      return;
    }
    beginClue(clueIdx + 1);
  };

  const resolve = () => {
    const guilty = DetectiveCase.truth;
    // score: avg L1 distance from optimal per step (lower is better)
    const optHist = optimalTrajectory.map(p => ({ A: Math.round(p.A*100), B: Math.round(p.B*100), C: Math.round(p.C*100) }));
    let totalGap = 0;
    for (let i = 0; i < trajectory.length; i++) {
      const u = trajectory[i], o = optHist[i];
      totalGap += (Math.abs(u.A - o.A) + Math.abs(u.B - o.B) + Math.abs(u.C - o.C)) / 2;
    }
    const avgGap = totalGap / trajectory.length;
    const right = accusation === guilty;
    const finalProb = trajectory[trajectory.length-1][guilty];
    recordScore('detective', { accusation, right, finalProb, avgGap, trajectory, optimal: optHist });
    setPhase('reveal');
  };

  // ── INTRO ───────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Detective" title={DetectiveCase.title} accent="var(--noise)">
        <p style={{ fontSize:16, color:'var(--ink-2)', lineHeight:1.55 }}>
          <strong>{DetectiveCase.victim}</strong> was {DetectiveCase.setting}. Three plausible suspects, six clues, one killer.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginTop:18 }}>
          {suspects.map(s => (
            <div key={s.id} style={{ padding:'18px 18px', borderRadius:16, background:'var(--bg-card)', border:'1px solid var(--line-2)' }}>
              <div className="mono" style={{ fontSize:11, color:s.color, textTransform:'uppercase', letterSpacing:'.14em' }}>Suspect {s.id}</div>
              <div className="serif" style={{ fontSize:20, fontWeight:600, marginTop:4 }}>{s.name}</div>
              <div style={{ fontSize:13, color:'var(--ink-3)' }}>{s.role}</div>
              <div className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginTop:8 }}>prior: 33%</div>
            </div>
          ))}
        </div>
        <Callout tone="signal" icon="◑">
          You'll see one clue at a time. After each clue, <strong>type your updated probabilities</strong> for all three suspects (they should sum to 100%). The detective who reasons best updates by likelihood ratios — but we want to see your intuition first. We'll grade you against the math at the end.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>beginClue(0)}>Read clue 1 →</Button>
        </div>
      </Panel>
    );
  }

  // ── CLUE STEP ────────────────────────────────────────────────────────
  if (phase === 'clue' || phase === 'submitted') {
    const clue = clues[clueIdx];
    const submitted = phase === 'submitted';
    const userPosterior = trajectory[trajectory.length - 1];
    const opt = optimalTrajectory[clueIdx + 1]; // optimal posterior after this clue
    const optPct = submitted ? { A: Math.round(opt.A*100), B: Math.round(opt.B*100), C: Math.round(opt.C*100) } : null;
    return (
      <Panel eyebrow={`Simulation · Detective · Clue ${clueIdx+1}/${clues.length}`} title="A new clue arrives." accent="var(--noise)">
        {/* clue card */}
        <div style={{ padding:'18px 22px', borderRadius:16, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:18 }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.15em' }}>evidence</div>
          <div className="serif" style={{ fontSize:20, lineHeight:1.35, color:'var(--ink)', marginTop:4 }}>{clue.text}</div>
          <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6, fontStyle:'italic' }}>{clue.note}</div>
        </div>

        {/* prior beliefs reminder */}
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>
          {submitted ? 'your updated beliefs · vs. the optimal Bayesian update' : 'before this clue, your beliefs were:'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:18 }}>
          {suspects.map(s => {
            const before = trajectory[trajectory.length - (submitted ? 2 : 1)][s.id];
            const userNow = userPosterior[s.id];
            const optNow = optPct ? optPct[s.id] : null;
            return (
              <div key={s.id} style={{ padding:'14px 16px', borderRadius:14, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
                  <div>
                    <span style={{ fontSize:15, fontWeight:600 }}>{s.name}</span>
                    <span className="mono" style={{ marginLeft:8, fontSize:12, color:'var(--ink-3)' }}>(was {before}%)</span>
                  </div>
                  {!submitted ? (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min="0" max="100" value={draft[s.id]}
                        onChange={(e)=>setDraft({ ...draft, [s.id]: Math.max(0, Math.min(100, +e.target.value || 0)) })}
                        style={{
                          width:64, padding:'8px 10px', borderRadius:8,
                          border:'1.5px solid var(--line-2)', background:'var(--bg-card)',
                          fontFamily:'"Geist Mono",monospace', fontSize:18, fontWeight:600, textAlign:'right', color:'var(--ink)'
                        }}/>
                      <span className="mono" style={{ fontSize:13, color:'var(--ink-3)' }}>%</span>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
                      <div className="mono" style={{ fontSize:18, fontWeight:600, color:'var(--ink)' }}>{userNow}%</div>
                      <div className="mono" style={{ fontSize:13, color:'var(--ink-4)' }}>opt {optNow}%</div>
                    </div>
                  )}
                </div>
                {/* dual-bar */}
                {!submitted ? (
                  <div style={{ position:'relative', height:8, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
                    <div style={{ width:`${draft[s.id]}%`, height:'100%', background:s.color, transition:'width .15s' }}/>
                  </div>
                ) : (
                  <div style={{ position:'relative', height:18 }}>
                    <div style={{ position:'absolute', left:0, right:0, top:0, height:8, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
                      <div style={{ width:`${userNow}%`, height:'100%', background:s.color, transition:'width .35s' }}/>
                    </div>
                    {/* optimal marker */}
                    <div style={{ position:'absolute', left:`calc(${optNow}% - 1px)`, top:-2, width:2, height:12, background:'var(--ink)' }}/>
                    <div className="mono" style={{ position:'absolute', left:`calc(${optNow}% + 4px)`, top:10, fontSize:10, color:'var(--ink)' }}>opt</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!submitted && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:10, background: sumIsValid ? 'var(--leaf-soft)' : 'var(--gold-soft)', border:`1px solid ${sumIsValid ? 'var(--leaf)' : 'var(--gold)'}`, marginBottom:14 }}>
            <div style={{ fontSize:13, color: sumIsValid ? 'var(--good)' : 'var(--gold)' }}>
              {sumIsValid ? 'Probabilities sum to 100%. Good.' : `Sum is ${draftSum}% — should be 100%. We'll auto-normalize on submit.`}
            </div>
            <Button onClick={submitClue} variant="primary" size="md" disabled={draftSum === 0}>Submit update →</Button>
          </div>
        )}

        {submitted && (() => {
          const gap = (Math.abs(userPosterior.A - optPct.A) + Math.abs(userPosterior.B - optPct.B) + Math.abs(userPosterior.C - optPct.C)) / 2;
          const tone = gap < 8 ? 'good' : gap < 18 ? 'gold' : 'noise';
          return (
            <div>
              <Callout tone={tone} icon={tone === 'good' ? '✓' : tone === 'gold' ? '◑' : '✗'}>
                <strong>{tone === 'good' ? 'Sharp updating.' : tone === 'gold' ? 'Reasonable, but off the math.' : 'You over- or under-reacted.'}</strong> Total deviation from the optimal posterior: <strong>{gap.toFixed(0)} points</strong>. {gap > 18 ? 'Strong evidence should move beliefs more; weak evidence shouldn\'t move them as much.' : ''}
              </Callout>
              <div style={{ display:'flex', gap:10, justifyContent:'space-between', alignItems:'center', marginTop:18 }}>
                <span className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>{clueIdx+1} of {clues.length} clues processed</span>
                <Button size="lg" onClick={nextClue}>{clueIdx+1 >= clues.length ? 'Make accusation →' : `Read clue ${clueIdx+2} →`}</Button>
              </div>
            </div>
          );
        })()}
      </Panel>
    );
  }

  // ── ACCUSE ──────────────────────────────────────────────────────────
  if (phase === 'accuse') {
    const finalBeliefs = trajectory[trajectory.length - 1];
    return (
      <Panel eyebrow="Simulation · Detective · Accusation" title="Name the killer." accent="var(--noise)">
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:10 }}>your final probabilities</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
          {suspects.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:10, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
              <div style={{ flex:'0 0 200px', fontSize:15, fontWeight:500 }}>{s.name}</div>
              <div style={{ flex:1, height:8, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
                <div style={{ width:`${finalBeliefs[s.id]}%`, height:'100%', background:s.color }}/>
              </div>
              <div className="mono" style={{ flex:'0 0 60px', textAlign:'right', fontSize:18, fontWeight:600 }}>{finalBeliefs[s.id]}%</div>
            </div>
          ))}
        </div>

        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:10 }}>I accuse...</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {suspects.map(s => (
            <button key={s.id} className="btn" onClick={()=>setAccusation(s.id)}
              style={{
                padding:'14px 16px', borderRadius:12, textAlign:'left',
                background: accusation === s.id ? 'var(--ink)' : 'var(--bg-card)',
                color: accusation === s.id ? 'var(--bg-card)' : 'var(--ink)',
                border: `1.5px solid ${accusation === s.id ? 'var(--ink)' : 'var(--line-2)'}`,
              }}>
              <div className="mono" style={{ fontSize:11, opacity:.6, letterSpacing:'.14em', textTransform:'uppercase'}}>{s.id}</div>
              <div className="serif" style={{ fontSize:16 }}>{s.name}</div>
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" disabled={!accusation} onClick={resolve}>Lock the accusation →</Button>
        </div>
      </Panel>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────────────────
  const guilty = DetectiveCase.truth;
  const right = accusation === guilty;
  const guiltySuspect = suspects.find(s => s.id === guilty);
  const finalUser = trajectory[trajectory.length - 1];
  const finalOpt = optimalTrajectory[optimalTrajectory.length - 1];
  const finalOptPct = { A: Math.round(finalOpt.A*100), B: Math.round(finalOpt.B*100), C: Math.round(finalOpt.C*100) };
  // gaps per step
  const stepGaps = trajectory.map((u, i) => {
    const o = optimalTrajectory[i];
    const oPct = { A: Math.round(o.A*100), B: Math.round(o.B*100), C: Math.round(o.C*100) };
    return (Math.abs(u.A - oPct.A) + Math.abs(u.B - oPct.B) + Math.abs(u.C - oPct.C)) / 2;
  });
  const avgGap = stepGaps.reduce((a,b)=>a+b,0) / stepGaps.length;

  return (
    <Panel eyebrow="Simulation · Detective · Resolved" title={right ? 'You got it.' : 'Wrong accusation.'} accent={right ? 'var(--leaf)' : 'var(--noise-2)'}>
      <Callout tone={right ? 'good' : 'noise'} icon={right ? '✓' : '✗'}>
        The killer was <strong>{guiltySuspect.name}</strong> — {guiltySuspect.role}. Your final probability on the true culprit: <strong>{finalUser[guilty]}%</strong> (optimal Bayesian: {finalOptPct[guilty]}%).
      </Callout>

      {/* trajectory chart — user vs optimal for the truth */}
      <div style={{ marginTop:16, padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>
          P({guiltySuspect.name} = guilty) over the investigation
        </div>
        <svg viewBox="0 0 480 180" width="100%" style={{ maxHeight:180 }}>
          {[0,.25,.5,.75,1].map((t,i)=>(
            <g key={i}>
              <line x1="30" x2="460" y1={20 + t*140} y2={20 + t*140} stroke="var(--line)" strokeDasharray={i===0||i===4?'':'2 4'}/>
              <text x="22" y={24 + t*140} fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">{Math.round((1-t)*100)}</text>
            </g>
          ))}
          {/* optimal line */}
          <polyline fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeDasharray="4 4"
            points={optimalTrajectory.map((p, i) => {
              const x = 30 + (i/(trajectory.length-1)) * 430;
              const y = 160 - Math.round(p[guilty]*100)/100 * 140;
              return `${x},${y}`;
            }).join(' ')}/>
          {/* user line */}
          <polyline fill="none" stroke="var(--signal)" strokeWidth="2.5"
            points={trajectory.map((p, i) => {
              const x = 30 + (i/(trajectory.length-1)) * 430;
              const y = 160 - p[guilty]/100 * 140;
              return `${x},${y}`;
            }).join(' ')}/>
          {trajectory.map((p,i) => {
            const x = 30 + (i/(trajectory.length-1)) * 430;
            const y = 160 - p[guilty]/100 * 140;
            return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--signal)"/>;
          })}
          {/* labels */}
          <text x="40" y="16" fontSize="10" fill="var(--signal)" className="mono">— you</text>
          <text x="100" y="16" fontSize="10" fill="var(--ink-3)" className="mono">- - optimal</text>
        </svg>
        <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--ink-4)', padding:'0 30px 0 30px', marginTop:-4 }}>
          <span>prior</span>
          {clues.map((_,i) => <span key={i}>clue {i+1}</span>)}
        </div>
      </div>

      {/* final tally */}
      <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {suspects.map(s => (
          <div key={s.id} style={{ padding:14, borderRadius:14, background: s.id === guilty ? 'var(--leaf-soft)' : 'var(--bg-card)', border:`1.5px solid ${s.id === guilty ? 'var(--leaf)':'var(--line)'}` }}>
            <div className="mono" style={{ fontSize:11, color:s.color, textTransform:'uppercase', letterSpacing:'.14em' }}>{s.id}{s.id===guilty?' · guilty':''}</div>
            <div className="serif" style={{ fontSize:17 }}>{s.name}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginTop:4 }}>
              <div className="mono" style={{ fontSize:22, fontWeight:600, color: s.id === guilty ? 'var(--good)' : 'var(--ink)'}}>{finalUser[s.id]}%</div>
              <div className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>opt {finalOptPct[s.id]}%</div>
            </div>
          </div>
        ))}
      </div>

      <Callout tone="signal" icon="◆">
        <strong>Avg. distance from optimal updates:</strong> {avgGap.toFixed(1)} points per step. {avgGap < 8 ? 'Sharp Bayesian reasoning.' : avgGap < 18 ? 'Reasonable intuition, with some overreactions.' : 'Big swings — try to weight strong evidence more and weak evidence less.'}
      </Callout>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <Button size="lg" onClick={onComplete}>Back to lab →</Button>
      </div>
    </Panel>
  );
};

// ─── Stock Picker ───────────────────────────────────────────────────────
const StockPool = [
  { id:'s1', ticker:'NRTH', name:'North Industries',  truth: 0.72, signals: [
    { kind:'analyst', text:'4 of 5 analysts rate Buy.', strength:'strong-pos' },
    { kind:'perf',    text:'Up 8% in the last month, beating sector by 3%.', strength:'mod-pos' },
    { kind:'news',    text:'CEO publicly bullish in earnings call last week.', strength:'mod-pos' },
  ]},
  { id:'s2', ticker:'GLDX', name:'Goldex Mining', truth: 0.34, signals: [
    { kind:'analyst', text:'Mixed analyst coverage (2 Buy, 3 Hold, 2 Sell).', strength:'weak-neg' },
    { kind:'perf',    text:'Flat over 12 months, with two volatility spikes.', strength:'mixed' },
    { kind:'news',    text:'Whistleblower lawsuit filed last week, status unclear.', strength:'strong-neg' },
  ]},
  { id:'s3', ticker:'BRGT', name:'Brightline Logistics', truth: 0.58, signals: [
    { kind:'analyst', text:'Consensus rating: Hold with positive bias.', strength:'mod-pos' },
    { kind:'perf',    text:'Up 4% YTD, in line with sector.', strength:'weak-pos' },
    { kind:'news',    text:'Won small Fed contract; competitors didn\'t bid.', strength:'mod-pos' },
  ]},
  { id:'s4', ticker:'OMNI', name:'Omni Health',  truth: 0.18, signals: [
    { kind:'analyst', text:'3 downgrades in the last quarter; only 1 Buy left.', strength:'strong-neg' },
    { kind:'perf',    text:'Down 22% over 6 months.', strength:'strong-neg' },
    { kind:'news',    text:'FDA delayed approval on lead pipeline drug.', strength:'strong-neg' },
  ]},
  { id:'s5', ticker:'VRDA', name:'Verdant Foods', truth: 0.52, signals: [
    { kind:'analyst', text:'New IPO — only 1 analyst covers, rates Buy.', strength:'mixed' },
    { kind:'perf',    text:'Listed 3 months ago, up 6% from IPO price.', strength:'weak-pos' },
    { kind:'news',    text:'Small sample of customer reviews skews positive.', strength:'weak-pos' },
  ]},
  { id:'s6', ticker:'AXOL', name:'Axol Semiconductors', truth: 0.78, signals: [
    { kind:'analyst', text:'Top sector pick across 4 major firms.', strength:'strong-pos' },
    { kind:'perf',    text:'Up 41% YTD, sector up 22%.', strength:'strong-pos' },
    { kind:'news',    text:'Major customer just announced a $2B order.', strength:'strong-pos' },
  ]},
];

const StationStock = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [bankroll, setBankroll] = React.useState(1000);
  const [prob, setProb] = React.useState(50);
  const [stake, setStake] = React.useState(10); // % of bankroll
  const [phase, setPhase] = React.useState('analyze'); // analyze | reveal | done
  const [history, setHistory] = React.useState([]);

  const cur = StockPool[idx];

  const place = () => {
    const wager = Math.round(bankroll * (stake / 100));
    // outcome
    const rng = mulberry32(idx * 999 + Math.floor(cur.truth * 1000));
    const up = rng() < cur.truth;
    // generate a realistic price movement (% change)
    // up moves: 1–12%, down moves: -1 to -10%, magnitude varies
    const magBase = 2 + rng() * 9;
    const move = up ? magBase : -(magBase * 0.85);
    const movePct = +move.toFixed(2);
    // direction: user "calls" up if prob > 50, down if < 50
    const userCallsUp = prob > 50;
    const win = (userCallsUp && up) || (!userCallsUp && !up);
    const delta = win ? wager : -wager;
    const newBankroll = bankroll + delta;
    setHistory([...history, { ...cur, prob, wager, up, win, delta, newBankroll, movePct }]);
    setPhase('reveal');
  };

  const next = () => {
    const last = history[history.length-1];
    setBankroll(last.newBankroll);
    if (idx + 1 >= StockPool.length) {
      const finalBankroll = last.newBankroll;
      const totalReturn = (finalBankroll - 1000) / 1000;
      const avgBrier = history.reduce((s,h) => s + Math.pow(h.prob/100 - (h.up?1:0), 2), 0) / history.length;
      recordScore('stock', { final: finalBankroll, totalReturn, avgBrier, history });
      setPhase('done');
      return;
    }
    setIdx(idx + 1);
    setProb(50);
    setStake(10);
    setPhase('analyze');
  };

  if (phase === 'done') {
    return (
      <Panel eyebrow="Simulation · Stock Picker · Resolved" title={`You closed at $${bankroll.toLocaleString()}.`} accent={bankroll > 1000 ? 'var(--leaf)' : 'var(--noise-2)'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
          <Stat label="Final bankroll" value={`$${bankroll.toLocaleString()}`} tone={bankroll > 1000 ? 'good' : 'bad'}/>
          <Stat label="Total return" value={`${bankroll > 1000 ? '+' : ''}${(((bankroll-1000)/1000)*100).toFixed(1)}%`}/>
          <Stat label="Avg Brier on calls" value={(history.reduce((s,h) => s + Math.pow(h.prob/100 - (h.up?1:0), 2), 0) / history.length).toFixed(3)} tone="signal"/>
        </div>

        {/* trades table */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.2fr 1fr', padding:'10px 14px', background:'var(--bg-soft)', borderBottom:'1px solid var(--line)' }} className="mono">
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em'}}>ticker</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em'}}>your call</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em'}}>truth</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em'}}>movement</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', textAlign:'right'}}>P&L</span>
          </div>
          {history.map((h,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.2fr 1fr', padding:'10px 14px', borderBottom: i < history.length-1 ? '1px solid var(--line)' : 'none' }} className="mono">
              <span style={{ fontWeight:600 }}>{h.ticker}</span>
              <span>{h.prob}%</span>
              <span style={{ color:'var(--ink-3)'}}>{Math.round(h.truth*100)}%</span>
              <span style={{ color: h.up ? 'var(--good)' : 'var(--bad)' }}>{h.up ? '▲' : '▼'} {h.movePct > 0 ? '+' : ''}{h.movePct.toFixed(1)}%</span>
              <span style={{ textAlign:'right', color: h.win ? 'var(--good)' : 'var(--bad)', fontWeight:600 }}>{h.win ? '+' : ''}{h.delta}</span>
            </div>
          ))}
        </div>

        <Callout tone="signal" icon="◑">
          <strong>The lesson:</strong> good forecasters size their bets to their confidence. Going all-in on a 55% call is reckless; betting tiny on a 90% call leaves money on the table. The Kelly criterion says bet a fraction proportional to your edge.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'reveal') {
    const last = history[history.length-1];
    const moveStr = `${last.movePct > 0 ? '+' : ''}${last.movePct.toFixed(1)}%`;
    return (
      <Panel eyebrow={`Simulation · Stock Picker · ${idx+1}/${StockPool.length}`} title={`${cur.ticker} closed ${moveStr}`} accent={last.win ? 'var(--leaf)' : 'var(--noise-2)'}>
        {/* big price movement display */}
        <div style={{ padding:'20px 24px', borderRadius:16, background: last.up ? 'var(--leaf-soft)':'var(--noise-soft)', border:`1.5px solid ${last.up ? 'var(--leaf)':'var(--noise)'}`, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div className="mono" style={{ fontSize:11, color:last.up ? 'var(--good)' : 'var(--bad)', textTransform:'uppercase', letterSpacing:'.14em' }}>{last.up ? 'closed up' : 'closed down'}</div>
            <div className="serif" style={{ fontSize:38, fontWeight:600, color: last.up ? 'var(--good)' : 'var(--bad)', lineHeight:1.1, marginTop:2 }}>
              {last.up ? '▲' : '▼'} {moveStr}
            </div>
            <div className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>actual move · flavour only — payoff is fixed ±stake on direction</div>
          </div>
          <Stamp label={last.win ? 'right call' : 'wrong call'} tone={last.win ? 'good':'bad'}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <Stat label="Your call" value={`${last.prob}%`} sub={last.prob > 50 ? 'predicting up' : last.prob < 50 ? 'predicting down' : 'coin flip'}/>
          <Stat label="True probability" value={`${Math.round(cur.truth*100)}%`} tone="signal" sub="the underlying odds"/>
          <Stat label="P&L this trade" value={`${last.win ? '+' : ''}$${last.delta}`} tone={last.win ? 'good' : 'bad'}/>
        </div>
        <div style={{ padding:'14px 18px', borderRadius:12, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>bankroll</div>
          <div className="mono" style={{ fontSize:28, fontWeight:600 }}>${last.newBankroll.toLocaleString()}</div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={next}>{idx+1 >= StockPool.length ? 'Close positions →' : 'Next stock →'}</Button>
        </div>
      </Panel>
    );
  }

  // analyze phase
  const signalLabels = {
    'strong-pos':{ icon:'▲▲', tone:'leaf', label:'strongly positive'},
    'mod-pos':   { icon:'▲',  tone:'leaf', label:'positive'},
    'weak-pos':  { icon:'△',  tone:'leaf', label:'mildly positive'},
    'mixed':     { icon:'◇',  tone:'neutral', label:'mixed signal'},
    'weak-neg':  { icon:'▽',  tone:'noise', label:'mildly negative'},
    'mod-neg':   { icon:'▼',  tone:'noise', label:'negative'},
    'strong-neg':{ icon:'▼▼', tone:'noise', label:'strongly negative'},
  };
  const wager = Math.round(bankroll * (stake / 100));
  return (
    <Panel eyebrow={`Simulation · Stock Picker · ${idx+1}/${StockPool.length}`} title={`${cur.ticker} · ${cur.name}`} accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ color:'var(--ink-3)' }}>Reading the signals before next month's earnings.</span>
        <div className="mono" style={{ fontSize:13, color:'var(--ink-3)' }}>bankroll <strong style={{ color:'var(--ink)' }}>${bankroll.toLocaleString()}</strong></div>
      </div>

      {/* signals */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
        {cur.signals.map((sig,i) => {
          const m = signalLabels[sig.strength];
          return (
            <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
              <div className="mono" style={{ flex:'0 0 36px', textAlign:'center', fontSize:14, fontWeight:600, color: m.tone === 'leaf' ? 'var(--good)' : m.tone === 'noise' ? 'var(--bad)' : 'var(--ink-3)' }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div className="mono" style={{ fontSize:10.5, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>{sig.kind} signal · {m.label}</div>
                <div style={{ fontSize:14, color:'var(--ink-2)', marginTop:2 }}>{sig.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom:6, color:'var(--ink-2)', fontSize:14 }}>P(stock goes up next month)?</div>
      <ProbabilitySlider value={prob} onChange={setProb} lowLabel="down" highLabel="up"/>

      <Callout tone="gold" icon="◑">
        This is an <strong>even-money directional contract</strong>: you're betting purely on <em>direction</em>. Call it right and you win your stake; call it wrong and you lose it — the size of the price move doesn't change the payoff. So all that matters is your probability and how much you stake.
      </Callout>

      <div style={{ marginTop:16, padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <span style={{ fontSize:14, color:'var(--ink-2)' }}>Bet size (win or lose this amount)</span>
          <span className="mono" style={{ fontSize:16, fontWeight:600 }}>${wager} <span style={{ color:'var(--ink-3)', fontSize:12 }}>({stake}% of bankroll)</span></span>
        </div>
        <input type="range" min="0" max="100" value={stake} onChange={(e)=>setStake(+e.target.value)}/>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', marginTop:-2 }}>For an even-money bet, Kelly stakes 2p−1 of your bankroll on your edge — roughly {Math.max(0, Math.round(Math.abs((prob/100)*2 - 1) * 100))}% here.</div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <Button size="lg" onClick={place}>Lock the trade →</Button>
      </div>
    </Panel>
  );
};

Object.assign(window, { StationElection, StationDetective, StationStock });
