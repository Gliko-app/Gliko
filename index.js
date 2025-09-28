// Funkcija za prebacivanje između tabova
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));

  const key = btn.dataset.tab;
  ['trend', 'food', 'therapy'].forEach(k => {
    const el = document.getElementById('tab-' + k);
    if (!el) return;
    el.hidden = (k !== key);
    el.classList.toggle('active', k === key);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
