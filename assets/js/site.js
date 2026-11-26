// 신안어의 해상풍력 공개 사이트 화면 동작 (tools/build_site.py가 생성한 페이지 공용)
// 데이터(Firebase)는 public.js가 그린 뒤 window.siteRefresh()를 불러 목록 연출을 다시 연결한다.
(function(){
document.documentElement.classList.add('js');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const header=$('.gnb'),nav=$('#gnb-nav'),menuBtn=$('.menu-btn'),page=$('.page'),footer=$('.footer');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=v=>Math.min(1,Math.max(0,v));

// 메뉴
function setMenu(open){menuBtn.setAttribute('aria-expanded',String(open));menuBtn.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');nav.classList.toggle('is-open',open);header.classList.toggle('is-open',open)}
menuBtn.addEventListener('click',()=>setMenu(menuBtn.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuBtn.getAttribute('aria-expanded')==='true'){setMenu(false);menuBtn.focus()}});
matchMedia('(min-width:1024px)').addEventListener('change',()=>setMenu(false));

// 헤더 배경·탑 버튼
const toTop=$('.to-top');
function onScroll(){header.classList.toggle('is-solid',scrollY>8);toTop.classList.toggle('is-shown',scrollY>innerHeight*.8)}
toTop.addEventListener('click',()=>{scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});$('#content').focus({preventScroll:true})});

// 서브페이지 페이드업: 화면 하단 92% 선을 넘은 항목을 차례로 보여 준다
const FU='.intro>*,.visit>*,.o-intro,.facts>div,.panel>.panel-title,.permits>li,.certs>li,.process-head,.tl2-group,.news-list>li,.pager,.article-head,.article .prose>*,.article-foot';
let fuItems=[];
function checkFU(){fuItems=fuItems.filter(el=>{if(el.getBoundingClientRect().top<innerHeight*.92){el.classList.add('in');return false}return true})}
function fadeUp(){
  if(!page.classList.contains('sub'))return;
  page.querySelectorAll(FU).forEach(el=>{
    if(el.classList.contains('fu'))return;               // 이미 연결된 항목은 그대로(데이터 갱신 시 깜빡임 방지)
    const sibs=[...el.parentElement.children].filter(c=>c.matches(FU));
    el.style.setProperty('--d',Math.min(sibs.indexOf(el),5)*.08+'s');
    el.classList.add('fu');fuItems.push(el);
  });
  requestAnimationFrame(()=>requestAnimationFrame(checkFU));
}

// 메인 카피: 스크롤만큼 글자 채움 → 주요 수치 등장
const sum=$('.m-summary'),sumChars=sum?[...sum.querySelectorAll('.ch')]:[],reveal=sum&&sum.querySelector('.m-reveal');
function measure(){if(sum)sum.style.setProperty('--reveal-h',reveal.offsetHeight+'px')}
function fill(){
  if(!sum)return;
  if(reduce.matches){sumChars.forEach(c=>c.classList.add('on'));sum.classList.add('is-done');return}
  const r=sum.getBoundingClientRect(),total=sum.offsetHeight-innerHeight;
  const p=clamp((-r.top+innerHeight*.35)/(total+innerHeight*.35));
  const n=Math.round(Math.min(1,p/.72)*sumChars.length);
  sumChars.forEach((c,i)=>c.classList.toggle('on',i<n));
  sum.classList.toggle('is-done',p>=.76);
}

// 추진경과 타임라인: 화면 55% 선 기준으로 진행선을 내리고 지난 단계를 진하게
let tl=null,steps=[];
function tlBind(){tl=$('.tl2');steps=tl?[...tl.querySelectorAll('.step')]:[]}
function tlUpdate(){
  if(!tl)return;
  if(reduce.matches){tl.style.removeProperty('--p');steps.forEach(s=>s.classList.add('is-on'));return}
  const r=tl.getBoundingClientRect(),c=innerHeight*.55,p=Math.min(r.height,Math.max(0,c-r.top));
  tl.style.setProperty('--p',p+'px');
  steps.forEach(s=>{const b=s.getBoundingClientRect();s.classList.toggle('is-on',b.top+b.height*.35<c)});
}

// 마무리 영역을 고정하고 스크롤 진행에 따라 긴 바다 그라데이션을 이동한다.
const stage=$('.m-flow'),cta=stage&&stage.querySelector('.m-cta');
function ctaFill(){
  if(!stage)return;
  const r=stage.getBoundingClientRect();
  const progress=clamp(-r.top/Math.max(1,stage.offsetHeight-innerHeight));
  stage.style.setProperty('--ocean-shift',(-progress*66.666).toFixed(3)+'%');
  cta.classList.toggle('is-entered',r.top<=1||reduce.matches);
  const overOcean=r.top<=header.offsetHeight&&r.bottom>header.offsetHeight&&footer.getBoundingClientRect().top>header.offsetHeight;
  header.classList.toggle('on-dark',overOcean);
  header.classList.toggle('on-ocean',overOcean);
}

// 서브 인트로: 미디어 상승(--rise 1→0) → 흰 타이틀 퇴장(--fade 0→1)
const si=$('.sub-intro');
function introUpdate(){
  if(!si)return;
  if(reduce.matches){si.style.setProperty('--rise',0);header.classList.remove('on-dark');return}
  const vh=innerHeight,r=si.getBoundingClientRect(),y=-r.top;
  const rise=clamp(1-y/vh),fade=clamp((y-1.2*vh)/(.8*vh));
  si.style.setProperty('--rise',rise.toFixed(4));si.style.setProperty('--fade',fade.toFixed(4));
  header.classList.toggle('on-dark',rise*vh<=header.offsetHeight&&r.bottom>header.offsetHeight);
}

function all(){onScroll();fill();tlUpdate();ctaFill();introUpdate();checkFU()}
let tick=false;addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(()=>{all();tick=false})}},{passive:true});
addEventListener('resize',()=>{measure();all()});
document.fonts&&document.fonts.ready.then(measure);
window.siteRefresh=()=>{tlBind();fadeUp();all()};
measure();tlBind();fadeUp();all();
})();
