const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const compactNavigation = matchMedia("(max-width: 1240px)");
const theme = document.querySelector("#theme");

function describeTheme() {
  const dark = root.dataset.theme === "dark";
  theme.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
}

theme.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("portfolio-theme", root.dataset.theme);
  } catch {}
  describeTheme();
});
describeTheme();

const menu = document.querySelector("#menu");
const navigation = document.querySelector("#navigation");
const researchMenu = navigation.querySelector(".nav-group");
const researchToggle = researchMenu.querySelector("summary");
const navLinks = [...navigation.querySelectorAll("a")];

function setMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("is-open", open);
}

function setNavigationLayout() {
  setMenu(false);
  researchMenu.open = compactNavigation.matches;
}

setNavigationLayout();
compactNavigation.addEventListener("change", setNavigationLayout);
menu.addEventListener("click", () => setMenu(!navigation.classList.contains("is-open")));

navLinks.forEach(link => link.addEventListener("click", () => {
  setMenu(false);
  if (!compactNavigation.matches) researchMenu.open = false;
}));

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (navigation.classList.contains("is-open")) {
    setMenu(false);
    menu.focus();
  } else if (!compactNavigation.matches && researchMenu.open) {
    researchMenu.open = false;
    researchToggle.focus();
  }
});

document.addEventListener("click", event => {
  if (!navigation.contains(event.target) && !menu.contains(event.target)) setMenu(false);
  if (!compactNavigation.matches && !researchMenu.contains(event.target)) researchMenu.open = false;
});

const sections = navLinks
  .filter(link => link.hash && link.getAttribute("href").startsWith("#"))
  .map(link => ({ link, section: document.querySelector(link.hash) }))
  .sort((first, second) => first.section.offsetTop - second.section.offsetTop);
let activeLink = navLinks[0];
let navFrame;

function updateActiveSection() {
  navFrame = null;
  const offset = document.querySelector(".site-header").offsetHeight + 26;
  let current = sections[0];
  for (const entry of sections) {
    if (entry.section.getBoundingClientRect().top > offset) break;
    current = entry;
  }
  const pageBottom = document.scrollingElement.scrollHeight - window.innerHeight;
  if (window.scrollY > 0 && window.scrollY >= pageBottom - 2) current = sections.at(-1);

  const anchor = sections.find(({ link }) => link.hash === window.location.hash);
  if (anchor && anchor.section.offsetTop === current.section.offsetTop) {
    current = anchor;
  }
  const nextLink = current.link;
  if (nextLink !== activeLink) {
    activeLink.removeAttribute("aria-current");
    nextLink.setAttribute("aria-current", "location");
    activeLink = nextLink;
  }
}

function scheduleNavigationUpdate() {
  if (navFrame == null) navFrame = requestAnimationFrame(updateActiveSection);
}

window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("hashchange", scheduleNavigationUpdate);
updateActiveSection();

if ("IntersectionObserver" in window) {
  const typingStates = new Map();

  function finishTyping(state) {
    if (state.frame != null) cancelAnimationFrame(state.frame);
    state.frame = null;
    state.label.classList.remove("is-typing");
  }

  function startTyping(state) {
    if (reducedMotion.matches) return;
    state.progress.textContent = "";
    state.label.classList.add("is-typing");
    let startedAt;
    let previousCount = 0;

    function typeNext(now) {
      startedAt ??= now;
      const count = Math.floor((now - startedAt) / state.interval) + 1;
      if (count >= state.characters.length) {
        finishTyping(state);
        return;
      }
      if (count !== previousCount) {
        state.progress.textContent = state.characters.slice(0, count).join("");
        previousCount = count;
      }
      state.frame = requestAnimationFrame(typeNext);
    }

    state.frame = requestAnimationFrame(typeNext);
  }

  const typingObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = typingStates.get(entry.target);
      if (!entry.isIntersecting) {
        finishTyping(state);
        state.played = false;
      } else if (!state.played && entry.intersectionRatio >= .8) {
        state.played = true;
        startTyping(state);
      }
    }
  }, { threshold: [0, .8], rootMargin: "-72px 0px 0px" });

  for (const label of document.querySelectorAll(".typed-text")) {
    const full = document.createElement("span");
    const progress = document.createElement("span");
    full.className = "typed-full";
    full.textContent = label.textContent.trim();
    progress.className = "typed-progress";
    progress.setAttribute("aria-hidden", "true");
    label.replaceChildren(full, progress);
    typingStates.set(label, {
      label,
      progress,
      characters: Array.from(full.textContent),
      interval: Number(label.dataset.typeInterval) || 55,
      played: false,
    });
    typingObserver.observe(label);
  }

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) typingStates.forEach(finishTyping);
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px 15px 0px" });

  document.querySelectorAll(".stagger").forEach(group => {
    [...group.children].forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${(index % 3) * 85}ms`);
    });
  });

  document.querySelectorAll(".reveal").forEach(element => {
    element.classList.add("ready");
    observer.observe(element);
  });
}

const interests = document.querySelector("#interests");
const interestMotion = interests.querySelector(".interest-motion");
const thesisMap = document.querySelector(".thesis-map");
const thesisMotion = thesisMap.querySelector(".thesis-motion-button");
const motionScenes = document.querySelectorAll(".interest-scene, .thesis-map, .education-art");

interestMotion.hidden = false;
interestMotion.addEventListener("click", () => {
  const paused = interests.classList.toggle("diagrams-paused");
  interestMotion.textContent = paused ? "Play diagrams" : "Pause diagrams";
});

thesisMotion.hidden = false;
thesisMotion.addEventListener("click", () => {
  const paused = thesisMap.classList.toggle("diagrams-paused");
  thesisMotion.textContent = paused ? "Play animation" : "Pause animation";
});

if ("IntersectionObserver" in window) {
  const sceneObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      target.classList.toggle("scene-in-view", isIntersecting);
    }
  });
  motionScenes.forEach(scene => sceneObserver.observe(scene));
} else {
  motionScenes.forEach(scene => scene.classList.add("scene-in-view"));
}

const skillsSection = document.querySelector("#skills");
const skillsVideo = document.querySelector("#skills-gravity");
const skillsMotion = skillsSection.querySelector(".skills-motion-button");
const skillTracks = [...skillsSection.querySelectorAll(".skill-track")];
let skillsInView = !("IntersectionObserver" in window);
let skillsPaused = false;

for (const track of skillTracks) {
  const list = track.firstElementChild;
  const copy = list.cloneNode(true);
  copy.classList.add("skill-list-copy");
  copy.setAttribute("aria-hidden", "true");
  copy.inert = true;
  track.append(copy);
}
skillsSection.classList.add("skills-marquee-ready");

function sizeSkillTrack(list) {
  const track = list.parentElement;
  const duration = list.getBoundingClientRect().width / Number(track.dataset.speed);
  if (duration > 0) track.style.setProperty("--skill-scroll-duration", `${duration}s`);
}

const skillLists = skillTracks.map(track => track.firstElementChild);
skillLists.forEach(sizeSkillTrack);
if ("ResizeObserver" in window) {
  const skillTrackObserver = new ResizeObserver(entries => {
    entries.forEach(entry => sizeSkillTrack(entry.target));
  });
  skillLists.forEach(list => skillTrackObserver.observe(list));
}

function syncSkillsMotion() {
  const playing = skillsInView && !skillsPaused && !reducedMotion.matches && !document.hidden;
  skillsSection.classList.toggle("skills-running", playing);
  if (!playing || root.dataset.theme !== "dark") {
    skillsVideo.pause();
    return;
  }
  skillsVideo.play().catch(() => {});
}

skillsMotion.hidden = false;
skillsMotion.addEventListener("click", () => {
  skillsPaused = !skillsPaused;
  skillsMotion.textContent = skillsPaused ? "Play animation" : "Pause animation";
  syncSkillsMotion();
});
document.addEventListener("visibilitychange", syncSkillsMotion);
reducedMotion.addEventListener("change", syncSkillsMotion);
theme.addEventListener("click", syncSkillsMotion);

if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    skillsInView = entry.isIntersecting;
    syncSkillsMotion();
  }).observe(skillsSection);
} else {
  syncSkillsMotion();
}

const hero = document.querySelector("#home");
const stage = document.querySelector("#portrait-stage");
const portrait = stage.querySelector(".portrait");
const portraitExpression = portrait.querySelector(".portrait-rest-expression");
const canvas = document.querySelector("#particles");
const introWeb = canvas.parentElement;
const context = canvas.getContext("2d");

function smileAtVisitor() {
  if (!reducedMotion.matches) portraitExpression.classList.add("is-smiling");
}

function resetPortraitSmile() {
  portraitExpression.classList.remove("is-smiling");
}

portraitExpression.addEventListener("animationend", resetPortraitSmile);
portraitExpression.addEventListener("animationcancel", resetPortraitSmile);
portrait.addEventListener("pointerenter", event => {
  if (event.pointerType !== "touch") smileAtVisitor();
});
portrait.addEventListener("pointerup", event => {
  if (event.pointerType === "touch") smileAtVisitor();
});

if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry], observer) => {
    if (entry.intersectionRatio < .35) return;
    observer.disconnect();
    smileAtVisitor();
  }, { threshold: .35 }).observe(portrait);
} else {
  smileAtVisitor();
}

function moveStage(x, y) {
  stage.style.setProperty("--stage-x", `${x * 11}px`);
  stage.style.setProperty("--stage-y", `${y * 10}px`);
}

hero.addEventListener("pointermove", event => {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  const bounds = hero.getBoundingClientRect();
  moveStage((event.clientX - bounds.left) / bounds.width - .5, (event.clientY - bounds.top) / bounds.height - .5);
}, { passive: true });
hero.addEventListener("pointerleave", () => moveStage(0, 0));

if (context) {
  const linkDistance = 178;
  const hoverDistance = 205;
  const maxDots = 156;
  let pointer = null;
  let width;
  let height;
  let dots = [];
  let frame;
  let lastTick;
  let visible = true;
  let color;

  function createDot(x = Math.random() * width, y = Math.random() * height) {
    return {
      x, y,
      dx: (Math.random() - .5) * 35,
      dy: -(8 + Math.random() * 21),
      radius: .8 + Math.random() * 1.55,
    };
  }

  function resize() {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    for (const dot of dots) {
      dot.x *= nextWidth / width;
      dot.y *= nextHeight / height;
    }
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(maxDots, Math.max(28, Math.round(width * height / 10600)));
    dots = dots.slice(0, count);
    while (dots.length < count) dots.push(createDot());
  }

  function drawLine(start, end, opacity) {
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.strokeStyle = `rgba(${color}, ${opacity})`;
    context.stroke();
  }

  function draw(now) {
    frame = null;
    const delta = lastTick == null || reducedMotion.matches ? 0 : Math.min((now - lastTick) / 1000, .04);
    lastTick = now;
    context.clearRect(0, 0, width, height);

    for (const dot of dots) {
      dot.x = (dot.x + dot.dx * delta + width) % width;
      dot.y = (dot.y + dot.dy * delta + height) % height;
    }

    for (const [index, dot] of dots.entries()) {
      for (let next = index + 1; next < dots.length; next++) {
        const other = dots[next];
        const distanceSquared = (dot.x - other.x) ** 2 + (dot.y - other.y) ** 2;
        if (distanceSquared < linkDistance ** 2) {
          drawLine(dot, other, .29 * (1 - Math.sqrt(distanceSquared) / linkDistance));
        }
      }
      if (pointer) {
        const distance = Math.hypot(dot.x - pointer.x, dot.y - pointer.y);
        if (distance < hoverDistance) drawLine(dot, pointer, .59 * (1 - distance / hoverDistance));
      }
      context.beginPath();
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${color}, .47)`;
      context.fill();
    }

    if (visible && !document.hidden && !reducedMotion.matches) {
      frame = requestAnimationFrame(draw);
    }
  }

  function refresh() {
    if (frame != null) cancelAnimationFrame(frame);
    lastTick = null;
    color = getComputedStyle(root).getPropertyValue("--particle").trim();
    if (width > 0 && height > 0) draw(performance.now());
  }

  function updateSize() {
    resize();
    refresh();
  }

  updateSize();
  if ("ResizeObserver" in window) new ResizeObserver(updateSize).observe(introWeb);
  else window.addEventListener("resize", updateSize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) pointer = null;
      refresh();
    }).observe(introWeb);
    new IntersectionObserver(([entry]) => {
      hero.classList.toggle("is-outside", !entry.isIntersecting);
      if (!entry.isIntersecting) moveStage(0, 0);
    }).observe(hero);
  }

  introWeb.addEventListener("pointermove", event => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const bounds = introWeb.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, { passive: true });
  introWeb.addEventListener("pointerleave", () => { pointer = null; });

  introWeb.addEventListener("click", event => {
    if (reducedMotion.matches || event.target.closest("a, button") || event.detail === 0) return;
    const bounds = introWeb.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (let count = 0; count < 4; count++) dots.push(createDot(x, y));
    if (dots.length > maxDots + 10) dots.splice(0, dots.length - maxDots - 10);
  });
  document.addEventListener("visibilitychange", refresh);
  reducedMotion.addEventListener("change", () => { pointer = null; moveStage(0, 0); refresh(); });
  theme.addEventListener("click", refresh);
}

const projectViewport = document.querySelector("#project-viewport");
const projectCards = [...projectViewport.children];
const projectScroll = document.querySelector("#projects-scroll");

function updateProjectScrollButton() {
  const end = projectViewport.scrollWidth - projectViewport.clientWidth;
  const atEnd = projectViewport.scrollLeft >= end - 2;
  const label = atEnd ? "Back to first project" : "Scroll projects right";
  projectScroll.hidden = end <= 2;
  projectScroll.classList.toggle("is-at-end", atEnd);
  projectScroll.setAttribute("aria-label", label);
  projectScroll.title = label;
}

projectScroll.addEventListener("click", () => {
  const end = projectViewport.scrollWidth - projectViewport.clientWidth;
  const current = projectViewport.scrollLeft;
  const first = projectCards[0].offsetLeft;
  const next = projectCards.find(card => card.offsetLeft - first > current + 2);
  const left = current >= end - 2 ? 0 : Math.min(end, next ? next.offsetLeft - first : end);
  projectViewport.scrollTo({ left });
});
projectViewport.addEventListener("scroll", updateProjectScrollButton, { passive: true });
window.addEventListener("resize", updateProjectScrollButton);
updateProjectScrollButton();

const filters = [...document.querySelectorAll("[data-filter]")];
const cards = [...document.querySelectorAll("#gallery article")];
const lightbox = document.querySelector("#lightbox");
const fullPhoto = document.querySelector("#full-photo");
const caption = document.querySelector("#photo-caption");
let photos = [];
let photoIndex = 0;

filters.forEach(filter => filter.addEventListener("click", () => {
  const group = filter.dataset.filter;
  filters.forEach(button => button.setAttribute("aria-pressed", String(button === filter)));
  cards.forEach(card => { card.hidden = group !== "all" && card.dataset.group !== group; });
}));

function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const link = photos[photoIndex];
  fullPhoto.src = link.href;
  fullPhoto.alt = link.querySelector("img").alt;
  caption.textContent = link.querySelector("strong").textContent;
}

cards.forEach(card => card.querySelector("a").addEventListener("click", event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !lightbox.showModal) return;
  event.preventDefault();
  photos = cards.filter(item => !item.hidden).map(item => item.querySelector("a"));
  showPhoto(photos.indexOf(event.currentTarget));
  lightbox.showModal();
}));
document.querySelector("#previous-photo").addEventListener("click", () => showPhoto(photoIndex - 1));
document.querySelector("#next-photo").addEventListener("click", () => showPhoto(photoIndex + 1));
lightbox.addEventListener("click", event => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") showPhoto(photoIndex - 1);
  if (event.key === "ArrowRight") showPhoto(photoIndex + 1);
});
