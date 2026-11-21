export const db={},auth={currentUser:{uid:'hCzWmAlwyWVeNVYnl1CblkMsXkW2'}},storage={};
export const Timestamp={fromDate:d=>({toDate:()=>d,seconds:d.getTime()/1000})};
const news=Array.from({length:13},(_,i)=>({id:'test-'+i,title:i===0?'<script>window.xss=true</script>':'소식 '+i,summary:'목록 요약',body:'본문',published:true,publishedAt:Timestamp.fromDate(new Date(2026,0,13-i))}));
const data={news,certificates:[],progress:[],settings:[]};window.testData=data;
export const collection=(db,name)=>({name}),doc=(db,name,id)=>({name,id}),where=(...a)=>({where:a}),limit=n=>({limit:n}),orderBy=()=>({}),startAfter=d=>({after:d});export const query=(c,...args)=>({...c,args});
export async function getDocs(q){let r=data[q.name]||[];if(q.args?.some(x=>x.where))r=r.filter(x=>x.published);const a=q.args?.find(x=>x.after)?.after;if(a)r=r.slice(r.findIndex(x=>x.id===a.id)+1);const l=q.args?.find(x=>x.limit)?.limit;if(l)r=r.slice(0,l);return {docs:r.map(x=>({id:x.id,data:()=>x}))};}
export async function getDoc(d){const x=data[d.name]?.find(x=>x.id===d.id);return {exists:()=>!!x,data:()=>x};}
export async function setDoc(d,x,options){let old=data[d.name].find(i=>i.id===d.id);if(old)Object.assign(old,x);else data[d.name].push({...x,id:d.id});}
export async function addDoc(c,x){data[c.name].push({...x,id:'new-'+Date.now()});}
export async function deleteDoc(d){data[d.name]=data[d.name].filter(x=>x.id!==d.id);}
export const onAuthStateChanged=(a,fn)=>setTimeout(()=>fn(a.currentUser),0),signInWithEmailAndPassword=async()=>{},signOut=async()=>{},setPersistence=async()=>{},browserSessionPersistence={};export const ref=(s,path)=>({path}),uploadBytes=async()=>{},getDownloadURL=async()=>'',deleteObject=async()=>{};
