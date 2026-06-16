import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../config';
import { Conhecimento } from '../../types';

const COL = 'conhecimento';

export async function getConhecimentos(): Promise<Conhecimento[]> {
  const q = query(collection(db, COL), orderBy('criadoEm', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Conhecimento));
}

export async function getConhecimento(id: string): Promise<Conhecimento | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Conhecimento;
}

export async function addConhecimento(data: Omit<Conhecimento, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    visualizacoes: 0,
  });
  return ref.id;
}

export async function updateConhecimento(id: string, data: Partial<Conhecimento>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteConhecimento(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
