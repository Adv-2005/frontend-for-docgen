import { db } from './firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';

export async function getRepositories() {
  const q = query(collection(db, 'repositories'), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMetrics() {
  const response = await fetch('http://127.0.0.1:5001/ai-docgen-44b16/us-central1/getMetrics');
  return response.json();
}

export function subscribeToJobs(callback) {
  const q = query(
    collection(db, 'jobs'), 
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(jobs);
  });
}