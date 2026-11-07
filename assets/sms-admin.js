(()=>{
"use strict";
const API="https://qrbavxempotptnmflqoq.supabase.co/functions/v1/studio-sms-news", $=id=>document.getElementById(id);
const session=window.JAKAdminSession;
let token="",subscribers=[],events=[],campaigns=[],selected=new Set(),configured=false,verifiedConnection=false,sending=false,lastDraftEvent=null;
function notice(s,error=false){$("feedback").textContent=s||"";$("feedback").hidden=!s;$("feedback").classList.toggle("error",error);}
function dashboard(yes){$("login-panel").hidden=yes;$("dashboard").hidden=!yes;}
async function call(action,fields={}){
 const resp=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({action,...fields})});
 let data={};try{data=await resp.json()}catch{}
 if(!resp.ok)throw Error(data.error||"요청 처리 실패");
 return data;
}
function currentEvent(){return events.find(e=>e.id===$("event").value);}
function eventUrl(e){
 const slug=String(e?.slug||"");
 return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
   ?"https://www.jakgastudio.com/news/"+encodeURIComponent(slug):"";
}
const oldNewsUrl=/(?:https?:\/\/)?(?:www\.)?jakgastudio\.com\/news(?:\/[a-z0-9-]+)?(?:\?[^\s]*)?/gi;
function syncEventMessage(){
 const e=currentEvent(),url=eventUrl(e);
 if(!url){
  $("send").disabled=true;
  notice("선택한 행사에 고유 상세주소가 없습니다. 행사 정보를 확인해 주세요.",true);
  return false;
 }
 let body=$("message").value.trim();
 if(!body)body="새로운 모임·행사 안내\n"+e.title+"\n일정 및 참여 방법: "+url;
 else{
  if(lastDraftEvent?.title&&lastDraftEvent.title!==e.title){
   const previous="\n"+lastDraftEvent.title+"\n";
   if(body.includes(previous))body=body.replace(previous,"\n"+e.title+"\n");
  }
  oldNewsUrl.lastIndex=0;
  if(oldNewsUrl.test(body)){
   oldNewsUrl.lastIndex=0;
   body=body.replace(oldNewsUrl,url);
  }else body+="\n일정 및 참여 방법: "+url;
 }
 $("message").value=body;
 lastDraftEvent={id:e.id,title:e.title};
 preview();
 return true;
}
async function load(){
 const r=await call("status");subscribers=r.subscribers||[];events=r.events||[];campaigns=r.campaigns||[];configured=r.configured===true;
 verifiedConnection=false;$("unconfigured").hidden=false;$("connection").textContent=configured?"설정값 확인됨 · API 검증 필요":"테스트 사이트 · 솔라피 인증정보 설정 대기";
 $("count-all").textContent=subscribers.length;
 $("count-active").textContent=subscribers.filter(x=>x.status==="active").length;
 $("count-off").textContent=subscribers.filter(x=>x.status==="unsubscribed").length;
 $("event").replaceChildren();
 for(const e of events){const opt=document.createElement("option");opt.value=e.id;opt.textContent=e.title+" · "+(e.status==="ongoing"?"진행 중":"종료");$("event").append(opt);}
 if(!events.length){const opt=document.createElement("option");opt.textContent="등록된 행사가 없습니다.";opt.value="";$("event").append(opt);}
 $("send").disabled=true;renderPeople();renderHistory();syncEventMessage();dashboard(true);await checkConnection();
}
async function checkConnection(){
 const button=$("check-solapi");button.disabled=true;$("send").disabled=true;verifiedConnection=false;
 try{
  const result=await call("connection_check");
  verifiedConnection=!!(result.configured&&result.authenticated&&result.senderApproved&&result.blacklistAvailable&&result.balanceAvailable&&result.sufficientSmsBalance);
  if(verifiedConnection){
   $("unconfigured").hidden=true;$("connection").textContent="솔라피 인증·발신번호·080 수신거부 조회 정상";
  }else{
   $("unconfigured").hidden=false;
   let message="솔라피 연결 점검 실패: ";
   if(!result.configured)message+="API Key·Secret·발신번호 설정을 확인하세요.";
   else if((result.errors||[]).some(x=>String(x).includes("403")))message+="API 접근이 차단되었습니다. 솔라피 API Key의 ‘허용 IP 제한’을 확인하세요.";
   else if(!result.senderApproved)message+="등록된 발신번호가 ACTIVE 상태인지 확인하세요.";
   else if(!result.sufficientSmsBalance)message+="문자 발송 잔액이 부족합니다.";
   else message+="잔액 및 수신거부 목록 조회 설정을 확인하세요.";
   $("unconfigured").textContent=message;
   $("connection").textContent="솔라피 API 검증 실패 · 발송 차단";
  }
 }catch(error){
  $("unconfigured").hidden=false;$("unconfigured").textContent="솔라피 연결 상태를 확인할 수 없습니다: "+error.message;
  $("connection").textContent="API 점검 실패 · 발송 차단";
 }finally{
  button.disabled=false;$("send").disabled=!verifiedConnection||!events.length;
 }
}
const cell=(tr,s)=>{const e=document.createElement("td");e.textContent=s;tr.append(e);return e;};
function renderPeople(){
 const dest=$("people");dest.replaceChildren();const filter=$("filter").value;
 for(const p of subscribers.filter(x=>filter==="all"||x.status===filter)){
  const tr=document.createElement("tr"),box=document.createElement("input");
  box.type="checkbox";box.checked=selected.has(p.id);box.disabled=p.status!=="active";
  box.setAttribute("aria-label",p.name+" 선택");box.addEventListener("change",()=>{if(box.checked)selected.add(p.id);else selected.delete(p.id);updateCount();});
  const first=document.createElement("td");first.append(box);tr.append(first);
  const name=cell(tr,p.name),phone=document.createElement("small");phone.textContent=p.phone;name.append(phone);
  cell(tr,p.status==="active"?"수신동의":"수신거부");
  cell(tr,new Date(p.subscribed_at).toLocaleDateString("ko-KR",{timeZone:"Asia/Seoul"}));
  const action=document.createElement("td");
  if(p.status==="active"){const btn=document.createElement("button");btn.className="btn";btn.textContent="수신거부";
   btn.addEventListener("click",async()=>{if(!confirm(p.name+"님의 수신을 거부 처리합니까?"))return;try{await call("unsubscribe",{id:p.id});notice("수신거부가 반영되었습니다.");selected.delete(p.id);await load()}catch(e){notice(e.message,true)}});action.append(btn);}
  else action.textContent="-";
  tr.append(action);dest.append(tr);
 }
 if(!dest.children.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.textContent="등록자가 없습니다.";tr.append(td);dest.append(tr)}
 updateCount();
}
function updateCount(){$("chosen-count").textContent=subscribers.filter(p=>p.status==="active"&&selected.has(p.id)).length}
function renderHistory(){const dest=$("history");dest.replaceChildren();
 for(const c of campaigns){const tr=document.createElement("tr");cell(tr,new Date(c.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"}));cell(tr,c.event_title);cell(tr,String(c.recipient_count));cell(tr,String(c.blocked_count));cell(tr,c.status==="accepted"?"솔라피 접수":c.status==="failed"?"발송 확인 필요":"접수 준비 중");dest.append(tr);}
 if(!dest.children.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.textContent="발송 내역이 없습니다.";tr.append(td);dest.append(tr);}
}
function preview(){const body=$("message").value.trim();const text="(광고) 작가작업실 JEJU\n"+(body||"문자 내용을 작성해 주세요.")+"\n무료수신거부: 080-500-4233";$("preview").textContent=text;const bytes=new TextEncoder().encode(text).length;$("bytes").textContent=bytes+"바이트 · "+(bytes<=90?"단문 SMS":"장문 LMS")+" 예상";}
for(const b of document.querySelectorAll("[data-tab]"))b.addEventListener("click",()=>{
 for(const t of ["people","compose","history"])$("panel-"+t).hidden=t!==b.dataset.tab;
 for(const x of document.querySelectorAll("[data-tab]"))x.classList.toggle("active",x===b);
});
$("filter").addEventListener("change",renderPeople);
$("message").addEventListener("input",preview);
$("event").addEventListener("change",()=>syncEventMessage());
$("check-solapi").addEventListener("click",()=>checkConnection());
$("sync-080").addEventListener("click",async()=>{const btn=$("sync-080");btn.disabled=true;try{const r=await call("sync_blocks");notice("080 수신거부 "+r.blocked+"건 확인, 신규 "+r.updated+"건 반영");await load()}catch(e){notice(e.message,true)}finally{btn.disabled=false}});
$("send").addEventListener("click",async()=>{
 if(sending||!verifiedConnection)return;
 const eventId=$("event").value;
 if(!syncEventMessage())return;
 const text=$("message").value.trim(),mode=document.querySelector("input[name=targets]:checked").value;
 const target=subscribers.filter(x=>x.status==="active"&&(mode==="all"||selected.has(x.id)));
 if(!eventId||!text||!target.length)return notice("행사·문구·수신 대상을 확인해 주세요.",true);
 const hour=new Date(Date.now()+9*3600000).getUTCHours();
 if(hour>=21||hour<8)return notice("광고성 문자 발송 가능 시간은 08:00~21:00입니다.",true);
 if(!confirm("솔라피 문자 발송 비용이 발생합니다.\n행사: "+events.find(x=>x.id===eventId)?.title+"\n수신 대상: 최대 "+target.length+"명\n\n수신거부를 제외하고 발송 접수하시겠습니까?"))return;
 sending=true;$("send").disabled=true;notice("");
 try{const r=await call("send",{eventId,text,mode,selectedIds:[...selected],confirmed:true});notice("솔라피 접수 "+r.accepted+"명, 수신거부 제외 "+r.blocked+"명. 실제 전달 결과는 솔라피에서 확인해 주세요.");await load();document.querySelector('[data-tab="history"]').click();}
 catch(e){notice(e.message,true)}finally{sending=false;$("send").disabled=!verifiedConnection;}
});
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=e.target.querySelector("button");btn.disabled=true;notice("");
 try{const res=await fetch("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",email:$("email").value.trim(),password:$("password").value})});
 const data=await res.json();if(!res.ok||!data.token)throw Error(data.error||"로그인에 실패했습니다.");
 token=data.token;session?.save(token,data.expires_in);$("password").value="";await load();}
 catch(e){notice(e.message,true)}finally{btn.disabled=false;}
});
$("logout").addEventListener("click",()=>{token="";session?.clear();subscribers=[];selected.clear();dashboard(false);notice("")});
const saved=session?.read();if(saved){token=saved;load().catch(e=>{token="";session?.clear();dashboard(false);notice("관리자 로그인이 필요합니다.",true)})}
preview();
})();