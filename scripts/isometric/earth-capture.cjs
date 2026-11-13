// Capture Google Earth 3D views of venues: node earth-capture.cjs id1 id2 ...  (all if none)
const {chromium}=require(require('path').join(__dirname,'../../node_modules/playwright'));
const fs=require('fs');const W=(process.env.ISOMETRIC_CITIES||require('os').homedir()+'/isometric-cities')+'/outputs/csm';const CFG=__dirname;
const seeds=JSON.parse(fs.readFileSync(CFG+'/seeds.json'));
const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(seeds);
const FOV=10;
const hideUI=async p=>p.evaluate(()=>{const gp=document.querySelector('flt-glass-pane');const sr=gp&&gp.shadowRoot;
  if(sr&&!sr.querySelector('style[data-csm]')){const st=document.createElement('style');st.dataset.csm=1;st.textContent='canvas,flt-paragraph,flt-picture,flt-clip,img{visibility:hidden!important}';sr.appendChild(st);}
  const c=document.getElementById('earth-canvas');if(c)c.style.visibility='visible';});
const showUI=async p=>p.evaluate(()=>{const sr=document.querySelector('flt-glass-pane')?.shadowRoot;sr?.querySelector('style[data-csm]')?.remove();});
(async()=>{
const ctx=await chromium.launchPersistentContext((process.env.ISOMETRIC_CITIES||require('os').homedir()+'/isometric-cities')+'/outputs/earth-profile',{channel:'chromium',headless:true,viewport:{width:1600,height:1000},args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=ctx.pages()[0]||await ctx.newPage();let styled=false;
for(const id of ids){
  const prep=JSON.parse(fs.readFileSync(`${W}/venues/${id}/prep.json`));
  let z=60;try{z=JSON.parse(fs.readFileSync(`${W}/venues/${id}/src2/capture/source.json`)).focus_elevation_m}catch{}
  const SCALE={'olympic-stadium':1.35,'edmonton-expo-centre':1.8};const [lat,lon]=prep.target_centre||prep.centre;const scale=SCALE[id]||prep.scale;const heading=prep.view==='SE'?315:225;
  const d=(320/scale)/Math.tan(FOV/2*Math.PI/180);
  const url=`https://earth.google.com/web/@${lat.toFixed(6)},${lon.toFixed(6)},${z.toFixed(1)}a,${d.toFixed(0)}d,${FOV}y,${heading}h,55t,0r`;
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(9000);
  if(!styled){await p.evaluate(()=>document.querySelector('flt-semantics-placeholder')?.click());await p.waitForTimeout(1500);
    for(const n of ['Close','Dismiss']){const b=p.getByRole('button',{name:n,exact:true}).first();if(await b.count())await b.click({force:true}).catch(()=>{});await p.waitForTimeout(800);}
    await p.getByRole('button',{name:/Basemap settings/}).first().click({force:true});await p.waitForTimeout(1500);
    await p.getByRole('radio',{name:/Clean/}).first().click({force:true});await p.waitForTimeout(1000);
    await p.getByRole('button',{name:'Close',exact:true}).first().click({force:true}).catch(()=>{});styled=true;await p.waitForTimeout(1500);}
  else{for(const n of ['Close','Dismiss']){const b=p.getByRole('button',{name:n,exact:true}).first();if(await b.count().catch(()=>0))await b.click({force:true}).catch(()=>{});}}
  await hideUI(p);
  let prev=null,stable=0;
  for(let i=0;i<20&&stable<2;i++){await p.waitForTimeout(2500);const buf=await p.screenshot();if(prev&&Buffer.compare(prev,buf)===0)stable++;else stable=0;prev=buf;}
  fs.mkdirSync(`${W}/venues/${id}/earth`,{recursive:true});
  fs.writeFileSync(`${W}/venues/${id}/earth/raw.png`,prev);fs.writeFileSync(`${W}/venues/${id}/earth/url.txt`,url+'\n');
  console.log(id,'stable='+stable,url);await showUI(p);
}
await ctx.close()})().catch(e=>{console.error(e);process.exit(1)});
