/* ─────────────────────────────────────────────────────
   TheRealRider — script.js  (v20260801-v2)
───────────────────────────────────────────────────── */

const header       = document.querySelector("[data-header]");
const nav          = document.querySelector("[data-nav]");
const navToggle    = document.querySelector("[data-nav-toggle]");
const mobilePanel  = document.querySelector("[data-mobile-nav]");
const scrollProgress = document.querySelector("[data-scroll-progress]");
const sectionPillNav = document.querySelector(".section-pill-nav");
const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));
const backTop      = document.querySelector("[data-back-top]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ─── Dynamic copyright year ─── */
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─── Mobile nav helpers ─── */
const setIconLabel = (value) => {
  navToggle?.querySelector(".sr-only")?.replaceChildren(document.createTextNode(value));
};

const closeMenu = () => {
  nav?.classList.remove("is-open");
  mobilePanel?.classList.remove("is-open");
  mobilePanel?.setAttribute("aria-hidden", "true");
  header?.classList.remove("is-open");
  document.body.classList.remove("is-nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  setIconLabel("Open menu");
};

const openMenu = () => {
  nav?.classList.add("is-open");
  mobilePanel?.classList.add("is-open");
  mobilePanel?.setAttribute("aria-hidden", "false");
  header?.classList.add("is-open");
  document.body.classList.add("is-nav-open");
  navToggle?.setAttribute("aria-expanded", "true");
  setIconLabel("Close menu");
};

/* ─── Hamburger toggle ─── */
navToggle?.addEventListener("click", () => {
  const isOpen = mobilePanel?.classList.contains("is-open");
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

/* Close menu when any mobile nav link is clicked */
document.querySelectorAll("[data-mobile-link]").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/* Also close desktop nav links */
nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/* Close on outside click */
document.addEventListener("click", (event) => {
  const panelOpen = mobilePanel?.classList.contains("is-open");
  if (!panelOpen) return;
  if (header?.contains(event.target) || mobilePanel?.contains(event.target)) return;
  closeMenu();
});

/* Close on Escape */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

/* ─── Back to top ─── */
backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

/* ─── Scroll sync (header state + progress bar + pill nav + back-top) ─── */
const syncScroll = () => {
  const scrolled = window.scrollY > 18;
  header?.classList.toggle("is-scrolled", scrolled);
  sectionPillNav?.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.58);
  backTop?.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.78);

  if (scrollProgress) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    scrollProgress.style.width = `${Math.min(progress, 100)}%`;
  }
};

let ticking = false;
const requestScrollSync = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    syncScroll();
    ticking = false;
  });
};

window.addEventListener("scroll", requestScrollSync, { passive: true });
window.addEventListener("resize", requestScrollSync);
syncScroll();

/* ─── Reveal on scroll ─── */
const revealItems = document.querySelectorAll(".reveal");

revealItems.forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* ─── Section active link tracking ─── */
if ("IntersectionObserver" in window && sectionLinks.length) {
  const sectionMap = new Map();

  sectionLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href?.startsWith("#")) return;
    const id = href.slice(1);
    const links = sectionMap.get(id) || [];
    links.push(link);
    sectionMap.set(id, links);
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!active) return;

      sectionLinks.forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

      const activeLinks = sectionMap.get(active.target.id) || [];
      activeLinks.forEach((link) => {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      });
    },
    { threshold: [0.22, 0.42, 0.62], rootMargin: "-24% 0px -52% 0px" }
  );

  sectionMap.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
}

/* ─── Animated number counters ─── */
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const animateCounter = (counter) => {
  if (counter.dataset.counted === "true") return;
  counter.dataset.counted = "true";

  const target = Number(counter.dataset.countTo || "0");
  const suffix = counter.dataset.suffix || "";

  if (reduceMotion || !Number.isFinite(target)) {
    counter.textContent = `${target}${suffix}`;
    return;
  }

  const start = performance.now();
  const duration = 1100;

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(target * easeOutCubic(progress));
    counter.textContent = `${value}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      counter.textContent = `${target}${suffix}`;
    }
  };

  window.requestAnimationFrame(tick);
};

const counters = document.querySelectorAll("[data-counter]");

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );
  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}

/* ─── Chart bar entrance animation ─── */
const chartEl = document.querySelector("[data-chart]");

if (chartEl && !reduceMotion && "IntersectionObserver" in window) {
  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Small delay so bars animate after the card reveal
        setTimeout(() => {
          entry.target.classList.add("chart-animated");
        }, 180);
        chartObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );
  chartObserver.observe(chartEl);
} else if (chartEl) {
  // If reduced motion or no observer, show bars immediately
  chartEl.classList.add("chart-animated");
}

/* ─── Copy to clipboard ─── */
const copyText = async (value) => {
  if (!value) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fallback below
    }
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  field.remove();
  return copied;
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  const label = button.querySelector("span");
  const originalLabel = label?.textContent || "Copy";

  button.addEventListener("click", async () => {
    const copied = await copyText(button.dataset.copy);
    if (!label) return;
    label.textContent = copied ? "Handle Copied ✓" : button.dataset.copy || originalLabel;
    window.setTimeout(() => {
      label.textContent = originalLabel;
    }, 1800);
  });
});

/* ─── FAQ accordion ─── */
document.querySelectorAll("[data-faq]").forEach((item) => {
  const trigger = item.querySelector("button");
  trigger?.addEventListener("click", () => {
    const isOpen = item.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });
});

/* ─── Pointer spotlight (cards) ─── */
const updateSpotlight = (element, event) => {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  element.style.setProperty("--spot-x", `${x.toFixed(1)}%`);
  element.style.setProperty("--spot-y", `${y.toFixed(1)}%`);
};

if (!reduceMotion && hasFinePointer) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      updateSpotlight(card, event);
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-y * 7).toFixed(2);
      const rotateY = (x * 7).toFixed(2);
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
      card.style.removeProperty("--spot-x");
      card.style.removeProperty("--spot-y");
    });
  });

  /* Magnetic buttons */
  document.querySelectorAll("[data-magnetic]").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.setProperty("--mag-x", `${(x * 0.08).toFixed(1)}px`);
      item.style.setProperty("--mag-y", `${(y * 0.1).toFixed(1)}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.removeProperty("--mag-x");
      item.style.removeProperty("--mag-y");
    });
  });
}

/* ─── Lucide icons initialisation ─── */
window.addEventListener("load", () => {
  window.lucide?.createIcons();
});
