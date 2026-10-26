const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core'); // live smoke check
(async () => {
  const B='https://dudidd-wq.github.io/english-quest/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--mute-audio'] }); const p = await (await b.newContext()).newPage(); const errs=[];
  p.on('console', m => m.type()==='error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => r.status()>=400 && errs.push(r.status()+' '+r.url()));
  await p.goto(B, {waitUntil:'networkidle'}); await p.waitForTimeout(3000);
  const sw = await p.evaluate(async()=>{const r=await fetch('sw.js',{cache:'no-store'});return (await r.text()).match(/eq-[\d.]+/)[0]});
  const keys = await p.evaluate(()=>caches.keys());
  const chk = await p.evaluate(async()=>{const o={};for(const u of ['data/abc.json','data/early.json','data/acad.json','data/tech.json','data/c2.json','data/c1.json','audio/en/33094.mp3','audio/he/33159.mp3','audio/he/11130.mp3','audio/he/40080.mp3','audio/en/42015.mp3','audio/en/20001.mp3','audio/he/31001.mp3','audio/en/32300.mp3']){o[u]=(await fetch(u,{cache:'no-store'})).status}
   const t=await (await fetch('data/tech.json',{cache:'no-store'})).json(); o.techSrc=t.source.slice(0,60); o.pulse=t.words.find(w=>w.n===31277); const c1=await (await fetch('data/c1.json',{cache:'no-store'})).json(); o.c1=c1.words.length; o.flourish=(c1.words.find(w=>w.n===33159)||{}).he; return o});
  const btns = await p.$$eval('button.gradebtn', bs=>bs.map(b=>b.getAttribute('aria-label')));
  console.log(JSON.stringify({sw,keys,chk,btns,errs}));
  await b.close();
})();
