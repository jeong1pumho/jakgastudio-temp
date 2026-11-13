const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='test';
const event={id:'11111111-1111-4111-8111-111111111111',event_date:'2026-12-01',category:'meeting',title:'독서 <모임> $&',start_time:'18:00:00',end_time:'20:00:00'};
let scheduleRows=[event], scheduleFailure=false;
global.fetch=async url=>{
 const params=new URL(url).searchParams;
 const upcoming=params.get('category')==='in.(meeting,custom)';
 if(upcoming){
  assert.match(params.get('or'),/^\(event_date\.gt\.\d{4}-\d{2}-\d{2},and\(event_date\.eq\.\d{4}-\d{2}-\d{2},end_time\.gt\.\d{2}:\d{2}:\d{2}\)\)$/);
  assert.equal(params.get('select'),'id,event_date,title,start_time,end_time');
  if(scheduleFailure)return {ok:false,status:503,text:async()=>'private failure details'};
 }
 return {ok:true,status:200,text:async()=>JSON.stringify(upcoming?scheduleRows:[]),headers:{get:()=>null}};
};
async function run(page){let body,headers={};await require('./lib/handlers/home')({method:'GET',headers:{host:'jakgastudio-temp.vercel.app'},query:{page}},{status(n){assert.equal(n,200);return this},setHeader(k,v){headers[k]=v;return this},send(s){body=s;return this}});assert.match(headers['X-Robots-Tag'],/noindex/);assert.equal((body.match(/name="twitter:title"/g)||[]).length,1);assert.equal((body.match(/property="og:image"/g)||[]).length,1);const graph=JSON.parse(body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];assert(graph.some(x=>x['@type']==='BookStore'));return body;}
(async()=>{
 for(const page of ['home','space','programs','visit'])await run(page);
 const calendar=await run('calendar');
 assert.match(calendar,/<section class="calendar-upcoming"/);
 assert(calendar.includes('<a href="/calendar/events/'+event.id+'">독서 &lt;모임&gt; $&amp;</a>'));
 assert(calendar.includes('datetime="2026-12-01T18:00:00+09:00"'));
 assert(calendar.includes('datetime="2026-12-01T20:00:00+09:00"'));
 assert(!calendar.includes('일정을 불러오는 중입니다.'));
 scheduleRows=[];
 assert((await run('calendar')).includes('현재 예정된 공개 모임·행사가 없습니다.'));
 scheduleFailure=true;
 const failure=await run('calendar');
 assert(failure.includes('예정된 모임·행사를 불러오지 못했습니다.'));
 assert(failure.includes('id="sc-next"'));
 assert(!failure.includes('private failure details'));
 const {sharing}=require('./lib/search-info');
 assert(!sharing('https://example.com','"><script>','test').includes('<script>'));
 console.log('PASS: entity graph, sharing tags, noindex, calendar HTML, escaping, empty and unavailable states');
})().catch(e=>{console.error(e);process.exitCode=1});
