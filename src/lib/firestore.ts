// frontend/lib/firestore.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Types
export interface Repository {
  id: string;
  repoId: string;
  repoFullName: string;
  ownerLogin: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  language?: string;
  defaultBranch: string;
  installationId?: number;
  webhookId?: string;
  webhookSecret?: string;
  lastAnalyzedSha?: string;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  userId: string;
  stats?: {
    docsCount: number;
    filesAnalyzed: number;
    coverage: number;
  };
}

export interface Job {
  id: string;
  jobType: 'initial-ingestion' | 'pr-analysis' | 'push-analysis' | 'delta-analysis';
  status: 'queued' | 'dispatched' | 'in-progress' | 'completed' | 'failed';
  repoFullName: string;
  repoId: string;
  prNumber?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobResult {
  id: string;
  jobId: string;
  repoId: string;
  status: 'completed' | 'failed';
  analysis?: {
    filesAnalyzed?: number;
    totalFiles?: number;
    linesOfCode?: number;
    docsGenerated?: number;
  };
  documentation?: {
    onboarding?: {
      title: string;
      content: string;
    };
    architecture?: {
      title: string;
      content: string;
    };
  };
  createdAt: Date;
}

export interface Metrics {
  date: string;
  totalEvents: number;
  totalJobs: number;
  successRate?: number;
  avgProcessingTimeMs?: number;
}

// Repository Functions
export async function getRepositories(userId: string): Promise<Repository[]> {
  try {
    const q = query(
      collection(db, 'repositories'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      lastAnalyzedAt: doc.data().lastAnalyzedAt?.toDate?.(),
    })) as Repository[];
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
}

export async function getRepository(repoId: string): Promise<Repository | null> {
  try {
    const docRef = doc(db, 'repositories', repoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      lastAnalyzedAt: docSnap.data().lastAnalyzedAt?.toDate?.(),
    } as Repository;
  } catch (error) {
    console.error('Error fetching repository:', error);
    throw error;
  }
}

export async function addRepository(userId: string, repo: Partial<Repository>): Promise<string> {
  try {
    const docRef = doc(collection(db, 'repositories'));
    const repoData = {
      ...repo,
      userId,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        docsCount: 0,
        filesAnalyzed: 0,
        coverage: 0,
      },
    };

    await setDoc(docRef, repoData);
    console.log('✅ Repository added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding repository:', error);
    throw error;
  }
}

export async function updateRepository(repoId: string, updates: Partial<Repository>): Promise<void> {
  try {
    const docRef = doc(db, 'repositories', repoId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Repository updated:', repoId);
  } catch (error) {
    console.error('Error updating repository:', error);
    throw error;
  }
}

export async function deleteRepository(repoId: string): Promise<void> {
  try {
    // Soft delete - just mark as inactive
    const docRef = doc(db, 'repositories', repoId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Repository deleted:', repoId);
  } catch (error) {
    console.error('Error deleting repository:', error);
    throw error;
  }
}

// Job Functions
export async function getJobs(repoId?: string, limitCount: number = 10): Promise<Job[]> {
  try {
    let q;
    if (repoId) {
      q = query(
        collection(db, 'jobs'),
        where('repoId', '==', repoId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      completedAt: doc.data().completedAt?.toDate?.(),
    })) as Job[];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

export async function getJobResults(jobId: string): Promise<JobResult | null> {
  try {
    const q = query(collection(db, 'jobResults'), where('jobId', '==', jobId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    } as JobResult;
  } catch (error) {
    console.error('Error fetching job results:', error);
    throw error;
  }
}

// Real-time Subscriptions
export function subscribeToJobs(
  callback: (jobs: Job[]) => void,
  repoId?: string,
  limitCount: number = 10
) {
  let q;
  if (repoId) {
    q = query(
      collection(db, 'jobs'),
      where('repoId', '==', repoId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  } else {
    q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(limitCount));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const jobs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.(),
      })) as Job[];
      callback(jobs);
    },
    (error) => {
      console.error('Error subscribing to jobs:', error);
    }
  );
}

export function subscribeToRepositories(userId: string, callback: (repos: Repository[]) => void) {
  const q = query(
    collection(db, 'repositories'),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const repos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        lastAnalyzedAt: doc.data().lastAnalyzedAt?.toDate?.(),
      })) as Repository[];
      callback(repos);
    },
    (error) => {
      console.error('Error subscribing to repositories:', error);
    }
  );
}

// Metrics Functions
export async function getMetrics(): Promise<any> {
  try {
    const response = await fetch(
      'http://127.0.0.1:5001/ai-docgen-44b16/us-central1/getMetrics'
    );
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Return mock data if API fails
    return {
      success: true,
      current: {
        webhooks: { total: 0 },
        jobs: { total: 0, successRate: 0 },
      },
      recent: { jobs: [] },
      history: [],
    };
  }
}