(()=>{
'use strict';
const $=x=>document.getElementById(x),fmt=x=>Number.isFinite(Number(x))?new Intl.NumberFormat('ko-KR').format(Number(x)):'—';
const session=window.JAKAdminSession;let counts=[];
function metrics(id,entries){const el=$(id);el.replaceChildren();for(const [label,value] of entries){const box=document.createElement('div');box.className='metric';const a=document.createElement('strong');a.textContent=value;const b=document.createElement('small');b.textContent=label;box.append(a,b);el.append(box)}}
function table(id,list,head=['항목','횟수']){const root=$(id);root.replaceChildren();if(!list?.length){root.textContent='표시할 데이터가 없습니다.';return}const t=document.createElement('table'),th=document.createElement('tr');head.forEach(x=>{const c=document.createElement('th');c.textContent=x;th.append(c)});t.append(th);for(const row of list.slice(0,12)){const tr=document.createElement('tr');for(const x of row){const td=document.createElement('td');td.textContent=String(x);tr.append(td)}t.append(tr)}root.append(t)}
async function api(url,token){const r=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(x.error||'조회 오류'),{status:r.status});return x}
const info=(raw,name)=>(raw||[]).find(x=>x.metricName===name)?.information||[];
function field(r,names){for(const k of names)if(r?.[k]!=null&&String(r[k]).trim()!==''&&Number.isFinite(Number(r[k])))return fmt(r[k]);return '—'}
function renderGA(g){if(g.status!=='ready'){metrics('ga-metrics',[['상태','연결 대기']]);return}metrics('ga-metrics',[['방문 세션',fmt(g.sessions)],['페이지 조회',fmt(g.views)],['세션당 평균 참여',fmt(g.averageSeconds)+'초']]);table('ga-sources',(g.sources||[]).map(x=>[x.label,fmt(x.count)]));table('ga-landings',(g.landings||[]).map(x=>[x.label,fmt(x.count)]));table('ga-actions',(g.actions||[]).map(x=>[x.label,fmt(x.count)]))}
function byDimension(row,name){return info(row?.payload,'Traffic').map(x=>[String(x[name]||'기타'),field(x,['totalSessionCount'])])}
function renderClarity(c){
 for(const id of ['clarity-metrics','clarity-channels','clarity-sources','clarity-pages'])$(id).replaceChildren();
 if(!c.projectConfigured||!c.apiConfigured){$('clarity-status').textContent='연동 대기: Clarity Project ID와 Data Export API 토큰이 아직 운영 환경에 등록되지 않았습니다.';metrics('clarity-metrics',[['방문 세션','—'],['방문자','—'],['반복 클릭','—'],['반응 없는 클릭','—']]);return}
 const latest=c.latest||{},row=latest.Overall;
 if(c.status==='failed'){$('clarity-status').textContent='Clarity 수집 실패 · 최신 수치를 확인할 수 없습니다.';return}
 if(c.status==='overdue'||c.status==='partial'){$('clarity-status').textContent=c.status==='overdue'?'정기 수집 지연 · 최신 통계 미확인':'일부 항목 수집 미완료';return}
 if(!row){$('clarity-status').textContent='Clarity 설정 완료 · 첫 정기 수집을 기다리는 중입니다.';return}
 $('clarity-status').textContent='최근 수집 '+new Date(row.collected_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
 const traffic=info(row.payload,'Traffic')[0],rage=info(row.payload,'RageClickCount')[0],dead=info(row.payload,'DeadClickCount')[0];
 metrics('clarity-metrics',[['방문 세션',field(traffic,['totalSessionCount'])],['방문자',field(traffic,['distinctUserCount','distantUserCount'])],['반복 클릭',field(rage,['subTotal','count','totalCount'])],['반응 없는 클릭',field(dead,['subTotal','count','totalCount'])]]);
 table('clarity-channels',byDimension(latest.Channel,'Channel'));table('clarity-sources',byDimension(latest.Source,'Source'));table('clarity-pages',byDimension(latest.URL,'URL'));
}
function renderOwn(){
 if(!counts)return;
 const n=Number($('period').value),d=new Date(Date.now()-(n-1)*86400000);
 const f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
 const p=Object.fromEntries(f.formatToParts(d).map(x=>[x.type,x.value]));const min=p.year+'-'+p.month+'-'+p.day;
 const r=counts.filter(x=>x.day>=min),sum=k=>r.filter(x=>x.kind===k).reduce((a,x)=>a+Number(x.event_count||0),0);
 metrics('own-metrics',[['페이지 조회',fmt(sum('page_view'))],['클릭',fmt(sum('click'))],['페이지 이동',fmt(sum('transition'))]]);
 const group=(k,fn)=>{const m=new Map();for(const x of r.filter(x=>x.kind===k)){const label=fn(x);m.set(label,(m.get(label)||0)+Number(x.event_count||0))}return [...m].sort((a,b)=>b[1]-a[1]).map(([a,b])=>[a,fmt(b)])};
 table('own-pages',group('page_view',x=>x.path));table('own-clicks',group('click',x=>x.path+' · '+x.detail));table('own-transitions',group('transition',x=>x.path+' → '+x.detail),['이동 경로','건수']);
}
async function load(){
 $('reload').disabled=true;$('status').textContent='방문 분석 조회 중…';
 try{const token=await session.token();
  const [a,b]=await Promise.allSettled([api('/api/admin?action=analytics&report=1',token),api('/api/visit-analytics',token)]);
  $('signin').hidden=true;$('reports').hidden=false;$('reload').hidden=false;$('logout').hidden=false;
  if(a.status==='fulfilled')renderGA(a.value);else metrics('ga-metrics',[['GA4','조회 실패']]);
  if(b.status==='fulfilled'){counts=b.value.counts||[];renderOwn();renderClarity(b.value.clarity||{})}
  else{counts=null;for(const id of ['own-pages','own-clicks','own-transitions','clarity-metrics','clarity-channels','clarity-sources','clarity-pages'])$(id).replaceChildren();metrics('own-metrics',[['자체 통계','조회 실패']]);$('clarity-status').textContent='조회 실패'}
  $('status').textContent=a.status==='fulfilled'&&b.status==='fulfilled'?'조회 완료 · 분석 도구별 집계 기준을 구분하세요.':'일부 보고서 조회 실패';
 }catch(e){if(e.status===401||e.status===403)session.clear();$('signin').hidden=false;$('reports').hidden=true;$('reload').hidden=true;$('status').textContent=e.message||'로그인 필요'}
 finally{$('reload').disabled=false}
}
$('reload').addEventListener('click',load);$('period').addEventListener('change',renderOwn);
$('logout').addEventListener('click',()=>{session.clear();$('reports').hidden=true;$('signin').hidden=false;$('logout').hidden=true});
if(session.read())load();else{$('signin').hidden=false;$('status').textContent='관리자 로그인이 필요합니다.'}
})();