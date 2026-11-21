(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const session=window.JAKAdminSession;
 const dateFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
 const dateKey=value=>{
  const parts=Object.fromEntries(dateFormat.formatToParts(value).map(part=>[part.type,part.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
 };
 const smsStatus='https://qrbavxempotptnmflqoq.supabase.co/functions/v1/studio-sms-news';
 let generation=0;
 const EXCLUDE_KEY='jakgastudio.analytics-excluded.v1';
 const EXCLUSION_COOKIE='jakgastudio_analytics_excluded_v1';
 function cookieState(){
  const match=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(EXCLUSION_COOKIE+'='));
  const value=match?.slice(EXCLUSION_COOKIE.length+1);
  return value==='1'||value==='0'?value:null;
 }
 function setExclusionCookie(value){
  const shared=location.hostname==='jakgastudio.com'||location.hostname==='www.jakgastudio.com';
  document.cookie=EXCLUSION_COOKIE+'='+value+'; Path=/; Max-Age=31536000; SameSite=Lax; Secure'+(shared?'; Domain=jakgastudio.com':'');
  return cookieState()===value;
 }
 function isExcluded(){
  const cookie=cookieState();
  if(cookie!==null)return cookie==='1';
  const local=localStorage.getItem(EXCLUDE_KEY);
  if(local==='1')setExclusionCookie('1');
  return local==='1';
 }
 function enforceAdminExclusion(){
  try{
   localStorage.setItem(EXCLUDE_KEY,'1');
   if(!setExclusionCookie('1'))throw Error('cookie blocked');
   renderPreference();
  }catch{
   $('traffic-preference-status').textContent='관리자 자동 제외 설정을 저장하지 못했습니다. 브라우저 쿠키·사이트 데이터 허용 설정을 확인해 주세요.';
  }
 }
 function renderPreference(){
  try{
   const excluded=isExcluded();
   $('traffic-exclude').textContent=excluded?'방문 집계 다시 허용':'이 브라우저 방문 집계 제외';
   $('traffic-exclude').setAttribute('aria-pressed',String(excluded));
   $('traffic-preference-status').textContent=excluded?'이 브라우저: 방문 집계 제외 중':'이 브라우저: 방문 집계 허용 중';
  }catch{
   $('traffic-preference-status').textContent='브라우저 저장소에 접근할 수 없어 설정을 확인할 수 없습니다.';
   $('traffic-exclude').disabled=true;
  }
 }
 $('traffic-exclude').addEventListener('click',()=>{
  try{
   const next=isExcluded()?'0':'1';
   localStorage.setItem(EXCLUDE_KEY,next);
   if(localStorage.getItem(EXCLUDE_KEY)!==next||!setExclusionCookie(next))throw Error('저장 실패');
   renderPreference();
  }catch{
   $('traffic-preference-status').textContent='설정을 저장하지 못했습니다. 브라우저의 사이트 데이터 허용 설정을 확인해 주세요.';
  }
 });
 window.addEventListener('storage',event=>{
  if(event.key===EXCLUDE_KEY||event.key===null)renderPreference();
 });
 renderPreference();

 async function request(url,token,body){
  const headers={};
  if(token)headers.Authorization='Bearer '+token;
  if(body)headers['Content-Type']='application/json';
  const response=await fetch(url,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(Error(data.error||'정보를 불러오지 못했습니다.'),{status:response.status});
  return data;
 }

 function render(id,summary,lines=[]){
  $(id).querySelector('p').textContent=summary;
  $(id).querySelector('ul').replaceChildren(...lines.map(line=>{
   const li=document.createElement('li');
   li.textContent=line;
   return li;
  }));
 }
 function show(signedIn){
  $('login').hidden=signedIn;
  $('dashboard').hidden=!signedIn;
  $('logout').hidden=!signedIn;
 }
 async function load(){
  const run=++generation;
  $('reload').disabled=true;
  $('message').textContent='';
  try{
   const token=await session.token();
   if(run!==generation)return;
   show(true);
   const today=dateKey(new Date());
   const month=today.slice(0,7);
   const cards={
    traffic:async()=>{
     const data=await request('/api/visit-analytics',token);
     if(run===generation)enforceAdminExclusion();
     const clarity=data.clarity||{};
     if(!clarity.projectConfigured||!clarity.apiConfigured)
      return ['Clarity 연동 설정 대기',['Microsoft Clarity 연결 상태를 확인해 주세요.']];
     const snapshots=clarity.latest||{};
     const overall=snapshots.Overall;
     if(!overall)return ['Clarity 집계 대기',[
      'Clarity 연결 완료 · 첫 정기 수집 결과가 아직 없습니다.',
      '수집된 통계가 들어오면 방문 세션·방문자·유입 출처를 표시합니다.'
     ]];
     const number=new Intl.NumberFormat('ko-KR');
     const metric=(record,name)=>{
      const rows=Array.isArray(record?.payload)?record.payload:[];
      const information=rows.find(row=>row.metricName===name)?.information;
      return Array.isArray(information)?information:[];
     };
     const numeric=value=>value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value))
      ?number.format(Number(value)):null;
     const total=metric(overall,'Traffic')[0]||{};
     const sessions=numeric(total.totalSessionCount);
     const visitors=numeric(total.distinctUserCount??total.distantUserCount??total.totalDistinctUserCount);
     const lines=[];
     if(Number.isFinite(Date.parse(overall.collected_at)))
      lines.push('최근 수집 · '+new Date(overall.collected_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}));
     lines.push('집계 기준 · 최근 24시간 이동 구간(UTC)');
     for(const [dimension,title] of [['Channel','유입 채널'],['Source','유입 출처']]){
      for(const row of metric(snapshots[dimension],'Traffic').filter(item=>typeof item?.[dimension]==='string').slice(0,3)){
       const count=numeric(row.totalSessionCount);
       if(count!==null)lines.push(title+' · '+row[dimension]+' '+count+'회');
      }
     }
     return ['방문 세션 '+(sessions??'—')+'회 · 방문자 '+(visitors??'—')+'명',lines];
    },
    calendar:async()=>{
     const {items}=await request('/api/schedule?month='+month);
     const upcoming=items.filter(item=>item.event_date>=today&&['meeting','rental','custom'].includes(item.category));
     return ['이번 달 남은 일정 '+upcoming.length+'건',upcoming.slice(0,3).map(item=>item.event_date.slice(5).replace('-','/')+' '+item.start_time.slice(0,5)+' · '+item.title)];
    },
    news:async()=>{
     const {items}=await request('/api/admin',token);
     const ongoing=items.filter(item=>item.status==='ongoing');
     return ['진행 중 '+ongoing.length+'건 · 전체 '+items.length+'건',ongoing.slice(0,3).map(item=>item.title)];
    },
    books:async()=>{
     const {items}=await request('/api/books?admin=1',token);
     const published=items.filter(item=>item.published);
     return ['공개 '+published.length+'권 · 전체 '+items.length+'권',published.slice(0,3).map(item=>item.title)];
    },
    visual:async()=>{
     const {slides}=await request('/api/key-visual');
     return ['게시 슬라이드 '+slides.length+'장',slides[0]?.alt?['첫 슬라이드 · '+slides[0].alt]:[]];
    },
    space:async()=>{
     const {images,updated_at}=await request('/api/space-admin',token);
     return ['공개 사진 '+images.length+'장',updated_at?['최근 변경 · '+dateKey(new Date(updated_at))]:[]];
    },
    sms:async()=>{
     const data=await request(smsStatus,token,{action:'status'});
     const active=(data.subscribers||[]).filter(item=>item.status==='active').length;
     return ['수신동의 '+active+'명',['발송 기록 '+(data.campaigns||[]).length+'건',data.configured?'발송 설정 확인됨':'발송 설정 대기']];
    }
   };
   await Promise.all(Object.entries(cards).map(async ([id,read])=>{
    render(id,'불러오는 중…');
    try{
     const result=await read();
     if(run===generation)render(id,...result);
    }catch{
     if(run===generation)render(id,'조회할 수 없습니다.',['잠시 후 새로고침해 주세요.']);
    }
   }));
  }catch(error){
   if(run!==generation)return;
   if(error.status===401||error.status===403){session.clear();show(false);}
   $('message').textContent=error.message;
  }finally{
   if(run===generation)$('reload').disabled=false;
  }
 }

 $('login').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const button=form.querySelector('button');
  const fields=new FormData(form);
  button.disabled=true;
  $('message').textContent='';
  try{
   const data=await request('/api/admin',null,{action:'login',email:fields.get('email').trim(),password:fields.get('password')});
   if(!session.save(data.token,data.expires_in,data.refresh_token))throw Error('로그인 정보를 저장하지 못했습니다.');
   enforceAdminExclusion();
   form.reset();
   await load();
  }catch(error){$('message').textContent=error.message;}
  finally{button.disabled=false;}
 });
 $('reload').addEventListener('click',load);
 $('logout').addEventListener('click',()=>{
  generation++;
  session.clear();
  show(false);
  $('message').textContent='로그아웃했습니다.';
 });
 if(session.read())load();
})();
