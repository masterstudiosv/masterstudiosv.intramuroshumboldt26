const Carousel = {
  cur: 0, timer: null,

  render(){
    const slides = DB.getCarousel();
    const track  = document.getElementById('c-track');
    const dotsEl = document.getElementById('c-dots');
    if (!track) return;

    if (!slides.length) {
      track.innerHTML = `<div class="c-slide"><div class="c-placeholder">
        <div class="c-ph-logo"><img src="${ROOT}logo/logo.png" alt="Logo" onerror="this.style.display='none'"/></div>
        <div class="c-ph-text">INTRAMUROS HUMBOLDT 2026</div>
        <div class="c-ph-sub">Complejo Educativo Alejandro de Humboldt</div>
      </div></div>`;
      if (dotsEl) dotsEl.innerHTML = '';
      return;
    }

    track.innerHTML = slides.map(s => {
      const hasBg = s.imgUrl && s.imgUrl.startsWith('http');
      const bgHTML = hasBg
        ? `<img src="${s.imgUrl}" class="c-bg" alt="" onerror="this.style.display='none'"/><div class="c-overlay"></div>`
        : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${s.color||'#E8192C'}40,${s.color||'#E8192C'}10,var(--b4))"></div>`;
      return `<div class="c-slide" style="position:relative">
        ${bgHTML}
        <div class="c-content">
          ${s.tag ? `<div class="c-tag">${s.tag}</div>` : ''}
          <div class="c-title">${s.titulo||''}</div>
          ${s.descripcion ? `<div class="c-desc">${s.descripcion}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    if (dotsEl) dotsEl.innerHTML = slides.map((_,i) =>
      `<div class="dot${i===this.cur?' active':''}" onclick="Carousel.goTo(${i})"></div>`
    ).join('');

    this.goTo(this.cur < slides.length ? this.cur : 0);
    this.autoplay();
  },

  goTo(idx){
    const n = DB.getCarousel().length; if (!n) return;
    this.cur = ((idx % n) + n) % n;
    const t = document.getElementById('c-track');
    if (t) t.style.transform = `translateX(-${this.cur * 100}%)`;
    document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i===this.cur));
  },
  next(){ this.goTo(this.cur + 1); this.autoplay(); },
  prev(){ this.goTo(this.cur - 1); this.autoplay(); },
  autoplay(){ clearInterval(this.timer); this.timer = setInterval(() => this.next(), 5500); },
};
