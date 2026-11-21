import {initializeApp} from 'firebase/app';
import {getFirestore,collection,query,where,limit,getDocs,getDoc,doc,setDoc,addDoc,deleteDoc,Timestamp,orderBy,startAfter} from 'firebase/firestore';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut,setPersistence,browserSessionPersistence} from 'firebase/auth';
import {getStorage,ref,uploadBytes,getDownloadURL,deleteObject} from 'firebase/storage';
import {firebaseConfig} from '../assets/js/firebase-config.js';
const app=initializeApp(firebaseConfig);export const db=getFirestore(app),auth=getAuth(app),storage=getStorage(app);
export {collection,query,where,limit,getDocs,getDoc,doc,setDoc,addDoc,deleteDoc,Timestamp,orderBy,startAfter,onAuthStateChanged,signInWithEmailAndPassword,signOut,setPersistence,browserSessionPersistence,ref,uploadBytes,getDownloadURL,deleteObject};
