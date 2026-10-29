export class Player {
  constructor(charData, x, y) {
    this.char = charData;
    this.w = charData.w;
    this.h = charData.h;
    this.baseW = charData.w;
    this.baseH = charData.h;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.vx = 0;
    this.vy = 0;
    this.prevX = x;
    this.prevY = y;
    this.onGround = false;
    this._wasOnGround = false;
    this.carrier = null;
    this.facing = 1;
    this.hurtTimer = 0;
    this.meetTimer = 0;
    this.animTime = 0;
    this.meetTarget = null;
    this.meetPhase = 0;

    // эффект смолы: замедление
    this.slowTimer = 0;
    this.slowFactor = 1; // 1 = нет замедления, <1 = замедлен
  }

  update(dt, level, input) {
    this.animTime += dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const left = input.isDown("left");
    const right = input.isDown("right");
    const jumpPressed = input.justPressed("jump");

    const slowMul = this.slowTimer > 0 ? this.slowFactor : 1;
    const maxSpeed = this.char.speed * slowMul;
    const accel = maxSpeed * 8;

    if (left && !right) {
      this.vx -= accel * dt;
      this.facing = -1;
    } else if (right && !left) {
      this.vx += accel * dt;
      this.facing = 1;
    } else {
      const fr = this.onGround ? 12 : 3;
      if (Math.abs(this.vx) < 5) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * maxSpeed * fr * dt;
    }
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    if (jumpPressed && this.onGround) {
      this.vy = -this.char.jumpPower;
      this.onGround = false;
    }

    this.vy += 1800 * dt;
    if (this.vy > 1200) this.vy = 1200;

    this.prevX = this.x;
    this.x += this.vx * dt;
    this.resolveX(level);

    this.prevY = this.y;
    this.y += this.vy * dt;
    const wasFalling = this.vy > 0;
    const fallSpeed = this.vy;
    this.resolveY(level);

    const justLanded = this.onGround && !this._wasOnGround;

    // сильное падение ломает хрупкие платформы
    if (justLanded && wasFalling && fallSpeed > 900) {
      this.breakCracked(level, true);
    }

    this._wasOnGround = this.onGround;

    if (this.onGround && this.carrier) {
      this.x += this.carrier.dx || 0;
      this.y += this.carrier.dy || 0;
    }

    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > level.width) { this.x = level.width - this.w; this.vx = 0; }
  }

  // Применяет замедление от смолы.
  // Если эффект уже активен — продлевает его (но не укорачивает),
  // и берёт более сильный фактор из двух.
  applySlow(duration = 1.4, factor = 0.45) {
    if (duration <= 0) return;
    this.slowTimer = Math.max(this.slowTimer, duration);
    this.slowFactor = Math.min(this.slowFactor > 0 ? this.slowFactor : 1, factor);
    if (this.slowFactor <= 0) this.slowFactor = 0.45;
    const cap = this.char.speed * this.slowFactor;
    if (this.vx > cap) this.vx = cap;
    if (this.vx < -cap) this.vx = -cap;
  }

  breakCracked(level, force = false) {
    if (!level || !level.platforms) return;
    if (!force) return;
    for (let i = level.platforms.length - 1; i >= 0; i--) {
      const p = level.platforms[i];
      const isBreakable = p.type === "cracked" || p.type === "candy";
      if (!isBreakable) continue;

      let hit;
      if (p.type === "candy") {
        hit =
          this.x < p.x + p.w &&
          this.x + this.w > p.x &&
          this.y < p.y + p.h &&
          this.y + this.h > p.y;
      } else {
        const feetX = this.x + this.w / 2;
        const feetY = this.y + this.h;
        hit =
          feetX >= p.x &&
          feetX <= p.x + p.w &&
          feetY >= p.y - 6 &&
          feetY <= p.y + p.h;
      }

      if (hit) {
        level.platforms.splice(i, 1);
        if (level.game && level.game.audio) level.game.audio.sfx("hurt");
      }
    }
  }

  resolveX(level) {
    for (const p of level.platforms) {
      if (p.solid === false) continue;
      if (!this.aabb(p)) continue;
      if (this.vx > 0) {
        this.x = p.x - this.w;
        this.vx = 0;
      } else if (this.vx < 0) {
        this.x = p.x + p.w;
        this.vx = 0;
      }
    }
  }

  resolveY(level) {
    this.onGround = false;
    this.carrier = null;

    const prevBottom = this.prevY + this.h;

    for (const p of level.platforms) {
      if (p.solid === false) continue;

      const touchingX = this.x < p.x + p.w && this.x + this.w > p.x;
      if (!touchingX) continue;

      const bottom = this.y + this.h;
      const pdy = p.dy || 0;

      if (this.vy >= 0 && prevBottom <= p.y + 1 - pdy && bottom >= p.y) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
        if (p.type === "moving") this.carrier = p;
        continue;
      }

      if (this.vy < 0) {
        const top = this.y;
        if (top < p.y + p.h && bottom > p.y && this.prevY >= p.y + p.h - 1) {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }
  }

  aabb(b) {
    return this.x < b.x + b.w && this.x + this.w > b.x && this.y < b.y + b.h && this.y + this.h > b.y;
  }

  hurt() {
    this.hurtTimer = 1.0;
  }

  startMeetAnim(target) {
    this.meetTarget = target;
    this.meetTimer = 0;
    this.meetPhase = 0;
    this.vx = 0;
    this.vy = 0;
  }

  updateMeet(dt) {
    this.meetTimer += dt;
    if (this.meetTarget) {
      const dx = this.meetTarget.x - this.x;
      const dy = this.meetTarget.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 90) {
        this.x += (dx / dist) * 80 * dt;
        this.y += (dy / dist) * 40 * dt;
        this.facing = dx > 0 ? 1 : -1;
      } else {
        this.meetPhase = 1;
      }
    }
  }

  render(ctx) {
    ctx.save();
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h;
    ctx.translate(cx, cy);
    const bob = this.onGround ? Math.sin(this.animTime * 8) * 1.5 : 0;
    ctx.translate(0, bob);
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.scale(this.w / 48, this.h / 64);
    this.char.draw(ctx, 0, 0, 1, this.animTime, this.onGround);
    ctx.restore();
  }
}