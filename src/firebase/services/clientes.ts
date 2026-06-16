import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../config';
import { Cliente } from '../../types';

const COL = 'clientes';

export async function getClientes(): Promise<Cliente[]> {
  const q = query(collection(db, COL), orderBy('razaoSocial'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cliente));
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Cliente;
}

export async function addCliente(data: Omit<Cliente, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    status: data.status || 'ativo',
  });
  return ref.id;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteCliente(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function formatTimestamp(ts: any): string {
  if (!ts) return '—';
  if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString('pt-BR');
  if (typeof ts === 'string') return new Date(ts).toLocaleDateString('pt-BR');
  return '—';
}
