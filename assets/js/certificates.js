import {db,doc,getDoc} from './firebase.js';

const originalCertificatesData = {
  generation: {title:'발전사업 허가',certifiedAt:'2021-03'},
  consultation: {title:'해역이용평가',certifiedAt:'2023-04'},
  transmission: {title:'송전설비 변경계약(기존 31년 → 변경 27년)',certifiedAt:'2025-11'},
  waters: {title:'공유수면 점사용허가',certifiedAt:'2024-01'}
};

export function formatCertificateDate(value) {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value || '');
  return match ? `${match[1].slice(-2)}년 ${Number(match[2])}월` : '';
}

export const originalSettings = () => doc(db,'settings','originalCertificates');

export async function originalCertificates() {
  const settings = await getDoc(originalSettings());
  const visibility = settings.exists() ? settings.data() : {};
  return Object.entries(originalCertificatesData)
    .filter(([key]) => visibility[key] !== false)
    .map(([key,entry],order) => {
      const saved = typeof visibility[key]==='object' ? visibility[key] : {};
      const current = saved.dateExample ? {...saved,...entry,dateExample:false} : saved;
      return {id:'original-'+key,originalKey:key,order,published:true,...entry,dateExample:false,...current};
    });
}
