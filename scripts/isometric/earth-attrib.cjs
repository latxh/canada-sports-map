// Read Google Earth's imagery attribution for each captured view: writes venues/<id>/earth/credit.txt
const {chromium}=require(require('path').join(__dirname,'../../node_modules/playwright'));
const fs=require('fs');const W=(process.env.ISOMETRIC_CITIES||require('os').homedir()+'/isometric-cities')+'/outputs/csm';const CFG=__dirname;
const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(JSON.parse(fs.readFileSync(CFG+'/seeds.json')));
(async()=>{
const ctx=await chromium.launchPersistentContext((process.env.ISOMETRIC_CITIES||require('os').homedir()+'/isometric-cities')+'/outputs/earth-profile-attrib',{channel:'chromium',headless:true,viewport:{width:1600,height:1000},args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=ctx.pages()[0]||await ctx.newPage();
for(const id of ids){
  const f=`${W}/venues/${id}/earth/url.txt`;if(!fs.existsSync(f)){console.log(id,'no url');continue}
  await p.goto(fs.readFileSync(f,'utf8').trim(),{waitUntil:'domcontentloaded'});await p.waitForTimeout(14000);
  await p.evaluate(()=>document.querySelector('flt-semantics-placeholder')?.click());await p.waitForTimeout(1500);
  for(const n of ['Close','Dismiss']){const b=p.getByRole('button',{name:n,exact:true}).first();if(await b.count())await b.click({force:true}).catch(()=>{});await p.waitForTimeout(600);}
  await p.waitForTimeout(4000);
  const credit=await p.evaluate(()=>{const els=[...document.querySelectorAll('flt-semantics')];const t=els.map(e=>(e.getAttribute('aria-label')||e.textContent||'').trim()).find(x=>/^Google\s+\S/.test(x)&&x.length<200);return t||''});
  fs.writeFileSync(`${W}/venues/${id}/earth/credit.txt`,credit+'\n');console.log(id,'|',credit);
}
await ctx.close()})();
