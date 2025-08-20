document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});

// === WhatsApp simples (botão do hero) ===
function openWhatsApp(opts) {
  const phone = (opts && opts.phone) || '5511973367068';
  const text  = (opts && opts.text)  || 'Olá, Kleber! Vim pelo site e gostaria de falar sobre consultoria/marketing. Podemos conversar?';
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

/* =================================================================
   MENU MÓVEL OFF-CANVAS (robusto: funciona cedo ou tarde no DOM)
   ================================================================= */
(() => {
  let initialized = false;

  function bindMenu() {
    if (initialized) return true;

    const header  = document.getElementById('siteHeader');
    const nav     = document.getElementById('site-nav');
    const btn     = document.querySelector('.menu-toggle');
    if (!btn || !nav) return false; // ainda não existem no DOM

    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }

    const openMenu = () => {
      document.body.classList.add('menu-open');
      header && header.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
    };
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      header && header.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
    };
    const isOpen = () => document.body.classList.contains('menu-open');

    if (!btn.dataset.bound) {
      btn.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
      btn.dataset.bound = '1';
    }
    if (!backdrop.dataset.bound) {
      backdrop.addEventListener('click', closeMenu);
      backdrop.dataset.bound = '1';
    }
    if (!nav.dataset.bound) {
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) closeMenu();
      });
      nav.dataset.bound = '1';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeMenu();
    }, { passive:true });

    const mq = matchMedia('(min-width: 769px)');
    const onMQ = (ev) => { if (ev.matches) closeMenu(); };
    if (mq.addEventListener) mq.addEventListener('change', onMQ);
    else mq.addListener(onMQ);

    initialized = true;
    return true;
  }

  if (!bindMenu()) {
    document.addEventListener('DOMContentLoaded', bindMenu, { once: true });
    let tries = 0;
    const id = setInterval(() => {
      if (bindMenu() || ++tries > 30) clearInterval(id);
    }, 100);
  }
})();

/* =================================================================
   <details> COM ANIMAÇÃO SUAVE
   ================================================================= */
(() => {
  const DURATION = 260;
  const EASING   = 'ease';
  const reduce   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureBody(details){
    let body = details.querySelector('.details-body');
    if (!body){
      body = document.createElement('div');
      body.className = 'details-body';
      const nodes = [];
      for (const n of Array.from(details.childNodes)){
        if (!(n.nodeType === 1 && n.tagName.toLowerCase() === 'summary')) nodes.push(n);
      }
      nodes.forEach(n => body.appendChild(n));
      details.appendChild(body);
    }
    return body;
  }

  function stopTransition(el){
    void getComputedStyle(el).height; // força recálculo
    el.style.transition = 'none';
    requestAnimationFrame(() => { el.style.transition = ''; });
  }

  function animateOpen(details, body){
    details.dataset.animating = '1';
    body.style.height = 'auto';
    const end = body.getBoundingClientRect().height;
    body.style.height = '0px';

    requestAnimationFrame(() => {
      body.style.transition = `height ${DURATION}ms ${EASING}`;
      body.style.height = end + 'px';
    });

    const onEnd = () => {
      body.style.height = 'auto';
      body.style.transition = '';
      details.removeAttribute('data-animating');
      details.closest('.card')?.classList.add('case-open');
    };
    body.addEventListener('transitionend', onEnd, { once:true });
    setTimeout(onEnd, DURATION + 120);
  }

  function animateClose(details, body){
    details.dataset.animating = '1';
    const start = body.getBoundingClientRect().height;
    body.style.height = start + 'px';

    requestAnimationFrame(() => {
      body.style.transition = `height ${DURATION}ms ${EASING}`;
      body.style.height = '0px';
    });

    const onEnd = () => {
      body.style.transition = '';
      details.removeAttribute('open');
      body.style.height = '';
      details.removeAttribute('data-animating');
      details.closest('.card')?.classList.remove('case-open');
    };
    body.addEventListener('transitionend', onEnd, { once:true });
    setTimeout(onEnd, DURATION + 120);
  }

  function setup(details){
    const summary = details.querySelector('summary');
    if (!summary) return;
    const body = ensureBody(details);

    if (details.hasAttribute('open')) body.style.height = 'auto';
    else body.style.height = '0px';

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (details.dataset.animating) return;

      if (reduce){
        if (details.hasAttribute('open')) { details.removeAttribute('open'); body.style.height = '0px'; }
        else { details.setAttribute('open',''); body.style.height = 'auto'; }
        return;
      }

      stopTransition(body);
      if (!details.hasAttribute('open')) { details.setAttribute('open',''); animateOpen(details, body); }
      else { animateClose(details, body); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('details.case-details').forEach(setup);
  });
})();

/* =================================================================
   WHATSAPP CTA (ripple + fallback app/web)
   ================================================================= */
(() => {
  const $cta = document.getElementById('waCta');
  const $wrap = $cta?.closest('.wa-cta');
  const $tip  = $wrap?.querySelector('.wa-tip');
  if (!$cta || !$wrap) return;

  const obs = new IntersectionObserver(([entry])=>{
    if (entry.isIntersecting){ $wrap.classList.add('in-view'); obs.disconnect(); }
  }, {threshold:.35});
  obs.observe($wrap);

  function ripple(e){
    const rect = $cta.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches?.[0]?.clientX) ?? rect.width/2) - rect.left;
    const y = (e.clientY ?? (e.touches?.[0]?.clientY) ?? rect.height/2) - rect.top;
    const r = document.createElement('span');
    r.className = 'wa-ripple';
    r.style.left = x+'px'; r.style.top = y+'px';
    $cta.appendChild(r);
    r.addEventListener('animationend', ()=> r.remove(), { once:true });
  }

  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  function openWA(){
    const phone = $cta.getAttribute('data-phone') || '5511973367068';
    const text  = ($cta.getAttribute('data-text') || '').trim();
    const msg   = encodeURIComponent(text);
    const app   = `whatsapp://send?phone=${phone}&text=${msg}`;
    const web   = `https://wa.me/${phone}?text=${msg}`;

    if ($tip){ $tip.textContent = 'Abrindo WhatsApp…'; setTimeout(()=> $tip.textContent = '', 2400); }

    if (isMobile){
      const t = setTimeout(()=> window.open(web,'_blank','noopener'), 500);
      window.location.href = app;
      setTimeout(()=> clearTimeout(t), 1200);
    }else{
      window.open(web,'_blank','noopener');
    }
  }

  $cta.addEventListener('pointerdown', ripple);
  $cta.addEventListener('click', (e)=>{ e.preventDefault(); openWA(); });
  $cta.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); openWA(); }});
})();

/* =================================================================
   FOTO AMPLIADA NOS CASES  (com fallback de modal global)
   ================================================================= */
(() => {
  // cria um modal global caso falte o modal local dentro do <details>
  function ensureGlobalPhotoModal(){
    let modal = document.getElementById('global-photo-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'global-photo-modal';
    modal.className = 'photo-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <button class="photo-close" type="button" aria-label="Fechar">×</button>
      <img class="photo-full" src="" alt="Foto ampliada" />
    `;
    document.body.appendChild(modal);
    return modal;
  }

  document.addEventListener('click', (ev) => {
    const openBtn = ev.target.closest('.open-photo');
    if (openBtn){
      const localModal = openBtn.closest('.case-details')?.querySelector('.photo-modal');
      const src = openBtn.getAttribute('data-photo') || openBtn.querySelector('img')?.src || '';
      let modal, img;

      if (localModal){
        modal = localModal;
        img   = modal.querySelector('.photo-full');
      } else {
        modal = ensureGlobalPhotoModal();
        img   = modal.querySelector('.photo-full');
      }

      if (!img) return;
      img.src = src;
      modal.hidden = false;
      modal.setAttribute('aria-hidden','false');
      modal.querySelector('.photo-close')?.focus();
      return;
    }

    const closeBtn = ev.target.closest('.photo-close');
    if (closeBtn){
      const modal = closeBtn.closest('.photo-modal');
      if (modal){ modal.hidden = true; modal.setAttribute('aria-hidden','true'); }
      return;
    }

    const modal = ev.target.closest('.photo-modal');
    if (modal && ev.target === modal){
      modal.hidden = true; modal.setAttribute('aria-hidden','true');
    }
  }, false);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape'){
      document.querySelectorAll('.photo-modal:not([hidden])').forEach((m)=>{
        m.hidden = true; m.setAttribute('aria-hidden','true');
      });
    }
  }, { passive:true });
})();

/* =================================================================
   POPUP DE IMAGEM NOS SERVIÇOS
   ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const grid  = document.querySelector('#services .services-grid');
  let   modal = document.getElementById('svc-photo-modal');

  if (!grid) return;

  // se o HTML do modal não existir, cria dinamicamente
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'svc-photo-modal';
    modal.className = 'svc-photo-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="svc-photo-backdrop" aria-hidden="true"></div>
      <figure class="svc-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="svc-photo-title">
        <button class="svc-photo-close" type="button" aria-label="Fechar">×</button>
        <img id="svc-photo-img" src="" alt="" />
        <figcaption id="svc-photo-title" class="small muted"></figcaption>
      </figure>
    `;
    document.body.appendChild(modal);
  }

  const img      = modal.querySelector('#svc-photo-img');
  const title    = modal.querySelector('#svc-photo-title');
  const close    = modal.querySelector('.svc-photo-close');
  const backdrop = modal.querySelector('.svc-photo-backdrop');

  let lastFocus = null;

  function openFrom(card){
    const src   = card.dataset.img || card.querySelector('img')?.src || 'assets/img/placeholder.jpg';
    const label = (card.querySelector('h3')?.textContent || 'Serviço').trim();

    img.src = src;
    img.alt = `Imagem do serviço: ${label}`;
    title.textContent = label;

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    close.focus();
  }

  function closeModal(){
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    img.src = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  grid.addEventListener('click', (ev) => {
    const card = ev.target.closest('.service');
    if (card) openFrom(card);
  });

  close.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !modal.hidden) closeModal();
  });
});

(function(){
  const SEL = '#cases .cards-grid .card';
  let ro, pending;

  function equalize(){
    const cards = Array.from(document.querySelectorAll(SEL));
    if (!cards.length) return;

    // no mobile 1-coluna: remove alturas para evitar “espaços” gigantes
    if (window.innerWidth <= 680){
      cards.forEach(c => c.style.minHeight = '');
      return;
    }

    // zera para medir corretamente
    cards.forEach(c => c.style.minHeight = '');

    // mede a altura com todos os <details> fechados (estado “padrão”)
    const wasOpen = new WeakMap();
    cards.forEach(card => {
      const d = card.querySelector('details.case-details');
      if (d && d.hasAttribute('open')){ wasOpen.set(d, true); d.removeAttribute('open'); }
    });

    let max = 0;
    cards.forEach(c => { max = Math.max(max, c.offsetHeight); });

    // aplica a mesma altura a todos
    cards.forEach(c => c.style.minHeight = max + 'px');

    // restaura o que estava aberto
    cards.forEach(card => {
      const d = card.querySelector('details.case-details');
      if (d && wasOpen.get(d)) d.setAttribute('open','');
    });
  }

  function debounced(){
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(equalize);
  }

  // roda quando carregar, quando fontes terminarem e quando redimensionar
  window.addEventListener('load', debounced, {passive:true});
  window.addEventListener('resize', debounced, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(debounced);

  // observa mudanças de tamanho do grid (ex.: troca de colunas por CSS)
  const grid = document.querySelector('#cases .cards-grid');
  if (grid && 'ResizeObserver' in window){
    ro = new ResizeObserver(debounced);
    ro.observe(grid);
  }

  // re-equaliza ao fechar um details (quando ele volta ao “fechado”)
  document.addEventListener('click', (e)=>{
    const sm = e.target.closest('summary');
    if (sm){
      // dá um tempinho para a animação terminar e então recalcula
      setTimeout(debounced, 320);
    }
  });
})();
