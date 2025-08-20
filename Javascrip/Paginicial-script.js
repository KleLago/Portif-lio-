// Abre WhatsApp (já existente no seu projeto, mantenha se precisar)
function openWhatsApp() {
  window.open('https://wa.me/5511973367068', '_blank', 'noopener');
}

// ===== Menu móvel off-canvas =====
(function(){
  const header = document.getElementById('siteHeader');
  const nav    = document.getElementById('site-nav');
  const btn    = document.querySelector('.menu-toggle');
  let backdrop = document.querySelector('.nav-backdrop');

  // Cria backdrop se não existir no HTML
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  const openMenu = () => {
    document.body.classList.add('menu-open');     // controla CSS e scroll
    header?.classList.add('menu-open');           // compat c/ versões antigas
    btn?.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    header?.classList.remove('menu-open');
    btn?.setAttribute('aria-expanded', 'false');
  };

  const isOpen = () => document.body.classList.contains('menu-open');

  // Toggle no botão
  btn?.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));

  // Fechar ao clicar no backdrop
  backdrop.addEventListener('click', closeMenu);

  // Fechar ao clicar em qualquer link do menu
  nav?.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches('a')) closeMenu();
  });

  // Fechar no Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  // Ao redimensionar para desktop, garante que o menu não fique preso aberto
  const mqDesktop = window.matchMedia('(min-width: 769px)');
  mqDesktop.addEventListener('change', (ev) => {
    if (ev.matches) closeMenu();
  });
})();

// ===== <details> com animação suave de abrir/fechar =====
(function(){
  const DURATION = 260; // ms
  const EASING = 'ease';

  // Cria um .details-body envolvendo tudo que não é <summary>
  function ensureBody(details){
    let body = details.querySelector('.details-body');
    if (!body){
      body = document.createElement('div');
      body.className = 'details-body';

      const nodes = [];
      for (const n of Array.from(details.childNodes)){
        if (!(n.nodeType === 1 && n.tagName.toLowerCase() === 'summary')){
          nodes.push(n);
        }
      }
      nodes.forEach(n => body.appendChild(n));
      details.appendChild(body);
    }
    return body;
  }

  function animateOpen(details, body){
    details.classList.add('animating');
    // mede altura final
    body.style.height = 'auto';
    const end = body.getBoundingClientRect().height;
    // começa fechado
    body.style.height = '0px';

    requestAnimationFrame(() => {
      body.style.transition = `height ${DURATION}ms ${EASING}`;
      body.style.height = end + 'px';
    });

    const onEnd = () => {
      body.style.height = 'auto';
      body.style.transition = '';
      details.classList.remove('animating');
      body.removeEventListener('transitionend', onEnd);
    };
    body.addEventListener('transitionend', onEnd);
  }

  function animateClose(details, body){
    details.classList.add('animating');
    // mede altura atual
    const start = body.getBoundingClientRect().height;
    body.style.height = start + 'px';

    requestAnimationFrame(() => {
      body.style.transition = `height ${DURATION}ms ${EASING}`;
      body.style.height = '0px';
    });

    const onEnd = () => {
      body.style.transition = '';
      details.classList.remove('animating');
      // só depois da animação fechamos de fato
      details.removeAttribute('open');
      body.style.height = '';
      body.removeEventListener('transitionend', onEnd);
    };
    body.addEventListener('transitionend', onEnd);
  }

  function setup(details){
    const body = ensureBody(details);

    // Se já iniciar aberto, garante altura correta
    if (details.hasAttribute('open')){
      body.style.height = 'auto';
    }else{
      body.style.height = '0px';
    }

    // Intercepta o clique no summary para animar
    const summary = details.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', (e) => {
      e.preventDefault(); // evita o toggle instantâneo nativo

      const isOpen = details.hasAttribute('open');

      if (!isOpen){
        // marca aberto já, para estados CSS ([open]) e acessibilidade
        details.setAttribute('open', '');
        animateOpen(details, body);
      }else{
        animateClose(details, body);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('details.case-details').forEach(setup);
  });
})();

// ===== WhatsApp CTA melhorado =====
(function(){
  const $cta = document.getElementById('waCta');
  const $wrap = $cta?.closest('.wa-cta');
  const $tip  = $wrap?.querySelector('.wa-tip');

  if (!$cta || !$wrap) return;

  // Observa entrada no viewport para animar
  const obs = new IntersectionObserver(([entry])=>{
    if (entry.isIntersecting) {
      $wrap.classList.add('in-view');
      obs.disconnect();
    }
  }, { threshold: .35 });
  obs.observe($wrap);

  // Ripple no ponto do clique
  function ripple(e){
    const rect = $cta.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = document.createElement('span');
    r.className = 'wa-ripple';
    r.style.left = x + 'px';
    r.style.top  = y + 'px';
    $cta.appendChild(r);
    r.addEventListener('animationend', ()=> r.remove());
  }

  // Detecção simples mobile
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  function openWA(){
    const phone = $cta.getAttribute('data-phone') || '';
    const text  = ($cta.getAttribute('data-text') || '').trim();
    const msg   = encodeURIComponent(text);
    const appLink = `whatsapp://send?phone=${phone}&text=${msg}`;
    const webLink = `https://wa.me/${phone}?text=${msg}`;

    // feedback
    if ($tip) {
      $tip.textContent = 'Abrindo WhatsApp…';
      setTimeout(()=> $tip.textContent = '', 2500);
    }

    // Tenta app no mobile; se falhar, cai no web
    if (isMobile) {
      const t = setTimeout(()=> { window.open(webLink, '_blank', 'noopener'); }, 500);
      window.location.href = appLink;
      // se o app abrir, o timeout provavelmente não disparará (sem garantias, mas funciona bem na prática)
      setTimeout(()=> clearTimeout(t), 1200);
    } else {
      window.open(webLink, '_blank', 'noopener');
    }
  }

  // Click / Keyboard
  $cta.addEventListener('click', (e)=>{ ripple(e); openWA(); });
  $cta.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openWA();
    }
  });
})();

(() => {
  // Delegação: funciona para qualquer case no documento
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.open-photo');
    if (btn) {
      const details = btn.closest('.case-details');
      if (!details) return;
      const modal = details.querySelector('.photo-modal');
      const img = modal.querySelector('.photo-full');
      const src = btn.getAttribute('data-photo') || '';
      if (!src) return;
      img.src = src;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      // foco no botão fechar
      modal.querySelector('.photo-close').focus();
    }

    // fechar por botão
    const closeBtn = ev.target.closest('.photo-close');
    if (closeBtn) {
      const modal = closeBtn.closest('.photo-modal');
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }

    // fechar clicando no backdrop
    const modal = ev.target.closest('.photo-modal');
    if (modal && ev.target === modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  // ESC fecha qualquer modal aberto
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document.querySelectorAll('.photo-modal:not([hidden])').forEach(m => {
        m.hidden = true;
        m.setAttribute('aria-hidden', 'true');
      });
    }
  });
})();
// Modal de Serviços – robusto (não depende de role="button")
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('services');
  const modal   = document.getElementById('svc-modal');
  if (!section || !modal) return;

  const grid   = section.querySelector('.services-grid');
  const dialog = modal.querySelector('.svc-dialog');
  const imgEl  = modal.querySelector('#svc-img');
  const titleEl= modal.querySelector('#svc-title');
  const descEl = modal.querySelector('#svc-desc');

  let lastFocus = null;

  function openFromCard(card){
    const title = (card.querySelector('h3')?.textContent || '').trim();
    const img   = card.dataset.img || 'assets/img/services/placeholder.jpg';
    const desc  = card.dataset.desc || (card.querySelector('p')?.textContent || '').trim();

    titleEl.textContent = title || 'Serviço';
    descEl.textContent  = desc;
    imgEl.src = img;
    imgEl.alt = title ? `Imagem de ${title}` : 'Imagem do serviço';

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.svc-close').focus();
  }

  function closeModal(){
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  // Abre ao clicar no card
  grid.addEventListener('click', (ev) => {
    const card = ev.target.closest('.service');
    if (card) openFromCard(card);
  });

  // Abre com Enter/Espaço
  grid.addEventListener('keydown', (ev) => {
    const card = ev.target.closest('.service');
    if (!card) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openFromCard(card);
    }
  });

  // FECHA: botão "×" ou backdrop
  modal.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-close="true"]') || ev.target.matches('.svc-backdrop')) {
      closeModal();
    }
  });

  // ESC fecha
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !modal.hidden) closeModal();
  });
});
/* ===== Adaptive Ratio + Container (proporção e largura sempre coerentes) ===== */
(() => {
  const root = document.documentElement;
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();

  function pickRatioVar(w, h){
    const ar = w / h; // >1 = landscape
    if (ar >= 2.1) return '--ratio-ultrawide';   // 21:9, 32:9
    if (ar >= 1.0)   return (ar <= 1.5) ? '--ratio-laptop' : '--ratio-land';
    // portrait
    const inv = h / w;
    if (inv >= 1.9) return '--ratio-phone-s';
    if (inv >= 1.6) return '--ratio-phone';
    if (inv >= 1.33) return '--ratio-tablet';
    return '--ratio-desktop';
  }

  function setVHUnit(){
    const vh = window.innerHeight * 0.01;
    root.style.setProperty('--vh', `${vh}px`);
  }

  // espelha a sua grade de breakpoints, mas em runtime
  function tuneContainer(){
    const w = window.innerWidth;
    let container = '1200px';
    if (w <= 380) container = '340px';
    else if (w <= 640) container = '600px';
    else if (w <= 768) container = '720px';
    else if (w <= 920) container = '860px';
    else if (w <= 1060) container = '960px';
    else if (w <= 1280) container = '1060px';
    else if (w <= 1400) container = '1200px';
    else container = '1200px';
    root.style.setProperty('--container', container);
  }

  function applyAdaptive(){
    const w = window.innerWidth, h = window.innerHeight;
    const chosen = pickRatioVar(w, h);
    const ratio = css(chosen) || '4/5';
    root.style.setProperty('--ratio', ratio);
    root.style.setProperty('--header-h', h <= 680 ? '60px' : (css('--header-h') || '68px'));
    setVHUnit();
    tuneContainer();
  }

  window.addEventListener('resize', applyAdaptive, { passive: true });
  window.addEventListener('orientationchange', applyAdaptive, { passive: true });
  window.addEventListener('pageshow', applyAdaptive, { once: true });
  applyAdaptive();

  // Helper opcional de debug no console
  window.__ratioDebug = () => {
    const r = css('--ratio');
    console.log('AR viewport =', (innerWidth/innerHeight).toFixed(3), '| --ratio =', r);
  };
})();
