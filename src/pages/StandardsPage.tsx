import {CheckCircle2,Pencil,RotateCcw,Save,ShieldCheck,X} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {standardsDisclaimer} from '../data/qualityStandards';
import {useQualityData} from '../hooks/useQualityData';
import type {QualityStandard,QualityStandardsMap} from '../types/quality';
import {cloneStandards,validateStandards} from '../utils/standards';

type Field='phMin'|'phMax'|'waterMax'|'moistureMin'|'moistureMax'|'temperatureMax'|'warningMargin';
const inputConfig:{field:Field;label:string;step:string}[]=[
  {field:'phMin',label:'pH minimum',step:'0.01'},{field:'phMax',label:'pH maximum',step:'0.01'},
  {field:'waterMax',label:'Water activity maximum',step:'0.001'},{field:'moistureMin',label:'Moisture minimum %',step:'0.1'},
  {field:'moistureMax',label:'Moisture maximum %',step:'0.1'},{field:'temperatureMax',label:'Temperature maximum C',step:'0.1'},
  {field:'warningMargin',label:'Warning margin %',step:'1'},
];
const fieldValue=(standard:QualityStandard,field:Field)=>field==='phMin'?standard.ph.min:field==='phMax'?standard.ph.max:field==='waterMax'?standard.waterActivity.max:field==='moistureMin'?standard.moisture.min:field==='moistureMax'?standard.moisture.max:field==='temperatureMax'?standard.temperature.max:standard.warningMarginPercent;

export function StandardsPage(){
  const{records,standards,standardsStorageWarning,saveStandards,resetStandards}=useQualityData();
  const[draft,setDraft]=useState<QualityStandardsMap>(()=>cloneStandards(standards));const[editing,setEditing]=useState(false);const[notice,setNotice]=useState('');
  useEffect(()=>{if(!editing)setDraft(cloneStandards(standards))},[standards,editing]);
  const errors=useMemo(()=>validateStandards(draft),[draft]);const hasErrors=Object.keys(errors).length>0;
  const update=(product:string,field:Field,value:number)=>setDraft(current=>{const next=cloneStandards(current);const standard=next[product];if(field==='phMin')standard.ph.min=value;else if(field==='phMax')standard.ph.max=value;else if(field==='waterMax')standard.waterActivity.max=value;else if(field==='moistureMin')standard.moisture.min=value;else if(field==='moistureMax')standard.moisture.max=value;else if(field==='temperatureMax')standard.temperature.max=value;else standard.warningMarginPercent=value;return next});
  const save=()=>{if(hasErrors)return;if(saveStandards(draft)){setEditing(false);setNotice(`Standards saved. ${records.length} current samples were reassessed.`)}};
  const cancel=()=>{setDraft(cloneStandards(standards));setEditing(false);setNotice('')};
  const restore=()=>{if(!window.confirm('Restore all demonstration standards and warning margins to their defaults?'))return;resetStandards();setEditing(false);setNotice(`Default standards restored. ${records.length} current samples were reassessed.`)};

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Assessment reference</p><h2 className="page-title">Product Quality Standards</h2><p className="page-subtitle">Edit demonstration limits and product-level warning margins. Changes immediately reassess the active dataset.</p></div><div className="flex flex-wrap gap-2">{editing?<><button className="btn-primary" disabled={hasErrors} onClick={save}><Save size={16}/>Save and reassess</button><button className="btn-secondary" onClick={cancel}><X size={16}/>Cancel</button></>:<><button className="btn-primary" onClick={()=>{setEditing(true);setNotice('')}}><Pencil size={16}/>Edit standards</button><button className="btn-secondary" onClick={restore}><RotateCcw size={16}/>Restore defaults</button></>}</div></div>
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Browser-only configuration.</strong> Custom standards are stored only in this browser. Uploaded data remains session-only and is never sent to a server. For range limits, the warning margin applies inside both boundaries; for maximum-only limits, it applies immediately below the maximum.</div>
    {notice&&<div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 size={18}/>{notice}</div>}
    {standardsStorageWarning&&<div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{standardsStorageWarning}</div>}
    <div className="grid gap-5 md:grid-cols-2">{Object.entries(draft).map(([product,standard])=><article className={`card overflow-hidden ${errors[product]?'ring-1 ring-rose-300':''}`} key={product}>
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><span className="rounded-lg bg-navy-100 p-2 text-navy-700"><ShieldCheck size={20}/></span><h3 className="font-bold">{product}</h3></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{standard.warningMarginPercent}% warning margin</span></div>
      {editing?<div className="grid gap-4 p-5 sm:grid-cols-2">{inputConfig.map(config=><label key={config.field} className="field-label">{config.label}<input aria-label={`${product} ${config.label}`} type="number" step={config.step} className="input mt-1" value={fieldValue(standard,config.field)} onChange={event=>update(product,config.field,event.target.value===''?Number.NaN:Number(event.target.value))}/></label>)}{errors[product]&&<ul className="space-y-1 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 sm:col-span-2">{errors[product].map(error=><li key={error}>{error}</li>)}</ul>}</div>:<dl className="grid grid-cols-2 gap-y-4 p-5 text-sm"><dt className="text-slate-500">pH range</dt><dd className="text-right font-semibold">{standard.ph.min}–{standard.ph.max}</dd><dt className="text-slate-500">Water activity maximum</dt><dd className="text-right font-semibold">≤ {standard.waterActivity.max}</dd><dt className="text-slate-500">Moisture range</dt><dd className="text-right font-semibold">{standard.moisture.min}–{standard.moisture.max}%</dd><dt className="text-slate-500">Temperature maximum</dt><dd className="text-right font-semibold">≤ {standard.temperature.max}°C</dd><dt className="text-slate-500">Warning margin</dt><dd className="text-right font-semibold">{standard.warningMarginPercent}% inside limits</dd></dl>}
    </article>)}</div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong>Important:</strong> {standardsDisclaimer}<br/>The standards in this demonstration dashboard are illustrative only. Real specifications must be defined by the manufacturer, applicable food legislation, validated processes and approved quality documentation.</div>
  </div>;
}
