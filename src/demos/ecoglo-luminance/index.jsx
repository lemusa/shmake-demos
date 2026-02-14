import { useState, useEffect, useRef, Fragment } from "react";

// ─── TeaBreak Design Tokens ───
const T = {
  primary900:'#1a2520', primary800:'#2c3e37', primary700:'#3d5249',
  primary600:'#4a5f55', primary500:'#5a7268', primary400:'#7c9885',
  primary300:'#8ba896', primary200:'#a8bfb0', primary100:'#b8c5bc', primary50:'#e8eeea',
  success:'#4a9c6d', warning:'#c9a227', danger:'#b85450', info:'#5a8fb8',
  n9:'#1a1a1a', n8:'#2d2d2d', n7:'#404040', n6:'#525252', n5:'#737373',
  n4:'#a3a3a3', n3:'#d4d4d4', n2:'#e5e5e5', n1:'#f5f5f5', n0:'#fafafa',
  bg:'#f7f9f8', card:'#ffffff',
  sh:'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  r:'6px', rl:'8px', rxl:'12px',
  f:"'IBM Plex Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  fm:"'IBM Plex Mono',monospace",
};

/* ═══════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════ */
const Badge = ({children,color=T.primary600,bg})=>(
  <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,color,background:bg||`${color}14`,letterSpacing:'0.02em',whiteSpace:'nowrap'}}>{children}</span>
);
const StatusBadge = ({status})=>{
  const m={pass:{c:'#fff',b:T.success,l:'Pass'},warning:{c:'#fff',b:T.warning,l:'Warning'},fail:{c:'#fff',b:T.danger,l:'Fail'},pending:{c:T.n6,b:T.n2,l:'Pending'},scheduled:{c:T.info,b:`${T.info}18`,l:'Scheduled'},conditioning:{c:'#7c5cbf',b:'#7c5cbf18',l:'Conditioning'},ready:{c:T.success,b:`${T.success}18`,l:'Ready'},testing:{c:T.warning,b:`${T.warning}18`,l:'In Progress'},completed:{c:T.primary600,b:T.primary50,l:'Completed'},draft:{c:T.n5,b:T.n1,l:'Draft'},todo:{c:T.warning,b:`${T.warning}15`,l:'TODO'},confirmed:{c:T.success,b:`${T.success}15`,l:'Confirmed'}};
  const s=m[status]||m.pending;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:600,color:s.c,background:s.b,letterSpacing:'0.02em'}}>{s.l}</span>;
};
const Card = ({children,style})=><div style={{background:T.card,borderRadius:T.rl,border:`1px solid ${T.n2}`,boxShadow:T.sh,...style}}>{children}</div>;
const CardH = ({title,subtitle,action,icon})=>(
  <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.n1}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {icon&&<span style={{color:T.primary500,fontSize:18}}>{icon}</span>}
      <div><div style={{fontSize:14,fontWeight:600,color:T.n9}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:T.n5,marginTop:2}}>{subtitle}</div>}</div>
    </div>{action}
  </div>
);
const Btn = ({children,v='primary',sz='sm',onClick,disabled,style:s})=>{
  const base={display:'inline-flex',alignItems:'center',gap:6,border:'none',borderRadius:T.r,cursor:disabled?'not-allowed':'pointer',fontFamily:T.f,fontWeight:500,transition:'all 0.15s',whiteSpace:'nowrap',opacity:disabled?0.5:1};
  const szs={sm:{padding:'6px 12px',fontSize:12},md:{padding:'8px 16px',fontSize:13},lg:{padding:'10px 20px',fontSize:14}};
  const vs={primary:{background:T.primary600,color:'#fff'},secondary:{background:T.n1,color:T.n7,border:`1px solid ${T.n2}`},ghost:{background:'transparent',color:T.n6},success:{background:T.success,color:'#fff'},demo:{background:'#6366f1',color:'#fff'}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...szs[sz],...vs[v],...s}} disabled={disabled}>{children}</button>;
};
const InfoBar = ({type='info',children})=>{
  const c={info:T.info,warning:T.warning,success:T.success};
  return <div style={{padding:'12px 16px',background:`${c[type]}08`,border:`1px solid ${c[type]}25`,borderRadius:T.r,display:'flex',alignItems:'flex-start',gap:8,fontSize:12,color:T.n6,lineHeight:1.5}}><span style={{fontSize:14,flexShrink:0}}>{type==='info'?'💡':type==='warning'?'⚙':'✓'}</span><div>{children}</div></div>;
};
const StatCard = ({label,value,sub,icon,color=T.primary600})=>(
  <Card style={{padding:'16px 20px',flex:1,minWidth:140}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
      <div>
        <div style={{fontSize:11,fontWeight:500,color:T.n5,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{label}</div>
        <div style={{fontSize:28,fontWeight:700,color:T.n9,lineHeight:1}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:T.n5,marginTop:4}}>{sub}</div>}
      </div>
      <div style={{width:36,height:36,borderRadius:8,background:`${color}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{icon}</div>
    </div>
  </Card>
);
const Table = ({columns,rows,onRowClick})=>(
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
      <thead><tr>{columns.map((c,i)=>(
        <th key={i} style={{padding:'10px 14px',textAlign:c.align||'left',fontSize:11,fontWeight:600,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`1px solid ${T.n2}`,whiteSpace:'nowrap',background:T.n0}}>{c.label}</th>
      ))}</tr></thead>
      <tbody>{rows.map((row,ri)=>(
        <tr key={ri} onClick={()=>onRowClick?.(row)} style={{cursor:onRowClick?'pointer':'default',transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.n0} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          {columns.map((c,ci)=>(
            <td key={ci} style={{padding:'10px 14px',borderBottom:`1px solid ${T.n1}`,color:T.n8,whiteSpace:'nowrap',textAlign:c.align||'left',fontFamily:c.mono?T.fm:T.f,fontSize:c.mono?12:13}}>{c.render?c.render(row):row[c.key]}</td>
          ))}
        </tr>
      ))}</tbody>
    </table>
  </div>
);
const TabBar = ({tabs,active,onSelect})=>(
  <div style={{display:'flex',gap:0,borderBottom:`2px solid ${T.n1}`,marginBottom:20}}>
    {tabs.map(t=>(
      <button key={t.id} onClick={()=>onSelect(t.id)} style={{padding:'10px 18px',fontSize:13,fontWeight:active===t.id?600:400,color:active===t.id?T.primary600:T.n5,background:'none',border:'none',borderBottom:active===t.id?`2px solid ${T.primary600}`:'2px solid transparent',marginBottom:-2,cursor:'pointer',fontFamily:T.f,display:'flex',alignItems:'center',gap:6}}>
        {t.icon&&<span style={{fontSize:15}}>{t.icon}</span>}{t.label}
        {t.count!==undefined&&<span style={{fontSize:10,fontWeight:600,padding:'1px 6px',borderRadius:8,background:active===t.id?T.primary50:T.n1,color:active===t.id?T.primary600:T.n5}}>{t.count}</span>}
      </button>
    ))}
  </div>
);
const Field = ({label,children,hint,required,style:s})=>(
  <div style={{marginBottom:14,...s}}>
    <label style={{display:'block',fontSize:12,fontWeight:500,color:T.n7,marginBottom:5}}>{label}{required&&<span style={{color:T.danger}}> *</span>}</label>
    {children}{hint&&<div style={{fontSize:11,color:T.n5,marginTop:3}}>{hint}</div>}
  </div>
);
const Input = ({value,placeholder,type='text',mono,readOnly,...p})=>(
  <input type={type} value={value} readOnly={readOnly} placeholder={placeholder} style={{width:'100%',padding:'7px 10px',border:`1px solid ${T.n2}`,borderRadius:T.r,fontSize:13,fontFamily:mono?T.fm:T.f,outline:'none',boxSizing:'border-box',background:readOnly?T.n0:'white'}} {...p}/>
);
const Select = ({value,options,placeholder})=>(
  <select value={value} readOnly style={{width:'100%',padding:'7px 10px',border:`1px solid ${T.n2}`,borderRadius:T.r,fontSize:13,fontFamily:T.f,outline:'none',background:'white',cursor:'pointer',boxSizing:'border-box'}}>
    {placeholder&&<option value="">{placeholder}</option>}
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Checkbox = ({checked,label})=>(
  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:T.n7}}>
    <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${checked?T.primary600:T.n3}`,background:checked?T.primary600:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>
      {checked&&<span style={{color:'white',fontSize:12,lineHeight:1}}>✓</span>}
    </div>{label}
  </label>
);

/* ═══════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════ */
const mockSchedule=[
  {id:1,testNum:'e1122',priority:'normal',sample:'S10, S15 ZOX 1fc charge 1hr',control:'Tx, 20140313',scheduledDate:'2026-02-11',dateIntoDark:'2026-02-06',earliestTest:'2026-02-10',status:'ready',stream:'passive'},
  {id:2,testNum:'e1123',priority:'normal',sample:'S10, S15, S20 FL6.5B 300lx 2hrs',control:'S10, S15, S20, Tx, 20140313',scheduledDate:'2026-02-11',dateIntoDark:'2026-02-06',earliestTest:'2026-02-10',status:'ready',stream:'passive',notes:'Stadiums'},
  {id:3,testNum:'e1124',priority:'normal',sample:'S10, S15, S20 FL6.5B 400lx 2hrs',control:'S10, S15, S20, Tx, 20140313',scheduledDate:'2026-02-17',dateIntoDark:'2026-02-11',earliestTest:'2026-02-15',status:'conditioning',stream:'passive'},
  {id:4,testNum:'h453',priority:'urgent',sample:'New lightguide batch (IG 6567) CM testing',control:'Frozen ZOX PLM',scheduledDate:'2026-02-12',dateIntoDark:'2026-02-07',earliestTest:'2026-02-11',status:'ready',stream:'hybrid'},
  {id:5,testNum:'e1125',priority:'low',sample:'300525SH Thermoplastic from Zoran',control:'PLC daylight sim',scheduledDate:'2026-02-24',dateIntoDark:null,earliestTest:null,status:'pending',stream:'passive'},
];
const mockResults=[
  {testNum:'e1117',date:'2026-01-27',sample:'S10, S15 ZOX 2fc/2hr',type:'Q',lamp:'FL4E',lux:21.5,time:120,m10:56.25,m30:30.5,m60:18.5,m90:12.75,status:'completed',stream:'passive'},
  {testNum:'e1120',date:'2026-02-09',sample:'Strait NZ 190126DR-5-8',type:'Ct',lamp:'FL4E',lux:25,time:1440,m10:null,m30:null,m60:null,m90:null,status:'testing',stream:'passive'},
  {testNum:'h452',date:'2026-02-04',sample:'Lightguide IG 6567 + frozen ZOX PLM',type:'Q',lamp:'SATS',lux:216,time:60,m10:1164,m30:378,m60:110,m90:78.5,status:'completed',stream:'hybrid'},
  {testNum:'h451',date:'2026-01-22',sample:'New lightguide/front&back CM test',type:'Q',lamp:'SATS',lux:216,time:60,m10:1175,m30:383,m60:111,m90:80,status:'completed',stream:'hybrid'},
  {testNum:'e1116',date:'2026-01-26',sample:'S10, S15 ZOX 1fc/1hr',type:'Q',lamp:'FL4E',lux:10.8,time:60,m10:45.5,m30:18.5,m60:12.75,m90:9,status:'completed',stream:'passive'},
];
const mockControls=[
  {name:'T-1',grade:'S10-S12',loading:440,type:'t_control',lastExposure:'2026-02-04',available:'2026-02-08',status:'available',exposureCount:48},
  {name:'T-13',grade:'S10-S12',loading:435,type:'t_control',lastExposure:'2026-01-27',available:'2026-01-31',status:'available',exposureCount:31},
  {name:'20140313-1',grade:'S20',loading:1030,type:'s20_reference',lastExposure:'2026-02-09',available:'2026-02-13',status:'conditioning',exposureCount:156},
  {name:'20140313-2',grade:'S20',loading:1030,type:'s20_reference',lastExposure:'2026-01-27',available:'2026-01-31',status:'available',exposureCount:142},
  {name:'190723DR-2-3',grade:'A20',loading:1200,type:'a20_reference',lastExposure:'2026-02-04',available:'2026-02-08',status:'available',exposureCount:67,isCM:true},
  {name:'250325PB-4',grade:'S10',loading:500,type:'zox_library',lastExposure:'2026-01-27',available:'2026-01-31',status:'available',exposureCount:12},
  {name:'250325PB-3',grade:'S15',loading:800,type:'zox_library',lastExposure:'2026-01-27',available:'2026-01-31',status:'available',exposureCount:12},
];
const mockLamps=[
  {id:'FL4E',name:'FL4E',wattage:13,tech:'Fluorescent',colourTemp:4000,lux:[100,10.8,21.5],defaultCharge:[20,60,120],installDate:'2024-03-15',age:'23 months',testsUsed:187,hoursRun:412,maxHours:2000,bulbModel:'Philips TL-D 13W/840',lastReplaced:'2024-03-15',replacements:0,status:'active',notes:'Primary batch test lamp'},
  {id:'FL6.5B',name:'FL6.5B',wattage:18,tech:'Fluorescent',colourTemp:6500,lux:[300,400,500],defaultCharge:[120,120,120],installDate:'2024-08-20',age:'18 months',testsUsed:34,hoursRun:136,maxHours:2000,bulbModel:'Osram L 18W/865',lastReplaced:'2024-08-20',replacements:0,status:'active',notes:'Stadium / high-lux testing'},
  {id:'LED4A',name:'LED4A',wattage:10,tech:'LED',colourTemp:4000,lux:[100],defaultCharge:[20],installDate:'2025-06-01',age:'8 months',testsUsed:12,hoursRun:18,maxHours:10000,bulbModel:'Cree XLamp CXA2530',lastReplaced:'2025-06-01',replacements:0,status:'active',notes:'LED comparison testing — evaluating vs FL4E'},
  {id:'FL4E-B',name:'FL4E-B',wattage:13,tech:'Fluorescent',colourTemp:4000,lux:[100,10.8],defaultCharge:[20,60],installDate:'2022-11-10',age:'39 months',testsUsed:342,hoursRun:1680,maxHours:2000,bulbModel:'Philips TL-D 13W/840',lastReplaced:'2023-09-05',replacements:1,status:'warning',notes:'Approaching end of life — 84% hours used'},
  {id:'SATS1',name:'SATS1',wattage:36,tech:'Fluorescent',colourTemp:6500,lux:[216],defaultCharge:[60],installDate:'2025-01-15',age:'13 months',testsUsed:28,hoursRun:56,maxHours:2000,bulbModel:'SATS TS5367 compliant assembly',lastReplaced:'2025-01-15',replacements:0,status:'active',notes:'Hybrid / assembled sign testing (SATS spec)'},
];
const mockEquipment=[
  {name:'Konica Minolta LS-150',type:'luminance_meter',desc:'Luminance meter — spot measurement',cal:'2026-03-20',ccf:1.05,status:'active'},
  {name:'Konica Minolta T-10A',type:'lux_meter',desc:'Illuminance meter — lamp output verification',cal:'2026-03-20',ccf:null,status:'active'},
  {name:'Stopwatch (Casio HS-3V)',type:'timer',desc:'Backup timer — dark room',cal:null,ccf:null,status:'active'},
];
const mockMethods=[
  {name:'Standard S20 Batch',code:'STD-S20',stream:'passive',lux:100,time:20,intervals:[10,30,60,90,120],confirmed:true},
  {name:'ASTM E2073 (1fc)',code:'ASTM-1FC',stream:'passive',lux:10.8,time:60,intervals:[10,20,30,60,90,120],confirmed:true},
  {name:'SATS TS5367 Lite',code:'SATS-LITE',stream:'hybrid',lux:216,time:60,intervals:[10,30,60,90],confirmed:true},
  {name:'Stadium Extended',code:'STAD-EXT',stream:'passive',lux:300,time:120,intervals:[10,30,90,120,180,240,300,360],confirmed:false},
  {name:'F6 CodeMark',code:'F6-CM',stream:'passive',lux:21.5,time:120,intervals:[10,20,30,60,90,120],confirmed:false},
];
const mockFormulas=[
  {key:'ccf_correction',label:'Calibration Correction Factor',desc:'Applied to all luminance meter readings',formula:'corrected = raw_avg × CCF',status:'todo'},
  {key:'loading_normalisation',label:'Loading Normalisation',desc:'Normalise to standard g/m² for batch comparison',formula:'norm = reading × (target_gsm / actual_gsm)',status:'todo'},
  {key:'power_factor',label:'Power Factor Adjustment',desc:'R&D normalisation to target loading',formula:'adj = reading × (target/actual)^pf',status:'todo'},
  {key:'dark_conditioning',label:'Dark Conditioning Period',desc:'Minimum days in darkness before testing',formula:'4 days default',status:'confirmed'},
  {key:'variance_threshold',label:'Duplicate Reading Variance',desc:'Max acceptable difference between two readings',formula:'> 10% flags warning',status:'todo'},
  {key:'lum_meter_offset',label:'Luminance Meter Offset',desc:'Used in CodeMark discharge threshold calc',formula:'2 mcd/m²',status:'todo'},
];
const mockBatch=[
  {date:'2026-01-27',testNum:'e1117',pigment:'ZOX LOGYG-09 PYGECO-09-002',carrier:'C/C AL23-09009',grade:'S10',m10:56.25,m10ref:56.5,m10pct:99.6,m90:9.0,m90ref:9.5,m90pct:94.7,result:'pass'},
  {date:'2026-01-26',testNum:'e1116',pigment:'ZOX LOGYG-09 PYGECO-09-002',carrier:'C/C AL23-09009',grade:'S10',m10:45.5,m10ref:44.6,m10pct:102,m90:7.0,m90ref:7.3,m90pct:95.9,result:'pass'},
  {date:'2026-01-22',testNum:'h451',pigment:'EG-70 201202H',carrier:'Plascoat 22754623',grade:'A20',m10:1175,m10ref:1129,m10pct:104,m90:80,m90ref:76,m90pct:105,result:'pass',type:'codemark'},
];

// Workflow mock
const W={
  testNum:'e1126',date:'2026-02-11',
  sample:'S20 ZOX LOGYG-09 PYGECO-09-002 + C/C AL23-09009',
  sampleIds:['091224PB-1-1','091224PB-1-2','091224PB-1-3'],
  pigment:'ZOX LOGYG-09 PYGECO-09-002',carrier:'C/C AL23-09009',
  grade:'S20',loading:1100,method:'Standard S20 Batch',lamp:'FL4E (13W)',lux:100,chargeTime:20,
  intervals:[10,30,60,90,120],
  controls:[{id:'20140313-1',name:'20140313 C/C57817',grade:'S20',loading:1030},{id:'T-12',name:'T-12',grade:'S10-S12',loading:445}],
  readings:{
    '091224PB-1-1':{10:[289,292],30:[117,118],60:[38,38.5],90:[27,27],120:[20,20.5]},
    '091224PB-1-2':{10:[292,287],30:[119,118],60:[38.5,38.5],90:[27,27],120:[20.5,20]},
    '091224PB-1-3':{10:[287,290],30:[118,117],60:[38,39],90:[27,26.5],120:[20,20]},
    '20140313-1':{10:[311,310],30:[120,121],60:[39,38],90:[27,27],120:[21,20.5]},
    'T-12':{10:[208,207],30:[82,82],60:[27.5,28],90:[19,19],120:[14,14.5]},
  },
};

/* ═══════════════════════════════════════
   MODULE PAGES
   ═══════════════════════════════════════ */

// Dashboard
const DashboardPage = ({onNav})=>{
  const ready=mockSchedule.filter(s=>s.status==='ready').length;
  const cond=mockSchedule.filter(s=>s.status==='conditioning').length;
  const done=mockResults.filter(r=>r.status==='completed').length;
  const avail=mockControls.filter(c=>c.status==='available').length;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <StatCard label="Ready to Test" value={ready} sub="Samples conditioned" icon="🔬" color={T.success}/>
        <StatCard label="Conditioning" value={cond} sub="In dark storage" icon="🌑" color="#7c5cbf"/>
        <StatCard label="Completed (Month)" value={done} sub="Tests finalised" icon="✓" color={T.primary600}/>
        <StatCard label="Controls Available" value={`${avail}/${mockControls.length}`} sub="Ready for use" icon="◆" color={T.info}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card>
          <CardH title="Upcoming Tests" subtitle="Ready & scheduled" icon="📋" action={<Btn v="secondary" onClick={()=>onNav('schedule')}>View All</Btn>}/>
          <div style={{padding:'4px 0'}}>{mockSchedule.slice(0,4).map(s=>(
            <div key={s.id} style={{padding:'10px 20px',display:'flex',alignItems:'center',gap:10,borderBottom:`1px solid ${T.n1}`}}>
              <span style={{fontFamily:T.fm,fontSize:12,fontWeight:600,color:T.primary600,minWidth:48}}>{s.testNum}</span>
              <Badge color={s.stream==='hybrid'?T.info:T.primary600}>{s.stream}</Badge>
              <span style={{fontSize:13,color:T.n8,flex:1}}>{s.sample.length>40?s.sample.substring(0,40)+'…':s.sample}</span>
              <span style={{fontSize:12,color:T.n5}}>{s.scheduledDate}</span>
              <StatusBadge status={s.status}/>
            </div>
          ))}</div>
        </Card>
        <Card>
          <CardH title="Control Sample Availability" subtitle="Dark conditioning status" icon="◆" action={<Btn v="secondary" onClick={()=>onNav('config')}>Manage</Btn>}/>
          <div style={{padding:'4px 0'}}>{mockControls.slice(0,5).map(c=>(
            <div key={c.name} style={{padding:'10px 20px',display:'flex',alignItems:'center',gap:10,borderBottom:`1px solid ${T.n1}`}}>
              <span style={{fontFamily:T.fm,fontSize:12,fontWeight:600,color:T.n8,minWidth:100}}>{c.name}</span>
              <Badge>{c.grade}</Badge>
              {c.isCM&&<Badge color={T.info}>CM Ref</Badge>}
              <span style={{flex:1}}/>
              <span style={{fontSize:11,color:T.n5}}>Avail: {c.available}</span>
              <StatusBadge status={c.status==='conditioning'?'conditioning':'ready'}/>
            </div>
          ))}</div>
        </Card>
      </div>
      <Card>
        <CardH title="Recent Results" subtitle="Last 5 completed tests" icon="📊" action={<Btn v="secondary" onClick={()=>onNav('results')}>View All</Btn>}/>
        <Table columns={[
          {label:'Test #',key:'testNum',mono:true,render:r=><span style={{fontWeight:600,color:T.primary600}}>{r.testNum}</span>},
          {label:'Date',key:'date'},{label:'Stream',render:r=><Badge color={r.stream==='hybrid'?T.info:T.primary600}>{r.stream}</Badge>},
          {label:'Sample',key:'sample'},{label:'Type',render:r=><span style={{fontFamily:T.fm}}>{r.type}</span>},
          {label:'10min',key:'m10',align:'right',mono:true,render:r=>r.m10??'—'},
          {label:'30min',key:'m30',align:'right',mono:true,render:r=>r.m30??'—'},
          {label:'90min',key:'m90',align:'right',mono:true,render:r=>r.m90??'—'},
          {label:'Status',render:r=><StatusBadge status={r.status}/>},
        ]} rows={mockResults}/>
      </Card>
    </div>
  );
};

// Schedule
const SchedulePage = ()=>{
  const [timerTest,setTimerTest]=useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {timerTest&&<TimerWidget test={timerTest} onClose={()=>setTimerTest(null)}/>}
      <Card>
        <CardH title="Test Schedule" subtitle="Manage test requests, dark conditioning & scheduling" icon="📋" action={
          <div style={{display:'flex',gap:8}}><Btn v="secondary">🖨 Print Sheet</Btn><Btn v="primary">+ New Test Request</Btn></div>
        }/>
        <Table columns={[
          {label:'Test #',render:r=><span style={{fontFamily:T.fm,fontWeight:600,color:T.primary600}}>{r.testNum}</span>},
          {label:'Priority',render:r=>r.priority==='urgent'?<Badge color={T.danger}>Urgent</Badge>:r.priority==='low'?<Badge color={T.n5}>Low</Badge>:<Badge color={T.n4}>Normal</Badge>},
          {label:'Stream',render:r=><Badge color={r.stream==='hybrid'?T.info:T.primary600}>{r.stream}</Badge>},
          {label:'Sample',render:r=><span style={{maxWidth:280,display:'block',overflow:'hidden',textOverflow:'ellipsis'}}>{r.sample}</span>},
          {label:'Controls',render:r=><span style={{fontSize:12,color:T.n6}}>{r.control}</span>},
          {label:'Into Dark',render:r=>r.dateIntoDark||<span style={{color:T.n4}}>—</span>},
          {label:'Earliest Test',render:r=>r.earliestTest||<span style={{color:T.n4}}>—</span>},
          {label:'Scheduled',key:'scheduledDate'},
          {label:'Status',render:r=><StatusBadge status={r.status}/>},
          {label:'',render:r=>r.status==='ready'?<Btn v="ghost" onClick={e=>{e.stopPropagation();setTimerTest(r);}}>⏱ Timer</Btn>:null},
        ]} rows={mockSchedule}/>
      </Card>
      <InfoBar type="info"><strong>Dark conditioning:</strong> Samples need ≥4 days darkness. "Earliest Test" auto-calculated from "Into Dark" date. <span style={{color:T.warning,fontWeight:500}}>// TODO: Confirm conditioning period varies by control type</span></InfoBar>
    </div>
  );
};

// Timer widget (reusable)
const TimerWidget = ({test,onClose})=>{
  const ivs=[10,20,30,60,90,120];
  const [elapsed,setElapsed]=useState(0);
  const [running,setRunning]=useState(false);
  const [start,setStart]=useState(null);
  const ref=useRef(null);
  useEffect(()=>{if(running){ref.current=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),200);}return () => clearInterval(ref.current);},[running,start]);
  const fmt=s=>`${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const elMin=elapsed/60;const nextIv=ivs.find(i=>i>elMin);const nextSec=nextIv?(nextIv*60)-elapsed:0;const isW=nextSec>0&&nextSec<=120;
  return(
    <Card style={{border:`1px solid ${isW?T.warning:T.primary200}`}}>
      <div style={{padding:'14px 18px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>⏱</span>
            <span style={{fontSize:13,fontWeight:600,color:T.n9}}>Test {test.testNum} — {running?'Discharge in progress':'Ready'}</span>
          </div>
          <div style={{display:'flex',gap:6}}>
            {!running?<Btn v="primary" onClick={()=>{setStart(Date.now());setRunning(true);}}>▶ Start</Btn>:<Btn v="secondary" onClick={()=>{setRunning(false);clearInterval(ref.current);}}>⏸ Pause</Btn>}
            <Btn v="ghost" onClick={onClose}>✕</Btn>
          </div>
        </div>
        {running&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
            <span style={{fontSize:24,fontWeight:700,fontFamily:T.fm,color:T.n9}}>{fmt(elapsed)}</span>
            {nextIv&&<span style={{fontSize:12,color:isW?T.warning:T.n5,fontWeight:isW?600:400}}>{isW?'⚠ ':''}Next ({nextIv}min) in {fmt(nextSec)}</span>}
          </div>
          <div style={{height:6,background:T.n1,borderRadius:3,overflow:'hidden',marginBottom:10}}>
            <div style={{height:'100%',width:`${Math.min((elMin/ivs[ivs.length-1])*100,100)}%`,background:isW?T.warning:T.primary500,transition:'width 1s linear',borderRadius:3}}/>
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{ivs.map(iv=>{
            const done=elMin>=iv;const cur=nextIv===iv;
            return <span key={iv} style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:done?`${T.success}18`:cur?(isW?`${T.warning}18`:`${T.info}18`):T.n1,color:done?T.success:cur?(isW?T.warning:T.info):T.n4}}>{done?'✓ ':cur?'⏳ ':'○ '}{iv}min</span>;
          })}</div>
        </>}
      </div>
    </Card>
  );
};

// Results Register
const ResultsPage = ()=>{
  const [stream,setStream]=useState('all');
  const filtered=stream==='all'?mockResults:mockResults.filter(r=>r.stream===stream);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Card>
        <CardH title="Test Results Register" subtitle="RF-913 (Passive) & RF-914 (Hybrid)" icon="📊" action={
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',borderRadius:T.r,overflow:'hidden',border:`1px solid ${T.n2}`}}>
              {['all','passive','hybrid'].map(s=>(
                <button key={s} onClick={()=>setStream(s)} style={{padding:'5px 12px',fontSize:12,fontWeight:stream===s?600:400,background:stream===s?T.primary50:'white',color:stream===s?T.primary600:T.n5,border:'none',cursor:'pointer',fontFamily:T.f,textTransform:'capitalize'}}>{s}</button>
              ))}
            </div>
            <Btn v="secondary">⬇ Export</Btn>
          </div>
        }/>
        <Table columns={[
          {label:'Test #',render:r=><span style={{fontFamily:T.fm,fontWeight:600,color:T.primary600}}>{r.testNum}</span>},
          {label:'Date',key:'date'},
          {label:'Stream',render:r=><Badge color={r.stream==='hybrid'?T.info:T.primary600}>{r.stream}</Badge>},
          {label:'Type',render:r=><span style={{fontFamily:T.fm,fontSize:11,padding:'2px 6px',borderRadius:3,background:T.n1}}>{r.type}</span>},
          {label:'Sample',key:'sample'},
          {label:'Lamp',key:'lamp',mono:true},
          {label:'Lux',key:'lux',align:'right',mono:true},
          {label:'10min',align:'right',mono:true,render:r=>r.m10??'—'},
          {label:'30min',align:'right',mono:true,render:r=>r.m30??'—'},
          {label:'60min',align:'right',mono:true,render:r=>r.m60??'—'},
          {label:'90min',align:'right',mono:true,render:r=>r.m90??'—'},
          {label:'Status',render:r=><StatusBadge status={r.status}/>},
        ]} rows={filtered}/>
      </Card>
      <InfoBar type="warning"><strong>Note:</strong> Displayed values are raw averages of duplicate readings. <span style={{color:T.warning,fontWeight:500}}>// TODO: CCF correction not yet applied — pending formula confirmation</span></InfoBar>
    </div>
  );
};

// Batch Acceptance
const BatchPage = ()=>(
  <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      {mockBatch.map(b=>(
        <Card key={b.testNum} style={{cursor:'pointer'}}>
          <div style={{padding:'16px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div><span style={{fontFamily:T.fm,fontSize:13,fontWeight:600,color:T.primary600}}>{b.testNum}</span><span style={{fontSize:12,color:T.n5,marginLeft:8}}>{b.date}</span></div>
              <StatusBadge status={b.result}/>
            </div>
            <div style={{fontSize:12,color:T.n6,marginBottom:4}}>{b.pigment}</div>
            <div style={{fontSize:12,color:T.n5,marginBottom:12}}>{b.carrier} — <Badge>{b.grade}</Badge> {b.type==='codemark'&&<Badge color={T.info}>CodeMark</Badge>}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['10min',b.m10,b.m10pct],['90min',b.m90,b.m90pct]].map(([lbl,val,pct])=>(
                <div key={lbl} style={{padding:'8px 10px',background:T.n0,borderRadius:T.r}}>
                  <div style={{fontSize:10,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{lbl}</div>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:T.fm,color:T.n9}}>{val}</div>
                  <div style={{fontSize:10,color:pct>=95?T.success:pct>=90?T.warning:T.danger,fontWeight:600}}>{pct}% of ref</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'10px 20px',borderTop:`1px solid ${T.n1}`,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:T.n5}}>Review & approve →</span>
            {b.type==='codemark'&&<span style={{fontSize:11,color:T.info}}>RF-915</span>}
          </div>
        </Card>
      ))}
    </div>
    <InfoBar type="warning"><strong>Batch acceptance:</strong> Readings compared against reference control values. <span style={{color:T.warning,fontWeight:500}}>// TODO: Loading normalisation not configured — raw values shown. Bands configurable via Configuration.</span></InfoBar>
  </div>
);

// Data Entry
const DataEntryPage = ()=>{
  const samples=['250325PB-4-3\nS10 ZOX','250325PB-3-3\nS15 ZOX','20140313-3\nControl','T-13\nControl'];
  const ivs=[10,20,30,60,90,120];
  const [readings,setReadings]=useState({});
  const sv=(s,iv,r,v)=>setReadings(p=>({...p,[`${s}-${iv}-${r}`]:v}));
  const gv=(s,iv,r)=>readings[`${s}-${iv}-${r}`]||'';
  const ga=(s,iv)=>{const a=parseFloat(gv(s,iv,1)),b=parseFloat(gv(s,iv,2));return(!isNaN(a)&&!isNaN(b))?((a+b)/2).toFixed(1):'—';};
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Card>
        <CardH title="Enter Test Readings" subtitle="Test e1122 — Transcribe from paper test sheet" icon="✏️" action={<div style={{display:'flex',gap:8}}><Btn v="secondary">Save Draft</Btn><Btn v="primary">Finalise Test</Btn></div>}/>
        <div style={{padding:'12px 20px',borderBottom:`1px solid ${T.n1}`,display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:12,background:T.n0}}>
          {[['Test #','e1122'],['Date','2026-02-11'],['Lamp','FL4E (13W)'],['Lux / Time','100lx / 20min']].map(([l,v])=>(<div key={l}><div style={{fontSize:10,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:T.n9,fontFamily:T.fm}}>{v}</div></div>))}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={{padding:'10px 14px',background:T.n0,borderBottom:`1px solid ${T.n2}`,fontSize:11,fontWeight:600,color:T.n5,textAlign:'left',position:'sticky',left:0}}>Interval</th>
                {samples.map((s,i)=>(<th key={i} colSpan={3} style={{padding:'8px 10px',background:i>=2?`${T.info}08`:T.n0,borderBottom:`1px solid ${T.n2}`,borderLeft:`1px solid ${T.n2}`,textAlign:'center'}}><div style={{fontSize:11,fontWeight:600,color:T.n8,fontFamily:T.fm,whiteSpace:'pre-line',lineHeight:1.3}}>{s}</div>{i>=2&&<Badge color={T.info}>Control</Badge>}</th>))}
              </tr>
              <tr>
                <th style={{padding:'4px 14px',background:T.n0,borderBottom:`1px solid ${T.n2}`}}/>
                {samples.map((_,i)=>(<Fragment key={i}><th style={{padding:'4px 6px',background:T.n0,borderBottom:`1px solid ${T.n2}`,borderLeft:`1px solid ${T.n2}`,fontSize:10,color:T.n4,textAlign:'center'}}>Rdg 1</th><th style={{padding:'4px 6px',background:T.n0,borderBottom:`1px solid ${T.n2}`,fontSize:10,color:T.n4,textAlign:'center'}}>Rdg 2</th><th style={{padding:'4px 6px',background:`${T.primary50}80`,borderBottom:`1px solid ${T.n2}`,fontSize:10,color:T.primary600,textAlign:'center',fontWeight:600}}>Avg</th></Fragment>))}
              </tr>
            </thead>
            <tbody>
              {ivs.map(iv=>(<tr key={iv}>
                <td style={{padding:'6px 14px',borderBottom:`1px solid ${T.n1}`,fontWeight:600,color:T.n7,position:'sticky',left:0,background:'white',fontFamily:T.fm}}>{iv}min</td>
                {samples.map((_,si)=>(<Fragment key={si}>
                  {[1,2].map(r=>(<td key={r} style={{padding:'4px 4px',borderBottom:`1px solid ${T.n1}`,borderLeft:r===1?`1px solid ${T.n2}`:'none',textAlign:'center'}}>
                    <input type="text" value={gv(si,iv,r)} onChange={e=>sv(si,iv,r,e.target.value)} placeholder="—" style={{width:52,padding:'5px 4px',border:`1px solid ${T.n2}`,borderRadius:3,fontSize:12,fontFamily:T.fm,textAlign:'center',outline:'none'}}
                      onFocus={e=>{e.target.style.borderColor=T.primary400;e.target.style.boxShadow=`0 0 0 2px ${T.primary400}30`;}}
                      onBlur={e=>{e.target.style.borderColor=T.n2;e.target.style.boxShadow='none';}}/>
                  </td>))}
                  <td style={{padding:'4px 6px',borderBottom:`1px solid ${T.n1}`,textAlign:'center',fontFamily:T.fm,fontSize:12,fontWeight:600,color:T.primary600,background:`${T.primary50}40`}}>{ga(si,iv)}</td>
                </Fragment>))}
              </tr>))}
            </tbody>
          </table>
        </div>
        <div style={{padding:'12px 20px',borderTop:`1px solid ${T.n1}`,background:T.n0}}>
          <textarea placeholder="Notes / observations..." style={{width:'100%',padding:'8px 10px',border:`1px solid ${T.n2}`,borderRadius:T.r,fontSize:12,fontFamily:T.f,minHeight:48,resize:'vertical',outline:'none',boxSizing:'border-box'}}/>
        </div>
      </Card>
    </div>
  );
};

// Configuration
const ConfigPage = ()=>{
  const [sub,setSub]=useState('methods');
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <TabBar tabs={[
        {id:'methods',label:'Test Methods',icon:'📐',count:mockMethods.length},
        {id:'lamps',label:'Lamp Library',icon:'💡',count:mockLamps.length},
        {id:'equipment',label:'Meters & Equipment',icon:'🔦',count:mockEquipment.length},
        {id:'controls',label:'Control Samples',icon:'◆',count:mockControls.length},
        {id:'grades',label:'Product Grades',icon:'🏷'},
        {id:'formulas',label:'Formulas & Thresholds',icon:'⚙'},
      ]} active={sub} onSelect={setSub}/>
      {sub==='methods'&&<Card><CardH title="Test Methods" subtitle="Standard and custom protocols" action={<Btn v="primary">+ Add Method</Btn>}/><Table columns={[
        {label:'Name',render:r=><span style={{fontWeight:500}}>{r.name}</span>},
        {label:'Code',render:r=><span style={{fontFamily:T.fm,fontSize:11,padding:'2px 6px',borderRadius:3,background:T.n1}}>{r.code}</span>},
        {label:'Stream',render:r=><Badge color={r.stream==='hybrid'?T.info:T.primary600}>{r.stream}</Badge>},
        {label:'Lux',key:'lux',align:'right',mono:true},{label:'Charge (min)',key:'time',align:'right',mono:true},
        {label:'Reading Intervals',render:r=><span style={{fontSize:11,fontFamily:T.fm,color:T.n6}}>{r.intervals.join(', ')}min</span>},
        {label:'Status',render:r=><StatusBadge status={r.confirmed?'confirmed':'todo'}/>},
      ]} rows={mockMethods}/></Card>}
      {sub==='lamps'&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        <Card>
          <CardH title="Lamp Library" subtitle="Track age, usage, replacements — data that spreadsheets can't capture passively" icon="💡" action={<Btn v="primary">+ Register Lamp</Btn>}/>
          <div style={{padding:'4px 0'}}>
            {mockLamps.map(lamp=>{
              const pctLife=Math.round((lamp.hoursRun/lamp.maxHours)*100);
              const lifeColor=pctLife>=80?T.danger:pctLife>=60?T.warning:T.success;
              return(
                <div key={lamp.id} style={{padding:'16px 20px',borderBottom:`1px solid ${T.n1}`,display:'flex',gap:16,alignItems:'flex-start'}}>
                  <div style={{width:44,height:44,borderRadius:10,background:lamp.tech==='LED'?`${T.info}12`:`${T.warning}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {lamp.tech==='LED'?'🔵':'💡'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <span style={{fontSize:14,fontWeight:700,color:T.n9}}>{lamp.name}</span>
                      <Badge color={lamp.tech==='LED'?T.info:T.warning}>{lamp.tech}</Badge>
                      <span style={{fontSize:12,color:T.n5}}>{lamp.wattage}W / {lamp.colourTemp}K</span>
                      {lamp.status==='warning'&&<StatusBadge status="warning"/>}
                      {lamp.status==='active'&&<StatusBadge status="confirmed"/>}
                    </div>
                    <div style={{fontSize:12,color:T.n6,marginBottom:4}}>{lamp.bulbModel}</div>
                    {lamp.notes&&<div style={{fontSize:11,color:T.n5,fontStyle:'italic',marginBottom:8}}>{lamp.notes}</div>}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:8}}>
                      <div style={{padding:'6px 8px',background:T.n0,borderRadius:T.r}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Age</div>
                        <div style={{fontSize:13,fontWeight:600,fontFamily:T.fm,color:T.n8}}>{lamp.age}</div>
                      </div>
                      <div style={{padding:'6px 8px',background:T.n0,borderRadius:T.r}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Tests</div>
                        <div style={{fontSize:13,fontWeight:600,fontFamily:T.fm,color:T.n8}}>{lamp.testsUsed}</div>
                      </div>
                      <div style={{padding:'6px 8px',background:T.n0,borderRadius:T.r}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Hours Run</div>
                        <div style={{fontSize:13,fontWeight:600,fontFamily:T.fm,color:T.n8}}>{lamp.hoursRun}</div>
                      </div>
                      <div style={{padding:'6px 8px',background:`${lifeColor}08`,borderRadius:T.r,border:`1px solid ${lifeColor}20`}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bulb Life</div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{flex:1,height:5,background:T.n2,borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${pctLife}%`,background:lifeColor,borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,fontFamily:T.fm,color:lifeColor}}>{pctLife}%</span>
                        </div>
                      </div>
                      <div style={{padding:'6px 8px',background:T.n0,borderRadius:T.r}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Replacements</div>
                        <div style={{fontSize:13,fontWeight:600,fontFamily:T.fm,color:T.n8}}>{lamp.replacements}</div>
                      </div>
                      <div style={{padding:'6px 8px',background:T.n0,borderRadius:T.r}}>
                        <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Installed</div>
                        <div style={{fontSize:12,fontWeight:500,fontFamily:T.fm,color:T.n8}}>{lamp.installDate}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:10,color:T.n5}}>Supported lux:</span>
                      {lamp.lux.map((l,i)=>(
                        <span key={l} style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:500,background:T.primary50,color:T.primary600,fontFamily:T.fm}}>{l}lx / {lamp.defaultCharge[i]}min</span>
                      ))}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                    <Btn v="secondary" sz="sm">Edit</Btn>
                    <Btn v="ghost" sz="sm">History</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <InfoBar type="info">
          <strong>Why this matters:</strong> Test counts, hours run, and bulb life are tracked automatically as tests flow through the system — no manual logging needed. 
          This data is impossible to reconstruct from the current spreadsheet system but will accumulate naturally going forward. Lamp age directly affects output consistency, so this traceability strengthens QMS and CodeMark audit evidence.
        </InfoBar>
      </div>}
      {sub==='equipment'&&<Card><CardH title="Meters & Equipment" subtitle="Luminance meters, lux meters, and accessories" action={<Btn v="primary">+ Add Equipment</Btn>}/><Table columns={[
        {label:'Name',render:r=><span style={{fontWeight:500}}>{r.name}</span>},
        {label:'Type',render:r=><Badge>{r.type.replace('_',' ')}</Badge>},
        {label:'Description',key:'desc'},
        {label:'Cal. Due',render:r=>r.cal||<span style={{color:T.n4}}>N/A</span>},
        {label:'CCF',align:'right',mono:true,render:r=>r.ccf?<span style={{fontWeight:600}}>{r.ccf}</span>:<span style={{color:T.n4}}>—</span>},
      ]} rows={mockEquipment}/></Card>}
      {sub==='controls'&&<Card><CardH title="Control Samples" subtitle="Reference PL samples with conditioning tracking" action={<Btn v="primary">+ Add Control</Btn>}/><Table columns={[
        {label:'Name',render:r=><span style={{fontFamily:T.fm,fontWeight:600}}>{r.name}</span>},
        {label:'Grade',render:r=><Badge>{r.grade}</Badge>},
        {label:'Type',render:r=>{const tl={t_control:'T-Control',s20_reference:'S20 Ref',a20_reference:'A20 Ref',zox_library:'ZOX Library'};return <span style={{fontSize:12}}>{tl[r.type]||r.type}</span>;}},
        {label:'Loading (g/m²)',key:'loading',align:'right',mono:true},
        {label:'Last Exposed',key:'lastExposure'},{label:'Available From',key:'available'},
        {label:'Exposures',key:'exposureCount',align:'right',mono:true},
        {label:'Status',render:r=><StatusBadge status={r.status==='conditioning'?'conditioning':'ready'}/>},
        {label:'',render:r=>r.isCM?<Badge color={T.info}>CM Reference</Badge>:null},
      ]} rows={mockControls}/></Card>}
      {sub==='grades'&&<Card><CardH title="Product Grades" subtitle="S-ratings and A-ratings with nominal loadings" action={<Btn v="primary">+ Add Grade</Btn>}/><Table columns={[
        {label:'Code',render:r=><span style={{fontFamily:T.fm,fontWeight:700,fontSize:14}}>{r.code}</span>},
        {label:'Type',render:r=><Badge color={r.type==='hybrid'?T.info:T.primary600}>{r.type}</Badge>},
        {label:'Nominal Loading (g/m²)',key:'loading',align:'right',mono:true},
        {label:'PL %',key:'pct',align:'right',mono:true},
      ]} rows={[{code:'S5',type:'passive',loading:275,pct:'40%'},{code:'S10',type:'passive',loading:500,pct:'50%'},{code:'S15',type:'passive',loading:800,pct:'55%'},{code:'S20',type:'passive',loading:1100,pct:'55%'},{code:'S25',type:'passive',loading:1600,pct:'55%'},{code:'A20',type:'hybrid',loading:1200,pct:'55%'}]}/></Card>}
      {sub==='formulas'&&<Card>
        <CardH title="Configurable Formulas & Thresholds" subtitle="All calculations configurable — confirmed values applied, TODOs show raw data" icon="⚙"/>
        <div style={{padding:'4px 0'}}>{mockFormulas.map(f=>(
          <div key={f.key} style={{padding:'14px 20px',borderBottom:`1px solid ${T.n1}`,display:'flex',alignItems:'flex-start',gap:14}}>
            <div style={{width:36,height:36,borderRadius:8,background:f.status==='confirmed'?`${T.success}12`:`${T.warning}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,marginTop:2}}>{f.status==='confirmed'?'✓':'⚠'}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.n9}}>{f.label}</span><StatusBadge status={f.status}/></div>
              <div style={{fontSize:12,color:T.n6,marginBottom:6}}>{f.desc}</div>
              <div style={{fontFamily:T.fm,fontSize:11,color:T.n5,padding:'4px 8px',background:T.n0,borderRadius:3,display:'inline-block'}}>{f.formula}</div>
            </div>
            <Btn v="secondary">Configure</Btn>
          </div>
        ))}</div>
      </Card>}
    </div>
  );
};

/* ═══════════════════════════════════════
   WORKFLOW DEMO STEPS
   ═══════════════════════════════════════ */
const STEPS=[
  {id:'request',n:1,l:'New Test Request',i:'📝',d:'Submit test request via form (replaces Google Form + FM-935)'},
  {id:'schedule',n:2,l:'Schedule & Assign',i:'📅',d:'Auto-assign number, suggest controls, calculate dates'},
  {id:'conditioning',n:3,l:'Dark Conditioning',i:'🌑',d:'System tracks countdown — status auto-updates when ready'},
  {id:'print',n:4,l:'Print Test Sheet',i:'🖨',d:'Generate pre-formatted paper form for the dark room'},
  {id:'timer',n:5,l:'Charge & Timer',i:'⏱',d:'Desk-based timer with notifications for each reading interval'},
  {id:'entry',n:6,l:'Enter Readings',i:'✏️',d:'Transcribe paper readings — averages auto-calculated'},
  {id:'review',n:7,l:'Review & Analyse',i:'📊',d:'Auto-calculated results with control comparison'},
  {id:'acceptance',n:8,l:'Batch Acceptance',i:'✓',d:'Evaluate against configurable pass/warning/fail criteria'},
  {id:'complete',n:9,l:'Finalise & Notify',i:'🚀',d:'Auto-route to registers, generate FM-918, notify team'},
];

const WfStepper = ({step,onClick})=>(
  <div style={{display:'flex',gap:2,overflowX:'auto',paddingBottom:4}}>
    {STEPS.map((s,i)=>{
      const active=s.id===step;const done=STEPS.findIndex(x=>x.id===step)>i;
      return(<Fragment key={s.id}>
        {i>0&&<div style={{display:'flex',alignItems:'center',padding:'0 1px'}}><div style={{width:12,height:2,background:done?T.success:T.n2}}/></div>}
        <button onClick={()=>onClick(s.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 10px',borderRadius:20,border:`1.5px solid ${active?T.primary500:done?T.success:T.n2}`,background:active?`${T.primary600}10`:done?`${T.success}08`:'white',cursor:'pointer',fontFamily:T.f,fontSize:11,fontWeight:active?600:400,color:active?T.primary600:done?T.success:T.n5,whiteSpace:'nowrap'}}>
          <span style={{width:18,height:18,borderRadius:'50%',background:done?T.success:active?T.primary600:T.n2,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{done?'✓':s.n}</span>{s.l}
        </button>
      </Fragment>);
    })}
  </div>
);

// Workflow step components (compact versions)
const WS1 = ()=>(<Card><CardH title="New Luminance Test Request" icon="📝"/>
  <div style={{padding:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
    <Field label="Test Stream" required><Select value="passive" options={[{value:'passive',label:'Passive (S-rated)'},{value:'hybrid',label:'Hybrid (A-rated)'}]}/></Field>
    <Field label="Test Purpose" required><Select value="quality_batch" options={[{value:'quality_batch',label:'Quality — Batch Test'},{value:'new_pigment',label:'New Pigment Evaluation'},{value:'codemark',label:'CodeMark Certification'},{value:'r_and_d',label:'R&D'}]}/></Field>
    <Field label="Sample Description" required style={{gridColumn:'1/-1'}}><Input value={W.sample} readOnly/></Field>
    <Field label="Pigment" required><Input value={W.pigment} readOnly mono/></Field>
    <Field label="Carrier" required><Input value={W.carrier} readOnly mono/></Field>
    <Field label="Expected Grade"><Select value="S20" options={[{value:'S5',label:'S5'},{value:'S10',label:'S10'},{value:'S15',label:'S15'},{value:'S20',label:'S20 (1100 g/m²)'},{value:'S25',label:'S25'}]}/></Field>
    <Field label="Test Method" required><Select value="STD-S20" options={[{value:'STD-S20',label:'Standard S20 Batch — FL4E 100lx 20min'}]}/></Field>
    <Field label="Sample Piece IDs" style={{gridColumn:'1/-1'}}><textarea value={W.sampleIds.join('\n')} readOnly style={{width:'100%',padding:'7px 10px',border:`1px solid ${T.n2}`,borderRadius:T.r,fontSize:12,fontFamily:T.fm,minHeight:56,resize:'vertical',outline:'none',boxSizing:'border-box',background:T.n0}}/></Field>
  </div>
  <div style={{padding:'12px 20px',borderTop:`1px solid ${T.n1}`,background:T.n0}}><InfoBar type="info">On submit → auto-assigns <strong style={{fontFamily:T.fm}}>e1126</strong>, routes to scheduling.</InfoBar></div>
</Card>);

const WS2 = ()=>(<Card><CardH title={`Schedule Test ${W.testNum}`} icon="📅"/>
  <div style={{padding:20}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 20px'}}>
      <Field label="Date Into Dark"><Input type="date" value="2026-02-04" readOnly mono/></Field>
      <Field label="Earliest Test" hint="Auto: +4 days"><div style={{padding:'7px 10px',background:`${T.success}10`,border:`1px solid ${T.success}30`,borderRadius:T.r,fontFamily:T.fm,fontSize:13,color:T.success,fontWeight:600}}>2026-02-08 ✓</div></Field>
      <Field label="Scheduled Date"><Input type="date" value="2026-02-11" readOnly mono/></Field>
    </div>
    <label style={{display:'block',fontSize:12,fontWeight:500,color:T.n7,marginBottom:8}}>Controls <span style={{color:T.n4,fontWeight:400}}>— auto-suggested for S20</span></label>
    {W.controls.map(c=>(<div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:T.n0,borderRadius:T.r,border:`1px solid ${T.n2}`,marginBottom:8}}>
      <Checkbox checked={true}/><span style={{fontFamily:T.fm,fontSize:12,fontWeight:600,minWidth:100}}>{c.name}</span><Badge>{c.grade}</Badge><span style={{fontSize:12,color:T.n5}}>{c.loading} g/m²</span><span style={{flex:1}}/><StatusBadge status="ready"/>
    </div>))}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px',marginTop:12}}>
      <Field label="Lamp" hint="From lamp library — usage tracked automatically"><Select value="FL4E" options={[{value:'FL4E',label:'FL4E — 13W 4000K (187 tests, 412hrs)'},{value:'FL6.5B',label:'FL6.5B — 18W 6500K (34 tests, 136hrs)'},{value:'LED4A',label:'LED4A — 10W 4000K (12 tests, 18hrs)'},{value:'SATS1',label:'SATS1 — 36W 6500K (28 tests, 56hrs)'}]}/></Field>
      <Field label="Luminance Meter"><Select value="LS150" options={[{value:'LS150',label:'LS-150 (CCF: 1.05)'}]}/></Field>
    </div>
  </div>
</Card>);

const WS3 = ()=>{
  const all=[...W.sampleIds,...W.controls.map(c=>c.id)];
  return(<Card><CardH title="Dark Conditioning" subtitle={`${W.testNum} — All items conditioned`} icon="🌑"/>
    <div style={{padding:'28px 20px',textAlign:'center'}}>
      <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',padding:'24px 40px',borderRadius:T.rxl,background:`${T.success}08`,border:`2px solid ${T.success}`}}>
        <div style={{fontSize:36,marginBottom:6}}>✅</div>
        <div style={{fontSize:14,fontWeight:600,color:T.success}}>Conditioning Complete — Ready to Test</div>
        <div style={{fontSize:12,color:T.n5,marginTop:6}}>Into dark: <strong>2026-02-04</strong> → Earliest: <strong>2026-02-08</strong> → Scheduled: <strong>2026-02-11</strong></div>
      </div>
      <div style={{marginTop:16,display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap'}}>{all.map((s,i)=>(
        <div key={i} style={{padding:'5px 12px',borderRadius:T.r,background:`${T.success}10`,border:`1px solid ${T.success}30`,fontSize:11,fontFamily:T.fm,fontWeight:500,color:T.success}}>✓ {s}</div>
      ))}</div>
    </div>
  </Card>);
};

const WS4 = ()=>{
  const cols=[...W.sampleIds,...W.controls.map(c=>c.id)];
  return(<Card><CardH title="Print Test Sheet" icon="🖨" action={<Btn v="primary" sz="md">🖨 Print</Btn>}/>
    <div style={{padding:20}}>
      <div style={{border:`2px solid ${T.n3}`,borderRadius:T.r,padding:18,background:'white',fontFamily:T.fm,fontSize:10,maxWidth:700,margin:'0 auto',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',borderBottom:`2px solid ${T.n9}`,paddingBottom:8,marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:'0.05em'}}>ECOGLO LUMINANCE TEST SHEET</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px 12px',marginBottom:10,fontSize:9}}>
          {[['Test #:',W.testNum],['Date:','___/___/2026'],['Tester:','_________'],['Plate:','1'],['Lamp:',W.lamp],['Lux:',`${W.lux}`],['Charge:',`${W.chargeTime}min`],['Temp:','23±1°C']].map(([l,v],i)=>(
            <div key={i} style={{display:'flex',gap:3}}><span style={{color:T.n5}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>
          ))}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:8}}>
          <thead><tr><th style={{padding:'4px 3px',border:`1px solid ${T.n4}`,background:T.n1,textAlign:'left',width:44}}>Time</th>
            {cols.map((s,i)=>(<th key={i} colSpan={2} style={{padding:'3px 2px',border:`1px solid ${T.n4}`,background:i>=W.sampleIds.length?`${T.info}15`:T.n1,textAlign:'center',fontSize:7}}>{s}</th>))}
          </tr></thead>
          <tbody>{W.intervals.map(iv=>(<tr key={iv}><td style={{padding:'6px 3px',border:`1px solid ${T.n4}`,fontWeight:600}}>{iv}min</td>
            {cols.map((_,i)=>(<Fragment key={i}><td style={{padding:'6px 2px',border:`1px solid ${T.n4}`,width:28}}></td><td style={{padding:'6px 2px',border:`1px solid ${T.n4}`,width:28}}></td></Fragment>))}
          </tr>))}</tbody>
        </table>
      </div>
    </div>
    <div style={{padding:'12px 20px',borderTop:`1px solid ${T.n1}`,background:T.n0}}><InfoBar type="info">Print → clipboard → dark room → fill by hand → come back → enter in next step.</InfoBar></div>
  </Card>);
};

const WS5 = ()=>{
  const [phase,setPhase]=useState('idle');const [elapsed,setElapsed]=useState(0);const [start,setStart]=useState(null);const ref=useRef(null);
  useEffect(()=>{if(phase==='charging'||phase==='discharging'){ref.current=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),200);}return () => clearInterval(ref.current);},[phase,start]);
  const fmt=s=>`${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const el=elapsed/60;const nxt=phase==='discharging'?W.intervals.find(i=>i>el):null;const ns=nxt?(nxt*60)-elapsed:0;const iw=ns>0&&ns<=120;const last=W.intervals[W.intervals.length-1];
  const phases=[{id:'idle',l:'Setup',ic:'🔧'},{id:'charging',l:`Charge (${W.chargeTime}min)`,ic:'💡'},{id:'discharging',l:'Lamp Off → Discharge',ic:'📝'}];
  const pi=phases.findIndex(p=>p.id===phase);
  return(<Card><CardH title="Test Timer" subtitle={`${W.testNum} — ${W.lamp} @ ${W.lux}lx`} icon="⏱"/>
    <div style={{padding:'20px'}}>
      <div style={{display:'flex',gap:4,marginBottom:20}}>{phases.map((p,i)=>{const a=p.id===phase;const d=pi>i;return(<Fragment key={p.id}>{i>0&&<div style={{flex:'0 0 16px',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{height:2,width:'100%',background:d?T.success:T.n2}}/></div>}<div style={{flex:1,padding:'8px 10px',borderRadius:T.r,background:a?`${T.primary600}10`:d?`${T.success}08`:T.n0,border:`1.5px solid ${a?T.primary400:d?T.success:T.n2}`,textAlign:'center'}}><div style={{fontSize:14,marginBottom:2}}>{d?'✅':p.ic}</div><div style={{fontSize:10,fontWeight:a?600:400,color:a?T.primary600:d?T.success:T.n5}}>{p.l}</div></div></Fragment>);})}</div>
      <div style={{textAlign:'center',padding:20,background:iw?`${T.warning}08`:T.n0,borderRadius:T.rl,border:`1px solid ${iw?T.warning:T.n2}`}}>
        {phase==='idle'&&<><div style={{fontSize:13,color:T.n6,marginBottom:14}}>Set up test — position samples, confirm lux</div><Btn v="primary" sz="lg" onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('charging');}}>💡 Start Charging</Btn></>}
        {phase==='charging'&&<><div style={{fontSize:11,color:T.n5,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Charging</div><div style={{fontSize:44,fontWeight:700,fontFamily:T.fm}}>{fmt(elapsed)}</div><div style={{width:260,height:7,background:T.n2,borderRadius:4,margin:'10px auto',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min((el/W.chargeTime)*100,100)}%`,background:T.warning,borderRadius:4,transition:'width 0.5s'}}/></div><div style={{fontSize:13,color:T.n6,marginBottom:14}}>{el>=W.chargeTime?<span style={{color:T.success,fontWeight:600}}>✓ Charge complete</span>:`${Math.max(0,Math.ceil(W.chargeTime-el))}min left`}</div>{el>=W.chargeTime?<Btn v="success" sz="lg" onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('discharging');clearInterval(ref.current);}}>⬛ Lamp Off — Start Discharge</Btn>:<Btn v="ghost" sz="sm" onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('discharging');clearInterval(ref.current);}} style={{marginTop:4,color:T.n4}}>⏭ Skip charge (demo)</Btn>}</>}
        {phase==='discharging'&&<><div style={{fontSize:11,color:iw?T.warning:T.n5,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4,fontWeight:iw?600:400}}>{iw?'⚠ READING DUE':'Discharging'}</div><div style={{fontSize:44,fontWeight:700,fontFamily:T.fm}}>{fmt(elapsed)}</div>{nxt?<div style={{fontSize:13,color:iw?T.warning:T.n6,fontWeight:iw?600:400,margin:'4px 0 10px'}}>Next ({nxt}min) in <strong>{fmt(ns)}</strong></div>:<div style={{fontSize:13,color:T.success,fontWeight:600,margin:'4px 0 10px'}}>✓ All intervals done</div>}<div style={{width:320,height:7,background:T.n2,borderRadius:4,margin:'0 auto 12px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min((el/last)*100,100)}%`,background:iw?T.warning:T.primary500,borderRadius:4,transition:'width 0.5s'}}/></div><div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap'}}>{W.intervals.map(iv=>{const dn=el>=iv;const c=nxt===iv;return <span key={iv} style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:600,fontFamily:T.fm,background:dn?`${T.success}15`:c?(iw?`${T.warning}15`:`${T.info}15`):T.n1,color:dn?T.success:c?(iw?T.warning:T.info):T.n4}}>{dn?'✓ ':c?'⏳ ':'○ '}{iv}min</span>;})}</div><div style={{marginTop:10}}><Btn v="ghost" sz="sm" onClick={()=>{const nxtIv=W.intervals.find(i=>i>el);const target=nxtIv||last;setStart(Date.now()-(target*60*1000+1000));}} style={{color:T.n4}}>⏭ Skip to {W.intervals.find(i=>i>el)?`${W.intervals.find(i=>i>el)}min`:'end'} (demo)</Btn></div></>}
      </div>
    </div>
  </Card>);
};

const WS6 = ()=>{
  const all=[...W.sampleIds,...W.controls.map(c=>c.id)];
  const [readings,setReadings]=useState({});const [filled,setFilled]=useState(false);
  const sv=(s,iv,r,v)=>setReadings(p=>({...p,[`${s}-${iv}-${r}`]:v}));const gv=(s,iv,r)=>readings[`${s}-${iv}-${r}`]||'';
  const ga=(s,iv)=>{const a=parseFloat(gv(s,iv,1)),b=parseFloat(gv(s,iv,2));return(!isNaN(a)&&!isNaN(b))?((a+b)/2).toFixed(1):'—';};
  const prefill=()=>{const r={};Object.entries(W.readings).forEach(([s,ivs])=>{Object.entries(ivs).forEach(([iv,[v1,v2]])=>{r[`${s}-${iv}-1`]=v1.toString();r[`${s}-${iv}-2`]=v2.toString();});});setReadings(r);setFilled(true);};
  return(<Card><CardH title="Enter Readings" subtitle={`${W.testNum} — Transcribe from paper`} icon="✏️" action={
    <div style={{display:'flex',gap:8}}>{!filled&&<Btn v="demo" onClick={prefill}>⚡ Auto-fill demo data</Btn>}{filled&&<Badge color={T.success} bg={`${T.success}15`}>✓ Entered</Badge>}</div>
  }/>
    <div style={{padding:'8px 20px',borderBottom:`1px solid ${T.n1}`,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,background:T.n0}}>
      {[['Test',W.testNum],['Date',W.date],['Lamp',W.lamp],['Lux',`${W.lux}`],['Charge',`${W.chargeTime}min`],['Temp','23.1°C']].map(([l,v])=>(<div key={l}><div style={{fontSize:9,color:T.n5,textTransform:'uppercase'}}>{l}</div><div style={{fontSize:12,fontWeight:600,fontFamily:T.fm}}>{v}</div></div>))}
    </div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
      <thead><tr><th style={{padding:'6px 8px',background:T.n0,borderBottom:`1px solid ${T.n2}`,textAlign:'left',fontSize:10,fontWeight:600,color:T.n5,position:'sticky',left:0,zIndex:1}}>Time</th>
        {all.map((s,i)=>(<th key={s} colSpan={3} style={{padding:'4px 3px',background:i>=W.sampleIds.length?`${T.info}08`:T.n0,borderBottom:`1px solid ${T.n2}`,borderLeft:`1px solid ${T.n2}`,textAlign:'center'}}><div style={{fontSize:9,fontWeight:600,fontFamily:T.fm}}>{s}</div>{i>=W.sampleIds.length&&<Badge color={T.info}>Ctrl</Badge>}</th>))}
      </tr></thead>
      <tbody>{W.intervals.map(iv=>(<tr key={iv}><td style={{padding:'4px 8px',borderBottom:`1px solid ${T.n1}`,fontWeight:600,color:T.n7,fontFamily:T.fm,position:'sticky',left:0,background:'white',zIndex:1}}>{iv}min</td>
        {all.map(s=>(<Fragment key={`${s}-${iv}`}>{[1,2].map(r=>(<td key={r} style={{padding:'2px',borderBottom:`1px solid ${T.n1}`,borderLeft:r===1?`1px solid ${T.n2}`:'none',textAlign:'center'}}>
          <input type="text" value={gv(s,iv,r)} onChange={e=>sv(s,iv,r,e.target.value)} placeholder="—" style={{width:42,padding:'3px 2px',border:`1px solid ${T.n2}`,borderRadius:3,fontSize:10,fontFamily:T.fm,textAlign:'center',outline:'none'}}
            onFocus={e=>{e.target.style.borderColor=T.primary400;e.target.style.boxShadow=`0 0 0 2px ${T.primary400}30`;}}
            onBlur={e=>{e.target.style.borderColor=T.n2;e.target.style.boxShadow='none';}}/>
        </td>))}<td style={{padding:'2px 4px',borderBottom:`1px solid ${T.n1}`,textAlign:'center',fontFamily:T.fm,fontSize:10,fontWeight:600,color:T.primary600,background:`${T.primary50}40`}}>{ga(s,iv)}</td></Fragment>))}
      </tr>))}</tbody>
    </table></div>
  </Card>);
};

const WS7 = ()=>{
  const avgs={};Object.entries(W.readings).forEach(([s,ivs])=>{avgs[s]={};Object.entries(ivs).forEach(([iv,[r1,r2]])=>{avgs[s][iv]=((r1+r2)/2).toFixed(1);});});
  const sa={};W.intervals.forEach(iv=>{sa[iv]=(W.sampleIds.reduce((sum,s)=>sum+parseFloat(avgs[s]?.[iv]||0),0)/W.sampleIds.length).toFixed(1);});
  return(<Card><CardH title="Review Results" subtitle={`${W.testNum} — Auto-calculated`} icon="📊"/>
    <div style={{padding:20}}>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${W.intervals.length},1fr)`,gap:8,marginBottom:16}}>
        {W.intervals.map(iv=>(<div key={iv} style={{padding:10,background:T.n0,borderRadius:T.r,textAlign:'center',border:`1px solid ${T.n2}`}}><div style={{fontSize:10,color:T.n5,textTransform:'uppercase',marginBottom:3}}>{iv}min</div><div style={{fontSize:20,fontWeight:700,fontFamily:T.fm}}>{sa[iv]}</div><div style={{fontSize:9,color:T.n5}}>mcd/m²</div></div>))}
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:14}}>
        <thead><tr><th style={{padding:'7px 10px',textAlign:'left',borderBottom:`2px solid ${T.n2}`,fontSize:11,fontWeight:600,color:T.n5,background:T.n0}}>Sample</th><th style={{padding:'7px 10px',textAlign:'left',borderBottom:`2px solid ${T.n2}`,fontSize:11,fontWeight:600,color:T.n5,background:T.n0}}>Type</th>{W.intervals.map(iv=>(<th key={iv} style={{padding:'7px 6px',textAlign:'right',borderBottom:`2px solid ${T.n2}`,fontSize:11,fontWeight:600,color:T.n5,background:T.n0,fontFamily:T.fm}}>{iv}min</th>))}</tr></thead>
        <tbody>
          {W.sampleIds.map((s,i)=>(<tr key={s}><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.n1}`,fontFamily:T.fm,fontWeight:600,fontSize:11}}>{s}</td><td style={{padding:'6px 10px',borderBottom:`1px solid ${T.n1}`,color:T.n5}}>Sample {i+1}</td>{W.intervals.map(iv=>(<td key={iv} style={{padding:'6px',borderBottom:`1px solid ${T.n1}`,textAlign:'right',fontFamily:T.fm}}>{avgs[s]?.[iv]}</td>))}</tr>))}
          <tr style={{background:`${T.primary50}60`}}><td style={{padding:'7px 10px',fontWeight:700}} colSpan={2}>Sample Average</td>{W.intervals.map(iv=>(<td key={iv} style={{padding:'7px 6px',textAlign:'right',fontFamily:T.fm,fontWeight:700,color:T.primary600,fontSize:13}}>{sa[iv]}</td>))}</tr>
          {W.controls.map(c=>(<tr key={c.id} style={{background:`${T.info}06`}}><td style={{padding:'6px 10px',fontFamily:T.fm,fontWeight:600,fontSize:11}}>{c.id}</td><td style={{padding:'6px 10px',color:T.info}}>Ctrl ({c.grade})</td>{W.intervals.map(iv=>(<td key={iv} style={{padding:'6px',textAlign:'right',fontFamily:T.fm,color:T.info,fontWeight:500}}>{avgs[c.id]?.[iv]}</td>))}</tr>))}
        </tbody>
      </table>
      <InfoBar type="warning"><strong>Pending:</strong> CCF correction not applied. Loading normalisation not configured. <span style={{color:T.warning,fontWeight:500}}>// TODO: corrected = raw × CCF</span></InfoBar>
    </div>
  </Card>);
};

const WS8 = ()=>{
  const ref={10:310.5,30:120.5,60:38.5,90:27,120:20.75};const samp={10:289.3,30:118,60:38.3,90:26.8,120:20.2};
  return(<Card><CardH title="Batch Acceptance" subtitle={`${W.testNum} — ${W.pigment}`} icon="✓"/>
    <div style={{padding:20}}>
      <div style={{textAlign:'center',padding:16,background:`${T.success}08`,borderRadius:T.rl,border:`2px solid ${T.success}`,marginBottom:16}}>
        <div style={{fontSize:28,marginBottom:4}}>✅</div><div style={{fontSize:16,fontWeight:700,color:T.success}}>PASS</div><div style={{fontSize:12,color:T.n6,marginTop:4}}>All readings ≥95% of reference</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${W.intervals.length},1fr)`,gap:8,marginBottom:14}}>
        {W.intervals.map(iv=>{const pct=((samp[iv]/ref[iv])*100).toFixed(1);const p=parseFloat(pct);const bc=p>=95?T.success:p>=90?'#7cb87c':p>=85?T.warning:T.danger;
          return(<div key={iv} style={{padding:10,borderRadius:T.r,border:`2px solid ${bc}30`,background:`${bc}06`}}>
            <div style={{fontSize:9,color:T.n5,textTransform:'uppercase',marginBottom:6}}>{iv}min</div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontSize:9,color:T.n4}}>Samp</span><span style={{fontSize:16,fontWeight:700,fontFamily:T.fm}}>{samp[iv]}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:9,color:T.n4}}>Ref</span><span style={{fontSize:12,fontFamily:T.fm,color:T.n5}}>{ref[iv]}</span></div>
            <div style={{height:5,background:T.n2,borderRadius:3,overflow:'hidden',marginBottom:4}}><div style={{height:'100%',width:`${Math.min(p,100)}%`,background:bc,borderRadius:3}}/></div>
            <div style={{fontSize:12,fontWeight:700,fontFamily:T.fm,color:bc,textAlign:'center'}}>{pct}%</div>
          </div>);
        })}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{[{c:T.success,l:'Pass ≥95%'},{c:'#7cb87c',l:'OK 90–95%'},{c:T.warning,l:'Warn 85–90%'},{c:T.danger,l:'Fail <85%'}].map(b=>(<div key={b.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.n6}}><div style={{width:10,height:10,borderRadius:2,background:b.c}}/>{b.l}</div>))}</div>
    </div>
  </Card>);
};

const WS9 = ()=>(<Card><CardH title="Finalise & Notify" subtitle={`${W.testNum}`} icon="🚀"/>
  <div style={{padding:20}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16}}>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Test Summary</div>
        {[['Test #',W.testNum],['Date',W.date],['Grade',W.grade],['Pigment',W.pigment],['Carrier',W.carrier],['Method',W.method],['Result','PASS']].map(([l,v])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${T.n1}`,fontSize:13}}>
            <span style={{color:T.n5}}>{l}</span>
            <span style={{fontWeight:500,fontFamily:['Test #','Pigment','Carrier'].includes(l)?T.fm:T.f}}>{v==='PASS'?<StatusBadge status="pass"/>:v}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:T.n5,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Actions on Completion</div>
        {[{l:'Save to RF-913 Results Register',a:true},{l:'Save to RF-911 Batch Log',a:true},{l:'Update control exposure records',a:true},{l:'Generate FM-918 Goods Receipt',a:false},{l:'Notify Sam Haughey',a:false},{l:'Notify Phil',a:false}].map(x=>(
          <div key={x.l} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',background:T.n0,borderRadius:T.r,border:`1px solid ${T.n2}`,marginBottom:6}}>
            <Checkbox checked={true}/><span style={{flex:1,fontSize:12}}>{x.l}</span>{x.a&&<Badge color={T.primary600}>Auto</Badge>}
          </div>
        ))}
      </div>
    </div>
    <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Btn v="success" sz="md">✓ Finalise Test & Notify</Btn></div>
  </div>
</Card>);

const WF_MAP={request:WS1,schedule:WS2,conditioning:WS3,print:WS4,timer:WS5,entry:WS6,review:WS7,acceptance:WS8,complete:WS9};

/* ═══════════════════════════════════════
   DARK ROOM MODE — TABLET VIEW
   ═══════════════════════════════════════ */
const D = { // Dark room palette — red-shifted to preserve night vision
  bg:'#0a0a0a', surface:'#141414', surfaceHover:'#1c1c1c',
  border:'#2a2a2a', borderActive:'#3a3a3a',
  red:'#ff6b6b', redDim:'#cc4444', redGlow:'#ff6b6b30',
  amber:'#ffaa44', amberDim:'#cc8833', amberGlow:'#ffaa4430',
  green:'#66dd88', greenDim:'#44aa66',
  text:'#cc9999', textBright:'#ffcccc', textDim:'#664444',
  mono:"'IBM Plex Mono',monospace", sans:"'IBM Plex Sans',sans-serif",
};

const DarkRoomMode = ({onExit})=>{
  const [phase,setPhase]=useState('setup'); // setup, charging, discharging, entry
  const [elapsed,setElapsed]=useState(0);
  const [start,setStart]=useState(null);
  const ref=useRef(null);
  const [completedReadings,setCompletedReadings]=useState([]);
  const [activeInterval,setActiveInterval]=useState(null);
  const [fieldIdx,setFieldIdx]=useState(0);
  const [entryValues,setEntryValues]=useState({});

  const intervals=W.intervals;
  const allSamples=[...W.sampleIds,...W.controls.map(c=>c.id)];
  const isControl=(s)=>W.controls.some(c=>c.id===s);

  useEffect(()=>{
    if(phase==='charging'||phase==='discharging'){
      ref.current=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),200);
    }
    return () => clearInterval(ref.current);
  },[phase,start]);

  const fmt=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const fmtBig=s=>{const m=Math.floor(s/60);const sec=s%60;return{m:m.toString().padStart(2,'0'),s:sec.toString().padStart(2,'0')};};
  const elMin=elapsed/60;
  const nextIv=phase==='discharging'?intervals.find(i=>i>elMin&&!completedReadings.includes(i)):null;
  const nextSec=nextIv?(nextIv*60)-elapsed:0;
  const isWarn=nextSec>0&&nextSec<=120;
  const allDone=phase==='discharging'&&completedReadings.length===intervals.length;
  const lastIv=intervals[intervals.length-1];

  const markReading=(iv)=>{
    if(!completedReadings.includes(iv)){
      setCompletedReadings(p=>[...p,iv]);
      setActiveInterval(iv);
      setFieldIdx(0);
      setPhase('entry');
    }
  };

  const finishEntry=()=>{
    setActiveInterval(null);
    setPhase('discharging');
  };

  const sv=(s,r,v)=>setEntryValues(p=>({...p,[`${activeInterval}-${s}-${r}`]:v}));
  const gv=(s,r)=>entryValues[`${activeInterval}-${s}-${r}`]||'';

  // Sweep sequence for entry: R1 left→right, R2 right→left
  const r1Order=allSamples.map(s=>({s,r:1}));
  const r2Order=[...allSamples].reverse().map(s=>({s,r:2}));
  const entrySequence=[...r1Order,...r2Order];
  const entryFieldCount=entrySequence.length;
  const entryIsR1=fieldIdx<allSamples.length;
  const entryCur=entrySequence[fieldIdx];
  const entryCurVal=entryCur?gv(entryCur.s,entryCur.r):'';
  const entryAllDone=fieldIdx>=entryFieldCount;
  const padKey=(k)=>{
    if(!entryCur)return;
    if(k==='backspace'){sv(entryCur.s,entryCur.r,entryCurVal.slice(0,-1));}
    else if(k==='.'){if(!entryCurVal.includes('.')){sv(entryCur.s,entryCur.r,entryCurVal+'.');}}
    else{sv(entryCur.s,entryCur.r,entryCurVal+k);}
  };
  const advanceField=()=>{if(fieldIdx<entryFieldCount-1){setFieldIdx(fieldIdx+1);}else{setFieldIdx(entryFieldCount);}};
  const goBackField=()=>{if(fieldIdx>0)setFieldIdx(fieldIdx-1);};

  return(
    <div style={{position:'fixed',inset:0,background:D.bg,zIndex:9999,fontFamily:D.sans,color:D.text,overflow:'hidden',WebkitTapHighlightColor:'transparent',display:'flex',flexDirection:'column'}}>
      {/* Compact top bar */}
      <div style={{padding:'8px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${D.border}`,background:D.surface,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:16}}>🌑</span>
          <span style={{fontSize:14,fontWeight:700,color:D.textBright}}>Dark Room</span>
          <span style={{color:D.textDim,fontSize:12}}>Test {W.testNum}</span>
          <span style={{color:D.textDim,fontSize:12}}>•</span>
          <span style={{color:D.textDim,fontSize:12}}>{W.lamp} — {W.grade} — {W.lux}lx</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:600,background:D.redGlow,color:D.red,border:`1px solid ${D.redDim}40`}}>DEMO</span>
          <button onClick={onExit} style={{padding:'6px 16px',borderRadius:6,background:D.surface,border:`1px solid ${D.border}`,color:D.text,fontSize:12,cursor:'pointer',fontFamily:D.sans}}>✕ Exit</button>
        </div>
      </div>

      {/* Content area — fills remaining height */}
      <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>

        {/* Phase: Setup */}
        {phase==='setup'&&(
          <div style={{textAlign:'center',maxWidth:700}}>
            <div style={{fontSize:36,marginBottom:12}}>💡</div>
            <div style={{fontSize:22,fontWeight:600,color:D.textBright,marginBottom:6}}>Ready to begin test {W.testNum}</div>
            <div style={{fontSize:14,color:D.text,marginBottom:16}}>{W.grade} — {allSamples.length} samples — {W.lux}lx / {W.chargeTime}min charge</div>
            <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:28}}>
              {allSamples.map(s=>(
                <span key={s} style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontFamily:D.mono,fontWeight:500,background:isControl(s)?`${D.amber}15`:D.surface,color:isControl(s)?D.amber:D.text,border:`1px solid ${isControl(s)?`${D.amber}40`:D.border}`}}>
                  {isControl(s)?'◆ ':''}{s}
                </span>
              ))}
            </div>
            <button onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('charging');}} style={{padding:'18px 56px',borderRadius:12,background:D.amber,color:'#000',fontSize:18,fontWeight:700,border:'none',cursor:'pointer',fontFamily:D.sans,boxShadow:`0 0 30px ${D.amberGlow}`}}>
              💡 Start Charging
            </button>
          </div>
        )}

        {/* Phase: Charging — landscape centered */}
        {phase==='charging'&&(
          <div style={{textAlign:'center',maxWidth:600}}>
            <div style={{fontSize:12,color:D.amberDim,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>⏱ Charging — Lamp On</div>
            <div style={{display:'flex',justifyContent:'center',alignItems:'baseline',gap:4,marginBottom:8}}>
              <span style={{fontSize:120,fontWeight:700,fontFamily:D.mono,color:D.textBright,lineHeight:1}}>{fmtBig(elapsed).m}</span>
              <span style={{fontSize:56,color:D.textDim}}>:</span>
              <span style={{fontSize:120,fontWeight:700,fontFamily:D.mono,color:D.textBright,lineHeight:1}}>{fmtBig(elapsed).s}</span>
            </div>
            <div style={{width:'100%',height:10,background:D.surface,borderRadius:5,margin:'0 auto 14px',overflow:'hidden',border:`1px solid ${D.border}`}}>
              <div style={{height:'100%',width:`${Math.min((elMin/W.chargeTime)*100,100)}%`,background:D.amber,borderRadius:5,transition:'width 0.5s',boxShadow:`0 0 10px ${D.amberGlow}`}}/>
            </div>
            <div style={{fontSize:16,color:D.text,marginBottom:24}}>
              {elMin>=W.chargeTime
                ?<span style={{color:D.green,fontWeight:700,fontSize:18}}>✓ Charge complete — turn off lamp</span>
                :`${Math.max(0,Math.ceil(W.chargeTime-elMin))} min remaining`
              }
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              {elMin>=W.chargeTime&&(
                <button onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('discharging');clearInterval(ref.current);}} style={{padding:'18px 44px',borderRadius:12,background:D.red,color:'#fff',fontSize:18,fontWeight:700,border:'none',cursor:'pointer',fontFamily:D.sans,boxShadow:`0 0 30px ${D.redGlow}`}}>
                  ⬛ Lamp Off — Start Discharge
                </button>
              )}
              {elMin<W.chargeTime&&(
                <button onClick={()=>{setStart(Date.now());setElapsed(0);setPhase('discharging');clearInterval(ref.current);}} style={{padding:'10px 24px',borderRadius:8,background:'transparent',border:`1px solid ${D.border}`,color:D.textDim,fontSize:13,cursor:'pointer',fontFamily:D.sans}}>
                  ⏭ Skip charge (demo)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase: Discharging — landscape: timer left, intervals right */}
        {phase==='discharging'&&(
          <div style={{display:'flex',gap:28,alignItems:'flex-start',width:'100%',maxWidth:960}}>
            {/* Left: Timer */}
            <div style={{flex:'0 0 auto',textAlign:'center',minWidth:300}}>
              <div style={{fontSize:11,color:isWarn?D.amber:D.textDim,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4,fontWeight:isWarn?700:400}}>
                {allDone?'✓ Complete':isWarn?'⚠ READING DUE':'Discharging'}
              </div>
              <div style={{display:'flex',justifyContent:'center',alignItems:'baseline',gap:3,marginBottom:6}}>
                <span style={{fontSize:88,fontWeight:700,fontFamily:D.mono,color:D.textBright,lineHeight:1}}>{fmtBig(elapsed).m}</span>
                <span style={{fontSize:44,color:D.textDim}}>:</span>
                <span style={{fontSize:88,fontWeight:700,fontFamily:D.mono,color:D.textBright,lineHeight:1}}>{fmtBig(elapsed).s}</span>
              </div>
              {nextIv&&!allDone&&(
                <div style={{fontSize:14,color:isWarn?D.amber:D.text,fontWeight:isWarn?600:400,marginBottom:8}}>
                  Next: <span style={{fontFamily:D.mono,fontWeight:700}}>{nextIv}min</span> in {fmt(nextSec)}
                </div>
              )}
              <div style={{width:'100%',height:6,background:D.surface,borderRadius:3,overflow:'hidden',border:`1px solid ${D.border}`,marginBottom:16}}>
                <div style={{height:'100%',width:`${Math.min((elMin/lastIv)*100,100)}%`,background:isWarn?D.amber:D.red,borderRadius:3,transition:'width 0.5s',boxShadow:`0 0 8px ${isWarn?D.amberGlow:D.redGlow}`}}/>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={()=>{
                  const nd=intervals.find(i=>!completedReadings.includes(i)&&i>elMin);
                  if(nd){setStart(Date.now()-(nd*60*1000+1000));}
                }} style={{padding:'8px 16px',borderRadius:8,background:'transparent',border:`1px solid ${D.border}`,color:D.textDim,fontSize:11,cursor:'pointer',fontFamily:D.sans}}>
                  ⏭ Skip to {intervals.find(i=>!completedReadings.includes(i)&&i>elMin)?`${intervals.find(i=>!completedReadings.includes(i)&&i>elMin)}min`:'next'} (demo)
                </button>
                {completedReadings.length>0&&(
                  <button onClick={()=>{setCompletedReadings([...intervals]);setStart(Date.now()-(lastIv*60*1000+1000));}} style={{padding:'8px 16px',borderRadius:8,background:'transparent',border:`1px solid ${D.border}`,color:D.textDim,fontSize:11,cursor:'pointer',fontFamily:D.sans}}>
                    ⏭⏭ Skip all (demo)
                  </button>
                )}
              </div>
            </div>

            {/* Right: Interval buttons */}
            <div style={{flex:1}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:10}}>
                {intervals.map(iv=>{
                  const done=completedReadings.includes(iv);
                  const due=elMin>=iv&&!done;
                  const upcoming=!done&&!due;
                  const isDue=nextIv===iv;
                  return(
                    <button key={iv} onClick={()=>due&&markReading(iv)} disabled={upcoming} style={{
                      padding:'18px 14px',borderRadius:12,border:`2px solid ${done?`${D.green}60`:due?(isWarn&&isDue?D.amber:`${D.red}80`):D.border}`,
                      background:done?`${D.green}12`:due?(isDue&&isWarn?`${D.amber}15`:`${D.red}10`):D.surface,
                      cursor:due?'pointer':'default',opacity:upcoming?0.4:1,transition:'all 0.3s',
                      textAlign:'center',fontFamily:D.sans,
                      boxShadow:due&&isDue?`0 0 20px ${isWarn?D.amberGlow:D.redGlow}`:'none',
                    }}>
                      <div style={{fontSize:36,fontWeight:800,fontFamily:D.mono,color:done?D.green:due?D.textBright:D.textDim}}>{iv}</div>
                      <div style={{fontSize:12,color:done?D.greenDim:due?D.text:D.textDim,marginTop:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                        {done?'✓ Recorded':due?'TAP TO RECORD':'Upcoming'}
                      </div>
                      {due&&isDue&&<div style={{marginTop:4,fontSize:10,color:isWarn?D.amber:D.red,fontWeight:600}}>
                        {isWarn?'⚠ Due now':'● Ready'}
                      </div>}
                    </button>
                  );
                })}
              </div>
              {/* All done inline */}
              {allDone&&(
                <div style={{textAlign:'center',marginTop:16,padding:'20px',borderRadius:12,background:`${D.green}08`,border:`2px solid ${D.green}40`}}>
                  <div style={{fontSize:18,fontWeight:700,color:D.green,marginBottom:4}}>✅ All Readings Complete</div>
                  <div style={{fontSize:12,color:D.text,marginBottom:12}}>Return to TeaBreak to review and finalise</div>
                  <button onClick={onExit} style={{padding:'12px 32px',borderRadius:10,background:D.surface,border:`1px solid ${D.border}`,color:D.textBright,fontSize:14,cursor:'pointer',fontFamily:D.sans}}>
                    Exit Dark Room
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase: Entry — landscape: sweep strip top, field+numpad side by side */}
        {phase==='entry'&&activeInterval&&(
          <div style={{width:'100%',maxWidth:960}}>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:28,fontWeight:800,fontFamily:D.mono,color:D.textBright}}>{activeInterval}min</span>
                {!entryAllDone&&<span style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:600,background:entryIsR1?`${D.red}20`:`${D.amber}20`,color:entryIsR1?D.red:D.amber}}>
                  {entryIsR1?'Sweep 1 → R1 (left to right)':'← Sweep 2 R2 (right to left)'}
                </span>}
              </div>
              <span style={{fontSize:11,color:D.textDim}}>
                {entryAllDone?'All entered':'Field '+(fieldIdx+1)+'/'+entryFieldCount}
              </span>
            </div>

            {/* Sweep strip */}
            <div style={{display:'flex',gap:3,marginBottom:14,overflowX:'auto',padding:'2px 0'}}>
              {entrySequence.map((f,i)=>{
                const active=i===fieldIdx;
                const done=i<fieldIdx;
                const val=gv(f.s,f.r);
                const ctrl=isControl(f.s);
                const sweepBorder=i<allSamples.length?D.red:D.amber;
                return(
                  <button key={`${f.s}-${f.r}`} onClick={()=>setFieldIdx(i)} style={{
                    padding:'5px 6px',borderRadius:6,minWidth:52,textAlign:'center',cursor:'pointer',fontFamily:D.sans,flexShrink:0,
                    border:`2px solid ${active?sweepBorder:done?`${D.green}50`:D.border}`,
                    background:active?`${sweepBorder}20`:done?`${D.green}08`:D.surface,
                    opacity:(!done&&!active)?0.4:1,
                  }}>
                    <div style={{fontSize:7,color:ctrl?D.amberDim:D.textDim,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:56}}>
                      {f.s.length>10?f.s.slice(-8):f.s}
                    </div>
                    <div style={{fontSize:7,color:D.textDim}}>R{f.r}</div>
                    <div style={{fontSize:11,fontWeight:700,fontFamily:D.mono,color:done?D.green:active?D.textBright:D.textDim,minHeight:14}}>
                      {val||'—'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main area: field display left, numpad right */}
            {!entryAllDone&&entryCur&&(
              <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
                {/* Left: Active field display */}
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{padding:'24px 28px',borderRadius:14,background:D.surface,border:`3px solid ${entryIsR1?D.red:D.amber}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <span style={{fontSize:36,color:isControl(entryCur.s)?D.amber:D.textBright,fontFamily:D.mono,fontWeight:800,letterSpacing:'0.02em'}}>{entryCur.s}</span>
                      <span style={{padding:'8px 20px',borderRadius:12,fontSize:20,fontWeight:700,background:entryIsR1?`${D.red}25`:`${D.amber}25`,color:entryIsR1?D.red:D.amber}}>
                        {entryIsR1?'→ R1':'← R2'}
                      </span>
                    </div>
                    <div style={{fontSize:110,fontWeight:800,fontFamily:D.mono,color:entryCurVal?D.textBright:D.textDim,minHeight:130,display:'flex',alignItems:'center',justifyContent:'center',letterSpacing:'-0.02em'}}>
                      {entryCurVal||'0'}
                      <span style={{width:4,height:80,background:entryIsR1?D.red:D.amber,marginLeft:4,animation:'blink 1s infinite'}}/>
                    </div>
                    <div style={{fontSize:16,color:D.textDim,textAlign:'center',marginTop:4}}>mcd/m²</div>
                  </div>
                  {/* Context: what's already entered for this sample */}
                  <div style={{padding:'10px 14px',borderRadius:8,background:D.surface,border:`1px solid ${D.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:14,color:D.textDim,textTransform:'uppercase'}}>This sample at {activeInterval}min</span>
                      <div style={{display:'flex',gap:14}}>
                        <span style={{fontSize:18,color:gv(entryCur.s,1)?D.textBright:D.textDim,fontFamily:D.mono}}>R1: {gv(entryCur.s,1)||'—'}</span>
                        <span style={{fontSize:18,color:gv(entryCur.s,2)?D.textBright:D.textDim,fontFamily:D.mono}}>R2: {gv(entryCur.s,2)||'—'}</span>
                        <span style={{fontSize:20,fontWeight:700,fontFamily:D.mono,color:(gv(entryCur.s,1)&&gv(entryCur.s,2))?D.green:D.textDim}}>Avg: {(gv(entryCur.s,1)&&gv(entryCur.s,2))?((parseFloat(gv(entryCur.s,1))+parseFloat(gv(entryCur.s,2)))/2).toFixed(1):'—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Numpad */}
                <div style={{flex:'0 0 320px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
                    {['7','8','9','4','5','6','1','2','3','.','0','backspace'].map(k=>(
                      <button key={k} onClick={()=>padKey(k)} style={{
                        padding:'20px 6px',borderRadius:10,fontSize:k==='backspace'?20:30,fontWeight:700,
                        fontFamily:k==='backspace'?D.sans:D.mono,
                        background:D.surface,border:`1px solid ${D.border}`,color:D.textBright,
                        cursor:'pointer',userSelect:'none',WebkitUserSelect:'none',
                      }}>
                        {k==='backspace'?'⌫':k}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:5,marginTop:5}}>
                    <button onClick={goBackField} disabled={fieldIdx===0} style={{
                      padding:'18px',borderRadius:10,fontSize:16,fontWeight:600,
                      background:D.surface,border:`1px solid ${D.border}`,color:fieldIdx===0?D.textDim:D.text,
                      cursor:fieldIdx===0?'default':'pointer',fontFamily:D.sans,opacity:fieldIdx===0?0.4:1,
                    }}>
                      ← Back
                    </button>
                    <button onClick={advanceField} style={{
                      padding:'18px',borderRadius:10,fontSize:16,fontWeight:600,
                      background:entryCurVal?D.green:`${D.green}40`,color:entryCurVal?'#000':D.textDim,
                      border:'none',cursor:'pointer',fontFamily:D.sans,
                      boxShadow:entryCurVal?`0 0 15px ${D.green}30`:'none',
                    }}>
                      {fieldIdx<entryFieldCount-1?'Next →':'✓ Done'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* All entered — summary */}
            {entryAllDone&&(
              <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                  {allSamples.map(s=>{
                    const ctrl=isControl(s);
                    const r1=parseFloat(gv(s,1)),r2=parseFloat(gv(s,2));
                    const avg=(!isNaN(r1)&&!isNaN(r2))?((r1+r2)/2).toFixed(1):null;
                    return(
                      <div key={s} style={{padding:'10px 14px',borderRadius:8,background:ctrl?`${D.amber}08`:D.surface,border:`1px solid ${ctrl?`${D.amber}30`:D.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:12,fontWeight:600,fontFamily:D.mono,color:ctrl?D.amber:D.textBright}}>{s}</span>
                        <div style={{display:'flex',gap:20,alignItems:'center'}}>
                          <span style={{fontSize:12,color:D.textDim}}>R1: <span style={{color:D.textBright,fontFamily:D.mono}}>{gv(s,1)||'—'}</span></span>
                          <span style={{fontSize:12,color:D.textDim}}>R2: <span style={{color:D.textBright,fontFamily:D.mono}}>{gv(s,2)||'—'}</span></span>
                          <span style={{fontSize:18,fontWeight:700,fontFamily:D.mono,color:avg?D.green:D.textDim}}>{avg||'—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={finishEntry} style={{flex:'0 0 auto',padding:'18px 32px',borderRadius:12,background:D.green,color:'#000',fontSize:15,fontWeight:700,border:'none',cursor:'pointer',fontFamily:D.sans,boxShadow:`0 0 20px ${D.green}40`,alignSelf:'center'}}>
                  ✓ Save {activeInterval}min<br/>
                  <span style={{fontSize:11,fontWeight:500}}>Return to Timer</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN MODULE SHELL
   ═══════════════════════════════════════ */
const NAV=[
  {id:'dashboard',label:'Dashboard',icon:'📊'},
  {id:'schedule',label:'Schedule',icon:'📋'},
  {id:'entry',label:'Data Entry',icon:'✏️'},
  {id:'results',label:'Results',icon:'🔬'},
  {id:'batches',label:'Batch Acceptance',icon:'✓'},
  {id:'config',label:'Configuration',icon:'⚙'},
];

export default function LuminanceTestingModule(){
  const [view,setView]=useState('dashboard');
  const [showDemo,setShowDemo]=useState(false);
  const [showDarkRoom,setShowDarkRoom]=useState(false);
  const [demoStep,setDemoStep]=useState('request');
  const demoIdx=STEPS.findIndex(s=>s.id===demoStep);
  const DemoStep=WF_MAP[demoStep];

  return(
    <div style={{fontFamily:T.f,background:T.bg,minHeight:'calc(100vh - var(--embed-offset))',color:T.n9}}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* Dark Room Mode — full screen takeover */}
      {showDarkRoom&&<DarkRoomMode onExit={()=>setShowDarkRoom(false)}/>}

      {/* Header */}
      <div style={{background:T.primary800,padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:18,fontWeight:700,color:T.primary200,letterSpacing:'-0.02em'}}>☕ TeaBreak</span>
          <span style={{color:T.primary400,fontSize:14}}>›</span>
          <span style={{color:'#fff',fontSize:14,fontWeight:500}}>Custom Tools</span>
          <span style={{color:T.primary400,fontSize:14}}>›</span>
          <span style={{color:T.primary200,fontSize:14,fontWeight:600}}>Luminance Testing</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:12,color:T.primary300}}>Ecoglo International</span>
          <div style={{width:32,height:32,borderRadius:'50%',background:T.primary600,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:600}}>SH</div>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{background:'white',borderBottom:`1px solid ${T.n2}`,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:0}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setView(n.id);setShowDemo(false);setShowDarkRoom(false);}} style={{padding:'12px 18px',fontSize:13,fontWeight:view===n.id&&!showDemo?600:400,color:view===n.id&&!showDemo?T.primary600:T.n5,background:'none',border:'none',borderBottom:view===n.id&&!showDemo?`2px solid ${T.primary600}`:'2px solid transparent',cursor:'pointer',fontFamily:T.f,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn v="secondary" sz="md" onClick={()=>{setShowDarkRoom(true);setShowDemo(false);}} style={{borderRadius:20,gap:8,background:'#1a1a1a',color:'#ff6b6b',border:'1px solid #333'}}>
            🌑 Dark Room Mode
          </Btn>
          <Btn v="demo" sz="md" onClick={()=>{setShowDemo(true);setShowDarkRoom(false);setDemoStep('request');}} style={{borderRadius:20,gap:8}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#a5b4fc',animation:'pulse 2s infinite'}}/>
            🔬 Workflow Demo
          </Btn>
        </div>
      </div>

      <div style={{padding:'20px 24px',maxWidth:1400,margin:'0 auto'}}>

        {/* Demo overlay */}
        {showDemo&&(
          <div>
            {/* Demo banner */}
            <div style={{marginBottom:16,padding:'14px 20px',background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',borderRadius:T.rl,display:'flex',alignItems:'center',justifyContent:'space-between',color:'white'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{fontSize:20}}>🔬</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>Workflow Demo Mode</div>
                  <div style={{fontSize:12,opacity:0.85}}>Walking through a complete S20 batch test — {W.testNum}</div>
                </div>
              </div>
              <Btn v="secondary" sz="sm" onClick={()=>setShowDemo(false)} style={{background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}>✕ Exit Demo</Btn>
            </div>

            <WfStepper step={demoStep} onClick={setDemoStep}/>

            <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:`#6366f118`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{STEPS[demoIdx].i}</div>
              <div>
                <h2 style={{fontSize:16,fontWeight:700,margin:0}}>Step {demoIdx+1}: {STEPS[demoIdx].l}</h2>
                <p style={{fontSize:12,color:T.n5,margin:'2px 0 0'}}>{STEPS[demoIdx].d}</p>
              </div>
            </div>

            <DemoStep/>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,paddingTop:14,borderTop:`1px solid ${T.n2}`}}>
              <Btn v="secondary" sz="md" onClick={()=>demoIdx>0&&setDemoStep(STEPS[demoIdx-1].id)} disabled={demoIdx===0}>← {demoIdx>0?STEPS[demoIdx-1].l:'Back'}</Btn>
              <div style={{fontSize:12,color:T.n4}}>Step {demoIdx+1} of {STEPS.length}</div>
              {demoIdx<STEPS.length-1?<Btn v="demo" sz="md" onClick={()=>setDemoStep(STEPS[demoIdx+1].id)}>{STEPS[demoIdx+1].l} →</Btn>:<Btn v="success" sz="md" onClick={()=>setShowDemo(false)}>✓ End Demo</Btn>}
            </div>
          </div>
        )}

        {/* Regular module pages */}
        {!showDemo&&(<>
          <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:20,fontWeight:700,margin:0}}>{NAV.find(n=>n.id===view)?.label}</h1>
              <p style={{fontSize:13,color:T.n5,margin:'4px 0 0'}}>
                {view==='dashboard'&&'Overview of testing activity, schedules, and control availability'}
                {view==='schedule'&&'Manage test requests, dark conditioning & scheduling'}
                {view==='entry'&&'Transcribe readings from paper test sheets'}
                {view==='results'&&'Browse and analyse luminance test results'}
                {view==='batches'&&'Pigment & carrier batch acceptance and CodeMark evaluation'}
                {view==='config'&&'Test methods, equipment, controls, and formula configuration'}
              </p>
            </div>
          </div>
          {view==='dashboard'&&<DashboardPage onNav={v=>setView(v)}/>}
          {view==='schedule'&&<SchedulePage/>}
          {view==='entry'&&<DataEntryPage/>}
          {view==='results'&&<ResultsPage/>}
          {view==='batches'&&<BatchPage/>}
          {view==='config'&&<ConfigPage/>}
        </>)}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
