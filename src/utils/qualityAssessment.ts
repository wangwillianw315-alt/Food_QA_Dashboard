import { qualityStandards } from '../data/qualityStandards';
import type { FoodQualityRecord, ParameterKey, QualityStatus, QualityStandard } from '../types/quality';

type Result = { status: QualityStatus; quality_score: number; failed_parameters: string[]; warning_parameters: string[]; missing_parameters: string[] };
const labels: Record<ParameterKey,string> = { ph:'pH', water_activity:'Water activity', moisture_percent:'Moisture', temperature_c:'Temperature' };
const rangeState = (value:number, min:number, max:number): 'pass'|'warning'|'fail' => {
  if (value < min || value > max) return 'fail';
  const edge = (max-min)*0.1;
  return value <= min+edge || value >= max-edge ? 'warning' : 'pass';
};
const maxState = (value:number, max:number): 'pass'|'warning'|'fail' => value > max ? 'fail' : value >= max*0.9 ? 'warning' : 'pass';

export function assessQuality(record: FoodQualityRecord): Result {
  const required: ParameterKey[] = ['ph','water_activity','moisture_percent','temperature_c'];
  const missing = required.filter(k => record[k] == null).map(k => labels[k]);
  const standard = qualityStandards[record.product_name];
  if (!standard) return { status:'INCOMPLETE', quality_score:0, failed_parameters:[], warning_parameters:[], missing_parameters: [...missing,'Unsupported product'] };
  const states: [ParameterKey, 'pass'|'warning'|'fail'][] = [];
  if (record.ph != null) states.push(['ph',rangeState(record.ph,standard.ph.min,standard.ph.max)]);
  if (record.water_activity != null) states.push(['water_activity',maxState(record.water_activity,standard.waterActivity.max)]);
  if (record.moisture_percent != null) states.push(['moisture_percent',rangeState(record.moisture_percent,standard.moisture.min,standard.moisture.max)]);
  if (record.temperature_c != null) states.push(['temperature_c',maxState(record.temperature_c,standard.temperature.max)]);
  const failed = states.filter(([,s])=>s==='fail').map(([k])=>labels[k]);
  const warning = states.filter(([,s])=>s==='warning').map(([k])=>labels[k]);
  const status: QualityStatus = missing.length ? 'INCOMPLETE' : failed.length ? 'FAIL' : warning.length ? 'WARNING' : 'PASS';
  return { status, quality_score:Math.max(0,100-failed.length*25-warning.length*5-missing.length*15), failed_parameters:failed, warning_parameters:warning, missing_parameters:missing };
}
export const assessRecord = (record:FoodQualityRecord): FoodQualityRecord => ({...record,...assessQuality(record)});
export function parameterStandard(key:ParameterKey, standard:QualityStandard) {
  if (key==='ph') return `${standard.ph.min}–${standard.ph.max}`;
  if (key==='water_activity') return `≤ ${standard.waterActivity.max}`;
  if (key==='moisture_percent') return `${standard.moisture.min}–${standard.moisture.max}%`;
  return `≤ ${standard.temperature.max}°C`;
}
