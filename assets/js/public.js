// 공개 페이지 데이터: Firestore의 게시(published) 항목을 시안 디자인 마크업으로 그린다.
import {db,collection,query,where,limit,getDocs,getDoc,doc,orderBy,startAfter} from './firebase.js';
const route=document.body.dataset.page;
const rows=s=>s.docs.map(d=>({id:d.id,...d.data()}));
const published=async name=>rows(await getDocs(query(collection(db,name),where('published','==',true))));
const refresh=()=>window.siteRefresh&&window.siteRefresh();
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function icon(name){const t=document.getElementById('icons'),i=t&&t.content.querySelector(`[data-name="${name}"] svg`);return i?i.cloneNode(true):document.createTextNode('')}
function safeUrl(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function img(url,alt){const i=el('img');i.src=safeUrl(url);i.alt=alt||'';i.loading='lazy';return i}
function ymd(v){const t=v&&v.toDate?v.toDate():null;if(!t)return '';const p=n=>String(n).padStart(2,'0');return `${t.getFullYear()}. ${p(t.getMonth()+1)}. ${p(t.getDate())}`}
function isoDate(v){const t=v&&v.toDate?v.toDate():null;return t?t.toISOString().slice(0,10):''}
const bySort=(a,b)=>String(a.sortKey).localeCompare(String(b.sortKey));

// 메인: 최근 추진 이력 3건(최신순)
async function home(){
  const list=document.querySelector('.mh-list');if(!list)return;
  const done=(await published('progress')).filter(x=>x.type==='done').sort(bySort).reverse().slice(0,3);
  if(!done.length)return;
  list.replaceChildren(...done.map(x=>{const li=el('li','mh-row');li.append(el('time','mh-date',x.date),el('p','mh-text',x.text));return li}));
}

// 추진경과: 시간순(이력 → 계획) 4개씩 묶어 이미지와 좌우 교차 배치, 계획은 크림슨
async function progress(){
  const tl=document.querySelector('.tl2');if(!tl)return;
  const data=await published('progress');if(!data.length)return;
  const seq=[...data.filter(x=>x.type!=='plan').sort(bySort),...data.filter(x=>x.type==='plan').sort(bySort)];
  const pics=[...tl.querySelectorAll('.tl2-img img')].map(i=>({src:i.getAttribute('src'),alt:i.alt,w:i.width,h:i.height}));
  const track=tl.querySelector('.tl2-track');tl.replaceChildren(track);
  for(let g=0;g*4<seq.length;g++){
    const group=el('div','tl2-group'+(g%2?' is-flip':'')),ol=el('ol','steps');ol.start=g*4+1;
    seq.slice(g*4,g*4+4).forEach(x=>{const li=el('li','step'+(x.type==='plan'?' is-plan':''));const p=el('p');
      if(x.type==='plan')p.append(el('span','sr-only','(예정) '));p.append(x.text);li.append(el('time',null,x.date),p);ol.append(li)});
    const box=el('div','tl2-img'),pic=pics[g%pics.length];
    if(pic){const i=img(pic.src,pic.alt);i.width=pic.w;i.height=pic.h;box.append(i)}
    group.append(ol,box);tl.append(group);
  }
}

// 사업개요: 인증서(표시 순서), 누르면 확대
async function certificates(){
  const ul=document.getElementById('certificates');if(!ul)return;
  const data=(await published('certificates')).sort((a,b)=>(a.order||0)-(b.order||0));
  if(!data.length){ul.replaceChildren(el('li','empty','등록된 인증서가 없습니다. 원본 수급 후 게시됩니다.'));return}
  ul.replaceChildren(...data.map(x=>{const li=el('li'),b=el('button','cert');b.type='button';b.dataset.cert=x.title;b.dataset.src=safeUrl(x.imageUrl);b.setAttribute('aria-haspopup','dialog');
    const cap=el('span',null,x.title);cap.append(icon('zoom-in'));b.append(img(x.imageUrl,''),cap);li.append(b);return li}));
}

// 주민상생: 뉴스 목록(12건씩)
let cursors=[null],current=0,busy=false;
async function newsList(){
  const list=document.getElementById('news-list');if(!list||busy)return;busy=true;
  const prev=document.getElementById('previous'),next=document.getElementById('next');prev.disabled=next.disabled=true;
  try{
    const c=[where('published','==',true),orderBy('publishedAt','desc'),limit(13)];if(cursors[current])c.push(startAfter(cursors[current]));
    const snap=await getDocs(query(collection(db,'news'),...c)),data=rows(snap).slice(0,12);
    list.replaceChildren(...data.map(x=>{const li=el('li'),a=el('a','news-card');a.href='news/?id='+encodeURIComponent(x.id);
      const t=el('time',null,ymd(x.publishedAt));t.dateTime=isoDate(x.publishedAt);a.append(el('p','news-title',x.title),t,icon('chevron-right'));li.append(a);return li}));
    if(!data.length)list.append(el('li','empty','등록된 주민상생 소식이 없습니다.'));
    cursors[current+1]=snap.docs[11];prev.disabled=current===0;next.disabled=snap.docs.length<=12;
    prev.closest('nav').hidden=prev.disabled&&next.disabled;document.getElementById('page-number').textContent=String(current+1);
  }finally{busy=false}
}
document.getElementById('previous')?.addEventListener('click',()=>{current--;newsList().then(refresh).catch(fail)});
document.getElementById('next')?.addEventListener('click',()=>{current++;newsList().then(refresh).catch(fail)});

// 주민상생 뉴스 상세
async function newsDetail(){
  const art=document.getElementById('news-detail');if(!art)return;
  const id=new URLSearchParams(location.search).get('id');let snap=null;
  if(id&&!id.includes('/')){try{snap=await getDoc(doc(db,'news',id))}catch(e){if(e.code!=='permission-denied')throw e}}
  const head=el('header','article-head'),foot=el('footer','article-foot'),back=el('a','btn btn-line');back.href='../';back.append(icon('list'),'목록으로');foot.append(back);
  if(!snap||!snap.exists()||!snap.data().published){head.append(el('h2',null,'게시물을 찾을 수 없습니다'));art.replaceChildren(head,foot);return}
  const x=snap.data(),t=el('time',null,ymd(x.publishedAt));t.dateTime=isoDate(x.publishedAt);head.append(el('h2',null,x.title),t);
  const prose=el('div','prose');
  if(x.imageUrl){const f=el('figure');f.append(img(x.imageUrl,x.imageAlt));prose.append(f)}
  String(x.body||'').split(/\n{2,}/).filter(Boolean).forEach(p=>prose.append(el('p',null,p)));
  art.replaceChildren(head,prose,foot);document.title=x.title+' | 주민상생 | 신안어의 해상풍력발전사업';
}

function fail(e){console.error(e);
  const msg='정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  for(const id of ['certificates','news-list']){const t=document.getElementById(id);if(t)t.replaceChildren(el('li','empty',msg))}
  const a=document.getElementById('news-detail');if(a){const h=el('header','article-head');h.append(el('h2',null,msg));a.replaceChildren(h)}
}
const jobs={'/':home,'/progress':progress,'/overview':certificates,'/community':newsList,'/news':newsDetail};
(jobs[route]?jobs[route]():Promise.resolve()).then(refresh).catch(e=>{fail(e);refresh()});
