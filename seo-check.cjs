'use strict';
// Offline SEO release guard. Run: node seo-check.cjs
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://fixture.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='fixture';
const core=require('./lib/core');
const uuid='11111111-1111-4111-8111-111111111111';
const eventUuid='22222222-2222-4222-8222-222222222222';
const queries=[];
core.query=async path=>{
 queries.push(path);
 if(path.includes('recommended_books'))return [
  {id:uuid,updated_at:'2026-11-15T01:00:00Z'},
  {id:'not-valid',updated_at:'2026-11-15T01:00:00Z'}
 ];
 if(path.includes('news_posts'))return [
  {slug:'news-100',status:'ongoing',published_at:'2026-11-15T01:00:00Z',updated_at:'2026-11-15T02:00:00Z'},
  {slug:'news-101',status:'ended',published_at:'2026-11-14T01:00:00Z',updated_at:'2026-11-14T01:00:00Z'},
  {slug:'draft',status:'draft',published_at:null},
  {slug:'bad/slug',status:'ongoing',published_at:'2026-11-15T01:00:00Z'}
 ];
 if(path.includes('schedule_events'))return [
  {id:eventUuid,event_date:'2026-11-18',category:'meeting',updated_at:'2026-11-15T02:00:00Z'},
  {id:'33333333-3333-4333-8333-333333333333',event_date:'2026-11-18',category:'rental',updated_at:'2026-11-15T02:00:00Z'}
 ];
 throw Error('Unexpected query: '+path);
};
const sitemap=require('./api/sitemap');
const rss=require('./lib/rss');
const robots=require('./api/robots');
function capture(host) {
 const result={};
 const response={
  status(n){result.status=n;return this},
  setHeader(n,v){(result.headers??={})[n]=v;return this},
  send(v){result.body=v;return this},
  end(v){result.body=v;return this}
 };
 robots({method:'GET',headers:{host}},response);
 return result;
}
async function main(){
 const now=new Date('2026-11-16T03:00:00Z');
 assert.equal(sitemap.koreaToday(now),'2026-11-16');
 const xml=await sitemap.build(now);
 const locs=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
 assert.equal(locs.length,14); // 11 stable URLs + 1 book + 2 NEWS
 assert.equal(new Set(locs).size,locs.length);
 assert(locs.every(url=>url.startsWith('https://www.jakgastudio.com/')));
 assert(!locs.includes('https://www.jakgastudio.com/programs'));
 assert(!locs.some(url=>url.includes('temp.vercel.app')||url.includes('/admin')));
 assert(locs.includes('https://www.jakgastudio.com/programs/bookstore'));
 assert(locs.includes('https://www.jakgastudio.com/news/news-100'));
 assert(locs.includes('https://www.jakgastudio.com/news/news-101'));
 assert(locs.includes('https://www.jakgastudio.com/books/'+uuid));
 assert(!locs.some(url=>url.includes('/calendar/events/')));
 assert(!locs.some(url=>url.includes('draft')||url.includes('bad/slug')));
 assert(xml.includes('<lastmod>2026-11-15T02:00:00.000Z</lastmod>'));
 assert(queries.some(q=>q.includes('&offset=0')));
 const live=capture('www.jakgastudio.com'),test=capture('jakgastudio-temp.vercel.app');
 assert(live.body.includes('Sitemap: https://www.jakgastudio.com/sitemap.xml'));
 assert(live.body.includes('Disallow: /admin'));
 assert(!test.body.includes('Sitemap:'));
 assert.equal(live.status,200);
 const feed=rss.build([
  {slug:'news-100',title:'제주 & 책',content:'<p>공개 전체 본문</p>',published_at:'2026-11-15T02:00:00Z',status:'ongoing'},
  {slug:'draft',title:'비공개',content:'secret',status:'draft',published_at:null}
 ]);
 assert(feed.includes('<title>제주 &amp; 책</title>'));
 assert(feed.includes('<![CDATA[<p>공개 전체 본문</p>]]>'));
 assert(!feed.includes('secret'));
 // Structured data regression checks; do not include unverified Event prices.
 const base='https://www.jakgastudio.com';
 const graph=require('./lib/search-info').graph(base,{'@type':'WebPage',url:base+'/'});
 const shop=graph['@graph'].find(node=>node['@type']==='BookStore');
 assert(shop);
 assert.deepEqual(shop.openingHoursSpecification.dayOfWeek,['Tuesday','Wednesday','Thursday','Friday','Saturday']);
 assert.equal(shop.openingHoursSpecification.opens,'09:00');
 assert.equal(shop.openingHoursSpecification.closes,'17:00');
 const programData=require('./lib/programs-page');
 for(const program of programData.programs){
  const page=programData.schema(base,program,program.title);
  const steps=page.breadcrumb.itemListElement;
  assert.equal(steps[0].item,base+'/');
  assert.equal(steps[1].item,base+'/programs/'+program.slug);
  assert(steps.every(item=>item.item!==base+'/programs'));
  if(program.slug!=='bookstore'){
   assert.equal(page.mainEntity['@type'],'Service');
   assert.equal(page.mainEntity.serviceType,program.title);
   assert.equal(page.mainEntity.provider['@id'],shop['@id']);
   assert.equal(page.mainEntity.areaServed.name,'제주특별자치도');
  }
 }
 const about=require('./lib/author-page').schema(base,'작가 소개','소개');
 assert.equal(about.mainEntity['@type'],'Person');
 assert.equal(about.mainEntity.subjectOf,undefined);
 assert.equal(about.mentions.length,2);
 for(const book of about.mentions){
  assert.equal(book['@type'],'Book');
  assert.equal(book.author['@id'],about.mainEntity['@id']);
  assert(book.sameAs.startsWith('https://www.yes24.com/product/goods/'));
 }
 const {eventGraph}=require('./lib/news-event');
 const post={title:'독서모임',operator_type:'studio',event_date_start:'2026-11-18',price_krw:null};
 const url=base+'/news/news-100';
 const sample={id:eventUuid,event_date:'2026-11-18',start_time:'10:00:00',end_time:'12:00:00'};
 const node=eventGraph(post,[sample],url,'독서모임','')[0];
 assert.equal(node.startDate,'2026-11-18T10:00:00+09:00');
 assert.equal(node.url,url);
 assert(!node.offers);
 for(const price of [0,30000])assert.equal(eventGraph({...post,price_krw:price},[],url,'','')[0].offers.price,price);
 assert.deepEqual(eventGraph({...post,operator_type:'rental'},[],url,'',''),[]);
 assert.deepEqual(eventGraph({...post,event_date_start:null},[],url,'',''),[]);
 const indexnow=require('./lib/indexnow');
 const bypass=await indexnow.notify({headers:{host:'jakgastudio-temp.vercel.app'}},['/news']);
 assert.equal(bypass.skipped,'non-production');
 console.log('PASS: canonical sitemap, dynamic NEWS/books/events, pagination, robots, RSS, test-only no-IndexNow');
}
main().catch(e=>{console.error(e);process.exitCode=1});
