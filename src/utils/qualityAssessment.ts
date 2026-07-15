import { qualityStandards } from '../data/qualityStandards';
import type { FoodQualityRecord, ParameterKey, QualityStatus, QualityStandard, QualityStandardsMap } from '../types/quality';

type Result = { status: QualityStatus; quality_score: number; failed_parameters: string[]; warning_parameters: string[]; missing_parameters: string[] };
const labels: Record<ParameterKey,string> = { ph:'pH', water_activity:'Water activity', moisture_percent:'Moisture', temperature_c:'Temperature' };
export const rangeWarningBounds=(min:number,max:number,warningPercent:number)=>{const edge=(max-min)*(warningPercent/100);return{lowerEnd:min+edge,upperStart:max-edge}};
export const maximumWarningStart=(max:number,warningPercent:number)=>max-Math.abs(max)*(warningPercent/100);
const rangeState = (value:number, min:number, max:number,warningPercent:number): 'pass'|'warning'|'fail' => {
  if (value < min || value > max) return 'fail';
  const bounds=rangeWarningBounds(min,max,warningPercent);
  return value <= bounds.lowerEnd || value >= bounds.upperStart ? 'warning' : 'pass';
};
const maxState = (value:number, max:number,warningPercent:number): 'pass'|'warning'|'fail' => value > max ? 'fail' : value >= maximumWarningStart(max,warningPercent) ? 'warning' : 'pass';

export function assessQuality(record: FoodQualityRecord,standards:QualityStandardsMap=qualityStandards): Result {
  const required: ParameterKey[] = ['ph','water_activity','moisture_percent','temperature_c'];
  const missing = required.filter(k => record[k] == null).map(k => labels[k]);
  const standard = standards[record.product_name];
  if (!standard) return { status:'INCOMPLETE', quality_score:0, failed_parameters:[], warning_parameters:[], missing_parameters: [...missing,'Unsupported product'] };
  const states: [ParameterKey, 'pass'|'warning'|'fail'][] = [];
  if (record.ph != null) states.push(['ph',rangeState(record.ph,standard.ph.min,standard.ph.max,standard.warningMarginPercent)]);
  if (record.water_activity != null) states.push(['water_activity',maxState(record.water_activity,standard.waterActivity.max,standard.warningMarginPercent)]);
  if (record.moisture_percent != null) states.push(['moisture_percent',rangeState(record.moisture_percent,standard.moisture.min,standard.moisture.max,standard.warningMarginPercent)]);
  if (record.temperature_c != null) states.push(['temperature_c',maxState(record.temperature_c,standard.temperature.max,standard.warningMarginPercent)]);
  const failed = states.filter(([,s])=>s==='fail').map(([k])=>labels[k]);
  const warning = states.filter(([,s])=>s==='warning').map(([k])=>labels[k]);
  const status: QualityStatus = missing.length ? 'INCOMPLETE' : failed.length ? 'FAIL' : warning.length ? 'WARNING' : 'PASS';
  return { status, quality_score:Math.max(0,100-failed.length*25-warning.length*5-missing.length*15), failed_parameters:failed, warning_parameters:warning, missing_parameters:missing };
}
export const assessRecord = (record:FoodQualityRecord,standards:QualityStandardsMap=qualityStandards): FoodQualityRecord => ({...record,...assessQuality(record,standards)});
export function parameterStandard(key:ParameterKey, standard:QualityStandard) {
  if (key==='ph') return `${standard.ph.min}–${standard.ph.max}`;
  if (key==='water_activity') return `≤ ${standard.waterActivity.max}`;
  if (key==='moisture_percent') return `${standard.moisture.min}–${standard.moisture.max}%`;
  return `≤ ${standard.temperature.max}°C`;
}
