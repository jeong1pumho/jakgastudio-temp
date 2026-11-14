(()=>{
"use strict";
const API="https://qrbavxempotptnmflqoq.supabase.co/functions/v1/studio-sms-news", $=id=>document.getElementById(id);
const session=window.JAKAdminSession;
let token="",subscribers=[],events=[],campaigns=[],selected=new Set(),configured=false,verifiedConnection=false,sending=false,lastDraftEvent=null,editingManualId=null,editingNameId=null,emailNotificationState=null;
function notice(s,error=false){$("feedback").textContent=s||"";$("feedback").hidden=!s;$("feedback").classList.toggle("error",error);}
function dashboard(yes){$("login-panel").hidden=yes;$("dashboard").hidden=!yes;}
async function call(action,fields={}){
 const resp=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+await session.token()},body:JSON.stringify({action,...fields})});
 let data={};try{data=await resp.json()}catch{}
 if(!resp.ok)throw Object.assign(Error(data.error||"요청 처리 실패"),{status:resp.status});
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
function renderSignupEmailStatus(state){
 emailNotificationState=state||null;
 const canSend=state?.configured===true;
 const count=state?.counts||{queued:0,processing:0,sent:0,failed:0};
 $("signup-email-config").textContent=canSend?
  "이메일 발송 설정 완료 · 새로운 온라인 신청이 접수되면 Gmail로 알림을 보냅니다.":
  "이메일 발송 설정 대기 · 테스트 Supabase Secrets에 RESEND_API_KEY와 RESEND_FROM_EMAIL 등록 필요";
 $("signup-email-counts").textContent="발송 대기 "+((count.queued||0)+(count.processing||0))+"건 · 발송 완료 "+(count.sent||0)+"건 · 실패 "+(count.failed||0)+"건";
 const last=state?.last?.find(x=>x.status==="failed");
 $("signup-email-last").hidden=!last;
 $("signup-email-last").textContent=last?"최근 실패: "+(last.last_error||"알림 전송 실패"):"";
 $("signup-email-retry").disabled=!canSend||((count.queued||0)+(count.failed||0)===0);
}
async function load(){
 const r=await call("status");subscribers=r.subscribers||[];events=r.events||[];campaigns=r.campaigns||[];configured=r.configured===true;
 renderSignupEmailStatus(r.emailNotifications);
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
function normalizedPhone(s){return String(s||"").replace(/\D/g,"");}
function matchesPerson(p,query){
 const raw=String(query||"").trim();
 if(!raw)return true;
 if(String(p.name||"").toLocaleLowerCase("ko-KR").includes(raw.toLocaleLowerCase("ko-KR")))return true;
 const digits=normalizedPhone(raw);
 return digits.length>0&&/^[\d\s()+-]+$/.test(raw)&&normalizedPhone(p.phone).includes(digits);
}
function renderPeople(){
 const dest=$("people");dest.replaceChildren();const filter=$("filter").value;
 const query=$("people-search").value;
 const visible=subscribers.filter(p=>(filter==="all"||p.status===filter)&&matchesPerson(p,query));
 $("people-result-count").textContent="검색 결과 "+visible.length+"명 / 전체 "+subscribers.length+"명";
 for(const p of visible){
  const tr=document.createElement("tr"),box=document.createElement("input");
  box.type="checkbox";box.checked=selected.has(p.id);box.disabled=p.status!=="active";
  box.setAttribute("aria-label",p.name+" 선택");box.addEventListener("change",()=>{if(box.checked)selected.add(p.id);else selected.delete(p.id);updateCount();});
  const first=document.createElement("td");first.append(box);tr.append(first);
  const name=cell(tr,p.name),phone=document.createElement("small");phone.textContent=p.phone;name.append(phone);
  const origin=document.createElement("span");origin.className="manual-source"+(p.entry_source==="manual"?"":" web");
  origin.textContent=p.entry_source==="manual"?"현장 동의 · 문자 미인증":"온라인 SMS 인증";
  name.append(origin);
  cell(tr,p.status==="active"?"수신동의":"수신거부");
  cell(tr,new Date(p.subscribed_at).toLocaleDateString("ko-KR",{timeZone:"Asia/Seoul"}));
  const action=document.createElement("td"),actions=document.createElement("div");actions.className="person-actions";
  const editName=document.createElement("button");editName.className="btn";editName.type="button";editName.textContent="이름 수정";
  editName.addEventListener("click",()=>openNameEditor(p));actions.append(editName);
  if(p.status==="active"){
   if(p.entry_source==="manual"){
    const edit=document.createElement("button");edit.type="button";edit.className="btn";edit.textContent="수정";
    edit.addEventListener("click",()=>openManualForm(p));actions.append(edit);
   }
   const btn=document.createElement("button");btn.className="btn";btn.type="button";btn.textContent="수신거부";
   btn.addEventListener("click",async()=>{if(!confirm(p.name+"님의 수신을 거부 처리합니까?"))return;try{await call("unsubscribe",{id:p.id});notice("수신거부가 반영되었습니다.");selected.delete(p.id);await load()}catch(e){notice(e.message,true)}});actions.append(btn);
  }else{const off=document.createElement("span");off.textContent="수신거부 완료";off.className="muted";actions.append(off);}
  action.append(actions);tr.append(action);dest.append(tr);
 }
 if(!dest.children.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.textContent=query.trim()?"검색 결과가 없습니다. 이름 또는 휴대폰 번호를 다시 확인해 주세요.":"등록자가 없습니다.";tr.append(td);dest.append(tr)}
 updateCount();
}


function closeNameEditor(){
 editingNameId=null;$("name-edit-area").hidden=true;
 $("name-edit-form").reset();
}
function openNameEditor(person){
 if(!$("manual-form-area").hidden)closeManualForm();
 editingNameId=person.id;
 $("name-edit-name").value=person.name==="이름 미제공"?"":person.name;
 $("name-edit-phone").value=person.phone;
 $("name-edit-area").hidden=false;
 $("name-edit-area").scrollIntoView({behavior:"smooth",block:"nearest"});
 $("name-edit-name").focus();$("name-edit-name").select();notice("");
}
$("name-edit-cancel").addEventListener("click",closeNameEditor);
$("name-edit-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const p=subscribers.find(x=>x.id===editingNameId),name=$("name-edit-name").value.trim();
 if(!p)return notice("수정할 등록자를 다시 선택해 주세요.",true);
 if(!name||name.length>40)return notice("이름은 1~40자로 입력해 주세요.",true);
 if(name===p.name){closeNameEditor();return notice("기존 이름과 동일합니다.");}
 if(!confirm("휴대폰 번호 "+p.phone+"의 이름을\\n'"+p.name+"' → '"+name+"'(으)로 변경하시겠습니까?\\n\\n인증 및 수신동의 정보는 변경되지 않습니다."))return;
 const button=$("name-edit-save");button.disabled=true;
 try{
  const result=await call("rename_subscriber",{id:p.id,name,expectedUpdatedAt:p.updated_at});
  closeNameEditor();
  await load();
  notice(result.message||"이름을 수정했습니다.");
 }catch(error){notice(error.message,true);}
 finally{button.disabled=false;}
});
$("people-search").addEventListener("input",renderPeople);

const todaySeoul=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
function closeManualForm(){
 editingManualId=null;$("manual-form-area").hidden=true;
 $("manual-open").setAttribute("aria-expanded","false");$("manual-form").reset();
 $("manual-form-title").textContent="방문자 직접 등록";
 $("manual-save").textContent="방문자 등록";
}
function openManualForm(existing=null){
 editingManualId=existing?.id||null;
 if(!$("name-edit-area").hidden)closeNameEditor();
 $("manual-form").reset();
 $("manual-consent-date").max=todaySeoul();
 $("manual-consent-date").value=existing?.manual_consent_date||todaySeoul();
 if(existing){
  if(existing.entry_source!=="manual"||existing.status!=="active")return notice("현장 등록한 활성 수신동의자만 직접 수정할 수 있습니다.",true);
  $("manual-name").value=existing.name==="이름 미제공"?"":existing.name;$("manual-phone").value=existing.phone;
  $("manual-consent-method").value=existing.consent_method||"";
  $("manual-evidence").value=existing.consent_evidence||"";
  $("manual-form-title").textContent="현장 등록자 수정";
  $("manual-save").textContent="정보 수정";
 }else{
  $("manual-form-title").textContent="방문자 직접 등록";$("manual-save").textContent="방문자 등록";
 }
 // The administrator must actively re-acknowledge both separately obtained consents.
 $("manual-privacy").checked=false;$("manual-marketing").checked=false;
 $("manual-form-area").hidden=false;$("manual-open").setAttribute("aria-expanded","true");
 $("manual-form-area").scrollIntoView({behavior:"smooth",block:"nearest"});
 $("manual-name").focus();
 notice("");
}
$("manual-open").addEventListener("click",()=>$("manual-form-area").hidden?openManualForm():closeManualForm());
$("manual-cancel").addEventListener("click",closeManualForm);
$("manual-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const name=$("manual-name").value.trim(),phone=$("manual-phone").value.replace(/\D/g,"");
 const consentDate=$("manual-consent-date").value,consentMethod=$("manual-consent-method").value;
 const evidence=$("manual-evidence").value.trim();
 if(!/^01[016789]\d{7,8}$/.test(phone))return notice("정확한 휴대폰 번호를 입력해 주세요.",true);
 if(name.length>40||evidence.length<10||evidence.length>500)return notice("이름은 선택사항이며 동의 기록은 10~500자로 입력해야 합니다.",true);
 if(!$("manual-privacy").checked||!$("manual-marketing").checked)return notice("방문자의 개인정보 및 광고성 SMS 수신 동의를 각각 확인해 주세요.",true);
 const existing=editingManualId?subscribers.find(x=>x.id===editingManualId):null;
 const changingPhone=!!(existing&&phone!==existing.phone);
 const summary=(editingManualId?"현장 등록자의 정보 수정":"현장 방문자 신규 등록")+"\n"+
   "이름: "+(name||"이름 미제공")+"\n휴대폰: "+phone+"\n동의 방법: "+$("manual-consent-method").selectedOptions[0]?.textContent+"\n동의일: "+consentDate+
   (changingPhone?"\n\n휴대폰 번호가 변경되었습니다. 새 번호의 명시적 동의 확인 기록이 필요합니다.":"")+
   "\n\n방문자가 개인정보 수집·이용과 광고성 문자 수신에 명시적으로 동의했는지 확인한 후 저장하시겠습니까?";
 if(!confirm(summary))return;
 const button=$("manual-save");button.disabled=true;button.textContent="확인 중...";
 try{
  const payload={name,phone,consentDate,consentMethod,evidence,privacyAgreed:true,marketingAgreed:true};
  const result=await call(editingManualId?"manual_update":"manual_register",editingManualId?{...payload,id:editingManualId}:payload);
  closeManualForm();
  await load();
  notice(result.message||"현장 방문자 등록을 완료했습니다.");
 }catch(error){notice(error.message,true);}
 finally{button.disabled=false;if(!$("manual-form-area").hidden)button.textContent=editingManualId?"정보 수정":"방문자 등록";}
});
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
$("signup-email-retry").addEventListener("click",async()=>{
 if(!emailNotificationState?.configured)return notice("이메일 발송 서비스 설정을 완료해 주세요.",true);
 const btn=$("signup-email-retry");btn.disabled=true;notice("");
 try{
  const result=await call("retry_signup_emails");
  await load();
  notice(result.message||"이메일 알림 재시도 요청을 처리했습니다.");
 }catch(error){notice(error.message,true);}
 finally{btn.disabled=false;}
});
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
 token=data.token;session?.save(token,data.expires_in,data.refresh_token);$("password").value="";await load();}
 catch(e){notice(e.message,true)}finally{btn.disabled=false;}
});
$("logout").addEventListener("click",()=>{token="";session?.clear();subscribers=[];selected.clear();dashboard(false);notice("")});
const saved=session?.read();if(saved){token=saved;load().catch(e=>{if(e.status===401||e.status===403){token="";session?.clear();dashboard(false);}notice(e.message,true)})}
preview();
})();