// stations.jsx — six stations of the Forecasting Lab

// ─── Station 1: Spot the Signal ──────────────────────────────────────────
// Rounds are generated fresh from the run seed: 2 pure-noise series plus 3
// distinct signal types, in a shuffled order, with fresh data every run.
const SignalPromptPool = [
  'Sales over the last 40 days', 'Weekly active users since launch', 'Defect rate after a process change',
  'Daily app rating (random sample)', 'Hourly checkout volume', 'Support tickets per day',
  'Sign-ups after a press mention', 'Factory output per shift', 'Daily podcast downloads', 'Checkout conversion rate',
];
const SignalTypeInfo = {
  none: { accept:'noise',  truth:'There is no underlying trend. Every dot is pure noise around a flat mean.', tip:'Random noise forms patterns the brain mistakes for stories. Demand more data.' },
  up:   { accept:'signal', truth:'There IS a real upward trend (≈ +30 over the window), buried in noise.', tip:'Slow upward signals are hardest to spot when noise > signal.' },
  down: { accept:'signal', truth:'There IS a real downward trend (≈ −30 over the window), hidden in the noise.', tip:'Declines hide in noise just like rises. Check the slope, not the story.' },
  step: { accept:'signal', truth:'A real step change happens just past the middle of the window — the mean shifts up.', tip:'Step changes are easier to test than slope changes — split before/after and compare means.' },
  cycle:{ accept:'signal', truth:'A real cyclical pattern (period ≈ ½ window). Real cycles repeat; noise doesn\'t.', tip:'Real cycles persist out-of-sample. Test the prediction, not the chart.' },
};
const makeSignalRounds = (seed) => {
  const rng = mulberry32(seed * 7919 + 11);
  const prompts = seededShuffle(SignalPromptPool, rng);
  const sigTypes = seededShuffle(['up','down','step','cycle'], rng).slice(0, 3);
  const types = seededShuffle(['none', 'none', ...sigTypes], rng);
  return types.map((type, i) => ({
    id: 's' + (i+1), type,
    dataSeed: 1 + Math.floor(rng() * 1e6),
    noise: type === 'cycle' ? 5 + rng() * 3 : 7 + rng() * 6,
    prompt: prompts[i],
    ...SignalTypeInfo[type],
  }));
};

const StationSignal = ({ onComplete, recordScore, seed=1, difficulty='regular' }) => {
  const rounds = React.useMemo(() => makeSignalRounds(seed), [seed]);
  const [round, setRound] = React.useState(0);
  const [phase, setPhase] = React.useState('decide'); // decide | reveal
  const [picks, setPicks] = React.useState([]);
  const noiseMul = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.4 : 1.0;
  const cur = rounds[round];
  const data = React.useMemo(() => genSeries({ seed: cur.dataSeed, n: 40, signal: cur.type, noise: cur.noise * noiseMul, bias: 50 }), [cur, noiseMul]);

  const choose = (choice) => {
    const correct = choice === cur.accept;
    setPicks([...picks, { id: cur.id, choice, correct }]);
    setPhase('reveal');
  };
  const next = () => {
    if (round + 1 >= rounds.length) {
      const correct = picks.filter(p => p.correct).length;
      recordScore('signal', { correct, total: rounds.length });
      onComplete();
      return;
    }
    setRound(round + 1);
    setPhase('decide');
  };

  const last = picks[picks.length - 1];

  return (
    <Panel eyebrow={`Station 01 · Round ${round+1} of ${rounds.length}`} title="Is this a real trend, or just noise?" accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <span style={{ color:'var(--ink-2)', fontSize:15 }}>{cur.prompt}</span>
        <ProgressDots total={rounds.length} current={round}/>
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
              {round + 1 >= rounds.length ? 'Finish station →' : 'Next round →'}
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
  { q:'Which is larger by land area?', a:'Australia', b:'Greenland', answer:'a', note:'Australia (~7.7M km²) is roughly 3.5× the size of Greenland (~2.2M km²). The Mercator map projection inflates Greenland enormously, which fools most people.' },
  { q:'Which has a larger population?', a:'California', b:'Canada', answer:'b', note:'Canada ~40M, California ~39M. Very close — a high-confidence pick is overconfidence.' },
  { q:'Which is taller?', a:'Mt. Kilimanjaro', b:'Mt. McKinley (Denali)', answer:'b', note:'Denali is 6,190m; Kilimanjaro is 5,895m. Close, but Denali wins.' },
  { q:'Which element is more abundant in Earth\'s crust?', a:'Iron', b:'Oxygen', answer:'b', note:'Oxygen (~46%) dominates the crust by mass. Iron is only ~5%.' },
  { q:'Which has more native speakers?', a:'Spanish', b:'English', answer:'a', note:'Spanish native speakers (~485M) outnumber English natives (~380M). English wins on total speakers when you add second-language.' },
  { q:'Which year was the modern Eiffel Tower completed?', a:'1879', b:'1889', answer:'b', note:'1889, for the World\'s Fair marking the centennial of the French Revolution.' },
  { q:'Which is heavier?', a:'A cubic meter of dry pine wood', b:'A cubic meter of saltwater', answer:'b', note:'Saltwater ≈ 1,025 kg/m³ vs pine ≈ 500 kg/m³. Saltwater is denser than fresh AND most softwoods.' },
  { q:'Which planet has more moons (known, as of recent counts)?', a:'Jupiter', b:'Saturn', answer:'b', note:'Saturn took the lead — 140+ confirmed moons compared to Jupiter\'s 95-ish.' },
  { q:'Which country has a larger population?', a:'Nigeria', b:'Russia', answer:'a', note:'Nigeria (~220M) comfortably exceeds Russia (~144M) — and the gap is widening fast.' },
  { q:'Which planet is closer to Earth, averaged over time?', a:'Mercury', b:'Venus', answer:'a', note:'Venus comes closest at its nearest approach, but Mercury spends more time near us — on average, Mercury is the closest planet to Earth (and to every other planet).' },
  { q:'Which has more bones?', a:'A human hand', b:'A human foot', answer:'a', note:'The hand has 27 bones; the foot has 26. About as close as anatomy gets.' },
  { q:'Which covers a larger area?', a:'The Pacific Ocean', b:'All land on Earth combined', answer:'a', note:'The Pacific (~165M km²) out-measures every continent and island combined (~149M km²).' },
  { q:'Which was demonstrated first?', a:'Television', b:'Sliced bread (machine-sliced, sold commercially)', answer:'a', note:'Television was demonstrated in 1926; commercially sliced bread arrived in 1928. So TV is literally the greatest thing since… before sliced bread.' },
  { q:'Which country drinks more tea per person?', a:'Turkey', b:'The United Kingdom', answer:'a', note:'Turkey leads the world at roughly 3+ kg per person per year — about twice the UK figure.' },
  { q:'Which is farther north?', a:'London, UK', b:'Calgary, Canada', answer:'a', note:'London sits at ~51.5°N, Calgary at ~51.0°N. Canada feels colder, but the Gulf Stream, not latitude, is why.' },
  { q:'Which country spans more time zones (including territories)?', a:'Russia', b:'France', answer:'b', note:'France covers 12 time zones thanks to its overseas territories; Russia has 11.' },
  { q:'Which animal kills more humans per year?', a:'Sharks', b:'Hippos', answer:'b', note:'Hippos kill roughly 500 people per year; sharks kill about 10. Fear is a terrible base-rate estimator.' },
  { q:'Which is older?', a:'Harvard University', b:'Calculus', answer:'a', note:'Harvard was founded in 1636; Newton and Leibniz developed calculus decades later (1660s–1680s).' },
  { q:'Which has a larger population?', a:'The Tokyo metropolitan area', b:'Australia', answer:'a', note:'Greater Tokyo (~37M) exceeds all of Australia (~26M).' },
];

// This is a 2-alternative forced choice: you always pick the option you think
// MORE likely, so a rational confidence is always ≥ 50%. Bin the 50–100 range
// into 5 buckets of 10pts each.
const bucketize = (entries) => {
  const edges = [[50,60],[60,70],[70,80],[80,90],[90,101]];
  return edges.map(([lo,hi]) => {
    const items = entries.filter(e => e.conf >= lo && e.conf < hi);
    const mid = (lo + Math.min(hi,100)) / 2;
    return { p: mid/100, n: items.length, freq: items.length ? items.filter(x=>x.correct).length / items.length : 0, range:`${lo}–${Math.min(hi-1,100)}` };
  });
};

const StationCalibration = ({ onComplete, recordScore, seed=1 }) => {
  // draw 10 of the 20-question bank per run, seeded — replays get fresh questions
  const qs = React.useMemo(() => seededShuffle(QuizQs, mulberry32(seed * 104729 + 3)).slice(0, 10), [seed]);
  const [idx, setIdx] = React.useState(0);
  const [pick, setPick] = React.useState(null);
  const [conf, setConf] = React.useState(50);
  const [phase, setPhase] = React.useState('answer'); // answer | confidence | reveal | done
  const [log, setLog] = React.useState([]);
  const cur = qs[idx];

  const submit = () => {
    const correct = pick === cur.answer;
    const entry = { q: cur.q, pick, correct, conf };
    setLog([...log, entry]);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= qs.length) {
      // submit() already appended the final entry to `log`; don't append it again.
      const allEntries = log;
      const buckets = bucketize(allEntries);
      const correctCount = allEntries.filter(e => e.correct).length;
      recordScore('calibration', { buckets, correct: correctCount, total: qs.length, log: allEntries });
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
            <CalibrationPlot buckets={buckets} xMin={0.5}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Stat label="Score" value={`${finalLog.filter(e=>e.correct).length}/${finalLog.length}`} sub="raw accuracy" />
            <Stat label="Avg. confidence" value={`${Math.round(finalLog.reduce((s,e)=>s+e.conf,0)/finalLog.length)}%`} />
            <Stat label="Actual accuracy" value={`${Math.round(finalLog.filter(e=>e.correct).length/finalLog.length*100)}%`} tone={Math.abs(finalLog.reduce((s,e)=>s+e.conf,0)/finalLog.length - finalLog.filter(e=>e.correct).length/finalLog.length*100) > 10 ? 'bad' : 'good'} sub="should match avg. confidence"/>
            <Callout tone="signal" icon="◔">A well-calibrated forecaster's average confidence equals their accuracy. Most people sit 10–20 points overconfident on their first try.</Callout>
            <Callout tone="gold" icon="!">Only {finalLog.length} questions here, so each bucket holds just a handful of answers — a single lucky or unlucky call swings a point a long way. Treat this as a rough sketch of your calibration, not a verdict. Real calibration needs dozens of forecasts.</Callout>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button onClick={onComplete} size="lg">Finish station →</Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel eyebrow={`Station 02 · Question ${idx+1}/${qs.length}`} title={cur.q} accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}><ProgressDots total={qs.length} current={idx}/></div>

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
          <div style={{ marginBottom:14, color:'var(--ink-2)' }}>How confident are you that this pick is right? You already chose the option you think is more likely, so this runs from a coin-flip (50%) up to certain (100%).</div>
          <ConfidenceSlider value={conf} onChange={setConf} min={50}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:26 }}>
            <span style={{ color:'var(--ink-3)', fontSize:13, maxWidth:440 }}>
              {conf < 55 ? 'Basically a coin flip — you barely favour this option.' :
               conf < 70 ? 'A modest lean — you’d still expect to be wrong fairly often.' :
               conf < 85 ? 'Confident — you’d bet money on it.' :
               conf < 97 ? 'Very confident — you’d bet a lot.' :
                           'Near-certain — you’d stake almost anything.'}
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
              <Button onClick={next} size="lg">{idx+1>=qs.length ? 'See your calibration →' : 'Next question →'}</Button>
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
  {
    id:'b7', q:'A randomly chosen US domestic flight arrives more than 15 minutes late.',
    truth:false, optimal:.21,
    context:[
      { kind:'reference', text:'DOT statistics: roughly 78–80% of US domestic flights arrive within 15 minutes of schedule in a normal year.' },
      { kind:'data', text:'This flight is a random draw — no weather event or holiday-season skew applies.' },
      { kind:'note', text:'Delays feel more common than they are because the bad ones are memorable.' },
    ],
    lesson:'The right forecast is about 20%. Availability bias — vividly remembering the one 3-hour delay — pushes most people far higher.'
  },
  {
    id:'b8', q:'A randomly selected new restaurant is still open 5 years after launch.',
    truth:true, optimal:.50,
    context:[
      { kind:'reference', text:'Across all new US businesses, government data shows roughly half survive to the 5-year mark. Restaurants track this figure fairly closely.' },
      { kind:'note', text:'The famous "90% of restaurants fail in the first year" statistic is a myth — no serious dataset supports it.' },
      { kind:'analogy', text:'First-year closure rates for restaurants run ~15–20%, similar to other service businesses.' },
    ],
    lesson:'About 50% survive 5 years. The "90% fail" folklore is a case study in how a made-up number becomes a base rate in people\'s heads.'
  },
  {
    id:'b9', q:'A randomly chosen active NBA player is 7 feet (213 cm) or taller.',
    truth:false, optimal:.07,
    context:[
      { kind:'reference', text:'NBA rosters hold ~450 players; recent seasons list roughly 25–35 players at 7 feet or taller.' },
      { kind:'analogy', text:'The average NBA player is ~6\'6" — extremely tall, but a full 6 inches below 7 feet.' },
      { kind:'note', text:'Famous centers are heavily over-represented in highlights and memory.' },
    ],
    lesson:'Only ~6–8% of NBA players are 7-footers. The stars you can name are a biased sample of the league.'
  },
  {
    id:'b10', q:'The next child born (worldwide, at random) is a boy.',
    truth:true, optimal:.51,
    context:[
      { kind:'physical', text:'The human sex ratio at birth is remarkably stable at about 105 boys per 100 girls.' },
      { kind:'note', text:'No other information about the family is available.' },
    ],
    lesson:'The answer is ~51%, not 50%. When you genuinely know a small edge, a calibrated forecaster states it — 51% and 50% are different claims.'
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

const StationBrier = ({ onComplete, recordScore, seed=1 }) => {
  // draw 6 of the 10-event bank per run, seeded
  const events = React.useMemo(() => seededShuffle(BrierEvents, mulberry32(seed * 48611 + 7)).slice(0, 6), [seed]);
  const [idx, setIdx] = React.useState(0);
  const [prob, setProb] = React.useState(50);
  const [phase, setPhase] = React.useState('predict'); // predict | reveal | done
  const [rounds, setRounds] = React.useState([]);
  const cur = events[idx];

  const submit = () => {
    const p = prob / 100;
    const outcome = cur.truth ? 1 : 0;
    const score = Math.pow(p - outcome, 2);
    const optimal = Math.pow(cur.optimal - outcome, 2);
    setRounds([...rounds, { ...cur, p, outcome, score, optimal }]);
    setPhase('reveal');
  };
  const next = () => {
    if (idx + 1 >= events.length) {
      const avg = rounds.reduce((s,r)=>s+r.score,0) / rounds.length;
      recordScore('brier', { avg, rounds });
      setPhase('done');
      return;
    }
    setIdx(idx+1);
    setProb(50);
    setPhase('predict');
  };

  const avgSoFar = rounds.length ? rounds.reduce((s,r)=>s+r.score,0) / rounds.length : null;

  if (phase === 'done') {
    const avg = rounds.reduce((s,r)=>s+r.score,0) / rounds.length;
    const optAvg = rounds.reduce((s,r)=>s+r.optimal,0) / rounds.length;
    const gapAvg = rounds.reduce((s,r)=>s+Math.abs(r.p - r.optimal),0) / rounds.length;
    return (
      <Panel eyebrow="Station 03 · Season over" title="Your forecasting season, scored." accent="var(--signal)">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
          <Stat label="Your avg Brier" value={avg.toFixed(3)} tone={avg < 0.15 ? 'good' : avg < 0.28 ? 'neutral' : 'bad'} sub="lower is better"/>
          <Stat label="Optimal avg Brier" value={optAvg.toFixed(3)} tone="signal" sub="the best inference from the clues"/>
          <Stat label="Avg gap to optimal" value={`${Math.round(gapAvg*100)} pts`} tone={gapAvg < .10 ? 'good' : gapAvg < .20 ? 'neutral' : 'bad'} sub="avg |your prob − optimal prob|"/>
        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'2.2fr .7fr .7fr .7fr .8fr', padding:'10px 14px', background:'var(--bg-soft)', borderBottom:'1px solid var(--line)' }} className="mono">
            {['event','you','optimal','outcome','brier'].map(hd => (
              <span key={hd} style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>{hd}</span>
            ))}
          </div>
          {rounds.map((r, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'2.2fr .7fr .7fr .7fr .8fr', padding:'10px 14px', borderBottom: i < rounds.length-1 ? '1px solid var(--line)' : 'none', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--ink-2)', paddingRight:10 }}>{r.q}</span>
              <span className="mono" style={{ fontSize:13, fontWeight:600 }}>{Math.round(r.p*100)}%</span>
              <span className="mono" style={{ fontSize:13, color:'var(--ink-3)' }}>{Math.round(BrierEvents.find(e=>e.id===r.id).optimal*100)}%</span>
              <span className="mono" style={{ fontSize:13, color: r.outcome ? 'var(--good)' : 'var(--bad)' }}>{r.outcome ? 'Yes' : 'No'}</span>
              <span className="mono" style={{ fontSize:13, fontWeight:600, color: r.score < 0.15 ? 'var(--good)' : r.score < 0.3 ? 'var(--gold)' : 'var(--bad)' }}>{r.score.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <Callout tone="signal" icon="∑">
          <strong>Where does a Brier score come from?</strong> Two skills, added together: <em>calibration</em> (when you say 70%, it happens ~70% of the time) and <em>resolution</em> (daring to move away from the base rate when the clues justify it). Hedging everything at 50% is perfectly calibrated but has zero resolution — over this season a permanent 50% would have scored 0.250. Beat that, and your clue-reading added real information.
        </Callout>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button onClick={onComplete} size="lg">Finish station →</Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel eyebrow={`Station 03 · Event ${idx+1}/${events.length}`} title="Will it happen?" accent="var(--signal)">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <ProgressDots total={events.length} current={idx}/>
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

            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', lineHeight:1.5, margin:'12px 2px 0' }}>
              The "optimal" forecast minimises your <em>expected</em> Brier over many outcomes. On a single realised event, an overconfident call can occasionally score better by luck — the payoff is in being calibrated across a whole season of forecasts, not any one of them.
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
              <Button onClick={next} size="lg">{idx+1>=events.length ? 'See season results →' : 'Next event →'}</Button>
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
  const [phase, setPhase] = React.useState('guess'); // guess | step1 | step2 | step3 | explore
  const [revealed, setRevealed] = React.useState(false);
  // live-explorer parameters (percentages)
  const [exp, setExp] = React.useState({ prev: 1, sens: 99, spec: 95 });

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

  // ── live explorer math (dots are a 2,500-person sample of the same rates) ──
  const expSick = 10000 * exp.prev / 100;
  const expTP = expSick * exp.sens / 100;
  const expFP = (10000 - expSick) * (100 - exp.spec) / 100;
  const expPPV = expTP + expFP > 0 ? expTP / (expTP + expFP) : 0;
  const dotsTotal = 2500;
  const dSick = Math.round(dotsTotal * exp.prev / 100);
  const dTP = Math.round(dSick * exp.sens / 100);
  const dFP = Math.round((dotsTotal - dSick) * (100 - exp.spec) / 100);
  const classifyExplore = (i) => {
    if (i < dSick) return i < dTP ? { type:'tp', color:'var(--noise)' } : { type:'fn', color:'var(--ink-3)' };
    const j = i - dSick;
    return j < dFP ? { type:'fp', color:'var(--gold)' } : { type:'tn', color:'var(--bg-soft)' };
  };

  const finish = () => { recordScore('baseRate', { guess, truth: Math.round(ppv*100) }); onComplete(); };

  if (phase === 'explore') {
    const ExpSlider = ({ label, value, min, max, step, onChange, hint }) => (
      <div style={{ padding:'12px 16px', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em' }}>{label}</span>
          <span className="mono" style={{ fontSize:20, fontWeight:600 }}>{value}%</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(+e.target.value)}/>
        {hint && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:-2 }}>{hint}</div>}
      </div>
    );
    return (
      <Panel eyebrow="Station 04 · Explore" title="Now break it: move the dials yourself." accent="var(--signal)">
        <p style={{ color:'var(--ink-2)', marginTop:0 }}>The answer you just saw isn't a fixed fact — it's a tug-of-war between the base rate and the test's error rates. Drag the sliders and watch when a positive test is worth believing.</p>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'flex-start' }}>
          <div style={{ background:'var(--bg-soft)', borderRadius:18, padding:14, border:'1px solid var(--line)'}}>
            <DotField rows={50} cols={50} dotSize={8} gap={1} classify={classifyExplore}/>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textAlign:'center', marginTop:8 }}>
              <span style={{color:'var(--noise-2)'}}>● true positive</span> · <span style={{color:'var(--gold)'}}>● false positive</span> · <span style={{color:'var(--ink-3)'}}>● sick but missed</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <ExpSlider label="prevalence (base rate)" value={exp.prev} min={0.2} max={20} step={0.2}
              onChange={(v)=>setExp({ ...exp, prev:v })} hint="How common the disease is in the population."/>
            <ExpSlider label="sensitivity (catches true cases)" value={exp.sens} min={50} max={100} step={1}
              onChange={(v)=>setExp({ ...exp, sens:v })}/>
            <ExpSlider label="specificity (clears healthy people)" value={exp.spec} min={80} max={99.8} step={0.2}
              onChange={(v)=>setExp({ ...exp, spec:v })} hint="False-positive rate = 100% − specificity."/>
            <div style={{ padding:'16px 20px', borderRadius:14, background:'var(--bg-card)', border:'1.5px solid var(--ink)' }}>
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em' }}>P(sick | positive test)</div>
              <div className="mono" style={{ fontSize:40, fontWeight:600 }}>{Math.round(expPPV*100)}%</div>
              <div className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>
                = {Math.round(expTP).toLocaleString()} true positives ÷ ({Math.round(expTP).toLocaleString()} + {Math.round(expFP).toLocaleString()} false positives), per 10,000 people
              </div>
            </div>
            <Callout tone="signal" icon="∴">
              Notice the lever that matters: with a rare disease, <strong>specificity dominates</strong>. Nudging specificity from 95% to 99% does more for a positive test's meaning than any improvement in sensitivity — because almost everyone tested is healthy.
            </Callout>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={finish}>Finish station →</Button>
        </div>
      </Panel>
    );
  }

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
                {phase === 'step3' && <Button variant="ghost" onClick={finish}>Finish station</Button>}
                {phase === 'step3' && <Button size="lg" onClick={()=>setPhase('explore')}>Experiment with the numbers →</Button>}
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

const StationBayes = ({ onComplete, recordScore, seed=1, scenarioIdx }) => {
  // scenario rotates with the run seed (replays alternate scenarios) unless pinned via prop
  const sIdx = scenarioIdx != null ? scenarioIdx : Math.floor(mulberry32(seed * 31 + 7)() * BayesScenarios.length);
  const scenario = BayesScenarios[sIdx];
  const allIds = scenario.evidence.map(e => e.id);
  const [applied, setApplied] = React.useState([]);
  const [phase, setPhase] = React.useState('explore'); // explore | assess | reveal
  const [estimate, setEstimate] = React.useState(50);   // user's predicted posterior (%)

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
    if (phase !== 'explore') return; // evidence is locked once you commit to a prediction
    setApplied(applied.includes(id) ? applied.filter(x => x !== id) : [...applied, id]);
  };

  const startAssess = () => { setApplied(allIds); setEstimate(Math.round(scenario.prior*100)); setPhase('assess'); };
  const submitEstimate = () => {
    const gap = Math.abs(estimate/100 - posterior);
    recordScore('bayes', { posterior, applied: allIds.length, estimate: estimate/100, gap });
    setPhase('reveal');
  };

  const hidePosterior = phase === 'assess'; // conceal the answer while the student predicts it
  const gap = Math.abs(estimate/100 - posterior);
  const gapPts = Math.round(gap*100);

  return (
    <Panel eyebrow="Station 05" title={scenario.title} accent="var(--signal)">
      <div style={{ color:'var(--ink-2)', marginBottom:18 }}>{scenario.context}</div>

      <div style={{ display:'grid', gridTemplateColumns:'1.05fr 1fr', gap:24 }}>
        {/* left — beaker */}
        <div style={{ padding:'22px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:18 }}>
          {hidePosterior
            ? <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em' }}>your current belief</span>
                <span className="mono" style={{ fontSize:24, fontWeight:600, color:'var(--ink-4)' }}>? %</span>
              </div>
            : <BeliefBar prior={scenario.prior} posterior={posterior} label="your current belief"/>}

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
              {/* liquid (hidden while predicting) */}
              {!hidePosterior && <rect x="40" y={230 - posterior * 210} width="120" height={posterior * 210}
                fill="url(#liquid)" clipPath="url(#beakerClip)"
                style={{ transition:'all .65s cubic-bezier(.2,.9,.3,1)' }}/>}
              {hidePosterior && <text x="100" y="130" textAnchor="middle" fontSize="52" fill="var(--ink-4)" className="serif">?</text>}
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
              {/* user's estimate marker (on reveal) */}
              {phase === 'reveal' && <g>
                <line x1="40" x2="160" y1={230 - (estimate/100) * 210} y2={230 - (estimate/100) * 210} stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 3"/>
                <text x="100" y={230 - (estimate/100) * 210 - 5} fontSize="10" fill="var(--gold)" textAnchor="middle" className="mono">you: {estimate}%</text>
              </g>}
            </svg>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <Stat label="prior" value={`${Math.round(scenario.prior*100)}%`}/>
            <Stat label="posterior" value={hidePosterior ? '?' : `${Math.round(posterior*100)}%`} tone="signal"/>
            <Stat label="evidence in play" value={`${applied.length}/${scenario.evidence.length}`}/>
          </div>
        </div>

        {/* right — evidence chips */}
        <div>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10 }}>
            {phase === 'explore' ? 'Click to add or remove evidence' : 'All evidence in play (locked)'}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {scenario.evidence.map(ev => {
              const on = applied.includes(ev.id);
              const pos = ev.direction === 'pos';
              return (
                <button key={ev.id} className="btn" onClick={()=>toggle(ev.id)}
                  style={{
                    textAlign:'left', padding:'14px 16px', borderRadius:14,
                    cursor: phase === 'explore' ? 'pointer' : 'default',
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
                  {on && (phase !== 'assess') && <div className="fadeup" style={{ marginTop:6, fontSize:12.5, color:'var(--ink-3)', fontStyle:'italic' }}>{ev.note}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Callout tone="signal" icon="◑">
        Bayes' rule in plain English: <strong>your new odds = old odds × likelihood ratio</strong>. Each piece of evidence multiplies, it doesn't add. Strong priors are hard to move; weak priors flip easily.
      </Callout>

      <Callout tone="gold" icon="!">
        <strong>Independence assumption.</strong> Multiplying these likelihood ratios together assumes each clue is <em>conditionally independent</em> given the outcome. Real clues overlap — a Stanford degree and a brilliant question both proxy "smart" — so multiplying naively double-counts and overstates the update. Treat the beaker as an upper bound on how far the evidence should really move you.
      </Callout>

      {phase === 'explore' && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, gap:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:13.5, color:'var(--ink-3)', maxWidth:520 }}>Experiment freely: toggle clues on and off and watch the belief move. When you're ready, we'll lock in all the evidence, hide the answer, and ask you to predict the posterior.</span>
          <Button onClick={startAssess} size="lg">Quiz me: predict the posterior →</Button>
        </div>
      )}

      {phase === 'assess' && (
        <div className="fadeup" style={{ marginTop:18, padding:'20px 22px', borderRadius:18, background:'var(--bg-card)', border:'1.5px solid var(--line-2)' }}>
          <div style={{ marginBottom:12, color:'var(--ink-2)', fontSize:15 }}>All six clues are now in play. Starting from the <strong>{Math.round(scenario.prior*100)}% prior</strong> and multiplying by every likelihood ratio, <strong>where does your belief end up?</strong></div>
          <ProbabilitySlider value={estimate} onChange={setEstimate} lowLabel="0%" highLabel="100%"/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:22 }}>
            <Button onClick={submitEstimate} size="lg">Reveal the true posterior →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="fadeup" style={{ marginTop:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
            <Stat label="You predicted" value={`${estimate}%`}/>
            <Stat label="True posterior" value={`${Math.round(posterior*100)}%`} tone="signal"/>
            <Stat label="Gap" value={`${gapPts} pts`} tone={gap < 0.08 ? 'good' : gap < 0.18 ? 'neutral' : 'bad'}/>
          </div>
          <Callout tone={gap < 0.08 ? 'good' : gap < 0.18 ? 'gold' : 'noise'} icon={gap < 0.08 ? '✓' : gap < 0.18 ? '≈' : '✗'}>
            {gap < 0.08
              ? 'Sharp. You tracked the odds-multiplication closely — that\'s exactly the Bayesian instinct.'
              : gap < 0.18
                ? 'Close. You had the right direction; the exact magnitude of a multiplicative update is famously hard to eyeball.'
                : (estimate/100 > posterior
                    ? 'You over-shot. Piling positive clues together feels convincing, but a modest prior and a couple of negatives pull the posterior back down harder than intuition expects.'
                    : 'You under-shot. Strong positive likelihood ratios compound faster than addition — a chain of good signals moves belief further than it feels like it should.')}
          </Callout>

          {/* the actual arithmetic, step by step */}
          {(() => {
            const priorOdds = scenario.prior / (1 - scenario.prior);
            let running = priorOdds;
            const rows = scenario.evidence.map(ev => {
              running *= ev.lr;
              return { label: ev.label, lr: ev.lr, odds: running, p: running / (1 + running) };
            });
            const cell = { fontSize:12.5, padding:'6px 10px' };
            return (
              <div style={{ marginTop:14, padding:'14px 16px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8 }}>the arithmetic, line by line</div>
                <div className="mono" style={{ display:'grid', gridTemplateColumns:'2fr .8fr .9fr .8fr', background:'var(--bg-card)', borderRadius:10, border:'1px solid var(--line)', overflow:'hidden' }}>
                  <span style={{ ...cell, color:'var(--ink-3)' }}>start: prior {Math.round(scenario.prior*100)}%</span>
                  <span style={{ ...cell }}></span>
                  <span style={{ ...cell, fontWeight:600 }}>odds {priorOdds.toFixed(2)}</span>
                  <span style={{ ...cell, color:'var(--ink-3)' }}>{Math.round(scenario.prior*100)}%</span>
                  {rows.map((r, i) => (
                    <React.Fragment key={i}>
                      <span style={{ ...cell, borderTop:'1px solid var(--line)', color:'var(--ink-2)', fontFamily:'inherit' }}>{r.label}</span>
                      <span style={{ ...cell, borderTop:'1px solid var(--line)', color: r.lr >= 1 ? 'var(--good)' : 'var(--bad)', fontWeight:600 }}>× {r.lr.toFixed(1)}</span>
                      <span style={{ ...cell, borderTop:'1px solid var(--line)' }}>= {r.odds.toFixed(2)}</span>
                      <span style={{ ...cell, borderTop:'1px solid var(--line)', color:'var(--ink-3)' }}>{Math.round(r.p*100)}%</span>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:8 }}>
                  Odds = p ÷ (1−p). Each clue multiplies the odds by its likelihood ratio; converting back at the end gives p = odds ÷ (1+odds) = <strong style={{ color:'var(--ink)' }}>{Math.round(posterior*100)}%</strong>. That's the whole machine.
                </div>
              </div>
            );
          })()}
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
            <Button onClick={onComplete} size="lg">Finish station →</Button>
          </div>
        </div>
      )}
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

const StationCrowd = ({ onComplete, recordScore, seed=1 }) => {
  // jar count + crowd are seeded per run, so replays get a fresh jar
  const cfg = React.useMemo(() => {
    const rng = mulberry32(seed * 613 + 29);
    return {
      TRUTH: 900 + Math.round(rng() * 800),
      CROWD_SEED: 1000 + Math.floor(rng() * 9000),
      bias: 0.78 + rng() * 0.08,   // crowds systematically lowball dense jars
      spread: 0.28 + rng() * 0.08,
    };
  }, [seed]);
  const TRUTH = cfg.TRUTH;
  const [low, setLow] = React.useState(800);
  const [mid, setMid] = React.useState(1000);
  const [high, setHigh] = React.useState(1500);
  const [phase, setPhase] = React.useState('guess');

  const crowd = React.useMemo(() => generateCrowd(TRUTH, 600, cfg.CROWD_SEED, cfg.bias, cfg.spread), [cfg]);
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
              <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>A simulated crowd of 600 guesses</div>
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
              <Callout tone="gold" icon="∑">
                <strong>Aggregation removes noise — but not shared bias.</strong> The crowd's median ({median.toLocaleString()}) beats {Math.round(crowd.filter(g => Math.abs(g - TRUTH) > Math.abs(median - TRUTH)).length / crowd.length * 100)}% of the individual guesses: pooling cancels the random over- and under-shooting. Yet it's still {Math.abs(median - TRUTH).toLocaleString()} off the truth ({Math.round(Math.abs(median - TRUTH)/TRUTH*100)}%), because this crowd shares a systematic <em>downward</em> lean — most people lowball a densely packed jar. Wisdom of crowds works when errors are independent; when everyone leans the same way, the crowd is confidently wrong together.
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
