const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const fixtures=[
 {id:id(1),sort_order:0,event_date_start:'2026-11-14',published_at:'2026-11-01'},
 {id:id(2),sort_order:0,event_date_start:'2026-11-01',published_at:'2026-11-15'},
 {id:id(3),sort_order:0,event_date_start:'2026-10-01',event_date_end:'2026-11-15'},
 {id:id(4),sort_order:2,event_date_start:'2026-10-01'},
 {id:id(5),sort_order:0,event_date_start:null,published_at:'2026-11-16'},
 {id:id(6),sort_order:0,event_date_start:'2026-11-14',published_at:'2026-11-02'}
];
const calls=[];
const query=async url=>{
 calls.push(url);assert(url.includes('published_at=not.is.null'));assert(url.includes('status=eq.ended'));
 if(url.includes('id=in.'))return fixtures.filter(row=>url.includes(row.id)).reverse();
 const offset=Number(new URL('https://example.test'+url).searchParams.get('offset'));
 return fixtures.slice(offset,offset+200);
};
const context={module:{exports:{}},require:()=>({query,selected:'*'})};
vm.runInNewContext(fs.readFileSync(__dirname+'/lib/news-order.js','utf8'),context);
(async()=>{
 const {compareEnded,loadEnded}=context.module.exports;
 assert.deepEqual(fixtures.slice().sort(compareEnded).map(x=>x.id),[4,3,6,1,2,5].map(id));
 const page=await loadEnded(2,2);
 assert.deepEqual(Array.from(page.items,x=>x.id),[6,1].map(id));assert.equal(page.total,6);assert.equal(page.pages,3);
 await assert.rejects(loadEnded(4,2),error=>error.status===404);
 calls.length=0;await loadEnded(1,3,true);assert(calls.every(url=>url.includes('operator_type=eq.rental')));
 console.log('PASS: priority override, range/day date merge, null dates last, stable ties, pagination before body fetch, rental filter');
})().catch(e=>{console.error(e);process.exitCode=1});
