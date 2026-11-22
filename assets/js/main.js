/* ============================================
   Main JS — theme, nav, publication rendering,
   filtering, search, stats, contact form
   ============================================ */
(function () {
  'use strict';

  // ---------- THEME ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  if (stored) root.setAttribute('data-theme', stored);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) root.setAttribute('data-theme', 'light');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ---------- MOBILE NAV ----------
  const menuBtn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }));
  }

  // ---------- REVEAL ON SCROLL ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('revealed'));
  }

  // ---------- PUBLICATION RENDERING ----------
  const isPubPage = !!document.getElementById('pub-list');
  const isHome = !!document.getElementById('latest-pub-list');
  if (typeof PUBLICATIONS === 'undefined') return;

  const allTags = [...new Set(PUBLICATIONS.flatMap(p => p.tags))].sort();
  let activeTag = 'all';
  let searchQuery = '';

  // Calculate aggregate stats
  function computeStats() {
    const citations = PUBLICATIONS.reduce((sum, p) => sum + (p.citations || 0), 0);
    const sorted = [...PUBLICATIONS].sort((a, b) => (b.citations || 0) - (a.citations || 0));
    let hIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      if ((sorted[i].citations || 0) >= i + 1) hIndex = i + 1;
      else break;
    }
    const i10Index = PUBLICATIONS.filter(p => (p.citations || 0) >= 10).length;
    return { citations, hIndex, i10Index, publications: PUBLICATIONS.length };
  }

  function renderStats() {
    const stats = computeStats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-citations', stats.citations);
    set('stat-hindex', stats.hIndex);
    set('stat-i10index', stats.i10Index);
    set('stat-publications', stats.publications);
  }

  function filterPublications() {
    return PUBLICATIONS.filter(pub => {
      const matchesTag = activeTag === 'all' || pub.tags.includes(activeTag);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || pub.title.toLowerCase().includes(q) ||
        pub.abstract.toLowerCase().includes(q) ||
        pub.tags.some(t => t.toLowerCase().includes(q)) ||
        pub.authors.toLowerCase().includes(q) ||
        pub.journal.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });
  }

  function renderPublication(pub) {
    const tagsHtml = pub.tags.map(t =>
      `<button class="tag tag-clickable" data-tag="${t}">${t}</button>`
    ).join('');

    const meritsHtml = (pub.merits || []).map(m =>
      `<span class="merit-badge">${m}</span>`
    ).join('');

    // "Highly Cited" badge if citations >= 10
    const highlyCited = (pub.citations || 0) >= 10
      ? '<span class="merit-badge merit-highly-cited">Highly Cited</span>'
      : '';

    const gaHtml = pub.graphicalAbstract
      ? `<div class="pub-ga"><img src="${pub.graphicalAbstract}" alt="Graphical abstract for ${pub.title.replace(/"/g,'&quot;')}" loading="lazy" width="220" height="165"></div>`
      : '';

    const citationHtml = (typeof pub.citations === 'number')
      ? `<div class="pub-citations">
           <span class="citation-number">${pub.citations}</span>
           <span class="citation-label">citation${pub.citations === 1 ? '' : 's'}</span>
         </div>`
      : '';

    return `
      <article class="pub-card" data-id="${pub.id}">
        <div class="pub-card-layout">
          ${gaHtml}
          <div class="pub-card-body">
            <div class="pub-meta">
              <span class="pub-journal">${pub.journal}</span>
              <span class="pub-year">${pub.year}</span>
              ${pub.featured ? '<span class="pub-badge">Featured</span>' : ''}
              ${pub.citations > 0 ? `<span class="pub-cited-inline">Cited ${pub.citations}</span>` : ''}
            </div>
            <h3 class="pub-title">${pub.title}</h3>
            <p class="pub-authors">${pub.authors}</p>
            <p class="pub-abstract">${pub.abstract}</p>
            <div class="pub-tags">${tagsHtml}</div>
            <div class="pub-actions">
              <a href="${pub.url}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Read paper ↗</a>
              ${pub.doi ? `<span class="pub-doi">DOI: ${pub.doi}</span>` : ''}
            </div>
          </div>
          <aside class="pub-impact">
            ${citationHtml}
            ${meritsHtml ? `<div class="pub-merits">${meritsHtml}</div>` : ''}
            ${highlyCited ? `<div class="pub-merits">${highlyCited}</div>` : ''}
          </aside>
        </div>
      </article>
    `;
  }

  function renderList(container, items, limit) {
    if (!container) return;
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) {
      container.innerHTML = '<p class="empty-state">No publications found. Try a different search or tag.</p>';
      return;
    }
    container.innerHTML = list.map(renderPublication).join('');
    container.querySelectorAll('.tag-clickable').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTag = btn.dataset.tag;
        updateTagButtons();
        if (isPubPage) renderFiltered();
        else window.location.href = `publications.html#tag=${encodeURIComponent(activeTag)}`;
      });
    });
  }

  function updateTagButtons() {
    const fc = document.getElementById('filter-tags');
    if (!fc) return;
    fc.querySelectorAll('.filter-tag').forEach(b =>
      b.classList.toggle('active', b.dataset.tag === activeTag)
    );
  }

  function renderFiltered() {
    const filtered = filterPublications();
    if (isPubPage) {
      renderList(document.getElementById('pub-list'), filtered);
      const c = document.getElementById('pub-count');
      if (c) c.textContent = `Showing ${filtered.length} of ${PUBLICATIONS.length} publications`;
    } else if (isHome) {
      const featured = PUBLICATIONS.filter(p => p.featured);
      renderList(document.getElementById('latest-pub-list'), featured.length ? featured : PUBLICATIONS, 4);
    }
  }

  // Filter tags (publications page only)
  const filterTagsContainer = document.getElementById('filter-tags');
  if (filterTagsContainer) {
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-tag active';
    allBtn.dataset.tag = 'all';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => { activeTag = 'all'; updateTagButtons(); renderFiltered(); });
    filterTagsContainer.appendChild(allBtn);

    allTags.forEach(tag => {
      const b = document.createElement('button');
      b.className = 'filter-tag';
      b.dataset.tag = tag;
      b.textContent = tag;
      b.addEventListener('click', () => { activeTag = tag; updateTagButtons(); renderFiltered(); });
      filterTagsContainer.appendChild(b);
    });
  }

  const searchInput = document.getElementById('pub-search');
  if (searchInput) searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderFiltered(); });

  // Initial render
  if (isPubPage) {
    if (window.location.hash.startsWith('#tag=')) {
      const tag = decodeURIComponent(window.location.hash.slice(5));
      if (allTags.includes(tag)) activeTag = tag;
    }
    renderStats();
    renderFiltered();
    updateTagButtons();
  } else if (isHome) {
    const featured = PUBLICATIONS.filter(p => p.featured);
    renderList(document.getElementById('latest-pub-list'), featured.length ? featured : PUBLICATIONS, 4);
  }

  // ---------- CONTACT FORM ----------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const useMailto = false;
    contactForm.addEventListener('submit', (e) => {
      if (useMailto) {
        e.preventDefault();
        const name = encodeURIComponent(contactForm.name.value);
        const email = encodeURIComponent(contactForm.email.value);
        const subject = encodeURIComponent(contactForm.subject.value);
        const message = encodeURIComponent(contactForm.message.value);
        window.location.href = `mailto:tlgcabral@gmail.com?subject=${subject}%20—%20${name}&body=${message}%0A%0AFrom:%20${email}`;
      }
    });
  }
})();