/**
 * APOLLO AGENT - v1.0
 * Roda no servidor do cliente, escuta comandos do Firebase e executa o startup do Carga.
 *
 * Instale com: install.bat (como Administrador)
 * Configure: config.json (clienteId e clienteNome)
 */

const { execSync, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Configuração ───────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'config.json');
let CONFIG = {};
try {
  CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.error('❌ Arquivo config.json não encontrado! Configure antes de rodar.');
  process.exit(1);
}

const {
  clienteId,
  clienteNome,
  plinkPath = 'C:\\Program Files\\PuTTY\\plink.exe',
  serverAppPath = 'C:\\ApolloSistemas\\ServerApp\\ServerApp.exe',
  oracleHost = '127.0.0.1',
  oracleUser = 'oracle',
  oracleSenha = 'ap0ll0',
  firebaseProjectId,
  firebaseApiKey,
  versao = '1.0',
} = CONFIG;

// ─── Firebase REST API (sem SDK, só Node nativo) ─────────────────────────────
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;

function fbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${FB_BASE}${path}?key=${firebaseApiKey}`);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function fbValue(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  return { nullValue: null };
}

function toFbDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = fbValue(v);
  }
  return { fields };
}

function fromFbDoc(doc) {
  if (!doc || !doc.fields) return null;
  const out = { id: doc.name?.split('/').pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = v.stringValue ?? v.booleanValue ?? Number(v.integerValue) ?? null;
  }
  return out;
}

// ─── Heartbeat — informa ao Firebase que o agent está vivo ──────────────────
async function heartbeat(cargaOnline) {
  try {
    // Procura documento existente
    const res = await fbRequest('GET', `/agentes_status?pageSize=10`);
    const docs = res.documents || [];
    const existing = docs.find((d) => {
      const f = d.fields || {};
      return f.clienteId?.stringValue === clienteId;
    });

    const payload = toFbDoc({
      clienteId,
      clienteNome,
      online: true,
      cargaOnline: !!cargaOnline,
      versao,
      ultimaAtividade: new Date().toISOString(),
    });

    if (existing) {
      const docId = existing.name.split('/').pop();
      await fbRequest('PATCH', `/agentes_status/${docId}`, payload);
    } else {
      await fbRequest('POST', '/agentes_status', payload);
    }
  } catch (e) {
    console.error('[Heartbeat] Erro:', e.message);
  }
}

// ─── Atualiza status de um comando ──────────────────────────────────────────
async function atualizarComando(docId, status, log) {
  try {
    const payload = toFbDoc({ status, log, executadoEm: new Date().toISOString() });
    await fbRequest('PATCH', `/comandos_carga/${docId}?updateMask.fieldPaths=status&updateMask.fieldPaths=log&updateMask.fieldPaths=executadoEm`, payload);
  } catch (e) {
    console.error('[Firestore] Erro ao atualizar:', e.message);
  }
}

// ─── Checar se Oracle Listener está ativo ───────────────────────────────────
function verificarOracleOnline() {
  try {
    const out = execSync('lsnrctl status', { timeout: 10000, encoding: 'utf8' });
    return out.includes('The command completed successfully') || out.includes('STATUS of the LISTENER');
  } catch {
    return false;
  }
}

// ─── Checar se Carga TCP está respondendo (porta 9001) ──────────────────────
function verificarCargaOnline() {
  try {
    execSync('powershell -Command "Test-NetConnection -ComputerName localhost -Port 9001 -InformationLevel Quiet"', {
      timeout: 5000, encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Sequência PuTTY via plink ───────────────────────────────────────────────
function executarPlink(commands) {
  const cmdStr = commands.join('\n');
  const plinkCmd = `"${plinkPath}" -ssh ${oracleHost} -l ${oracleUser} -pw ${oracleSenha} -batch "${commands.join('; ')}"`;
  try {
    const out = execSync(plinkCmd, { timeout: 60000, encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.message };
  }
}

// ─── Logoff de todas as sessões RDP ativo ───────────────────────────────────
function logoffSessoes() {
  try {
    // Lista sessões ativas
    const sessions = execSync('query session', { encoding: 'utf8' });
    const lines = sessions.split('\n').slice(1); // Pula header
    for (const line of lines) {
      const match = line.match(/\s+(\d+)\s/);
      if (match) {
        const sessionId = match[1];
        if (sessionId !== '0') { // Não desloga a sessão de serviço (0)
          try { execSync(`logoff ${sessionId}`); } catch {}
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Fluxo principal: Dar Carga ──────────────────────────────────────────────
async function executarDarCarga(docId) {
  console.log(`\n🚀 [${new Date().toLocaleTimeString()}] Iniciando sequência Dar Carga...`);

  // 1. Verificar status
  await atualizarComando(docId, 'executando', '🔍 Verificando status do Oracle...');
  const oracleOnline = verificarOracleOnline();
  const cargaOnline = verificarCargaOnline();
  console.log(`   Oracle listener: ${oracleOnline ? 'ONLINE' : 'OFFLINE'}`);
  console.log(`   Carga TCP 9001: ${cargaOnline ? 'ONLINE' : 'OFFLINE'}`);

  if (cargaOnline && oracleOnline) {
    // Já está online!
    await atualizarComando(docId, 'concluido', '✅ Carga já está ONLINE! Nenhuma ação necessária.');
    await heartbeat(true);
    console.log('✅ Carga já online — nada a fazer.');
    return;
  }

  // 2. Oracle não está online — rodar startup via plink
  if (!oracleOnline) {
    await atualizarComando(docId, 'executando', '⚙️ Iniciando Oracle Listener (lsnrctl start)...');
    console.log('   Rodando lsnrctl start...');

    const r1 = executarPlink(['lsnrctl start']);
    if (!r1.ok) {
      await atualizarComando(docId, 'executando', '⚙️ Iniciando banco de dados Oracle (sqlplus startup)...');
    }

    console.log('   Rodando sqlplus startup...');
    executarPlink(['sqlplus / as sysdba', 'startup;', 'exit']);
    await new Promise((r) => setTimeout(r, 3000));
  }

  // 3. Logoff das sessões para shell:startup subir o ServerApp
  await atualizarComando(docId, 'executando', '🔒 Encerrando sessões — shell:startup irá subir os serviços...');
  console.log('   Encerrando sessões RDP...');
  logoffSessoes();

  // 4. Aguardar ServerApp subir (shell:startup)
  await new Promise((r) => setTimeout(r, 8000));
  const cargaFinal = verificarCargaOnline();

  if (cargaFinal) {
    await atualizarComando(docId, 'concluido', '✅ Carga ONLINE! Oracle + ServerApp ativos.');
    await heartbeat(true);
    console.log('✅ Carga online com sucesso!');
  } else {
    await atualizarComando(docId, 'concluido', '✅ Sequência executada! Aguarde ~30s para ServerApp iniciar.');
    await heartbeat(false);
    console.log('⏳ Sequência executada — aguardando ServerApp...');
  }
}

// ─── Verificar Status ─────────────────────────────────────────────────────────
async function executarVerificarStatus(docId) {
  const oracleOnline = verificarOracleOnline();
  const cargaOnline = verificarCargaOnline();
  const status = `Oracle: ${oracleOnline ? '✅' : '❌'} | Carga TCP: ${cargaOnline ? '✅' : '❌'}`;
  await atualizarComando(docId, 'concluido', status);
  await heartbeat(cargaOnline);
  console.log(`[Verificação] ${status}`);
}

// ─── Polling de Comandos ──────────────────────────────────────────────────────
let processandoIds = new Set();

async function verificarComandos() {
  try {
    const res = await fbRequest('GET',
      `/comandos_carga?pageSize=5&orderBy=criadoEm desc`
    );
    const docs = (res.documents || []).map(fromFbDoc).filter(Boolean);

    for (const cmd of docs) {
      if (cmd.clienteId !== clienteId) continue;
      if (cmd.status !== 'pending') continue;
      if (processandoIds.has(cmd.id)) continue;

      processandoIds.add(cmd.id);
      console.log(`\n📩 Comando recebido: ${cmd.comando} (ID: ${cmd.id})`);

      if (cmd.comando === 'dar_carga') {
        executarDarCarga(cmd.id).finally(() => processandoIds.delete(cmd.id));
      } else if (cmd.comando === 'verificar_status') {
        executarVerificarStatus(cmd.id).finally(() => processandoIds.delete(cmd.id));
      }
    }
  } catch (e) {
    console.error('[Polling] Erro:', e.message);
  }
}

// ─── Iniciar ─────────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════╗');
console.log('║        APOLLO AGENT v1.0             ║');
console.log('╠══════════════════════════════════════╣');
console.log(`║ Cliente: ${clienteNome.padEnd(27)}║`);
console.log(`║ ID:      ${clienteId.padEnd(27)}║`);
console.log('╚══════════════════════════════════════╝');
console.log('\n✅ Agent iniciado! Aguardando comandos...\n');

// Heartbeat inicial
heartbeat(verificarCargaOnline());

// Polling a cada 3 segundos
setInterval(verificarComandos, 3000);

// Heartbeat a cada 60 segundos
setInterval(() => heartbeat(verificarCargaOnline()), 60000);
