import {originalCertificates} from './certificates.js';
import {renderNewsBody} from './news-body.js';
// 공개 페이지 데이터: 관리 대상인 주민상생 뉴스만 Firestore에서 불러와 시안 디자인 마크업으로 그린다.
// (추진경과·인증서는 tools/build_site.py가 페이지에 고정해 넣는다)
import {db,collection,query,where,limit,getDocs,getDoc,doc,orderBy,startAfter} from './firebase.js';
const route=document.body.dataset.page;
const rows=s=>s.docs.map(d=>({id:d.id,...d.data()}));
const refresh=()=>window.siteRefresh&&window.siteRefresh();
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function icon(name){const t=document.getElementById('icons'),i=t&&t.content.querySelector(`[data-name="${name}"] svg`);return i?i.cloneNode(true):document.createTextNode('')}
function safeUrl(url){try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function img(url,alt){const i=el('img');i.src=safeUrl(url);i.alt=alt||'';i.loading='lazy';return i}
function ymd(v){const t=v&&v.toDate?v.toDate():null;if(!t)return '';const p=n=>String(n).padStart(2,'0');return `${t.getFullYear()}. ${p(t.getMonth()+1)}. ${p(t.getDate())}`}
function isoDate(v){const t=v&&v.toDate?v.toDate():null;return t?t.toISOString().slice(0,10):''}

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
  renderNewsBody(prose,x.body,x.bodyFormat);
  art.replaceChildren(head,prose,foot);document.title=x.title+' | 주민상생 | 신안어의 해상풍력발전사업';
}

async function certificates(){
  const list=document.querySelector('.certs');
  if(!list)return;
  const [originals,snapshot]=await Promise.all([
    originalCertificates(),
    getDocs(query(collection(db,'certificates'),where('published','==',true)))
  ]);
  const entries=[...originals,...rows(snapshot)].sort((a,b)=>a.order-b.order);
  const fileIcon=list.querySelector('svg');
  list.replaceChildren(...entries.map(entry=>{
    const item=el('li','cert');
    if(fileIcon)item.append(fileIcon.cloneNode(true));
    const url=entry.imageUrl && safeUrl(entry.imageUrl);
    if(url){
      const link=el('a',null,entry.title);
      link.href=url;
      item.append(link);
    }else item.append(el('b',null,entry.title));
    return item;
  }));
  if(!entries.length)list.append(el('li','empty','등록된 인증서가 없습니다.'));
}

function fail(e){console.error(e);
  const msg='정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  for(const id of ['news-list']){const t=document.getElementById(id);if(t)t.replaceChildren(el('li','empty',msg))}
  const certList=document.querySelector('.certs');if(certList)certList.replaceChildren(el('li','empty',msg));
  const a=document.getElementById('news-detail');if(a){const h=el('header','article-head');h.append(el('h2',null,msg));a.replaceChildren(h)}
}
const jobs={'/overview':certificates,'/community':newsList,'/news':newsDetail};
(jobs[route]?jobs[route]():Promise.resolve()).then(refresh).catch(e=>{fail(e);refresh()});
