// stations.jsx — six stations of the Forecasting Lab

// ─── Station 1: Spot the Signal ──────────────────────────────────────────
const SignalRounds = [
  { id:'s1', seed: 7,  signal:'none',  noise: 9,  prompt:'Sales over the last 40 days', accept:'noise',  truth:'There is no underlying trend. Every dot is pure noise around a flat mean.', tip:'Even random walks form patterns the brain mistakes for stories.' },
  { id:'s2', seed: 19, signal:'up',    noise: 11, prompt:'Weekly active users since launch', accept:'signal', truth:'There IS a real upward trend (≈ +30 over the window), buried in noise.', tip:'Slow upward signals are hardest to spot when noise > signal.' },
  { id:'s3', seed: 31, signal:'step',  noise: 7,  prompt:'Defect rate after a process change', accept:'signal', truth:'A real step change happens at t≈22. The mean shifts up.', tip:'Step changes are easier to test than slope changes — split before/after.' },
  { id:'s4', seed: 44, signal:'none',  noise: 13, prompt:'Daily app rating (random sample)', accept:'noise',  truth:'No signal. The eye picks out a "dip" and a "recovery" that aren\'t there.', tip:'High noise + small sample = phantom narratives. Demand more data.' },
  { id:'s5', seed: 58, signal:'cycle', noise: 5,  prompt:'Hourly checkout volume', accept:'signal', truth:'A real cyclical pattern (period ≈ ½ window). Real cycles repeat; noise doesn\'t.', tip:'Real cycles persist out-of-sample. Test the prediction, not the chart.' },
];

const StationSignal = ({ onComplete, recordScore, difficulty='regular' }) => {
  const [round, setRound] = React.useState(0);
  const [phase, setPhase] = React.useState('decide'); // decide | reveal
  const [picks, setPicks] = React.useState([]);
  const noiseMul = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.4 : 1.0;
  const cur = SignalRounds[round];
  const data = React.useMemo(() => genSeries({ seed: cur.seed, n: 40, signal: cur.signal, noise: cur.noise * noiseMul, bias: 50 }), [cur, noiseMul]);

  const choose = (choice) => {
    const correct = choice === cur.accept;
    setPicks([...picks, { id: cur.id, choice, correct }]);
    setPhase('reveal');
  };
  const next = () => {
    if (round + 1 >= SignalRounds.length) {
      const correct = picks.filter(p => p.correct).length;
      recordScore('signal', { correct, total: SignalRounds.length });
      onComplete();
      return;
    }
    setRound(round + 1);
    setPhase('decide');
  };

  const last = picks[picks.length - 1];

  return (
    <Panel eyebrow={`Station 01 · Round ${round+1} of ${SignalRounds.length}`} title="Is this a real trend, or just noise?" accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <span style={{ color:'var(--ink-2)', fontSize:15 }}>{cur.prompt}</span>
        <ProgressDots total={SignalRounds.length} current={round}/>
      </div>

      <div style={{ background:'var(--bg-soft)', borderRadius:18, padding:'14px 16px 6px', border:'1px solid var(--line)'}}>
        <TimeSeriesChart data={data} showSignal={phase==='reveal'} />
      </div>

      {phase === 'decide' && (
        <div style={{ marginTop:22, display:'flex', gap:12, justifyContent:'center'}}>
          <Button variant="signal" size="lg" onClick={()=>choose('signal')} icon={<Dot c="#fff"/>}>Real signal</Button>
          <Button variant="noise" size="lg" onClick={()=>choose('noise')} icon={<Wave c="#fff"/>}>Just noise</Button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="fadeup" style={{ marginTop:18 }}>
          <Callout tone={last.correct ? 'good' : 'noise'} icon={last.correct ? '✓' : '✗'}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10 }}>
              <strong style={{ fontSize:15 }}>{last.correct ? 'Correct.' : 'Not quite.'}</strong>
              <Stamp label={cur.accept === 'signal' ? 'signal present' : 'no signal'} tone={cur.accept === 'signal' ? 'good' : 'gold'}/>
            </div>
            <div style={{ marginTop:6 }}>{cur.truth}</div>
            <div style={{ marginTop:8, fontSize:13, color:'var(--ink-3)', fontStyle:'italic' }}>{cur.tip}</div>
          </Callout>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18 }}>
            <span className="mono" style={{ color:'var(--ink-4)', fontSize:12 }}>
              {picks.filter(p=>p.correct).length} / {picks.length} correct so far
            </span>
            <Button onClick={next} size="lg">
              {round + 1 >= SignalRounds.length ? 'Finish station →' : 'Next round →'}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
};

const Dot = ({ c='var(--ink)' }) => <svg width="14" height="14"><circle cx="7" cy="7" r="3.5" fill={c}/></svg>;
const Wave = ({ c='var(--ink)' }) => <svg width="18" height="14" viewBox="0 0 18 14"><path d="M1 7 Q4 1 7 7 T13 7 T18 7" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>;

// ─── Station 2: Calibration Quiz ────────────────────────────────────────
const QuizQs = [
  { q:'Which is longer?', a:'The Nile River', b:'The Amazon River', answer:'b', note:'The Amazon (~6,400 km) edges out the Nile (~6,650 km is the historical claim, but modern surveys put the Amazon longer). Either answer is defensible — confidence here should be low.' },
  { q:'Which has a larger population?', a:'California', b:'Canada', answer:'b', note:'Canada ~40M, California ~39M. Very close — a high-confidence pick is overconfidence.' },
  { q:'Which is taller?', a:'Mt. Kilimanjaro', b:'Mt. McKinley (Denali)', answer:'b', note:'Denali is 6,190m; Kilimanjaro is 5,895m. Close, but Denali wins.' },
  { q:'Which element is more abundant in Earth\'s crust?', a:'Iron', b:'Oxygen', answer:'b', note:'Oxygen (~46%) dominates the crust by mass. Iron is only ~5%.' },
  { q:'Which has more native speakers?', a:'Spanish', b:'English', answer:'a', note:'Spanish native speakers (~485M) outnumber English natives (~380M). English wins on total speakers when you add second-language.' },
  { q:'Which year was the modern Eiffel Tower completed?', a:'1879', b:'1889', answer:'b', note:'1889, for the World\'s Fair marking the centennial of the French Revolution.' },
  { q:'Which is heavier?', a:'A cubic meter of dry pine wood', b:'A cubic meter of saltwater', answer:'b', note:'Saltwater ≈ 1,025 kg/m³ vs pine ≈ 500 kg/m³. Saltwater is denser than fresh AND most softwoods.' },
  { q:'Which planet has more moons (known, as of recent counts)?', a:'Jupiter', b:'Saturn', answer:'b', note:'Saturn took the lead — 140+ confirmed moons compared to Jupiter\'s 95-ish.' },
];

// Bin a continuous confidence (0–100) into 5 buckets of 20pts each
const bucketize = (entries) => {
  const edges = [[0,20],[20,40],[40,60],[60,80],[80,101]];
  return edges.map(([lo,hi]) => {
    const items = entries.filter(e => e.conf >= lo && e.conf < hi);
    const mid = (lo + Math.min(hi,100)) / 2;
    return { p: mid/100, n: items.length, freq: items.length ? items.filter(x=>x.correct).length / items.length : 0, range:`${lo}–${Math.min(hi-1,100)}` };
  });
};

const StationCalibration = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [pick, setPick] = React.useState(null);
  const [conf, setConf] = React.useState(50);
  const [phase, setPhase] = React.useState('answer'); // answer | confidence | reveal | done
  const [log, setLog] = React.useState([]);
  const cur = QuizQs[idx];

  const submit = () => {
    const correct = pick === cur.answer;
    const entry = { q: cur.q, pick, correct, conf };
    setLog([...log, entry]);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= QuizQs.length) {
      const allEntries = [...log, { q:cur.q, pick, correct: pick===cur.answer, conf }];
      const buckets = bucketize(allEntries);
      const correctCount = allEntries.filter(e => e.correct).length;
      recordScore('calibration', { buckets, correct: correctCount, total: QuizQs.length, log: allEntries });
      setPhase('done');
      return;
    }
    setIdx(idx + 1);
    setPick(null);
    setConf(50);
    setPhase('answer');
  };

  if (phase === 'done') {
    const finalLog = log;
    const buckets = bucketize(finalLog);
    return (
      <Panel eyebrow="Station 02" title="Your calibration curve" accent="var(--signal)">
        <p style={{ color:'var(--ink-2)', marginTop:0 }}>For each confidence level you used, here's how often you were actually right. The dashed line is perfect calibration. <strong>Below the line = overconfidence.</strong></p>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr .9fr', gap:24, alignItems:'center', marginTop:12 }}>
          <div style={{ background:'var(--bg-soft)', borderRadius:18, padding:14, border:'1px solid var(--line)'}}>
            <CalibrationPlot buckets={buckets}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Stat label="Score" value={`${finalLog.filter(e=>e.correct).length}/${finalLog.length}`} sub="raw accuracy" />
            <Stat label="Avg. confidence" value={`${Math.round(finalLog.reduce((s,e)=>s+e.conf,0)/finalLog.length)}%`} />
            <Stat label="Actual accuracy" value={`${Math.round(finalLog.filter(e=>e.correct).length/finalLog.length*100)}%`} tone={Math.abs(finalLog.reduce((s,e)=>s+e.conf,0)/finalLog.length - finalLog.filter(e=>e.correct).length/finalLog.length*100) > 10 ? 'bad' : 'good'} sub="should match avg. confidence"/>
            <Callout tone="signal" icon="◔">A well-calibrated forecaster's average confidence equals their accuracy. Most people sit 10–20 points overconfident on their first try.</Callout>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button onClick={onComplete} size="lg">Finish station →</Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel eyebrow={`Station 02 · Question ${idx+1}/${QuizQs.length}`} title={cur.q} accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}><ProgressDots total={QuizQs.length} current={idx}/></div>

      {phase === 'answer' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {['a','b'].map(k => (
            <button key={k} className="btn" onClick={()=>{ setPick(k); setPhase('confidence'); }}
              style={{
                padding:'24px 22px', textAlign:'left', borderRadius:18,
                background:'var(--bg-card)', border:'2px solid var(--line)',
                fontSize:18, color:'var(--ink)', boxShadow:'var(--shadow-sm)'
              }}>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:8 }}>option {k}</div>
              <span className="serif" style={{ fontSize:22, fontWeight:500 }}>{cur[k]}</span>
            </button>
          ))}
        </div>
      )}

      {phase === 'confidence' && (
        <div className="fadeup">
          <div style={{ padding:'18px 22px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:18 }}>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:6 }}>Your pick</div>
            <div className="serif" style={{ fontSize:22 }}>{cur[pick]}</div>
          </div>
          <div style={{ marginBottom:14, color:'var(--ink-2)' }}>How confident are you that this is right?</div>
          <ConfidenceSlider value={conf} onChange={setConf}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:26 }}>
            <span style={{ color:'var(--ink-3)', fontSize:13, maxWidth:440 }}>
              {conf < 5  ? 'You’re saying your pick is almost certainly wrong — you should probably switch.' :
               conf < 25 ? 'Below a coin flip — the other option looks more likely to you.' :
               conf < 45 ? 'Leaning against your own pick — are you sure you don’t want to switch?' :
               conf < 55 ? 'Basically a coin flip — either option could be right.' :
               conf < 75 ? 'A nudge above chance — you’d still expect to be wrong fairly often.' :
               conf < 90 ? 'Strong belief — you’d bet money.' :
                           'Near-certain — you’d bet a lot.'}
            </span>
            <Button onClick={submit} size="lg">Lock in →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (() => {
        const last = log[log.length-1];
        return (
          <div className="fadeup">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {['a','b'].map(k => (
                <div key={k} style={{
                  padding:'22px 22px', borderRadius:18,
                  background: k===cur.answer ? 'var(--leaf-soft)' : k===pick ? 'var(--noise-soft)' : 'var(--bg-soft)',
                  border: `2px solid ${k===cur.answer ? 'var(--leaf)' : k===pick ? 'var(--noise)' : 'var(--line)'}`,
                  opacity: k===cur.answer || k===pick ? 1 : .6
                }}>
                  <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:8, display:'flex', justifyContent:'space-between'}}>
                    <span>option {k}</span>
                    {k===cur.answer && <span style={{ color:'var(--good)'}}>truth</span>}
                    {k===pick && k!==cur.answer && <span style={{ color:'var(--bad)'}}>your pick</span>}
                  </div>
                  <div className="serif" style={{ fontSize:20 }}>{cur[k]}</div>
                </div>
              ))}
            </div>
            <Callout tone={last.correct ? 'good' : 'noise'} icon={last.correct ? '✓' : '✗'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10 }}>
                <strong>{last.correct ? `Right — at ${last.conf}% confidence` : `Wrong — and you were ${last.conf}% sure`}</strong>
              </div>
              <div style={{ marginTop:6 }}>{cur.note}</div>
            </Callout>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
              <Button onClick={next} size="lg">{idx+1>=QuizQs.length ? 'See your calibration →' : 'Next question →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

// ─── Station 3: Brier Arena ─────────────────────────────────────────────
// Context is a mix of clue types — NO explicit base rate. User must reason from analogies + sub-claims.
const BrierEvents = [
  {
    id:'b1', q:'The next single roll of a fair six-sided die is a 6.',
    truth:false, optimal: 1/6,
    context:[
      { kind:'physical', text:'The die is fair: six faces, equal weight.' },
      { kind:'reference', text:'A 6 is one of six equally likely outcomes.' },
    ],
    lesson:'When outcomes are equally likely and there\'s no extra info, the optimal forecast is just 1/N. Here, 1/6 ≈ 17%.'
  },
  {
    id:'b2', q:'Tomorrow is a rainy day in Seattle.', when:'A random November day',
    truth:true, optimal:.58,
    context:[
      { kind:'analogy', text:'Of the last 10 Novembers in Seattle, between 16 and 21 days were rainy each year.' },
      { kind:'data', text:'The previous 3 days were rainy; a low-pressure system is moving in.' },
      { kind:'note', text:'No official meteorologist forecast is provided.' },
    ],
    lesson:'You should have lived around 55–65%. Strong climatological signal — but never override real weather data with a flat rate.'
  },
  {
    id:'b3', q:'This specific seed-stage startup, founded by two ex-Google engineers, reaches a $1B valuation within 10 years.',
    truth:false, optimal:.08,
    context:[
      { kind:'reference', text:'Of every 100 venture-backed startups in this category, roughly 5–10 reach unicorn status within a decade.' },
      { kind:'analogy', text:'Founders with FAANG backgrounds have historically had slightly above-average outcomes — about 1.5× the baseline.' },
      { kind:'data', text:'The startup has paying customers but no product-market fit signal yet.' },
    ],
    lesson:'Even strong-on-paper startups rarely reach unicorn status. Around 7–10% is justified — anything above ~15% is wishful.'
  },
  {
    id:'b4', q:'A randomly chosen S&P 500 stock has a positive total return over the next 12 months.',
    truth:true, optimal:.66,
    context:[
      { kind:'reference', text:'Across all 12-month windows in the index\'s history, the median stock posted a positive return roughly two-thirds of the time.' },
      { kind:'data', text:'Current macro: moderate growth, no recession signal in PMI or yield curve.' },
      { kind:'analogy', text:'In comparable periods (post-pause Fed cycles), positive-return rates ran ~60–70%.' },
    ],
    lesson:'The truth is around 65–70%. Investors who reflexively say "stocks go up 50% of the time" are systematically underconfident.'
  },
  {
    id:'b5', q:'A US federal criminal case that actually goes to trial (rare!) ends in a conviction.',
    truth:true, optimal:.83,
    context:[
      { kind:'reference', text:'Most US federal cases are resolved by plea bargain. The ones that reach trial are a small, filtered subset.' },
      { kind:'analogy', text:'Across DOJ annual reports, the trial-conviction figure has hovered in a tight band for a decade.' },
      { kind:'note', text:'Cases that reach trial are typically ones where the prosecution is most confident — selection effect.' },
    ],
    lesson:'Once you account for the selection effect (only confident-prosecution cases go to trial), conviction probability is very high — 80–85%.'
  },
  {
    id:'b6', q:'A randomly chosen US adult, surveyed today, reports sleeping less than 6 hours last night.',
    truth:false, optimal:.16,
    context:[
      { kind:'reference', text:'CDC surveys put "<7 hours of sleep" at about 1 in 3 US adults.' },
      { kind:'analogy', text:'Shifting the threshold from <7 to <6 cuts the share by roughly half.' },
      { kind:'data', text:'No specific demographic skew applies to this random draw.' },
    ],
    lesson:'<6 hours is roughly 14–18% of adults. Confusing it with the more familiar <7 stat (~33%) is the trap.'
  },
];

const ContextCard = ({ kind, text }) => {
  const map = {
    reference:{ icon:'⧖', label:'reference class', tone:'signal'},
    analogy:  { icon:'≈', label:'historical analogy', tone:'gold' },
    data:     { icon:'◆', label:'current data', tone:'leaf' },
    physical: { icon:'◯', label:'physical setup', tone:'signal' },
    note:     { icon:'!', label:'caveat', tone:'neutral' },
  };
  const m = map[kind] || map.note;
  const tones = {
    signal:{ bg:'var(--signal-soft)', fg:'var(--signal)' },
    gold:  { bg:'var(--gold-soft)',   fg:'var(--gold)' },
    leaf:  { bg:'var(--leaf-soft)',   fg:'var(--leaf)' },
    neutral:{ bg:'var(--bg-soft)',    fg:'var(--ink-3)' },
  };
  const c = tones[m.tone];
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)'}}>
      <div className="mono" style={{ flex:'0 0 28px', width:28, height:28, borderRadius:8, background:c.bg, color:c.fg, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>{m.icon}</div>
      <div style={{ flex:1 }}>
        <div className="mono" style={{ fontSize:10.5, color:c.fg, textTransform:'uppercase', letterSpacing:'.14em', marginBottom:2 }}>{m.label}</div>
        <div style={{ fontSize:14, lineHeight:1.45, color:'var(--ink-2)' }}>{text}</div>
      </div>
    </div>
  );
};

const StationBrier = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [prob, setProb] = React.useState(50);
  const [phase, setPhase] = React.useState('predict'); // predict | reveal
  const [rounds, setRounds] = React.useState([]);
  const cur = BrierEvents[idx];

  const submit = () => {
    const p = prob / 100;
    const outcome = cur.truth ? 1 : 0;
    const score = Math.pow(p - outcome, 2);
    const optimal = Math.pow(cur.optimal - outcome, 2);
    setRounds([...rounds, { ...cur, p, outcome, score, optimal }]);
    setPhase('reveal');
  };
  const next = () => {
    if (idx + 1 >= BrierEvents.length) {
      const avg = rounds.reduce((s,r)=>s+r.score,0) / rounds.length;
      recordScore('brier', { avg, rounds });
      onComplete();
      return;
    }
    setIdx(idx+1);
    setProb(50);
    setPhase('predict');
  };

  const avgSoFar = rounds.length ? rounds.reduce((s,r)=>s+r.score,0) / rounds.length : null;

  return (
    <Panel eyebrow={`Station 03 · Event ${idx+1}/${BrierEvents.length}`} title="Will it happen?" accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <ProgressDots total={BrierEvents.length} current={idx}/>
        {avgSoFar != null && <span className="mono" style={{ fontSize:12, color:'var(--ink-3)'}}>avg. Brier so far: <strong style={{ color:'var(--ink)'}}>{avgSoFar.toFixed(3)}</strong></span>}
      </div>

      <div style={{ padding:'20px 24px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:18 }}>
        <div className="serif" style={{ fontSize:22, lineHeight:1.3, color:'var(--ink)'}}>{cur.q}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
          {cur.context.map((c, i) => <ContextCard key={i} kind={c.kind} text={c.text}/>)}
        </div>
      </div>

      {phase === 'predict' && (
        <div>
          <div style={{ marginBottom:12, color:'var(--ink-2)', fontSize:14 }}>Probability it happens?</div>
          <ProbabilitySlider value={prob} onChange={setProb} lowLabel="impossible" highLabel="certain"/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:22 }}>
            <span className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>
              Brier = (prob − outcome)² · lower is better
            </span>
            <Button onClick={submit} size="lg">Lock in →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (() => {
        const last = rounds[rounds.length-1];
        const verdict = last.score < 0.15 ? 'sharp' : last.score < 0.3 ? 'okay' : 'noisy';
        const tone = last.score < 0.15 ? 'good' : last.score < 0.3 ? 'gold' : 'noise';
        return (
          <div className="fadeup">
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center', padding:'18px 22px', borderRadius:18, background:'var(--bg-card)', border:'1px solid var(--line-2)' }}>
              <div>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em'}}>outcome</div>
                <div className="serif" style={{ fontSize:30, fontWeight:600, color: last.outcome ? 'var(--good)' : 'var(--bad)' }}>{last.outcome ? 'Yes' : 'No'}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>
                <Stat label="Your prob." value={`${Math.round(last.p*100)}%`}/>
                <Stat label="Brier score" value={last.score.toFixed(3)} tone={tone === 'good' ? 'good' : tone === 'noise' ? 'bad' : 'neutral'}/>
                <Stat label="Optimal was" value={`${Math.round(cur.optimal*100)}%`} sub="best inference from clues"/>
              </div>
              <Stamp label={verdict} tone={tone==='good'?'good':tone==='noise'?'bad':'gold'}/>
            </div>

            <Callout tone="signal" icon="◆" >
              {cur.lesson}
            </Callout>

            <div style={{ marginTop:16, padding:'14px 16px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)'}}>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6}}>your Brier history</div>
              <BrierHistory rounds={rounds} />
              <div className="mono" style={{ display:'flex', gap:14, fontSize:11, color:'var(--ink-3)', marginTop:6 }}>
                <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:9, background:'var(--leaf)'}}/> &lt; 0.15 sharp</span>
                <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:9, background:'var(--gold)'}}/> 0.15–0.3 ok</span>
                <span><span style={{ display:'inline-block', width:9, height:9, borderRadius:9, background:'var(--noise)'}}/> &gt; 0.3 noisy</span>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
              <Button onClick={next} size="lg">{idx+1>=BrierEvents.length ? 'Finish station →' : 'Next event →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

// ─── Station 4: Base Rate Trap ──────────────────────────────────────────
const StationBaseRate = ({ onComplete, recordScore }) => {
  const prevalence = 0.01;       // 1% of population has the disease
  const sensitivity = 0.99;      // 99% true positive rate
  const specificity = 0.95;      // 95% true negative rate → 5% false positive
  const N = 10000;
  const sick = Math.round(N * prevalence); // 100
  const truePos = Math.round(sick * sensitivity); // 99
  const falsePos = Math.round((N - sick) * (1 - specificity)); // 495
  const ppv = truePos / (truePos + falsePos); // ~16.7%

  const [guess, setGuess] = React.useState(75);
  const [phase, setPhase] = React.useState('guess'); // guess | step1 | step2 | step3 | done
  const [revealed, setRevealed] = React.useState(false);

  const submit = () => { setPhase('step1'); setTimeout(()=>setRevealed(true), 60); };

  const classify = (i) => {
    // first `sick` are actually sick (laid out in a coherent block)
    // among sick: first truePos are true positives; rest are false negatives
    // among well: first falsePos are false positives; rest are true negatives
    if (i < sick) return i < truePos ? 'tp' : 'fn';
    const j = i - sick;
    return j < falsePos ? 'fp' : 'tn';
  };
  // Step phases: step1 shows sick-vs-well, step2 highlights positives, step3 shows ratio

  const classifyPhase = (i) => {
    if (phase === 'guess' || phase === 'step1') {
      return i < sick ? 'sick' : 'well';
    }
    if (phase === 'step2') {
      const c = classify(i);
      if (c === 'tp') return 'tp';
      if (c === 'fp') return 'fp';
      if (c === 'fn') return 'sick'; // sick but missed
      return 'well';
    }
    // step3 — only positives
    const c = classify(i);
    if (c === 'tp') return 'tp';
    if (c === 'fp') return 'fp';
    return 'neg';
  };

  return (
    <Panel eyebrow="Station 04" title="A 99%-accurate test came back positive." accent="var(--signal)">
      <Callout tone="gold" icon="⚕">
        A rare disease affects <strong>1 in 100</strong> people. The test catches <strong>99%</strong> of true cases. The test gives a <strong>5%</strong> false-positive rate on healthy people. <br/>
        Your test came back <strong style={{ color:'var(--noise-2)'}}>positive</strong>. What's the chance you actually have the disease?
      </Callout>

      {phase === 'guess' && (
        <div style={{ marginTop:22 }}>
          <ProbabilitySlider value={guess} onChange={setGuess} lowLabel="0%" highLabel="100%"/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
            <span style={{ color:'var(--ink-3)', fontSize:13 }}>{guess > 75 ? 'Most people guess somewhere here.' : guess > 40 ? 'A reasonable gut answer.' : 'Closer to the truth than you might think...'}</span>
            <Button onClick={submit} size="lg">Reveal →</Button>
          </div>
        </div>
      )}

      {phase !== 'guess' && (
        <div className="fadeup" style={{ marginTop:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'flex-start' }}>
            <div style={{ background:'var(--bg-soft)', borderRadius:18, padding:14, border:'1px solid var(--line)'}}>
              <DotField rows={50} cols={50} dotSize={8} gap={1} animate classify={(i) => classifyPhase(i)}/>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textAlign:'center', marginTop:8 }}>10,000 people from the population</div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:4 }}>step {phase === 'step1' ? '1' : phase === 'step2' ? '2' : '3'} / 3</div>
                <div className="serif" style={{ fontSize:22, color:'var(--ink)', lineHeight:1.25 }}>
                  {phase === 'step1' && 'Out of 10,000 people, only 100 are actually sick.'}
                  {phase === 'step2' && 'The test flags 99 sick people — and 495 healthy ones.'}
                  {phase === 'step3' && 'Of all positive tests, only ~17% are real.'}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ padding:'12px 14px', borderRadius:12, background:'var(--noise-soft)', border:'1px solid var(--noise)'}}>
                  <div className="mono" style={{ fontSize:11, color:'var(--noise-2)', textTransform:'uppercase', letterSpacing:'.12em'}}>true positives</div>
                  <div className="mono" style={{ fontSize:24, fontWeight:600, color:'var(--noise-2)'}}>{truePos}</div>
                </div>
                <div style={{ padding:'12px 14px', borderRadius:12, background:'var(--gold-soft)', border:'1px solid var(--gold)'}}>
                  <div className="mono" style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.12em'}}>false positives</div>
                  <div className="mono" style={{ fontSize:24, fontWeight:600, color:'var(--gold)'}}>{falsePos}</div>
                </div>
              </div>

              {phase === 'step3' && (
                <div className="fadeup" style={{ padding:'18px 20px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--ink)'}}>
                  <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em'}}>real probability you have it</div>
                  <div className="mono" style={{ fontSize:42, fontWeight:600, color:'var(--ink)'}}>{Math.round(ppv*100)}%</div>
                  <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:4 }}>You guessed {guess}% &middot; gap of {Math.abs(guess - Math.round(ppv*100))} points</div>
                </div>
              )}

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                {phase === 'step1' && <Button onClick={()=>setPhase('step2')}>Show test results →</Button>}
                {phase === 'step2' && <Button onClick={()=>setPhase('step3')}>Compute the answer →</Button>}
                {phase === 'step3' && <Button size="lg" onClick={() => { recordScore('baseRate', { guess, truth: Math.round(ppv*100) }); onComplete(); }}>Finish station →</Button>}
              </div>
            </div>
          </div>

          {phase === 'step3' && (
            <Callout tone="signal" icon="∴">
              <strong>Base rates dominate.</strong> When the prior is tiny (1%), even an accurate-sounding test produces mostly false alarms. A positive result is evidence, but it doesn't override a strong prior — it updates it.
            </Callout>
          )}
        </div>
      )}
    </Panel>
  );
};

// ─── Station 5: Bayesian Theater ────────────────────────────────────────
const BayesScenarios = [
  {
    title:'Will this new hire be a top performer?',
    context:'Base rate: roughly 20% of new hires turn out to be top performers in their first year.',
    prior: 0.20,
    evidence: [
      { id:'a', label:'Stanford CS degree', direction:'pos', lr: 1.6, note:'Modest positive signal — prestige correlates with performance, but weakly.'},
      { id:'b', label:'Bombed the live coding question', direction:'neg', lr: 0.5, note:'Real but noisy negative — some great hires panic in interviews.'},
      { id:'c', label:'Glowing reference from trusted ex-colleague', direction:'pos', lr: 3.0, note:'Strong positive — references from people who have skin in the game are predictive.'},
      { id:'d', label:'Asked one of the best questions we\'ve ever heard', direction:'pos', lr: 2.2, note:'Quality of questions is a strong signal of judgment.'},
      { id:'e', label:'Has been at 4 jobs in 5 years', direction:'neg', lr: 0.55, note:'Negative for tenure, but the modern job market makes this noisier than it used to be.'},
      { id:'f', label:'Salary expectations 40% above band', direction:'neg', lr: 0.7, note:'Weak negative — could mean overpriced, or just well-calibrated to their value.'},
    ]
  },
  {
    title:'Will this A/B test variant win when fully rolled out?',
    context:'Base rate: ~12% of A/B test variants ship as winners at our company.',
    prior: 0.12,
    evidence: [
      { id:'a', label:'Variant is significantly better at p < 0.05 in first day', direction:'pos', lr: 2.0, note:'Early significance is noisy — peeking inflates false positives.'},
      { id:'b', label:'Effect is consistent across 3 segments', direction:'pos', lr: 2.4, note:'Multi-segment consistency is much harder to fake than a single significant result.'},
      { id:'c', label:'No theoretical reason the change should help', direction:'neg', lr: 0.6, note:'Atheoretical wins regress to the mean. Theory is your friend.'},
      { id:'d', label:'Test was scoped to 1 week (short)', direction:'neg', lr: 0.7, note:'Short tests miss novelty effects and weekly cycles.'},
      { id:'e', label:'Similar change won at a peer company', direction:'pos', lr: 1.8, note:'Borrowed evidence is real evidence — base rates compound.'},
      { id:'f', label:'Implementation has a subtle bug favoring variant', direction:'neg', lr: 0.2, note:'Catastrophic — invalidates the test entirely.'},
    ]
  },
];

const StationBayes = ({ onComplete, recordScore, scenarioIdx=0 }) => {
  const scenario = BayesScenarios[scenarioIdx];
  const [applied, setApplied] = React.useState([]);
  const [phase, setPhase] = React.useState('explore');

  const posterior = React.useMemo(() => {
    // sequential Bayes update via likelihood ratios on odds
    let odds = scenario.prior / (1 - scenario.prior);
    for (const id of applied) {
      const ev = scenario.evidence.find(e => e.id === id);
      if (ev) odds *= ev.lr;
    }
    return odds / (1 + odds);
  }, [applied, scenario]);

  const toggle = (id) => {
    setApplied(applied.includes(id) ? applied.filter(x => x !== id) : [...applied, id]);
  };

  return (
    <Panel eyebrow="Station 05" title={scenario.title} accent="var(--signal)">
      <div style={{ color:'var(--ink-2)', marginBottom:18 }}>{scenario.context}</div>

      <div style={{ display:'grid', gridTemplateColumns:'1.05fr 1fr', gap:24 }}>
        {/* left — beaker */}
        <div style={{ padding:'22px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:18 }}>
          <BeliefBar prior={scenario.prior} posterior={posterior} label="your current belief"/>

          <div style={{ position:'relative', height:240, marginTop:10 }}>
            {/* beaker outline */}
            <svg viewBox="0 0 200 240" width="100%" height="100%" style={{ display:'block' }}>
              <defs>
                <clipPath id="beakerClip">
                  <path d="M 50 20 L 50 200 Q 50 230 80 230 L 120 230 Q 150 230 150 200 L 150 20 Z" />
                </clipPath>
                <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--signal-2)" stopOpacity=".95"/>
                  <stop offset="1" stopColor="var(--signal)" stopOpacity="1"/>
                </linearGradient>
              </defs>
              {/* prior marker */}
              <line x1="46" x2="154" y1={230 - scenario.prior * 210} y2={230 - scenario.prior * 210} stroke="var(--noise-2)" strokeWidth="1.5" strokeDasharray="3 3"/>
              <text x="158" y={230 - scenario.prior * 210 + 4} fontSize="10" fill="var(--noise-2)" className="mono">prior {Math.round(scenario.prior*100)}%</text>
              {/* liquid */}
              <rect x="40" y={230 - posterior * 210} width="120" height={posterior * 210}
                fill="url(#liquid)" clipPath="url(#beakerClip)"
                style={{ transition:'all .65s cubic-bezier(.2,.9,.3,1)' }}/>
              {/* glass */}
              <path d="M 50 20 L 50 200 Q 50 230 80 230 L 120 230 Q 150 230 150 200 L 150 20"
                fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="40" x2="50" y1="20" y2="20" stroke="var(--ink)" strokeWidth="2.5"/>
              <line x1="150" x2="160" y1="20" y2="20" stroke="var(--ink)" strokeWidth="2.5"/>
              {/* tick marks */}
              {[0,.25,.5,.75,1].map(t => (
                <g key={t}>
                  <line x1="50" x2="58" y1={230 - t*210} y2={230 - t*210} stroke="var(--ink-3)" strokeWidth="1"/>
                  <text x="40" y={230 - t*210 + 3} fontSize="9" fill="var(--ink-4)" textAnchor="end" className="mono">{Math.round(t*100)}</text>
                </g>
              ))}
            </svg>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <Stat label="prior" value={`${Math.round(scenario.prior*100)}%`}/>
            <Stat label="posterior" value={`${Math.round(posterior*100)}%`} tone="signal"/>
            <Stat label="evidence in play" value={`${applied.length}/${scenario.evidence.length}`}/>
          </div>
        </div>

        {/* right — evidence chips */}
        <div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10 }}>Click to add or remove evidence</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {scenario.evidence.map(ev => {
              const on = applied.includes(ev.id);
              const pos = ev.direction === 'pos';
              return (
                <button key={ev.id} className="btn" onClick={()=>toggle(ev.id)}
                  style={{
                    textAlign:'left', padding:'14px 16px', borderRadius:14,
                    background: on ? (pos?'var(--leaf-soft)':'var(--noise-soft)') : 'var(--bg-card)',
                    border: `1.5px solid ${on ? (pos?'var(--leaf)':'var(--noise)') : 'var(--line-2)'}`,
                    boxShadow:'var(--shadow-sm)'
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:14.5, fontWeight:500, color:'var(--ink)' }}>{ev.label}</span>
                    <span className="mono" style={{ fontSize:12, padding:'3px 8px', borderRadius:999, color: pos?'var(--good)':'var(--bad)', background:'var(--bg-card)', border:`1px solid ${pos?'var(--leaf)':'var(--noise)'}`}}>
                      ×{ev.lr.toFixed(1)} odds
                    </span>
                  </div>
                  {on && <div className="fadeup" style={{ marginTop:6, fontSize:12.5, color:'var(--ink-3)', fontStyle:'italic' }}>{ev.note}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Callout tone="signal" icon="◑">
        Bayes' rule in plain English: <strong>your new odds = old odds × likelihood ratio</strong>. Each piece of evidence multiplies, it doesn't add. Strong priors are hard to move; weak priors flip easily.
      </Callout>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <Button onClick={() => { recordScore('bayes', { posterior, applied: applied.length }); onComplete(); }} size="lg">Finish station →</Button>
      </div>
    </Panel>
  );
};

// ─── Station 6: Wisdom of Crowds ────────────────────────────────────────
// Use seeded crowd of guesses around a known truth, with a long-tail bias to make it interesting
const generateCrowd = (truth, n=400, seed=42, biasFactor=0.85, spread=0.35) => {
  const rng = mulberry32(seed);
  const guesses = [];
  for (let i = 0; i < n; i++) {
    // Most people underestimate jelly beans / overestimate familiar things
    const bias = truth * biasFactor;
    const sd = truth * spread;
    const g = bias + gauss(rng) * sd;
    guesses.push(Math.max(0, Math.round(g)));
  }
  return guesses;
};

const StationCrowd = ({ onComplete, recordScore }) => {
  const TRUTH = 1247; // jelly beans in jar
  const CROWD_SEED = 91;
  const [low, setLow] = React.useState(800);
  const [mid, setMid] = React.useState(1000);
  const [high, setHigh] = React.useState(1500);
  const [phase, setPhase] = React.useState('guess');

  const crowd = React.useMemo(() => generateCrowd(TRUTH, 600, CROWD_SEED, 0.82, 0.32), []);
  const median = React.useMemo(() => {
    const s = [...crowd].sort((a,b)=>a-b);
    return s[Math.floor(s.length/2)];
  }, [crowd]);
  const mean = React.useMemo(() => Math.round(crowd.reduce((a,b)=>a+b,0)/crowd.length), [crowd]);

  // Histogram buckets
  const buckets = React.useMemo(() => {
    const min = Math.min(...crowd, TRUTH * 0.3);
    const max = Math.max(...crowd, TRUTH * 1.6);
    const span = max - min;
    const nB = 28;
    const w = span / nB;
    const bs = Array.from({length:nB}).map((_,i) => ({ x0: min + i*w, x1: min + (i+1)*w, count: 0 }));
    crowd.forEach(g => {
      const idx = Math.min(nB - 1, Math.floor((g - min) / w));
      if (idx >= 0) bs[idx].count++;
    });
    return bs;
  }, [crowd]);

  const inCI = TRUTH >= low && TRUTH <= high;
  const hitMid = Math.abs(mid - TRUTH) < Math.abs(median - TRUTH);

  return (
    <Panel eyebrow="Station 06" title="How many jelly beans in the jar?" accent="var(--signal)">
      <div style={{ display:'grid', gridTemplateColumns:'.85fr 1.15fr', gap:24, alignItems:'flex-start' }}>
        {/* left — jar */}
        <div style={{ padding:'22px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', textAlign:'center' }}>
          <svg viewBox="0 0 200 240" width="180" style={{ display:'block', margin:'0 auto'}}>
            <defs>
              <clipPath id="jarClip">
                <path d="M 50 40 L 50 200 Q 50 225 80 225 L 120 225 Q 150 225 150 200 L 150 40 Q 150 30 140 30 L 60 30 Q 50 30 50 40 Z"/>
              </clipPath>
            </defs>
            {/* jelly beans */}
            <g clipPath="url(#jarClip)">
              {Array.from({length: 140}).map((_, i) => {
                const r = mulberry32(i + 1)();
                const r2 = mulberry32(i + 999)();
                const x = 55 + r * 90;
                const y = 50 + r2 * 170;
                const hue = ['#E66B3D','#1E5F70','#C99425','#5A7A3D','#B6402A'][Math.floor(mulberry32(i+7)()*5)];
                return <ellipse key={i} cx={x} cy={y} rx="6.5" ry="4.5" fill={hue} opacity=".78" transform={`rotate(${(mulberry32(i+11)()*180)} ${x} ${y})`}/>;
              })}
            </g>
            <path d="M 50 40 L 50 200 Q 50 225 80 225 L 120 225 Q 150 225 150 200 L 150 40" fill="none" stroke="var(--ink)" strokeWidth="2.5"/>
            <path d="M 45 28 L 155 28 Q 162 28 162 35 L 162 42 Q 162 49 155 49 L 45 49 Q 38 49 38 42 L 38 35 Q 38 28 45 28 Z" fill="var(--gold-soft)" stroke="var(--ink)" strokeWidth="2"/>
            <text x="100" y="44" textAnchor="middle" fontSize="11" fill="var(--ink-2)" className="mono" fontWeight="600">GUESS THE COUNT</text>
          </svg>
        </div>

        {/* right — input */}
        <div>
          {phase === 'guess' && (
            <div>
              <p style={{ marginTop:0, color:'var(--ink-2)' }}>Give a <strong>90% confidence interval</strong> — a range you're 90% sure contains the true count — and your best single guess.</p>
              <CIInput low={low} mid={mid} high={high}
                min={100} max={3000}
                onChange={({low,mid,high})=>{ setLow(low); setMid(mid); setHigh(high); }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24 }}>
                <span style={{ fontSize:13, color:'var(--ink-3)' }}>If you're well calibrated, the truth lands in your interval ~9 times out of 10.</span>
                <Button onClick={()=>setPhase('reveal')} size="lg">Reveal the crowd →</Button>
              </div>
            </div>
          )}
          {phase === 'reveal' && (
            <div className="fadeup">
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>What 600 other students guessed</div>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:16, padding:'14px 12px 4px'}}>
                <Histogram buckets={buckets} truth={TRUTH} mean={mean} highlight={mid}/>
                <div className="mono" style={{ display:'flex', justifyContent:'space-around', fontSize:11, color:'var(--ink-4)', padding:'0 8px'}}>
                  <span>low</span><span>guesses →</span><span>high</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:14 }}>
                <Stat label="Truth" value={TRUTH.toLocaleString()} tone="noise"/>
                <Stat label="Crowd median" value={median.toLocaleString()} tone="signal" sub={`off by ${Math.abs(median - TRUTH)}`}/>
                <Stat label="Your guess" value={mid.toLocaleString()} sub={`off by ${Math.abs(mid - TRUTH)}`} tone={hitMid ? 'good':'neutral'}/>
              </div>
              <Callout tone={inCI ? 'good' : 'noise'} icon={inCI ? '✓' : '✗'}>
                <strong>Your 90% interval {inCI ? 'caught the truth.' : 'missed.'}</strong> {' '}
                {inCI ? 'Nice — wide enough to capture uncertainty.' : 'A miss usually means the interval was too narrow. Most people underestimate how wide their intervals should be.'}
              </Callout>
              <Callout tone="signal" icon="∑">
                <strong>The crowd beats most individuals.</strong> The median of the crowd ({median.toLocaleString()}) is closer to the truth than {Math.round(crowd.filter(g => Math.abs(g - TRUTH) < Math.abs(median - TRUTH)).length / crowd.length * 100)}% of individual guesses. Errors cancel out when biases are uncorrelated.
              </Callout>

              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
                <Button onClick={() => { recordScore('crowd', { mid, low, high, truth: TRUTH, inCI, median }); onComplete(); }} size="lg">Finish station →</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

Object.assign(window, { StationSignal, StationCalibration, StationBrier, StationBaseRate, StationBayes, StationCrowd });
