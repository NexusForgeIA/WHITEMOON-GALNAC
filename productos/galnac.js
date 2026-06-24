/* GALNAC — nav + chatbot compartido para las páginas internas de productos.
   Inyecta el FAB y el panel del asistente, y expone window.toggleChat /
   window.askPresupuesto para las CTA "Solicitar presupuesto". */
(function () {
  var GEAR = 'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 13.6 1h-3.2c-.24 0-.44.17-.48.41l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.24.41.48.41h3.2c.24 0 .44-.17.48-.41l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5z';

  /* ---- inyectar chatbot ---- */
  var html =
    '<button class="fab" id="fab" aria-label="Abrir asistente Galnac">' +
      '<span class="ping"></span>' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="' + GEAR + '"/></svg>' +
    '</button>' +
    '<div class="chat" id="chat" aria-live="polite">' +
      '<div class="chat-head">' +
        '<div class="chat-ava"><svg viewBox="0 0 24 24" fill="currentColor"><path d="' + GEAR + '"/></svg></div>' +
        '<div class="hi"><b>Galnac</b><small><i></i>Asistente técnico · GALNAC</small></div>' +
        '<button class="chat-x" aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="chat-body" id="chatBody"></div>' +
      '<div class="quicks" id="quicks">' +
        '<button class="quick" data-q="Cuénteme sobre los compresores eléctricos GLC">Compresores GLC</button>' +
        '<button class="quick" data-q="Necesito reparar un compresor de segunda mano">Reparación segunda mano</button>' +
        '<button class="quick" data-q="Información sobre martillos hidráulicos Doofor">Martillos Doofor</button>' +
        '<button class="quick" data-q="Quiero solicitar un presupuesto">Solicitar presupuesto</button>' +
      '</div>' +
      '<form class="chat-input" id="chatForm" autocomplete="off">' +
        '<input id="chatInput" type="text" placeholder="Escriba su consulta técnica…" aria-label="Mensaje" />' +
        '<button type="submit" id="chatSend" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
      '</form>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);

  /* ---- config backend ---- */
  var SUPA_URL = 'https://mlaqtniujnvfxcvcourm.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYXF0bml1am52ZnhjdmNvdXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUyMzIsImV4cCI6MjA5MzQxMTIzMn0.Neh7VUS8ADsxf0DPab0JoJyGXOAXnLIaXzXbKzj2BGs';
  var CHAT_URL = SUPA_URL + '/functions/v1/galnac-chat';
  var NOTIFY_URL = SUPA_URL + '/functions/v1/galnac-notify';
  var LEADS_URL = SUPA_URL + '/rest/v1/leads_web';

  var chat = document.getElementById('chat');
  var fab = document.getElementById('fab');
  var chatBody = document.getElementById('chatBody');
  var chatInput = document.getElementById('chatInput');
  var chatSend = document.getElementById('chatSend');
  var quicks = document.getElementById('quicks');
  var history = [];
  var greeted = false, leadSent = false;

  function toggleChat() {
    var open = chat.classList.toggle('open');
    fab.style.display = open ? 'none' : 'flex';
    if (open && !greeted) { greeted = true; setTimeout(function () { botSay('Buenos días. Soy Galnac, asistente técnico de GALNAC. ¿En qué puedo ayudarle?'); }, 280); }
    if (open) setTimeout(function () { chatInput.focus(); }, 350);
  }
  function openChat() { if (!chat.classList.contains('open')) toggleChat(); }

  function addMsg(text, who) {
    var el = document.createElement('div');
    el.className = 'msg ' + who;
    el.textContent = text;
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function botSay(text) { addMsg(text, 'bot'); history.push({ role: 'assistant', content: text }); }
  function showTyping() {
    var t = document.createElement('div');
    t.className = 'typing'; t.id = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(t); chatBody.scrollTop = chatBody.scrollHeight;
  }
  function hideTyping() { var t = document.getElementById('typing'); if (t) t.remove(); }

  async function handleLead(raw) {
    var m = raw.match(/\[LEAD\]([\s\S]*?)\[\/LEAD\]/);
    if (!m || leadSent) return;
    leadSent = true;
    var d = {};
    try { d = JSON.parse(m[1]); } catch (e) { return; }
    var mensaje = [d.marca ? 'Marca/modelo: ' + d.marca : '', d.uso ? 'Uso: ' + d.uso : ''].filter(Boolean).join(' · ');
    try {
      await fetch(LEADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ nombre: d.nombre || '', telefono: d.telefono || '', sector: 'maquinaria-industrial', interes: d.equipo || '', mensaje: mensaje, origen: 'galnac-demo' })
      });
    } catch (e) { console.warn('lead insert', e); }
    try {
      await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ nombre: d.nombre || '', telefono: d.telefono || '', equipo: d.equipo || '', marca: d.marca || '', uso: d.uso || '' })
      });
    } catch (e) { console.warn('notify', e); }
  }

  async function send(text) {
    if (!text.trim()) return;
    if (quicks) quicks.style.display = 'none';
    addMsg(text, 'me');
    history.push({ role: 'user', content: text });
    chatInput.value = '';
    chatSend.disabled = true;
    showTyping();
    try {
      var r = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ messages: history })
      });
      var data = await r.json();
      hideTyping();
      var reply = data.reply || 'Disculpe, puede contactar con GALNAC en el +34 986 349 377.';
      handleLead(reply);
      var clean = reply.replace(/\[LEAD\][\s\S]*?\[\/LEAD\]/g, '').trim();
      botSay(clean || reply);
    } catch (e) {
      hideTyping();
      botSay('Disculpe, ha ocurrido un inconveniente técnico. Puede contactar con GALNAC en el +34 986 349 377 o en info@galnac.com.');
    } finally {
      chatSend.disabled = false;
      chatInput.focus();
    }
  }
  function quickSend(text) { send(text); }
  function askPresupuesto(producto) {
    openChat();
    setTimeout(function () { send('Me interesa el ' + producto + '. ¿Podrían facilitarme un presupuesto?'); }, 620);
  }

  /* ---- wiring ---- */
  fab.addEventListener('click', toggleChat);
  chat.querySelector('.chat-x').addEventListener('click', toggleChat);
  document.getElementById('chatForm').addEventListener('submit', function (e) { e.preventDefault(); send(chatInput.value); });
  quicks.querySelectorAll('.quick').forEach(function (b) { b.addEventListener('click', function () { quickSend(b.dataset.q); }); });

  /* ---- nav ---- */
  var nav = document.getElementById('nav');
  if (nav) addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 40); }, { passive: true });
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () { burger.classList.toggle('open'); mobileMenu.classList.toggle('open'); });
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mobileMenu.classList.remove('open'); burger.classList.remove('open'); }); });
  }

  /* ---- reveal ---- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(function (e) { io.observe(e); });
  }

  /* ---- expose ---- */
  window.toggleChat = toggleChat;
  window.openChat = openChat;
  window.quickSend = quickSend;
  window.askPresupuesto = askPresupuesto;
})();
