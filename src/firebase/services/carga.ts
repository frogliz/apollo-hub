import {
  collection, addDoc, onSnapshot, query, orderBy,
  limit, serverTimestamp, doc, updateDoc, getDocs, where
} from 'firebase/firestore';
import { db } from '../config';

export interface ComandoCarga {
  id?: string;
  clienteId: string;
  clienteNome: string;
  comando: 'dar_carga' | 'verificar_status';
  status: 'pending' | 'executando' | 'concluido' | 'erro';
  log: string;
  cargaOnline: boolean;
  criadoEm?: any;
  executadoEm?: any;
}

export interface AgenteStatus {
  id?: string;
  clienteId: string;
  clienteNome: string;
  online: boolean;
  cargaOnline: boolean;
  ultimaAtividade?: any;
  versao: string;
}

const COL_COMANDOS = 'comandos_carga';
const COL_AGENTES = 'agentes_status';

export async function enviarComandoCarga(
  clienteId: string,
  clienteNome: string,
  comando: ComandoCarga['comando'] = 'dar_carga'
): Promise<string> {
  const ref = await addDoc(collection(db, COL_COMANDOS), {
    clienteId,
    clienteNome,
    comando,
    status: 'pending',
    log: 'Aguardando agent...',
    cargaOnline: false,
    criadoEm: serverTimestamp(),
    executadoEm: null,
  } as Omit<ComandoCarga, 'id'>);
  return ref.id;
}

export function ouvirComandosRecentes(
  callback: (cmds: ComandoCarga[]) => void,
  limite = 20
): () => void {
  const q = query(
    collection(db, COL_COMANDOS),
    orderBy('criadoEm', 'desc'),
    limit(limite)
  );
  return onSnapshot(q, (snap) => {
    const cmds = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComandoCarga));
    callback(cmds);
  });
}

export function ouvirStatusAgentes(
  callback: (agentes: AgenteStatus[]) => void
): () => void {
  return onSnapshot(collection(db, COL_AGENTES), (snap) => {
    const agentes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AgenteStatus));
    callback(agentes);
  });
}

export async function getStatusAgente(clienteId: string): Promise<AgenteStatus | null> {
  const q = query(collection(db, COL_AGENTES), where('clienteId', '==', clienteId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as AgenteStatus;
}
