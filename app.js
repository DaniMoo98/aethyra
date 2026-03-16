
const byId = (id) => document.getElementById(id);

function setYear() {
  const y = byId("year");
  if (y) y.textContent = new Date().getFullYear();
}

function initMobileNav() {
  const openBtn = byId("mobileMenu");
  const closeBtn = byId("sidebarClose");
  openBtn?.addEventListener("click", () => document.body.classList.add("nav-open"));
  closeBtn?.addEventListener("click", () => document.body.classList.remove("nav-open"));
  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    const sidebar = byId("sidebar");
    if (!sidebar) return;
    const insideSidebar = sidebar.contains(event.target);
    const clickedMenu = openBtn?.contains(event.target);
    if (!insideSidebar && !clickedMenu) document.body.classList.remove("nav-open");
  });
}

function initAccordions() {
  document.querySelectorAll(".rule-block-header").forEach((header) => {
    header.addEventListener("click", () => {
      const block = header.closest(".rule-block");
      block?.classList.toggle("open");
    });
  });
}

function initProgress() {
  const bar = byId("progress");
  const article = document.querySelector(".article");
  if (!bar || !article) return;
  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = article.scrollHeight - window.innerHeight;
    const progressed = Math.min(Math.max(window.scrollY - (article.offsetTop - 100), 0), total);
    const pct = total > 0 ? (progressed / total) * 100 : 0;
    bar.style.width = `${pct}%`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
}

function initHeadingsAndToc() {
  const article = document.querySelector(".article");
  const toc = byId("tocNav");
  if (!article || !toc) return;
  const headings = [...article.querySelectorAll("h2.section-heading, h3.sub-heading, .page-title")].filter(
    (heading) => heading.textContent.trim()
  );
  if (headings.length < 2) {
    byId("toc")?.remove();
    return;
  }
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `${slugify(heading.textContent)}-${index}`;
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    if (heading.matches("h3")) link.style.paddingLeft = "14px";
    toc.appendChild(link);
  });
  const tocLinks = [...toc.querySelectorAll("a")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
  headings.forEach((heading) => observer.observe(heading));
}

function initBreadcrumbs() {
  const meta = window.__PAGE_META__ || {};
  const container = byId("breadcrumbs");
  if (!container) return;
  const pieces = [
    '<a href="index.html">Home</a>',
    meta.label ? `<span>${meta.label}</span>` : "",
    meta.title ? `<span>${meta.title}</span>` : "",
  ].filter(Boolean);
  container.innerHTML = pieces.join(" / ");
}

let SEARCH_CACHE = null;

async function loadSearch() {
  if (SEARCH_CACHE) return SEARCH_CACHE;
  const response = await fetch("search-index.json");
  SEARCH_CACHE = await response.json();
  return SEARCH_CACHE;
}

function renderSearchResults(items) {
  const panel = byId("searchResults");
  if (!panel) return;
  if (!items.length) {
    panel.innerHTML = '<div class="search-result"><strong>No matches</strong><span>Try a broader keyword.</span></div>';
    panel.classList.add("is-open");
    return;
  }
  panel.innerHTML = items.slice(0, 8).map((item) => `
    <a class="search-result" href="${item.file}">
      <strong>${item.title}</strong>
      <span>${item.category} · ${item.excerpt}</span>
    </a>
  `).join("");
  panel.classList.add("is-open");
}

function initGlobalSearch() {
  const input = byId("globalSearch");
  const panel = byId("searchResults");
  if (!input || !panel) return;
  input.addEventListener("input", async () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      panel.classList.remove("is-open");
      panel.innerHTML = "";
      return;
    }
    const items = await loadSearch();
    const results = items.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.excerpt} ${item.text}`.toLowerCase();
      return haystack.includes(query);
    });
    renderSearchResults(results);
  });
  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && event.target !== input) panel.classList.remove("is-open");
  });
}

async function initWikiFilters() {
  const grid = byId("wikiGrid");
  const search = byId("wikiSearch");
  const chips = [...document.querySelectorAll(".filter-chip")];
  if (!grid || !search || !chips.length) return;
  let activeFilter = "";
  const cards = [...grid.querySelectorAll(".wiki-card")];
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    cards.forEach((card) => {
      const matchesFilter = !activeFilter || card.dataset.category === activeFilter;
      const matchesSearch = !q || card.dataset.search.includes(q);
      card.style.display = matchesFilter && matchesSearch ? "" : "none";
    });
  };
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const already = chip.classList.contains("active");
      chips.forEach((c) => c.classList.remove("active"));
      activeFilter = already ? "" : chip.dataset.filter;
      if (!already) chip.classList.add("active");
      apply();
    });
  });
  search.addEventListener("input", apply);
  apply();
}

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  initMobileNav();
  initAccordions();
  initProgress();
  initHeadingsAndToc();
  initBreadcrumbs();
  initGlobalSearch();
  initWikiFilters();
});
