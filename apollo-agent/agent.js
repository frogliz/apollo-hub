/**
 * APOLLO AGENT v2.0
 * - Auto-registra maquina no Firebase com IP, hostname, RDP, Windows version
 * - Perfil unico por maquina (evita duplicatas)
 * - Escuta comandos de Dar Carga em tempo real
 */

const { execSync } = require('child_process');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Config ───────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'config.json');
let CFG = {};
try {
  CFG = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.error('[ERRO] config.json nao encontrado!');
  process.exit(1);
}

const {
  clienteId = '',
  clienteNome = 'Sem Cliente',
  firebaseProjectId = 'apollogs-a2a98',
  firebaseApiKey = 'AIzaSyAfZrTPszsXuI0YfhqE1MxyZ6aTKL8yarI',
  plinkPath = 'C:\\Program Files\\PuTTY\\plink.exe',
  oracleHost = '127.0.0.1',
  oracleUser = 'oracle',
  oracleSenha = 'ap0ll0',
  rdpPorta = 3389,
} = CFG;

// ── ID unico da maquina (hostname + primeiro MAC) ────────────────────────────
function getMaquinaId() {
  const hostname = os.hostname();
  const nets = os.networkInterfaces();
  let mac = '';
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        mac = net.mac;
        break;
      }
    }
    if (mac) break;
  }
  return crypto.createHash('md5').update(hostname + mac).digest('hex').substring(0, 12);
}

// ── Coletar info da maquina ──────────────────────────────────────────────────
function coletarInfoMaquina() {
  const info = {
    hostname: os.hostname(),
    so: '',
    ip_local: '',
    ip_publico: '',
    rdp_porta: rdpPorta,
    processador: os.cpus()[0]?.model || '',
    ram_gb: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    interfaces: [],
  };

  // SO
  try {
    info.so = execSync('powershell -NoProfile -Command "(Get-WmiObject Win32_OperatingSystem).Caption"', { timeout: 5000, encoding: 'utf8' }).trim();
  } catch { info.so = os.platform() + ' ' + os.release(); }

  // IPs locais
  const nets = os.networkInterfaces();
  const ips = [];
  for (const [nome, ifaces] of Object.entries(nets)) {
    for (const net of ifaces) {
      if (!net.internal && net.family === 'IPv4') {
        ips.push(`${nome}: ${net.address}`);
        if (!info.ip_local) info.ip_local = net.address;
      }
    }
  }
  info.interfaces = ips;

  // Porta RDP real do registro
  try {
    const rdpReg = execSync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp" /v PortNumber', { encoding: 'utf8' });
    const match = rdpReg.match(/PortNumber\s+REG_DWORD\s+0x(\w+)/);
    if (match) info.rdp_porta = parseInt(match[1], 16);
  } catch {}

  // IP publico
  try {
    const resp = execSync('powershell -NoProfile -Command "(Invoke-WebRequest -Uri api.ipify.org -UseBasicParsing).Content"', { timeout: 8000, encoding: 'utf8' });
    info.ip_publico = resp.trim();
  } catch {}

  return info;
}

// ── Firebase REST ─────────────────────────────────────────────────────────────
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;

function fbRequest(method, fbPath, body) {
  return new Promise((resolve, reject) => {
    const url = `${FB_BASE}${fbPath}?key=${firebaseApiKey}`;
    const parsed = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function toField(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toField) } };
  return { nullValue: null };
}

function toDoc(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = toField(val);
  return { fields };
}

function fromDoc(doc) {
  if (!doc?.fields) return null;
  const out = { id: doc.name?.split('/').pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    if (v.stringValue !== undefined) out[k] = v.stringValue;
    else if (v.booleanValue !== undefined) out[k] = v.booleanValue;
    else if (v.integerValue !== undefined) out[k] = Number(v.integerValue);
    else if (v.arrayValue !== undefined) out[k] = (v.arrayValue.values || []).map(i => i.stringValue || i.integerValue || '');
    else out[k] = null;
  }
  return out;
}

// ── Registrar/Atualizar perfil da maquina ─────────────────────────────────────
const MAQUINA_ID = getMaquinaId();
let DOC_ID_AGENTE = null; // ID do documento Firestore deste agent

async function registrarMaquina(cargaOnline) {
  try {
    const info = coletarInfoMaquina();
    const payload = {
      maquinaId: MAQUINA_ID,
      hostname: info.hostname,
      clienteId: clienteId || '',
      clienteNome: clienteNome || 'Sem Cliente',
      so: info.so,
      ip_local: info.ip_local,
      ip_publico: info.ip_publico,
      rdp_porta: info.rdp_porta,
      interfaces: info.interfaces,
      processador: info.processador,
      ram_gb: info.ram_gb,
      online: true,
      cargaOnline: !!cargaOnline,
      versao: '2.0',
      ultimaAtividade: new Date().toISOString(),
    };

    // Buscar documento existente por maquinaId
    const res = await fbRequest('GET', `/agentes_status?pageSize=50`);
    const docs = (res.documents || []);
    const existing = docs.find(d => d.fields?.maquinaId?.stringValue === MAQUINA_ID);

    if (existing) {
      DOC_ID_AGENTE = existing.name.split('/').pop();
      await fbRequest('PATCH', `/agentes_status/${DOC_ID_AGENTE}`, toDoc(payload));
      console.log(`[Heartbeat] Perfil atualizado (ID: ${DOC_ID_AGENTE}) | Carga: ${cargaOnline ? 'ONLINE' : 'OFFLINE'}`);
    } else {
      const created = await fbRequest('POST', `/agentes_status`, toDoc(payload));
      DOC_ID_AGENTE = created.name?.split('/').pop();
      console.log(`[Registro] Novo perfil criado! ID: ${DOC_ID_AGENTE}`);
      console.log(`[Registro] Hostname: ${info.hostname} | IP: ${info.ip_local} | RDP: ${info.rdp_porta}`);
    }
  } catch (e) {
    console.error('[Registro] Erro:', e.message);
  }
}

// ── Atualizar comando ─────────────────────────────────────────────────────────
async function atualizarComando(docId, status, log) {
  try {
    const payload = toDoc({ status, log, executadoEm: new Date().toISOString() });
    await fbRequest('PATCH', `/comandos_carga/${docId}`, payload);
  } catch (e) {
    console.error('[Cmd] Erro ao atualizar:', e.message);
  }
}

// ── Verificar Oracle/Carga ────────────────────────────────────────────────────
function verificarOracleOnline() {
  try {
    const out = execSync('lsnrctl status 2>&1', { timeout: 10000, encoding: 'utf8' });
    return out.includes('The command completed successfully') || out.toLowerCase().includes('started');
  } catch { return false; }
}

function verificarCargaOnline() {
  try {
    const r = execSync('powershell -NoProfile -Command "Test-NetConnection -ComputerName localhost -Port 9001 -InformationLevel Quiet -WarningAction SilentlyContinue"', { timeout: 6000, encoding: 'utf8' });
    return r.trim() === 'True';
  } catch { return false; }
}

// ── Executar PuTTY plink ─────────────────────────────────────────────────────
function executarPlink(cmds) {
  const plinkCmd = `"${plinkPath}" -ssh ${oracleHost} -l ${oracleUser} -pw ${oracleSenha} -batch "${cmds.join('; ')}"`;
  try {
    const out = execSync(plinkCmd, { timeout: 60000, encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.message };
  }
}

// ── Logoff sessoes RDP ────────────────────────────────────────────────────────
function logoffSessoes() {
  try {
    const sessions = execSync('query session 2>&1', { encoding: 'utf8' });
    const lines = sessions.split('\n').slice(1);
    for (const line of lines) {
      const match = line.match(/\s+(\d+)\s/);
      if (match && match[1] !== '0') {
        try { execSync(`logoff ${match[1]}`); } catch {}
      }
    }
    return true;
  } catch { return false; }
}

// ── Dar Carga ─────────────────────────────────────────────────────────────────
const processandoIds = new Set();

async function executarDarCarga(docId) {
  console.log(`\n[Carga] Iniciando sequencia...`);

  await atualizarComando(docId, 'executando', 'Verificando status Oracle...');
  const oracleOnline = verificarOracleOnline();
  const cargaOnline = verificarCargaOnline();
  console.log(`[Carga] Oracle: ${oracleOnline ? 'ON' : 'OFF'} | Carga: ${cargaOnline ? 'ON' : 'OFF'}`);

  if (cargaOnline && oracleOnline) {
    await atualizarComando(docId, 'concluido', 'Carga ja esta ONLINE! Nenhuma acao necessaria.');
    await registrarMaquina(true);
    return;
  }

  if (!oracleOnline) {
    await atualizarComando(docId, 'executando', 'Iniciando Oracle (lsnrctl start + sqlplus startup)...');
    executarPlink(['lsnrctl start']);
    await new Promise(r => setTimeout(r, 2000));
    executarPlink(['sqlplus / as sysdba', 'startup;', 'exit']);
    await new Promise(r => setTimeout(r, 3000));
  }

  await atualizarComando(docId, 'executando', 'Encerrando sessoes - shell:startup vai subir servicos...');
  logoffSessoes();
  await new Promise(r => setTimeout(r, 8000));

  const cargaFinal = verificarCargaOnline();
  if (cargaFinal) {
    await atualizarComando(docId, 'concluido', 'Carga ONLINE! Oracle + ServerApp ativos.');
    await registrarMaquina(true);
  } else {
    await atualizarComando(docId, 'concluido', 'Sequencia executada! Aguarde ~30s para ServerApp iniciar.');
    await registrarMaquina(false);
  }
}

async function executarVerificarStatus(docId) {
  const oracleOnline = verificarOracleOnline();
  const cargaOnline = verificarCargaOnline();
  const log = `Oracle Listener: ${oracleOnline ? 'ONLINE' : 'OFFLINE'} | Carga TCP 9001: ${cargaOnline ? 'ONLINE' : 'OFFLINE'}`;
  await atualizarComando(docId, 'concluido', log);
  await registrarMaquina(cargaOnline);
  console.log(`[Status] ${log}`);
}

// ── Polling de comandos ───────────────────────────────────────────────────────
async function verificarComandos() {
  try {
    const res = await fbRequest('GET', `/comandos_carga?pageSize=10`);
    const docs = (res.documents || []).map(fromDoc).filter(Boolean);
    for (const cmd of docs) {
      if (cmd.clienteId !== clienteId) continue;
      if (cmd.status !== 'pending') continue;
      if (processandoIds.has(cmd.id)) continue;
      processandoIds.add(cmd.id);
      console.log(`\n[Cmd] Recebido: ${cmd.comando}`);
      if (cmd.comando === 'dar_carga') {
        executarDarCarga(cmd.id).finally(() => processandoIds.delete(cmd.id));
      } else if (cmd.comando === 'verificar_status') {
        executarVerificarStatus(cmd.id).finally(() => processandoIds.delete(cmd.id));
      }
    }
  } catch (e) {
    console.error('[Poll] Erro:', e.message);
  }
}

// ── Iniciar ───────────────────────────────────────────────────────────────────
console.log('======================================');
console.log('   APOLLO AGENT v2.0');
console.log('======================================');
console.log(`   Cliente : ${clienteNome}`);
console.log(`   ID      : ${clienteId || '(nao configurado)'}`);
console.log(`   Maquina : ${os.hostname()}`);
console.log(`   UUID    : ${MAQUINA_ID}`);
console.log('======================================');
console.log('Iniciando registro e polling...');
console.log();

// Registro inicial (captura tudo)
registrarMaquina(verificarCargaOnline());

// Polling comandos a cada 3s
setInterval(verificarComandos, 3000);

// Heartbeat a cada 60s
setInterval(() => registrarMaquina(verificarCargaOnline()), 60000);
