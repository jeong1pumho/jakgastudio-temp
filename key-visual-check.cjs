const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const template=fs.readFileSync('lib/home-template.html','utf8'),{render}=require('./lib/key-visual-render');
const initial=require('./lib/key-visual-initial.json'),optimized=require('./lib/key-visual-optimized.json');
const fresh={desktop:'https://qrbavxempotptnmflqoq.supabase.co/storage/v1/object/public/key-visual/11111111-1111-4111-8111-111111111111.webp',mobile:'https://qrbavxempotptnmflqoq.supabase.co/storage/v1/object/public/key-visual/22222222-2222-4222-8222-222222222222.webp',alt:'"<script>안전</script>'};
for(const n of [1,3,10]){const html=render(template,[{slides:Array.from({length:n},()=>fresh)}]);assert.equal((html.match(/class="kv-dot" data-slide=/g)||[]).length,n);assert.equal((html.match(/class="kv-slide" role=/g)||[]).length,n+2);assert.equal((html.match(/loading="eager"/g)||[]).length,1);assert.equal((html.match(/rel="preload" as="image"/g)||[]).length,2);assert(html.includes(fresh.desktop));assert(!html.includes('<script>안전'));assert(!html.includes("fetch('/api/key-visual')"));assert(!html.includes('src="/assets/kv-20261109'));}
const reordered=render(template,[{slides:[initial[2],initial[0]]}]);assert(reordered.includes('href="'+optimized[initial[2].desktop].desktop+'"'));assert(render(template,[]).includes(optimized[initial[0].desktop].desktop));
const elements=new Map(),outputs=[],uploads=[];let saved;
function element(id){if(elements.has(id))return elements.get(id);const e={value:'50',min:'25',children:[],style:{},dataset:{},classList:{toggle(){}},listeners:{},addEventListener(n,fn){this.listeners[n]=fn},async fire(n,v={}){return this.listeners[n]?.(v)},append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v},setAttribute(){},querySelectorAll(){return []},getContext(){return {drawImage(){},fillRect(){},strokeRect(){}}},getBoundingClientRect(){return {left:0,top:0,width:650,height:433}},setPointerCapture(){},hasPointerCapture(){return true},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},click(){return this.fire('click')},toBlob(cb,type,quality){outputs.push({width:this.width,height:this.height,type,quality});cb(new Blob(['optimized'],{type}))}};elements.set(id,e);return e;}
let counter=0;const original={name:'33333333-3333-4333-8333-333333333333.jpg',desktop:[30,40,70],mobile:[60,40,80]};
const fixture=[{...fresh,original},{...initial[0],original:{...original,name:'44444444-4444-4444-8444-444444444444.jpg'}}];
const ctx={document:{getElementById:element,createElement:t=>element(t+'-'+counter++)},window:{JAKAdminSession:{read:()=> 'test-token',token:async()=> 'test-token'}},Image:class{naturalWidth=6000;naturalHeight=4000;async decode(){}},URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}},Blob,crypto:require('crypto').webcrypto,console,fetch:async(url,opt={})=>{
 if(url.includes('/storage/')){uploads.push({url,opt});return {ok:true,blob:async()=>new Blob(['original'],{type:'image/jpeg'})};}
 if(url.includes('config'))return {ok:true,json:async()=>({url:'https://qrbavxempotptnmflqoq.supabase.co',key:'test'})};
 if(opt.method==='PUT'){saved=JSON.parse(opt.body);return {ok:true,json:async()=>({revision:8})};}
 return {ok:true,json:async()=>({slides:fixture,revision:7})};}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/key-visual-admin.js','utf8'),ctx);
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{await tick();assert.equal(element('list').children.length,2);
 await element('list').children[0].children[1].children[3].click();assert(element('cropDialog').open);assert.equal(Number(element('cropX').value),30);
 await element('acceptCrop').click();assert.equal(Number(element('cropX').value),60);await element('acceptCrop').click();assert(!element('cropDialog').open);
 assert.deepEqual(outputs.map(x=>[x.width,x.height,x.type]),[[2560,1440,'image/webp'],[360,203,'image/webp'],[1080,1920,'image/webp']]);assert(outputs.every(x=>x.quality===.84 || x.quality===.72));
 await element('list').children[0].children[1].children[1].click();await element('publish').click();assert.equal(saved.revision,7);assert.equal(saved.slides[1].original.name,original.name);assert.deepEqual(saved.slides[1].original.desktop,original.desktop);assert.deepEqual(saved.slides[1].original.mobile,original.mobile);assert(saved.slides[1].desktop.endsWith('.webp'));assert(saved.slides[1].mobile.endsWith('.webp'));assert(saved.slides[1].thumbnail.endsWith('.webp'));assert(uploads.filter(x=>x.opt.method==='POST').every(x=>x.opt.headers['Content-Type']==='image/webp'));
 await element('list').children[1].children[1].children[5].click();assert.equal(element('list').children.length,1);
 console.log('PASS: SSR first-image preload, 1–10 slides, legacy Vercel preview mapping, escaping; admin original reopen, separate crops, WebP desktop/mobile/thumbnail, upload MIME, reorder, publish revision, removal');
})().catch(e=>{console.error(e);process.exitCode=1});
