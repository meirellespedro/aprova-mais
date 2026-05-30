/* =============================================================================
   Aprova+ — script.js (revisado)
   Cada mudança está marcada com  // FIX N  e referencia a Parte 2 da mentoria.
   O que NÃO foi mexido: a estrutura geral em escopo de módulo (Problema 4 do JS)
   foi mantida de propósito — modularizar é refinamento, não correção, e para uma
   landing de uma página não se paga. Quando o arquivo crescer, aí sim.
   ============================================================================= */

// Progressive enhancement: marca que o JS está ativo (o CSS usa `.js [data-reveal]`).
document.documentElement.classList.add("js");

const body = document.body;
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mainContent = document.querySelector("#main-content"); // FIX 1: alvo do `inert`
const revealElements = [...document.querySelectorAll("[data-reveal]")];
const pageLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

// FIX 7 (JS): respeitar reduced-motion também no comportamento, não só no CSS.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* -----------------------------------------------------------------------------
   MENU MOBILE
   FIX 1 (JS, gravidade ALTA): focus management.
   - move o foco para dentro do menu ao abrir
   - restaura o foco para o botão ao fechar
   - usa `inert` no <main> para impedir que o foco vaze para a página atrás
   - mantém um focus trap manual como fallback caso `inert` não exista
   --------------------------------------------------------------------------- */

const supportsInert = "inert" in HTMLElement.prototype;

const setMenuState = (isOpen) => {
  if (!menuToggle || !nav) return;

  body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));

  // FIX 1: torna o resto da página inerte (não-focável e invisível ao leitor de tela).
  if (supportsInert && mainContent) {
    mainContent.toggleAttribute("inert", isOpen);
  }

  // FIX 1: foco entra no menu ao abrir, volta para o botão ao fechar.
  if (isOpen) {
    nav.querySelector("a, button")?.focus();
  } else {
    menuToggle.focus();
  }
};

// FIX 1 (fallback): focus trap manual — só atua se `inert` não estiver disponível.
const trapFocus = (event) => {
  if (supportsInert) return; // com inert, o trap é desnecessário
  if (event.key !== "Tab" || !body.classList.contains("menu-open")) return;
  if (!nav) return;

  const focusables = nav.querySelectorAll("a, button");
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
    trapFocus(event); // FIX 1
  });

  pageLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });
}

/* -----------------------------------------------------------------------------
   HEADER AO ROLAR
   FIX 2 (JS, performance): em vez de um listener de scroll que dispara dezenas de
   vezes por segundo, usamos um IntersectionObserver sobre uma sentinela no topo.
   Zero trabalho durante a rolagem contínua — só somos avisados quando o estado muda.
   Mantém um fallback com rAF-throttle para navegadores sem IntersectionObserver.
   --------------------------------------------------------------------------- */

if (header) {
  if ("IntersectionObserver" in window) {
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;top:0;left:0;height:12px;width:1px;pointer-events:none;";
    body.prepend(sentinel);

    new IntersectionObserver(
      ([entry]) => header.classList.toggle("is-scrolled", !entry.isIntersecting),
      { threshold: 0 }
    ).observe(sentinel);
  } else {
    // Fallback: rAF throttle (no máximo 1 cálculo por frame).
    let ticking = false;
    const syncHeader = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
        ticking = false;
      });
    };
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
  }
}

/* -----------------------------------------------------------------------------
   REVEAL ao entrar na viewport
   FIX 4 (JS/HTML): o JS fornece o DADO (atraso) via custom property `--reveal-delay`,
   e o CSS decide COMO usar. Antes, escrevíamos style inline direto (alta especificidade,
   mistura comportamento com apresentação).
   --------------------------------------------------------------------------- */

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  revealElements.forEach((element, index) => {
    // FIX 4: passa dado, não comando de estilo.
    element.style.setProperty(
      "--reveal-delay",
      `${Math.min(index * 60, 240)}ms`
    );
    revealObserver.observe(element);
  });
} else {
  // Sem IntersectionObserver OU usuário pediu menos movimento: mostra tudo direto.
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

/* -----------------------------------------------------------------------------
   SCROLLSPY — realça o link da seção visível
   FIX 5 (JS/a11y): trocado aria-current="page" por "true".
   Numa landing de página única não há "página atual" trocando — o que muda é a
   SEÇÃO visível. "true" comunica "item atual" sem mentir "página atual".
   --------------------------------------------------------------------------- */

const sectionsById = new Map();

pageLinks.forEach((link) => {
  const targetId = link.getAttribute("href");
  if (!targetId || sectionsById.has(targetId)) return;
  const section = document.querySelector(targetId);
  if (section) sectionsById.set(targetId, section);
});

const updateActiveLink = (activeId) => {
  pageLinks.forEach((link) => {
    const isActive = activeId && link.getAttribute("href") === activeId;
    if (isActive) {
      link.setAttribute("aria-current", "true"); // FIX 5 (era "page")
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const initialTarget = sectionsById.has(window.location.hash)
  ? window.location.hash
  : "";

if (pageLinks.length) {
  updateActiveLink(initialTarget);
}

if ("IntersectionObserver" in window && sectionsById.size) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;
      updateActiveLink(`#${visible[0].target.id}`);
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: "-20% 0px -50% 0px" }
  );

  sectionsById.forEach((section) => activeObserver.observe(section));
}