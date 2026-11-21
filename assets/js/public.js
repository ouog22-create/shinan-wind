import {node,image,timeline,openCertificate} from './ui.js';
import {db,collection,query,where,limit,getDocs,getDoc,doc,orderBy,startAfter} from './firebase.js';
const page=document.body.dataset.page;
const rows=s=>s.docs.map(d=>({id:d.id,...d.data()}));
async function published(name,extra=[]){return rows(await getDocs(query(collection(db,name),where('published','==',true),...extra)));}
async function run(){
 if(page==='home'||page==='progress/'){
  const data=await published('progress');data.sort((a,b)=>b.sortKey.localeCompare(a.sortKey));
  if(page==='home')timeline(data.filter(x=>x.type==='done').slice(0,3),document.getElementById('recent'));
  else{timeline(data.filter(x=>x.type==='done'),document.getElementById('history'));timeline(data.filter(x=>x.type==='plan').reverse(),document.getElementById('plans'));const s=await getDoc(doc(db,'settings','progress'));document.getElementById('stage').textContent=s.exists()?s.data().stage:'현재 단계 확인 필요';document.getElementById('as-of').textContent=s.exists()?s.data().asOf:'';}
 }
 if(page==='overview/'){
  const target=document.getElementById('certificates'),data=await published('certificates');target.replaceChildren();data.sort((a,b)=>a.order-b.order).forEach(x=>{const b=node('button',undefined,'cert-button');b.append(image(x.imageUrl,x.imageAlt),node('span',x.title));b.addEventListener('click',()=>openCertificate(x.title,x.imageUrl,x.imageAlt,b));target.append(b);});if(!data.length)target.append(node('p','등록된 인증서가 없습니다. 원본 수급 후 게시됩니다.','empty'));
 }
 if(page==='community/')await loadNews();
 if(page==='community/news/'){
  const target=document.getElementById('news-detail'),id=new URLSearchParams(location.search).get('id');let d;
  if(id&&!id.includes('/')){try{d=await getDoc(doc(db,'news',id));}catch(e){if(e.code!=='permission-denied')throw e;}}
  target.replaceChildren();if(!d?.exists()||!d.data().published){target.append(node('h2','게시물을 찾을 수 없습니다'));return;}
  const x=d.data();target.append(node('h2',x.title),node('p',date(x.publishedAt),'note'));if(x.imageUrl)target.append(image(x.imageUrl,x.imageAlt));target.append(node('div',x.body,'body'));document.title=x.title+' | 주민상생';
 }
}
function date(value){return value?.toDate?value.toDate().toLocaleDateString('ko-KR'):'';}
let cursors=[null],current=0,busy=false;
async function loadNews(){if(busy)return;busy=true;const prev=document.getElementById('previous'),next=document.getElementById('next');prev.disabled=next.disabled=true;try{const constraints=[orderBy('publishedAt','desc'),limit(13)];if(cursors[current])constraints.push(startAfter(cursors[current]));const snap=await getDocs(query(collection(db,'news'),where('published','==',true),...constraints));const data=rows(snap).slice(0,12),target=document.getElementById('news-list');target.replaceChildren();data.forEach(x=>{const a=node('a',undefined,'news-card');a.href='news/?id='+encodeURIComponent(x.id);if(x.imageUrl)a.append(image(x.imageUrl,x.imageAlt));a.append(node('h3',x.title),node('p',x.summary),node('time',date(x.publishedAt),'note'));target.append(a);});if(!data.length)target.append(node('p','등록된 주민상생 소식이 없습니다.','empty'));cursors[current+1]=snap.docs[11];prev.disabled=current===0;next.disabled=snap.docs.length<=12;document.getElementById('page-number').textContent=String(current+1);}finally{busy=false;}}
document.getElementById('previous')?.addEventListener('click',()=>{current--;loadNews().catch(showError);});document.getElementById('next')?.addEventListener('click',()=>{current++;loadNews().catch(showError);});
function showError(e){console.error(e);for(const id of ['recent','history','plans','certificates','news-list','news-detail']){const t=document.getElementById(id);if(t)t.replaceChildren(node('p','정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.','empty'));}}
run().catch(showError);
