const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const btnStart = document.getElementById("btn-start");
const btnOptions = document.getElementById("btn-options");
const btnExit = document.getElementById("btn-exit");
const btnBack = document.getElementById("btn-back");

function showOverlay(title, text) {
  if (!overlay || !overlayTitle || !overlayText) return;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  if (!overlay) return;
  overlay.classList.add("hidden");
}

btnStart?.addEventListener("click", () => {
  showOverlay(
    "Booting Hack AI 2026...",
    "Game starting soon."
  );
});

btnOptions?.addEventListener("click", () => {
  showOverlay(
    "Options",
    "lets add audio, visual, and control settings here."
  );
});

btnExit?.addEventListener("click", () => {
  showOverlay(
    "Exit Game",
    "In a real build, this would close the application or return to your launcher."
  );
});

btnBack?.addEventListener("click", hideOverlay);

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    btnStart?.click();
  }

  if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
    hideOverlay();
  }
});

