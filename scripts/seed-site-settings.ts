import features from '../src/data/dashboard-features.json';
import config from '../src/config/config';
import { homepageData } from '../src/data/homepage';
import { contactConfig } from '../src/data/contact';
import { originalLandmarks } from '../src/data/landmarks';
import { buildingOpening } from '../src/data/buildingData';
import { projectVideo } from '../src/data/video';
const q = (value: unknown) => `'${JSON.stringify(value).replace(/'/g, "''")}'`;
const settings: Record<string, unknown> = {
  sidebar_features_list: features,
  identity: {
    primaryColor: config.colors.main, secondaryColor: '#ce994d', typography: 'Inter',
    contactEmail: contactConfig.email, contactPhone: contactConfig.phone,
    socialFacebook: contactConfig.social.facebook || '', socialInstagram: contactConfig.social.instagram || '',
    logoHorizontal: '/identity/livigno-logo.png', logoWhite: '/identity/livigno-logo-negative.png',
    logoBlack: '/identity/livigno-logo.png', isotipo: '/identity/livigno-logo.png', isotipoWhite: '/identity/livigno-logo-negative.png',
  },
  site_homepage: homepageData,
  site_contact: contactConfig,
  site_landmarks: originalLandmarks,
  site_building_opening: buildingOpening,
  site_project_video: projectVideo,
};
for (const [key, value] of Object.entries(settings)) console.log(`INSERT OR IGNORE INTO global_settings (id,config,updated_at) VALUES ('${key}',${q(value)},unixepoch());`);
