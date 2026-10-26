// review #4: hunt for the one-off console 404 after profile creation. Logs every HTTP>=400, failed request and console error
// (page + service worker with PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1) for fresh profiles; GS=1,5,9,101..104 (101+ = adult track #).
const {chromium}=require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const BASE=process.env.EQ_URL||'https://dudidd-wq.github.io/english-quest';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for (const g of (process.env.GS||'1,5,9').split(',').map(Number)) { const c=await b.newContext();
c.on('response',r=>{if(r.status()>=400)console.log(g,'HTTP',r.status(),r.url())});
c.on('requestfailed',r=>console.log(g,'FAIL',r.url(),r.failure()?.errorText));
const p=await c.newPage();p.on('console',m=>{if(m.type()==='error')console.log(g,'CON',m.text(),JSON.stringify(m.location()))});
await p.goto(BASE+'/#/',{waitUntil:'networkidle'});
await (g>100? p.click('button.gradebtn.wide').then(()=>p.locator('button.track-card').nth(g-101).click()) : p.click(`button.gradebtn[aria-label="כיתה ${['','א׳','','','','ה׳','','','','ט׳'][g]}"]`)).catch(e=>console.log('click',g,e.message.slice(0,80)));
await p.fill('input.name','x'); await p.click('button.avpick'); await p.waitForSelector('.mapv .hud',{timeout:15000});
await p.waitForTimeout(4000); await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(3000); await c.close(); }
console.log('END');await b.close();})();
