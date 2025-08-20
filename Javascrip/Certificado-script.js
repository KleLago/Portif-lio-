document.getElementById('y').textContent = new Date().getFullYear();

// Menu mobile
function toggleMenu(){
  const open = document.documentElement.classList.toggle('nav-open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e)=>{
  const menu = document.getElementById('menu');
  const btn = document.querySelector('.menu-toggle');
  if (document.documentElement.classList.contains('nav-open') && !menu.contains(e.target) && !btn.contains(e.target)){
    toggleMenu();
  }
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && document.documentElement.classList.contains('nav-open')) toggleMenu();
});

// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightboxImg');
const lbTitle = document.getElementById('lightboxTitle');

function openLightbox(src, title){
  lbImg.src = src;
  lbImg.alt = title || 'Certificado ampliado';
  lbTitle.textContent = title || 'Certificado';
  lb.classList.add('open');
}
function closeLightbox(){ lb.classList.remove('open'); lbImg.src=''; }
lb.addEventListener('click', (e)=>{ if(e.target === lb) closeLightbox(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && lb.classList.contains('open')) closeLightbox(); });

// Clique no thumb (mantido)
document.querySelectorAll('.thumb').forEach(el=>{
  el.addEventListener('click', ()=>{
    openLightbox(el.dataset.lightbox, el.dataset.title);
  });
  el.style.cursor = 'zoom-in';
});

// NOVO: abrir lightbox ao clicar em "Ver certificado"
const grid = document.getElementById('grid');
grid.addEventListener('click', (e)=>{
  const btn = e.target.closest('.view-btn');
  if(!btn) return;

  // encontra o thumb do card correspondente
  const card = btn.closest('.card');
  const thumb = card.querySelector('.thumb');
  const src = thumb?.dataset.lightbox;
  const title = thumb?.dataset.title || card?.dataset.title || 'Certificado';

  if(src){
    openLightbox(src, title);
  }
});

// Busca + filtro
const q = document.getElementById('q');
const cat = document.getElementById('cat');
const clearBtn = document.getElementById('clearFilters');

function applyFilters(){
  const term = (q.value || '').trim().toLowerCase();
  const category = cat.value;
  const cards = grid.querySelectorAll('.card');

  cards.forEach(card=>{
    const title = (card.dataset.title || '').toLowerCase();
    const inst = (card.dataset.inst || '').toLowerCase();
    const year = (card.dataset.year || '').toLowerCase();
    const c = (card.dataset.category || '').toLowerCase();

    const matchesText = !term || title.includes(term) || inst.includes(term) || year.includes(term);
    const matchesCat = !category || c === category;

    card.style.display = (matchesText && matchesCat) ? '' : 'none';
  });
}
q.addEventListener('input', applyFilters);
cat.addEventListener('change', applyFilters);
clearBtn.addEventListener('click', ()=>{
  q.value=''; cat.value=''; applyFilters(); q.focus();
});