const pages = [...document.querySelectorAll(".deck-page")];
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#page-count");
let current = 0;
let initial = true;

function showPage() {
  const requested = pages.findIndex(page => "#" + page.id === location.hash);
  current = Math.max(0, requested);
  pages.forEach((page, index) => { page.hidden = index !== current; });
  previous.disabled = current === 0;
  next.disabled = current === pages.length - 1;
  counter.textContent = (current + 1) + " / " + pages.length;
  if (!initial) pages[current].querySelector("h1, h2").focus({preventScroll: true});
  window.scrollTo(0, 0);
  initial = false;
}

function go(index) {
  if (index >= 0 && index < pages.length) location.hash = pages[index].id;
}

previous.addEventListener("click", () => go(current - 1));
next.addEventListener("click", () => go(current + 1));
window.addEventListener("hashchange", showPage);
document.addEventListener("keydown", event => {
  if (event.altKey || event.metaKey || event.ctrlKey ||
      event.target.closest("input, select, textarea, [contenteditable]")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    go(current + (event.key === "ArrowLeft" ? -1 : 1));
  }
});

let touchStart;
document.querySelector("main").addEventListener("touchstart", event => {
  touchStart = event.touches.length === 1 && !event.target.closest("a, button")
    ? event.touches[0] : undefined;
}, {passive: true});
document.querySelector("main").addEventListener("touchend", event => {
  if (!touchStart) return;
  const end = event.changedTouches[0];
  const dx = end.clientX - touchStart.clientX;
  const dy = end.clientY - touchStart.clientY;
  touchStart = undefined;
  if (Math.abs(dx) >= 65 && Math.abs(dx) > 1.5 * Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
}, {passive: true});
document.querySelector("main").addEventListener("touchcancel", () => { touchStart = undefined; });

for (const control of document.querySelectorAll("[data-flow]")) {
  control.addEventListener("click", () => {
    document.querySelectorAll("[data-flow]").forEach(button => {
      button.setAttribute("aria-pressed", String(button === control));
    });
    document.querySelectorAll("[data-flow-detail]").forEach(result => {
      result.hidden = result.dataset.flowDetail !== control.dataset.flow;
    });
  });
}

for (const diagram of document.querySelectorAll(".diagram")) {
  const choices = diagram.querySelectorAll("[data-diagram-choice]");
  const views = diagram.querySelectorAll("[data-diagram-view]");
  for (const choice of choices) {
    choice.addEventListener("click", () => {
      choices.forEach(button => {
        button.setAttribute("aria-pressed", String(button === choice));
      });
      views.forEach(view => {
        view.hidden = view.dataset.diagramView !== choice.dataset.diagramChoice;
      });
    });
  }
}

const clock = document.querySelector("#clock-toggle");
clock.addEventListener("click", () => {
  const biased = clock.getAttribute("aria-pressed") !== "true";
  clock.setAttribute("aria-pressed", String(biased));
  clock.textContent = biased ? "切回零鐘差" : "加入正鐘差";
  for (const circle of document.querySelectorAll("[data-radius]")) {
    circle.setAttribute("r", Number(circle.dataset.radius) + (biased ? 21.6 : 0));
    circle.classList.toggle("biased", biased);
    circle.setAttribute("stroke", biased ? "#bc4c0a" : circle.dataset.stroke);
  }
  document.querySelector("#clock-zero").hidden = biased;
  document.querySelector("#clock-biased").hidden = !biased;
});

for (const choice of document.querySelectorAll("[data-feedback]")) {
  choice.addEventListener("click", () => {
    const group = choice.closest("fieldset");
    group.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button === choice));
    });
    group.querySelector(".feedback").textContent = choice.dataset.feedback;
  });
}
document.documentElement.classList.add("enhanced");
showPage();
