// axe-core WCAG 2.1 A/AA scan of grades/map/me/games per profile (adapted from review #4 harness). EQ_URL=... G=1,5 node tools/test_a11y.js
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const fs=require('fs'); const AXE=fs.readFileSync('/tmp/pw/node_modules/axe-core/axe.min.js','utf8');
const BASE=process.env.EQ_URL||'https://dudidd-wq.github.io/english-quest', OUT='/tmp/a11y'; fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const HE={1:'א׳',2:'ב׳',3:'ג׳',5:'ה׳',8:'ח׳'}; const TR={acad:'אקדמי',tech:'טכנולוגית',c1:'C1',c2:'C2'};
const wipe=p=>p.evaluate(()=>new Promise(r=>{localStorage.clear();const q=indexedDB.deleteDatabase('englishQuest');q.onsuccess=q.onerror=q.onblocked=()=>r();}));
const log=[]; const hosts=new Set(); const L=s=>{log.push(s);console.log(s);};
async function axe(p,tag){ await p.addScriptTag({content:AXE}); const r=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa']});return r.violations.map(v=>v.impact+':'+v.id+'('+v.nodes.length+')'+(v.nodes[0]?.target||'')+(v.impact==='serious'||v.impact==='critical'?' :: '+(v.nodes[0]?.any[0]?.message||'').slice(0,160):''))}); L(tag+' AXE '+(r.join(' | ')||'none')); }
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required','--no-sandbox']});
 for (const prof of (process.env.G||'1,3,5,8,acad,tech,c1,c2').split(',')){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'he-IL'}); const p=await ctx.newPage(); const tag='g'+prof;
  const audio=[]; p.on('request',r=>{hosts.add(new URL(r.url()).host); if(/audio\/(he|en)\//.test(r.url())) audio.push(r.url().split('/audio/')[1]);});
  p.on('pageerror',e=>L(tag+' PAGEERROR '+e.message)); p.on('response',r=>{if(r.status()>=400)L(tag+' HTTP '+r.status()+' '+r.url())}); p.on('console',m=>{if(m.type()==='error')L(tag+' CONSOLE '+m.text().slice(0,150))});
  await p.goto(BASE+'/manifest.webmanifest'); await wipe(p); await p.goto(BASE+'/#/',{waitUntil:'networkidle'});
  if(prof==='1'){ await axe(p,'grades'); await p.screenshot({path:`${OUT}/grades.png`});
    // keyboard: tab to first grade button, enter
    const foc=[]; for(let i=0;i<4;i++){await p.keyboard.press('Tab'); foc.push(await p.evaluate(()=>{const e=document.activeElement;const c=getComputedStyle(e);return (e.getAttribute('aria-label')||e.innerText||e.tagName).slice(0,20)+'['+c.outlineStyle+' '+c.outlineWidth+' '+c.boxShadow.slice(0,30)+']'}));} L('kbd focus '+JSON.stringify(foc)); }
  const adult=isNaN(+prof);
  await p.click(adult?'button.gradebtn.wide':`button.gradebtn[aria-label="כיתה ${HE[prof]}"]`);
  if(adult){await p.waitForSelector('button.track-card'); await sleep(300); await p.locator('button.track-card',{hasText:TR[prof]}).first().click();}
  else if(prof==='8'){}
  await sleep(400); if(await p.$('button.track-card')&&!adult){ await p.locator('button.track-card').first().click(); await sleep(300);}
  await p.fill('input.name','בודק'); await p.click('button.avpick'); await p.waitForSelector('.mapv .hud'); await sleep(900);
  await p.screenshot({path:`${OUT}/${tag}-map.png`});
  const mt=await p.evaluate(()=>({daily:!!document.querySelector('.daily-card'),rival:!!document.querySelector('.rival-chip'),hud:document.querySelector('.hud')?.innerText.replace(/\s+/g,' ').slice(0,120),ch:[...document.querySelectorAll('.wbanner')].map(x=>x.innerText.replace(/\s+/g,' ').slice(0,60)),top:document.body.innerText.replace(/\s+/g,' ').slice(0,260)}));
  L(tag+' MAP '+JSON.stringify(mt));
  await axe(p,tag+' map');
  const pf=await p.evaluate(async()=>{const g=await import('./js/games.js');return [g.practiceFor(0),g.practiceFor(8)]}); L(tag+' practiceFor(0),(8) '+JSON.stringify(pf));
  const playLoop=async(name)=>{ for(let step=0;step<150;step++){
    const s=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)]; if(document.querySelector('.rbox'))return 'done';
      const opts=q('.opts .opt:not([disabled])'); if(opts.length){(opts.find(b=>b._ok)||opts[0]).click();return 'opt';}
      const tiles=q('button.tile:not([disabled])'); if(tiles.length){const e=tiles.find(t=>t.side==='en');const hh=e&&tiles.find(t=>t.side==='he'&&t.w.n===e.w.n);if(e&&hh){e.click();hh.click();}return 'match';}
      const mc=q('button.mcard:not(.open):not(.matched)'); if(mc.length){const a=mc[0],b=mc.find(x=>x!==a&&x.c.w.n===a.c.w.n);a.click();b&&b.click();return 'mem';}
      const intro=document.querySelector('.intro .navbtns .btn.primary'); if(intro){intro.click();return 'intro';}
      const heart=document.querySelector('.modal .btn.ghost'); if(heart){heart.click();return 'heart';} return 'wait';});
    if(step===2) await p.screenshot({path:`${OUT}/${tag}-${name}-play.png`});
    if(step===2 && name!=='intro') await axe(p,tag+' '+name+' game');
    if(s==='done'){await sleep(1000); await p.screenshot({path:`${OUT}/${tag}-${name}-result.png`}); L(tag+' '+name+' RESULT '+(await p.evaluate(()=>document.querySelector('.rbox').innerText.replace(/\s+/g,' ').slice(0,200)))); return true;}
    await sleep(s==='wait'?300:(name==='match'?150:700)); } L(tag+' '+name+' NOT DONE'); return false; };
  const xp0=await p.evaluate(async()=>{const s=await import('./js/store.js');return s.S?.profile?.xp??null}).catch(()=>null);
  await p.goto(BASE+'/#/play/0/intro'); await sleep(1200); await playLoop('intro');
  await axe(p,tag+' result');
  const games=[...new Set(['match',...pf[0].filter(g=>g!=='match')])].slice(0,2);
  for(const g of games){ await p.goto(BASE+'/#/stage/0'); await sleep(500); await p.goto(BASE+'/#/play/0/'+g); await sleep(1500); await playLoop(g); }
  await p.goto(BASE+'/#/map'); await sleep(800);
  const after=await p.evaluate(()=>document.querySelector('.hud')?.innerText.replace(/\s+/g,' ').slice(0,120)); L(tag+' HUD after '+after);
  if(prof==='1'||prof==='acad'){ await p.goto(BASE+'/#/me'); await sleep(800); const t=await p.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.innerText).filter(x=>/הורים/.test(x))); L(tag+' parents btn '+JSON.stringify(t)); await axe(p,tag+' me');
    await p.goto(BASE+'/#/parent'); await sleep(800); await p.screenshot({path:`${OUT}/${tag}-parent.png`}); await axe(p,tag+' parent'); }
  L(tag+' audio '+audio.length+' '+JSON.stringify(audio.slice(0,12)));
  await ctx.close();
 }
 L('hosts '+[...hosts].join(','));
 const ser=log.filter(s=>/AXE .*(serious|critical):/.test(s)); L('SERIOUS '+ser.length); await b.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
