// review #2 #12: old (pre-3.4) stage stars carry over to the new acad/tech layout by words. Usage: node tools/test_remap.js
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../js/app.js', 'utf8');
const f = src.slice(src.indexOf('export function remapStages'), src.indexOf('setOnTrackLoad(')).replace('export ', '');
const remapStages = eval('(' + f.replace(/^function remapStages/, 'function') + ')');
let bad = 0;
for (const t of ['acad', 'tech']) {
  const d = JSON.parse(fs.readFileSync(`${__dirname}/../data/${t}.json`, 'utf8')), P = d.prev.stages;
  const old = {}; P.slice(0, 20).forEach((_, i) => old[i] = { games: {}, stars: i === 3 ? 2 : 3, cleared: true, plays: 1 });
  const out = remapStages(old, P, d.stages), cl = Object.keys(out).length;
  const done = new Set(P.slice(0, 20).flat());
  const ok = d.stages.every((s, j) => !!out[j] === s.every(n => done.has(n)));
  const two = d.stages.findIndex(s => s.some(n => P[3].includes(n)));
  console.log(t, 'old cleared 20 →', cl, 'new stages cleared', ok ? 'OK' : 'MISMATCH', 'stage with old#3 stars', out[two] && out[two].stars);
  if (!ok || !cl || (out[two] && out[two].stars !== 2)) bad++;
}
console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
