// sims-decision.jsx — decision-under-information simulations

// ─── Trial Lawyer ────────────────────────────────────────────────────────
// Sequential evidence in a courtroom. Update P(guilty), then choose conviction threshold.
const TrialCase = {
  defendant:'James Crowell',
  charge:'second-degree murder',
  victim:'his business partner',
  prior:.15, // most people accused don't go to trial, but those that do — depends
  evidence: [
    { id:1, text:'Defendant was the last known person to see the victim alive (per phone records).', lr:1.6, note:'Common in homicide cases involving close associates — moderate but not decisive.' },
    { id:2, text:'Defendant had taken out a $2M insurance policy on the victim 6 months before.', lr:3.0, note:'Strong motive evidence. Insurance windows are a known red flag.' },
    { id:3, text:'Defendant\'s alibi is corroborated by 1 family member (sister).', lr:0.8, note:'Weak alibi — close family corroboration is the lowest-credibility category.' },
    { id:4, text:'No physical evidence (DNA, prints) links defendant to the scene.', lr:0.5, note:'Negative evidence. Reduces probability but doesn\'t exclude.' },
    { id:5, text:'A neighbor reports seeing "a tall man matching the defendant\'s build" enter the victim\'s home at 9:14 PM. Defendant is 5\'7" and average build.', lr:0.7, note:'Marginal — the description doesn\'t actually match the defendant well.' },
    { id:6, text:'Internet search history shows defendant searched "how long does it take to die from blood loss" 3 days before the murder.', lr:5.5, note:'Devastating evidence. Hard to explain innocently.' },
    { id:7, text:'Defendant\'s lawyer presents bank records showing the victim was being blackmailed by an unknown third party.', lr:0.45, note:'Introduces a credible alternative suspect.' },
  ],
};

const StationTrial = ({ onComplete, recordScore }) => {
  const [phase, setPhase] = React.useState('intro'); // intro | evidence | threshold | verdict | reveal
  const [evidenceIdx, setEvidenceIdx] = React.useState(0);
  const [belief, setBelief] = React.useState(Math.round(TrialCase.prior * 100));
  const [trajectory, setTrajectory] = React.useState([Math.round(TrialCase.prior * 100)]);
  const [threshold, setThreshold] = React.useState(95);
  const [verdict, setVerdict] = React.useState(null); // 'guilty' | 'not_guilty'

  // optimal trajectory
  const optimal = React.useMemo(() => {
    let odds = TrialCase.prior / (1 - TrialCase.prior);
    const traj = [TrialCase.prior];
    for (const ev of TrialCase.evidence) {
      odds *= ev.lr;
      traj.push(odds / (1 + odds));
    }
    return traj;
  }, []);
  const finalOptimal = optimal[optimal.length - 1];

  const truth = finalOptimal > 0.7; // Bayes-optimal answer; we'll treat this as the "truth" the puzzle is calibrated against

  const seeEvidence = () => {
    setBelief(trajectory[trajectory.length - 1]);
    setPhase('evidence');
  };

  const lockUpdate = () => {
    const newTraj = [...trajectory, belief];
    setTrajectory(newTraj);
    if (evidenceIdx + 1 >= TrialCase.evidence.length) {
      setPhase('threshold');
      return;
    }
    setEvidenceIdx(evidenceIdx + 1);
  };

  const decide = (v) => {
    setVerdict(v);
    // resolve
    const finalBelief = belief / 100;
    const optimalChoice = finalOptimal >= threshold/100 ? 'guilty' : 'not_guilty';
    const userChoice = finalBelief >= threshold/100 ? 'guilty' : 'not_guilty';
    const actualChoice = v;
    const matchedThreshold = userChoice === actualChoice;
    const calibrated = Math.abs(finalBelief - finalOptimal) < 0.10;
    // grading
    const correct = actualChoice === optimalChoice;
    recordScore('trial', { finalBelief, finalOptimal, threshold, verdict: v, correct, matchedThreshold, calibrated, trajectory: [...trajectory, belief], optimal });
    setPhase('reveal');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Trial Lawyer" title={`The State v. ${TrialCase.defendant}`} accent="var(--noise-2)">
        <Callout tone="signal" icon="⚖">
          {TrialCase.defendant} is charged with the {TrialCase.charge} of {TrialCase.victim}. You'll receive 7 pieces of evidence sequentially. After each, set your P(guilty). At the end, choose your conviction threshold and deliver a verdict.
        </Callout>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
          <Stat label="Prior" value={`${Math.round(TrialCase.prior*100)}%`} sub="base rate before any evidence"/>
          <Stat label="Evidence to come" value={`${TrialCase.evidence.length}`}/>
        </div>
        <Callout tone="gold" icon="◑">
          Reminder: in criminal trials, the standard is "beyond a reasonable doubt" — often interpreted as ~90-95% certainty. Decide your own threshold based on the asymmetric cost of false conviction vs false acquittal.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={seeEvidence}>Begin trial →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'evidence') {
    const ev = TrialCase.evidence[evidenceIdx];
    const prevBelief = trajectory[trajectory.length - 1];
    return (
      <Panel eyebrow={`Simulation · Trial · Evidence ${evidenceIdx+1}/${TrialCase.evidence.length}`} title="New evidence presented." accent="var(--noise-2)">
        <ProgressDots total={TrialCase.evidence.length} current={evidenceIdx}/>
        <div style={{ padding:'20px 22px', borderRadius:16, background:'var(--bg-soft)', border:'1px solid var(--line)', marginTop:14, marginBottom:16 }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>exhibit {evidenceIdx+1}</div>
          <div className="serif" style={{ fontSize:20, lineHeight:1.35, marginTop:4 }}>{ev.text}</div>
        </div>

        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6 }}>before this evidence: {prevBelief}%</div>
        <div style={{ marginBottom:8, color:'var(--ink-2)' }}>Your updated P(guilty):</div>
        <ProbabilitySlider value={belief} onChange={setBelief} lowLabel="innocent" highLabel="guilty" accent="var(--noise-2)"/>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={lockUpdate}>{evidenceIdx + 1 >= TrialCase.evidence.length ? 'Set threshold →' : 'Hear next evidence →'}</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'threshold') {
    return (
      <Panel eyebrow="Simulation · Trial · Threshold" title="What threshold convicts?" accent="var(--noise-2)">
        <Callout tone="signal" icon="⚖">
          A higher threshold means more wrongful acquittals; a lower threshold means more wrongful convictions. Choose based on how asymmetric you believe the costs are.
        </Callout>
        <div style={{ marginTop:18, padding:'18px 22px', borderRadius:16, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div style={{ marginBottom:8, color:'var(--ink-2)' }}>Conviction threshold:</div>
          <ProbabilitySlider value={threshold} onChange={setThreshold} lowLabel="acquit easily" highLabel="never convict" accent="var(--noise-2)"/>
          <div className="mono" style={{ fontSize:13, color:'var(--ink-3)', marginTop:14 }}>
            {threshold < 60 ? 'A loose threshold. You will convict on weak evidence.' :
             threshold < 75 ? 'A civil-court-style threshold ("preponderance of evidence").' :
             threshold < 85 ? 'A moderate threshold — looser than "beyond reasonable doubt."' :
             threshold < 95 ? 'Standard criminal-trial threshold ("beyond reasonable doubt").' :
                              'A very strict threshold. Most cases would acquit.'}
          </div>
        </div>

        <div style={{ marginTop:18, padding:'18px 22px', borderRadius:16, background:'var(--bg-card)', border:'1.5px solid var(--ink)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>your final belief</div>
          <div className="mono" style={{ fontSize:32, fontWeight:600 }}>{belief}% guilty</div>
          <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:4 }}>
            {belief >= threshold ? 'Above threshold — verdict should be GUILTY.' : 'Below threshold — verdict should be NOT GUILTY.'}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" variant="ghost" onClick={()=>decide('not_guilty')}>Vote: not guilty</Button>
          <Button size="lg" onClick={()=>decide('guilty')}>Vote: guilty</Button>
        </div>
      </Panel>
    );
  }

  // reveal
  return (
    <Panel eyebrow="Simulation · Trial · Verdict" title={verdict === 'guilty' ? 'You voted GUILTY.' : 'You voted NOT GUILTY.'} accent={verdict === 'guilty' ? 'var(--noise-2)' : 'var(--leaf)'}>
      <Callout tone="signal" icon="⚖">
        Your final P(guilty): <strong>{belief}%</strong>. The Bayes-optimal posterior given all 7 pieces of evidence: <strong>{Math.round(finalOptimal*100)}%</strong>. Your conviction threshold: <strong>{threshold}%</strong>.
      </Callout>

      {/* trajectory chart */}
      <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)', marginTop:14 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>belief trajectory · you vs. Bayes-optimal</div>
        <svg viewBox="0 0 480 200" width="100%" style={{ maxHeight:200 }}>
          {[0,.25,.5,.75,1].map((t,i)=>(
            <line key={i} x1="30" x2="460" y1={20 + t*160} y2={20 + t*160} stroke="var(--line)" strokeDasharray={i===0||i===4?'':'2 4'}/>
          ))}
          <line x1="30" x2="460" y1={20 + (1-threshold/100)*160} y2={20 + (1-threshold/100)*160} stroke="var(--noise-2)" strokeDasharray="3 3" strokeWidth="1.5"/>
          <text x="450" y={20 + (1-threshold/100)*160 - 4} fontSize="10" fill="var(--noise-2)" textAnchor="end" className="mono">conviction threshold</text>
          {/* optimal */}
          <polyline fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeDasharray="4 4"
            points={optimal.map((p, i) => {
              const x = 30 + (i / (optimal.length-1)) * 430;
              const y = 20 + (1 - p) * 160;
              return `${x},${y}`;
            }).join(' ')}/>
          {/* user */}
          <polyline fill="none" stroke="var(--signal)" strokeWidth="2.5"
            points={trajectory.map((p, i) => {
              const x = 30 + (i / (optimal.length-1)) * 430;
              const y = 20 + (1 - p/100) * 160;
              return `${x},${y}`;
            }).join(' ')}/>
          {trajectory.map((p,i) => {
            const x = 30 + (i / (optimal.length-1)) * 430;
            const y = 20 + (1 - p/100) * 160;
            return <circle key={i} cx={x} cy={y} r="3" fill="var(--signal)"/>;
          })}
          <text x="40" y="14" fontSize="10" fill="var(--signal)" className="mono">— you</text>
          <text x="100" y="14" fontSize="10" fill="var(--ink-3)" className="mono">- - Bayes-optimal</text>
        </svg>
      </div>

      <Callout tone="signal" icon="◆">
        <strong>What this case teaches:</strong> evidence #6 (the search history) was the decisive piece — a likelihood ratio of ~5.5×, hard to explain innocently. Most people undershoot it. The defense's alternative suspect (ev #7) had a smaller mitigating effect than people emotionally felt. Real evidence is multiplicative; emotional weight is not. Even so, the Bayes-optimal posterior lands near {Math.round(finalOptimal*100)}% — below any reasonable conviction threshold. A strong-feeling case can still fall short of "beyond reasonable doubt."
      </Callout>

      <Callout tone="gold" icon="!">
        <strong>Two caveats.</strong> (1) These seven likelihood ratios are multiplied assuming each is <em>conditionally independent</em> given guilt — a simplification; overlapping evidence should really count for less. (2) The 15% starting prior is P(guilty) for <em>this</em> defendant before any evidence — deliberately different from the ~83% "trial-conviction rate" in the Brier Arena, which is P(conviction | a case already reached trial), a heavily filtered subset. Same words, different question.
      </Callout>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <Button size="lg" onClick={onComplete}>Back to lab →</Button>
      </div>
    </Panel>
  );
};

// ─── VC Portfolio ────────────────────────────────────────────────────────
// Allocate $10M across 8 startups. Each startup's 10-year outcome is a random
// DRAW from a distribution — {zero, base, big} — so no single startup is a
// guaranteed winner. Signals hint at the distribution but never reveal the draw.
// You're graded on the expected value (EV) of your allocation (strategy), while
// the realised draw (luck) is shown separately.
const VCPool = [
  { id:1, name:'Stratify',   sector:'B2B SaaS',     pBig:.04, bigMult:12, pBase:.35, baseMult:2.2, signals:['Solo founder, 1st time','Decent traction','Crowded market'] },
  { id:2, name:'Holocene',   sector:'climate-tech', pBig:.12, bigMult:15, pBase:.30, baseMult:3.0, signals:['Two technical co-founders','Novel materials science','3 LOIs from majors'] },
  { id:3, name:'Pintail',    sector:'consumer',     pBig:.02, bigMult:10, pBase:.18, baseMult:1.5, signals:['Hot at YC demo day','High burn','Reviews trend negative'] },
  { id:4, name:'Lazuli',     sector:'fintech',      pBig:.06, bigMult:12, pBase:.38, baseMult:2.5, signals:['Strong technical co-founder','Regulated space','Mid traction'] },
  { id:5, name:'Vellichor',  sector:'consumer AI',  pBig:.10, bigMult:14, pBase:.34, baseMult:2.8, signals:['Repeat founder (1 exit)','Real moat','Recent product-market fit'] },
  { id:6, name:'Drachma',    sector:'crypto',       pBig:.05, bigMult:20, pBase:.12, baseMult:1.2, signals:['Trendy vertical','Unclear regulation','Founder turnover'] },
  { id:7, name:'Sundial',    sector:'devtools',     pBig:.07, bigMult:11, pBase:.40, baseMult:2.4, signals:['Loved by power users','Slow but real growth','Open source moat'] },
  { id:8, name:'Marrow',     sector:'biotech',      pBig:.09, bigMult:16, pBase:.10, baseMult:2.0, signals:['Promising preclinical','But FDA path unclear','Founder is a scientist, not an operator'] },
];
const vcEV = (s) => s.pBig * s.bigMult + s.pBase * s.baseMult;

const StationVC = ({ onComplete, recordScore }) => {
  const total = 10000; // $10k units, $10M total
  const [allocs, setAllocs] = React.useState(Object.fromEntries(VCPool.map(s => [s.id, 0])));
  const [phase, setPhase] = React.useState('intro');
  const [outcomes, setOutcomes] = React.useState(null); // id -> realised multiple (sampled at reveal)

  const remaining = total - Object.values(allocs).reduce((a,b)=>a+b, 0);
  const setAlloc = (id, value) => {
    const others = total - (Object.values(allocs).reduce((a,b)=>a+b,0) - allocs[id]);
    setAllocs({ ...allocs, [id]: Math.max(0, Math.min(others, value)) });
  };

  const evs = VCPool.map(vcEV);
  const equalSplitEV = evs.reduce((a,b)=>a+b,0) / evs.length;
  const maxEV = Math.max(...evs);
  const expectedMult = VCPool.reduce((s,c)=>s + allocs[c.id] * vcEV(c), 0) / total;

  // Resolve: sample each startup's outcome now (in a handler, not during render),
  // record the score, then advance. Replayable because sampling is non-seeded.
  const resolve = () => {
    const o = {};
    for (const s of VCPool) {
      const r = Math.random();
      o[s.id] = r < s.pBig ? s.bigMult : r < s.pBig + s.pBase ? s.baseMult : 0;
    }
    setOutcomes(o);
    const realisedMult = VCPool.reduce((s,c)=>s + allocs[c.id] * o[c.id], 0) / total;
    recordScore('vc', { portfolioMult: realisedMult, expectedMult, equalSplitEV, maxEV, allocs, totalUnits: total });
    setPhase('reveal');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · VC Portfolio" title="You have $10M to allocate across 8 startups." accent="var(--gold)">
        <Callout tone="signal" icon="◔">
          Each startup has visible signals — sector, team, traction notes. There are no guaranteed winners: every startup's 10-year outcome is a random draw. Most fizzle to nothing, some return a modest multiple, a few hit big. The signals tilt the odds; they don't fix the result.
        </Callout>
        <p style={{ color:'var(--ink-2)', marginTop:14, fontSize:15 }}>
          You'll be graded on the <strong>expected value</strong> of your allocation — did you put money behind the genuinely high-odds bets? Then we roll the dice and show the <strong>realised</strong> outcome too. The gap between them is luck, and it's exactly why VCs spread a fund across many good bets instead of staking it all on the one that looks obvious.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('allocate')}>Review startups →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'reveal' && outcomes) {
    const realisedMult = VCPool.reduce((s,c)=>s + allocs[c.id] * outcomes[c.id], 0) / total;
    const evVerdict = expectedMult >= 2.2 ? { t:'good', l:'Sharp signal-reading' }
                    : expectedMult >= equalSplitEV ? { t:'gold', l:'Beat the naive split' }
                    : { t:'bad', l:'Spread into weak bets' };
    return (
      <Panel eyebrow="Simulation · VC Portfolio · Resolved · 10 years later" title={`Realised return: ${realisedMult.toFixed(2)}×`} accent={realisedMult > 2 ? 'var(--leaf)' : realisedMult > 1 ? 'var(--gold)' : 'var(--noise-2)'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:8 }}>
          <Stat label="Realised (luck)" value={`${realisedMult.toFixed(2)}×`} tone={realisedMult > 2 ? 'good' : realisedMult > 1 ? 'neutral' : 'bad'} sub="this one roll"/>
          <Stat label="Expected (skill)" value={`${expectedMult.toFixed(2)}×`} tone={expectedMult >= equalSplitEV ? 'good' : 'bad'} sub="EV of your bets"/>
          <Stat label="Equal-split EV" value={`${equalSplitEV.toFixed(2)}×`} sub="spread evenly"/>
          <Stat label="Best-EV possible" value={`${maxEV.toFixed(2)}×`} sub="all-in top pick"/>
        </div>
        <div style={{ marginBottom:14 }}><Stamp label={evVerdict.l} tone={evVerdict.t === 'good' ? 'good' : evVerdict.t === 'bad' ? 'bad' : 'gold'}/></div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr .9fr .8fr .9fr 1fr', padding:'10px 14px', background:'var(--bg-soft)', borderBottom:'1px solid var(--line)' }} className="mono">
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>startup</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>your stake</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>EV</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>drew</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', textAlign:'right' }}>returned</span>
          </div>
          {VCPool.map((c, i) => {
            const m = outcomes[c.id];
            const returned = allocs[c.id] * m * 100;
            const stake = allocs[c.id] * 100;
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.4fr .9fr .8fr .9fr 1fr', padding:'10px 14px', borderBottom: i < VCPool.length-1 ? '1px solid var(--line)':'none' }} className="mono">
                <span style={{ fontSize:13, fontWeight:500 }}>{c.name}</span>
                <span style={{ fontSize:13 }}>${(stake/1000).toFixed(0)}k</span>
                <span style={{ fontSize:13, color:'var(--ink-3)' }}>{vcEV(c).toFixed(2)}×</span>
                <span style={{ fontSize:12, color: m === 0 ? 'var(--bad)' : m >= 5 ? 'var(--good)' : 'var(--ink-3)' }}>{m === 0 ? '0× (failed)' : m >= 10 ? `${m}× unicorn` : `${m}×`}</span>
                <span style={{ fontSize:13, textAlign:'right', color: returned > stake ? 'var(--good)' : returned > 0 ? 'var(--ink-2)' : 'var(--bad)', fontWeight:600 }}>${(returned/1000).toFixed(0)}k</span>
              </div>
            );
          })}
        </div>
        <Callout tone="signal" icon="◆">
          <strong>Skill vs. luck.</strong> Your grade is the EV column — allocating toward high-EV startups (Holocene, Vellichor, Sundial) is the skill. But this single roll could land anywhere: a high-EV bet still fails most of the time, and a long-shot like Drachma occasionally 20×'s. Replay it and the realised number will jump around while the EV stays put. That variance is why a real fund spreads across many positive-EV bets rather than staking everything on the one that looks obvious.
        </Callout>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
          <Button variant="ghost" onClick={()=>{ setOutcomes(null); setPhase('allocate'); }}>↻ Replay (new roll)</Button>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  // allocate
  return (
    <Panel eyebrow="Simulation · VC Portfolio · Allocate" title={`Remaining: $${(remaining * 100 / 10000).toFixed(0)}M of $10M`} accent="var(--gold)">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {VCPool.map(s => (
          <div key={s.id} style={{ padding:'14px 16px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div>
                <div className="serif" style={{ fontSize:18, fontWeight:600 }}>{s.name} <span className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>({s.sector})</span></div>
                <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:2 }}>{s.signals.join(' · ')}</div>
              </div>
              <div className="mono" style={{ fontSize:18, fontWeight:600 }}>${(allocs[s.id]/10).toFixed(1)}k <span style={{ fontSize:11, color:'var(--ink-3)' }}>·{(allocs[s.id]/total*100).toFixed(0)}%</span></div>
            </div>
            <input type="range" min="0" max={Math.min(total, allocs[s.id] + remaining)} step={50} value={allocs[s.id]} onChange={(e)=>setAlloc(s.id, +e.target.value)}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18 }}>
        <span className="mono" style={{ fontSize:13, color:'var(--ink-3)' }}>{remaining === 0 ? '✓ Fully allocated' : `$${(remaining*100/total).toFixed(0)}M unallocated — allocate all of it to continue`}</span>
        <Button size="lg" disabled={remaining !== 0} onClick={resolve}>Lock portfolio · 10-year jump →</Button>
      </div>
    </Panel>
  );
};

// ─── Inspector / Threshold ───────────────────────────────────────────────
// User sets a threshold on a fraud detector. Sliding it changes false positives / negatives.
const StationInspector = ({ onComplete, recordScore }) => {
  // Population of 10,000 transactions; 100 are fraud
  // Each transaction has a "score" sampled from a distribution:
  // - Legit: Normal(mean=30, sd=12)
  // - Fraud: Normal(mean=70, sd=15)
  const populations = React.useMemo(() => {
    const rng = mulberry32(13);
    const legit = Array.from({length:9900}).map(() => Math.max(0, Math.min(100, 30 + gauss(rng) * 12)));
    const fraud = Array.from({length:100}).map(() => Math.max(0, Math.min(100, 70 + gauss(rng) * 15)));
    return { legit, fraud };
  }, []);

  const [threshold, setThreshold] = React.useState(50);
  const [phase, setPhase] = React.useState('intro'); // intro | tune | done

  const tp = populations.fraud.filter(s => s >= threshold).length;
  const fn = populations.fraud.length - tp;
  const fp = populations.legit.filter(s => s >= threshold).length;
  const tn = populations.legit.length - fp;

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp / populations.fraud.length;

  // cost: each FP costs $10 (human review), each FN costs $500 (missed fraud), each TP saves $500
  const cost = fp * 10 + fn * 500;
  const baselineCost = populations.fraud.length * 500; // do nothing
  const savings = baselineCost - cost;

  // savings as a function of threshold — for the curve on the results screen
  const savingsAt = (t) => {
    const fpT = populations.legit.filter(s => s >= t).length;
    const fnT = populations.fraud.filter(s => s < t).length;
    return baselineCost - (fpT * 10 + fnT * 500);
  };

  const resolve = () => {
    recordScore('inspector', { threshold, tp, fp, fn, savings });
    setPhase('done');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Inspector" title="Tune the fraud detector." accent="var(--leaf)">
        <Callout tone="signal" icon="◔">
          Your bank uses a fraud-detection model that assigns each of 10,000 daily transactions a score from 0–100. <strong>You choose the threshold</strong>: transactions ≥ threshold get flagged.
          <br/><br/>
          <strong>Costs:</strong> each false positive costs $10 (human review). Each missed fraud (false negative) costs $500. Each caught fraud saves $500. There are 100 fraudulent transactions among 9,900 legit ones.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('tune')}>Tune the threshold →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'done') {
    // build the savings curve across thresholds and find the optimum
    const ts = Array.from({length:86}, (_,i)=> i + 10); // 10..95
    const curve = ts.map(t => ({ t, s: savingsAt(t) }));
    const best = curve.reduce((a,b)=> b.s > a.s ? b : a, curve[0]);
    const sMax = Math.max(...curve.map(c=>c.s));
    const sMin = Math.min(...curve.map(c=>c.s), 0);
    const W = 540, H = 200, padL = 44, padR = 16, padT = 16, padB = 28;
    const sx = (t) => padL + (t - 10) / (95 - 10) * (W - padL - padR);
    const sy = (s) => padT + (1 - (s - sMin) / (sMax - sMin || 1)) * (H - padT - padB);
    return (
      <Panel eyebrow="Simulation · Inspector · Resolved" title={`Threshold = ${threshold} · Savings: $${savings.toLocaleString()}`} accent="var(--leaf)">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:14 }}>
          <Stat label="True positives" value={tp.toString()} tone="good"/>
          <Stat label="False positives" value={fp.toString()} tone="neutral" sub="alerted but legit"/>
          <Stat label="Missed fraud" value={fn.toString()} tone="bad"/>
          <Stat label="Net savings" value={`$${(savings/1000).toFixed(1)}k`} tone={savings > 30000 ? 'good':'neutral'} sub={`vs. do-nothing baseline`}/>
        </div>

        <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:14 }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>net savings vs. threshold</div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight:H }}>
            {/* zero line */}
            <line x1={padL} x2={W-padR} y1={sy(0)} y2={sy(0)} stroke="var(--line-2)" strokeWidth="1"/>
            <text x={padL-6} y={sy(0)+3} textAnchor="end" fontSize="9" fill="var(--ink-4)" className="mono">$0</text>
            <text x={padL-6} y={sy(sMax)+3} textAnchor="end" fontSize="9" fill="var(--ink-4)" className="mono">${(sMax/1000).toFixed(0)}k</text>
            {/* curve */}
            <polyline fill="none" stroke="var(--leaf)" strokeWidth="2.5"
              points={curve.map(c => `${sx(c.t)},${sy(c.s)}`).join(' ')}/>
            {/* optimum marker */}
            <line x1={sx(best.t)} x2={sx(best.t)} y1={padT} y2={H-padB} stroke="var(--good)" strokeWidth="1.5" strokeDasharray="3 3"/>
            <circle cx={sx(best.t)} cy={sy(best.s)} r="4" fill="var(--good)"/>
            <text x={sx(best.t)} y={padT-2} textAnchor="middle" fontSize="10" fill="var(--good)" className="mono">optimum @ {best.t}</text>
            {/* user's threshold */}
            <line x1={sx(threshold)} x2={sx(threshold)} y1={padT} y2={H-padB} stroke="var(--ink)" strokeWidth="2"/>
            <circle cx={sx(threshold)} cy={sy(savings)} r="4" fill="var(--ink)"/>
            <text x={sx(threshold)} y={H-padB+16} textAnchor="middle" fontSize="10" fill="var(--ink)" className="mono">you: {threshold}</text>
            <text x={padL} y={H-6} fontSize="9" fill="var(--ink-4)" className="mono">10</text>
            <text x={W-padR} y={H-6} textAnchor="end" fontSize="9" fill="var(--ink-4)" className="mono">95</text>
          </svg>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', marginTop:6 }}>
            The best threshold here is ~{best.t} (saving ${(best.s/1000).toFixed(1)}k). You chose {threshold}, leaving ${((best.s - savings)/1000).toFixed(1)}k on the table.
          </div>
        </div>

        <Callout tone="signal" icon="◆">
          <strong>The trade-off:</strong> low threshold catches more fraud but produces many false alarms. High threshold is selective but lets fraud slip through. The "optimal" threshold depends on the relative costs. For these costs (FP=$10, FN=$500), the sweet spot sits around 45–55 — and the curve above is fairly flat across that range, which is why "roughly right" beats "precisely wrong."
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  // tune
  // Build a histogram of both distributions, overlaid
  const buckets = Array.from({length:50}).map((_,i) => ({
    x: i * 2,
    legit: populations.legit.filter(s => s >= i*2 && s < (i+1)*2).length,
    fraud: populations.fraud.filter(s => s >= i*2 && s < (i+1)*2).length,
  }));

  return (
    <Panel eyebrow="Simulation · Inspector · Tune" title="Score distributions" accent="var(--leaf)">
      <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>10,000 transactions · score 0-100 · 100 are fraud</div>
        <svg viewBox="0 0 540 200" width="100%" style={{ maxHeight:200 }}>
          {buckets.map((b,i) => {
            const x = 30 + i * 10;
            const lh = Math.min(b.legit / 60, 160);
            const fh = b.fraud * 1.6;
            return (
              <g key={i}>
                <rect x={x} y={170 - lh} width="9" height={lh} fill="var(--signal)" opacity=".6"/>
                <rect x={x} y={170 - lh - fh} width="9" height={fh} fill="var(--noise)" opacity=".85"/>
              </g>
            );
          })}
          {/* threshold line */}
          <line x1={30 + threshold * 5} x2={30 + threshold * 5} y1="20" y2="180" stroke="var(--ink)" strokeWidth="2"/>
          <text x={30 + threshold * 5} y="14" textAnchor="middle" fontSize="11" fill="var(--ink)" className="mono">threshold {threshold}</text>
          <text x="30" y="194" fontSize="10" fill="var(--ink-3)" className="mono">0</text>
          <text x="530" y="194" fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">100</text>
          <text x="50" y="34" fontSize="10" fill="var(--signal)" className="mono">▪ legit (9,900)</text>
          <text x="160" y="34" fontSize="10" fill="var(--noise-2)" className="mono">▪ fraud (100)</text>
        </svg>
      </div>

      <div style={{ marginTop:14, padding:'14px 18px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
        <div style={{ marginBottom:8, color:'var(--ink-2)' }}>Threshold (flag transactions ≥ this score):</div>
        <input type="range" min="10" max="95" step="1" value={threshold} onChange={(e)=>setThreshold(+e.target.value)}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:14 }}>
        <Stat label="Catches" value={`${tp}/100`} tone={tp >= 80 ? 'good' : 'neutral'} sub={`recall ${Math.round(recall*100)}%`}/>
        <Stat label="False alarms" value={fp.toString()} tone={fp < 200 ? 'good' : fp < 500 ? 'neutral' : 'bad'}/>
        <Stat label="Misses" value={fn.toString()} tone={fn === 0 ? 'good' : fn < 10 ? 'neutral' : 'bad'}/>
        <Stat label="Net savings" value={`$${(savings/1000).toFixed(1)}k`} tone={savings > 30000 ? 'good' : savings > 0 ? 'neutral' : 'bad'}/>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <Button size="lg" onClick={resolve}>Lock threshold →</Button>
      </div>
    </Panel>
  );
};

// ─── Whistleblower / Correlated Evidence ─────────────────────────────────
// Five rumors of varying reliability and correlation. Aggregate to a probability.
const WhistleCase = {
  claim:'CEO has been falsifying revenue numbers for 3 quarters.',
  prior:.08,
  rumors:[
    { id:1, source:'Anonymous tip via internal Slack', reliability:.55, isIndependent:true, fits:0.7, note:'A single anonymous tip is weak evidence — credibility unverified.' },
    { id:2, source:'A junior analyst noticed unusual aged-receivables patterns', reliability:.75, isIndependent:true, fits:0.85, note:'Specific, technical, independent — strong signal.' },
    { id:3, source:'Three former employees independently raised concerns to HR', reliability:.70, isIndependent:false, fits:0.80, note:'WARNING: "three independent" — but all from the same exit-interview cohort that compared notes. Treat as ONE source.' },
    { id:4, source:'A short-seller research report citing the same anomalies', reliability:.60, isIndependent:false, fits:0.75, note:'WARNING: short-sellers have financial incentive AND the report cites the analyst from rumor 2. Not independent.' },
    { id:5, source:'A board member privately expressed concerns over dinner', reliability:.85, isIndependent:false, fits:0.65, note:'WARNING: credible source, but the board member is only repeating rumors they\'d heard second-hand — likely the same ones circulating above, not a fresh observation. Treat as part of the correlated cluster.' },
  ],
};

// Bayes factor for one rumor: how much more likely this report is if the claim
// is true vs false, given the source's reliability and how well it fits.
const rumorLR = (r) => (r.fits * r.reliability + (1-r.fits)*(1-r.reliability)) /
                       ((1-r.fits) * r.reliability + r.fits * (1-r.reliability));

const StationWhistle = ({ onComplete, recordScore }) => {
  const [phase, setPhase] = React.useState('intro');
  const [investigated, setInvestigated] = React.useState({}); // id -> true once provenance revealed
  const [finalProb, setFinalProb] = React.useState(50);

  const investigate = (id) => setInvestigated(prev => ({ ...prev, [id]: true }));
  const allInvestigated = WhistleCase.rumors.every(r => investigated[r.id]);

  // "Optimal" posterior: multiply LRs of the truly independent rumors, but count
  // the whole correlated cluster as a SINGLE source (its strongest member).
  // No arbitrary LR floor — every rumor here is corroborating (LR > 1), so a
  // floor would never bind; it's dropped for honesty.
  const optimalPosterior = React.useMemo(() => {
    let odds = WhistleCase.prior / (1 - WhistleCase.prior);
    const independent = WhistleCase.rumors.filter(r => r.isIndependent);
    const correlatedGroup = WhistleCase.rumors.filter(r => !r.isIndependent);
    for (const r of independent) odds *= rumorLR(r);
    if (correlatedGroup.length > 0) {
      const best = correlatedGroup.slice().sort((a,b) => b.reliability * b.fits - a.reliability * a.fits)[0];
      odds *= rumorLR(best);
    }
    return odds / (1 + odds);
  }, []);

  const lockPosterior = () => {
    const finalProbDec = finalProb / 100;
    const gap = Math.abs(finalProbDec - optimalPosterior);
    recordScore('whistle', { finalProb: finalProbDec, optimal: optimalPosterior, gap });
    setPhase('final');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Whistleblower" title={WhistleCase.claim} accent="var(--noise-2)">
        <Callout tone="signal" icon="⚠">
          You're an internal investigator. Five rumors have surfaced. Each has different reliability — and crucially, some are <strong>correlated</strong> (the sources talked to each other). <strong>Investigate each source</strong> to trace where it really came from, then commit to a probability the claim is true.
        </Callout>
        <p style={{ color:'var(--ink-2)', marginTop:12 }}>
          The trap: weighting correlated evidence as if it were independent will dramatically over-update your belief. The skill is tracing the source — so do that <em>before</em> you decide.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('eval')}>Review rumors →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'final') {
    const finalProbDec = finalProb / 100;
    const gap = Math.abs(finalProbDec - optimalPosterior);
    return (
      <Panel eyebrow="Simulation · Whistleblower · Resolved" title="How you weighted the evidence." accent="var(--noise-2)">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div style={{ padding:'18px 22px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--ink)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>your posterior</div>
            <div className="mono" style={{ fontSize:32, fontWeight:600 }}>{finalProb}%</div>
          </div>
          <div style={{ padding:'18px 22px', borderRadius:14, background:'var(--leaf-soft)', border:'1.5px solid var(--leaf)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--good)', textTransform:'uppercase', letterSpacing:'.14em' }}>optimal (correlation-aware)</div>
            <div className="mono" style={{ fontSize:32, fontWeight:600 }}>{Math.round(optimalPosterior*100)}%</div>
          </div>
        </div>
        <Callout tone={gap < .15 ? 'good' : gap < .30 ? 'gold' : 'noise'} icon={gap < .15 ? '✓' : gap < .30 ? '◑' : '✗'}>
          <strong>Gap from optimal: {Math.round(gap*100)} points.</strong> {gap < .15 ? 'Sharp evaluation — you correctly down-weighted the correlated cluster.' : gap < .30 ? 'Reasonable, but the correlated rumors likely got more weight than they should have.' : 'You probably treated rumors 3, 4 and 5 as independent confirmations. They\'re not — they all trace back to the same circulating story. Several "independent" sources who really heard the same thing count as roughly one.'}
        </Callout>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:14, marginTop:14, overflow:'hidden' }}>
          {WhistleCase.rumors.map((r,i) => (
            <div key={r.id} style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom: i<WhistleCase.rumors.length-1?'1px solid var(--line)':'none', background: r.isIndependent ? 'transparent' : 'var(--noise-soft)' }}>
              <div className="mono" style={{ flex:'0 0 80px', fontSize:12, fontWeight:600, color: r.isIndependent ? 'var(--good)' : 'var(--bad)' }}>{r.isIndependent ? 'INDEP' : 'CORRELATED'}</div>
              <div style={{ flex:1, fontSize:13.5, color:'var(--ink-2)' }}>{r.source}<br/><span style={{ fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>{r.note}</span></div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  // eval phase
  return (
    <Panel eyebrow="Simulation · Whistleblower · Evaluate" title="Five rumors. Trace each one before you weigh it." accent="var(--noise-2)">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {WhistleCase.rumors.map(r => {
          const seen = investigated[r.id];
          return (
            <div key={r.id} style={{ padding:'14px 16px', borderRadius:12, background:'var(--bg-card)', border:`1px solid ${seen ? (r.isIndependent ? 'var(--leaf)' : 'var(--noise)') : 'var(--line)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, fontWeight:500 }}>Rumor {r.id}: {r.source}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center', flex:'0 0 auto' }}>
                  <Chip tone="neutral">reliability ~{Math.round(r.reliability*100)}%</Chip>
                  {seen
                    ? <Chip tone={r.isIndependent ? 'leaf' : 'noise'}>{r.isIndependent ? 'independent' : 'correlated'}</Chip>
                    : <Button size="sm" variant="soft" onClick={()=>investigate(r.id)}>Investigate source</Button>}
                </div>
              </div>
              {seen && <div className="fadeup" style={{ marginTop:8, fontSize:13, color:'var(--ink-3)', fontStyle:'italic', lineHeight:1.5 }}>{r.note}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:18, padding:'16px 20px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)', opacity: allInvestigated ? 1 : .5 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>prior P(true) before any rumor: {Math.round(WhistleCase.prior*100)}%</div>
        <div style={{ marginTop:8, color:'var(--ink-2)' }}>{allInvestigated ? 'Given the rumors — and where they actually came from — your posterior P(claim is true)?' : 'Investigate all five sources first, then set your posterior.'}</div>
        <ProbabilitySlider value={finalProb} onChange={setFinalProb} lowLabel="false" highLabel="true"/>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <Button size="lg" disabled={!allInvestigated} onClick={lockPosterior}>Lock posterior →</Button>
      </div>
    </Panel>
  );
};

Object.assign(window, { StationTrial, StationVC, StationInspector, StationWhistle });
