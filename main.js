import { Game } from "./Game.js";
import { Storage } from "./storage.js";
import { CHARACTERS } from "./characters.js";
import { STORY } from "./story.js";
import { LEVELS } from "./levels.js";

const canvas = document.getElementById("game");
const game = new Game(canvas, { Storage, CHARACTERS, STORY });

const ui = {
  hud: document.getElementById("hud"),
  hint: document.getElementById("hint"),
  level: document.getElementById("hud-level"),
  char: document.getElementById("hud-char"),
  items: document.getElementById("hud-items"),
  lives: document.getElementById("hud-lives"),
  score: document.getElementById("hud-score"),
  best: document.getElementById("hud-best"),
  menu: document.getElementById("menu"),
  menuBest: document.getElementById("menu-best"),
  btnContinue: document.getElementById("btn-continue"),
  btnStart: document.getElementById("btn-start"),
  btnLevels: document.getElementById("btn-levels"),
  btnReset: document.getElementById("btn-reset"),
  btnRoster: document.getElementById("btn-roster"),
  btnSound: document.getElementById("btn-sound"),
  soundIcon: document.getElementById("sound-icon"),
  soundLabel: document.getElementById("sound-label"),
  charselect: document.getElementById("charselect"),
  charList: document.getElementById("char-list"),
  btnCharGo: document.getElementById("btn-char-go"),
  btnCharBack: document.getElementById("btn-char-back"),
  levelselect: document.getElementById("levelselect"),
  levelList: document.getElementById("level-list"),
  btnLevelBack: document.getElementById("btn-level-back"),
  roster: document.getElementById("roster"),
  rosterList: document.getElementById("roster-list"),
  rosterCount: document.getElementById("roster-count"),
  btnRosterBack: document.getElementById("btn-roster-back"),
  confirmNew: document.getElementById("confirm-new"),
  btnConfirmYes: document.getElementById("btn-confirm-yes"),
  btnConfirmNo: document.getElementById("btn-confirm-no"),
  story: document.getElementById("story"),
  storyText: document.getElementById("story-text"),
  btnStoryNext: document.getElementById("btn-story-next"),
  btnStorySkip: document.getElementById("btn-story-skip"),
  pause: document.getElementById("pause"),
  btnResume: document.getElementById("btn-resume"),
  btnPauseRestart: document.getElementById("btn-pause-restart"),
  btnPauseMenu: document.getElementById("btn-pause-menu"),
  complete: document.getElementById("complete"),
  completeTitle: document.getElementById("complete-title"),
  completeScore: document.getElementById("complete-score"),
  completeBest: document.getElementById("complete-best"),
  btnNext: document.getElementById("btn-next"),
  gameover: document.getElementById("gameover"),
  btnRetry: document.getElementById("btn-retry"),
  btnGoMenu: document.getElementById("btn-go-menu"),
  mobile: document.getElementById("mobile-controls"),
};

let selectedChar = "tata";
let selectedLevel = 0;

function refreshBest() {
  const best = Storage.getBest();
  ui.best.textContent = "Рекорд: " + best;
  ui.menuBest.textContent = best;
  ui.completeBest.textContent = "Рекорд: " + best;
}
refreshBest();

function updateContinueButton() {
  const hasProgress = Storage.getLevelProgress() > 0;
  ui.btnContinue.classList.toggle("hidden", !hasProgress);
}
updateContinueButton();

function setSoundLabel() {
  const on = game.audio.enabled;
  if (ui.soundIcon) ui.soundIcon.textContent = on ? "🔊" : "🔇";
  if (ui.soundLabel) ui.soundLabel.textContent = on ? "Звук вкл" : "Звук выкл";
}
setSoundLabel();

ui.btnSound.addEventListener("click", () => {
  game.audio.toggle();
  setSoundLabel();
});

function showMenu() {
  hideAllOverlays();
  ui.menu.classList.remove("hidden");
  ui.hud.classList.add("hidden");
  ui.hint.classList.add("hidden");
  refreshBest();
  updateContinueButton();
  game.stop();
}

function hideAllOverlays() {
  [ui.menu, ui.charselect, ui.levelselect, ui.roster, ui.confirmNew, ui.story, ui.pause, ui.complete, ui.gameover]
    .forEach(el => el.classList.add("hidden"));
  document.body.classList.remove("overlay-open");
  game.input.clear();
  document.querySelectorAll(".m-btn.active").forEach(b => b.classList.remove("active"));
}

// Следим за тем, открыт ли какой-либо оверлей — для CSS body.overlay-open
const overlayEls = [
  ui.menu, ui.charselect, ui.levelselect, ui.roster, ui.confirmNew,
  ui.story, ui.pause, ui.complete, ui.gameover
].filter(Boolean);

function syncOverlayState() {
  const anyOpen = overlayEls.some(el => !el.classList.contains("hidden"));
  document.body.classList.toggle("overlay-open", anyOpen);
}

const observer = new MutationObserver(syncOverlayState);
overlayEls.forEach(el => {
  observer.observe(el, { attributes: true, attributeFilter: ["class"] });
});
syncOverlayState();

function startSelectedLevel() {
  hideAllOverlays();
  game.audio.ensure();
  const unlocked = Storage.getUnlocked();
  const charId = (CHARACTERS[selectedChar] && unlocked.includes(selectedChar))
    ? selectedChar
    : (unlocked.slice(-1)[0] || "tata");
  game.startLevel(selectedLevel, charId, ui);
}

function openCharSelect() {
  hideAllOverlays();
  ui.charselect.classList.remove("hidden");
  ui.charList.innerHTML = "";
  const unlocked = Storage.getUnlocked();
  Object.values(CHARACTERS).forEach(ch => {
    const isUnlocked = unlocked.includes(ch.id);
    const card = document.createElement("div");
    card.className = "char-card" + (isUnlocked ? "" : " locked") + (selectedChar === ch.id ? " selected" : "");
    const cnv = document.createElement("canvas");
    cnv.width = 62; cnv.height = 62;
    drawMiniPortrait(cnv, ch);
    card.appendChild(cnv);
    const label = document.createElement("div");
    label.textContent = ch.name;
    card.appendChild(label);
    if (!isUnlocked) {
      const lock = document.createElement("div");
      lock.className = "lock-icon";
      lock.textContent = "🔒";
      card.appendChild(lock);
    } else {
      card.addEventListener("click", () => {
        selectedChar = ch.id;
        [...ui.charList.children].forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
      });
    }
    ui.charList.appendChild(card);
  });
}

function openLevelSelect() {
  hideAllOverlays();
  ui.levelselect.classList.remove("hidden");
  ui.levelList.innerHTML = "";
  const progress = Storage.getLevelProgress();
  LEVELS.forEach((lv, i) => {
    const unlocked = i <= progress;
    const card = document.createElement("div");
    card.className = "level-card" + (unlocked ? "" : " locked") + (selectedLevel === i ? " selected" : "");
    const num = document.createElement("div");
    num.className = "lv-num";
    num.textContent = "Уровень " + (i + 1);
    const name = document.createElement("div");
    name.className = "lv-name";
    name.textContent = unlocked ? lv.name : "???";
    const items = document.createElement("div");
    items.className = "lv-items";
    items.textContent = unlocked ? (lv.itemLabel || "Предметы") + ": " + lv.items.length : "Заблокировано";
    card.appendChild(num);
    card.appendChild(name);
    card.appendChild(items);
    if (unlocked) {
      if (i < progress) {
        const done = document.createElement("div");
        done.className = "lv-done";
        done.textContent = "✅";
        card.appendChild(done);
      }
      card.addEventListener("click", () => {
        selectedLevel = i;
        [...ui.levelList.children].forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        setTimeout(() => startSelectedLevel(), 120);
      });
    } else {
      const lock = document.createElement("div");
      lock.className = "lv-done";
      lock.textContent = "🔒";
      card.appendChild(lock);
    }
    ui.levelList.appendChild(card);
  });
}

function openRoster() {
  hideAllOverlays();
  ui.roster.classList.remove("hidden");
  ui.rosterList.innerHTML = "";
  const unlocked = Storage.getUnlocked();
  const all = Object.values(CHARACTERS);
  const unlockedCount = unlocked.filter(id => all.some(c => c.id === id)).length;
  ui.rosterCount.textContent = `Открыто: ${unlockedCount} / ${all.length}`;

  all.forEach(ch => {
    const isUnlocked = unlocked.includes(ch.id);
    const card = document.createElement("div");
    card.className = "char-card" + (isUnlocked ? "" : " locked");

    const cnv = document.createElement("canvas");
    cnv.width = 62; cnv.height = 62;
    drawMiniPortrait(cnv, ch);
    card.appendChild(cnv);

    const label = document.createElement("div");
    label.textContent = isUnlocked ? ch.name : "???";
    card.appendChild(label);

    if (!isUnlocked) {
      const lock = document.createElement("div");
      lock.className = "lock-icon";
      lock.textContent = "🔒";
      card.appendChild(lock);
    }

    ui.rosterList.appendChild(card);
  });
}

function drawMiniPortrait(cnv, ch) {
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.save();
  ctx.translate(cnv.width / 2, cnv.height / 2 + 8);
  const scale = 0.62;
  ctx.scale(scale, scale);
  if (ch.draw) ch.draw(ctx, 0, 0, 1);
  ctx.restore();
}

ui.btnContinue.addEventListener("click", () => {
  game.audio.ensure();
  const idx = Math.min(Storage.getLevelProgress(), LEVELS.length - 1);
  selectedLevel = idx;
  hideAllOverlays();
  const unlocked = Storage.getUnlocked();
  const charId = unlocked.slice(-1)[0] || "tata";
  game.startLevel(idx, charId, ui);
});

ui.btnStart.addEventListener("click", () => {
  game.audio.ensure();
  selectedLevel = 0;
  openCharSelect();
});

ui.btnLevels.addEventListener("click", openLevelSelect);
ui.btnLevelBack.addEventListener("click", showMenu);

ui.btnRoster.addEventListener("click", openRoster);
ui.btnRosterBack.addEventListener("click", showMenu);

ui.btnReset.addEventListener("click", () => {
  ui.confirmNew.classList.remove("hidden");
});

ui.btnConfirmYes.addEventListener("click", () => {
  Storage.reset();
  selectedChar = "tata";
  selectedLevel = 0;
  game.stop();
  ui.confirmNew.classList.add("hidden");
  game.audio.enabled = Storage.getSound();
  if (game.audio.master) game.audio.master.gain.value = game.audio.enabled ? 0.28 : 0;
  setSoundLabel();
  refreshBest();
  updateContinueButton();
  showMenu();
});

ui.btnConfirmNo.addEventListener("click", () => {
  ui.confirmNew.classList.add("hidden");
});

ui.btnCharBack.addEventListener("click", showMenu);

ui.btnCharGo.addEventListener("click", startSelectedLevel);

ui.btnStoryNext.addEventListener("click", () => game.cutscene.next());
ui.btnStorySkip.addEventListener("click", () => game.cutscene.skip());

ui.btnResume.addEventListener("click", () => game.togglePause(false));
ui.btnPauseRestart.addEventListener("click", () => {
  hideAllOverlays();
  game.restartLevel(ui);
});
ui.btnPauseMenu.addEventListener("click", () => {
  hideAllOverlays();
  game.stop();
  showMenu();
});

ui.btnNext.addEventListener("click", () => {
  hideAllOverlays();
  const isLastLevel = game.levelIndex >= LEVELS.length - 1;
  if (isLastLevel) {
    game.stop();
    showMenu();
  } else {
    game.nextLevel(ui);
  }
});

ui.btnRetry.addEventListener("click", () => {
  hideAllOverlays();
  game.restartLevel(ui);
});
ui.btnGoMenu.addEventListener("click", () => {
  hideAllOverlays();
  game.stop();
  showMenu();
});

// ===== Mobile controls =====
function bindMobile() {
  const btns = ui.mobile.querySelectorAll(".m-btn");
  btns.forEach(btn => {
    const key = btn.dataset.key;

    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      game.input.setVirtual(key, true);
      game.audio.ensure();
      btn.classList.add("active");
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      game.input.setVirtual(key, false);
      btn.classList.remove("active");
    };

    btn.addEventListener("pointerdown", down, { passive: false });
    btn.addEventListener("pointerup", up, { passive: false });
    btn.addEventListener("pointercancel", up, { passive: false });
    btn.addEventListener("pointerleave", up, { passive: false });
    btn.addEventListener("lostpointercapture", up, { passive: false });

    // Защита от контекстного меню на долгом тапе
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });
}
bindMobile();

// Показываем мобильные контролы на тач-устройствах
const isTouch =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

if (isTouch) {
  ui.mobile.classList.remove("hidden");
}

// ===== Visibility / blur: пауза + сброс ввода =====
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    game.input.clear();
    document.querySelectorAll(".m-btn.active").forEach(b => b.classList.remove("active"));
    game.autoPause();
  }
});
window.addEventListener("blur", () => {
  game.input.clear();
  document.querySelectorAll(".m-btn.active").forEach(b => b.classList.remove("active"));
});

// Запрет двойного тапа-зума на iOS (страховка, если CSS не сработал)
document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });

showMenu();