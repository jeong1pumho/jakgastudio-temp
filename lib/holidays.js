'use strict';
const Lunar=require('korean-lunar-calendar');
// Recurring shop closures requested by the owner. Substitute rules: Korean
// public-holiday regulation article 3, effective 2026-05-11. No API/key needed.
const MIN_YEAR=2026,MAX_YEAR=2050,cache=new Map();
const key=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const shift=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const dow=day=>new Date(day+'T00:00:00Z').getUTCDay();
function holidaysForYear(year){
 if(!Number.isInteger(year)||year<MIN_YEAR||year>MAX_YEAR)throw new RangeError('Holiday year outside supported range');
 if(cache.has(year))return cache.get(year);
 const groups=[],days={};
 const add=(name,dates,rule)=>{groups.push({name,dates,rule});for(const day of dates)(days[day]??=[]).push(name);};
 for(const [m,d,name,rule] of [[1,1,'새해 첫날','none'],[3,1,'삼일절','weekend'],[5,1,'노동절','weekend'],[5,5,'어린이날','weekend'],[6,6,'현충일','none'],[7,17,'제헌절','weekend'],[8,15,'광복절','weekend'],[10,3,'개천절','weekend'],[10,9,'한글날','weekend'],[12,25,'성탄절','weekend']])add(name,[key(year,m,d)],rule);
 const lunar=(m,d)=>{const c=new Lunar();if(!c.setLunarDate(year,m,d,false))throw Error('Lunar conversion failed');const v=c.getSolarCalendar();return key(v.year,v.month,v.day);};
 for(const [name,m,d,rule,offsets] of [['설날',1,1,'sunday',[-1,0,1]],['부처님 오신 날',4,8,'weekend',[0]],['추석',8,15,'sunday',[-1,0,1]]]){const center=lunar(m,d);add(name,offsets.map(n=>shift(center,n)),rule);}
 const substitutes=new Map();
 for(const g of groups){if(g.rule==='none')continue;
  const eligible=g.dates.some(day=>(g.rule==='weekend'?[0,6].includes(dow(day)):dow(day)===0)||(![0,6].includes(dow(day))&&days[day].length>1));
  if(eligible){const end=g.dates.at(-1);if(!substitutes.has(end))substitutes.set(end,[]);substitutes.get(end).push(g.name);}
 }
 for(const [end,names] of [...substitutes].sort(([a],[b])=>a.localeCompare(b))){let day=shift(end,1);while([0,6].includes(dow(day))||days[day])day=shift(day,1);days[day]=[names.join('·')+' 대체공휴일'];}
 const result=Object.freeze(Object.fromEntries(Object.entries(days).sort(([a],[b])=>a.localeCompare(b)).map(([day,names])=>[day,[...new Set(names)].join('·')])));cache.set(year,result);return result;
}
const holidayName=day=>holidaysForYear(Number(day.slice(0,4)))[day]||'';
module.exports={MIN_YEAR,MAX_YEAR,holidaysForYear,holidayName};
