import {db,doc,getDoc} from './firebase.js';

const originalTitles = {
  generation: '발전사업허가증',
  waters: '공유수면 점사용 허가서',
  consultation: '해역이용협의 결과',
  transmission: '송전용전기설비 이용계약서'
};

export const originalSettings = () => doc(db,'settings','originalCertificates');

export async function originalCertificates() {
  const settings = await getDoc(originalSettings());
  const visibility = settings.exists() ? settings.data() : {};
  return Object.entries(originalTitles)
    .filter(([key]) => visibility[key] !== false)
    .map(([key,title],order) => ({originalKey:key,title,order,published:true}));
}
