import type { QualityStandard } from '../types/quality';
export const qualityStandards: Record<string, QualityStandard> = {
  Milk: { productName:'Milk', ph:{min:6.5,max:6.8}, waterActivity:{max:0.99}, moisture:{min:85,max:90}, temperature:{max:5} },
  Yoghurt: { productName:'Yoghurt', ph:{min:4,max:4.6}, waterActivity:{max:0.98}, moisture:{min:75,max:88}, temperature:{max:5} },
  'Protein Bar': { productName:'Protein Bar', ph:{min:5.5,max:7}, waterActivity:{max:0.65}, moisture:{min:5,max:15}, temperature:{max:25} },
  'Fruit Juice': { productName:'Fruit Juice', ph:{min:2.8,max:4.2}, waterActivity:{max:0.99}, moisture:{min:85,max:95}, temperature:{max:8} },
};
export const standardsDisclaimer = 'These limits are demonstration values only and must not be used as official regulatory or commercial specifications.';
