import { buildingFaces } from '../src/data/buildingData';
const q = (v: string | undefined) => v == null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;
for (const [index, f] of buildingFaces.entries()) {
  console.log(`INSERT OR IGNORE INTO building_faces (id,name,day_background,day_background_video,day_highlight,day_intro_video,day_to_left_transition,day_to_right_transition,night_background,night_background_video,night_highlight,night_intro_video,night_to_left_transition,night_to_right_transition,day_to_night_transition,night_to_day_transition,"order") VALUES (${f.id},${q(f.name)},${q(f.day.background)},${q(f.day.backgroundVideo)},${q(f.day.highlight)},${q(f.day.introVideo)},${q(f.day.transitions.toLeft)},${q(f.day.transitions.toRight)},${q(f.night.background)},${q(f.night.backgroundVideo)},${q(f.night.highlight)},${q(f.night.introVideo)},${q(f.night.transitions.toLeft)},${q(f.night.transitions.toRight)},${q(f.dayToNightTransition)},${q(f.nightToDayTransition)},${index});`);
}
