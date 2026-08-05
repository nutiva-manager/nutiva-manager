/* Sincronización compartida: la fuente de verdad es la fila compartida en Supabase. */
(() => {
  const config = window.NUTIVA_SUPABASE || {};
  const screen = document.getElementById('authScreen');
  const message = document.getElementById('authMessage');
  const form = document.getElementById('authForm');
  const configured = config.url && config.key && !config.url.includes('TU-PROYECTO') && !config.key.includes('TU-PUBLISHABLE');
  if (!configured) { message.textContent = 'Falta conectar Supabase. Seguí el archivo SETUP-SUPABASE.md.'; return; }
  const client = window.supabase.createClient(config.url, config.key);
  let ready = false, writing = false, timer;
  const showApp = () => { screen.hidden = true; document.querySelector('.app-shell').classList.add('cloud-ready'); };
  const showLogin = text => { message.textContent = text; form.hidden = false; };
  async function pull() {
    const { data, error } = await client.from('nutiva_state').select('payload').eq('id', 'shared').maybeSingle();
    if (error) throw error;
    if (!data) { const created = await client.from('nutiva_state').insert({ id: 'shared', payload: NutivaData.state }).select().single(); if (created.error) throw created.error; }
    else { NutivaData.replace(data.payload); window.dispatchEvent(new Event('nutiva:remote')); }
  }
  async function push(payload) {
    if (!ready || writing) return;
    writing = true;
    const { error } = await client.from('nutiva_state').update({ payload, updated_at: new Date().toISOString() }).eq('id', 'shared');
    writing = false;
    if (error) console.error('No se pudo sincronizar Nutiva:', error.message);
  }
  document.addEventListener('nutiva:changed', e => { clearTimeout(timer); timer = setTimeout(() => push(e.detail), 500); });
  form.addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(form); const email = f.get('email'), password = f.get('password'); const submitter = e.submitter.value; message.textContent = 'Verificando cuenta…'; const result = submitter === 'signup' ? await client.auth.signUp({ email, password }) : await client.auth.signInWithPassword({ email, password }); if (result.error) { showLogin(result.error.message); return; } if (submitter === 'signup' && !result.data.session) { showLogin('Revisá tu email para confirmar la cuenta y luego ingresá.'); return; } await start(); });
  async function start() { try { await pull(); ready = true; showApp(); client.channel('nutiva-shared-state').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nutiva_state', filter: 'id=eq.shared' }, payload => { if (!writing) { NutivaData.replace(payload.new.payload); window.dispatchEvent(new Event('nutiva:remote')); } }).subscribe(); } catch (error) { showLogin(`No se pudo abrir el espacio compartido: ${error.message}`); } }
  client.auth.getSession().then(({ data }) => data.session ? start() : showLogin('Ingresá con la cuenta del equipo.'));
})();
