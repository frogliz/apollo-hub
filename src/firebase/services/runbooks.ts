import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, doc, getDoc
} from 'firebase/firestore';
import { db } from '../config';
import { Runbook } from '../../types';

const COL = 'runbooks';

export async function getRunbooks(): Promise<Runbook[]> {
  const q = query(collection(db, COL), orderBy('titulo'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Runbook));
}

export async function getRunbook(id: string): Promise<Runbook | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Runbook;
}

export async function addRunbook(data: Omit<Runbook, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRunbook(id: string, data: Partial<Runbook>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteRunbook(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
