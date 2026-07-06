// build.mjs — transpile the JSX prototype into standalone, single-file GitHub Pages.
// Each component becomes docs/<id>/index.html (self-contained: theme CSS + shared atoms +
// the owning component file + a bootstrap, with React/ReactDOM + fonts from CDN).
// A hub at docs/index.html links them all.
//
// Run: node build.mjs

import { transform } from 'esbuild';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DOCS = join(ROOT, 'docs');

const FONTS = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap';
// React is vendored into docs/shared/ (see main()) so pages have zero external JS dependency.
const REACT = '../shared/react.production.min.js';
const REACT_DOM = '../shared/react-dom.production.min.js';

// id -> { comp, file, maxW, extra, ... }  (mirrors app.jsx routing + STATIONS/SIMS metadata)
const COMPONENTS = [
  // Core stations
  { id:'signal',      comp:'StationSignal',      file:'stations', maxW:920,  extra:{ difficulty:'regular' }, group:'Core stations', n:'01', label:'Spot the Signal',        blurb:'Tell trends from noise',            concept:'Signal vs. noise',          color:'var(--noise)' },
  { id:'calibration', comp:'StationCalibration', file:'stations', maxW:920,  extra:{}, group:'Core stations', n:'02', label:'Calibration Quiz',       blurb:'How sure are you, really?',         concept:'Confidence calibration',    color:'var(--signal)' },
  { id:'brier',       comp:'StationBrier',       file:'stations', maxW:920,  extra:{}, group:'Core stations', n:'03', label:'Brier Arena',            blurb:'Probabilities, scored',             concept:'Brier scoring rule',        color:'var(--gold)' },
  { id:'base-rate',   comp:'StationBaseRate',    file:'stations', maxW:1020, extra:{}, group:'Core stations', n:'04', label:'Base Rate Trap',         blurb:'The 1%-disease puzzle',             concept:'Priors & base rates',       color:'var(--noise-2)' },
  { id:'bayes',       comp:'StationBayes',       file:'stations', maxW:1040, extra:{}, group:'Core stations', n:'05', label:'Bayesian Theater',       blurb:'Move beliefs with evidence',        concept:'Bayesian updating',         color:'var(--signal-2)' },
  { id:'crowd',       comp:'StationCrowd',       file:'stations', maxW:1000, extra:{}, group:'Core stations', n:'06', label:'Wisdom of Crowds',       blurb:'You vs. the aggregate',             concept:'Aggregation & sample size', color:'var(--leaf)' },
  // Quick drills
  { id:'tournament',  comp:'StationTournament',  file:'sims-drills', maxW:920, extra:{}, group:'Quick drills', label:"Forecaster's Tournament", blurb:'Rapid probability calls, scored by Brier', concept:'Brier scoring · calibration', color:'var(--gold)' },
  { id:'drift',       comp:'StationDrift',       file:'sims-drills', maxW:980, extra:{}, group:'Quick drills', label:'Drift Detector',         blurb:'Mark where a time series shifts',   concept:'Change-point detection',      color:'var(--noise)' },
  { id:'anchor',      comp:'StationAnchor',      file:'sims-drills', maxW:920, extra:{}, group:'Quick drills', label:'Anchoring Lab',          blurb:'Measure your own anchoring bias',   concept:'Anchoring · cognitive bias',  color:'var(--gold)' },
  { id:'crowd-vs',    comp:'StationCrowdVs',     file:'sims-drills', maxW:920, extra:{}, group:'Quick drills', label:'Versus the Crowd',       blurb:'Update toward the crowd · or not',  concept:'Aggregation · independence',  color:'var(--leaf)' },
  // Domain sims
  { id:'election',    comp:'StationElection',    file:'games',      maxW:980, extra:{}, group:'Domain sims', label:'Election Night',         blurb:'Update P(D wins) as precincts report', concept:'Sequential Bayes · sample size', color:'var(--signal)' },
  { id:'outbreak',    comp:'StationOutbreak',    file:'sims-domain', maxW:980, extra:{}, group:'Domain sims', label:'Outbreak Tracker',       blurb:'Forecast an epidemic peak in real time', concept:'Exponential growth · updates', color:'var(--noise)' },
  { id:'ab-test',     comp:'StationAB',          file:'sims-domain', maxW:980, extra:{}, group:'Domain sims', label:'A/B Test Director',      blurb:'STOP / KEEP / SHIP on partial data', concept:'Testing · stopping rules',    color:'var(--signal)' },
  { id:'hiring',      comp:'StationHiring',      file:'sims-domain', maxW:1020, extra:{}, group:'Domain sims', label:'Hiring Roulette',        blurb:'Read 12 candidates with budget for 5', concept:'Signal extraction · base rates', color:'var(--signal-2)' },
  // Decision sims
  { id:'detective',   comp:'StationDetective',   file:'games',       maxW:980, extra:{}, group:'Decision sims', label:'Detective',              blurb:'Solve a murder by likelihood ratios', concept:'Bayesian reasoning · evidence', color:'var(--noise-2)' },
  { id:'trial',       comp:'StationTrial',       file:'sims-decision', maxW:980, extra:{}, group:'Decision sims', label:'Trial Lawyer',           blurb:'Update on evidence, set a threshold', concept:'Sequential Bayes · threshold', color:'var(--noise-2)' },
  { id:'stock',       comp:'StationStock',       file:'games',       maxW:980, extra:{}, group:'Decision sims', label:'Stock Picker',           blurb:'Bet your bankroll on noisy signals', concept:'Calibration under risk',      color:'var(--gold)' },
  { id:'vc',          comp:'StationVC',          file:'sims-decision', maxW:980, extra:{}, group:'Decision sims', label:'VC Portfolio',           blurb:'Allocate $10M across startups',     concept:'Power-law payoffs',           color:'var(--gold)' },
  { id:'inspector',   comp:'StationInspector',   file:'sims-decision', maxW:980, extra:{}, group:'Decision sims', label:'Inspector',              blurb:"Tune a fraud detector's threshold", concept:'Sensitivity vs specificity',  color:'var(--leaf)' },
  { id:'whistle',     comp:'StationWhistle',     file:'sims-decision', maxW:980, extra:{}, group:'Decision sims', label:'Whistleblower',          blurb:'Five rumors, varying independence', concept:'Correlated evidence',         color:'var(--noise-2)' },
];

const GROUP_ORDER = ['Core stations', 'Quick drills', 'Domain sims', 'Decision sims'];

const esc = (js) => js.replace(/<\/script/gi, '<\\/script');
const jsx = async (code) => (await transform(code, {
  loader:'jsx', jsx:'transform', jsxFactory:'React.createElement', jsxFragment:'React.Fragment',
})).code;

const readSrc = (name) => readFile(join(SRC, name), 'utf8');

// Bootstrap: mount one component with stub recordScore + replay-on-onComplete, plus a page chrome header.
const bootstrap = (c) => `
(function(){
  var COMP = window[${JSON.stringify(c.comp)}];
  var EXTRA = ${JSON.stringify(c.extra || {})};
  var h = React.createElement;
  // Seeded runs: ?seed=N reproduces an exact run (shareable); otherwise each
  // visit gets a fresh random seed, and every replay advances to a new one.
  var urlSeed = parseInt(new URLSearchParams(location.search).get('seed'), 10);
  var BASE_SEED = (Number.isFinite(urlSeed) && urlSeed > 0) ? urlSeed : (1 + Math.floor(Math.random() * 999983));
  function Header(){
    return h('div',{style:{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(16px) saturate(150%)',background:'rgba(241,236,222,.78)',borderBottom:'1px solid var(--line)'}},
      h('div',{style:{maxWidth:1320,margin:'0 auto',padding:'12px 24px',display:'flex',alignItems:'center',gap:16}},
        h('a',{href:'../',className:'btn',style:{display:'flex',alignItems:'center',gap:10,background:'transparent',padding:0,textDecoration:'none'}},
          h('svg',{width:30,height:30,viewBox:'0 0 34 34'},
            h('circle',{cx:17,cy:17,r:16,fill:'var(--ink)'}),
            h('path',{d:'M3 19 Q 7 11, 11 19 T 19 19 T 27 19 T 31 19',fill:'none',stroke:'var(--noise)',strokeWidth:1.4,strokeLinecap:'round',opacity:.8}),
            h('path',{d:'M 5 17 L 11 17 L 14 9 L 20 25 L 23 17 L 29 17',fill:'none',stroke:'var(--bg-card)',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'})
          ),
          h('div',{style:{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1.05}},
            h('span',{className:'serif',style:{fontWeight:600,letterSpacing:'-.02em',fontSize:18,color:'var(--ink)'}},'Signal & Noise Lab'),
            h('span',{className:'serif',style:{fontSize:10.5,fontStyle:'italic',color:'var(--ink-3)',fontWeight:400}},'Maxted Neal')
          )
        ),
        h('div',{style:{flex:1}}),
        h('span',{className:'mono',style:{fontSize:12,color:'var(--ink-3)'}}, ${JSON.stringify(c.label)}),
        h('a',{href:'../',className:'btn',style:{padding:'8px 14px',borderRadius:999,fontSize:13,fontWeight:500,background:'var(--bg-soft)',color:'var(--ink-2)',border:'1px solid var(--line-2)',textDecoration:'none'}},'↩ All sims')
      )
    );
  }
  function Page(){
    var st = React.useState(0), k = st[0], setK = st[1];
    var seed = ((BASE_SEED + k * 7919) % 999983) + 1;
    function record(id,data){ window.__lastScore={id:id,data:data,seed:seed}; try{console.log('[score]',id,data);}catch(e){} }
    function done(){ setK(k+1); window.scrollTo({top:0}); }
    var shareUrl = location.pathname + '?seed=' + seed;
    return h('div',{className:'shell paper'},
      h(Header,null),
      h('div',{style:{flex:1}},
        h('div',{style:{maxWidth:${c.maxW},margin:'0 auto',padding:'40px 28px 40px'}},
          COMP ? h(COMP, Object.assign({key:k, seed:seed, onComplete:done, recordScore:record}, EXTRA))
               : h('div',{style:{padding:40,color:'var(--bad)'}},'Component ${c.comp} failed to load.')
        ),
        h('div',{className:'mono',style:{textAlign:'center',fontSize:11,color:'var(--ink-4)',padding:'0 24px 48px'}},
          'run #' + seed + ' · ',
          h('a',{href:shareUrl,style:{color:'var(--ink-3)'}},'link to this exact run'),
          ' · finishing a run deals fresh data'
        )
      )
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(h(Page));
})();
`;

const page = (c, theme, scripts) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${c.label} · Signal & Noise Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
<style>
${theme}
</style>
</head>
<body>
<div id="root"></div>
<script src="${REACT}"></script>
<script src="${REACT_DOM}"></script>
${scripts.map(s => `<script>\n${esc(s)}\n</script>`).join('\n')}
</body>
</html>`;

function hub(theme) {
  const cards = GROUP_ORDER.map(group => {
    const items = COMPONENTS.filter(c => c.group === group);
    const tiles = items.map(c => `
        <a class="tile" href="${c.id}/" style="--c:${c.color}">
          <span class="tile-top"></span>
          <span class="tile-kicker">${c.n ? 'STATION ' + c.n : 'SIM'}</span>
          <span class="tile-title">${c.label}</span>
          <span class="tile-blurb">${c.blurb}</span>
          <span class="tile-concept">${c.concept}</span>
        </a>`).join('');
    return `
      <section class="group">
        <h2 class="serif group-h">${group}</h2>
        <div class="grid">${tiles}</div>
      </section>`;
  }).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Signal & Noise Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
<style>
${theme}
.wrap{max-width:1240px;margin:0 auto;padding:56px 28px 90px}
.hero-h{margin:0;font-size:clamp(40px,7vw,64px);line-height:1.02;letter-spacing:-.03em;max-width:900px}
.hero-p{font-size:19px;color:var(--ink-2);max-width:680px;margin-top:18px;line-height:1.5}
.group{margin-top:56px}
.group-h{font-size:30px;margin:0 0 18px;letter-spacing:-.015em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.tile{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:4px;text-decoration:none;
  padding:22px 22px 18px;border-radius:20px;background:var(--bg-card);border:1px solid var(--line);
  box-shadow:var(--shadow-sm);min-height:170px;transition:transform .15s ease,box-shadow .2s ease}
.tile:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}
.tile-top{position:absolute;top:0;left:22px;right:22px;height:3px;background:var(--c);border-radius:0 0 4px 4px}
.tile-kicker{font-family:"Geist Mono",monospace;font-size:11px;color:var(--ink-4);letter-spacing:.16em;margin-top:4px}
.tile-title{font-family:"Newsreader",serif;font-weight:600;font-size:22px;color:var(--ink);line-height:1.15;margin-top:2px}
.tile-blurb{font-size:14px;color:var(--ink-3);line-height:1.4;flex:1}
.tile-concept{font-family:"Geist Mono",monospace;font-size:10.5px;color:var(--ink-4);text-transform:uppercase;letter-spacing:.12em;margin-top:10px}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}
.brand-t{font-family:"Newsreader",serif;font-weight:600;font-size:22px;letter-spacing:-.02em}
.brand-s{font-family:"Newsreader",serif;font-size:11px;font-style:italic;color:var(--ink-3)}
</style>
</head>
<body>
<div class="shell paper">
  <div class="wrap">
    <div class="brand">
      <svg width="36" height="36" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="var(--ink)"/><path d="M3 19 Q 7 11, 11 19 T 19 19 T 27 19 T 31 19" fill="none" stroke="var(--noise)" stroke-width="1.4" stroke-linecap="round" opacity=".8"/><path d="M 5 17 L 11 17 L 14 9 L 20 25 L 23 17 L 29 17" fill="none" stroke="var(--bg-card)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div style="display:flex;flex-direction:column;line-height:1.1"><span class="brand-t">Signal &amp; Noise Lab</span><span class="brand-s">Maxted Neal</span></div>
    </div>
    <h1 class="serif hero-h">Learn to <em>see</em> through the noise.</h1>
    <p class="hero-p">A collection of standalone forecasting exercises for non-stats undergrads. Each one is a self-contained game on a single skill — signal vs. noise, calibration, Bayesian updating, aggregation, and decision-making under uncertainty. Pick any to begin.</p>
    ${cards}
  </div>
</div>
</body>
</html>`;
}

async function main() {
  if (existsSync(DOCS)) await rm(DOCS, { recursive:true, force:true });
  await mkdir(DOCS, { recursive:true });

  // copy vendored React UMD (committed under src/shared/vendor) so pages have no external JS dependency
  await mkdir(join(DOCS, 'shared'), { recursive:true });
  const vendor = join(SRC, 'shared', 'vendor');
  await writeFile(join(DOCS, 'shared', 'react.production.min.js'), await readFile(join(vendor, 'react.production.min.js')));
  await writeFile(join(DOCS, 'shared', 'react-dom.production.min.js'), await readFile(join(vendor, 'react-dom.production.min.js')));

  const theme = await readFile(join(SRC, 'shared', 'theme.css'), 'utf8');
  const ui = await jsx(await readSrc('ui.jsx'));
  const charts = await jsx(await readSrc('charts.jsx'));

  // transpile each owning file once, cache
  const files = {};
  for (const name of new Set(COMPONENTS.map(c => c.file))) {
    files[name] = await jsx(await readSrc(name + '.jsx'));
  }

  for (const c of COMPONENTS) {
    const scripts = [ui, charts, files[c.file], bootstrap(c)];
    const html = page(c, theme, scripts);
    await mkdir(join(DOCS, c.id), { recursive:true });
    await writeFile(join(DOCS, c.id, 'index.html'), html);
    console.log('  ✓', c.id);
  }

  await writeFile(join(DOCS, 'index.html'), hub(theme));
  await writeFile(join(DOCS, '.nojekyll'), '');
  console.log('  ✓ hub + .nojekyll');
  console.log(`\nBuilt ${COMPONENTS.length} pages + hub into docs/`);
}

main().catch(e => { console.error(e); process.exit(1); });
