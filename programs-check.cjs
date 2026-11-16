const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='test';
const fixture=Array.from({length:4},(_,i)=>({slug:'case-'+i,title:i?'행사 '+i:'<script>test</script>',images:['/assets/program-reading.jpg'],cover_index:0,event_date_start:'2026-11-01',event_type:'themed'}));
const {render}=require('./lib/programs-page');let html=render(fixture);
assert.equal((html.match(/class="program-case"/g)||[]).length,3);assert(!html.includes('<script>test'));assert(html.includes('/news/case-0'));assert(html.includes('/news?operator=rental'));assert(html.includes('대관 행사'));assert(html.includes('주제모임'));assert(!render([]).includes('이미지 예시'));
let request;
global.fetch=async url=>{
 request=new URL(url);
 return {ok:true,text:async()=>JSON.stringify(fixture.slice(0,3))};
};
const handler=require('./lib/handlers/home');
async function call(query,host='www.jakgastudio.com'){
 const headers={};
 const res={status(n){this.statusCode=n;return this},setHeader(k,v){headers[k]=v},send(body){this.body=body},end(){}};
 await handler({method:'GET',headers:{host},query},res);
 return {res,headers};
}
(async()=>{
 const redirect=await call({page:'programs'});
 assert.equal(redirect.res.statusCode,308);
 assert.equal(redirect.headers.Location,'/programs/bookstore');
 const {programs}=require('./lib/programs-page');
 for(const program of programs){
  request=undefined;
  const {res,headers}=await call({page:'program-detail',program:program.slug});
  assert.equal(res.statusCode,200);
  assert.equal((res.body.match(/<h1>/g)||[]).length,1);
  assert.equal((res.body.match(/class="program-editorial-nav-link/g)||[]).length,5);
  assert(res.body.includes('rel="canonical" href="https://www.jakgastudio.com/programs/'+program.slug+'"'));
  assert(!headers['X-Robots-Tag'].includes('noindex'));
  for(const [i, photo] of program.photos.entries()){
   assert.equal(photo,'/assets/'+program.slug+'-photo-'+(i+1)+'.webp');
   assert(res.body.includes('<img src="'+photo+'"'));
   assert(require('fs').existsSync('.'+photo));
  }
  assert(res.body.includes('property="og:image" content="https://www.jakgastudio.com'+program.photos[0]+'"'));
  if(program.slug==='space-rental'){
   assert.equal(request.searchParams.get('operator_type'),'eq.rental');
   assert.equal(request.searchParams.get('status'),'in.(ongoing,ended)');
   assert.equal(request.searchParams.get('limit'),'3');
   assert(request.searchParams.get('order').startsWith('event_date_start.desc.nullslast'));
   assert.equal((res.body.match(/class="program-case"/g)||[]).length,3);
  }else assert.equal(request,undefined);
 }
 const preview=await call({page:'program-detail',program:'bookstore'},'jakgastudio-preview.vercel.app');
 assert.match(preview.headers['X-Robots-Tag'],/noindex/);
 assert.equal((await call({page:'program-detail',program:'missing'})).res.statusCode,404);
 console.log('PASS: program redirect, five detail pages, image order, sharing metadata, rental cases and robots');
})().catch(error=>{console.error(error);process.exitCode=1});
