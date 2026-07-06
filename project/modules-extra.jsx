// modules-extra.jsx — additional teaching modules organized by pillar
// Each module follows the same shape as the original Modules in modules.jsx:
// { title, intro, accent, frames: [{ title, illustration, body, takeaway? }] }

// ─── Shared illustration palette ─────────────────────────────────────────
const X_Streak = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">A "HOT STREAK" THAT ISN'T</text>
    {Array.from({length:14}).map((_,i) => {
      const w = i < 5 ? 22 : i < 9 ? 36 : 22;
      const x = 24 + i*22;
      const y = 90 - (i < 5 ? 6 : i < 9 ? 24 : 4);
      const fill = i < 5 ? 'var(--ink-3)' : i < 9 ? 'var(--noise)' : 'var(--ink-3)';
      return <rect key={i} x={x} y={y} width="16" height={w} rx="2" fill={fill} opacity={i<5||i>=9?.55:1}/>;
    })}
    <line x1="24" x2="324" y1="148" y2="148" stroke="var(--ink-3)" strokeDasharray="3 4"/>
    <text x="174" y="166" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">player's true average</text>
    <text x="100" y="190" textAnchor="middle" fontSize="11" fill="var(--noise-2)" className="mono">peak</text>
  </svg>
);

const X_Converge = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">% HEADS AS COIN-FLIPS ACCUMULATE</text>
    <line x1="30" x2="350" y1="100" y2="100" stroke="var(--ink-3)" strokeDasharray="3 4"/>
    <text x="36" y="96" fontSize="10" fill="var(--ink-3)" className="mono">50%</text>
    <path d="M 30 70 L 60 130 L 90 60 L 120 110 L 150 85 L 180 105 L 210 95 L 240 100 L 270 98 L 300 102 L 330 100"
      fill="none" stroke="var(--signal)" strokeWidth="2.5"/>
    <circle cx="30" cy="70" r="3" fill="var(--signal)"/>
    <circle cx="330" cy="100" r="3" fill="var(--signal)"/>
    <text x="30" y="180" fontSize="11" fill="var(--ink-3)" className="mono">10 flips</text>
    <text x="330" y="180" fontSize="11" fill="var(--ink-3)" textAnchor="end" className="mono">10,000 flips</text>
  </svg>
);

const X_Plane = () => (
  <svg viewBox="0 0 360 220" width="100%" style={{ maxWidth:300 }}>
    <text x="180" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">RETURNING BOMBERS · WWII</text>
    {/* plane silhouette */}
    <path d="M 180 50 L 200 110 L 320 130 L 320 145 L 200 150 L 200 200 L 215 215 L 200 215 L 180 200 L 160 215 L 145 215 L 160 200 L 160 150 L 40 145 L 40 130 L 160 110 Z"
      fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="1.5"/>
    {/* bullet holes — clustered on wings/tail, NONE on engines/cockpit */}
    {[[85,135],[120,140],[140,135],[260,135],[290,140],[180,170],[185,195],[170,160]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="3.5" fill="var(--noise)"/>
    ))}
    <text x="180" y="80" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">no holes here</text>
    <path d="M 180 86 L 180 105" stroke="var(--ink-3)" strokeWidth="1" markerEnd=""/>
  </svg>
);

const X_Iceberg = () => (
  <svg viewBox="0 0 360 220" width="100%" style={{ maxWidth:300 }}>
    <text x="180" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">WHAT YOU SEE · WHAT YOU DON'T</text>
    <line x1="20" x2="340" y1="100" y2="100" stroke="var(--signal)" strokeWidth="1.5" strokeDasharray="3 3"/>
    <text x="20" y="94" fontSize="10" fill="var(--signal)" className="mono">surface</text>
    {/* visible tip */}
    <polygon points="170,55 130,100 210,100" fill="var(--gold-soft)" stroke="var(--gold)" strokeWidth="1.5"/>
    <text x="170" y="80" textAnchor="middle" fontSize="11" fill="var(--ink)" className="mono">success</text>
    {/* hidden mass */}
    <polygon points="130,100 210,100 290,200 50,200" fill="var(--noise-soft)" stroke="var(--noise)" strokeWidth="1.5"/>
    <text x="170" y="160" textAnchor="middle" fontSize="11" fill="var(--ink-2)" className="mono">all the failures</text>
    <text x="170" y="178" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">filtered out before you saw it</text>
  </svg>
);

const X_Wheel = () => (
  <svg viewBox="0 0 240 220" width="200">
    <text x="120" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">"RANDOM" ANCHOR · YOUR GUESS</text>
    {/* wheel */}
    <circle cx="80" cy="120" r="50" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="2"/>
    {Array.from({length:8}).map((_,i) => {
      const a = i * Math.PI / 4;
      const x1 = 80 + Math.cos(a)*50, y1 = 120 + Math.sin(a)*50;
      return <line key={i} x1="80" y1="120" x2={x1} y2={y1} stroke="var(--ink-3)" strokeWidth="1"/>;
    })}
    <polygon points="80,60 75,72 85,72" fill="var(--noise)"/>
    <text x="80" y="124" textAnchor="middle" fontSize="20" fill="var(--ink)" className="serif">12</text>
    {/* arrow */}
    <line x1="140" y1="120" x2="170" y2="120" stroke="var(--ink-2)" strokeWidth="2" markerEnd=""/>
    <polygon points="170,120 162,116 162,124" fill="var(--ink-2)"/>
    {/* guess */}
    <rect x="180" y="92" width="48" height="56" rx="6" fill="var(--gold-soft)" stroke="var(--gold)"/>
    <text x="204" y="116" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">guess?</text>
    <text x="204" y="138" textAnchor="middle" fontSize="22" fill="var(--ink)" className="serif">~15</text>
    <text x="120" y="200" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">your estimate sticks to the anchor</text>
  </svg>
);

const X_VennLinda = () => (
  <svg viewBox="0 0 280 200" width="240">
    <text x="140" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">P(A AND B) ≤ P(A)</text>
    <circle cx="115" cy="110" r="60" fill="var(--signal-soft)" opacity=".7" stroke="var(--signal)"/>
    <circle cx="170" cy="110" r="44" fill="var(--noise-soft)" opacity=".7" stroke="var(--noise)"/>
    <text x="86" y="105" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">bank teller</text>
    <text x="86" y="120" textAnchor="middle" fontSize="10" fill="var(--signal)" className="mono">(broad)</text>
    <text x="188" y="105" textAnchor="middle" fontSize="11" fill="var(--noise-2)" className="mono">+ activist</text>
    <text x="188" y="120" textAnchor="middle" fontSize="10" fill="var(--noise-2)" className="mono">(narrow)</text>
    <text x="140" y="190" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">"more specific" ≠ "more likely"</text>
  </svg>
);

const X_TwoWay = () => (
  <svg viewBox="0 0 320 200" width="280">
    <text x="160" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">P(SICK|+) ≠ P(+|SICK)</text>
    {/* 2x2 grid */}
    <rect x="60" y="40" width="200" height="120" fill="none" stroke="var(--ink)" strokeWidth="1.5"/>
    <line x1="160" y1="40" x2="160" y2="160" stroke="var(--ink)" strokeWidth="1.5"/>
    <line x1="60" y1="100" x2="260" y2="100" stroke="var(--ink)" strokeWidth="1.5"/>
    {/* TP */}
    <rect x="60" y="40" width="100" height="60" fill="var(--noise)" opacity=".6"/>
    <text x="110" y="74" textAnchor="middle" fontSize="14" fill="#fff" className="mono">99</text>
    {/* FN */}
    <rect x="60" y="100" width="100" height="60" fill="var(--noise-soft)" opacity=".6"/>
    <text x="110" y="134" textAnchor="middle" fontSize="14" fill="var(--ink)" className="mono">1</text>
    {/* FP */}
    <rect x="160" y="40" width="100" height="60" fill="var(--gold)" opacity=".5"/>
    <text x="210" y="74" textAnchor="middle" fontSize="14" fill="var(--ink)" className="mono">495</text>
    {/* TN */}
    <rect x="160" y="100" width="100" height="60" fill="var(--bg-soft)"/>
    <text x="210" y="134" textAnchor="middle" fontSize="14" fill="var(--ink-3)" className="mono">9,405</text>
    {/* labels */}
    <text x="110" y="34" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">sick</text>
    <text x="210" y="34" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">well</text>
    <text x="54" y="74" textAnchor="end" fontSize="10" fill="var(--ink-3)" className="mono">+</text>
    <text x="54" y="134" textAnchor="end" fontSize="10" fill="var(--ink-3)" className="mono">−</text>
  </svg>
);

const X_Funnel = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">FIVE 80% STAGES = 33% SURVIVAL</text>
    {[100, 80, 64, 51, 41, 33].map((v, i) => (
      <g key={i} transform={`translate(${30 + i*54} 80)`}>
        <rect x="-22" y={(100-v)*0.7} width="44" height={v*0.7} rx="4" fill={v > 80 ? 'var(--leaf)' : v > 60 ? 'var(--gold)' : v > 40 ? 'var(--noise)' : 'var(--bad)'} opacity=".8"/>
        <text x="0" y={(100-v)*0.7 - 4} textAnchor="middle" fontSize="11" fill="var(--ink)" className="mono">{v}%</text>
        <text x="0" y="100" textAnchor="middle" fontSize="9" fill="var(--ink-3)" className="mono">{i === 0 ? 'start' : `stage ${i}`}</text>
      </g>
    ))}
  </svg>
);

const X_FatTail = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">NORMAL VS. FAT-TAILED</text>
    {/* normal curve */}
    <path d="M 30 160 Q 100 160, 130 140 T 180 60 T 230 140 T 320 160 Z" fill="var(--signal-soft)" stroke="var(--signal)" strokeWidth="1.5"/>
    {/* fat-tail extension */}
    <path d="M 30 160 Q 70 158, 100 152 T 150 130 T 180 80 T 210 130 T 260 152 T 320 158" fill="none" stroke="var(--noise)" strokeWidth="2" strokeDasharray="3 3"/>
    <text x="320" y="156" textAnchor="end" fontSize="10" fill="var(--noise-2)" className="mono">← fat tails</text>
    <text x="180" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">"impossible" events lurk in the tails</text>
  </svg>
);

const X_Tree = () => (
  <svg viewBox="0 0 320 200" width="280">
    <text x="160" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">DECISION ≠ OUTCOME</text>
    {/* trunk */}
    <line x1="60" y1="100" x2="120" y2="100" stroke="var(--ink)" strokeWidth="2"/>
    {/* branches */}
    <line x1="120" y1="100" x2="220" y2="60" stroke="var(--leaf)" strokeWidth="2"/>
    <line x1="120" y1="100" x2="220" y2="140" stroke="var(--noise)" strokeWidth="2"/>
    <circle cx="60" cy="100" r="8" fill="var(--ink)"/>
    <text x="50" y="120" fontSize="11" fill="var(--ink-2)" textAnchor="end" className="mono">decision</text>
    <circle cx="220" cy="60" r="14" fill="var(--leaf-soft)" stroke="var(--leaf)" strokeWidth="2"/>
    <text x="240" y="64" fontSize="11" fill="var(--good)" className="mono">good outcome</text>
    <circle cx="220" cy="140" r="14" fill="var(--noise-soft)" stroke="var(--noise)" strokeWidth="2"/>
    <text x="240" y="144" fontSize="11" fill="var(--bad)" className="mono">bad outcome</text>
    <text x="150" y="70" fontSize="10" fill="var(--leaf)" className="mono">70%</text>
    <text x="150" y="135" fontSize="10" fill="var(--noise-2)" className="mono">30%</text>
  </svg>
);

const X_FilterSticks = () => {
  // Confirmation bias: only "yes" evidence reaches inbox
  return (
    <svg viewBox="0 0 320 200" width="280">
      <text x="160" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">EVIDENCE FILTER</text>
      {/* funnel */}
      <path d="M 40 50 L 280 50 L 200 130 L 120 130 Z" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="1.5"/>
      {/* dots flowing through */}
      {Array.from({length:12}).map((_,i) => {
        const x = 60 + (i % 6)*40;
        const y = 32 + Math.floor(i / 6) * 14;
        const isConfirm = i % 3 === 0;
        return <circle key={i} cx={x} cy={y} r="5" fill={isConfirm ? 'var(--leaf)' : 'var(--noise)'} opacity={isConfirm ? 1 : .35}/>;
      })}
      <text x="50" y="44" fontSize="10" fill="var(--leaf)" className="mono">confirms</text>
      <text x="285" y="44" fontSize="10" fill="var(--noise-2)" textAnchor="end" className="mono">disconfirms</text>
      {/* output: only confirms */}
      {[150, 170, 190].map((x, i) => <circle key={i} cx={x} cy="150" r="5" fill="var(--leaf)"/>)}
      <text x="160" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">your "evidence" is pre-filtered</text>
    </svg>
  );
};

const X_Frames = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">SAME FACT · TWO FRAMES</text>
    <rect x="30" y="40" width="140" height="120" rx="10" fill="var(--leaf-soft)" stroke="var(--leaf)"/>
    <text x="100" y="80" textAnchor="middle" fontSize="13" fill="var(--good)" className="serif">90% effective</text>
    <text x="100" y="120" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">→ feels safe</text>
    <rect x="190" y="40" width="140" height="120" rx="10" fill="var(--noise-soft)" stroke="var(--noise)"/>
    <text x="260" y="80" textAnchor="middle" fontSize="13" fill="var(--bad)" className="serif">10% failure rate</text>
    <text x="260" y="120" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">→ feels risky</text>
  </svg>
);

const X_RegimeShift = () => (
  <svg viewBox="0 0 380 200" width="100%" style={{ maxWidth:340 }}>
    <text x="190" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">PRE- AND POST-REGIME</text>
    {/* before — stable */}
    {Array.from({length:18}).map((_,i) => {
      const rng = mulberry32(i + 4);
      const x = 30 + i*9;
      const y = 110 + (rng() - .5)*16;
      return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--signal)"/>;
    })}
    {/* shift line */}
    <line x1="192" y1="40" x2="192" y2="170" stroke="var(--noise-2)" strokeWidth="1.5" strokeDasharray="3 4"/>
    <text x="195" y="40" fontSize="10" fill="var(--noise-2)" className="mono">regime change →</text>
    {/* after — higher level */}
    {Array.from({length:18}).map((_,i) => {
      const rng = mulberry32(i + 50);
      const x = 200 + i*9;
      const y = 70 + (rng() - .5)*22;
      return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--noise)"/>;
    })}
  </svg>
);

const X_OutsideInside = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">INSIDE vs OUTSIDE VIEW</text>
    {/* inside: one person looking at one project */}
    <g transform="translate(70 100)">
      <circle r="34" fill="var(--noise-soft)" stroke="var(--noise)"/>
      <text y="-3" textAnchor="middle" fontSize="11" fill="var(--noise-2)" className="serif">my project</text>
      <text y="14" textAnchor="middle" fontSize="10" fill="var(--noise-2)" className="mono">"feels easy"</text>
    </g>
    {/* outside: many projects */}
    <g transform="translate(240 100)">
      {[[ -30,-15],[20,-22],[-20,18],[25,8],[0,-2]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="14" fill="var(--signal-soft)" stroke="var(--signal)"/>
      ))}
      <text y="50" textAnchor="middle" fontSize="11" fill="var(--signal)" className="serif">past projects</text>
      <text y="64" textAnchor="middle" fontSize="10" fill="var(--signal)" className="mono">3× over budget</text>
    </g>
    <text x="180" y="186" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">trust the reference class</text>
  </svg>
);

const X_LocalNews = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">PERCEIVED vs ACTUAL DEATHS</text>
    {[
      { what:'Heart disease',perceived:7,actual:90,color:'var(--ink)'},
      { what:'Cancer',perceived:18,actual:75,color:'var(--ink)'},
      { what:'Car crash',perceived:28,actual:14,color:'var(--noise)'},
      { what:'Homicide',perceived:36,actual:2,color:'var(--noise)'},
      { what:'Terror',perceived:33,actual:0.1,color:'var(--noise)'},
    ].map((r,i) => (
      <g key={i} transform={`translate(0 ${36 + i*28})`}>
        <text x="10" y="12" fontSize="11" fill="var(--ink-2)" className="mono">{r.what}</text>
        <rect x="100" y="2" width={r.perceived*2.4} height="10" fill="var(--gold)" opacity=".75"/>
        <rect x="100" y="14" width={r.actual*1.4} height="6" fill={r.color} opacity=".6"/>
      </g>
    ))}
    <text x="100" y="200" fontSize="9" fill="var(--ink-3)" className="mono">gold = how often it's reported · black = actual rate</text>
  </svg>
);

const X_AggregateDots = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">MEAN · MEDIAN · TRIMMED</text>
    {/* dots scattered */}
    {[80, 95, 110, 130, 135, 138, 142, 145, 150, 155, 158, 165, 290].map((x,i) => (
      <circle key={i} cx={x} cy="110" r="4" fill={i === 12 ? 'var(--noise)' : 'var(--signal)'} opacity=".75"/>
    ))}
    <line x1="159" y1="80" x2="159" y2="140" stroke="var(--ink)" strokeWidth="2"/>
    <text x="159" y="74" textAnchor="middle" fontSize="10" fill="var(--ink)" className="mono">median 145</text>
    <line x1="180" y1="80" x2="180" y2="140" stroke="var(--gold)" strokeWidth="2" strokeDasharray="3 3"/>
    <text x="180" y="160" textAnchor="middle" fontSize="10" fill="var(--gold)" className="mono">mean 161</text>
    <text x="290" y="100" textAnchor="middle" fontSize="10" fill="var(--noise-2)" className="mono">outlier</text>
    <text x="180" y="190" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">means are pulled by extremes; medians aren't</text>
  </svg>
);

const X_Confidence = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">WORDS DON'T MAP TO NUMBERS</text>
    {[
      { word:'almost certain', lo:.85, hi:.99 },
      { word:'very likely',    lo:.7,  hi:.95 },
      { word:'likely',         lo:.55, hi:.85 },
      { word:'about even',     lo:.4,  hi:.6 },
      { word:'unlikely',       lo:.1,  hi:.4 },
    ].map((r,i) => (
      <g key={i} transform={`translate(0 ${36 + i*28})`}>
        <text x="14" y="10" fontSize="11" fill="var(--ink-2)" className="mono">{r.word}</text>
        <rect x="130" y="2" width={(r.hi - r.lo) * 220} height="10" rx="3" transform={`translate(${r.lo*220} 0)`} fill="var(--gold)" opacity=".6"/>
        <text x={130 + r.lo*220 + (r.hi-r.lo)*220/2} y="20" textAnchor="middle" fontSize="9" fill="var(--ink-3)" className="mono">{Math.round(r.lo*100)}–{Math.round(r.hi*100)}%</text>
      </g>
    ))}
  </svg>
);

const X_Compounding = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:300 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">INDEPENDENT vs CORRELATED</text>
    {/* independent: 3 separate sources */}
    <g transform="translate(40 80)">
      <circle r="22" fill="var(--signal-soft)" stroke="var(--signal)"/>
      <text y="4" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">src 1</text>
    </g>
    <g transform="translate(95 80)">
      <circle r="22" fill="var(--signal-soft)" stroke="var(--signal)"/>
      <text y="4" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">src 2</text>
    </g>
    <g transform="translate(150 80)">
      <circle r="22" fill="var(--signal-soft)" stroke="var(--signal)"/>
      <text y="4" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">src 3</text>
    </g>
    <text x="95" y="50" textAnchor="middle" fontSize="10" fill="var(--good)" className="mono">3 independent</text>
    {/* correlated: 3 sources all reading the same article */}
    <g transform="translate(245 50)">
      <rect x="-30" y="0" width="60" height="22" rx="3" fill="var(--noise)"/>
      <text x="0" y="14" textAnchor="middle" fontSize="9" fill="#fff" className="mono">one source</text>
    </g>
    <line x1="220" y1="72" x2="220" y2="80" stroke="var(--noise-2)"/>
    <line x1="245" y1="72" x2="245" y2="80" stroke="var(--noise-2)"/>
    <line x1="270" y1="72" x2="270" y2="80" stroke="var(--noise-2)"/>
    <circle cx="220" cy="100" r="18" fill="var(--noise-soft)" stroke="var(--noise-2)"/>
    <circle cx="245" cy="100" r="18" fill="var(--noise-soft)" stroke="var(--noise-2)"/>
    <circle cx="270" cy="100" r="18" fill="var(--noise-soft)" stroke="var(--noise-2)"/>
    <text x="245" y="142" textAnchor="middle" fontSize="10" fill="var(--noise-2)" className="mono">all echoing</text>
    <text x="180" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">left = real evidence · right = the illusion of it</text>
  </svg>
);

// ─── New modules content ────────────────────────────────────────────────
const LibraryModules = {
  // STATISTICAL FOUNDATIONS
  regression: {
    pillar:'Statistical foundations',
    title:'Regression to the Mean',
    intro:'Extreme outcomes are usually followed by less extreme ones — even when nothing changed. This single idea explains so much that looks like skill, decline, or magic.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'The Sports Illustrated curse', illustration:<X_Streak/>, body:<>Athletes on SI's cover often slump the next season. Reporters called it "the curse." The real explanation: they got the cover <em>because</em> they were on an extreme hot streak. By definition, the next season's performance is closer to their true average. No curse — just regression.</> },
      { title:'It\'s everywhere', illustration:<X_OutsideInside/>, body:<>Top-quintile sales reps usually have a worse second quarter. Best students on the first exam don't all repeat. New-employee performance reverts. Whenever you select on an extreme, expect the next observation to look less extreme — even with no real change.</>, takeaway:'Selecting on extremes guarantees regression on the next measurement.' },
      { title:'Why teaching reward feels backwards', illustration:<X_Streak/>, body:<>A flight instructor once told Kahneman: "Praising students makes them worse, scolding makes them better." Almost certainly false causally. After an unusually good flight, the next one is usually worse — and after an unusually bad one, better. The praise didn't matter.</> },
      { title:'The fix', illustration:<X_OutsideInside/>, body:<>Judge skill from a stable average, not from a single peak or trough. When you see an extreme result, assume the next observation will be closer to the long-run mean. This is true everywhere from sports to medicine to hiring.</>, takeaway:'Extreme observations regress. Plan for it.' },
    ],
  },

  largeNumbers: {
    pillar:'Statistical foundations',
    title:'Law of Large Numbers',
    intro:'Random outcomes converge to their expected value — but only with enough samples. Small samples lie wildly. This is why casinos always win and why polls need 1,000 respondents, not 100.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'Ten flips vs. ten thousand', illustration:<X_Converge/>, body:<>Flip a fair coin 10 times and "70% heads" is unremarkable. Flip 10,000 times and you'd be near 50%. The fraction converges as the sample grows. The wiggle never disappears — it just gets smaller proportional to √n.</>, takeaway:'Noise shrinks like √n. Doubling the sample halves the relative error.' },
      { title:'The casino edge', illustration:<X_Converge/>, body:<>A roulette wheel pays you 35:1 on a single number, but the true odds are 37:1. The 2-slot edge feels tiny on one spin. After 10,000 spins, the casino has crushed you. The math doesn't care about your hot streak; it cares about your sample size.</> },
      { title:'Where small samples lie', illustration:<X_Streak/>, body:<>A new product launches and the first 12 reviews are 5 stars. Does it mean it's a great product? No — it means twelve happy reviewers. The bayesian update with that few samples barely moves you from your prior. Wait for hundreds.</> },
      { title:'The fix', illustration:<X_OutsideInside/>, body:<>Before believing a rate or fraction, ask: "How many samples?" Under 30, treat it as a hint. Under 100, treat it as a clue. Under 1,000, trust it cautiously. The world's most repeated forecasting mistake is over-trusting tiny samples.</>, takeaway:'Sample size first. Conclusion second.' },
    ],
  },

  selectionEffects: {
    pillar:'Statistical foundations',
    title:'Selection Effects',
    intro:'Sometimes the data you see is filtered before it reaches you. The filter changes everything — and people forget to look for it.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'Wald and the bombers', illustration:<X_Plane/>, body:<>WWII: the military wanted to armor the parts of bombers most often hit by enemy fire. Abraham Wald asked: where are the holes on planes that <em>didn't return?</em> Armor the engines and cockpit — the parts with <em>no</em> holes in the data, because planes hit there crashed.</>, takeaway:'The data you see is only the survivors.' },
      { title:'The successful-CEO study', illustration:<X_Iceberg/>, body:<>"Top CEOs all wake up at 5am." Maybe. But how many CEOs woke up at 5am and failed? The study didn't sample them. Survivorship bias makes the visible cases look causal when they're just selected.</> },
      { title:'Restaurant reviews', illustration:<X_Iceberg/>, body:<>Restaurant Yelp scores cluster around 4 stars. Why? Because awful restaurants close before they accumulate enough reviews to drag down the visible distribution. The data is filtered by survival.</> },
      { title:'The fix', illustration:<X_Iceberg/>, body:<>Whenever you see surprising regularity in a dataset, ask: "What got filtered out before I saw this?" The answer is often the most important variable in the study.</>, takeaway:'Always count the missing.' },
    ],
  },

  referenceClasses: {
    pillar:'Statistical foundations',
    title:'Reference Classes',
    intro:'The outside view says: forget the details of your specific case. How did similar past cases play out? Almost always, the reference class beats the gut.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'The planning fallacy', illustration:<X_OutsideInside/>, body:<>Kahneman and his team estimated their textbook would take 18 months. The reference class for textbooks of that scope: 7–10 years. They finished in 8. The "inside view" — looking at the specifics of <em>your</em> project — almost always underestimates.</>, takeaway:'Inside view feels accurate. Outside view actually is.' },
      { title:'Inside vs outside view', illustration:<X_OutsideInside/>, body:<>Inside view: "My project is special because we have great people and a clear plan." Outside view: "Of the last 50 projects of this scope, what fraction shipped on time?" Almost universally, outside view is more accurate.</> },
      { title:'Picking the right reference class', illustration:<X_OutsideInside/>, body:<>The reference class should be a real, observable set of past cases that genuinely resemble yours. "All startups" is too broad. "Series-A SaaS startups with 10 customers and $1M ARR" is useful. Narrow enough to be specific, broad enough to have data.</> },
      { title:'Resist uniqueness', illustration:<X_OutsideInside/>, body:<>You feel unique because you're inside the case. The reference class doesn't care. When in doubt, trust the data on people just like you.</>, takeaway:'Outside view first; inside view only to adjust at the margin.' },
    ],
  },

  stationarity: {
    pillar:'Statistical foundations',
    title:'Stationarity & Regime Change',
    intro:'Forecasts using the past assume the world keeps acting the same. Sometimes it doesn\'t — and when the rules change, your model breaks.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'When models break', illustration:<X_RegimeShift/>, body:<>The 2008 mortgage crisis broke risk models that assumed housing prices were independent and normally distributed. COVID broke supply-chain models that assumed steady flows. Whenever the underlying system changes, historical data becomes misleading.</> },
      { title:'Spotting a shift', illustration:<X_RegimeShift/>, body:<>Look for: structural breaks in time series, sudden persistent shifts in variance, new constraints that didn't exist before. If the mean clearly moved and stayed moved, you're in a new regime.</>, takeaway:'Persistent shift = new regime. Re-fit your model.' },
      { title:'100-year storms', illustration:<X_FatTail/>, body:<>If "100-year storms" hit twice in a decade, you're not unlucky — your reference period was wrong. Either the world changed, or your 100-year estimate was always wrong. Either way, your model needs new data.</> },
      { title:'The fix', illustration:<X_RegimeShift/>, body:<>Build in tail uncertainty for "the world changed." Re-estimate your model on recent data. If past and present give wildly different answers, weight the present more.</>, takeaway:'Old data is only useful if the system that produced it still exists.' },
    ],
  },

  // COGNITIVE BIASES
  anchoring: {
    pillar:'Cognitive biases',
    title:'Anchoring',
    intro:'A number you see before estimating something pulls your answer toward it — even if the number is obviously irrelevant.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'Tversky and Kahneman\'s wheel', illustration:<X_Wheel/>, body:<>People watched a rigged wheel land on a random number, then estimated the % of African countries in the UN. People who saw 10 guessed ~25%. People who saw 65 guessed ~45%. The wheel had nothing to do with the question.</>, takeaway:'Even obviously-random anchors pull your estimate.' },
      { title:'Negotiation anchors', illustration:<X_Wheel/>, body:<>The first number put on the table in salary negotiation, real-estate offer, or used-car bidding sets the playing field. Counter-offers cluster around it. This is why experienced negotiators try to anchor first.</> },
      { title:'Why we anchor', illustration:<X_Wheel/>, body:<>Anchoring is a shortcut. The brain starts from the available number and adjusts. The adjustment is almost always insufficient. Even when you're aware of the anchor, knowing it doesn't stop the pull.</> },
      { title:'The defense', illustration:<X_Wheel/>, body:<>Generate your own estimate <em>before</em> seeing any reference number. If you can't, write down your reasoning explicitly so the reasoning anchors you, not the suggested number.</>, takeaway:'Anchor on your own logic, not on whatever number you saw first.' },
    ],
  },

  availability: {
    pillar:'Cognitive biases',
    title:'Availability Heuristic',
    intro:'We mistake easy-to-recall for common. Things we can vividly imagine feel more likely than things we can\'t — regardless of the actual base rate.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'Plane crashes vs car crashes', illustration:<X_LocalNews/>, body:<>People fear flying more than driving, but driving kills about 100× more Americans per year. Plane crashes are vivid, broadcast nationally, and stick in memory. Car crashes are routine and forgotten. Availability wins over frequency.</> },
      { title:'Shark attacks vs. heart disease', illustration:<X_LocalNews/>, body:<>Roughly 4 Americans die of shark attacks per year. Roughly 700,000 die of heart disease. But shark attacks dominate beach-season news coverage. The brain confuses news frequency with real-world frequency.</>, takeaway:'News frequency ≠ event frequency.' },
      { title:'Local news distortion', illustration:<X_LocalNews/>, body:<>The more vivid the death, the more likely you are to fear it. Reporters know this. So do politicians. Whenever a category dominates the news, its perceived frequency soars far above its actual frequency.</> },
      { title:'The defense', illustration:<X_LocalNews/>, body:<>Whenever something feels common, ask: "What's the actual rate?" Look up the number. Almost always, the vivid risks are smaller than they feel, and the boring ones are bigger.</>, takeaway:'Look up the rate. Trust math over imagination.' },
    ],
  },

  confirmation: {
    pillar:'Cognitive biases',
    title:'Confirmation Bias',
    intro:'We seek, remember, and re-tell evidence that fits what we already believe. Disconfirming evidence slides past or gets explained away.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'The 2-4-6 task', illustration:<X_FilterSticks/>, body:<>Wason gave subjects "2-4-6" and asked them to find the rule. People tested 8-10-12, 14-16-18 — all confirming "even numbers ascending by 2." Few tested 1-2-3 (which would have <em>disconfirmed</em>). The actual rule was just "any ascending sequence."</>, takeaway:'You learn more from a falsifying test than from confirming ones.' },
      { title:'Unfalsifiable beliefs', illustration:<X_FilterSticks/>, body:<>A belief becomes unfalsifiable when every piece of evidence can be re-interpreted to support it. Astrology, conspiracy theories, and politically motivated reasoning all share this structure. If nothing could change your mind, your belief isn't a forecast — it's a faith.</> },
      { title:'Echo chambers', illustration:<X_FilterSticks/>, body:<>Algorithms amplify confirmation bias by curating you a feed of what you already agree with. The more "evidence" you see, the more confident you feel — and the more wrong you might be.</> },
      { title:'The defense', illustration:<X_FilterSticks/>, body:<>Ask: "What would change my mind?" Write down the specific observation that would falsify your belief. Then go look. If you can't think of a falsifier, your belief isn't a forecast.</>, takeaway:'Always design the test that would prove yourself wrong.' },
    ],
  },

  hindsight: {
    pillar:'Cognitive biases',
    title:'Hindsight Bias',
    intro:'After we know the outcome, we tell ourselves we always saw it coming. This corrupts every after-the-fact decision review.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'"Obvious in retrospect"', illustration:<X_Tree/>, body:<>2008 financial crisis. Brexit. GameStop. Each time, post-mortems read "the signs were everywhere." Yet weeks before, almost no public forecaster called it. Hindsight rewrites the past so the outcome looks predictable.</> },
      { title:'Distorted memory', illustration:<X_Tree/>, body:<>Studies show people who predict 60% beforehand recall, after the event, that they predicted 80%. We remember being more confident than we were. This makes us worse at learning from forecasts.</>, takeaway:'Memory bends toward the outcome.' },
      { title:'Outcome bias', illustration:<X_Tree/>, body:<>A bad outcome doesn't mean a bad decision, and a good outcome doesn't mean a good one. A 90% bet that fails is still a 90% bet. Judging the decision by the outcome is the resulting fallacy.</> },
      { title:'The fix', illustration:<X_Tree/>, body:<>Record your prediction in writing before the outcome. Date it. Read it again after. The gap between what you actually said and what you remember saying is hindsight bias, calibrated.</>, takeaway:'Write predictions down. Hindsight loses its grip.' },
    ],
  },

  narrative: {
    pillar:'Cognitive biases',
    title:'Narrative Fallacy',
    intro:'The brain craves stories. It can build a coherent causal story from any sequence of events — true or random. Good stories make noise feel like signal.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'"Up on inflation fears"', illustration:<X_FilterSticks/>, body:<>Every day, financial reporters explain why the market moved up or down. The explanation is always available, always coherent, almost always retrofit. If the market had moved the opposite direction, a different story would explain that just as easily.</> },
      { title:'Coincidence becomes plot', illustration:<X_FilterSticks/>, body:<>Two unrelated events happen close in time. The brain finds a causal thread. The thread feels real. We forget how many other unrelated event-pairs happened that day with no story made about them.</>, takeaway:'Stories are cheap. Truth is dense.' },
      { title:'Survivorship + narrative', illustration:<X_Iceberg/>, body:<>"Steve Jobs ate fruit. He built Apple. Therefore, eat fruit." This is narrative + survivorship combined. Thousands of CEOs ate fruit and failed. The story about Jobs only gets told because Apple worked.</> },
      { title:'The fix', illustration:<X_FilterSticks/>, body:<>Whenever a story explains the past perfectly, ask: "Would this story have predicted the outcome before it happened?" If not, it's narrative, not signal.</>, takeaway:'Test stories prospectively, not retrospectively.' },
    ],
  },

  framing: {
    pillar:'Cognitive biases',
    title:'Framing Effects',
    intro:'Identical information presented differently produces different decisions. The frame chooses the answer.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'Saved vs. lost', illustration:<X_Frames/>, body:<>"If we adopt Plan A, 200 people will be saved." Or: "If we adopt Plan A, 400 people will die." Same plan. Same numbers. People consistently prefer Plan A under the first frame and reject it under the second. This is the Asian Disease problem.</> },
      { title:'Effective vs. failure rate', illustration:<X_Frames/>, body:<>A 90% effective treatment feels much better than a 10% failure rate. Same number, different frame. Marketers, doctors, and politicians choose frames to nudge decisions in their preferred direction.</>, takeaway:'A frame is a soft persuasion. Notice it.' },
      { title:'Loss aversion makes framing potent', illustration:<X_Frames/>, body:<>People dislike losses about 2× more than they like equivalent gains. Frames that emphasize losses produce more risk-averse decisions; frames that emphasize gains produce more risk-seeking ones. The same person, the same facts, can decide either way.</> },
      { title:'The defense', illustration:<X_Frames/>, body:<>Whenever you're told a number, re-frame it the other way. "X% effective" → "(100-X)% failure." Do the math both directions. If your conclusion flips, the frame was doing your thinking.</>, takeaway:'Always re-frame the question yourself.' },
    ],
  },

  // PROBABILITY
  independence: {
    pillar:'Probability',
    title:'Independence vs Correlation',
    intro:'Three friends who all read the same article aren\'t three independent opinions. Counting them as three pieces of evidence is a classic forecasting failure.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'Three coin flips vs three echoes', illustration:<X_Compounding/>, body:<>Three independent coin flips give you real information about the underlying coin. Three friends all repeating the same news article give you one piece of information — restated three times. Both can look identical from the outside.</> },
      { title:'Why polls cluster', illustration:<X_Compounding/>, body:<>Multiple polls released the same week often agree closely. It's not because the polls are accurate — it's because they're correlated. Same news cycle, same likely voters, similar methodologies. The cluster is one signal, not many.</>, takeaway:'Many polls in a cluster ≈ one poll repeated.' },
      { title:'Counting unique evidence', illustration:<X_Compounding/>, body:<>Before treating evidence as independent, trace it back. If multiple "sources" share an origin, count them as one. Bayesian updates on correlated evidence dramatically overstate certainty.</> },
      { title:'The defense', illustration:<X_Compounding/>, body:<>Ask of every piece of evidence: "Could this have come from the same source as the last piece?" If yes, weight it down. Independent corroboration is rare and precious.</>, takeaway:'Trace the source before counting the vote.' },
    ],
  },

  conjunction: {
    pillar:'Probability',
    title:'Conjunction Fallacy',
    intro:'People often judge specific scenarios as more likely than their parts. "Linda is a bank teller AND an activist" feels more likely than just "Linda is a bank teller." Mathematically, this is impossible.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'Linda the bank teller', illustration:<X_VennLinda/>, body:<>Tversky and Kahneman: Linda is described as a young, politically active philosophy major. Subjects rated "bank teller and activist" more likely than just "bank teller." But the first is a strict subset of the second — it can only be less likely.</> },
      { title:'Why we fall for it', illustration:<X_VennLinda/>, body:<>Specific stories feel more real. "Linda is a bank teller AND an activist" paints a complete picture. "Linda is just a bank teller" feels boring. The brain rates story-completeness as plausibility.</>, takeaway:'Specific stories feel more likely. The math says they\'re less.' },
      { title:'The math', illustration:<X_VennLinda/>, body:<>P(A and B) = P(A) × P(B|A). Since P(B|A) ≤ 1, the conjunction probability is always ≤ P(A). Adding details can never raise the probability — only the believability.</> },
      { title:'The fix', illustration:<X_VennLinda/>, body:<>Count the "AND"s in a claim. Each one is a chance for the probability to shrink. The five-detail story is far less likely than the one-detail story, even if it feels more compelling.</>, takeaway:'Each AND multiplies the probability down.' },
    ],
  },

  conditional: {
    pillar:'Probability',
    title:'Conditional Probability',
    intro:'P(A given B) and P(B given A) are not the same. Confusing them is called the prosecutor\'s fallacy — and it shows up in courtrooms, hospitals, and headlines.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'The trap', illustration:<X_TwoWay/>, body:<>P(positive test | sick) might be 99%. P(sick | positive test) might be 17%. They look similar but they're entirely different questions. The first is "If I'm sick, what's the chance the test flags me?" The second is "If the test flags me, what's the chance I'm sick?"</> },
      { title:'The prosecutor\'s fallacy', illustration:<X_TwoWay/>, body:<>"The DNA match is 1-in-a-million; therefore, there's a 1-in-a-million chance the defendant is innocent." Wrong. That's P(match | innocent), not P(innocent | match). In a city of millions, expected innocent matches could be larger than 1.</>, takeaway:'P(A|B) and P(B|A) are not the same.' },
      { title:'The 2×2 table', illustration:<X_TwoWay/>, body:<>The cleanest way to think about it: draw a 2×2 table. Sick / Well across the top, Positive / Negative on the side. Fill in counts, then read off whatever conditional you need. The math becomes mechanical.</> },
      { title:'The defense', illustration:<X_TwoWay/>, body:<>When you hear "X% of Ys are Zs," ask: "But what % of Zs are Ys?" Both questions have answers. Confusing them is the most common Bayesian mistake.</>, takeaway:'Always count both directions.' },
    ],
  },

  varianceEV: {
    pillar:'Probability',
    title:'Variance vs. Expected Value',
    intro:'A +EV bet on average can still wipe you out if the variance is too high and you can\'t survive the drawdowns.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'The St. Petersburg paradox', illustration:<X_FatTail/>, body:<>A coin-flip game with infinite expected value: keep flipping until tails. Heads doubles your prize. The EV is infinite, but almost everyone wins under $10. Variance dominates the experience even when the average is unbounded.</> },
      { title:'Risk of ruin', illustration:<X_Funnel/>, body:<>Doubling-down strategies can have positive EV but go broke. A 60/40 bet with a 50% wager produces a 30% chance of bankruptcy over enough trials. Average and survival are different questions.</>, takeaway:'A good average doesn\'t mean you\'ll survive to see it.' },
      { title:'Why insurance exists', illustration:<X_FatTail/>, body:<>Insurance has negative EV for the buyer (otherwise the insurer would lose money). People still buy it because the variance of "no insurance + house burns down" is catastrophic. Reducing variance is itself worth money.</> },
      { title:'The fix', illustration:<X_FatTail/>, body:<>For long-term bets, size your wagers to control drawdowns. The Kelly criterion gives a formula. As a rough rule: when in doubt, bet much less than you think you should.</>, takeaway:'Bet small enough to survive the bad streaks.' },
    ],
  },

  compounding: {
    pillar:'Probability',
    title:'Compounding Probabilities',
    intro:'Five steps that each succeed 80% of the time produce only a 33% chance of all five working. Sequential probability is brutal.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'The math', illustration:<X_Funnel/>, body:<>If each of 5 independent stages has 80% success, the joint probability is 0.8⁵ = 33%. Add a 6th stage, drop to 26%. Each additional dependency cuts your chance of completing the whole.</>, takeaway:'Multiply, don\'t average, when chaining steps.' },
      { title:'Software project schedules', illustration:<X_Funnel/>, body:<>Every dev estimates each task at 80% confident. Stack 5 tasks. The project is then ~33% likely to ship on time. This is why software always ships late.</> },
      { title:'Why startups die', illustration:<X_Funnel/>, body:<>Find a market (50%), build a product (50%), get distribution (50%), retain customers (50%), and have favorable timing (50%). That's a 3% chance even with generous 50% odds per step. Startups die because they had to do everything right.</> },
      { title:'The fix', illustration:<X_Funnel/>, body:<>Map the steps. Estimate each. Multiply. The number you get is usually way smaller than your intuition. Then either remove steps or buy yourself more attempts at the ones with the worst odds.</>, takeaway:'The chain is only as strong as the product of its links.' },
    ],
  },

  blackSwans: {
    pillar:'Probability',
    title:'Black Swans & Fat Tails',
    intro:'The events that move the world most are rare by definition. They\'re not in your data. They\'re not in your model. They will still happen — and they will dominate the outcome.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'Taleb\'s turkey', illustration:<X_FatTail/>, body:<>A turkey is fed every morning for 1,000 days. Its confidence in "I will be fed tomorrow" rises monotonically. On day 1,001, just before Thanksgiving, the trend breaks catastrophically. The data never predicted the regime.</>, takeaway:'A model fit on the past can\'t predict the regime change that ends it.' },
      { title:'Fat tails', illustration:<X_FatTail/>, body:<>Many real-world distributions are not normal — they have "fat tails" with more extreme events than a Gaussian would predict. Financial returns, earthquake magnitudes, social-media virality. Normal-distribution models systematically underestimate these tails.</> },
      { title:'When tails dominate', illustration:<X_FatTail/>, body:<>In fat-tailed systems, most of the action lives in the tails. A few extreme outliers can account for the majority of total impact. Average behavior is misleading.</> },
      { title:'The defense', illustration:<X_FatTail/>, body:<>Stress-test for tail events. Reserve more buffer than the average forecast suggests. When something feels "impossible," remember the turkey.</>, takeaway:'Plan for tails. Don\'t treat impossible as zero.' },
    ],
  },

  // PRACTICE
  superforecasters: {
    pillar:'Forecasting practice',
    title:'Superforecaster Habits',
    intro:'Tetlock\'s "Good Judgment" research found that top forecasters share specific habits — habits anyone can learn.',
    accent:'var(--leaf-soft)',
    frames:[
      { title:'Small frequent updates', illustration:<X_Converge/>, body:<>Top forecasters update often, in small increments. They don\'t wait for a big revision; they nudge their probability by a few points whenever new evidence comes in. Many small updates beat occasional dramatic ones.</> },
      { title:'Fox > Hedgehog', illustration:<X_AggregateDots/>, body:<>Hedgehogs know "one big thing" and apply it to everything. Foxes know many small things and synthesize them. Foxes consistently outperform hedgehogs in forecasting tournaments. Use many lenses.</>, takeaway:'Many small models beat one big theory.' },
      { title:'Numbers, not words', illustration:<X_Confidence/>, body:<>"Likely" hides a range from 50% to 90%. Superforecasters force themselves to use numbers: 73%, not "pretty likely." The precision exposes both their calibration and their disagreements.</> },
      { title:'Triangulate sources', illustration:<X_AggregateDots/>, body:<>The best forecasters consult multiple genuinely independent sources, average them with care for correlation, and re-update when sources diverge. Diversity in inputs is a forecaster\'s most powerful tool.</>, takeaway:'Be probabilistic, frequent, and diverse in your inputs.' },
    ],
  },

  aggregation: {
    pillar:'Forecasting practice',
    title:'Aggregation Methods',
    intro:'How you combine forecasts matters as much as the forecasts themselves. Different aggregation rules give meaningfully different answers.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'Mean vs. median', illustration:<X_AggregateDots/>, body:<>The mean is pulled by outliers. The median ignores them. For most everyday aggregation (jellybean guesses, polls, expert estimates), the median is the safer default — it shrugs off a single wildly-off guess.</>, takeaway:'When outliers are likely, prefer the median.' },
      { title:'Trimmed mean', illustration:<X_AggregateDots/>, body:<>A compromise: drop the highest and lowest X% of values, then average the rest. Combines the stability of the median with some of the information of the mean. Common in scientific competitions and Olympic judging.</> },
      { title:'Weighted aggregation', illustration:<X_AggregateDots/>, body:<>When some forecasters have track records, weight them by past calibration. But beware: weights based on small samples are themselves noisy. Equal weighting often beats clever weighting in practice.</> },
      { title:'When to weight', illustration:<X_AggregateDots/>, body:<>If you have long, reliable track records — weight. If you don't — average. Most amateur aggregators over-weight what they "feel" is the smartest source.</>, takeaway:'Average broadly. Weight only when data justifies it.' },
    ],
  },

  communicate: {
    pillar:'Forecasting practice',
    title:'Communicating Uncertainty',
    intro:'"Probably" can mean anything from 50% to 90%. Vague language helps no one. Use numbers — or, at the very least, anchor your words to numbers.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'Words are slippery', illustration:<X_Confidence/>, body:<>Sherman Kent at the CIA showed that analysts using "probably" meant anywhere from 25% to 90%. Decision-makers heard their own interpretation. Crucial misunderstandings followed. Same word, very different meanings.</> },
      { title:'The IPCC scale', illustration:<X_Confidence/>, body:<>The IPCC published guidance: "virtually certain" = 99-100%, "very likely" = 90-100%, "likely" = 66-100%, "about as likely as not" = 33-66%. Any large organization that needs to discuss uncertainty needs a calibrated scale like this.</>, takeaway:'Pick a scale. Make everyone use it.' },
      { title:'Hurricane cones', illustration:<X_Confidence/>, body:<>The NHC's "cone of uncertainty" is a brilliant communication tool: it shows the probable path AND its uncertainty visually. People underestimate the cone, but at least the cone is honest. Most forecasts hide their uncertainty entirely.</> },
      { title:'How to do it', illustration:<X_Confidence/>, body:<>Use percentages or odds. Show ranges, not points. If you must use words, attach numbers to them ("likely (>66%)"). Better to commit to a precise wrong number than to a vague right word — at least the number is checkable.</>, takeaway:'Numbers are accountable. Words aren\'t.' },
    ],
  },

  decisionOutcome: {
    pillar:'Forecasting practice',
    title:'Decision vs. Outcome',
    intro:'A great decision can produce a terrible outcome. A terrible decision can produce a great outcome. Process and result are separate axes — judge both.',
    accent:'var(--leaf-soft)',
    frames:[
      { title:'Bad beats', illustration:<X_Tree/>, body:<>A poker player goes all-in with a 92% chance to win. They lose. Was it a bad decision? No. The decision was correct; the outcome was the 8% case. Confusing the two is "resulting" — judging decisions by outcomes.</> },
      { title:'And good beats', illustration:<X_Tree/>, body:<>A driver runs a red light and gets home safely. Good outcome. Bad decision. Most of the time the bad decision doesn't produce a bad outcome — but the decision is still bad, because the expected outcome is worse than the alternative.</>, takeaway:'Outcomes are noisy. Decisions are what you control.' },
      { title:'Why this matters', illustration:<X_Tree/>, body:<>Cultures that only reward good outcomes (regardless of decisions) train their people to take risky bets and get lucky. Cultures that reward good processes (with good or bad outcomes) train their people to make good decisions every time.</> },
      { title:'The fix: decision journal', illustration:<X_Tree/>, body:<>Before each big decision, write down: the probabilities you assigned, the expected outcomes, and your reasoning. Review the journal months later. You'll learn whether your process is calibrated — independent of whether you got lucky.</>, takeaway:'Audit decisions, not outcomes.' },
    ],
  },
};

// Pillar grouping for the Library view
const LibraryPillars = [
  { id:'foundations', label:'Statistical foundations', color:'var(--signal)', modules:['regression','largeNumbers','selectionEffects','referenceClasses','stationarity'] },
  { id:'biases',      label:'Cognitive biases',        color:'var(--noise-2)', modules:['anchoring','availability','confirmation','hindsight','narrative','framing'] },
  { id:'probability', label:'Probability',             color:'var(--gold)',    modules:['independence','conjunction','conditional','varianceEV','compounding','blackSwans'] },
  { id:'practice',    label:'Forecasting practice',    color:'var(--leaf)',    modules:['superforecasters','aggregation','communicate','decisionOutcome'] },
];

Object.assign(window, { LibraryModules, LibraryPillars });
