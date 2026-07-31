(() => {
  'use strict';

  const seed = window.VICTOR_OPS_SEED;
  const STORAGE_KEY = 'victorOps.state.v1';
  const ROUTINE_DATE_KEY = () => localDateKey(new Date());
  const statuses = [
    'Não contatado', 'Mensagem enviada', 'Respondeu', 'Portfólio enviado',
    'Qualificado', 'Proposta feita', 'Aguardando pagamento', 'Fechado',
    'Perdido', 'Retomar'
  ];
  const priorities = ['Muito alta', 'Alta', 'Segunda lista', 'Não priorizar'];
  const scriptStages = [
    { id: 'Abordagem', label: '1. Abordar', help: 'Use quando o lead ainda não respondeu. O objetivo é conseguir permissão para continuar a conversa.' },
    { id: 'Diagnóstico', label: '2. Diagnosticar', help: 'Use depois da primeira resposta para entender dificuldade, serviço prioritário e objetivo.' },
    { id: 'Portfólio', label: '3. Apresentar', help: 'Use para enviar o portfólio com contexto e criar um próximo passo claro.' },
    { id: 'Fechamento', label: '4. Fechar', help: 'Use quando a necessidade já está clara e chegou a hora de apresentar escopo, valor e pedir decisão.' },
    { id: 'Follow-up', label: '5. Acompanhar', help: 'Use quando a conversa parou, o material foi visualizado ou há uma decisão pendente.' },
    { id: 'Objeções', label: '6. Objeções', help: 'Use somente depois de identificar a objeção real: preço, momento, confiança ou necessidade.' },
    { id: 'Pagamento e briefing', label: '7. Receber e iniciar', help: 'Use depois do aceite para pagamento, confirmação e coleta do briefing.' },
    { id: 'Entrega e pós-venda', label: '8. Entregar e continuar', help: 'Use para aprovação, saldo, indicação, continuidade e reativação.' }
  ];
  const instagramMainFlow = [
    {
      id: 'warmup', number: '0', label: 'Aquecimento opcional', stage: 'Abordagem',
      scriptTitles: ['Resposta a Story de resultado', 'Resposta a Story de agenda aberta', 'Resposta a Story de bastidores'],
      when: 'Antes da primeira DM, quando houver um Story recente e relevante.',
      objective: 'Iniciar uma interação natural sem apresentar a oferta.',
      next: 'Depois da resposta ou no mesmo dia, envie a primeira DM.'
    },
    {
      id: 'first_dm', number: '1', label: 'Primeira DM', stage: 'Abordagem',
      scriptTitles: ['Instagram — abordagem principal', 'Instagram — direta e consultiva'],
      when: 'Lead validado e ainda não contatado.',
      objective: 'Conseguir permissão para continuar a conversa — não vender imediatamente.',
      next: 'Se responder, vá para Diagnóstico. Sem resposta em 24–48h, use Follow-up 1.'
    },
    {
      id: 'diagnosis', number: '2', label: 'Diagnóstico', stage: 'Diagnóstico',
      scriptTitles: ['Pergunta — principal dificuldade', 'Pergunta — serviço prioritário', 'Pergunta — objetivo'],
      when: 'O lead respondeu positivamente ou demonstrou curiosidade.',
      objective: 'Fazer somente uma pergunta por vez e entender a necessidade real.',
      next: 'Depois da resposta, peça permissão para enviar o portfólio.'
    },
    {
      id: 'portfolio_permission', number: '3', label: 'Permissão para o portfólio', stage: 'Diagnóstico',
      scriptTitles: ['Depois que aceita receber a sugestão'],
      when: 'Você já entendeu ao menos uma dificuldade ou objetivo.',
      objective: 'Explicar a oportunidade observada e pedir autorização para enviar o material.',
      next: 'Envie o portfólio somente depois do “sim”.'
    },
    {
      id: 'portfolio_sent', number: '4', label: 'Envio do portfólio', stage: 'Portfólio',
      scriptTitles: ['Mensagem junto com o portfólio'],
      when: 'O lead autorizou o envio.',
      objective: 'Dar contexto ao material e terminar com uma pergunta simples.',
      next: 'Aguarde a visualização; depois pergunte qual estilo combina mais.'
    },
    {
      id: 'portfolio_feedback', number: '5', label: 'Retorno sobre o portfólio', stage: 'Follow-up',
      scriptTitles: ['Visualizou o portfólio'],
      when: 'O material foi enviado e você precisa conduzir a conversa.',
      objective: 'Confirmar a abertura e obter uma preferência concreta.',
      next: 'Com a resposta, conecte a necessidade ao pacote.'
    },
    {
      id: 'offer', number: '6', label: 'Apresentação da oferta', stage: 'Fechamento',
      scriptTitles: ['Apresentação do Pacote Conteúdo Express'],
      when: 'Necessidade e serviço prioritário já estão claros.',
      objective: 'Apresentar escopo, prazo, valor e forma de pagamento sem texto adicional desnecessário.',
      next: 'Termine pedindo uma decisão ou autorização para enviar o briefing.'
    },
    {
      id: 'closing', number: '7', label: 'Pedido de fechamento', stage: 'Fechamento',
      scriptTitles: ['Fechamento direto', 'Fechamento com escolha'],
      when: 'O lead demonstrou interesse ou fez perguntas sobre a oferta.',
      objective: 'Pedir o avanço de forma explícita.',
      next: 'Se aceitar, envie o Pix. Se pedir tempo, combine uma data de retorno.'
    },
    {
      id: 'payment', number: '8', label: 'Pagamento', stage: 'Pagamento e briefing',
      scriptTitles: ['Envio do Pix', 'Confirmou, mas não pagou'],
      when: 'O lead aceitou a proposta.',
      objective: 'Receber a entrada antes de iniciar a produção.',
      next: 'Após o pagamento, confirme e envie o briefing.'
    },
    {
      id: 'briefing', number: '9', label: 'Confirmação e briefing', stage: 'Pagamento e briefing',
      scriptTitles: ['Confirmação de pagamento', 'Briefing por WhatsApp'],
      when: 'A entrada foi confirmada.',
      objective: 'Coletar as informações necessárias e iniciar o prazo de entrega.',
      next: 'Atualize o status para Fechado e registre o prazo da primeira versão.'
    }
  ];

  const instagramNoReplyFlow = [
    {
      id: 'followup_1', number: 'A', label: 'Follow-up 1 — sem resposta', stage: 'Follow-up',
      scriptTitles: ['Follow-up sem resposta à primeira DM'],
      when: '24–48 horas depois da primeira mensagem sem resposta.',
      objective: 'Retomar com contexto; não enviar apenas “viu minha mensagem?”.',
      fallbackBody: 'Olá, [NOME]. Passando só para confirmar se conseguiu ver minha mensagem. Eu queria te mostrar uma sugestão simples para organizar a divulgação de [SERVIÇO]. Ainda faz sentido eu te enviar?',
      next: 'Sem resposta, espere mais 48–72 horas antes do encerramento.'
    },
    {
      id: 'followup_2', number: 'B', label: 'Encerramento respeitoso', stage: 'Follow-up',
      scriptTitles: ['Encerramento respeitoso'],
      when: 'Depois de duas tentativas sem resposta.',
      objective: 'Parar de insistir e deixar uma porta aberta.',
      next: 'Marque como Retomar ou Perdido e siga para outros leads.'
    }
  ];

  const instagramStepOptions = [...instagramMainFlow, ...instagramNoReplyFlow];

  const pages = {
    dashboard: ['Painel', 'Visão geral da operação comercial.'],
    crm: ['CRM', 'Organize leads, contatos, próximos passos e receita.'],
    pipeline: ['Pipeline', 'Mova os leads pelas etapas da negociação.'],
    routine: ['Rotina', 'Execute as metas diárias e mantenha o caixa em movimento.'],
    scripts: ['Scripts', 'Mensagens prontas para prospecção, fechamento e follow-up.'],
    materials: ['Materiais', 'Portfólio, planilhas, arquivos de operação e uploads locais.'],
    settings: ['Configurações', 'Backup, dados do negócio e controles do painel.']
  };

  let state = loadState();
  let currentPage = location.hash.replace('#/', '') || 'dashboard';
  let activeLeadId = null;
  let confirmCallback = null;
  let crmFilters = { search: '', status: '', priority: '', segment: '', research: '' };
  let scriptFilters = { search: '', category: '', stage: '', favorites: false, leadId: '' };
  let activeScriptId = null;
  let activeInstagramLeadId = null;

  const mainContent = document.getElementById('mainContent');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('modalBackdrop');
  const leadModal = document.getElementById('leadModal');
  const importModal = document.getElementById('importModal');
  const confirmModal = document.getElementById('confirmModal');
  const scriptModal = document.getElementById('scriptModal');
  const scriptImportModal = document.getElementById('scriptImportModal');
  const instagramFlowModal = document.getElementById('instagramFlowModal');

  function inferScriptStage(category = '') {
    const map = {
      'Primeiro contato':'Abordagem', 'Stories':'Abordagem',
      'Permissão e diagnóstico':'Diagnóstico', 'Qualificação':'Diagnóstico',
      'Portfólio':'Portfólio', 'Oferta e fechamento':'Fechamento',
      'Follow-up':'Follow-up', 'Reativação':'Follow-up', 'Objeções':'Objeções',
      'Pagamento':'Pagamento e briefing', 'Briefing':'Pagamento e briefing',
      'Entrega':'Entrega e pós-venda', 'Pós-venda':'Entrega e pós-venda'
    };
    return map[category] || 'Abordagem';
  }

  function inferScriptChannel(script = {}) {
    const text = normalizeText(`${script.category || ''} ${script.title || ''}`);
    if (text.includes('story')) return 'Instagram Stories';
    if (text.includes('whatsapp')) return 'WhatsApp';
    if (text.includes('instagram')) return 'Instagram Direct';
    return 'WhatsApp / Direct';
  }

  function normalizeScript(raw = {}, index = 0) {
    const category = String(raw.category || raw.categoria || 'Geral').trim() || 'Geral';
    const stageValue = String(raw.stage || raw.etapa || inferScriptStage(category)).trim();
    const stage = scriptStages.some(item => item.id === stageValue) ? stageValue : inferScriptStage(category);
    const tags = Array.isArray(raw.tags) ? raw.tags.join(', ') : String(raw.tags || raw.etiquetas || '').trim();
    return {
      id: String(raw.id || `script-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`),
      title: String(raw.title || raw.titulo || raw.nome || 'Script sem título').trim(),
      body: String(raw.body || raw.texto || raw.mensagem || raw.conteudo || '').trim(),
      category,
      stage,
      channel: String(raw.channel || raw.canal || inferScriptChannel(raw)).trim() || 'WhatsApp / Direct',
      tags,
      favorite: raw.favorite === true || normalizeText(raw.favorite || raw.favorito) === 'sim',
      source: String(raw.source || raw.origem || 'Biblioteca pessoal'),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  function seedScripts() {
    return seed.scripts.map((script, index) => normalizeScript({
      ...script,
      id: `script-seed-${index + 1}`,
      source: 'Biblioteca original',
      createdAt: seed.generatedAt || new Date().toISOString(),
      updatedAt: seed.generatedAt || new Date().toISOString()
    }, index));
  }

  function scriptStageForStatus(status = '') {
    const map = {
      'Não contatado':'Abordagem', 'Mensagem enviada':'Follow-up', 'Respondeu':'Diagnóstico',
      'Portfólio enviado':'Follow-up', 'Qualificado':'Fechamento', 'Proposta feita':'Follow-up',
      'Aguardando pagamento':'Pagamento e briefing', 'Fechado':'Entrega e pós-venda',
      'Perdido':'Follow-up', 'Retomar':'Follow-up'
    };
    return map[status] || 'Abordagem';
  }

  function scriptStageInfo(stage) {
    return scriptStages.find(item => item.id === stage) || scriptStages[0];
  }


  function inferredInstagramStep(lead = {}) {
    const map = {
      'Não contatado': 'first_dm',
      'Mensagem enviada': 'followup_1',
      'Respondeu': 'diagnosis',
      'Portfólio enviado': 'portfolio_feedback',
      'Qualificado': 'offer',
      'Proposta feita': 'closing',
      'Aguardando pagamento': 'payment',
      'Fechado': 'briefing',
      'Perdido': 'followup_2',
      'Retomar': 'first_dm'
    };
    return map[lead.status] || 'first_dm';
  }

  function instagramStepForLead(lead = {}) {
    const requested = String(lead.instagramStep || '').trim();
    return instagramStepOptions.some(step => step.id === requested) ? requested : inferredInstagramStep(lead);
  }

  function instagramStepInfo(stepId) {
    return instagramStepOptions.find(step => step.id === stepId) || instagramMainFlow[1];
  }

  function findFlowScript(step) {
    for (const title of step.scriptTitles || []) {
      const script = state.scripts.find(item => normalizeText(item.title) === normalizeText(title));
      if (script) return script;
    }
    return null;
  }

  function instagramRecommendation(lead = {}) {
    const step = instagramStepInfo(instagramStepForLead(lead));
    const script = findFlowScript(step);
    return { step, script };
  }

  function instagramFlowScriptText(step, lead = null) {
    const script = findFlowScript(step);
    const body = script?.body || step.fallbackBody || 'Script não encontrado na biblioteca. Abra a área Scripts para cadastrar uma mensagem para esta etapa.';
    return lead ? personalizeScript(body, lead) : body;
  }

  function instagramFlowCard(step, lead, currentId, branch = false) {
    const script = findFlowScript(step);
    const hasText = Boolean(script || step.fallbackBody);
    const isCurrent = currentId === step.id;
    const text = instagramFlowScriptText(step, lead);
    return `<article class="ig-flow-card ${isCurrent ? 'current' : ''} ${branch ? 'branch' : ''}">
      <div class="ig-flow-number">${esc(step.number)}</div>
      <div class="ig-flow-card-body">
        <div class="ig-flow-card-head"><div><span>${branch ? 'Ramo sem resposta' : 'Caminho principal'}</span><h3>${esc(step.label)}</h3></div>${isCurrent ? '<span class="badge badge-high">Recomendado agora</span>' : ''}</div>
        <p><strong>Quando usar:</strong> ${esc(step.when)}</p>
        <p><strong>Objetivo:</strong> ${esc(step.objective)}</p>
        <details ${isCurrent ? 'open' : ''}><summary>${script ? esc(script.title) : (step.fallbackBody ? 'Script operacional da sequência' : 'Script não encontrado')}</summary><div class="ig-flow-script">${esc(text)}</div></details>
        <div class="ig-flow-next"><strong>Depois:</strong> ${esc(step.next)}</div>
        <div class="ig-flow-actions">
          <button class="small-btn" data-flow-copy="${esc(step.id)}" ${hasText ? '' : 'disabled'}>Copiar script</button>
          ${lead ? `<button class="small-btn ${isCurrent ? 'is-active' : ''}" data-flow-set="${esc(step.id)}">${isCurrent ? 'Etapa atual' : 'Definir como atual'}</button>` : ''}
        </div>
      </div>
    </article>`;
  }

  function openInstagramFlow(leadId = null) {
    activeInstagramLeadId = leadId || null;
    const lead = leadId ? state.leads.find(item => item.id === leadId) : null;
    const currentId = lead ? instagramStepForLead(lead) : 'first_dm';
    const recommendation = lead ? instagramRecommendation(lead) : null;
    document.getElementById('instagramFlowModalTitle').textContent = lead ? `Sequência — ${lead.name || lead.instagram}` : 'Sequência de scripts pelo Instagram';
    document.getElementById('instagramFlowContent').innerHTML = `
      <div class="ig-flow-summary">
        <div><span class="eyebrow">Regra simples</span><h3>Não envie todos os scripts em sequência.</h3><p>Envie uma mensagem, aguarde a reação e escolha o próximo ramo. Respondeu: diagnóstico. Não respondeu: follow-up. Aceitou: portfólio. Demonstrou interesse: oferta e fechamento.</p></div>
        ${lead && recommendation ? `<div class="ig-current-box"><span>Próximo script para este lead</span><strong>${esc(recommendation.step.label)}</strong><small>Status: ${esc(lead.status)} · etapa registrada: ${esc(instagramStepInfo(currentId).label)}</small><button class="primary-btn" data-flow-copy="${esc(currentId)}">Copiar recomendado</button></div>` : ''}
      </div>
      <div class="ig-decision-strip"><strong>Primeira DM</strong><span>→</span><b>Respondeu?</b><span class="decision-yes">SIM → Diagnóstico → Portfólio → Oferta → Fechamento</span><span class="decision-no">NÃO → Follow-up 1 → Encerramento</span></div>
      <div class="ig-flow-section-title"><div><span class="eyebrow">Caminho principal</span><h3>Quando o lead responde</h3></div></div>
      <div class="ig-flow-list">${instagramMainFlow.map(step => instagramFlowCard(step, lead, currentId, false)).join('')}</div>
      <div class="ig-flow-section-title"><div><span class="eyebrow">Ramo alternativo</span><h3>Quando o lead não responde</h3></div></div>
      <div class="ig-flow-list branch-list">${instagramNoReplyFlow.map(step => instagramFlowCard(step, lead, currentId, true)).join('')}</div>
    `;
    showModal(instagramFlowModal);
    const content = document.getElementById('instagramFlowContent');
    content.querySelectorAll('[data-flow-copy]').forEach(button => button.addEventListener('click', () => {
      const step = instagramStepInfo(button.dataset.flowCopy);
      copyText(instagramFlowScriptText(step, lead), `Script copiado: ${step.label}`);
    }));
    content.querySelectorAll('[data-flow-set]').forEach(button => button.addEventListener('click', () => {
      if (!lead) return;
      lead.instagramStep = button.dataset.flowSet;
      lead.nextAction = instagramStepInfo(lead.instagramStep).label;
      lead.updatedAt = new Date().toISOString();
      saveState();
      closeModals();
      renderCRM();
      toast('Etapa do Instagram atualizada', `${lead.name || lead.instagram}: ${instagramStepInfo(lead.instagramStep).label}`, 'success');
    }));
  }

  function freshState() {
    return {
      version: 2,
      business: { ...seed.business },
      leads: structuredClone(seed.leads),
      activities: [],
      routineLog: {},
      routines: structuredClone(seed.routines),
      scripts: seedScripts(),
      settings: { dailyRevenueGoal: 147, weeklyRevenueGoal: 735 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.leads)) return freshState();
      return {
        ...freshState(),
        ...saved,
        business: { ...seed.business, ...(saved.business || {}) },
        settings: { ...freshState().settings, ...(saved.settings || {}) },
        routines: Array.isArray(saved.routines) ? saved.routines : structuredClone(seed.routines),
        scripts: Array.isArray(saved.scripts) ? saved.scripts.map(normalizeScript) : seedScripts(),
        routineLog: saved.routineLog || {},
        activities: Array.isArray(saved.activities) ? saved.activities : []
      };
    } catch (error) {
      console.warn('Falha ao carregar dados locais:', error);
      return freshState();
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn('Não foi possível persistir os dados neste navegador:', error); }
    updateNavCount();
  }

  function uid(prefix = 'id') {
    return (crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function localDateKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function today() { return localDateKey(new Date()); }
  function formatDate(value, options = {}) {
    if (!value) return '—';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('pt-BR', options.dateStyle ? options : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
  function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }
  function formatNumber(value) { return new Intl.NumberFormat('pt-BR').format(Number(value) || 0); }
  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
  }
  function slug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function normalizeText(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function toast(title, message = '', type = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div><strong>${esc(title)}</strong>${message ? `<span>${esc(message)}</span>` : ''}</div><button class="icon-btn" aria-label="Fechar">×</button>`;
    el.querySelector('button').addEventListener('click', () => el.remove());
    document.getElementById('toastRegion').appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  function copyText(text, label = 'Texto copiado') {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
    toast(label, 'Pronto para colar na conversa.', 'success');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function updateNavCount() {
    const el = document.getElementById('navLeadCount');
    if (el) el.textContent = state.leads.length;
  }

  function setPage(page, pushHash = true) {
    if (!pages[page]) page = 'dashboard';
    currentPage = page;
    if (pushHash && location.hash !== `#/${page}`) history.pushState(null, '', `#/${page}`);
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
    document.getElementById('pageTitle').textContent = pages[page][0];
    document.getElementById('pageSubtitle').textContent = pages[page][1];
    sidebar.classList.remove('open');
    renderCurrentPage();
    mainContent.focus({ preventScroll: true });
  }

  function renderCurrentPage() {
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'crm') renderCRM();
    else if (currentPage === 'pipeline') renderPipeline();
    else if (currentPage === 'routine') renderRoutine();
    else if (currentPage === 'scripts') renderScripts();
    else if (currentPage === 'materials') renderMaterials();
    else if (currentPage === 'settings') renderSettings();
  }

  function stageGroup(status) {
    if (status === 'Não contatado') return 'Novos';
    if (['Mensagem enviada','Respondeu','Portfólio enviado','Qualificado'].includes(status)) return 'Conversas';
    if (['Proposta feita','Aguardando pagamento'].includes(status)) return 'Propostas';
    if (status === 'Fechado') return 'Fechados';
    return 'Saídas';
  }

  function metrics() {
    const leads = state.leads;
    const contacted = leads.filter(l => l.status !== 'Não contatado').length;
    const responses = leads.filter(l => ['Respondeu','Portfólio enviado','Qualificado','Proposta feita','Aguardando pagamento','Fechado'].includes(l.status)).length;
    const proposals = leads.filter(l => ['Proposta feita','Aguardando pagamento','Fechado'].includes(l.status)).length;
    const closed = leads.filter(l => l.status === 'Fechado').length;
    const revenue = leads.filter(l => l.status === 'Fechado').reduce((sum,l) => sum + (Number(l.closedRevenue) || Number(l.packageValue) || 0), 0);
    const due = leads.filter(l => l.nextActionDate && l.nextActionDate <= today() && !['Fechado','Perdido'].includes(l.status)).length;
    const conversion = contacted ? (closed / contacted * 100) : 0;
    return { total: leads.length, contacted, responses, proposals, closed, revenue, due, conversion };
  }

  function getRoutineProgress() {
    const log = state.routineLog[ROUTINE_DATE_KEY()] || {};
    let achieved = 0, target = 0;
    for (const r of state.routines) {
      const t = Math.max(1, Number(r.target) || 1);
      target += t;
      achieved += Math.min(t, Number(log[r.id]) || 0);
    }
    return { achieved, target, percent: target ? Math.round(achieved / target * 100) : 0 };
  }

  function renderDashboard() {
    const m = metrics();
    const routine = getRoutineProgress();
    const pipeline = ['Novos','Conversas','Propostas','Fechados','Saídas'].map(label => ({
      label, count: state.leads.filter(l => stageGroup(l.status) === label).length
    }));
    const colors = ['#cbb8aa','#a65f4b','#c69a5b','#6f8068','#8a7770'];
    const total = Math.max(1, pipeline.reduce((s,x) => s + x.count, 0));
    let acc = 0;
    const gradient = pipeline.map((x,i) => {
      const start = acc / total * 360; acc += x.count; const end = acc / total * 360;
      return `${colors[i]} ${start}deg ${end}deg`;
    }).join(',');

    const segments = groupCounts(state.leads, 'segment').slice(0, 6);
    const maxSegment = Math.max(1, ...segments.map(x => x.count));
    const focus = state.leads
      .filter(l => !['Fechado','Perdido'].includes(l.status))
      .sort((a,b) => (b.score || 0) - (a.score || 0) || priorityRank(a.priority) - priorityRank(b.priority))
      .slice(0, 5);

    mainContent.innerHTML = `
      <section class="kpi-grid">
        ${kpi('Leads na base', m.total, 'Base consolidada')}
        ${kpi('Contatados', m.contacted, `${m.total ? Math.round(m.contacted/m.total*100) : 0}% da base`)}
        ${kpi('Respostas', m.responses, 'Conversas qualificadas')}
        ${kpi('Propostas', m.proposals, 'Inclui aguardando Pix')}
        ${kpi('Fechados', m.closed, `${m.conversion.toFixed(1).replace('.',',')}% de conversão`)}
        ${kpi('Receita fechada', formatMoney(m.revenue), `${m.due} ações vencidas`, true)}
      </section>

      <section class="dashboard-grid">
        <article class="card chart-box">
          <div class="chart-head"><div><strong>Movimento do pipeline</strong><span>Distribuição atual dos leads por macroetapa.</span></div><span class="badge badge-dark">${m.total} leads</span></div>
          <div class="donut-wrap">
            <div class="donut" style="background:conic-gradient(${gradient || '#e9ded5 0 360deg'})"><div class="donut-center"><strong>${m.total}</strong><span>oportunidades</span></div></div>
            <div class="legend">${pipeline.map((x,i) => `<div class="legend-row"><span class="legend-swatch" style="background:${colors[i]}"></span><span>${esc(x.label)}</span><strong>${x.count}</strong></div>`).join('')}</div>
          </div>
        </article>

        <article class="card">
          <div class="chart-head"><div><strong>Rotina de hoje</strong><span>Execução das metas comerciais diárias.</span></div><button class="small-btn" data-go="routine">Abrir rotina</button></div>
          <div class="progress-shell">
            <div class="progress-ring" style="--p:${routine.percent}"><div class="progress-ring-content"><strong>${routine.percent}%</strong><span>${routine.achieved}/${routine.target}</span></div></div>
            <div class="progress-copy"><h3>${routine.percent >= 100 ? 'Rotina concluída' : 'Próximo bloco de execução'}</h3><p>${routine.percent >= 100 ? 'Registre os resultados no CRM e planeje a próxima rodada.' : 'Priorize contatos novos, follow-ups e pedidos explícitos de pagamento.'}</p></div>
          </div>
          <div class="divider"></div>
          <div class="focus-list">
            <div class="focus-item"><div class="focus-score">${m.due}</div><div><strong>Ações vencidas ou para hoje</strong><span>Leads que precisam de acompanhamento imediato.</span></div><button class="small-btn" data-go="crm" data-filter-due="1">Ver</button></div>
            <div class="focus-item"><div class="focus-score">${m.proposals}</div><div><strong>Propostas em jogo</strong><span>Priorize decisão e pagamento antes de abrir novos trabalhos.</span></div><button class="small-btn" data-go="pipeline">Ver</button></div>
          </div>
        </article>
      </section>

      <section class="dashboard-grid equal">
        <article class="card chart-box">
          <div class="chart-head"><div><strong>Leads por segmento</strong><span>Concentração da base para definir o foco de abordagem.</span></div></div>
          <div class="bar-list">${segments.length ? segments.map(x => `<div class="bar-row"><div class="bar-label" title="${esc(x.label)}">${esc(x.label)}</div><div class="bar-track"><div class="bar-fill" style="width:${x.count/maxSegment*100}%"></div></div><div class="bar-value">${x.count}</div></div>`).join('') : '<div class="empty-state">Sem dados.</div>'}</div>
        </article>
        <article class="card chart-box">
          <div class="chart-head"><div><strong>Atividade comercial — 14 dias</strong><span>Contatos, respostas, propostas e fechamentos registrados.</span></div></div>
          ${performanceChart()}
        </article>
      </section>

      <section class="card mt-18">
        <div class="section-head"><div><span class="eyebrow">Próximas abordagens</span><h2>Leads com maior prioridade</h2><p>Abra o Instagram, valide o perfil e use o gancho personalizado.</p></div><button class="secondary-btn" data-go="crm">Abrir CRM completo</button></div>
        <div class="focus-list">${focus.map(l => `<div class="focus-item"><div class="focus-score">${l.score ?? '—'}</div><div><strong>${esc(l.name || l.instagram)}</strong><span>${esc(l.segment)} · ${esc(l.city)} · ${esc(l.status)}</span></div><div class="table-actions"><button class="small-btn" data-copy-hook="${esc(l.id)}">Copiar gancho</button><button class="small-btn" data-edit-lead="${esc(l.id)}">Abrir</button></div></div>`).join('')}</div>
      </section>
    `;
    bindCommonPageActions();
  }

  function kpi(label, value, foot, accent = false) {
    return `<article class="kpi-card ${accent ? 'accent' : ''}"><div class="kpi-label">${esc(label)}</div><div class="kpi-value">${esc(value)}</div><div class="kpi-foot">${esc(foot)}</div></article>`;
  }

  function groupCounts(items, key) {
    const map = new Map();
    items.forEach(item => {
      const label = item[key] || 'Não informado';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map, ([label,count]) => ({label,count})).sort((a,b) => b.count - a.count);
  }

  function priorityRank(priority) {
    const idx = priorities.indexOf(priority);
    return idx < 0 ? 99 : idx;
  }

  function performanceChart() {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const count = state.activities.filter(a => localDateKey(a.date) === key && ['contact','response','proposal','closed'].includes(a.type)).length;
      days.push({ key, label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, count });
    }
    const width = 680, height = 225, padX = 34, padY = 24;
    const max = Math.max(4, ...days.map(d => d.count));
    const x = i => padX + i * ((width - padX*2) / (days.length - 1));
    const y = v => height - padY - (v/max)*(height-padY*2);
    const points = days.map((d,i) => `${x(i)},${y(d.count)}`).join(' ');
    const area = `${padX},${height-padY} ${points} ${x(days.length-1)},${height-padY}`;
    const grid = [0,.25,.5,.75,1].map(fr => `<line class="chart-gridline" x1="${padX}" y1="${padY+(height-padY*2)*fr}" x2="${width-padX}" y2="${padY+(height-padY*2)*fr}"/>`).join('');
    return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Atividade comercial dos últimos 14 dias">
      <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a65f4b"/><stop offset="1" stop-color="#a65f4b" stop-opacity="0"/></linearGradient></defs>
      ${grid}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points}"/>
      ${days.map((d,i) => `<circle class="chart-point" cx="${x(i)}" cy="${y(d.count)}" r="3.5"><title>${d.label}: ${d.count} ações</title></circle>`).join('')}
      ${days.filter((_,i)=>i%2===0 || i===days.length-1).map((d,i2) => { const i=days.indexOf(d); return `<text class="chart-label" x="${x(i)}" y="${height-5}" text-anchor="middle">${d.label}</text>`; }).join('')}
    </svg>`;
  }

  function filteredLeads() {
    const q = normalizeText(crmFilters.search);
    return state.leads.filter(l => {
      if (q && !normalizeText([l.name,l.instagram,l.segment,l.city,l.state,l.services,l.notes].join(' ')).includes(q)) return false;
      if (crmFilters.status && l.status !== crmFilters.status) return false;
      if (crmFilters.priority && l.priority !== crmFilters.priority) return false;
      if (crmFilters.segment && l.segment !== crmFilters.segment) return false;
      if (crmFilters.research && l.research !== crmFilters.research) return false;
      return true;
    }).sort((a,b) => priorityRank(a.priority)-priorityRank(b.priority) || (b.score||0)-(a.score||0) || String(a.name).localeCompare(String(b.name),'pt-BR'));
  }

  function renderCRM() {
    const leads = filteredLeads();
    const segments = [...new Set(state.leads.map(l => l.segment).filter(Boolean))].sort();
    const researches = [...new Set(state.leads.map(l => l.research).filter(Boolean))].sort();
    mainContent.innerHTML = `
      <section class="crm-instagram-guide">
        <div><span class="eyebrow">Fluxo Instagram</span><h2>Uma mensagem por vez, guiada pela resposta</h2><p><strong>Respondeu:</strong> diagnóstico → portfólio → oferta → fechamento. <strong>Não respondeu:</strong> follow-up em 24–48h → encerramento.</p></div>
        <button class="secondary-btn" id="openInstagramSequenceBtn">Ver sequência completa</button>
      </section>
      <div class="toolbar">
        <div class="toolbar-group search-box"><input id="crmSearch" type="search" placeholder="Buscar nome, perfil, cidade ou serviço" value="${esc(crmFilters.search)}"></div>
        <div class="toolbar-group">
          <select id="crmStatusFilter"><option value="">Todos os status</option>${statuses.map(s=>`<option ${crmFilters.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
          <select id="crmPriorityFilter"><option value="">Todas as prioridades</option>${priorities.map(s=>`<option ${crmFilters.priority===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
          <select id="crmSegmentFilter"><option value="">Todos os segmentos</option>${segments.map(s=>`<option ${crmFilters.segment===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
          <select id="crmResearchFilter"><option value="">Todas as pesquisas</option>${researches.map(s=>`<option ${crmFilters.research===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="toolbar">
        <div class="text-small text-muted"><strong>${leads.length}</strong> de ${state.leads.length} leads exibidos</div>
        <div class="toolbar-group">
          <button class="secondary-btn" id="crmImportBtn">Importar XLSX/CSV</button>
          <button class="secondary-btn" id="crmExportBtn">Exportar CSV</button>
          <button class="primary-btn" id="crmAddBtn">+ Novo lead</button>
        </div>
      </div>
      <div class="table-shell">
        ${leads.length ? `<table><thead><tr><th>Prioridade</th><th>Lead</th><th>Segmento / Local</th><th>Score</th><th>Status</th><th>Script agora</th><th>Próxima ação</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${leads.map(crmRow).join('')}</tbody></table>` : `<div class="empty-state"><strong>Nenhum lead encontrado</strong>Ajuste os filtros ou importe uma nova planilha.</div>`}
      </div>
    `;

    document.getElementById('crmSearch').addEventListener('input', e => { crmFilters.search=e.target.value; debounceRenderCRM(); });
    ['Status','Priority','Segment','Research'].forEach(name => {
      const el = document.getElementById(`crm${name}Filter`);
      el.addEventListener('change', e => { crmFilters[name.toLowerCase()] = e.target.value; renderCRM(); });
    });
    document.getElementById('openInstagramSequenceBtn').addEventListener('click', () => openInstagramFlow());
    document.getElementById('crmImportBtn').addEventListener('click', openImportModal);
    document.getElementById('crmExportBtn').addEventListener('click', exportCsv);
    document.getElementById('crmAddBtn').addEventListener('click', () => openLeadModal());
    mainContent.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', e => updateLeadStatus(e.target.dataset.id, e.target.value)));
    bindCommonPageActions();
  }

  let crmTimer;
  function debounceRenderCRM() { clearTimeout(crmTimer); crmTimer = setTimeout(renderCRM, 180); }

  function crmRow(l) {
    const badge = l.priority === 'Muito alta' ? 'badge-high' : l.priority === 'Alta' ? 'badge-medium' : l.priority === 'Não priorizar' ? 'badge-danger' : 'badge-low';
    const due = l.nextActionDate && l.nextActionDate <= today() && !['Fechado','Perdido'].includes(l.status);
    const recommendation = instagramRecommendation(l);
    return `<tr>
      <td><span class="badge ${badge}">${esc(l.priority || '—')}</span></td>
      <td><a class="profile-link" href="${esc(l.url || '#')}" target="_blank" rel="noopener">${esc(l.instagram || l.name)}</a><div class="cell-sub">${esc(l.name)}</div></td>
      <td><div class="cell-main">${esc(l.segment || '—')}</div><div class="cell-sub">${esc([l.city,l.state].filter(Boolean).join(' / '))}</div></td>
      <td><span class="score-pill ${(l.score||0)>=9?'top':''}">${l.score ?? '—'}</span></td>
      <td><select class="status-select" data-id="${esc(l.id)}">${statuses.map(s=>`<option ${l.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select></td>
      <td><div class="crm-script-now"><span>Etapa ${esc(recommendation.step.number)}</span><strong>${esc(recommendation.step.label)}</strong><button class="small-btn" data-instagram-flow="${esc(l.id)}">Usar script</button></div></td>
      <td><div class="cell-main ${due?'text-muted':''}">${esc(l.nextAction || recommendation.step.label)}</div><div class="cell-sub">${l.nextActionDate ? formatDate(l.nextActionDate) : 'Sem data'} ${due ? '· vencida' : ''}</div></td>
      <td><div class="cell-main">${formatMoney(l.packageValue)}</div><div class="cell-sub">${l.status==='Fechado' ? `Receita: ${formatMoney(l.closedRevenue || l.packageValue)}` : ''}</div></td>
      <td><div class="table-actions"><button class="small-btn" data-instagram-flow="${esc(l.id)}" title="Abrir sequência">Fluxo</button><button class="small-btn" data-edit-lead="${esc(l.id)}">Editar</button></div></td>
    </tr>`;
  }

  function renderPipeline() {
    mainContent.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">Funil de vendas</span><h2>Arraste os cards entre as etapas</h2><p>Cada mudança é registrada automaticamente na atividade comercial.</p></div><button class="primary-btn" id="pipelineAddBtn">+ Novo lead</button></div>
      <div class="pipeline-wrap"><div class="pipeline-board">${statuses.map(status => {
        const leads = state.leads.filter(l=>l.status===status).sort((a,b)=>(b.score||0)-(a.score||0));
        return `<section class="pipeline-col" data-status="${esc(status)}"><div class="pipeline-head"><strong>${esc(status)}</strong><span class="pipeline-count">${leads.length}</span></div><div class="pipeline-stack">${leads.map(pipelineCard).join('')}</div></section>`;
      }).join('')}</div></div>`;
    document.getElementById('pipelineAddBtn').addEventListener('click', () => openLeadModal());
    mainContent.querySelectorAll('.pipeline-card').forEach(card => {
      card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.id); setTimeout(()=>card.style.opacity='.45',0); });
      card.addEventListener('dragend', () => card.style.opacity='1');
      card.addEventListener('dblclick', () => openLeadModal(card.dataset.id));
    });
    mainContent.querySelectorAll('.pipeline-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('drag-over'); const id=e.dataTransfer.getData('text/plain'); updateLeadStatus(id,col.dataset.status); });
    });
  }

  function pipelineCard(l) {
    return `<article class="pipeline-card" draggable="true" data-id="${esc(l.id)}"><strong>${esc(l.name || l.instagram)}</strong><div class="handle">${esc(l.instagram)}</div><div class="meta"><span>${esc(l.segment || '—')}</span><span>${l.score ?? '—'} pts</span></div><div class="next">${esc(l.nextAction || 'Definir próxima ação')}${l.nextActionDate ? `<br><strong>${formatDate(l.nextActionDate)}</strong>` : ''}</div></article>`;
  }

  function renderRoutine() {
    const dayKey = ROUTINE_DATE_KEY();
    const log = state.routineLog[dayKey] || {};
    const progress = getRoutineProgress();
    const dueLeads = state.leads.filter(l => l.nextActionDate && l.nextActionDate <= today() && !['Fechado','Perdido'].includes(l.status)).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,7);
    mainContent.innerHTML = `
      <section class="routine-layout">
        <article class="card">
          <div class="chart-head"><div><strong>Metas comerciais de hoje</strong><span>Atualize os contadores durante o dia.</span></div><span class="badge ${progress.percent>=100?'badge-high':'badge-medium'}">${progress.percent}%</span></div>
          <div class="progress-shell"><div class="progress-ring" style="--p:${progress.percent}"><div class="progress-ring-content"><strong>${progress.percent}%</strong><span>${progress.achieved}/${progress.target}</span></div></div><div class="progress-copy"><h3>${progress.percent >= 100 ? 'Dia executado' : 'Caixa vem da execução'}</h3><p>Não espere o material ficar perfeito. Valide perfis, converse, diagnostique e peça o pagamento.</p></div></div>
          <div class="routine-list">${state.routines.sort((a,b)=>a.order-b.order).map(r => {
            const value=Number(log[r.id])||0, complete=value>=r.target;
            return `<div class="routine-item ${complete?'complete':''}" data-routine="${esc(r.id)}"><div><div class="routine-title">${esc(r.title)}</div><div class="routine-target">Meta: ${r.target} ${esc(r.unit)}</div></div><div class="counter"><button data-step="-1" aria-label="Diminuir">−</button><input type="number" min="0" max="999" value="${value}" data-routine-input="${esc(r.id)}"><button data-step="1" aria-label="Aumentar">+</button></div></div>`;
          }).join('')}</div>
        </article>
        <div class="grid">
          <article class="card"><div class="chart-head"><div><strong>Blocos de horário</strong><span>Estrutura sugerida para não misturar seleção, conversa e entrega.</span></div></div><div class="timeblock-list">${seed.timeblocks.map(b=>`<div class="timeblock"><time>${esc(b.time)}</time><span>${esc(b.label)}</span></div>`).join('')}</div></article>
          <article class="card"><div class="chart-head"><div><strong>Ações vencidas</strong><span>Resolva antes de abrir muitas conversas novas.</span></div><span class="badge ${dueLeads.length?'badge-danger':'badge-high'}">${dueLeads.length}</span></div><div class="focus-list">${dueLeads.length ? dueLeads.map(l=>`<div class="focus-item"><div class="focus-score">${l.score??'—'}</div><div><strong>${esc(l.name)}</strong><span>${esc(l.nextAction)} · ${formatDate(l.nextActionDate)}</span></div><button class="small-btn" data-edit-lead="${esc(l.id)}">Abrir</button></div>`).join('') : '<div class="notice info">Nenhuma ação vencida. Use o bloco livre para prospectar novos leads.</div>'}</div></article>
        </div>
      </section>
      <section class="card mt-18 flush"><div style="padding:20px 20px 0"><div class="section-head"><div><span class="eyebrow">Cadência semanal</span><h2>Rotina por dia</h2><p>Use como referência e ajuste conforme o volume de entregas.</p></div></div></div><div class="table-shell" style="border:0;box-shadow:none;border-radius:0"><table class="week-table"><thead><tr><th>Dia</th><th>Foco</th><th>Execução</th></tr></thead><tbody>${seed.weekly.map(w=>`<tr><td><strong>${esc(w.day)}</strong></td><td>${esc(w.focus)}</td><td>${esc(w.tasks)}</td></tr>`).join('')}</tbody></table></div></section>`;

    mainContent.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', () => {
      const item=btn.closest('[data-routine]'), id=item.dataset.routine, input=item.querySelector('input');
      input.value=Math.max(0,(Number(input.value)||0)+Number(btn.dataset.step)); updateRoutine(id,input.value);
    }));
    mainContent.querySelectorAll('[data-routine-input]').forEach(input => input.addEventListener('change', () => updateRoutine(input.dataset.routineInput,input.value)));
    bindCommonPageActions();
  }

  function updateRoutine(id, value) {
    const key=ROUTINE_DATE_KEY();
    if (!state.routineLog[key]) state.routineLog[key]={};
    state.routineLog[key][id]=Math.max(0,Number(value)||0);
    saveState(); renderRoutine();
  }

  function renderScripts() {
    const selectedLead = state.leads.find(lead => lead.id === scriptFilters.leadId);
    const categories = [...new Set(state.scripts.map(script => script.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const q = normalizeText(scriptFilters.search);
    const scripts = state.scripts.filter(script =>
      (!scriptFilters.category || script.category === scriptFilters.category) &&
      (!scriptFilters.stage || script.stage === scriptFilters.stage) &&
      (!scriptFilters.favorites || script.favorite) &&
      (!q || normalizeText(`${script.title} ${script.body} ${script.category} ${script.stage} ${script.channel} ${script.tags}`).includes(q))
    );
    const stageInfo = scriptFilters.stage ? scriptStageInfo(scriptFilters.stage) : null;
    const activeCount = state.scripts.length;

    mainContent.innerHTML = `
      <div class="section-head scripts-main-head">
        <div><span class="eyebrow">Biblioteca operacional</span><h2>Escolha a etapa antes de escolher a mensagem</h2><p>O painel mostra apenas os scripts adequados ao momento da conversa.</p></div>
        <div class="toolbar-group"><button class="secondary-btn" id="openInstagramFlowFromScripts">Sequência Instagram</button><button class="secondary-btn" id="importScriptsBtn">Importar scripts</button><button class="primary-btn" id="newScriptBtn">+ Novo script</button></div>
      </div>

      <section class="script-guide card">
        <div class="script-guide-top">
          <div class="form-field script-lead-picker"><label>Conversa atual (opcional)</label><select id="scriptLeadSelect"><option value="">Sem lead selecionado</option>${state.leads.filter(l=>!['Perdido'].includes(l.status)).sort((a,b)=>(b.score||0)-(a.score||0)).map(l=>`<option value="${esc(l.id)}" ${selectedLead?.id===l.id?'selected':''}>${esc(l.name||l.instagram)} · ${esc(l.status)}</option>`).join('')}</select></div>
          <div class="script-context ${selectedLead?'active':''}">${selectedLead ? `<span>Recomendação para</span><strong>${esc(selectedLead.name || selectedLead.instagram)}</strong><small>Status atual: ${esc(selectedLead.status)} · próximo script: ${esc(instagramStepInfo(instagramStepForLead(selectedLead)).label)}</small>` : '<span>Como usar</span><strong>Selecione um lead ou uma etapa</strong><small>Depois copie a mensagem, personalize os campos entre colchetes e registre o próximo passo no CRM.</small>'}</div>
        </div>
        <div class="script-stage-list">
          <button class="script-stage ${!scriptFilters.stage?'active':''}" data-script-stage=""><span>Todos</span><small>${activeCount} scripts</small></button>
          ${scriptStages.map(item=>{
            const count=state.scripts.filter(s=>s.stage===item.id).length;
            return `<button class="script-stage ${scriptFilters.stage===item.id?'active':''}" data-script-stage="${esc(item.id)}"><span>${esc(item.label)}</span><small>${count} scripts</small></button>`;
          }).join('')}
        </div>
        ${stageInfo ? `<div class="script-stage-help"><strong>${esc(stageInfo.id)}</strong><span>${esc(stageInfo.help)}</span></div>` : ''}
      </section>

      <div class="script-toolbar advanced">
        <div class="search-box"><input id="scriptSearch" type="search" placeholder="Buscar por situação, objeção ou palavra" value="${esc(scriptFilters.search)}"></div>
        <select id="scriptCategory"><option value="">Todas as categorias</option>${categories.map(c=>`<option value="${esc(c)}" ${scriptFilters.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
        <button class="secondary-btn ${scriptFilters.favorites?'is-active':''}" id="favoriteScriptsBtn">★ Favoritos</button>
        <button class="secondary-btn" id="exportScriptsBtn">Exportar CSV</button>
        <button class="secondary-btn" id="downloadScriptsBtn">Biblioteca TXT</button>
      </div>

      <div class="script-results"><strong>${scripts.length}</strong> de ${state.scripts.length} scripts exibidos${selectedLead ? ` · ao copiar, o painel preenche os dados disponíveis de <b>${esc(selectedLead.name||selectedLead.instagram)}</b>` : ''}.</div>
      ${scripts.length ? `<div class="script-grid">${scripts.map(script=>scriptCardHtml(script, selectedLead)).join('')}</div>` : `<div class="empty-state card"><strong>Nenhum script encontrado</strong><span>Limpe os filtros, crie um novo script ou importe uma biblioteca.</span></div>`}`;

    document.getElementById('openInstagramFlowFromScripts').addEventListener('click',()=>openInstagramFlow(selectedLead?.id || null));
    document.getElementById('newScriptBtn').addEventListener('click',()=>openScriptModal());
    document.getElementById('importScriptsBtn').addEventListener('click',openScriptImportModal);
    document.getElementById('scriptSearch').addEventListener('input',e=>{scriptFilters.search=e.target.value;clearTimeout(crmTimer);crmTimer=setTimeout(renderScripts,160);});
    document.getElementById('scriptCategory').addEventListener('change',e=>{scriptFilters.category=e.target.value;renderScripts();});
    document.getElementById('favoriteScriptsBtn').addEventListener('click',()=>{scriptFilters.favorites=!scriptFilters.favorites;renderScripts();});
    document.getElementById('scriptLeadSelect').addEventListener('change',e=>{scriptFilters.leadId=e.target.value;const lead=state.leads.find(l=>l.id===e.target.value);if(lead)scriptFilters.stage=instagramStepInfo(instagramStepForLead(lead)).stage;renderScripts();});
    document.querySelectorAll('[data-script-stage]').forEach(btn=>btn.addEventListener('click',()=>{scriptFilters.stage=btn.dataset.scriptStage;renderScripts();}));
    document.getElementById('exportScriptsBtn').addEventListener('click',exportScriptsCsv);
    document.getElementById('downloadScriptsBtn').addEventListener('click',()=>location.href='materials/Scripts_de_Conversa_e_Fechamento.txt');
    mainContent.querySelectorAll('[data-copy-script]').forEach(btn=>btn.addEventListener('click',()=>{
      const script=state.scripts.find(s=>s.id===btn.dataset.copyScript);if(script)copyText(personalizeScript(script.body,selectedLead));
    }));
    mainContent.querySelectorAll('[data-favorite-script]').forEach(btn=>btn.addEventListener('click',()=>toggleScriptFavorite(btn.dataset.favoriteScript)));
    mainContent.querySelectorAll('[data-edit-script]').forEach(btn=>btn.addEventListener('click',()=>openScriptModal(btn.dataset.editScript)));
    mainContent.querySelectorAll('[data-delete-script]').forEach(btn=>btn.addEventListener('click',()=>deleteScript(btn.dataset.deleteScript)));
  }

  function scriptCardHtml(script, selectedLead) {
    const customized = selectedLead ? personalizeScript(script.body, selectedLead) : script.body;
    const hasReplacement = selectedLead && customized !== script.body;
    return `<article class="script-card">
      <div class="script-card-head"><div><div class="script-meta-line"><span class="script-category">${esc(script.category)}</span><span class="script-stage-chip">${esc(script.stage)}</span></div><h3>${esc(script.title)}</h3><div class="script-submeta">${esc(script.channel)}${script.tags?` · ${esc(script.tags)}`:''}</div></div><button class="favorite-btn ${script.favorite?'active':''}" data-favorite-script="${esc(script.id)}" title="${script.favorite?'Remover dos favoritos':'Adicionar aos favoritos'}">★</button></div>
      <div class="script-body">${esc(hasReplacement ? customized : script.body)}</div>
      ${hasReplacement?'<div class="script-personalized">Prévia personalizada com os dados do lead selecionado.</div>':''}
      <div class="script-actions"><span class="script-source">${esc(script.source||'Biblioteca pessoal')}</span><button class="small-btn" data-edit-script="${esc(script.id)}">Editar</button><button class="small-btn" data-copy-script="${esc(script.id)}">Copiar${selectedLead?' personalizado':''}</button><button class="small-btn danger-soft" data-delete-script="${esc(script.id)}">Excluir</button></div>
    </article>`;
  }

  function personalizeScript(text, lead) {
    if (!lead) return text;
    const values = {
      '[NOME]': lead.name || lead.instagram || '',
      '[EMPRESA]': lead.name || '',
      '[NEGÓCIO]': lead.name || '',
      '[SERVIÇO]': lead.services || lead.segment || '',
      '[SERVIÇOS]': lead.services || lead.segment || '',
      '[CIDADE]': lead.city || '',
      '[PERFIL]': lead.instagram || '',
      '[VALOR]': formatMoney(lead.packageValue || state.business.defaultValue || 147)
    };
    let result = String(text || '');
    Object.entries(values).forEach(([key,value])=>{if(value)result=result.split(key).join(value);});
    return result;
  }

  function openScriptModal(id = null) {
    activeScriptId=id;
    const existing=state.scripts.find(script=>script.id===id) || {title:'',body:'',category:'Primeiro contato',stage:'Abordagem',channel:'WhatsApp / Direct',tags:'',source:'Biblioteca pessoal'};
    document.getElementById('scriptModalTitle').textContent=id?'Editar script':'Novo script';
    document.getElementById('scriptForm').innerHTML=scriptFormHtml(existing);
    showModal(scriptModal);
    document.querySelector('#scriptForm [data-close-modal]')?.addEventListener('click',closeModals);
    setTimeout(()=>document.querySelector('#scriptForm [name="title"]')?.focus(),30);
  }

  function scriptFormHtml(script) {
    const categories=[...new Set([...state.scripts.map(s=>s.category),'Primeiro contato','Stories','Permissão e diagnóstico','Portfólio','Qualificação','Oferta e fechamento','Follow-up','Objeções','Pagamento','Briefing','Entrega','Pós-venda','Reativação','Geral'])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    return `
      <div class="form-field span-2"><label>Título</label><input name="title" required value="${esc(script.title)}" placeholder="Ex.: Follow-up após portfólio"></div>
      <div class="form-field"><label>Canal</label><select name="channel">${['WhatsApp / Direct','WhatsApp','Instagram Direct','Instagram Stories','Ligação / áudio','E-mail'].map(v=>`<option ${script.channel===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="form-field"><label>Categoria</label><input name="category" list="scriptCategoryOptions" required value="${esc(script.category)}"><datalist id="scriptCategoryOptions">${categories.map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist></div>
      <div class="form-field"><label>Etapa da conversa</label><select name="stage">${scriptStages.map(item=>`<option value="${esc(item.id)}" ${script.stage===item.id?'selected':''}>${esc(item.label)}</option>`).join('')}</select></div>
      <div class="form-field"><label>Tags</label><input name="tags" value="${esc(script.tags)}" placeholder="preço, agenda, objeção"></div>
      <div class="form-field span-3"><label>Texto do script</label><textarea name="body" required rows="10" placeholder="Escreva a mensagem. Use [NOME], [SERVIÇO], [EMPRESA], [CIDADE] e [VALOR] para personalização automática.">${esc(script.body)}</textarea></div>
      <div class="form-actions"><div class="text-small text-muted">Os scripts são salvos neste navegador e entram no backup JSON.</div><div class="form-actions-right"><button type="button" class="secondary-btn" data-close-modal>Cancelar</button><button type="submit" class="primary-btn">Salvar script</button></div></div>`;
  }

  function saveScriptForm(event) {
    event.preventDefault();
    const data=Object.fromEntries(new FormData(event.target));
    const now=new Date().toISOString();
    if(activeScriptId){
      const index=state.scripts.findIndex(script=>script.id===activeScriptId);
      if(index>=0)state.scripts[index]=normalizeScript({...state.scripts[index],...data,id:activeScriptId,updatedAt:now});
    }else{
      state.scripts.unshift(normalizeScript({...data,id:uid('script'),source:'Criado no painel',createdAt:now,updatedAt:now}));
    }
    saveState();closeModals();renderScripts();toast('Script salvo','A biblioteca foi atualizada.','success');
  }

  function toggleScriptFavorite(id){const script=state.scripts.find(s=>s.id===id);if(!script)return;script.favorite=!script.favorite;script.updatedAt=new Date().toISOString();saveState();renderScripts();}

  function deleteScript(id){const script=state.scripts.find(s=>s.id===id);if(!script)return;confirmAction('Excluir script',`Excluir “${script.title}”? Esta ação não pode ser desfeita sem restaurar um backup.`,()=>{state.scripts=state.scripts.filter(s=>s.id!==id);saveState();renderScripts();toast('Script excluído','','success');});}

  function openScriptImportModal(){
    const result=document.getElementById('scriptImportResult');result.classList.add('hidden');result.innerHTML='';document.getElementById('scriptFileInput').value='';showModal(scriptImportModal);
  }

  const scriptHeaderAliases={
    id:['id','codigo'],title:['titulo','title','nome','nomedoscript','script'],body:['texto','body','mensagem','conteudo','corpo','scripttexto'],
    category:['categoria','category','tipo'],stage:['etapa','stage','funil','momentodaconversa'],channel:['canal','channel','meio'],tags:['tags','etiquetas','palavraschave'],favorite:['favorito','favorite'],source:['origem','source']
  };
  const scriptAliasToField=new Map();Object.entries(scriptHeaderAliases).forEach(([field,aliases])=>aliases.forEach(alias=>scriptAliasToField.set(normalizeText(alias),field)));

  async function handleScriptImportFile(file){
    if(!file)return;
    const result=document.getElementById('scriptImportResult');result.classList.remove('hidden');result.innerHTML='<strong>Analisando a biblioteca…</strong><br>Identificando títulos, textos, categorias e duplicidades.';
    try{
      let imported=[];let meta={};const lower=file.name.toLowerCase();
      if(lower.endsWith('.json')){
        const data=JSON.parse(await file.text());imported=Array.isArray(data)?data:(data.scripts||[]);
        if(!Array.isArray(imported))throw new Error('O JSON não contém uma lista de scripts.');
      }else if(lower.endsWith('.txt')){
        imported=parseScriptsTxt(await file.text());
      }else{
        const workbook=await window.XLSX_LITE.parseFile(file);const extraction=extractScriptRows(workbook.sheets);
        if(!extraction.rows.length)throw new Error('Não encontrei uma tabela com as colunas Título e Texto.');
        imported=extraction.rows.map(row=>mapImportedScriptRow(row,extraction.headerMap)).filter(s=>s.title&&s.body);meta={sheet:extraction.sheetName,headerRow:extraction.headerRow+1};
      }
      const summary=mergeImportedScripts(imported.map(normalizeScript));
      result.innerHTML=`<strong>Importação concluída</strong><br>Arquivo: ${esc(file.name)}${meta.sheet?`<br>Planilha: ${esc(meta.sheet)} · cabeçalho na linha ${meta.headerRow}`:''}<br><br><strong>${summary.added}</strong> novos · <strong>${summary.updated}</strong> atualizados · <strong>${summary.skipped}</strong> ignorados.`;
      saveState();renderScripts();toast('Scripts importados','A biblioteca foi atualizada.','success');
    }catch(error){console.error(error);result.innerHTML=`<strong>Não foi possível importar.</strong><br>${esc(error.message||String(error))}`;toast('Erro na importação',error.message||String(error),'error');}
  }

  function extractScriptRows(sheets){
    let best=null;
    for(const sheet of sheets){
      const maxRows=Math.min(sheet.rows.length,25);
      for(let i=0;i<maxRows;i++){
        const map={};let score=0;let hasTitle=false,hasBody=false;
        (sheet.rows[i]||[]).forEach((cell,index)=>{const field=scriptAliasToField.get(normalizeText(cell));if(field&&!Object.values(map).includes(field)){map[index]=field;score++;if(field==='title')hasTitle=true;if(field==='body')hasBody=true;}});
        if(hasTitle&&hasBody&&(!best||score>best.score))best={sheet,headerRow:i,headerMap:map,score};
      }
    }
    if(!best)return{rows:[],headerMap:{},headerRow:0,sheetName:''};
    return{rows:best.sheet.rows.slice(best.headerRow+1).filter(row=>row&&row.some(v=>String(v??'').trim())),headerMap:best.headerMap,headerRow:best.headerRow,sheetName:best.sheet.name};
  }

  function mapImportedScriptRow(row,map){const obj={};Object.entries(map).forEach(([index,field])=>obj[field]=row[Number(index)]);return obj;}

  function parseScriptsTxt(text){
    return String(text||'').split(/\n\s*---+\s*\n/g).map(block=>block.trim()).filter(Boolean).map((block,index)=>{
      const lines=block.split(/\r?\n/).map(line=>line.trimEnd());let title=(lines.shift()||`Script ${index+1}`).replace(/^t[ií]tulo\s*:\s*/i,'').trim();
      let category='Importado de TXT';if(lines[0]&&/^categoria\s*:/i.test(lines[0]))category=lines.shift().replace(/^categoria\s*:\s*/i,'').trim();
      return{title,body:lines.join('\n').trim(),category,source:'Importado de TXT'};
    }).filter(item=>item.title&&item.body);
  }

  function scriptKey(script){return`${normalizeText(script.title)}:${normalizeText(script.category)}`;}
  function mergeImportedScripts(imported){let added=0,updated=0,skipped=0;const index=new Map(state.scripts.map((script,i)=>[scriptKey(script),i]));for(const item of imported){if(!item.title||!item.body){skipped++;continue;}const key=scriptKey(item);if(index.has(key)){const i=index.get(key),existing=state.scripts[i];state.scripts[i]=normalizeScript({...existing,...item,id:existing.id,createdAt:existing.createdAt,source:item.source||'Importado',updatedAt:new Date().toISOString()});updated++;}else{item.id=uid('script');item.source=item.source||'Importado';state.scripts.push(normalizeScript(item));index.set(key,state.scripts.length-1);added++;}}return{added,updated,skipped};}

  function exportScriptsCsv(){
    const fields=[['Título','title'],['Texto','body'],['Categoria','category'],['Etapa','stage'],['Canal','channel'],['Tags','tags'],['Favorito','favorite'],['Origem','source']];
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const rows=state.scripts.map(script=>fields.map(([,key])=>quote(key==='favorite'?(script.favorite?'Sim':'Não'):script[key])).join(';'));
    const csv='\ufeff'+[fields.map(([label])=>quote(label)).join(';'),...rows].join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`Scripts_Victor_Ops_${today()}.csv`);toast('Scripts exportados','','success');
  }

  function downloadScriptTemplate(){
    const csv='\ufeff"Título";"Texto";"Categoria";"Etapa";"Canal";"Tags"\r\n"Exemplo — primeiro contato";"Olá, [NOME]. Vi o seu trabalho e percebi uma oportunidade. Posso te mostrar?";"Primeiro contato";"Abordagem";"Instagram Direct";"prospecção, primeiro contato"';
    downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'Modelo_Importacao_Scripts_Victor_Ops.csv');
  }

  const archiveMaterials = [
    'Portfolio_Conteudo_Beleza_Editavel.pptx','Portfolio_Conteudo_Beleza_Pronto_WhatsApp.pdf',
    'Portfolio_Conteudo_Beleza_Victor_Takayama_Corrigido_Editavel.pptx','Portfolio_Conteudo_Beleza_Victor_Takayama_Corrigido_Pronto_WhatsApp.pdf',
    'Portfolio_Conteudo_Beleza_Victor_Takayama_Editavel.pptx','Portfolio_Conteudo_Beleza_Victor_Takayama_Premium_Editavel.pptx',
    'Portfolio_Conteudo_Beleza_Victor_Takayama_Premium_WhatsApp.pdf','Portfolio_Conteudo_Beleza_Victor_Takayama_Premium_WhatsApp_Editavel.pptx',
    'Portfolio_Conteudo_Beleza_Victor_Takayama_Pronto_WhatsApp.pdf'
  ];

  async function renderMaterials() {
    const customFiles=await fileDB.list();
    mainContent.innerHTML=`
      <div class="notice info mb-18"><strong>Como os uploads funcionam:</strong> os arquivos adicionados por você ficam guardados somente neste navegador, usando armazenamento local. Os materiais principais abaixo já estão incluídos no pacote do site.</div>
      <section><div class="section-head"><div><span class="eyebrow">Biblioteca principal</span><h2>Materiais da operação</h2><p>Versões finais e arquivos de trabalho organizados em um só lugar.</p></div></div><div class="material-grid">${seed.materials.map(m=>materialCard(m)).join('')}<article class="material-card upload-card"><div class="upload-icon">＋</div><h3>Adicionar material local</h3><p>Guarde propostas, briefings, imagens ou novas planilhas neste navegador.</p><button class="secondary-btn" id="materialUploadBtn">Selecionar arquivo</button><input id="materialFileInput" type="file" multiple hidden></article></div></section>
      <section class="card mt-18"><div class="section-head"><div><span class="eyebrow">Uploads locais</span><h2>Seus arquivos adicionais</h2><p>Estes arquivos não são enviados ao Cloudflare nem sincronizados entre aparelhos.</p></div></div><div class="local-file-list" id="localFileList">${customFiles.length?customFiles.map(localFileRow).join(''):'<div class="empty-state"><strong>Nenhum arquivo adicional</strong>Use o botão acima para guardar novos materiais neste navegador.</div>'}</div></section>
      <section class="card mt-18"><div class="section-head"><div><span class="eyebrow">Arquivo</span><h2>Versões anteriores do portfólio</h2><p>Mantidas separadas para evitar o uso acidental de uma versão antiga.</p></div></div><details><summary class="secondary-btn" style="width:max-content">Mostrar ${archiveMaterials.length} versões arquivadas</summary><div class="archive-list">${archiveMaterials.map(name=>`<a class="archive-link" href="materials/archive/${encodeURIComponent(name)}" download><span>${esc(name)}</span><strong>Baixar</strong></a>`).join('')}</div></details></section>`;
    document.getElementById('materialUploadBtn').addEventListener('click',()=>document.getElementById('materialFileInput').click());
    document.getElementById('materialFileInput').addEventListener('change',async e=>{for(const f of e.target.files)await fileDB.put(f);toast('Materiais salvos','Os arquivos foram armazenados neste navegador.','success');renderMaterials();});
    mainContent.querySelectorAll('[data-local-download]').forEach(btn=>btn.addEventListener('click',async()=>{const item=await fileDB.get(btn.dataset.localDownload);if(item)downloadBlob(item.blob,item.name);}));
    mainContent.querySelectorAll('[data-local-delete]').forEach(btn=>btn.addEventListener('click',()=>confirmAction('Excluir material local',`Deseja remover “${btn.dataset.name}” deste navegador?`,async()=>{await fileDB.delete(btn.dataset.localDelete);renderMaterials();toast('Arquivo removido','','success');})));
  }

  function materialCard(m){return `<article class="material-card"><div class="material-type">${esc(m.type)}</div><div class="script-category">${esc(m.category)}</div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><div class="material-actions"><a class="secondary-btn" href="${esc(m.path)}" target="_blank" rel="noopener">Abrir</a><a class="small-btn" href="${esc(m.path)}" download>Baixar</a></div></article>`;}
  function localFileRow(f){return `<div class="local-file-row"><div><strong>${esc(f.name)}</strong><span>${formatBytes(f.size)} · salvo em ${formatDate(f.createdAt,{dateStyle:'medium'})}</span></div><div class="table-actions"><button class="small-btn" data-local-download="${esc(f.id)}">Baixar</button><button class="small-btn" data-local-delete="${esc(f.id)}" data-name="${esc(f.name)}">Excluir</button></div></div>`;}
  function formatBytes(size){if(size<1024)return `${size} B`;if(size<1048576)return `${(size/1024).toFixed(1)} KB`;return `${(size/1048576).toFixed(1)} MB`;}

  function renderSettings() {
    mainContent.innerHTML=`
      <section class="settings-grid">
        <article class="setting-block"><h3>Dados do negócio</h3><p>Usados como referência no painel e nas metas.</p><form id="businessForm" class="grid"><div class="form-field"><label>Nome / marca</label><input name="name" value="${esc(state.business.name)}" required></div><div class="form-row"><div class="form-field"><label>Responsável</label><input name="owner" value="${esc(state.business.owner)}"></div><div class="form-field"><label>WhatsApp</label><input name="phone" value="${esc(state.business.phone)}"></div></div><div class="form-row"><div class="form-field"><label>Oferta principal</label><input name="offer" value="${esc(state.business.offer)}"></div><div class="form-field"><label>Valor padrão</label><input name="defaultValue" type="number" step="0.01" value="${Number(state.business.defaultValue)||147}"></div></div><button class="primary-btn" type="submit">Salvar dados</button></form></article>
        <article class="setting-block"><h3>Metas financeiras</h3><p>Servem como referência; não alteram os valores dos leads existentes.</p><form id="goalsForm" class="grid"><div class="form-row"><div class="form-field"><label>Meta diária</label><input name="dailyRevenueGoal" type="number" step="0.01" value="${Number(state.settings.dailyRevenueGoal)||147}"></div><div class="form-field"><label>Meta semanal</label><input name="weeklyRevenueGoal" type="number" step="0.01" value="${Number(state.settings.weeklyRevenueGoal)||735}"></div></div><button class="primary-btn" type="submit">Salvar metas</button></form></article>
        <article class="setting-block"><h3>Backup e portabilidade</h3><p>O backup JSON inclui CRM, atividades, rotina e configurações. Os arquivos locais da biblioteca não entram no backup.</p><div class="grid"><button class="secondary-btn" id="downloadBackupBtn">Baixar backup JSON</button><button class="secondary-btn" id="restoreBackupBtn">Restaurar backup JSON</button><input id="restoreBackupInput" type="file" accept=".json" hidden><button class="secondary-btn" id="exportCsvBtn">Exportar leads em CSV</button></div></article>
        <article class="setting-block"><h3>Importação de planilha</h3><p>Importe XLSX ou CSV. A identificação de cabeçalhos e a mesclagem por Instagram/URL são automáticas.</p><button class="primary-btn" id="settingsImportBtn">Importar planilha</button></article>
        <article class="setting-block danger-zone" style="grid-column:1/-1"><h3>Zona de segurança</h3><p>Use somente quando tiver um backup recente.</p><div class="toolbar-group"><button class="danger-btn" id="resetLeadsBtn">Restaurar os 25 leads iniciais</button><button class="danger-btn" id="resetAllBtn">Apagar toda a operação</button></div></article>
      </section>`;
    document.getElementById('businessForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.defaultValue=Number(d.defaultValue)||147;state.business={...state.business,...d};saveState();toast('Dados atualizados','','success');});
    document.getElementById('goalsForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));state.settings.dailyRevenueGoal=Number(d.dailyRevenueGoal)||0;state.settings.weeklyRevenueGoal=Number(d.weeklyRevenueGoal)||0;saveState();toast('Metas atualizadas','','success');});
    document.getElementById('downloadBackupBtn').addEventListener('click',downloadBackup);
    document.getElementById('restoreBackupBtn').addEventListener('click',()=>document.getElementById('restoreBackupInput').click());
    document.getElementById('restoreBackupInput').addEventListener('change',e=>restoreBackupFile(e.target.files[0]));
    document.getElementById('exportCsvBtn').addEventListener('click',exportCsv);
    document.getElementById('settingsImportBtn').addEventListener('click',openImportModal);
    document.getElementById('resetLeadsBtn').addEventListener('click',()=>confirmAction('Restaurar leads iniciais','Os leads atuais serão substituídos pelos 25 registros originais. Atividades e rotina serão mantidas.',()=>{state.leads=structuredClone(seed.leads);saveState();renderSettings();toast('Leads restaurados','','success');}));
    document.getElementById('resetAllBtn').addEventListener('click',()=>confirmAction('Apagar toda a operação','Esta ação remove CRM, atividades, rotina e configurações deste navegador.',()=>{state=freshState();saveState();renderSettings();toast('Operação restaurada ao estado inicial','','success');}));
  }

  function bindCommonPageActions() {
    mainContent.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>setPage(btn.dataset.go)));
    mainContent.querySelectorAll('[data-edit-lead]').forEach(btn=>btn.addEventListener('click',()=>openLeadModal(btn.dataset.editLead)));
    mainContent.querySelectorAll('[data-copy-hook]').forEach(btn=>btn.addEventListener('click',()=>{const l=state.leads.find(x=>x.id===btn.dataset.copyHook);if(l)copyText(l.hook||defaultFirstContact(l),'Gancho copiado');}));
    mainContent.querySelectorAll('[data-instagram-flow]').forEach(btn=>btn.addEventListener('click',()=>openInstagramFlow(btn.dataset.instagramFlow)));
  }

  function defaultFirstContact(l) {
    return `Olá, ${firstName(l.name)}. Tudo bem?\n\nEncontrei o seu perfil e gostei do trabalho com ${l.services || l.segment}.\n\nPercebi uma oportunidade simples para deixar a apresentação dos serviços mais organizada e facilitar os pedidos de agendamento. Posso te mostrar?`;
  }
  function firstName(name){return String(name||'').split(/[\s/|]+/)[0]||'';}

  function openLeadModal(id = null) {
    activeLeadId=id;
    const lead=id?state.leads.find(l=>l.id===id):null;
    document.getElementById('leadModalTitle').textContent=lead?'Editar lead':'Novo lead';
    document.getElementById('leadForm').innerHTML=leadFormHtml(lead||{});
    showModal(leadModal);
    document.getElementById('leadForm').addEventListener('submit',saveLeadForm);
    const deleteBtn=document.getElementById('deleteLeadBtn');
    if(deleteBtn)deleteBtn.addEventListener('click',()=>confirmAction('Excluir lead',`Deseja excluir “${lead.name||lead.instagram}”?`,()=>{state.leads=state.leads.filter(l=>l.id!==id);state.activities=state.activities.filter(a=>a.leadId!==id);saveState();closeModals();renderCurrentPage();toast('Lead excluído','','success');}));
    const copyBtn=document.getElementById('copyLeadHookBtn');
    if(copyBtn)copyBtn.addEventListener('click',()=>copyText(document.querySelector('[name="hook"]').value||defaultFirstContact(lead),'Gancho copiado'));
  }

  function leadFormHtml(l) {
    const input=(name,label,value='',type='text',cls='')=>`<div class="form-field ${cls}"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}"></div>`;
    const select=(name,label,opts,value,cls='')=>`<div class="form-field ${cls}"><label>${label}</label><select name="${name}">${opts.map(o=>`<option ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
    const textarea=(name,label,value='',cls='span-3')=>`<div class="form-field ${cls}"><label>${label}</label><textarea name="${name}">${esc(value)}</textarea></div>`;
    return `
      ${input('name','Nome / negócio',l.name,'text','span-2')}${input('instagram','Instagram',l.instagram)}
      ${input('url','URL do Instagram',l.url,'url','span-2')}${input('whatsapp','WhatsApp / confirmação',l.whatsapp)}
      ${input('segment','Segmento',l.segment)}${input('services','Serviços',l.services,'text','span-2')}
      ${input('city','Cidade',l.city)}${input('state','UF',l.state)}${input('region','Região',l.region)}
      ${select('priority','Prioridade',priorities,l.priority||'Alta')}${input('score','Pontuação',l.score??'', 'number')}${select('status','Status',statuses,l.status||'Não contatado')}
      <div class="form-field span-2"><label>Etapa Instagram</label><select name="instagramStep">${instagramStepOptions.map(step=>`<option value="${esc(step.id)}" ${instagramStepForLead(l)===step.id?'selected':''}>${esc(step.number)}. ${esc(step.label)}</option>`).join('')}</select></div><div class="form-field"><label>Próximo script indicado</label><div class="read-only-field">${esc(instagramStepInfo(instagramStepForLead(l)).label)}</div></div>
      ${input('lastPost','Última publicação',l.lastPost,'date')}${input('firstContactDate','Data do primeiro contato',l.firstContactDate,'date')}${input('packageValue','Valor do pacote',l.packageValue??state.business.defaultValue,'number')}
      ${input('nextAction','Próxima ação',l.nextAction||'Validar perfil no Instagram','text','span-2')}${input('nextActionDate','Data da próxima ação',l.nextActionDate,'date')}
      ${input('research','Pesquisa / origem',l.research)}${input('closedRevenue','Receita fechada',l.closedRevenue??0,'number')}${input('openAgenda','Agenda aberta',l.openAgenda)}
      ${textarea('evidence','Evidências / motivo',l.evidence)}${textarea('hook','Gancho personalizado',l.hook)}${textarea('notes','Observações',l.notes)}
      <div class="form-actions"><div>${l.id?'<button type="button" class="danger-btn" id="deleteLeadBtn">Excluir lead</button>':''}</div><div class="form-actions-right"><button type="button" class="secondary-btn" id="copyLeadHookBtn">Copiar gancho</button><button type="button" class="secondary-btn" data-close-modal>Cancelar</button><button type="submit" class="primary-btn">Salvar lead</button></div></div>`;
  }

  function saveLeadForm(e) {
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    data.score=data.score===''?null:Number(data.score);
    data.packageValue=Number(data.packageValue)||state.business.defaultValue||147;
    data.closedRevenue=Number(data.closedRevenue)||0;
    const now=new Date().toISOString();
    if(activeLeadId){
      const idx=state.leads.findIndex(l=>l.id===activeLeadId); const old=state.leads[idx];
      state.leads[idx]={...old,...data,updatedAt:now};
      if(data.status!=='Não contatado'&&!state.leads[idx].firstContactDate) state.leads[idx].firstContactDate=today();
      if(data.status==='Fechado'&&!Number(state.leads[idx].closedRevenue)) state.leads[idx].closedRevenue=Number(state.leads[idx].packageValue)||state.business.defaultValue||147;
      if(old.status!==data.status) recordStatusActivity(state.leads[idx],old.status,data.status,false);
    }else{
      const lead={id:uid('lead'),research:'Manual',ownerManaged:'A confirmar',recurring:'Sim',goodPhotos:'A confirmar',weakVisuals:'A confirmar',createdAt:now,updatedAt:now,...data};
      state.leads.push(lead); recordActivity(lead.id,'created','Lead adicionado manualmente');
    }
    saveState(); closeModals(); renderCurrentPage(); toast('Lead salvo','O CRM foi atualizado.','success');
  }

  function updateLeadStatus(id,newStatus) {
    const lead=state.leads.find(l=>l.id===id); if(!lead||lead.status===newStatus)return;
    const old=lead.status; lead.status=newStatus; lead.instagramStep=inferredInstagramStep({status:newStatus}); lead.updatedAt=new Date().toISOString();
    if(newStatus!=='Não contatado'&&!lead.firstContactDate)lead.firstContactDate=today();
    if(newStatus==='Fechado'&&!Number(lead.closedRevenue))lead.closedRevenue=Number(lead.packageValue)||state.business.defaultValue||147;
    recordStatusActivity(lead,old,newStatus,true); saveState(); renderCurrentPage(); toast('Etapa atualizada',`${lead.name||lead.instagram}: ${newStatus}`,'success');
  }

  function recordStatusActivity(lead,oldStatus,newStatus,save=false) {
    let type='status';
    if(newStatus==='Mensagem enviada')type='contact';
    else if(newStatus==='Respondeu')type='response';
    else if(newStatus==='Proposta feita')type='proposal';
    else if(newStatus==='Fechado')type='closed';
    recordActivity(lead.id,type,`${oldStatus||'Início'} → ${newStatus}`,newStatus==='Fechado'?(Number(lead.closedRevenue)||Number(lead.packageValue)||0):0,save);
  }

  function recordActivity(leadId,type,label,value=0,save=false) {
    state.activities.push({id:uid('act'),leadId,type,label,value:Number(value)||0,date:new Date().toISOString()});
    if(save)saveState();
  }

  function showModal(modal) { backdrop.classList.remove('hidden'); modal.classList.remove('hidden'); document.body.style.overflow='hidden'; }
  function closeModals() { [leadModal,importModal,confirmModal,scriptModal,scriptImportModal,instagramFlowModal].forEach(m=>m.classList.add('hidden')); backdrop.classList.add('hidden');document.body.style.overflow='';activeLeadId=null;activeScriptId=null;activeInstagramLeadId=null; }
  function confirmAction(title,text,callback){document.getElementById('confirmModalTitle').textContent=title;document.getElementById('confirmModalText').textContent=text;confirmCallback=callback;showModal(confirmModal);}

  function openImportModal(){document.getElementById('importResult').classList.add('hidden');document.getElementById('importResult').innerHTML='';document.getElementById('spreadsheetInput').value='';showModal(importModal);}

  async function handleImportFile(file) {
    if(!file)return;
    const resultEl=document.getElementById('importResult');resultEl.classList.remove('hidden');resultEl.innerHTML='<strong>Analisando o arquivo…</strong><br>Identificando planilhas, cabeçalhos e duplicidades.';
    try{
      if(file.name.toLowerCase().endsWith('.json')){
        const data=JSON.parse(await file.text());
        const imported=Array.isArray(data)?data:data.leads;
        if(!Array.isArray(imported))throw new Error('O JSON não contém uma lista de leads nem um backup válido.');
        const summary=mergeImportedLeads(imported.map(normalizeImportedObject));
        resultEl.innerHTML=importSummaryHtml(summary,file.name);
      }else{
        const workbook=await window.XLSX_LITE.parseFile(file);
        const extraction=extractLeadRows(workbook.sheets);
        if(!extraction.rows.length)throw new Error('Nenhuma linha de lead foi encontrada. Verifique se a planilha possui cabeçalhos reconhecíveis.');
        const mapped=extraction.rows.map(row=>mapImportedRow(row,extraction.headerMap)).filter(l=>l.instagram||l.url||l.name);
        const summary=mergeImportedLeads(mapped);
        resultEl.innerHTML=importSummaryHtml({...summary,sheet:extraction.sheetName,headerRow:extraction.headerRow+1},file.name);
      }
      saveState(); renderCurrentPage(); toast('Importação concluída','A base foi atualizada automaticamente.','success');
    }catch(error){console.error(error);resultEl.innerHTML=`<strong>Não foi possível importar.</strong><br>${esc(error.message||String(error))}`;toast('Erro na importação',error.message||String(error),'error');}
  }

  const headerAliases = {
    id:['id','codigo'], research:['pesquisa','origem','fonte'], priority:['recomendacao','prioridade'], instagram:['perfilinstagram','instagram','perfil','arroba','usuarioinstagram'],
    name:['nomenegocio','nome','negocio','empresa','cliente','lead'], segment:['segmentoprincipal','segmento','nicho'], services:['servicos','servico','procedimentos'],
    city:['cidade','municipio'], state:['uf','estado'], region:['regiao'], score:['pontuacaoauditada','pontuacao','score','nota'], class:['classe'],
    lastPost:['ultimapublicacao','ultimopost','datadopost'], whatsapp:['whatsapp','telefone','contato'], ownerManaged:['donaequipepequena','administradopeladona','gestaopropria'],
    recurring:['servicosrecorrentes','recorrencia'], openAgenda:['agendaaberta','agenda'], goodPhotos:['boasfotos','fotografias'], weakVisuals:['artesvisualmentefracas','artesfracas'],
    evidence:['evidenciasmotivo','evidencias','motivo','diagnostico'], hook:['ganchopersonalizado','gancho','mensagem','abordagem'], url:['urlinstagram','url','linkinstagram','link'],
    status:['status','etapa','situacao'], instagramStep:['etapainstagram','fluxoinstagram','proximoscript'], firstContactDate:['data1contato','dataprimeirocontato','datacontato'], nextAction:['proximaacao','proximopasso'],
    nextActionDate:['dataproximaacao','dataproximopasso','followupdate'], packageValue:['valordopacote','valor','ticket'], closedRevenue:['receitafechada','receita','valorfechado'], notes:['observacoes','notas']
  };
  const aliasToField=new Map();Object.entries(headerAliases).forEach(([field,aliases])=>aliases.forEach(a=>aliasToField.set(normalizeText(a),field)));

  function extractLeadRows(sheets) {
    let best=null;
    for(const sheet of sheets){
      const maxRows=Math.min(sheet.rows.length,25);
      for(let i=0;i<maxRows;i++){
        const row=sheet.rows[i]||[];const map={};let score=0;
        row.forEach((cell,index)=>{const field=aliasToField.get(normalizeText(cell));if(field&&!Object.values(map).includes(field)){map[index]=field;score++;}});
        const nameBonus=/todos os leads|leads|crm/i.test(sheet.name)?2:0;
        if(score>=3&&(!best||score+nameBonus>best.score)){best={sheet,headerRow:i,headerMap:map,score:score+nameBonus};}
      }
    }
    if(!best) return {rows:[],headerMap:{},headerRow:0,sheetName:''};
    const rows=best.sheet.rows.slice(best.headerRow+1).filter(r=>r&&r.some(v=>String(v??'').trim()!==''));
    return {rows,headerMap:best.headerMap,headerRow:best.headerRow,sheetName:best.sheet.name};
  }

  function mapImportedRow(row,map) {const obj={};Object.entries(map).forEach(([index,field])=>obj[field]=row[Number(index)]);return normalizeImportedObject(obj);}
  function normalizeImportedObject(raw){
    const now=new Date().toISOString();
    const get=(...keys)=>{for(const k of keys)if(raw[k]!==undefined&&raw[k]!==null&&raw[k]!=='')return raw[k];return '';};
    const objectKeys={};Object.entries(raw).forEach(([k,v])=>objectKeys[normalizeText(k)]=v);
    const byAlias=field=>{for(const a of headerAliases[field]||[]){const v=objectKeys[normalizeText(a)];if(v!==undefined&&v!==null&&v!=='')return v;}return raw[field]??'';};
    let instagram=String(byAlias('instagram')||'').trim();if(instagram&&!instagram.startsWith('@')&&!instagram.includes('instagram.com'))instagram='@'+instagram.replace(/^@/,'');
    let url=String(byAlias('url')||'').trim();if(!url&&instagram)url=`https://www.instagram.com/${instagram.replace('@','')}/`;
    const status=normalizeStatus(byAlias('status'));
    const packageValue=parseMoney(byAlias('packageValue'))||state.business.defaultValue||147;
    const closedRevenue=parseMoney(byAlias('closedRevenue'))||0;
    return {
      id:String(get('id','ID')||uid('lead')),research:String(byAlias('research')||'Importação'),priority:normalizePriority(byAlias('priority')),instagram,name:String(byAlias('name')||''),segment:String(byAlias('segment')||''),services:String(byAlias('services')||''),city:String(byAlias('city')||''),state:String(byAlias('state')||''),region:String(byAlias('region')||''),score:parseNullableNumber(byAlias('score')),class:String(byAlias('class')||''),lastPost:normalizeDate(byAlias('lastPost')),whatsapp:String(byAlias('whatsapp')||'A confirmar'),ownerManaged:String(byAlias('ownerManaged')||'A confirmar'),recurring:String(byAlias('recurring')||'A confirmar'),openAgenda:String(byAlias('openAgenda')||'A confirmar'),goodPhotos:String(byAlias('goodPhotos')||'A confirmar'),weakVisuals:String(byAlias('weakVisuals')||'A confirmar'),evidence:String(byAlias('evidence')||''),hook:String(byAlias('hook')||''),url,status,instagramStep:String(byAlias('instagramStep')||inferredInstagramStep({status})),firstContactDate:normalizeDate(byAlias('firstContactDate')),nextAction:String(byAlias('nextAction')||'Validar perfil no Instagram'),nextActionDate:normalizeDate(byAlias('nextActionDate')),packageValue,closedRevenue,notes:String(byAlias('notes')||''),createdAt:raw.createdAt||now,updatedAt:now
    };
  }

  function normalizeStatus(value){const n=normalizeText(value);const found=statuses.find(s=>normalizeText(s)===n);if(found)return found;const map={novo:'Não contatado',naocontatado:'Não contatado',contatado:'Mensagem enviada',mensagemenviada:'Mensagem enviada',respondeu:'Respondeu',portfolioenviado:'Portfólio enviado',qualificado:'Qualificado',proposta:'Proposta feita',propostafeita:'Proposta feita',aguardandopagamento:'Aguardando pagamento',fechado:'Fechado',ganho:'Fechado',perdido:'Perdido',retomar:'Retomar'};return map[n]||'Não contatado';}
  function normalizePriority(value){const n=normalizeText(value);const found=priorities.find(p=>normalizeText(p)===n);if(found)return found;if(['muitoalta','a','1'].includes(n))return'Muito alta';if(['alta','b','2'].includes(n))return'Alta';if(['naopriorizar','baixa'].includes(n))return'Não priorizar';return'Segunda lista';}
  function parseNullableNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null;}
  function parseMoney(v){if(typeof v==='number')return v;let s=String(v||'').trim().replace(/R\$/gi,'').replace(/\s/g,'');if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(','))s=s.replace(',','.');const n=Number(s.replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function normalizeDate(v){if(!v)return'';if(v instanceof Date&&!Number.isNaN(v))return localDateKey(v);if(typeof v==='number'&&v>20000&&v<90000){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toISOString().slice(0,10);}const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const br=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);if(br){let y=br[3].length===2?`20${br[3]}`:br[3];return`${y}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`;}const d=new Date(s);return Number.isNaN(d)?'':localDateKey(d);}

  function leadKey(l){const ig=normalizeText(String(l.instagram||'').replace('instagramcom',''));if(ig)return`ig:${ig}`;const url=normalizeText(l.url);if(url)return`url:${url}`;return`name:${normalizeText(l.name)}:${normalizeText(l.city)}`;}
  function mergeImportedLeads(imported){let added=0,updated=0,skipped=0;const index=new Map(state.leads.map((l,i)=>[leadKey(l),i]));for(const incoming of imported){const key=leadKey(incoming);if(key==='name::'){skipped++;continue;}if(index.has(key)){const i=index.get(key),existing=state.leads[i];const merged={...existing};Object.entries(incoming).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)merged[k]=v;});merged.id=existing.id;merged.createdAt=existing.createdAt;merged.updatedAt=new Date().toISOString();state.leads[i]=merged;updated++;}else{incoming.id=uid('lead');state.leads.push(incoming);index.set(key,state.leads.length-1);added++;}}return{added,updated,skipped,total:imported.length};}
  function importSummaryHtml(s,file){return`<strong>Importação concluída</strong><br>Arquivo: ${esc(file)}${s.sheet?`<br>Planilha: ${esc(s.sheet)} · cabeçalho na linha ${s.headerRow}`:''}<br><br><strong>${s.added}</strong> novos leads · <strong>${s.updated}</strong> atualizados · <strong>${s.skipped}</strong> ignorados.`;}

  function exportCsv(){
    const fields=[['Nome','name'],['Instagram','instagram'],['URL','url'],['Segmento','segment'],['Serviços','services'],['Cidade','city'],['UF','state'],['Prioridade','priority'],['Score','score'],['Status','status'],['Etapa Instagram','instagramStep'],['Data 1º contato','firstContactDate'],['Próxima ação','nextAction'],['Data próxima ação','nextActionDate'],['Valor','packageValue'],['Receita fechada','closedRevenue'],['Gancho','hook'],['Observações','notes']];
    const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
    const csv='\ufeff'+[fields.map(f=>quote(f[0])).join(';'),...state.leads.map(l=>fields.map(f=>quote(l[f[1]])).join(';'))].join('\r\n');
    downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`CRM_Victor_Takayama_${today()}.csv`);toast('CSV exportado','','success');
  }
  function downloadBackup(){const backup={app:'Victor Ops',version:1,exportedAt:new Date().toISOString(),...state};downloadBlob(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),`Backup_Victor_Ops_${today()}.json`);toast('Backup baixado','','success');}
  async function restoreBackupFile(file){if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.leads))throw new Error('Backup sem lista de leads.');confirmAction('Restaurar backup',`O arquivo contém ${data.leads.length} leads. Os dados atuais serão substituídos.`,()=>{state={...freshState(),...data,business:{...seed.business,...(data.business||{})},settings:{...freshState().settings,...(data.settings||{})},scripts:Array.isArray(data.scripts)?data.scripts.map(normalizeScript):seedScripts()};saveState();renderSettings();toast('Backup restaurado','','success');});}catch(e){toast('Backup inválido',e.message,'error');}}

  const fileDB={
    db:null,
    async open(){if(this.db)return this.db;this.db=await new Promise((resolve,reject)=>{const req=indexedDB.open('VictorOpsFiles',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return this.db;},
    async put(file){const db=await this.open();const item={id:uid('file'),name:file.name,type:file.type,size:file.size,createdAt:new Date().toISOString(),blob:file};return new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(item);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});},
    async list(){const db=await this.open();return new Promise((res,rej)=>{const req=db.transaction('files').objectStore('files').getAll();req.onsuccess=()=>res(req.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));req.onerror=()=>rej(req.error);});},
    async get(id){const db=await this.open();return new Promise((res,rej)=>{const req=db.transaction('files').objectStore('files').get(id);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);});},
    async delete(id){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
  };

  function initializeEvents() {
    document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>setPage(btn.dataset.page)));
    document.getElementById('menuBtn').addEventListener('click',()=>sidebar.classList.toggle('open'));
    document.getElementById('globalAddBtn').addEventListener('click',()=>openLeadModal());
    document.getElementById('globalImportBtn').addEventListener('click',openImportModal);
    document.getElementById('quickBackupBtn').addEventListener('click',downloadBackup);
    document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeModals));
    backdrop.addEventListener('click',closeModals);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals();});
    document.getElementById('confirmActionBtn').addEventListener('click',async()=>{const cb=confirmCallback;confirmCallback=null;closeModals();if(cb)await cb();});
    document.getElementById('selectSpreadsheetBtn').addEventListener('click',()=>document.getElementById('spreadsheetInput').click());
    document.getElementById('spreadsheetInput').addEventListener('change',e=>handleImportFile(e.target.files[0]));
    document.getElementById('scriptForm').addEventListener('submit',saveScriptForm);
    document.getElementById('selectScriptFileBtn').addEventListener('click',()=>document.getElementById('scriptFileInput').click());
    document.getElementById('scriptFileInput').addEventListener('change',e=>handleScriptImportFile(e.target.files[0]));
    document.getElementById('downloadScriptTemplateBtn').addEventListener('click',downloadScriptTemplate);
    const scriptZone=document.getElementById('scriptImportZone');
    scriptZone.addEventListener('click',e=>{if(e.target===scriptZone||e.target.closest('.upload-icon')||e.target.tagName==='STRONG'||e.target.tagName==='SPAN')document.getElementById('scriptFileInput').click();});
    scriptZone.addEventListener('dragover',e=>{e.preventDefault();scriptZone.classList.add('drag');});
    scriptZone.addEventListener('dragleave',()=>scriptZone.classList.remove('drag'));
    scriptZone.addEventListener('drop',e=>{e.preventDefault();scriptZone.classList.remove('drag');handleScriptImportFile(e.dataTransfer.files[0]);});
    const zone=document.getElementById('importZone');
    zone.addEventListener('click',e=>{if(e.target===zone||e.target.closest('.upload-icon')||e.target.tagName==='STRONG'||e.target.tagName==='SPAN')document.getElementById('spreadsheetInput').click();});
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');handleImportFile(e.dataTransfer.files[0]);});
    addEventListener('hashchange',()=>setPage(location.hash.replace('#/','')||'dashboard',false));
  }

  function init() {
    document.getElementById('todayChip').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).format(new Date()).replace('.','');
    updateNavCount();initializeEvents();setPage(currentPage,false);
    if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }

  init();
})();
