(()=>{
'use strict';
const $=x=>document.getElementById(x),fmt=x=>x!=null&&x!==''&&Number.isFinite(Number(x))?new Intl.NumberFormat('ko-KR').format(Number(x)):'—';
const session=window.JAKAdminSession;
function metrics(id,entries){const el=$(id);el.replaceChildren();for(const [label,value] of entries){const box=document.createElement('div');box.className='metric';const a=document.createElement('strong');a.textContent=value;const b=document.createElement('small');b.textContent=label;box.append(a,b);el.append(box)}}
function table(id,list,head=['항목','횟수']){const root=$(id);root.replaceChildren();if(!list?.length){root.textContent='표시할 데이터가 없습니다.';return}const t=document.createElement('table'),th=document.createElement('tr');head.forEach(x=>{const c=document.createElement('th');c.textContent=x;th.append(c)});t.append(th);for(const row of list){const tr=document.createElement('tr');for(const x of row){const td=document.createElement('td');td.textContent=String(x);tr.append(td)}t.append(tr)}root.append(t)}
async function api(url,token){const r=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(x.error||'조회 오류'),{status:r.status});return x}

const tabs=['종합 현황','방문 경로','유입 분석','콘텐츠 분석'];
let active=tabs[0], data, generation=0;
const panel=$('panel'), period=$('period');
const text=(tag,value,parent=panel)=>{const el=document.createElement(tag);el.textContent=value;parent.append(el);return el};
const dateKey=offset=>new Date(Date.now()+(9-24*offset)*3600000).toISOString().slice(0,10);
const program={'/programs/bookstore':'책방','/programs/book-club':'독서모임','/programs/writing-class':'글쓰기 모임','/programs/space-rental':'공간 대관','/programs/event-planning':'행사 기획'};
const names={'/':'홈','/news':'모임·행사 목록','/visit':'방문 안내','/calendar':'월간 캘린더','/space':'공간 소개','/books':'추천 도서 목록',...program};
function title(path){return data?.titles?.[path]||names[path]||path}
const sum=rows=>rows.reduce((n,r)=>n+Number(r.event_count),0);
function groups(rows,key){
 const m=new Map();
 for(const r of rows){const k=key(r);m.set(k,(m.get(k)||0)+Number(r.event_count))}
 return [...m].sort((a,b)=>b[1]-a[1]);
}
function block(label){text('h3',label);const el=document.createElement('div');el.id='block-'+panel.children.length;panel.append(el);return el.id}
function listing(label,rows,head){table(block(label),rows,head)}
function cards(entries){const id=block('주요 지표');$(id).className='metrics';metrics(id,entries)}
function render(){
 panel.replaceChildren();text('h2',active);
 for(const b of $('tabs').children)b.setAttribute('aria-pressed',String(b.textContent===active));
 if(!data){text('p','자체 통계 조회 실패');return}
 const today=dateKey(0),dom=Number(today.slice(-2)),weekday=(new Date(today+'T00:00:00Z').getUTCDay()+6)%7;
 let span=({week:weekday+1,month:dom,'30':30,'7':7})[period.value]||1;
 let offset=period.value==='yesterday'?1:0;
 if(period.value==='previousMonth'){offset=dom;span=Number(dateKey(offset).slice(-2))}
 const min=dateKey(offset+span-1),max=dateKey(offset);
 const rows=data.counts.filter(r=>r.day>=min&&r.day<=max);
 const views=rows.filter(r=>r.kind==='page_view'),visits=views.filter(r=>r.detail.split('|')[5]==='start');
 const measured=views.filter(r=>['start','continue'].includes(r.detail.split('|')[5]));
 const clicks=rows.filter(r=>r.kind==='click'), action=r=>r.detail.split('|')[0];
 const conversions=clicks.filter(r=>['전화 클릭','길찾기 클릭','문자 클릭','문자 신청 열기','문자 신청 완료'].includes(action(r)));
 const routes=rows.filter(r=>r.kind==='transition'&&r.detail.startsWith('route|'));
 const channel=r=>r.detail.split('|')[0];
 const pageList=(label,items)=>listing(label,groups(items,r=>r.path).map(([k,n])=>[title(k),fmt(n)]),['페이지','조회수']);
 const count=(measured.length||max>'2026-11-25')?fmt(sum(visits)):'측정 자료 없음';
 text('p',min+' ~ '+max+' · 한국 시간');
 if(active==='종합 현황'){
  cards([['방문 건수',count],['전체 페이지 조회',fmt(sum(views))],['모임·행사 상세 조회',fmt(sum(views.filter(r=>r.path.startsWith('/news/'))))],['길찾기 클릭',fmt(sum(clicks.filter(r=>action(r)==='길찾기 클릭')))]]);
  const visitDays=new Map(groups(visits,r=>r.day)),viewDays=new Map(groups(views,r=>r.day)),days=new Set(measured.map(r=>r.day));
  listing('일별 방문과 페이지 조회',Array.from({length:span},(_,i)=>{const day=dateKey(offset+i);return [day,(days.has(day)||day>'2026-11-25')?fmt(visitDays.get(day)||0):'—',fmt(viewDays.get(day)||0)]}),['날짜','방문 건수','조회수']);
  listing('주요 행동',groups(conversions,action));
  const classified=views.filter(r=>r.detail.split('|').length>=5);
  listing('접속 국가',groups(classified,r=>r.detail.split('|')[3]),['국가 코드','조회수']);
  listing('접속 기기',groups(classified,r=>r.detail.split('|')[4]),['기기','조회수']);
 }else if(active==='유입 분석'){
  listing('최초 유입 채널',groups(visits,channel),['채널','방문 건수']);
  listing('채널별 첫 페이지',groups(visits,r=>channel(r)+' → '+title(r.path)),['유입 → 첫 페이지','방문 건수']);
  listing('홍보 캠페인 · 소재',groups(visits.filter(r=>r.detail.split('|')[2]),r=>channel(r)+' · '+r.detail.split('|')[2]));
  listing('유입 후 주요 행동',groups(conversions.filter(r=>r.detail.includes('|')),r=>r.detail.split('|')[1]+' → '+title(r.path)+' · '+action(r)));
  text('p','UTM 출처를 우선합니다. 이전 사이트가 출처를 전달하지 않으면 직접·확인 불가에 포함합니다.');
 }else if(active==='콘텐츠 분석'){
  pageList('전체 페이지',views);
  for(const [prefix,label] of [['/news/','모임·행사'],['/programs/','운영 프로그램'],['/books/','추천 도서']])pageList(label,views.filter(r=>r.path.startsWith(prefix)));
  listing('페이지별 화면 표시시간',groups(routes,r=>r.path).map(([path])=>{
   const samples=routes.filter(r=>r.path===path),at=n=>sum(samples.filter(r=>r.detail.split('|')[3]===String(n)));
   return [title(path),...([0,10,30,60,120,300,600].map(at))];
  }),['페이지','진입','10초 이상','30초 이상','1분 이상','2분 이상','5분 이상','10분 이상']);
 }else{
  const journeys=r=>{
   const [,source,trail]=r.detail.split('|');
   const steps=trail?trail.split(',').map(step=>{const [path,n]=step.split('~');return title(path)+' ('+(n==='0'?'10초 미만':n+'초 이상')+')'}):[];
   return [source,...steps,title(r.path)].join(' → ');
  };
  const byRoute=new Map();
  for(const row of routes){
   const label=journeys(row),threshold=row.detail.split('|')[3];
   if(!byRoute.has(label))byRoute.set(label,{});
   const buckets=byRoute.get(label);buckets[threshold]=(buckets[threshold]||0)+Number(row.event_count);
  }
  const ordered=[...byRoute].sort((a,b)=>(b[1][0]||0)-(a[1][0]||0));
  listing('유입 채널과 이동 경로',ordered.map(([label,b])=>[label,...[0,10,30,60,120,300,600].map(n=>b[n]||0)]),['최초 유입 → 직전 경로 → 현재 페이지','도달','10초 이상','30초 이상','1분 이상','2분 이상','5분 이상','10분 이상']);
  text('p','시간 열은 해당 경로의 마지막 페이지에서 기준 시간 이상 화면이 보인 횟수입니다.');
  listing('페이지 사이 이동',groups(rows.filter(r=>r.kind==='transition'&&!r.detail.startsWith('route|')),r=>title(r.path)+' → '+title(r.detail)));
  listing('클릭한 위치와 행동',groups(clicks,r=>title(r.path)+' · '+action(r).replace(/^(메뉴|링크) (\/.*)$/,(_,a,b)=>a+' '+title(b))));
  text('p','같은 탭에서 관측한 경로를 합산합니다. 긴 경로는 최근 구간으로 표시합니다. 30분간 활동이 없으면 다음 활동부터 새 방문입니다. 시간은 화면이 보인 구간의 추정치이며 마지막 페이지도 포함합니다.');
 }
}
async function load(){
 const run=++generation;$('status').textContent='조회 중…';$('reload').disabled=true;
 try{const token=await session.token();
  const result=await api('/api/visit-analytics',token);
  if(run!==generation)return;
  data=result;
  $('reports').hidden=false;$('signin').hidden=true;$('logout').hidden=false;$('reload').hidden=false;render();
  $('status').textContent='조회 완료';
 }catch(e){if(run!==generation)return;if(![401,403].includes(e.status)){data=null;render();$('reports').hidden=false;$('reload').hidden=false;$('status').textContent='자체 통계 조회 실패';return}$('reports').hidden=true;$('signin').hidden=false;$('status').textContent=e.message}
 finally{if(run===generation)$('reload').disabled=false}
}
for(const name of tabs){const b=text('button',name,$('tabs'));b.onclick=()=>{active=name;render()}}
period.onchange=load;$('reload').onclick=load;$('logout').onclick=()=>{++generation;session.clear();location.reload()};
if(session.read())load();else $('signin').hidden=false;
})();