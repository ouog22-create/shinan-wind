import {originalProgress,progressSettings} from './progress.js';
import {originalCertificates,originalSettings,formatCertificateDate} from './certificates.js';
import {renderNewsBody} from './news-body.js';
import {node,safeImage} from './ui.js';
import {ADMIN_UID} from './firebase-config.js';
import {db,auth,storage,collection,getDocs,getDoc,doc,setDoc,addDoc,deleteDoc,Timestamp,onAuthStateChanged,signInWithEmailAndPassword,signOut,setPersistence,browserSessionPersistence,ref,uploadBytes,getDownloadURL,deleteObject} from './firebase.js';
const status=document.getElementById('admin-status'),form=document.getElementById('editor-form');let tab='news',editing=null,records=[],busy=false,epoch=0;
const titles={news:'주민상생 뉴스',certificates:'인증서',progress:'추진경과',settings:'현재 단계'};
function message(text,error=false){status.textContent=text;status.className=error?'error':'';}
function failure(e){console.error(e);message(e.code==='auth/invalid-credential'?'이메일 또는 비밀번호를 확인해 주세요.':(e.code?'작업을 완료하지 못했습니다. 권한과 연결 상태를 확인해 주세요.':e.message),true);}
document.getElementById('login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await setPersistence(auth,browserSessionPersistence);await signInWithEmailAndPassword(auth,e.target.email.value,e.target.password.value);e.target.password.value='';}catch(err){failure(err);}finally{button.disabled=false;}});
document.getElementById('logout').addEventListener('click',()=>signOut(auth).catch(failure));
const menuButtons=document.querySelectorAll('#dashboard .tabs button');
function showPanel(id){
  document.getElementById('news-panel').hidden=id!=='news-panel';
  document.getElementById('admins-panel').hidden=id!=='admins-panel';
  for(const button of menuButtons){
    const active=button.getAttribute('aria-controls')===id && (!button.dataset.collection || button.dataset.collection===tab);
    button.setAttribute('aria-pressed',String(active));
  }
}
for(const button of menuButtons){
  button.addEventListener('click',()=>{
    const selected=button.dataset.collection;
    if(selected && selected!==tab){
      tab=selected;
      form.replaceChildren();
      document.getElementById('records').replaceChildren();
      document.getElementById('list-title').textContent=titles[tab];
      edit(null);
      refresh().catch(failure);
    }
    showPanel(button.getAttribute('aria-controls'));
  });
}
onAuthStateChanged(auth,async user=>{epoch++;const allowed=user?.uid===ADMIN_UID;
  tab='news';
  showPanel('news-panel');
  document.getElementById('admin-email').textContent=allowed?(user.email||'이메일 정보 없음'):'';
  document.getElementById('login-section').hidden=allowed;document.getElementById('dashboard').hidden=!allowed;if(user&&!allowed){await signOut(auth);message('관리자 권한이 없는 계정입니다.',true);return;}message(allowed?'로그인되었습니다. 저장하면 공개 사이트에 반영됩니다.':'관리자 계정으로 로그인해 주세요.');if(allowed)refresh().catch(failure);else{records=[];form.replaceChildren();document.getElementById('records').replaceChildren();}});
document.getElementById('new-record').addEventListener('click',()=>edit(null));
async function refresh(){const token=++epoch,selected=tab;const snap=selected==='settings'?await getDoc(doc(db,'settings','progress')):await getDocs(collection(db,selected));const originals=selected==='certificates'?await originalCertificates():selected==='progress'?await originalProgress():[];if(token!==epoch||!auth.currentUser)return;records=selected==='settings'?(snap.exists()?[{id:'progress',...snap.data()}]:[]):snap.docs.map(d=>({id:d.id,...d.data()}));records.unshift(...originals);records.sort((a,b)=>selected==='certificates'?a.order-b.order:selected==='progress'?(a.order??999)-(b.order??999)||(a.sortKey||'').localeCompare(b.sortKey||''):(b.publishedAt?.seconds||0)-(a.publishedAt?.seconds||0));document.getElementById('list-title').textContent=titles[selected];document.getElementById('new-record').hidden=selected==='settings';render();edit(selected==='settings'?records[0]||null:null);}
function render(){const list=document.getElementById('records');list.replaceChildren();records.forEach(x=>{const card=node('article',undefined,'record');card.append(node('h3',x.title||x.text||x.stage),node('small',tab==='settings'?x.asOf:tab==='progress'?x.date+' · '+(x.type==='plan'?'미완료':'완료'):(tab==='certificates'?(formatCertificateDate(x.certifiedAt)||'날짜 미입력'):(x.publishedAt?.toDate?.().toLocaleDateString('ko-KR')||''))));if(tab!=='settings')card.append(node('small',x.published?'게시 중':'비게시'));const editButton=node('button','수정');editButton.type='button';editButton.addEventListener('click',()=>edit(x));card.append(editButton);if(tab!=='settings'){const toggle=node('button',x.published?'비게시로 전환':'게시');toggle.type='button';toggle.addEventListener('click',()=>mutate(async()=>{if(x.originalKey)await setDoc(tab==='progress'?progressSettings():originalSettings(),{[x.originalKey]:{...x,published:!x.published}},{merge:true});else await setDoc(doc(db,tab,x.id),{published:!x.published},{merge:true});}));const del=node('button','삭제');del.type='button';del.addEventListener('click',()=>{if(confirm('이 항목을 삭제할까요?'))mutate(async()=>{if(x.originalKey)await setDoc(tab==='progress'?progressSettings():originalSettings(),{[x.originalKey]:false},{merge:true});else await deleteDoc(doc(db,tab,x.id));if(x.imageUrl){try{await deleteObject(ref(storage,x.imageUrl));}catch(e){message('문서는 삭제됐습니다. 이미지 파일 정리가 필요합니다.',true);}}});});card.append(toggle,del);if(tab==='progress'){const state=node('button',x.type==='plan'?'완료로 변경':'미완료로 변경');state.type='button';state.addEventListener('click',()=>mutate(()=>x.originalKey?setDoc(progressSettings(),{[x.originalKey]:{...x,type:x.type==='plan'?'done':'plan'}},{merge:true}):setDoc(doc(db,'progress',x.id),{type:x.type==='plan'?'done':'plan'},{merge:true})));card.append(state);}}list.append(card);});if(!records.length)list.append(node('p','등록된 항목이 없습니다.','empty'));}
function field(name,label,type='text',value='',required=true,max){const l=node('label',label);l.htmlFor=name;let el=node(type==='textarea'?'textarea':type==='select'?'select':'input');el.id=el.name=name;if(!['textarea','select'].includes(type))el.type=type;if(type==='checkbox')el.checked=!!value;else el.value=value??'';el.required=required;if(max)el.maxLength=max;form.append(l,el);return el;}
function newsEditor(record) {
  const body = field('body','본문','textarea',record?.body);
  body.dataset.format = record ? record.bodyFormat || 'plain' : 'markdown-basic';
  const toolbar = node('div',undefined,'news-tools');
  toolbar.setAttribute('role','group');
  toolbar.setAttribute('aria-label','본문 편집');
  for (const [label, prefix, suffix] of [['소제목','## ',''],['굵게','**','**'],['글머리 목록','- ','']]) {
    const button = node('button',label);
    button.type = 'button';
    button.addEventListener('click',()=>{
      let start = body.selectionStart;
      const end = body.selectionEnd;
      if (!suffix) start = body.value.slice(0,start).lastIndexOf('\n') + 1;
      const selected = body.value.slice(start,end) || label;
      const replacement = suffix ? prefix + selected + suffix : selected.split('\n').map(line=>prefix+line).join('\n');
      body.setRangeText(replacement,start,end,'end');
      body.dataset.format = 'markdown-basic';
      body.focus();
      body.setSelectionRange(start+prefix.length,start+replacement.length-suffix.length);
      body.dispatchEvent(new Event('input'));
    });
    toolbar.append(button);
  }
  const toggle = node('button','미리보기');
  toggle.type = 'button';
  const preview = node('div',undefined,'news-preview');
  preview.id = 'body-preview';
  preview.hidden = true;
  toggle.setAttribute('aria-controls',preview.id);
  toggle.setAttribute('aria-expanded','false');
  function updatePreview() {
    if (preview.hidden) return;
    preview.replaceChildren();
    renderNewsBody(preview,body.value,body.dataset.format);
  }
  toggle.addEventListener('click',()=>{
    preview.hidden = !preview.hidden;
    toggle.setAttribute('aria-expanded',String(!preview.hidden));
    updatePreview();
  });
  body.addEventListener('input',updatePreview);
  toolbar.append(toggle);
  body.before(toolbar);
  body.after(preview);
}
function edit(x){editing=x;form.replaceChildren();document.getElementById('editor-title').textContent=x?'항목 수정':'새 항목';if(tab==='news'){field('title','제목','text',x?.title,true,200);field('summary','목록 요약','textarea',x?.summary,true,300);newsEditor(x);const dt=x?.publishedAt?.toDate?.()||new Date();const local=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);field('publishedAt','게시일','datetime-local',local);}
 if(tab==='certificates'){field('certifiedAt','인증 연월','month',x?.certifiedAt?.slice(0,7));field('title','인증서명','text',x?.title,true,200);field('order','표시 순서','number',x?.order??records.length).step='1';}
 if(['news','certificates'].includes(tab)){const file=field('image',tab==='news'?'대표 이미지':'이미지 파일','file','',false);file.accept='image/jpeg,image/png,image/webp';const guide=node('p',(tab==='news'?'권장 크기 1600 × 900px (16:9). ':'')+'JPG, PNG, WebP · 원본 20MB 이하. 저장 시 긴 변 최대 1600px, 1MB 미만의 WebP로 변환합니다.','note');guide.id='image-guide';file.setAttribute('aria-describedby',guide.id);form.append(guide);field('imageAlt','이미지 설명','text',x?.imageAlt,tab==='certificates',300);if(x?.imageUrl){const a=node('a','현재 이미지 보기');a.href=safeImage(x.imageUrl);a.target='_blank';a.rel='noopener noreferrer';form.append(a);}}
 if(tab==='progress'){field('date','표시 날짜','text',x?.date,true,50);field('sortKey','정렬 날짜 (YYYY-MM)','month',x?.sortKey);field('text','내용','textarea',x?.text);const select=field('type','구분','select');for(const [v,t] of [['plan','미완료'],['done','완료']]){const op=node('option',t);op.value=v;select.append(op);}select.value=x?.type||'done';}
 if(tab==='settings'){field('stage','현재 단계','text',x?.stage,true,300);field('asOf','기준일·자료 출처','text',x?.asOf,true,300);}else field('published','공개 사이트에 게시','checkbox',x?.published??false,false);
 const actions=node('div',undefined,'form-actions');const save=node('button','저장');save.type='submit';actions.append(save);form.append(actions);}
export async function convertImage(file){if(file.size>20*1024*1024)throw Error('20MB 이하의 이미지를 선택해 주세요.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP만 업로드할 수 있습니다.');const bitmap=await createImageBitmap(file);const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();for(const q of [.86,.76,.64,.5,.35]){const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',q));if(!blob||blob.type!=='image/webp')throw Error('이 브라우저에서는 WebP 변환을 지원하지 않습니다.');if(blob.size<1024*1024)return blob;}throw Error('변환 후 1MB 미만이 되지 않았습니다. 더 작은 이미지를 선택해 주세요.');}
async function mutate(action){if(busy)return;busy=true;document.querySelectorAll('#dashboard button').forEach(b=>b.disabled=true);try{await action();await refresh();message('저장했습니다.');}catch(e){failure(e);}finally{busy=false;document.querySelectorAll('#dashboard button').forEach(b=>b.disabled=false);}}
form.addEventListener('submit',e=>{e.preventDefault();const selected=tab,previous=editing,values=new FormData(form);mutate(async()=>{const data={};let uploaded=null;for(const key of selected==='news'?['title','summary','body']:selected==='certificates'?['title','certifiedAt']:selected==='progress'?['date','sortKey','text','type']:['stage','asOf'])data[key]=String(values.get(key)||'').trim();if(selected!=='settings')data.published=values.has('published');if(selected==='news'){data.bodyFormat=form.elements.body.dataset.format;data.publishedAt=Timestamp.fromDate(new Date(values.get('publishedAt')));}if(selected==='certificates'){data.order=Number(values.get('order'));data.dateExample=false;}if(selected==='progress'&&previous?.order!=null)data.order=previous.order;if(['news','certificates'].includes(selected)){data.imageUrl=previous?.imageUrl||'';data.imageAlt=String(values.get('imageAlt')||'').trim();const file=values.get('image');if(file?.size){if(!data.imageAlt)throw Error('이미지 설명을 입력해 주세요.');const blob=await convertImage(file);uploaded=ref(storage,selected+'/'+crypto.randomUUID()+'.webp');await uploadBytes(uploaded,blob,{contentType:'image/webp'});data.imageUrl=await getDownloadURL(uploaded);}if(selected==='certificates'&&!previous?.originalKey&&!data.imageUrl)throw Error('인증서 이미지를 선택해 주세요.');}try{if(selected==='settings')await setDoc(doc(db,'settings','progress'),data);else if(previous?.originalKey)await setDoc(selected==='progress'?progressSettings():originalSettings(),{[previous.originalKey]:data},{merge:true});else if(previous)await setDoc(doc(db,selected,previous.id),data);else await addDoc(collection(db,selected),data);}catch(error){if(uploaded)await deleteObject(uploaded).catch(()=>{});throw error;}if(uploaded&&previous?.imageUrl)await deleteObject(ref(storage,previous.imageUrl)).catch(()=>{});});});
