import { resolve } from 'node:path';

export const PROJECT_ROOT = resolve(process.cwd());
export const PUBLIC_PLANTS_DIR = resolve(PROJECT_ROOT, 'public/plants/details');
export const REFERENCE_DIR = '/Users/andrespluska/Downloads/4. TIPOLOGÍAS COMPLETO';

export interface TypologyMeta {
  type: string;
  ids: string[];
  dimensions: number;
  bedrooms: number;
  bathrooms: number;
  subtitle: string;
  galleryCount: number;
  referenceFolderName: string;
  isDuplex?: boolean;
}

export const TYPOLOGIES: TypologyMeta[] = [
  {
    type: 'T1',
    ids: ['201'],
    dimensions: 71.23,
    bedrooms: 3,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 10,
    referenceFolderName: 'T1 - FLAT 201',
  },
  {
    type: 'T2',
    ids: ['202', '302', '402', '502', '602', '702', '802', '902', '1002'],
    dimensions: 61.8,
    bedrooms: 2,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T2 - FLAT 202 - 1002',
  },
  {
    type: 'T3',
    ids: ['203'],
    dimensions: 40.52,
    bedrooms: 1,
    bathrooms: 1,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T3 - FLAT 203',
  },
  {
    type: 'T4',
    ids: ['301', '401', '501', '601', '701', '801', '901', '1001', '1101', '1201', '1301', '1401', '1501'],
    dimensions: 72.22,
    bedrooms: 3,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 10,
    referenceFolderName: 'T4 - FLAT 301',
  },
  {
    type: 'T5',
    ids: ['303', '403', '503', '603', '703', '803', '903', '1003', '1103'],
    dimensions: 40.52,
    bedrooms: 1,
    bathrooms: 1,
    subtitle: 'Flat',
    galleryCount: 6,
    referenceFolderName: 'T5 - FLAT 303',
  },
  {
    type: 'T6',
    ids: ['1102'],
    dimensions: 61.8,
    bedrooms: 2,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T6 - FLAT 1102',
  },
  {
    type: 'T7',
    ids: ['1202'],
    dimensions: 56.69,
    bedrooms: 2,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T7 - FLAT 1202',
  },
  {
    type: 'T8',
    ids: ['1203', '1303'],
    dimensions: 40.0,
    bedrooms: 1,
    bathrooms: 1,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T8 - FLAT 1203 - 1303',
  },
  {
    type: 'T9',
    ids: ['1302'],
    dimensions: 53.34,
    bedrooms: 2,
    bathrooms: 1,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T9 - FLAT 1302',
  },
  {
    type: 'T10',
    ids: ['1402'],
    dimensions: 76.71,
    bedrooms: 2,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 9,
    referenceFolderName: 'T10 - FLAT 1402',
  },
  {
    type: 'T11',
    ids: ['1502', '1602'],
    dimensions: 76.71,
    bedrooms: 2,
    bathrooms: 2,
    subtitle: 'Flat',
    galleryCount: 7,
    referenceFolderName: 'T11 - FLAT 1502 - 1602',
  },
  {
    type: 'T12',
    ids: ['1601'],
    dimensions: 105.31,
    bedrooms: 4,
    bathrooms: 2.5,
    subtitle: 'Dúplex',
    galleryCount: 14,
    referenceFolderName: 'T12 - DUPLEX 1601',
    isDuplex: true,
  },
];

export const TOTAL_UNITS = 42;
export const TOTAL_GALLERY_IMAGES = 98;
export const TOTAL_REFERENCE_PLANS = 39;
export const TOTAL_PRODUCTION_TRANSITIONS = 78;

export const EXPECTED_IMAGE_WIDTH = 3840;
export const EXPECTED_IMAGE_HEIGHT = 2160;

export const EXPECTED_VIDEO_WIDTH = 1920;
export const EXPECTED_VIDEO_HEIGHT = 1080;
export const EXPECTED_VIDEO_FPS = 60.0;
export const EXPECTED_VIDEO_DURATION_SEC = 2.5;

export const TRANSITION_CODE_MAP = {
  '01_A_a_E': 'furnished_to_unfurnished',
  '02_CAD_a_A': 'plans_to_furnished',
  '03_CAD_a_E': 'plans_to_unfurnished',
  '04_E_a_A': 'unfurnished_to_furnished',
  '05_A_a_CAD': 'furnished_to_plans',
  '06_E_a_CAD': 'unfurnished_to_plans',
} as const;

export const ALL_TRANSITION_NAMES = [
  'furnished_to_unfurnished',
  'unfurnished_to_furnished',
  'furnished_to_plans',
  'plans_to_furnished',
  'plans_to_unfurnished',
  'unfurnished_to_plans',
] as const;

export const SOLD_UNIT_IDS = ['1501', '1202', '1002', '801', '703', '401'] as const;
