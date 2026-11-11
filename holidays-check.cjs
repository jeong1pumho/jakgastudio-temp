'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {holidaysForYear,holidayName}=require('./lib/holidays'),ui=require('./lib/home-content');
// KASI 2027 calendar reference: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
const dates=['01-01','02-06','02-07','02-08','02-09','03-01','05-01','05-03','05-05','05-13','06-06','07-17','07-19','08-15','08-16','09-14','09-15','09-16','10-03','10-04','10-09','10-11','12-25','12-27'];
assert.deepEqual(Object.keys(holidaysForYear(2027)),dates.map(d=>'2027-'+d));
assert.equal(holidayName('2026-09-28'),''); // Chuseok Saturday does not trigger a substitute.
assert.equal(holidayName('2027-06-07'),''); // Memorial Day has no substitute.
for(let y=2026;y<=2050;y++){const h=holidaysForYear(y);assert(Object.keys(h).length>=17);for(const [d,name] of Object.entries(h)){assert.equal(new Date(d+'T00:00:00Z').toISOString().slice(0,10),d);if(name.includes('대체공휴일'))assert(![0,6].includes(new Date(d).getUTCDay()));}}
assert.equal(ui.dayEvents('2026-12-25',[])[0].category,'closure');
assert.equal(ui.dayEvents('2027-02-09',[])[0].category,'closure');
assert(ui.dayEvents('2026-12-24',[]).every(e=>e.category==='free'));
const event={event_date:'2026-12-25',category:'meeting',title:'등록한 모임',start_time:'14:00',end_time:'16:00'};
assert.deepEqual(ui.dayEvents(event.event_date,[event]),[event]);
class E{constructor(tag){this.tag=tag;this.children=[];this.classList={add(){}};}appendChild(e){this.children.push(e)}append(...e){this.children.push(...e)}replaceChildren(){this.children=[]}setAttribute(){}addEventListener(){}}
async function render(search,items=[]){const els={},host={querySelector:s=>s.startsWith('#')?(els[s.slice(1)]??=new E('div')):null};vm.runInNewContext(fs.readFileSync('assets/schedule.js','utf8'),{document:{getElementById:()=>host,createElement:t=>new E(t)},location:{search},window:{},URLSearchParams,Intl,Date,Map,fetch:async()=>({ok:true,json:async()=>({items,holidays:holidaysForYear(2027)})})});await new Promise(r=>setImmediate(r));return els;}
(async()=>{let els=await render('?date=2027-02-09');assert.equal(els['sc-detail-events'].children[0].textContent,'설날 대체공휴일 · 휴무입니다.');assert(els['sc-days'].children.some(e=>e.children.some(c=>c.textContent==='설날 대체공휴일 · 휴무')));els=await render('?date=2027-02-10');assert(els['sc-detail-events'].children.length>0);assert(!els['sc-detail-events'].children.some(c=>c.className==='sc-closed-detail'));console.log('PASS: KASI 2027 dates, substitute exclusions, 2026–2050 lunar calculations, weekly/monthly closures, ordinary-day opening, manual event preservation');})().catch(e=>{console.error(e);process.exitCode=1});
