/**
 * APOLLO AGENT v3.0
 * - Login anonimo Firebase (resolve bloqueio Firestore sem mudar regras)
 * - Auto-coleta: hostname, IPs, RDP, SO, RAM
 * - Perfil unico por maquina (sem duplicatas)
 * - Log em arquivo agent.log
 */

const { execSync } = require('child_process');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'config.json');
let CFG = {};
try {
  CFG = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch {
  log('[ERRO] config.json nao encontrado!');
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

// ── Log (console + arquivo) ───────────────────────────────────────────────────
const LOG_FILE = path.join(__dirname, 'agent.log');
function log(msg) {
  const linha = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  console.log(linha);
  try { fs.appendFileSync(LOG_FILE, linha + '\n'); } catch {}
}

// ── ID unico da maquina ───────────────────────────────────────────────────────
function getMaquinaId() {
  const hostname = os.hostname();
  const nets = os.networkInterfaces();
  let mac = '';
  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        mac = net.mac; break;
      }
    }
    if (mac) break;
  }
  return crypto.createHash('md5').update(hostname + mac).digest('hex').substring(0, 12);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpRequest(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Firebase Anonymous Auth ───────────────────────────────────────────────────
let FB_TOKEN = null;
let FB_TOKEN_EXPIRY = 0;

async function getFirebaseToken() {
  if (FB_TOKEN && Date.now() < FB_TOKEN_EXPIRY) return FB_TOKEN;

  log('[Auth] Fazendo login anonimo no Firebase...');
  try {
    const res = await httpRequest(
      'POST',
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
      { returnSecureToken: true }
    );
    if (res.body.idToken) {
      FB_TOKEN = res.body.idToken;
      FB_TOKEN_EXPIRY = Date.now() + (Number(res.body.expiresIn) - 60) * 1000;
      log('[Auth] Login anonimo OK!');
      return FB_TOKEN;
    } else {
      log('[Auth] Erro: ' + JSON.stringify(res.body));
      return null;
    }
  } catch (e) {
    log('[Auth] Falha: ' + e.message);
    return null;
  }
}

// ── Firestore REST ─────────────────────────────────────────────────────────────
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;

async function fbGet(fbPath) {
  const token = await getFirebaseToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return httpRequest('GET', `${FB_BASE}${fbPath}?key=${firebaseApiKey}`, null, headers);
}

async function fbPost(fbPath, body) {
  const token = await getFirebaseToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await httpRequest('POST', `${FB_BASE}${fbPath}?key=${firebaseApiKey}`, body, headers);
  if (res.status >= 400) log('[Firestore] Erro POST ' + res.status + ': ' + JSON.stringify(res.body).substring(0, 200));
  return res;
}

async function fbPatch(fbPath, body) {
  const token = await getFirebaseToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await httpRequest('PATCH', `${FB_BASE}${fbPath}?key=${firebaseApiKey}`, body, headers);
  if (res.status >= 400) log('[Firestore] Erro PATCH ' + res.status + ': ' + JSON.stringify(res.body).substring(0, 200));
  return res;
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
  for (const [k, v] of Object.entries(obj)) fields[k] = toField(v);
  return { fields };
}

function fromDoc(doc) {
  if (!doc?.fields) return null;
  const out = { id: doc.name?.split('/').pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    if (v.stringValue !== undefined) out[k] = v.stringValue;
    else if (v.booleanValue !== undefined) out[k] = v.booleanValue;
    else if (v.integerValue !== undefined) out[k] = Number(v.integerValue);
    else if (v.arrayValue) out[k] = (v.arrayValue.values || []).map(i => i.stringValue || '');
    else out[k] = null;
  }
  return out;
}

// ── Coletar info da maquina ───────────────────────────────────────────────────
function coletarInfo() {
  const info = {
    hostname: os.hostname(),
    so: os.platform() + ' ' + os.release(),
    ip_local: '',
    ip_publico: '',
    rdp_porta: rdpPorta,
    processador: os.cpus()[0]?.model?.trim() || '',
    ram_gb: Math.round(os.totalmem() / 1073741824),
    interfaces: [],
  };

  // SO mais legivel
  try {
    info.so = execSync('powershell -NoProfile -Command "(Get-WmiObject Win32_OperatingSystem).Caption"', { timeout: 5000, encoding: 'utf8' }).trim();
  } catch {}

  // IPs
  const nets = os.networkInterfaces();
  for (const [nome, ifaces] of Object.entries(nets)) {
    for (const net of ifaces) {
      if (!net.internal && net.family === 'IPv4') {
        info.interfaces.push(`${nome}: ${net.address}`);
        if (!info.ip_local) info.ip_local = net.address;
      }
    }
  }

  // Porta RDP real
  try {
    const r = execSync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp" /v PortNumber 2>&1', { encoding: 'utf8' });
    const m = r.match(/PortNumber\s+REG_DWORD\s+0x(\w+)/);
    if (m) info.rdp_porta = parseInt(m[1], 16);
  } catch {}

  // IP publico
  try {
    info.ip_publico = execSync('powershell -NoProfile -Command "(Invoke-WebRequest -Uri api.ipify.org -UseBasicParsing).Content"', { timeout: 8000, encoding: 'utf8' }).trim();
  } catch {}

  return info;
}

// ── Registrar maquina no Firestore ────────────────────────────────────────────
const MAQUINA_ID = getMaquinaId();
let DOC_ID = null;

async function registrar(cargaOnline) {
  try {
    const info = coletarInfo();
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
      versao: '3.0',
      ultimaAtividade: new Date().toISOString(),
    };

    // Buscar doc existente
    const res = await fbGet('/agentes_status?pageSize=100');
    const docs = res.body?.documents || [];
    const existing = docs.find(d => d.fields?.maquinaId?.stringValue === MAQUINA_ID);

    if (existing) {
      DOC_ID = existing.name.split('/').pop();
      await fbPatch(`/agentes_status/${DOC_ID}`, toDoc(payload));
      log(`[Heartbeat] Atualizado (ID: ${DOC_ID}) | Carga: ${cargaOnline ? 'ONLINE' : 'OFFLINE'}`);
    } else {
      const created = await fbPost('/agentes_status', toDoc(payload));
      DOC_ID = created.body?.name?.split('/').pop();
      log(`[REGISTRO] Perfil criado! ID: ${DOC_ID}`);
      log(`[REGISTRO] Hostname: ${info.hostname} | IP: ${info.ip_local} | RDP: ${info.rdp_porta}`);
    }
  } catch (e) {
    log('[Registro] Erro: ' + e.message);
  }
}

// ── Atualizar comando ─────────────────────────────────────────────────────────
async function atualizarCmd(docId, status, logMsg) {
  try {
    await fbPatch(`/comandos_carga/${docId}`, toDoc({
      status, log: logMsg, executadoEm: new Date().toISOString()
    }));
  } catch (e) {
    log('[Cmd] Erro: ' + e.message);
  }
}

// ── Verificar Oracle/Carga ────────────────────────────────────────────────────
function oracleOnline() {
  try {
    const r = execSync('lsnrctl status 2>&1', { timeout: 10000, encoding: 'utf8' });
    return r.toLowerCase().includes('started') || r.includes('The command completed successfully');
  } catch { return false; }
}

function cargaOnline() {
  try {
    const r = execSync('powershell -NoProfile -Command "Test-NetConnection -ComputerName localhost -Port 9001 -InformationLevel Quiet -WarningAction SilentlyContinue"', { timeout: 6000, encoding: 'utf8' });
    return r.trim() === 'True';
  } catch { return false; }
}

// ── Logoff sessoes ────────────────────────────────────────────────────────────
function logoffSessoes() {
  try {
    const sessions = execSync('query session 2>&1', { encoding: 'utf8' });
    for (const line of sessions.split('\n').slice(1)) {
      const m = line.match(/\s+(\d+)\s/);
      if (m && m[1] !== '0') try { execSync(`logoff ${m[1]}`); } catch {}
    }
  } catch {}
}

// ── Dar Carga ─────────────────────────────────────────────────────────────────
const processando = new Set();

async function darCarga(docId) {
  log('\n[Carga] Iniciando sequencia...');
  await atualizarCmd(docId, 'executando', 'Verificando Oracle...');

  const oracle = oracleOnline();
  const carga = cargaOnline();
  log(`[Carga] Oracle: ${oracle ? 'ON' : 'OFF'} | Carga TCP: ${carga ? 'ON' : 'OFF'}`);

  if (oracle && carga) {
    await atualizarCmd(docId, 'concluido', 'Carga ja esta ONLINE!');
    await registrar(true);
    return;
  }

  if (!oracle) {
    await atualizarCmd(docId, 'executando', 'Iniciando Oracle (lsnrctl start)...');
    try { execSync(`"${plinkPath}" -ssh ${oracleHost} -l ${oracleUser} -pw ${oracleSenha} -batch "lsnrctl start; sqlplus / as sysdba; startup;; exit"`, { timeout: 60000 }); } catch {}
    await new Promise(r => setTimeout(r, 4000));
  }

  await atualizarCmd(docId, 'executando', 'Encerrando sessoes (shell:startup vai subir servicos)...');
  logoffSessoes();
  await new Promise(r => setTimeout(r, 8000));

  const ok = cargaOnline();
  await atualizarCmd(docId, 'concluido', ok ? 'Carga ONLINE!' : 'Sequencia executada! Aguarde ~30s.');
  await registrar(ok);
}

async function verificarStatus(docId) {
  const oracle = oracleOnline();
  const carga = cargaOnline();
  const msg = `Oracle: ${oracle ? 'ONLINE' : 'OFFLINE'} | Carga TCP 9001: ${carga ? 'ONLINE' : 'OFFLINE'}`;
  await atualizarCmd(docId, 'concluido', msg);
  await registrar(carga);
  log(`[Status] ${msg}`);
}

// ── Polling comandos ──────────────────────────────────────────────────────────
async function poll() {
  try {
    const res = await fbGet('/comandos_carga?pageSize=10');
    const docs = (res.body?.documents || []).map(fromDoc).filter(Boolean);
    for (const cmd of docs) {
      const cidMatch = clienteId ? cmd.clienteId === clienteId : cmd.clienteId === MAQUINA_ID || !cmd.clienteId;
      if (!cidMatch) continue;
      if (cmd.status !== 'pending') continue;
      if (processando.has(cmd.id)) continue;
      processando.add(cmd.id);
      log(`\n[Cmd] ${cmd.comando} recebido!`);
      if (cmd.comando === 'dar_carga') darCarga(cmd.id).finally(() => processando.delete(cmd.id));
      else if (cmd.comando === 'verificar_status') verificarStatus(cmd.id).finally(() => processando.delete(cmd.id));
    }
  } catch (e) {
    log('[Poll] Erro: ' + e.message);
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
log('======================================');
log('   APOLLO AGENT v3.0');
log('======================================');
log(`   Cliente : ${clienteNome}`);
log(`   ID      : ${clienteId || '(nao configurado)'}`);
log(`   Maquina : ${os.hostname()}`);
log(`   UUID    : ${MAQUINA_ID}`);
log('======================================');
log('Registrando e iniciando polling...');

// Inicio
getFirebaseToken().then(() => {
  registrar(cargaOnline());
  setInterval(poll, 3000);
  setInterval(() => registrar(cargaOnline()), 60000);
});
