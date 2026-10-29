export class Cutscene {
  constructor(game) {
    this.game = game;
    this.lines = [];
    this.index = 0;
    this.onDone = null;
    this.active = false;
    this.el = document.getElementById("story");
    this.textEl = document.getElementById("story-text");
    this.avatarEl = document.getElementById("story-avatar");
  }

  start(lines, onDone) {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    this.active = true;

    // Показываем имя и цвет текущего персонажа в аватаре
    const char = this.game.player && this.game.player.char;
    if (this.avatarEl && char) {
      this.avatarEl.textContent = char.name;
      const main = (char.colors && char.colors.main) || "#8a5cff";
      const accent = (char.colors && (char.colors.accent || char.colors.main)) || main;
      this.avatarEl.style.background = `linear-gradient(135deg, ${main}, ${accent})`;
    }

    this.el.classList.remove("hidden");
    this.render();
  }

  render() {
    this.textEl.textContent = this.lines[this.index] || "";
  }

  next() {
    if (!this.active) return;
    this.index++;
    if (this.index >= this.lines.length) {
      this.finish();
    } else {
      this.render();
    }
  }

  skip() {
    if (!this.active) return;
    this.finish();
  }

  finish() {
    this.active = false;
    this.el.classList.add("hidden");
    const cb = this.onDone;
    this.onDone = null;
    if (cb) cb();
  }
}