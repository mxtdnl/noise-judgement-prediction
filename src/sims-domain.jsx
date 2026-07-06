// sims-domain.jsx — domain simulations (outbreak / hiring / A-B testing)

// ─── Outbreak Tracker ────────────────────────────────────────────────────
// Multi-day epidemic. Each day shows new case count. User updates P(peak > threshold).
const OutbreakConfig = {
  threshold: 1000,         // peak cases threshold
  startDay: 1,
  totalDays: 12,
  truePeakDay: 9,
  // pre-baked daily new-case curve (a real outbreak with stochastic noise)
  // crafted so peak happens around day 9 and total active cases peak ~1200
  trueCurve: [12, 22, 38, 64, 110, 195, 340, 580, 920, 1180, 980, 720, 450],
  // What a good Bayesian forecaster would believe about P(peak > 1000) given only
  // the data available up to each day. Early on the growth rate (~1.7×/day) already
  // implies a likely breach, so belief rises steadily; on day 10 the count hits 1,180,
  // exceeding the threshold outright → certainty from then on.
  referenceCurve: [.20, .22, .25, .30, .38, .50, .68, .85, .97, 1, 1, 1, 1],
};

const StationOutbreak = ({ onComplete, recordScore }) => {
  const [day, setDay] = React.useState(0); // index into trueCurve
  const [prob, setProb] = React.useState(30);
  const [phase, setPhase] = React.useState('intro'); // intro | day | reveal | done
  const [log, setLog] = React.useState([]); // array of { day, prob }

  const revealed = OutbreakConfig.trueCurve.slice(0, day + 1);
  const total = revealed.reduce((a,b)=>a+b, 0);
  const peakSoFar = Math.max(...revealed);

  const advance = () => {
    const updates = [...log, { day, prob }];
    setLog(updates);
    if (day + 1 >= OutbreakConfig.trueCurve.length) {
      // resolve — grade against the REFERENCE forecaster trajectory (what you
      // should have believed given the data so far), not the single realised outcome.
      const actualPeak = Math.max(...OutbreakConfig.trueCurve);
      const wentAbove = actualPeak > OutbreakConfig.threshold;
      const finalProb = prob / 100;
      const refGap = updates.reduce((s, u) => s + Math.abs(u.prob/100 - OutbreakConfig.referenceCurve[u.day]), 0) / updates.length;
      const brier = Math.pow(finalProb - (wentAbove ? 1 : 0), 2); // kept for reference/back-compat
      recordScore('outbreak', { wentAbove, actualPeak, finalProb, refGap, brier, updates });
      setPhase('done');
      return;
    }
    setDay(day + 1);
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Outbreak Tracker" title="Day 1: 12 new cases reported." accent="var(--noise)">
        <Callout tone="signal" icon="⚠">
          A novel respiratory illness has appeared in a city of 1.2M people. <br/>
          <strong>Your job:</strong> forecast whether the peak daily case count will exceed <strong>{OutbreakConfig.threshold.toLocaleString()}</strong>. You'll see one day of data at a time and update your probability.
        </Callout>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:14 }}>
          <Stat label="Days to simulate" value={`${OutbreakConfig.trueCurve.length}`} />
          <Stat label="Threshold" value={`${OutbreakConfig.threshold.toLocaleString()}`} sub="daily new cases" />
          <Stat label="Day 1 cases" value={`${OutbreakConfig.trueCurve[0]}`} />
        </div>
        <Callout tone="gold" icon="◑">
          Compounding rule of thumb: ~doubling every 2 days is a fast-spreading outbreak. Sub-linear growth often means containment is working. Watch for inflection.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('day')}>Receive day 1 →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'done') {
    const actualPeak = Math.max(...OutbreakConfig.trueCurve);
    const wentAbove = actualPeak > OutbreakConfig.threshold;
    return (
      <Panel eyebrow="Simulation · Outbreak Tracker · Resolved" title={wentAbove ? `Peak hit ${actualPeak.toLocaleString()} cases on day ${OutbreakConfig.truePeakDay + 1}.` : `Peak was ${actualPeak.toLocaleString()} — under threshold.`} accent={wentAbove ? 'var(--noise-2)' : 'var(--leaf)'}>
        {/* trajectory chart */}
        <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>Daily new cases · your P(peak {'>'} {OutbreakConfig.threshold}) over time</div>
          <svg viewBox="0 0 540 240" width="100%" style={{ maxHeight:240 }}>
            {/* threshold line */}
            <line x1="50" x2="510" y1={200 - (OutbreakConfig.threshold/1500)*180} y2={200 - (OutbreakConfig.threshold/1500)*180} stroke="var(--noise)" strokeWidth="1.5" strokeDasharray="3 3"/>
            <text x="514" y={200 - (OutbreakConfig.threshold/1500)*180 + 4} fontSize="10" fill="var(--noise-2)" className="mono">{OutbreakConfig.threshold}</text>
            {/* bars */}
            {OutbreakConfig.trueCurve.map((c, i) => {
              const x = 50 + i * 35;
              const ch = Math.min((c / 1500) * 180, 180);
              return <rect key={i} x={x} y={200 - ch} width="24" height={ch} fill="var(--noise)" opacity={c > OutbreakConfig.threshold ? 1 : .55}/>;
            })}
            {/* reference forecaster line */}
            <polyline fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 4"
              points={OutbreakConfig.referenceCurve.map((p, i) => {
                const x = 50 + i * 35 + 12;
                const y = 220 - p * 200;
                return `${x},${y}`;
              }).join(' ')}/>
            {/* user prob line (log already includes the final day) */}
            <polyline fill="none" stroke="var(--signal)" strokeWidth="2.5"
              points={log.map((u) => {
                const x = 50 + u.day * 35 + 12;
                const y = 220 - (u.prob / 100) * 200;
                return `${x},${y}`;
              }).join(' ')}/>
            {log.map((u, i) => {
              const x = 50 + u.day * 35 + 12;
              const y = 220 - (u.prob / 100) * 200;
              return <circle key={i} cx={x} cy={y} r="3" fill="var(--signal)"/>;
            })}
            <text x="34" y="14" fontSize="10" fill="var(--signal)" className="mono">— you</text>
            <text x="100" y="14" fontSize="10" fill="var(--gold)" className="mono">- - reference forecaster</text>
            <text x="50" y="232" fontSize="10" fill="var(--ink-3)" className="mono">day 1</text>
            <text x="510" y="232" fontSize="10" fill="var(--ink-3)" textAnchor="end" className="mono">day {OutbreakConfig.trueCurve.length}</text>
          </svg>
        </div>

        {(() => {
          const refGap = log.reduce((s,u)=>s+Math.abs(u.prob/100 - OutbreakConfig.referenceCurve[u.day]), 0) / (log.length || 1);
          const gapPts = Math.round(refGap*100);
          return (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
                <Stat label="Final P(peak >)" value={`${prob}%`} tone="signal"/>
                <Stat label="Gap vs. reference" value={`${gapPts} pts`} tone={refGap < .12 ? 'good' : refGap < .22 ? 'neutral' : 'bad'} sub="avg |you − reference|"/>
                <Stat label="Reference (final)" value="100%" sub="peak breached on day 10"/>
              </div>

              <Callout tone={refGap < .12 ? 'good' : refGap < .22 ? 'gold' : 'noise'} icon={refGap < .12 ? '✓' : refGap < .22 ? '◑' : '✗'}>
                <strong>{refGap < .12 ? 'You tracked the reference forecaster closely.' : refGap < .22 ? 'Roughly on the reference curve, with some lag.' : 'You lagged the reference forecaster badly.'}</strong> You're graded against what a good Bayesian should have believed each day given the data <em>so far</em> — not against the eventual outcome, so a lucky "100% on day 1" would score badly too.
              </Callout>
            </div>
          );
        })()}

        <Callout tone="signal" icon="◑">
          <strong>The lesson:</strong> exponential growth fools intuition. From day 1 (12 cases) to day 4 (64), the curve looked manageable — but at ~1.7× per day you were already more than two doublings in, and the growth <em>rate</em> alone implied a likely breach. By the time the peak was visible in the raw counts, the only thing left to update on was the inflection.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  // Phase: day
  const todayCases = OutbreakConfig.trueCurve[day];
  const yesterdayCases = day > 0 ? OutbreakConfig.trueCurve[day - 1] : null;
  const dayDeltaPct = yesterdayCases !== null ? Math.round((todayCases - yesterdayCases) / yesterdayCases * 100) : null;

  return (
    <Panel eyebrow={`Simulation · Outbreak Tracker · Day ${day+1}/${OutbreakConfig.trueCurve.length}`} title={`${todayCases.toLocaleString()} new cases today.`} accent="var(--noise)">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:18 }}>
        <Stat label="Cases today" value={todayCases.toLocaleString()} tone={todayCases > OutbreakConfig.threshold ? 'bad' : 'neutral'}/>
        <Stat label="Day-over-day" value={dayDeltaPct !== null ? `${dayDeltaPct > 0 ? '+':''}${dayDeltaPct}%` : '—'} tone={dayDeltaPct > 30 ? 'bad' : dayDeltaPct < 0 ? 'good' : 'neutral'}/>
        <Stat label="Total to date" value={total.toLocaleString()}/>
      </div>

      {/* mini chart of so-far */}
      <div style={{ padding:'14px 16px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:16 }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6 }}>cases so far · threshold = {OutbreakConfig.threshold}</div>
        <svg viewBox="0 0 540 160" width="100%" style={{ maxHeight:160 }}>
          <line x1="30" x2="510" y1={140 - (OutbreakConfig.threshold/1500)*120} y2={140 - (OutbreakConfig.threshold/1500)*120} stroke="var(--noise)" strokeWidth="1.5" strokeDasharray="3 3"/>
          {revealed.map((c, i) => {
            const x = 30 + i * (480 / Math.max(OutbreakConfig.trueCurve.length, 1));
            const w = (480 / Math.max(OutbreakConfig.trueCurve.length, 1)) * 0.78;
            const ch = Math.min((c / 1500) * 120, 120);
            return <rect key={i} x={x} y={140 - ch} width={w} height={ch} fill="var(--noise)" opacity={c > OutbreakConfig.threshold ? 1 : .65}/>;
          })}
        </svg>
      </div>

      <div style={{ marginBottom:10, color:'var(--ink-2)', fontSize:14 }}>
        P(peak day exceeds {OutbreakConfig.threshold.toLocaleString()})?
      </div>
      <ProbabilitySlider value={prob} onChange={setProb} lowLabel="will stay below" highLabel="will exceed"/>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <Button size="lg" onClick={advance}>{day + 1 >= OutbreakConfig.trueCurve.length ? 'Lock & resolve outbreak →' : `Receive day ${day+2} →`}</Button>
      </div>
    </Panel>
  );
};

// ─── A/B Test Director ───────────────────────────────────────────────────
// Queue of A/B tests with partial data. Decide STOP / KEEP RUNNING / SHIP.
// Some tests would have flipped given more data.
// Graded on PROCESS (the right call given the data in hand), not the eventual
// outcome. `best` = the disciplined decision at this decision point; `acceptable`
// = defensible alternatives. The reveal still shows how the test truly resolved,
// to make the process-vs-resulting distinction explicit.
const ABTests = [
  { id:1, name:'Onboarding CTA color',     visitorsA:340, convA:38, visitorsB:355, convB:51, daysIn:4, planned:14, trueLiftA:.11, trueLiftB:.13, best:'continue', acceptable:['continue'],         note:'Real but small lift, and only 4/14 days in — the CI still spans zero. Keep running; don\'t ship on a peek.' },
  { id:2, name:'Pricing page redesign',    visitorsA:1200,convA:96, visitorsB:1180,convB:97, daysIn:7, planned:14, trueLiftA:.08, trueLiftB:.082,best:'continue', acceptable:['continue','stop'], note:'Effectively no difference (~0.2% lift, deep inside noise). Fine to keep running or to stop — but shipping would be shipping noise.' },
  { id:3, name:'Free trial length',         visitorsA:480, convA:43, visitorsB:495, convB:31, daysIn:3, planned:21, trueLiftA:.10, trueLiftB:.09, best:'continue', acceptable:['continue','stop'], note:'B is behind by a noisy margin at day 3/21. Keep running or kill — either is defensible; shipping B would be wrong.' },
  { id:4, name:'Mobile checkout flow',      visitorsA:2100,convA:189,visitorsB:2080,convB:235,daysIn:10,planned:14, trueLiftA:.09, trueLiftB:.115,best:'ship',     acceptable:['ship'],             note:'25%+ lift, large sample, day 10/14, CI comfortably above zero. Strong, decisive ship.' },
  { id:5, name:'Email subject line',        visitorsA:6800,convA:218,visitorsB:6900,convB:248,daysIn:2, planned:7,  trueLiftA:.031,trueLiftB:.034,best:'continue', acceptable:['continue'],         note:'Marginal lift, only day 2/7. Classic early peek. Keep running.' },
  { id:6, name:'Recommended-items widget', visitorsA:300, convA:42, visitorsB:285, convB:48, daysIn:1, planned:14, trueLiftA:.14, trueLiftB:.10, best:'continue', acceptable:['continue'],         note:'Big early bump for B — but n is tiny and it is day 1/14. Almost certainly noise. Wait.' },
];

const StationAB = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('decide');
  const [decisions, setDecisions] = React.useState([]);

  const cur = ABTests[idx];
  const rateA = cur.convA / cur.visitorsA;
  const rateB = cur.convB / cur.visitorsB;
  const observedLift = (rateB - rateA) / rateA;

  // 95% CI on the lift via normal approximation to the difference in proportions
  const seDiff = Math.sqrt(rateA*(1-rateA)/cur.visitorsA + rateB*(1-rateB)/cur.visitorsB);
  const diff = rateB - rateA;
  const liftLo = (diff - 1.96*seDiff) / rateA * 100;
  const liftHi = (diff + 1.96*seDiff) / rateA * 100;
  const ciExcludesZero = (diff - 1.96*seDiff) > 0 || (diff + 1.96*seDiff) < 0;

  const decide = (choice) => {
    // Grade on PROCESS: was this the disciplined call given the data in hand?
    const correct = choice === cur.best;
    const acceptable = cur.acceptable.includes(choice);
    setDecisions([...decisions, { ...cur, choice, correct, acceptable }]);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= ABTests.length) {
      const correct = decisions.filter(d => d.correct).length;
      const acceptable = decisions.filter(d => d.acceptable).length;
      recordScore('abTest', { correct, acceptable, total: ABTests.length, decisions });
      onComplete();
      return;
    }
    setIdx(idx+1);
    setPhase('decide');
  };

  return (
    <Panel eyebrow={`Simulation · A/B Test Director · ${idx+1}/${ABTests.length}`} title={cur.name} accent="var(--signal)">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
        <div style={{ padding:'14px 18px', borderRadius:12, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>variant A · control</div>
          <div className="mono" style={{ fontSize:24, fontWeight:600 }}>{(rateA*100).toFixed(2)}%</div>
          <div className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>{cur.convA} / {cur.visitorsA.toLocaleString()} converted</div>
        </div>
        <div style={{ padding:'14px 18px', borderRadius:12, background: rateB > rateA ? 'var(--leaf-soft)' : 'var(--noise-soft)', border:`1px solid ${rateB > rateA ? 'var(--leaf)' : 'var(--noise)'}` }}>
          <div className="mono" style={{ fontSize:11, color: rateB > rateA ? 'var(--good)' : 'var(--bad)', textTransform:'uppercase', letterSpacing:'.14em' }}>variant B · treatment ({observedLift > 0 ? '+' : ''}{(observedLift*100).toFixed(1)}%)</div>
          <div className="mono" style={{ fontSize:24, fontWeight:600 }}>{(rateB*100).toFixed(2)}%</div>
          <div className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>{cur.convB} / {cur.visitorsB.toLocaleString()} converted</div>
        </div>
      </div>

      <div style={{ padding:'12px 18px', borderRadius:12, background: ciExcludesZero ? 'var(--leaf-soft)' : 'var(--gold-soft)', border:`1px solid ${ciExcludesZero ? 'var(--leaf)' : 'var(--gold)'}`, marginBottom:14 }}>
        <div className="mono" style={{ fontSize:11, color: ciExcludesZero ? 'var(--good)' : 'var(--gold)', textTransform:'uppercase', letterSpacing:'.14em' }}>observed lift · 95% confidence interval</div>
        <div className="mono" style={{ fontSize:16, fontWeight:600, marginTop:2 }}>{observedLift>0?'+':''}{(observedLift*100).toFixed(1)}% <span style={{ fontSize:13, color:'var(--ink-3)', fontWeight:400 }}>(95% CI: {liftLo>0?'+':''}{liftLo.toFixed(1)}% to {liftHi>0?'+':''}{liftHi.toFixed(1)}%)</span></div>
        <div style={{ fontSize:12.5, color:'var(--ink-2)', marginTop:3 }}>{ciExcludesZero ? 'The interval excludes zero — the lift is statistically distinguishable from noise.' : 'The interval spans zero — this "lift" is not yet distinguishable from noise.'}</div>
      </div>

      <div style={{ padding:'14px 18px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6 }}>experiment timing</div>
        <div style={{ position:'relative', height:12, borderRadius:6, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
          <div style={{ width:`${(cur.daysIn/cur.planned)*100}%`, height:'100%', background:'var(--signal)' }}/>
        </div>
        <div className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginTop:6 }}>day {cur.daysIn} of {cur.planned} planned</div>
      </div>

      {phase === 'decide' && (
        <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          <button className="btn" onClick={()=>decide('stop')} style={{ padding:'18px 16px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--noise-2)', textAlign:'left', cursor:'pointer' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--noise-2)', textTransform:'uppercase', letterSpacing:'.14em' }}>STOP</div>
            <div className="serif" style={{ fontSize:17, fontWeight:600, marginTop:2 }}>Kill the test</div>
            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>No effect or B is worse</div>
          </button>
          <button className="btn" onClick={()=>decide('continue')} style={{ padding:'18px 16px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--gold)', textAlign:'left', cursor:'pointer' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.14em' }}>KEEP RUNNING</div>
            <div className="serif" style={{ fontSize:17, fontWeight:600, marginTop:2 }}>Need more data</div>
            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>Not enough signal yet</div>
          </button>
          <button className="btn" onClick={()=>decide('ship')} style={{ padding:'18px 16px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--leaf)', textAlign:'left', cursor:'pointer' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--good)', textTransform:'uppercase', letterSpacing:'.14em' }}>SHIP B</div>
            <div className="serif" style={{ fontSize:17, fontWeight:600, marginTop:2 }}>B is the winner</div>
            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>Real, decisive lift</div>
          </button>
        </div>
      )}

      {phase === 'reveal' && (() => {
        const last = decisions[decisions.length-1];
        const trueLift = (cur.trueLiftB - cur.trueLiftA) / cur.trueLiftA;
        const eventual = trueLift > 0.03 ? `B was genuinely better (true lift +${(trueLift*100).toFixed(0)}%) — it would have shipped with the full sample.`
                       : trueLift < -0.03 ? `A was actually better (B's true lift was ${(trueLift*100).toFixed(0)}%) — B's early edge was noise.`
                       : `There was no real difference (true lift ${(trueLift*100).toFixed(0)}%).`;
        return (
          <div className="fadeup" style={{ marginTop:14 }}>
            <Callout tone={last.correct ? 'good' : last.acceptable ? 'gold' : 'noise'} icon={last.correct ? '✓' : last.acceptable ? '◑' : '✗'}>
              <strong>{last.correct ? 'Right call.' : last.acceptable ? 'Defensible.' : 'Wrong call.'}</strong> The disciplined decision here was <strong>{cur.best.toUpperCase()}</strong>{cur.acceptable.length > 1 ? ` (${cur.acceptable.filter(a=>a!==cur.best).map(a=>a.toUpperCase()).join(', ')} also defensible)` : ''}. {cur.note}
            </Callout>
            <Callout tone="signal" icon="◑">
              <strong>How it actually resolved:</strong> {eventual} You're graded on the <em>decision</em>, not this outcome — a good process can precede a bad result and vice versa.
            </Callout>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
              <span className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>{decisions.filter(d=>d.correct).length}/{decisions.length} optimal · {decisions.filter(d=>d.acceptable).length}/{decisions.length} defensible</span>
              <Button size="lg" onClick={next}>{idx+1 >= ABTests.length ? 'Finish drill →' : 'Next test →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

// ─── Hiring Roulette ─────────────────────────────────────────────────────
// 12 candidates with signals. Budget: 5 hires. Reveal performance after picks.
const HiringPool = [
  { id:1, name:'A. Patel',  truthScore:.78, signals:['Stanford MS','3 Google interviews', '4 years experience'], strength:'strong' },
  { id:2, name:'B. Okafor', truthScore:.86, signals:['Top of class at lesser-known university','Self-taught','Stellar live coding'], strength:'hidden-gem' },
  { id:3, name:'C. Liu',    truthScore:.34, signals:['Ivy League','Famous internship','Bombed live coding'], strength:'overrated' },
  { id:4, name:'D. Schmidt',truthScore:.42, signals:['10 years experience','Switched 6 jobs','Poor references'], strength:'over-experienced' },
  { id:5, name:'E. Rao',    truthScore:.71, signals:['Bootcamp grad','One year experience','Excellent take-home'], strength:'good' },
  { id:6, name:'F. Cole',   truthScore:.55, signals:['Prestige firm background','Average performance','Slow to ramp'], strength:'mid' },
  { id:7, name:'G. Nakamura',truthScore:.92,signals:['Founder of failed startup','Bold opinions','Eats interview questions'], strength:'star' },
  { id:8, name:'H. Bauer',  truthScore:.28, signals:['Lots of certifications','Buzzword resume','Couldn\'t explain own project'], strength:'weak' },
  { id:9, name:'I. Mendes', truthScore:.65, signals:['Career changer','Strong soft skills','Decent technical'], strength:'good' },
  { id:10,name:'J. Akan',   truthScore:.48, signals:['Trendy school','Average interview','References cautious'], strength:'mid' },
  { id:11,name:'K. Ortega', truthScore:.74, signals:['Quiet but sharp','Took a sabbatical','Strong portfolio'], strength:'good' },
  { id:12,name:'L. Roy',    truthScore:.36, signals:['Aggressive negotiator','Bragged extensively','Light technical'], strength:'red-flag' },
];

const StationHiring = ({ onComplete, recordScore }) => {
  const [phase, setPhase] = React.useState('intro'); // intro | choose | reveal
  const [picks, setPicks] = React.useState([]);
  const budget = 5;

  const toggle = (id) => {
    if (picks.includes(id)) setPicks(picks.filter(p => p !== id));
    else if (picks.length < budget) setPicks([...picks, id]);
  };

  const resolve = () => {
    const pickedTruth = picks.map(id => HiringPool.find(c => c.id === id).truthScore);
    const yourAvg = pickedTruth.reduce((a,b)=>a+b,0)/pickedTruth.length;
    const sorted = [...HiringPool].sort((a,b)=>b.truthScore-a.truthScore);
    const optimal = sorted.slice(0, budget);
    const optimalAvg = optimal.reduce((s,c)=>s+c.truthScore,0)/optimal.length;
    const overlap = picks.filter(id => optimal.find(o => o.id === id)).length;
    recordScore('hiring', { yourAvg, optimalAvg, overlap, picks });
    setPhase('reveal');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Hiring Roulette" title="12 candidates. Budget for 5 hires." accent="var(--signal-2)">
        <Callout tone="signal" icon="◔">
          Each candidate has 3 visible signals. Some are positive, some negative, some misleading. Your job: select the 5 candidates with the highest <em>true</em> performance score, which you don't see until the reveal.
        </Callout>
        <p style={{ color:'var(--ink-2)', marginTop:14 }}>
          Read each candidate on their whole signal pattern and back your five. We'll show you the true scores — and what the best possible five would have been — once you commit.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('choose')}>Review candidates →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'reveal') {
    const pickedTruth = picks.map(id => HiringPool.find(c => c.id === id).truthScore);
    const yourAvg = pickedTruth.reduce((a,b)=>a+b,0)/pickedTruth.length;
    const sorted = [...HiringPool].sort((a,b)=>b.truthScore-a.truthScore);
    const optimal = sorted.slice(0, budget);
    const optimalAvg = optimal.reduce((s,c)=>s+c.truthScore,0)/optimal.length;
    const overlap = picks.filter(id => optimal.find(o => o.id === id)).length;
    return (
      <Panel eyebrow="Simulation · Hiring Roulette · Resolved" title={`Average true score of your hires: ${Math.round(yourAvg*100)}%`} accent={yourAvg > 0.7 ? 'var(--leaf)' : 'var(--noise-2)'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <Stat label="Your avg" value={`${Math.round(yourAvg*100)}%`} tone={yourAvg > 0.7 ? 'good':'neutral'}/>
          <Stat label="Optimal avg" value={`${Math.round(optimalAvg*100)}%`} tone="signal" sub="best 5 possible"/>
          <Stat label="Overlap" value={`${overlap}/5`} tone={overlap >= 4 ? 'good' : overlap >= 2 ? 'neutral' : 'bad'} sub="vs optimal set"/>
        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 1fr 60px', padding:'10px 14px', background:'var(--bg-soft)', borderBottom:'1px solid var(--line)' }} className="mono">
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>#</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>candidate</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>true score</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>archetype</span>
            <span style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', textAlign:'right' }}>you?</span>
          </div>
          {sorted.map((c, i) => {
            const picked = picks.includes(c.id);
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 1fr 60px', padding:'10px 14px', borderBottom: i < HiringPool.length-1 ? '1px solid var(--line)':'none', background: i < budget ? 'var(--leaf-soft)' : picked ? 'var(--noise-soft)' : 'transparent' }} className="mono">
                <span style={{ fontSize:12 }}>{i+1}</span>
                <span style={{ fontSize:14 }}>{c.name}</span>
                <span style={{ fontSize:14, fontWeight:600 }}>{Math.round(c.truthScore*100)}%</span>
                <span style={{ fontSize:11, color:'var(--ink-3)' }}>{c.strength}</span>
                <span style={{ fontSize:12, textAlign:'right', color: picked ? 'var(--ink)' : 'var(--ink-4)' }}>{picked ? '●' : '○'}</span>
              </div>
            );
          })}
        </div>
        <Callout tone="signal" icon="◆">
          <strong>The lesson:</strong> resumes are noisy. The most common errors: weighting prestige too heavily (the "Ivy + bombed coding" candidate scores poorly) and missing hidden gems (the unknown-school self-taught candidate often scores highest). Read the SIGNAL pattern, not the brand.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  // choose phase
  return (
    <Panel eyebrow="Simulation · Hiring Roulette · Choose 5" title={`Picks: ${picks.length}/${budget}`} accent="var(--signal-2)">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
        {HiringPool.map(c => {
          const on = picks.includes(c.id);
          const full = picks.length >= budget && !on;
          return (
            <button key={c.id} className="btn" onClick={()=>toggle(c.id)} disabled={full}
              style={{
                textAlign:'left', padding:'14px 16px', borderRadius:14,
                background: on ? 'var(--ink)' : 'var(--bg-card)',
                color: on ? 'var(--bg-card)' : 'var(--ink)',
                border:`1.5px solid ${on ? 'var(--ink)' : 'var(--line-2)'}`,
                opacity: full ? .4 : 1, cursor: full ? 'not-allowed' : 'pointer'
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span className="serif" style={{ fontSize:18, fontWeight:600 }}>{c.name}</span>
                {on && <Chip tone="gold">picked</Chip>}
              </div>
              <ul style={{ margin:'8px 0 0', paddingLeft:18, fontSize:12.5, color: on ? 'var(--bg-soft)' : 'var(--ink-3)' }}>
                {c.signals.map((s,j) => <li key={j} style={{ marginBottom:2 }}>{s}</li>)}
              </ul>
            </button>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18 }}>
        <span className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>{picks.length}/{budget} chosen</span>
        <Button size="lg" disabled={picks.length !== budget} onClick={resolve}>Hire these 5 →</Button>
      </div>
    </Panel>
  );
};

Object.assign(window, { StationOutbreak, StationAB, StationHiring });
