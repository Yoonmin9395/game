import { Player } from "./Player.js";
import { Level } from "./Level.js";
import { LEVELS } from "./levels.js";
import { CHARACTERS } from "./characters.js";
import { Input } from "./input.js";
import { AudioManager } from "./audio.js";
import { Cutscene } from "./cutscene.js";

export class Game {
  constructor(canvas, deps) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width;
    this.H = canvas.height;
    this.Storage = deps.Storage;
    this.CHARACTERS = deps.CHARACTERS;
    this.STORY = deps.STORY;

    this.input = new Input(canvas);
    this.audio = new AudioManager(this.Storage);
    this.cutscene = new Cutscene(this);

    this.running = false;
    this.paused = false;
    this.rafId = null;
    this.lastTime = 0;

    this.levelIndex = 0;
    this.charId = "tata";
    this.level = null;
    this.player = null;
    this.ui = null;

    this.score = 0;
    this.lives = 3;
    this.itemsCollected = 0;
    this.invulnTimer = 0;

    this.meetActive = false;
    this.meetTimer = 0;
    this.meetDuration = 3.5;
    this.meetChar = null;
    this.levelComplete = false;
    this.gameOverShown = false;

    this.loop = this.loop.bind(this);
  }

  stop() {
    this.running = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.paused = false;
    this.audio.stopMusic();
    this._clearActiveMobileButtons();
  }

  _clearActiveMobileButtons() {
    document.querySelectorAll(".m-btn.active").forEach(b => b.classList.remove("active"));
  }

  startLevel(index, charId, ui) {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.running = false;
    this.paused = false;
    this.input.clear();
    this._clearActiveMobileButtons();

    this.ui = ui;
    this.levelIndex = index;
    this.charId = charId || "tata";
    const data = LEVELS[index];
    if (!data) { this.stop(); return; }

    this.level = new Level(data, this);
    if (this.level) {
      this.level.finishChar = null;
    }

    const charData = this.CHARACTERS[this.charId];
    const spawnX = 80;
    const groundY = this.findSpawnGroundY(data, spawnX, charData.w);
    const spawnTop = groundY - charData.h - 2;
    this.player = new Player(charData, spawnX, spawnTop);

    this.score = 0;
    this.lives = 3;
    this.itemsCollected = 0;
    this.invulnTimer = 0;
    this.levelComplete = false;
    this.meetActive = false;
    this.meetTimer = 0;
    this.meetChar = null;
    this.gameOverShown = false;

    ui.hud.classList.remove("hidden");
    ui.hint.classList.remove("hidden");

    const storyLines = this.STORY[index] || [];
    const proceed = () => {
      this.audio.playMusicForLevel(index);
      this.beginLoop();
    };
    if (storyLines.length) {
      ui.story.classList.remove("hidden");
      this.cutscene.start(storyLines, proceed);
    } else {
      proceed();
    }
  }

  findSpawnGroundY(data, spawnX, spawnW) {
    let bestY = data.height - 100;
    for (const p of data.platforms) {
      if (p.solid === false) continue;
      const overlapX = spawnX + spawnW > p.x && spawnX < p.x + p.w;
      if (!overlapX) continue;
      if (p.y < bestY) bestY = p.y;
    }
    return bestY;
  }

  findGroundYAt(x, fallbackY, w) {
    let bestY = null;
    for (const p of this.level.platforms) {
      if (p.solid === false) continue;
      const overlapX = x + w > p.x && x < p.x + p.w;
      if (!overlapX) continue;
      if (p.y < fallbackY - 160) continue;
      if (p.y > fallbackY + 160) continue;
      if (bestY === null || Math.abs(p.y - fallbackY) < Math.abs(bestY - fallbackY)) {
        bestY = p.y;
      }
    }
    return bestY === null ? fallbackY : bestY;
  }

  restartLevel(ui) {
    if (!this.level) return;
    this.startLevel(this.levelIndex, this.charId, ui);
  }

  nextLevel(ui) {
    const next = this.levelIndex + 1;
    if (next < LEVELS.length) this.startLevel(next, this.charId, ui);
    else this.stop();
  }

  beginLoop() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.running = true;
    this.paused = false;
    this.input.clear();
    this._clearActiveMobileButtons();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  autoPause() {
    if (this.running && !this.paused && !this.levelComplete) this.togglePause(true);
  }

  togglePause(p) {
    if (!this.running) return;
    this.paused = p;
    if (p) {
      this.audio.stopMusic();
      this.ui.pause.classList.remove("hidden");
      this.input.clear();
      this._clearActiveMobileButtons();
    } else {
      this.ui.pause.classList.add("hidden");
      this.audio.resumeMusic();
      this.input.clear();
      this._clearActiveMobileButtons();
      this.lastTime = performance.now();
    }
  }

  loop(now) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.05) dt = 0.05;
    if (!this.paused) this.update(dt);
    if (!this.running) return;
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // тикаем буфер прыжка ввода (важно для тача)
    if (this.input.tick) this.input.tick(dt);

    if (this.levelComplete) return;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    if (this.meetActive) {
      this.meetTimer += dt;
      this.player.updateMeet(dt);
      if (this.meetChar) this.meetChar.updateMeet(dt);
      if (this.meetTimer >= this.meetDuration) this.finishMeeting();
      return;
    }

    if (this.input.justPressed("pause")) {
      this.togglePause(true);
      return;
    }

    this.player.update(dt, this.level, this.input);
    this.level.update(dt, this.player);

    for (const it of this.level.items) {
      if (!it.collected && this.aabb(this.player, it)) {
        it.collected = true;
        this.itemsCollected++;
        this.score += 10;
        this.audio.sfx("collect");
      }
    }

    if (this.invulnTimer <= 0) {
      for (const h of this.level.hazards) {
        if (h.type === "drip" || h.type === "snowball" || h.type === "icicle") continue;
        if (!this.aabb(this.player, h)) continue;
        this.hurt(true);
        break;
      }
    }

    this.updateDripHazards(dt);
    this.updateIcicles();
    this.updateSnowballs();

    if (this.player.y > this.level.height + 200) {
      this.hurt(true);
    }

    const finish = this.level.finish;
    if (finish && this.itemsCollected >= this.level.totalItems && !finish.opened) {
      finish.opened = true;
      const meetCharData = this.CHARACTERS[finish.charId];
      const meetX = Math.min(finish.x + 20, this.level.width - meetCharData.w - 10);
      const groundY = this.findGroundYAt(meetX, finish.y, meetCharData.w);
      const meetY = groundY - meetCharData.h - 2;
      this.meetChar = new Player(meetCharData, meetX, meetY);
      this.level.finishChar = this.meetChar;
    }
    if (finish && finish.opened && this.meetChar && !this.meetActive) {
      const meetZone = {
        x: this.meetChar.x - 70,
        y: this.meetChar.y - 20,
        w: this.meetChar.w + 140,
        h: this.meetChar.h + 100,
      };
      const sameGround =
        Math.abs((this.player.x + this.player.w / 2) - (this.meetChar.x + this.meetChar.w / 2)) < 100 &&
        Math.abs((this.player.y + this.player.h) - (this.meetChar.y + this.meetChar.h)) < 90;
      if (this.aabb(this.player, meetZone) || sameGround) this.startMeeting();
    }

    this.updateHUD();
  }

  updateDripHazards(dt) {
    if (!this.player || !this.level) return;
    for (const h of this.level.hazards) {
      if (h.type !== "drip") continue;
      const interval = h.interval || 2;
      const t = this.level.time % interval;
      const fall = t / interval;
      const cx = h.x + h.w / 2;
      const startY = h.y + 10;
      const endY = h.y + h.h - 8;
      const py = startY + fall * (endY - startY);
      const dropBox = { x: cx - 9, y: py - 12, w: 18, h: 24 };
      if (this.aabb(this.player, dropBox)) {
        this.player.applySlow(h.slow || 1.4, 0.45);
      }
    }
  }

  updateIcicles() {
    if (!this.player || !this.level) return;
    if (this.invulnTimer > 0) return;
    for (const h of this.level.hazards) {
      if (h.type !== "icicle") continue;
      const interval = h.interval || 2.5;
      const cycle = this.level.time % interval;
      const fallFrac = Math.min(1, cycle / (interval * 0.7));
      const spawnY = h.y + 20;
      const endY = h.y + h.h - 24;
      const py = spawnY + fallFrac * (endY - spawnY);
      const cx = h.x + h.w / 2;
      const len = 34;
      const box = { x: cx - 8, y: py - 6, w: 16, h: len + 6 };
      if (this.aabb(this.player, box)) {
        this.hurt(true);
        return;
      }
    }
  }

  updateSnowballs() {
    if (!this.player || !this.level) return;
    if (this.invulnTimer > 0) return;
    for (const h of this.level.hazards) {
      if (h.type !== "snowball") continue;
      const range = h.rangeX || 300;
      const speed = h.speed || 1.5;
      const cx = h.x + (Math.sin(this.level.time * speed + (h.x || 0) * 0.01) * 0.5 + 0.5) * range;
      const cy = h.y + h.h / 2;
      const r = h.w / 2;
      const ballBox = { x: cx - r, y: cy - r, w: h.w, h: h.h };
      if (this.aabb(this.player, ballBox)) {
        this.hurt(true);
        return;
      }
    }
  }

  startMeeting() {
    if (!this.meetChar) return;
    this.meetActive = true;
    this.meetTimer = 0;
    this.audio.sfx("jingle");
    this.input.clear();
    this._clearActiveMobileButtons();
    this.player.startMeetAnim(this.meetChar);
    this.meetChar.startMeetAnim(this.player);
  }

  finishMeeting() {
    if (this.levelComplete || !this.meetChar) return;
    this.meetActive = false;
    this.levelComplete = true;

    const finishCharId = (this.level.finish && this.level.finish.charId) || this.meetChar.char.id;
    this.Storage.unlockChar(finishCharId);
    this.Storage.addScore(this.score);
    this.Storage.setBestIfHigher(this.score);

    const nextIdx = Math.min(this.levelIndex + 1, LEVELS.length - 1);
    this.Storage.setLevelProgress(nextIdx);

    this.ui.completeTitle.textContent = `${this.meetChar.char.name} присоединяется к команде!`;
    this.ui.completeScore.textContent = "Счёт: " + this.score;
    this.ui.completeBest.textContent = "Рекорд: " + this.Storage.getBest();
    this.ui.complete.classList.remove("hidden");
    this.audio.stopMusic();
    this.audio.sfx("win");
  }

  hurt(respawn) {
    if (this.levelComplete || this.lives <= 0 || this.gameOverShown) return;
    if (this.invulnTimer > 0) return;

    this.lives--;
    this.invulnTimer = 1.2;
    this.audio.sfx("hurt");
    this.player.hurt();

    if (respawn && this.level) {
      this.player.x = this.player.spawnX;
      this.player.y = this.player.spawnY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.prevY = this.player.y;
      this.player.onGround = false;

      this.level.restoreCracked();
    }

    if (this.lives <= 0) this.gameOver();
    this.updateHUD();
  }

  gameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;
    this.running = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.audio.stopMusic();
    this.input.clear();
    this._clearActiveMobileButtons();
    this.ui.gameover.classList.remove("hidden");
  }

  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  updateHUD() {
    const ui = this.ui;
    if (!ui || !this.player || !this.level) return;
    ui.level.textContent = "Уровень " + (this.levelIndex + 1);
    ui.char.textContent = this.player.char.name;
    ui.items.textContent = this.level.itemLabel + ": " + this.itemsCollected + "/" + this.level.totalItems;
    ui.lives.textContent = "❤".repeat(Math.max(0, this.lives));
    ui.score.textContent = "Счёт: " + this.score;
    ui.best.textContent = "Рекорд: " + this.Storage.getBest();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    if (!this.level || !this.player) return;
    const cam = this.level.camera(this.player);

    this.level.renderBackground(ctx, this.player);
    this.level.render(ctx, cam);

    ctx.save();
    ctx.translate(-cam, 0);
    if (this.meetChar) this.meetChar.render(ctx);
    this.player.render(ctx);
    ctx.restore();

    this.level.renderForeground(ctx, this.player);

    if (this.meetActive && this.meetChar) this.renderMeetingFX(ctx, cam);
  }

  renderMeetingFX(ctx, cam) {
    const cx = (this.player.x + this.meetChar.x) / 2 + 20 - cam;
    const cy = Math.min(this.player.y, this.meetChar.y) - 60;
    const t = this.meetTimer;
    for (let i = 0; i < 5; i++) {
      const a = t * 2 + i * 1.2;
      const px = cx + Math.cos(a) * 40;
      const py = cy + Math.sin(a) * 20 - i * 6;
      drawHeart(ctx, px, py, 10 + (i % 2) * 4, "#ff8fb1");
    }
    ctx.save();
    ctx.font = "bold 22px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#7a4dff";
    ctx.lineWidth = 4;
    const txt = `${this.meetChar.char.name} присоединяется к команде!`;
    ctx.strokeText(txt, this.W / 2, 100);
    ctx.fillText(txt, this.W / 2, 100);
    ctx.restore();
  }
}

function drawHeart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 10, s / 10);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(0, 0, -10, 0, -10, 6);
  ctx.bezierCurveTo(-10, 12, 0, 16, 0, 20);
  ctx.bezierCurveTo(0, 16, 10, 12, 10, 6);
  ctx.bezierCurveTo(10, 0, 0, 0, 0, 4);
  ctx.fill();
  ctx.restore();
}