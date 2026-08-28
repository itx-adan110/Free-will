const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

document.addEventListener("DOMContentLoaded", () => {
  const header = $("#site-header");
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, {passive:true});

  // Reveal-on-scroll: lightweight IntersectionObserver, no animation library required.
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -30px 0px"});
  $$(".reveal").forEach(el => observer.observe(el));

  // Mobile navigation
  const mobileNav = $("#mobile-nav");
  const menuBtns = $$(".menu-btn");
  const toggleMenu = (open) => {
    mobileNav?.classList.toggle("open", open);
    mobileNav?.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("no-scroll", open);
    menuBtns.forEach(btn => btn.setAttribute("aria-expanded", String(open)));
  };
  menuBtns.forEach(btn => btn.addEventListener("click", () => toggleMenu(!mobileNav?.classList.contains("open"))));
  $$("#mobile-nav a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));

  // Universal search
  const overlay = $("#search-overlay");
  const globalInput = $("#global-search");
  const results = $("#search-results");
  const searchable = [
    {name:"Luminai AI", type:"AI workspace", href:"#ai"},
    {name:"Education / Past Papers", type:"Learning resources", href:"#education"},
    {name:"Movies", type:"Entertainment", href:"#movies"},
    {name:"Music", type:"Listening", href:"#music"},
    {name:"Professional Portfolio", type:"Profile & resume", href:"#portfolio"},
    {name:"Universal Platform", type:"Luminai home", href:"#home"}
  ];
  const openSearch = () => {
    overlay?.classList.add("open");
    overlay?.setAttribute("aria-hidden","false");
    document.body.classList.add("no-scroll");
    setTimeout(() => globalInput?.focus(), 80);
  };
  const closeSearch = () => {
    overlay?.classList.remove("open");
    overlay?.setAttribute("aria-hidden","true");
    document.body.classList.remove("no-scroll");
  };
  $$(".search-trigger").forEach(btn => btn.addEventListener("click", openSearch));
  $(".close-search")?.addEventListener("click", closeSearch);
  overlay?.addEventListener("click", e => { if (e.target === overlay) closeSearch(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeSearch();
      toggleMenu(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); openSearch();
    }
  });
  const renderResults = (query="") => {
    const q = query.trim().toLowerCase();
    const matches = searchable.filter(item => !q || `${item.name} ${item.type}`.toLowerCase().includes(q));
    results.innerHTML = matches.length ? matches.map(item =>
      `<a class="search-result" href="${item.href}"><span><strong>${item.name}</strong><small>${item.type}</small></span><b>↗</b></a>`
    ).join("") : `<div class="empty-state">No Luminai destination matches “${escapeHtml(query)}”.</div>`;
  };
  renderResults();
  globalInput?.addEventListener("input", e => renderResults(e.target.value));
  results?.addEventListener("click", () => closeSearch());

  // Education filters
  const filterInputs = $$("[data-filter]");
  const resourceCards = $$(".resource-card");
  const empty = $("#resource-empty");
  const applyFilters = () => {
    const values = Object.fromEntries(filterInputs.map(el => [el.dataset.filter, el.value]));
    let shown = 0;
    resourceCards.forEach(card => {
      const matches = Object.entries(values).every(([key, value]) => !value || card.dataset[key] === value);
      card.hidden = !matches;
      if (matches) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
  };
  filterInputs.forEach(el => el.addEventListener("change", applyFilters));
  $("#resource-search")?.addEventListener("click", applyFilters);

  // AI chat: intentionally local fallback only. Replace sendToAI() with a secure backend call.
  const form = $("#chat-form");
  const input = $("#chat-input");
  const messages = $("#chat-messages");
  const emptyChat = $("#chat-empty");
  const newChat = $("#new-chat");
  let busy = false;

  const addBubble = (text, who) => {
    emptyChat?.remove();
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${who}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  const sendToAI = async (message) => {
    // Production integration point:
    // return fetch("/api/chat", {
    //   method:"POST",
    //   headers:{"Content-Type":"application/json"},
    //   body:JSON.stringify({message})
    // }).then(r => r.json()).then(data => data.reply);
    await new Promise(r => setTimeout(r, 500));
    return "Your Luminai AI interface is ready. Connect this composer to your own secure AI endpoint in sendToAI()—never expose provider secrets in frontend code.";
  };

  form?.addEventListener("submit", async e => {
    e.preventDefault();
    if (busy) return;
    const message = input.value.trim();
    if (!message) return;
    busy = true;
    input.value = "";
    input.style.height = "auto";
    addBubble(message, "user");
    const loading = addBubble("Thinking…", "ai");
    try {
      loading.textContent = await sendToAI(message);
    } catch {
      loading.textContent = "The AI service is unavailable. Please try again.";
    } finally {
      busy = false;
      messages.scrollTop = messages.scrollHeight;
    }
  });
  input?.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });
  newChat?.addEventListener("click", () => {
    messages.innerHTML = "";
    const emptyState = document.createElement("div");
    emptyState.className = "chat-empty";
    emptyState.id = "chat-empty";
    emptyState.innerHTML = `<span class="empty-symbol">✦</span><strong>What can I help you build?</strong><p>Ask a question or connect your AI provider in <code>script.js</code>.</p>`;
    messages.appendChild(emptyState);
    input?.focus();
  });

  // Buttons which are intentionally integration/configuration points.
  const toast = $("#toast");
  let toastTimer;
  const showToast = text => {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };
  $$("[data-toast]").forEach(btn => btn.addEventListener("click", () => showToast(btn.dataset.toast)));

  // Media tab interaction — filters visual cards without inventing content.
  $$(".media-tabs button").forEach((btn, index, all) => {
    btn.addEventListener("click", () => {
      all.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showToast(index === 0 ? "Showing featured catalog." : `${btn.textContent} catalog view is ready for your data source.`);
    });
  });
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
