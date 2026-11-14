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
     const data=await request('/api/admin?action=analytics&report=1',token);
     if(data.status==='unconfigured')return ['GA4 연결 대기',['테스트 측정 ID와 관리자 보고서 설정이 필요합니다.']];
     if(data.status==='report_unconfigured')return ['수집 설정됨 · 보고서 연결 대기',['GA4 보고서 조회 권한을 설정해 주세요.']];
     const number=new Intl.NumberFormat('ko-KR');
     return ['방문 '+number.format(data.sessions)+'회 · 조회 '+number.format(data.views)+'회',[
      '방문당 평균 참여 '+number.format(data.averageSeconds)+'초',
      ...data.sources.map(row=>'유입 · '+row.label+' '+number.format(row.count)+'회'),
      ...data.landings.map(row=>'첫 페이지 · '+row.label+' '+number.format(row.count)+'회'),
      ...data.actions.map(row=>row.label+' '+number.format(row.count)+'회')
     ]];
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
