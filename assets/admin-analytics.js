(()=>{
'use strict';
const $=x=>document.getElementById(x),fmt=x=>Number.isFinite(Number(x))?new Intl.NumberFormat('ko-KR').format(Number(x)):'—';
const session=window.JAKAdminSession;
function metrics(id,entries){const el=$(id);el.replaceChildren();for(const [label,value] of entries){const box=document.createElement('div');box.className='metric';const a=document.createElement('strong');a.textContent=value;const b=document.createElement('small');b.textContent=label;box.append(a,b);el.append(box)}}
function table(id,list,head=['항목','횟수']){const root=$(id);root.replaceChildren();if(!list?.length){root.textContent='표시할 데이터가 없습니다.';return}const t=document.createElement('table'),th=document.createElement('tr');head.forEach(x=>{const c=document.createElement('th');c.textContent=x;th.append(c)});t.append(th);for(const row of list){const tr=document.createElement('tr');for(const x of row){const td=document.createElement('td');td.textContent=String(x);tr.append(td)}t.append(tr)}root.append(t)}
async function api(url,token){const r=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(x.error||'조회 오류'),{status:r.status});return x}

const tabs=['종합 현황','유입 분석','콘텐츠 분석','행동 분석','기술 통계'];
let active=tabs[0], data, ga, generation=0;
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
 if(active==='기술 통계'){
  text('p','GA4 방문자 태그 비활성 · 선택 기간에 이미 수집된 자료만 표시합니다.');
  if(ga?.status!=='ready'){text('p',ga?.status==='failed'?'GA4 보고서 조회 실패':ga?'GA4 보고서 연결 대기':'조회 중…');return}
  cards([['GA4 방문자',fmt(ga.visitors)],['세션',fmt(ga.sessions)]]);
  for(const [k,name] of [['countries','국가'],['regions','지역'],['devices','접속 기기']])listing(name,(ga[k]||[]).map(x=>[x.label,fmt(x.count)]),[name,'세션']);
  return;
 }
 if(!data){text('p','자체 통계 조회 실패');return}
 const span=period.value==='30'?30:period.value==='7'?7:1,offset=period.value==='yesterday'?1:0;
 const min=dateKey(offset+span-1),max=dateKey(offset);
 const rows=data.counts.filter(r=>r.day>=min&&r.day<=max);
 const views=rows.filter(r=>r.kind==='page_view'), clicks=rows.filter(r=>r.kind==='click');
 const news=views.filter(r=>r.path.startsWith('/news/'));
 const conversions=clicks.filter(r=>['전화 클릭','길찾기 클릭','문자 클릭','문자 신청 열기'].includes(r.detail));
 const channel=r=>{const k=r.detail.split('|')[0];return ({'직접 방문':'직접·확인 불가','출처 미확인':'직접·확인 불가',instagram:'Instagram',naver:'Naver',threads:'Threads',kakao:'Kakao',google:'Google'})[k]||k};
 const entries=views.filter(r=>channel(r)!=='사이트 내부');
 const channels=groups(entries,channel).map(([k,n])=>[k,fmt(n),(100*n/sum(entries)).toFixed(1)+'%']);
 const pageList=(label,items)=>listing(label,groups(items,r=>r.path).map(([k,n])=>[title(k),fmt(n)]),['콘텐츠','조회수']);
 if(active==='종합 현황'){
  cards([['전체 페이지 조회',fmt(sum(views))],['모임·행사 상세 조회',fmt(sum(news))],['방문 안내 조회',fmt(sum(views.filter(r=>r.path==='/visit')))],['주요 전환 클릭',fmt(sum(conversions))]]);
  text('h3','일별 페이지 조회');const days=new Map(groups(views,r=>r.day)),peak=Math.max(1,...days.values());
  for(let i=span-1;i>=0;i--){const day=dateKey(i+offset),n=days.get(day)||0;const row=document.createElement('div');row.className='chart-row';panel.append(row);text('small',day,row);const bar=text('span','',row);bar.className='bar';bar.style.width=(100*n/peak)+'%';text('span',fmt(n)+'회',row)}
  listing('주요 유입 경로',channels,['유입 채널','진입 조회','비중']);pageList('인기 모임·행사',news);listing('주요 전환 행동',groups(conversions,r=>r.detail));text('p','자체 통계 · 요청 시 조회 / GA4·Clarity 방문자 태그 · 비활성');
 }else if(active==='유입 분석'){
  listing('유입 채널',channels,['유입 채널','진입 조회','비중']);
  listing('홍보 캠페인 · 소재',groups(entries.filter(r=>r.detail.split('|')[2]),r=>channel(r)+' · '+r.detail.split('|')[2]));
  text('p','캠페인 코드 · booknight, jangsakkunclub, readingclub, bookclub, writing, rental, studio. 월별 코드는 -202612처럼 붙입니다. 소재는 feed, story, reel, profile, post, poster 및 번호를 지원합니다. 예: ?utm_source=instagram&utm_campaign=booknight-202612&utm_content=story-1');
  listing('시간대별 페이지 조회',groups(views.filter(r=>r.detail.includes('|')),r=>r.detail.split('|')[1]+'시').sort((a,b)=>a[0].localeCompare(b[0])));
 }else if(active==='콘텐츠 분석'){
  pageList('모임·행사',news);pageList('운영 프로그램',views.filter(r=>r.path.startsWith('/programs/')));pageList('추천 도서',views.filter(r=>r.path.startsWith('/books/')));
 }else{
  listing('버튼·메뉴 클릭',groups(clicks,r=>title(r.path)+' · '+r.detail.replace(/^(메뉴|링크) (\/.*)$/,(_,a,b)=>a+' '+title(b))));
  listing('페이지 이동 구간',groups(rows.filter(r=>r.kind==='transition'),r=>title(r.path)+' → '+title(r.detail)));
  text('h3','Microsoft Clarity');text('p','방문자 태그 비활성 · 기존 자료의 최근 72시간 스냅샷을 하루 한 번 조회합니다.');
  const c=data.clarity||{}, snap=c.latest?.Overall;
  text('p',({ready:'수집 완료',waiting:'첫 집계 대기',failed:'수집 실패',partial:'일부 항목 누락',overdue:'수집 지연'})[c.status]||'상태 미확인');
  if(c.status==='ready'&&snap){text('p','최근 수집 '+new Date(snap.collected_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}));listing('최근 72시간 행동',[['반복 클릭','RageClickCount'],['무반응 클릭','DeadClickCount']].map(([k,n])=>{const r=snap.payload.find(x=>x.metricName===n)?.information?.[0];return [k,fmt(r?.subTotal??r?.count??r?.totalCount)]}))}
  const link=text('a','Clarity 히트맵 · 스크롤 · 녹화 열기');link.href='https://clarity.microsoft.com/';link.target='_blank';link.rel='noopener noreferrer';
 }
}
async function load(){
 const run=++generation;$('status').textContent='조회 중…';$('reload').disabled=true;
 try{const token=await session.token();
  const [own,google]=await Promise.allSettled([api('/api/visit-analytics',token),api('/api/admin?action=analytics&report=1&period='+period.value,token)]);
  if(run!==generation)return;
  for(const r of [own,google])if(r.status==='rejected'&&[401,403].includes(r.reason.status))throw r.reason;
  data=own.status==='fulfilled'?own.value:null;ga=google.status==='fulfilled'?google.value:{status:'failed'};
  $('reports').hidden=false;$('signin').hidden=true;$('logout').hidden=false;$('reload').hidden=false;render();
  $('status').textContent=data&&ga.status!=='failed'?'조회 완료':'일부 통계 조회 실패';
 }catch(e){if(run!==generation)return;$('reports').hidden=true;$('signin').hidden=false;$('status').textContent=e.message}
 finally{if(run===generation)$('reload').disabled=false}
}
for(const name of tabs){const b=text('button',name,$('tabs'));b.onclick=()=>{active=name;render()}}
period.onchange=load;$('reload').onclick=load;$('logout').onclick=()=>{++generation;session.clear();location.reload()};
if(session.read())load();else $('signin').hidden=false;
})();