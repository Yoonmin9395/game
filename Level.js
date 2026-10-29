export class Level {
  constructor(data, game) {
    this.data = data;
    this.game = game;
    this.width = data.width;
    this.height = data.height || 540;
    this.platforms = data.platforms.map(p => ({
      ...p,
      dx: 0, dy: 0, baseX: p.x, baseY: p.y, t: 0,
      crackTimer: p.type === "cracked" ? -1 : 0,
      crackTotal: 2.0,
    }));
    this.items = data.items.map((it, i) => ({ ...it, collected: false, id: i, floatY: Math.random() * Math.PI * 2 }));
    this.hazards = data.hazards.map(h => ({ ...h, _t: Math.random() * (h.interval || 2) }));
    this.finish = data.finish ? { ...data.finish, opened: false } : null;
    this.totalItems = this.items.length;
    this.itemLabel = data.itemLabel || "Предметы";
    this.bg = data.bg;
    this.time = 0;
    this.finishChar = null;

    this._buildings = this._makeBuildings();
    this._fireflies = this._makeFireflies();
    this._trees = this._makeTrees();
  }

  _makeBuildings() {
    const defs = [
      { x: 40,  w: 38, h: 70  },
      { x: 90,  w: 28, h: 100 },
      { x: 130, w: 46, h: 55  },
      { x: 190, w: 32, h: 120 },
      { x: 240, w: 60, h: 80  },
      { x: 320, w: 30, h: 95  },
      { x: 360, w: 44, h: 60  },
      { x: 430, w: 34, h: 110 },
      { x: 490, w: 52, h: 75  },
      { x: 570, w: 26, h: 130 },
      { x: 620, w: 40, h: 85  },
      { x: 690, w: 36, h: 100 },
      { x: 760, w: 48, h: 65  },
      { x: 830, w: 30, h: 115 },
      { x: 890, w: 42, h: 80  },
    ];
    return defs.map(b => {
      const cols = Math.max(1, Math.floor((b.w - 8) / 9));
      const rows = Math.max(1, Math.floor((b.h - 12) / 12));
      const grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) row.push(Math.random() < 0.55);
        grid.push(row);
      }
      return { ...b, cols, rows, grid };
    });
  }

  _makeFireflies() {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * 3600,
        y: 80 + Math.random() * 340,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        r: 1.2 + Math.random() * 1.6,
      });
    }
    return arr;
  }

  _makeTrees() {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: i * 95 + Math.random() * 40,
        w: 18 + Math.random() * 22,
        h: 260 + Math.random() * 220,
        depth: i % 3,
      });
    }
    return arr;
  }

  update(dt, player) {
    this.time += dt;
    for (const p of this.platforms) {
      if (p.type === "moving") {
        p.t += dt * (p.speed || 1);
        const nx = p.baseX + Math.sin(p.t) * (p.rangeX || 0);
        const ny = p.baseY + Math.sin(p.t * 0.8 + 1) * (p.rangeY || 0);
        p.dx = nx - p.x;
        p.dy = ny - p.y;
        p.x = nx;
        p.y = ny;
      }
    }

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      if (p.type !== "cracked") continue;

      const standingOn = this._playerStandsOn(player, p);
      if (standingOn && p.crackTimer < 0) {
        p.crackTimer = p.crackTotal;
        if (this.game && this.game.audio) this.game.audio.sfx("hurt");
      }

      if (p.crackTimer >= 0) {
        p.crackTimer -= dt;
        if (p.crackTimer <= 0) {
          this.platforms.splice(i, 1);
          if (this.game && this.game.audio) this.game.audio.sfx("hurt");
        }
      }
    }

    for (const it of this.items) {
      if (!it.collected) it.floatY += dt * 2;
    }
  }

  // Восстанавливает все выломанные хрупкие платформы на исходные места.
  // Вызывается при смерти игрока (респаун).
  restoreCracked() {
    for (const p of this.data.platforms) {
      if (p.type !== "cracked" && p.type !== "candy") continue;

      const existing = this.platforms.find(
        pl => pl.baseX === p.x && pl.baseY === p.y && pl.w === p.w && pl.h === p.h
      );

      if (existing) {
        // платформа ещё на месте — просто снимаем «заряд» и возвращаем позицию
        existing.crackTimer = -1;
        existing.x = existing.baseX;
        existing.y = existing.baseY;
        existing.dx = 0;
        existing.dy = 0;
        continue;
      }

      // платформа была выломана — восстанавливаем
      this.platforms.push({
        ...p,
        dx: 0, dy: 0, baseX: p.x, baseY: p.y, t: 0,
        crackTimer: p.type === "cracked" ? -1 : 0,
        crackTotal: 2.0,
      });
    }
  }

  _playerStandsOn(player, p) {
    if (!player) return false;
    const feetX = player.x + player.w / 2;
    const feetY = player.y + player.h;
    const inX = feetX >= p.x && feetX <= p.x + p.w;
    const onTop = feetY >= p.y - 4 && feetY <= p.y + Math.min(p.h, 12);
    const falling = player.vy >= 0;
    return inX && onTop && falling;
  }

  renderBackground(ctx, player) {
    if (this.bg.neon) {
      this.drawNeonBackground(ctx, player);
      return;
    }
    if (this.bg.gym) {
      this.drawGymBackground(ctx, player);
      return;
    }
    if (this.bg.candy) {
      this.drawCandyBackground(ctx, player);
      return;
    }
    if (this.bg.forest) {
      this.drawForestBackground(ctx, player);
      return;
    }
    if (this.bg.snow) {
      this.drawSnowBackground(ctx, player);
      return;
    }

    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;

    const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    g.addColorStop(0, bg.sky1);
    g.addColorStop(0.65, bg.sky2);
    g.addColorStop(1, bg.seaFar || "#7a9fd0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.7);

    if (bg.sun) {
      const sx = W * 0.72 - cam * 0.05;
      const sy = H * 0.42;
      ctx.save();
      const sunG = ctx.createRadialGradient(sx, sy, 10, sx, sy, 110);
      sunG.addColorStop(0, "#fff6d0");
      sunG.addColorStop(0.4, bg.sunColor || "#ffe6a7");
      sunG.addColorStop(1, "rgba(255,180,120,0)");
      ctx.fillStyle = sunG;
      ctx.beginPath();
      ctx.arc(sx, sy, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6d0";
      ctx.beginPath();
      ctx.arc(sx, sy, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#ffd8e0";
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 340 - cam * 0.08) % (W + 400)) - 200;
      const cy = 60 + (i % 3) * 40;
      const s = 0.7 + (i % 3) * 0.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 * s, 22 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 40 * s, cy + 6, 45 * s, 18 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 40 * s, cy + 4, 40 * s, 16 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(80,60,90,0.6)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 520 - cam * 0.12 + this.time * 20) % (W + 200)) - 100;
      const by = 90 + i * 28 + Math.sin(this.time * 2 + i) * 6;
      const flap = Math.sin(this.time * 6 + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by + flap);
      ctx.quadraticCurveTo(bx - 5, by - 4, bx, by);
      ctx.quadraticCurveTo(bx + 5, by - 4, bx + 10, by + flap);
      ctx.stroke();
    }
    ctx.restore();

    if (bg.city) this.drawPusanSkyline(ctx, cam, W, H);
    if (bg.beach) this.drawSea(ctx, cam, W, H);
    if (bg.beach) {
      this.drawBeachShore(ctx, cam, W, H);
    } else {
      ctx.fillStyle = bg.far;
      for (let i = -1; i < 8; i++) {
        const baseX = i * 300 - (cam * 0.3) % 300;
        ctx.beginPath();
        ctx.arc(baseX + 150, H * 0.78, 130, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = bg.mid;
      for (let i = -1; i < 10; i++) {
        const baseX = i * 240 - (cam * 0.55) % 240;
        ctx.beginPath();
        ctx.arc(baseX + 120, H * 0.94, 110, Math.PI, 0);
        ctx.fill();
      }
    }
  }

  // ============================================================
  // НЕОНОВАЯ СЦЕНА — фон
  // ============================================================
  drawNeonBackground(ctx, player) {
    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;
    const t = this.time;

    // ночное небо
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg.sky1 || "#1a0a3a");
    g.addColorStop(0.55, bg.sky2 || "#0a0420");
    g.addColorStop(1, "#05020f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // звёзды/искры
    ctx.save();
    for (let i = 0; i < 90; i++) {
      const sx = ((i * 137 - cam * 0.05) % (W + 40) + W + 40) % (W + 40) - 20;
      const sy = (i * 61) % (H * 0.6);
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
      ctx.fillStyle = `rgba(200,180,255,${tw})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.restore();

    // вращающиеся лазерные лучи из-под потолка
    ctx.save();
    const originX = W * 0.5;
    const originY = -40;
    for (let i = 0; i < 7; i++) {
      const baseA = (i / 7) * Math.PI * 0.8 + Math.PI * 0.1;
      const a = baseA + Math.sin(t * 0.6 + i) * 0.25;
      const len = 900;
      const ex = originX + Math.cos(a) * len;
      const ey = originY + Math.sin(a) * len;
      const lg = ctx.createLinearGradient(originX, originY, ex, ey);
      const hue = i % 2 === 0 ? "255,80,220" : "120,80,255";
      lg.addColorStop(0, `rgba(${hue},0.35)`);
      lg.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(originX - 14, originY);
      ctx.lineTo(originX + 14, originY);
      ctx.lineTo(ex + 30, ey);
      ctx.lineTo(ex - 30, ey);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // прожекторы
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const px = ((i * 300 - cam * 0.15) % (W + 400) + W + 400) % (W + 400) - 200;
      const swing = Math.sin(t * 1.2 + i * 1.7) * 60;
      const lg = ctx.createLinearGradient(px, 0, px + swing, H * 0.7);
      lg.addColorStop(0, "rgba(255,240,180,0.16)");
      lg.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(px - 10, 0);
      ctx.lineTo(px + 10, 0);
      ctx.lineTo(px + 120 + swing, H * 0.75);
      ctx.lineTo(px - 120 + swing, H * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a1030";
      ctx.fillRect(px - 14, -4, 28, 10);
      ctx.fillStyle = "rgba(255,240,180,0.95)";
      ctx.beginPath();
      ctx.arc(px, 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // колонки с эквалайзером
    this.drawNeonSpeakers(ctx, cam, W, H);

    // неоновая сетка «танцпола» в глубине сцены
    ctx.save();
    ctx.strokeStyle = "rgba(255,80,220,0.18)";
    ctx.lineWidth = 1.5;
    const gridOff = -(cam * 0.4) % 80;
    for (let x = gridOff - 80; x < W + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.62);
      ctx.lineTo(x + (x - W / 2) * 0.35, H * 0.86);
      ctx.stroke();
    }
    for (let r = 0; r < 6; r++) {
      const y = H * 0.62 + r * r * 4 + r * 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // парящие ноты
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const nx = ((i * 233 - cam * 0.3 + t * 18) % (W + 80) + W + 80) % (W + 80) - 40;
      const ny = H * 0.25 + Math.sin(t * 1.4 + i) * 30 + (i % 4) * 40;
      const col = i % 3 === 0 ? "#7affc9" : i % 3 === 1 ? "#ff7ad9" : "#9a8bff";
      drawNote(ctx, nx, ny, 10 + (i % 3) * 4, col, 0.7 + 0.3 * Math.sin(t * 3 + i));
    }
    ctx.restore();

    // нижняя сцена
    const floorG = ctx.createLinearGradient(0, H * 0.86, 0, H);
    floorG.addColorStop(0, "#160a2a");
    floorG.addColorStop(1, "#08020f");
    ctx.fillStyle = floorG;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);

    // светящаяся кромка сцены
    ctx.fillStyle = "rgba(255,80,220,0.55)";
    ctx.fillRect(0, H * 0.86 - 2, W, 3);
    ctx.fillStyle = "rgba(120,80,255,0.35)";
    ctx.fillRect(0, H * 0.86 + 1, W, 2);
  }

  drawNeonSpeakers(ctx, cam, W, H) {
    ctx.save();
    const t = this.time;
    const off = cam * 0.2;
    for (let i = 0; i < 6; i++) {
      const bx = ((i * 420 - off) % (W + 600) + W + 600) % (W + 600) - 300;
      const baseY = H * 0.88;

      ctx.fillStyle = "#12081f";
      ctx.fillRect(bx, baseY - 150, 90, 150);
      ctx.strokeStyle = "rgba(120,80,255,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 2, baseY - 148, 86, 146);

      for (let d = 0; d < 2; d++) {
        const cy = baseY - 110 + d * 62;
        ctx.fillStyle = "#0a0412";
        ctx.beginPath();
        ctx.arc(bx + 45, cy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = d === 0 ? "#ff4dd2" : "#7a4dff";
        ctx.lineWidth = 2;
        ctx.stroke();
        const pulse = 0.5 + 0.5 * Math.sin(t * 8 + i + d);
        ctx.fillStyle = d === 0
          ? `rgba(255,80,210,${0.25 + pulse * 0.4})`
          : `rgba(130,90,255,${0.25 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(bx + 45, cy, 12 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let e = 0; e < 6; e++) {
        const eh = 8 + (0.5 + 0.5 * Math.sin(t * 6 + i + e * 0.7)) * 40;
        const ex = bx + 8 + e * 13;
        ctx.fillStyle = e % 2 === 0 ? "rgba(122,255,201,0.85)" : "rgba(255,122,217,0.85)";
        ctx.fillRect(ex, baseY - 158 - eh, 8, eh);
      }
    }
    ctx.restore();
  }

  drawForestBackground(ctx, player) {
    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg.sky1);
    g.addColorStop(0.55, bg.sky2);
    g.addColorStop(1, "#0a0f1a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const moonX = W * 0.78 - cam * 0.04;
    const moonY = H * 0.18;
    ctx.save();
    const mg = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 70);
    mg.addColorStop(0, "rgba(230,245,255,0.9)");
    mg.addColorStop(0.35, "rgba(180,210,240,0.55)");
    mg.addColorStop(1, "rgba(120,160,200,0)");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e6f4ff";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,200,220,0.45)";
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 6, 5, 0, Math.PI * 2);
    ctx.arc(moonX + 9, moonY + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 70; i++) {
      const sx = ((i * 137 - cam * 0.02) % (W + 40)) - 20;
      const sy = (i * 53) % (H * 0.5);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 1.5 + i));
      ctx.fillStyle = `rgba(220,240,255,${tw})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.restore();

    this._drawTreeLayer(ctx, cam, W, H, 0.15, 0.35, "#0e1a24", 0);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#7affc9";
    for (let i = 0; i < 5; i++) {
      const fx = ((i * 400 - cam * 0.2 + this.time * 12) % (W + 500)) - 250;
      ctx.beginPath();
      ctx.ellipse(fx, H * 0.62, 220, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this._drawTreeLayer(ctx, cam, W, H, 0.3, 0.6, "#162a20", 1);

    ctx.save();
    for (const f of this._fireflies) {
      const fx = ((f.x - cam * 0.5) % (W + 80) + W + 80) % (W + 80) - 40;
      const fy = f.y + Math.sin(this.time * f.speed + f.phase) * 12;
      const glow = 0.5 + 0.5 * Math.sin(this.time * 2.4 + f.phase);
      ctx.globalAlpha = 0.35 + glow * 0.65;
      const gg = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r * 6);
      gg.addColorStop(0, "rgba(180,255,220,0.9)");
      gg.addColorStop(0.4, "rgba(122,255,201,0.5)");
      gg.addColorStop(1, "rgba(122,255,201,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(fx, fy, f.r * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e6fff4";
      ctx.beginPath();
      ctx.arc(fx, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this._drawTreeLayer(ctx, cam, W, H, 0.7, 1.0, "#0a1a12", 2);

    const floorG = ctx.createLinearGradient(0, H * 0.84, 0, H);
    floorG.addColorStop(0, "#14261a");
    floorG.addColorStop(1, "#0a120c");
    ctx.fillStyle = floorG;
    ctx.fillRect(0, H * 0.84, W, H * 0.16);

    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 30; i++) {
      const mx = ((i * 167 - cam * 0.9) % (W + 40)) - 20;
      const my = H * 0.88 + (i * 13) % (H * 0.1);
      ctx.fillStyle = i % 2 ? "rgba(122,255,201,0.5)" : "rgba(160,220,255,0.4)";
      ctx.beginPath();
      ctx.arc(mx, my, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSnowBackground(ctx, player) {
    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg.sky1);
    g.addColorStop(0.6, bg.sky2);
    g.addColorStop(1, "#7aa8e0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const sx = W * 0.75 - cam * 0.05;
    const sy = H * 0.2;
    ctx.save();
    const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 90);
    sg.addColorStop(0, "rgba(255,255,255,0.9)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(160,200,240,0.7)";
    for (let i = -1; i < 8; i++) {
      const bx = i * 320 - (cam * 0.2) % 320;
      ctx.beginPath();
      ctx.moveTo(bx, H * 0.75);
      ctx.lineTo(bx + 160, H * 0.28);
      ctx.lineTo(bx + 320, H * 0.75);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(120,170,220,0.8)";
    for (let i = -1; i < 10; i++) {
      const bx = i * 260 - (cam * 0.4) % 260;
      ctx.beginPath();
      ctx.moveTo(bx, H * 0.85);
      ctx.lineTo(bx + 130, H * 0.45);
      ctx.lineTo(bx + 260, H * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    for (let i = 0; i < 80; i++) {
      const px = ((i * 137 - cam * 0.6 + this.time * 20) % (W + 40)) - 20;
      const py = ((i * 89 + this.time * (30 + (i % 5) * 10)) % H);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const y = H * 0.82 + Math.sin((x + cam * 0.5) * 0.01) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  _drawTreeLayer(ctx, cam, W, H, parallax, alpha, color, depthFilter) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const off = cam * parallax;
    for (const t of this._trees) {
      if (depthFilter === 0 && t.depth !== 0) continue;
      if (depthFilter === 1 && t.depth !== 1) continue;
      if (depthFilter === 2 && t.depth !== 2) continue;
      const tx = ((t.x - off) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.fillStyle = color;
      ctx.fillRect(tx, H - t.h, t.w, t.h);
      ctx.strokeStyle = color;
      ctx.lineWidth = t.w * 0.35;
      ctx.beginPath();
      ctx.moveTo(tx + t.w * 0.5, H - t.h * 0.7);
      ctx.lineTo(tx - t.w * 1.2, H - t.h * 0.85);
      ctx.moveTo(tx + t.w * 0.5, H - t.h * 0.55);
      ctx.lineTo(tx + t.w * 1.6, H - t.h * 0.7);
      ctx.stroke();
      ctx.fillStyle = depthFilter === 2 ? "rgba(30,70,50,0.5)" : "rgba(20,50,40,0.4)";
      for (let l = 0; l < 3; l++) {
        const lx = tx + Math.sin(t.x + l) * t.w * 1.4;
        const ly = H - t.h + l * 40;
        ctx.beginPath();
        ctx.ellipse(lx, ly, t.w * 1.6, t.w * 0.8, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawCandyBackground(ctx, player) {
    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg.sky1);
    g.addColorStop(0.6, bg.sky2);
    g.addColorStop(1, "#c9a0e8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.35;
    const colors = ["#ff8fb1", "#ffd24d", "#8fd3f4", "#c9a0ff", "#a8e88a"];
    for (let i = 0; i < 90; i++) {
      const px = ((i * 137 - cam * 0.1) % (W + 40)) - 20;
      const py = ((i * 89) % H);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    const off = cam * 0.25;
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 460 - off) % (W + 600)) - 300;
      const sy = H * 0.18;
      ctx.fillStyle = "#e8b8d0";
      ctx.fillRect(sx, sy + 120, 300, 12);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(sx, sy, 300, 120);
      ctx.strokeStyle = "#d98ab0";
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, 300, 120);
      const cakeColors = ["#ff8fb1", "#ffd24d", "#8fd3f4"];
      for (let c = 0; c < 3; c++) {
        const cx = sx + 50 + c * 90;
        const cy = sy + 120;
        ctx.fillStyle = cakeColors[c];
        ctx.fillRect(cx - 24, cy - 40, 48, 40);
        ctx.fillStyle = "#fff";
        ctx.fillRect(cx - 24, cy - 46, 48, 8);
        ctx.fillStyle = "#ff5a8a";
        ctx.beginPath();
        ctx.arc(cx, cy - 52, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    const off2 = cam * 0.4;
    for (let i = 0; i < 5; i++) {
      const px = ((i * 560 - off2 + 100) % (W + 700)) - 350;
      ctx.fillStyle = "#d9a8e8";
      ctx.fillRect(px, 0, 40, H * 0.5);
      ctx.fillStyle = "#c98ab0";
      ctx.fillRect(px - 6, H * 0.5 - 20, 52, 20);
      ctx.fillStyle = "#fff";
      for (let d = 0; d < 4; d++) {
        ctx.beginPath();
        ctx.arc(px + 8 + d * 8, H * 0.5 + 8 + (d % 2) * 6, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    const floorG = ctx.createLinearGradient(0, H * 0.78, 0, H);
    floorG.addColorStop(0, "#f4d9e8");
    floorG.addColorStop(1, "#d9a8c9");
    ctx.fillStyle = floorG;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    ctx.save();
    ctx.globalAlpha = 0.25;
    const tile = 60;
    const startX = -((cam * 0.6) % tile);
    for (let x = startX; x < W + tile; x += tile) {
      for (let r = 0; r < 2; r++) {
        if (((Math.floor(x / tile) + r) % 2) === 0) {
          ctx.fillStyle = "#c98ab0";
          ctx.fillRect(x, H * 0.78 + r * 30, tile, 30);
        }
      }
    }
    ctx.restore();

    ctx.save();
    const off3 = cam * 1.0;
    for (let i = 0; i < 8; i++) {
      const px = ((i * 340 - off3 + 40) % (W + 400)) - 200;
      const py = H * 0.9;
      const kind = i % 3;
      if (kind === 0) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(px, py - 20, 4, 24);
        const cg = ctx.createRadialGradient(px + 2, py - 26, 2, px + 2, py - 26, 14);
        cg.addColorStop(0, "#ffd6e6");
        cg.addColorStop(0.5, "#ff8fb1");
        cg.addColorStop(1, "#ff5a8a");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(px + 2, py - 26, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 1) {
        ctx.fillStyle = "#ffd24d";
        ctx.beginPath();
        ctx.ellipse(px + 14, py - 8, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8fb1";
        ctx.beginPath();
        ctx.moveTo(px - 2, py - 8);
        ctx.lineTo(px - 12, py - 16);
        ctx.lineTo(px - 12, py);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 30, py - 8);
        ctx.lineTo(px + 40, py - 16);
        ctx.lineTo(px + 40, py);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#c98a5a";
        ctx.fillRect(px, py - 16, 22, 16);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px + 11, py - 16, 11, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ff5a8a";
        ctx.beginPath();
        ctx.arc(px + 11, py - 26, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawGymBackground(ctx, player) {
    const W = this.game.W;
    const H = this.game.H;
    const cam = this.camera(player);
    const bg = this.bg;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg.sky1);
    g.addColorStop(0.6, bg.sky2);
    g.addColorStop(1, "#241d38");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#1a1430";
    const stripeOff = -(cam * 0.15) % 160;
    for (let x = stripeOff - 160; x < W + 160; x += 160) {
      ctx.fillRect(x, 0, 70, H);
    }
    ctx.restore();

    ctx.save();
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 260 - cam * 0.25) % (W + 300)) - 150;
      const sy = 24;
      ctx.fillStyle = "#0e0a1a";
      ctx.fillRect(sx - 16, sy - 10, 32, 14);
      ctx.fillStyle = "rgba(255,240,180,0.9)";
      ctx.beginPath();
      ctx.arc(sx, sy + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,240,180,0.06)";
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy + 8);
      ctx.lineTo(sx + 7, sy + 8);
      ctx.lineTo(sx + 120, H * 0.7);
      ctx.lineTo(sx - 120, H * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    this.drawGymEquipmentBack(ctx, cam, W, H);
    this.drawGymMirrors(ctx, cam, W, H);
    this.drawGymRopes(ctx, cam, W, H);
    this.drawGymEquipmentFront(ctx, cam, W, H);
    this.drawRingBackdrop(ctx, cam, W, H);
    this.drawGymPunchingBags(ctx, cam, W, H);

    const floorG = ctx.createLinearGradient(0, H * 0.82, 0, H);
    floorG.addColorStop(0, "#4a3a5a");
    floorG.addColorStop(1, "#241d38");
    ctx.fillStyle = floorG;
    ctx.fillRect(0, H * 0.82, W, H * 0.18);

    ctx.save();
    ctx.strokeStyle = "rgba(255,220,150,0.25)";
    ctx.lineWidth = 2;
    for (let x = -(cam % 200); x < W; x += 200) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.85);
      ctx.lineTo(x + 100, H * 0.85);
      ctx.stroke();
    }
    ctx.restore();

    this.drawGymFloorProps(ctx, cam, W, H);
  }

  drawGymMirrors(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 0.2;
    for (let i = 0; i < 7; i++) {
      const mx = ((i * 340 - off) % (W + 400)) - 200;
      const my = H * 0.18;
      const mw = 160;
      const mh = 110;
      ctx.fillStyle = "#5a4a7a";
      ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
      const mg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
      mg.addColorStop(0, "rgba(200,230,255,0.35)");
      mg.addColorStop(0.5, "rgba(160,200,255,0.18)");
      mg.addColorStop(1, "rgba(120,160,220,0.3)");
      ctx.fillStyle = mg;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx + 18, my + mh - 12);
      ctx.lineTo(mx + mw - 18, my + 12);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,240,180,0.15)";
      ctx.beginPath();
      ctx.arc(mx + mw * 0.7, my + mh * 0.3, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const px = ((i * 420 - cam * 0.2 + 180) % (W + 500)) - 250;
      const py = H * 0.2;
      ctx.fillStyle = "#c94a5a";
      ctx.fillRect(px, py, 70, 90);
      ctx.fillStyle = "#fff3a0";
      ctx.fillRect(px + 8, py + 10, 54, 40);
      ctx.fillStyle = "#3a2a4a";
      ctx.beginPath();
      ctx.arc(px + 35, py + 30, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd24d";
      ctx.fillRect(px + 10, py + 60, 50, 6);
      ctx.fillRect(px + 10, py + 72, 34, 5);
    }
    ctx.restore();
  }

  drawGymRopes(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 0.3;
    for (let i = 0; i < 6; i++) {
      const rx = ((i * 380 - off + 60) % (W + 500)) - 250;
      const ry = H * 0.34;
      ctx.fillStyle = "#8a8aa0";
      ctx.fillRect(rx - 2, ry - 10, 4, 10);
      ctx.strokeStyle = "#a86a3a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 10, ry + 50, rx + 4, ry + 120);
      ctx.stroke();
      ctx.fillStyle = "#7a4d3a";
      ctx.beginPath();
      ctx.ellipse(rx + 4, ry + 122, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawGymEquipmentBack(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 0.35;
    const baseY = H * 0.78;
    for (let i = 0; i < 5; i++) {
      const tx = ((i * 420 - off) % (W + 500)) - 250;
      this.drawTreadmill(ctx, tx, baseY - 70, 0.9, false);
    }
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 520 - off + 200) % (W + 600)) - 300;
      this.drawBike(ctx, bx, baseY - 60, 0.9);
    }
    for (let i = 0; i < 5; i++) {
      const sx = ((i * 460 - off + 90) % (W + 500)) - 250;
      this.drawPlateRack(ctx, sx, baseY - 80, 0.9);
    }
    ctx.restore();
  }

  drawGymEquipmentFront(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 0.55;
    const baseY = H * 0.9;
    for (let i = 0; i < 4; i++) {
      const sx = ((i * 560 - off + 120) % (W + 700)) - 350;
      this.drawBench(ctx, sx, baseY - 40, 1.0);
    }
    for (let i = 0; i < 4; i++) {
      const sx = ((i * 640 - off + 300) % (W + 700)) - 350;
      this.drawSquatRack(ctx, sx, baseY - 120, 1.0);
    }
    for (let i = 0; i < 3; i++) {
      const mx = ((i * 760 - off + 420) % (W + 800)) - 400;
      this.drawPecDeck(ctx, mx, baseY - 100, 1.0);
    }
    ctx.restore();
  }

  drawGymPunchingBags(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 0.45;
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 520 - off + 60) % (W + 600)) - 300;
      const topY = 40;
      const swing = Math.sin(this.time * 1.5 + i) * 8;
      this.drawPunchingBag(ctx, bx, topY, swing, 1.0);
    }
    ctx.restore();
  }

  drawGymFloorProps(ctx, cam, W, H) {
    ctx.save();
    const off = cam * 1.0;
    const floorY = H * 0.92;
    for (let i = 0; i < 8; i++) {
      const px = ((i * 340 - off + 40) % (W + 400)) - 200;
      const kind = i % 4;
      if (kind === 0) {
        this.drawDumbbell(ctx, px, floorY, 1.1);
        this.drawDumbbell(ctx, px + 40, floorY - 4, 0.9);
      } else if (kind === 1) {
        this.drawBarbell(ctx, px, floorY - 6, 1.2);
      } else if (kind === 2) {
        this.drawKettlebell(ctx, px, floorY, 1.0);
        this.drawPlate(ctx, px + 44, floorY + 2, 14, "#c94a5a");
      } else {
        this.drawBench(ctx, px, floorY - 30, 0.9);
      }
    }
    for (let i = 0; i < 6; i++) {
      const mx = ((i * 300 - off * 0.8) % (W + 400)) - 200;
      ctx.fillStyle = i % 2 === 0 ? "rgba(120,90,150,0.35)" : "rgba(90,70,120,0.35)";
      ctx.fillRect(mx, H * 0.88, 120, 22);
      ctx.strokeStyle = "rgba(255,220,150,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + 2, H * 0.88 + 2, 116, 18);
    }
    ctx.restore();
  }

  drawTreadmill(ctx, x, y, scale = 1, front = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#3a2f55";
    ctx.fillRect(0, 20, 90, 10);
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(0, 10, 90, 12);
    ctx.fillStyle = "#1a1420";
    ctx.fillRect(6, 12, 78, 6);
    ctx.fillStyle = "#8a8aa0";
    ctx.fillRect(78, -40, 6, 60);
    ctx.fillRect(6, -40, 6, 60);
    ctx.fillStyle = "#c9c9d6";
    ctx.fillRect(4, -44, 84, 6);
    ctx.fillStyle = "#0e0a1a";
    ctx.fillRect(60, -62, 34, 18);
    ctx.fillStyle = "#6bd9ff";
    ctx.fillRect(64, -58, 26, 10);
    ctx.restore();
  }

  drawBike(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#8a8aa0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(20, 30, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(70, 30, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#c94a5a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(45, 0);
    ctx.lineTo(70, 30);
    ctx.moveTo(45, 0);
    ctx.lineTo(45, -30);
    ctx.stroke();
    ctx.fillStyle = "#3a2f55";
    ctx.fillRect(36, -34, 18, 6);
    ctx.strokeStyle = "#8a8aa0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(45, -30);
    ctx.lineTo(60, -40);
    ctx.lineTo(70, -40);
    ctx.stroke();
    ctx.fillStyle = "#ffd24d";
    ctx.beginPath();
    ctx.arc(45, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPlateRack(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(0, 0, 8, 80);
    ctx.fillRect(60, 0, 8, 80);
    ctx.fillRect(0, 76, 68, 6);
    const colors = ["#c94a5a", "#6bd9ff", "#ffd24d", "#a98bff"];
    for (let i = 0; i < 4; i++) {
      this.drawPlate(ctx, 20 + i * 12, 20 + (i % 2) * 30, 12, colors[i]);
    }
    ctx.restore();
  }

  drawBench(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#3a2f55";
    ctx.fillRect(8, 20, 6, 24);
    ctx.fillRect(76, 20, 6, 24);
    ctx.fillStyle = "#c94a5a";
    ctx.fillRect(0, 12, 90, 10);
    ctx.fillStyle = "#8a8aa0";
    ctx.fillRect(-6, 0, 6, 40);
    ctx.fillRect(90, 0, 6, 40);
    ctx.strokeStyle = "#c9c9d6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(100, 4);
    ctx.stroke();
    this.drawPlate(ctx, -4, 4, 10, "#6bd9ff");
    this.drawPlate(ctx, 88, 4, 10, "#6bd9ff");
    ctx.restore();
  }

  drawSquatRack(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(0, 0, 8, 120);
    ctx.fillRect(100, 0, 8, 120);
    ctx.fillRect(0, 0, 108, 8);
    ctx.strokeStyle = "#c9c9d6";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14, 30);
    ctx.lineTo(122, 30);
    ctx.stroke();
    this.drawPlate(ctx, -8, 30, 16, "#c94a5a");
    this.drawPlate(ctx, 116, 30, 16, "#c94a5a");
    this.drawPlate(ctx, -14, 30, 10, "#ffd24d");
    this.drawPlate(ctx, 122, 30, 10, "#ffd24d");
    ctx.fillStyle = "#8a8aa0";
    ctx.fillRect(4, 24, 6, 12);
    ctx.fillRect(98, 24, 6, 12);
    ctx.restore();
  }

  drawPecDeck(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#3a2f55";
    ctx.fillRect(10, 70, 80, 10);
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(40, 0, 20, 70);
    ctx.fillStyle = "#c94a5a";
    ctx.fillRect(30, 60, 40, 12);
    ctx.fillStyle = "#8a8aa0";
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(0, 40);
    ctx.lineTo(10, 50);
    ctx.lineTo(40, 36);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(60, 20);
    ctx.lineTo(100, 40);
    ctx.lineTo(90, 50);
    ctx.lineTo(60, 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#c9c9d6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(40, 70);
    ctx.moveTo(90, 50);
    ctx.lineTo(60, 70);
    ctx.stroke();
    ctx.restore();
  }

  drawPunchingBag(ctx, x, topY, swing, scale = 1) {
    ctx.save();
    ctx.translate(x + swing, topY);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#8a8aa0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 40);
    ctx.stroke();
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(-8, 0, 16, 8);
    const g = ctx.createLinearGradient(0, 40, 0, 130);
    g.addColorStop(0, "#c94a5a");
    g.addColorStop(1, "#8a2a3a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 90, 18, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(-6, 78, 5, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6a1a2a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(0, 130);
    ctx.stroke();
    ctx.restore();
  }

  drawDumbbell(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#8a8aa0";
    ctx.fillRect(-14, -3, 28, 6);
    ctx.fillStyle = "#3a2f55";
    ctx.fillRect(-20, -10, 8, 20);
    ctx.fillRect(12, -10, 8, 20);
    ctx.fillStyle = "#5a4a7a";
    ctx.fillRect(-22, -12, 4, 24);
    ctx.fillRect(18, -12, 4, 24);
    ctx.restore();
  }

  drawBarbell(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#c9c9d6";
    ctx.fillRect(-40, -2, 80, 4);
    this.drawPlate(ctx, -34, 0, 16, "#c94a5a");
    this.drawPlate(ctx, 34, 0, 16, "#c94a5a");
    this.drawPlate(ctx, -40, 0, 10, "#ffd24d");
    this.drawPlate(ctx, 40, 0, 10, "#ffd24d");
    ctx.restore();
  }

  drawPlate(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawKettlebell(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#3a2f55";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, -10, 8, Math.PI, 0);
    ctx.stroke();
    const g = ctx.createLinearGradient(0, -6, 0, 20);
    g.addColorStop(0, "#5a4a7a");
    g.addColorStop(1, "#2a2340");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(-4, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRingBackdrop(ctx, cam, W, H) {
    const ringWorldX = 1500;
    const off = cam * 0.6;
    const rx = ringWorldX - off;
    const ry = H * 0.52;

    ctx.save();
    ctx.fillStyle = "#8a2a3a";
    ctx.fillRect(rx, ry, 520, 26);
    ctx.fillStyle = "#6a1a2a";
    ctx.fillRect(rx, ry + 26, 520, 8);

    const posts = [rx, rx + 500];
    ctx.fillStyle = "#e8d8a0";
    for (const px of posts) {
      ctx.fillRect(px, ry - 120, 8, 120);
      ctx.fillStyle = "#c9b060";
      ctx.beginPath();
      ctx.arc(px + 4, ry - 124, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8d8a0";
    }

    ctx.strokeStyle = "#ff5a6a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const y = ry - 30 - i * 30;
      ctx.beginPath();
      ctx.moveTo(rx + 4, y);
      ctx.lineTo(rx + 504, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#c94a5a";
    ctx.fillRect(rx + 10, ry - 6, 500, 6);
    ctx.restore();
  }

  drawPusanSkyline(ctx, cam, W, H) {
    const baseY = H * 0.66;
    const off = cam * 0.18;
    const skylineColor = "rgba(58,38,78,0.85)";
    const windowColor = "rgba(255,220,150,0.6)";

    ctx.save();
    for (const b of this._buildings) {
      const raw = b.x - off;
      const bx = ((raw % 1100) + 1100) % 1100 - 100;
      ctx.fillStyle = skylineColor;
      ctx.fillRect(bx, baseY - b.h, b.w, b.h);
      ctx.fillStyle = windowColor;
      const gapX = 4, gapY = 5;
      const cellW = Math.max(4, (b.w - gapX * 2) / b.cols);
      const cellH = Math.max(5, (b.h - gapY * 2) / b.rows);
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          if (!b.grid[r][c]) continue;
          const wx = bx + gapX + c * cellW + cellW * 0.2;
          const wy = baseY - b.h + gapY + r * cellH + cellH * 0.15;
          const ww = cellW * 0.55;
          const wh = cellH * 0.55;
          if (wx + ww > bx + b.w - 2) continue;
          if (wy + wh > baseY - 4) continue;
          ctx.fillRect(wx, wy, ww, wh);
        }
      }
    }

    const mraw = 520 - off;
    const mbx = ((mraw % 1100) + 1100) % 1100 - 100;
    ctx.fillStyle = "rgba(58,38,78,0.9)";
    ctx.fillRect(mbx + 180, baseY - 90, 8, 90);
    ctx.fillRect(mbx + 340, baseY - 90, 8, 90);
    ctx.fillRect(mbx, baseY - 12, 500, 6);
    ctx.strokeStyle = "rgba(58,38,78,0.75)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(mbx + 184, baseY - 90);
      ctx.lineTo(mbx + 40 + i * 20, baseY - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mbx + 344, baseY - 90);
      ctx.lineTo(mbx + 460 + (i - 4) * 20, baseY - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSea(ctx, cam, W, H) {
    const bg = this.bg;
    const seaTop = H * 0.66;
    const seaH = H * 0.34;

    const g = ctx.createLinearGradient(0, seaTop, 0, H);
    g.addColorStop(0, bg.seaFar || "#7a9fd0");
    g.addColorStop(1, bg.sea || "#5a7fb8");
    ctx.fillStyle = g;
    ctx.fillRect(0, seaTop, W, seaH);

    const sunX = W * 0.72 - cam * 0.05;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffe6a0";
    for (let i = 0; i < 18; i++) {
      const y = seaTop + i * 6;
      const w = 90 - i * 4;
      const x = sunX - w / 2 + Math.sin(this.time * 1.5 + i) * 6;
      ctx.fillRect(x, y, w, 3);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    for (let row = 0; row < 5; row++) {
      const y = seaTop + 20 + row * 30;
      ctx.beginPath();
      for (let x = -40; x < W + 40; x += 8) {
        const wave = Math.sin((x + cam * 0.4 + this.time * 40) * 0.04 + row) * 3;
        if (x === -40) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  drawBeachShore(ctx, cam, W, H) {
    const bg = this.bg;
    const shoreTop = H * 0.78;

    ctx.save();
    const g = ctx.createLinearGradient(0, shoreTop, 0, H);
    g.addColorStop(0, bg.sand || "#e8c896");
    g.addColorStop(1, bg.sandDark || "#c9a06a");
    ctx.fillStyle = g;
    ctx.fillRect(0, shoreTop, W, H - shoreTop);

    ctx.beginPath();
    ctx.moveTo(0, shoreTop);
    for (let x = 0; x <= W; x += 10) {
      const y = shoreTop + Math.sin((x + cam * 0.55 + this.time * 20) * 0.02) * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, shoreTop - 30);
    ctx.lineTo(0, shoreTop - 30);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();

    ctx.fillStyle = "rgba(120,80,40,0.15)";
    for (let i = 0; i < 220; i++) {
      const px = ((i * 137 - cam * 0.55) % (W + 60)) - 30;
      const py = shoreTop + 8 + ((i * 53) % (H - shoreTop - 16));
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  render(ctx, cam) {
    ctx.save();
    ctx.translate(-(cam || 0), 0);

    for (const p of this.platforms) {
      if (p.type === "cracked") {
        if (this.bg.neon) {
          this.drawNeonCracked(ctx, p);
        } else if (this.bg.forest) {
          this.drawForestCracked(ctx, p);
        } else if (this.bg.snow) {
          this.drawSnowCracked(ctx, p);
        } else {
          this.drawCracked(ctx, p);
        }
      } else if (p.type === "candy") {
        if (this.bg.neon) {
          this.drawNeonCrystal(ctx, p);
        } else {
          this.drawCandyBlock(ctx, p);
        }
      } else if (p.type === "moving") {
        if (this.bg.neon) {
          this.drawNeonPlatform(ctx, p, true);
        } else if (this.bg.forest) {
          this.drawForestPlatform(ctx, p);
        } else if (this.bg.snow) {
          this.drawSnowPlatform(ctx, p);
        } else {
          this.drawPlatform(ctx, p, "#b9e6ff", "#6fa8dc", false);
        }
      } else if (this.bg.candy) {
        this.drawCandyPlatform(ctx, p);
      } else if (this.bg.forest) {
        this.drawForestPlatform(ctx, p);
      } else if (this.bg.snow) {
        this.drawSnowPlatform(ctx, p);
      } else if (this.bg.neon) {
        this.drawNeonPlatform(ctx, p, false);
      } else {
        this.drawPlatform(ctx, p, this.bg.platform1 || "#ffd9a8", this.bg.platform2 || "#e0a866", false);
      }
    }

    for (const h of this.hazards) this.drawHazard(ctx, h);

    for (const it of this.items) {
      if (it.collected) continue;
      const bob = Math.sin(it.floatY) * 5;
      drawStar(ctx, it.x + it.w / 2, it.y + it.h / 2 + bob, it.w / 2, "#fff3a0", "#ffd24d");
    }

    if (this.finish) this.drawFinish(ctx, this.finish);

    ctx.restore();
  }

  renderForeground(ctx, player) {}

  // ============================================================
  // НЕОНОВАЯ СЦЕНА — платформы
  // ============================================================
  drawNeonPlatform(ctx, p, moving = false) {
    ctx.save();
    const t = this.time;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + p.x * 0.02);

    if (p.h > 26) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }

    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, moving ? "#2a1050" : "#1e0d3a");
    g.addColorStop(0.6, "#150828");
    g.addColorStop(1, "#0a0418");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.strokeStyle = moving
      ? `rgba(122,255,201,${0.65 + pulse * 0.35})`
      : `rgba(255,80,220,${0.65 + pulse * 0.35})`;
    ctx.lineWidth = 2.5;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.stroke();

    ctx.strokeStyle = moving ? "rgba(122,255,201,0.35)" : "rgba(255,80,220,0.35)";
    ctx.lineWidth = 1.2;
    roundRect(ctx, p.x + 4, p.y + 3, p.w - 8, p.h - 6, 6);
    ctx.stroke();

    ctx.fillStyle = moving ? "rgba(160,255,220,0.85)" : "rgba(255,150,235,0.85)";
    ctx.fillRect(p.x + 6, p.y - 1, p.w - 12, 2);

    if (moving) {
      ctx.save();
      ctx.strokeStyle = `rgba(180,255,230,${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      const cy = p.y + p.h / 2;
      for (let i = 0; i < 3; i++) {
        const x = p.x + p.w / 2 - 12 + i * 12;
        ctx.beginPath();
        ctx.moveTo(x, cy - 4);
        ctx.lineTo(x + 6, cy);
        ctx.lineTo(x, cy + 4);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawNeonCracked(ctx, p) {
    ctx.save();
    const t = this.time;
    const armed = p.crackTimer >= 0;
    const ratio = armed ? Math.max(0, p.crackTimer / p.crackTotal) : 1;
    const panic = armed ? (1 - ratio) : 0;
    const shake = armed ? Math.sin(t * 40) * (1 + panic * 3) : 0;
    ctx.translate(shake, 0);

    if (p.h > 26) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }

    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, armed ? mixColor("#3a1050", "#6a1030", panic) : "#2a0a4a");
    g.addColorStop(1, armed ? mixColor("#150828", "#2a0410", panic) : "#12061f");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    const borderCol = armed
      ? `rgba(255,${Math.round(200 - panic * 160)},${Math.round(120 - panic * 100)},0.85)`
      : "rgba(180,120,255,0.85)";
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 2.5;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.stroke();

    ctx.strokeStyle = armed ? "rgba(255,80,80,0.9)" : "rgba(140,90,220,0.7)";
    ctx.lineWidth = 1.8;
    const n = Math.max(2, Math.floor(p.w / 30));
    for (let i = 0; i < n; i++) {
      const cx = p.x + 10 + i * ((p.w - 20) / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(cx, p.y + 2);
      ctx.lineTo(cx + 4, p.y + p.h * 0.45);
      ctx.lineTo(cx - 3, p.y + p.h * 0.7);
      ctx.lineTo(cx + 2, p.y + p.h - 2);
      ctx.stroke();
    }

    if (armed) {
      const barY = p.y - 9;
      const barW = p.w - 8;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      roundRect(ctx, p.x + 4, barY, barW, 4, 2);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? "#ffd24d" : "#ff5a6a";
      roundRect(ctx, p.x + 4, barY, barW * ratio, 4, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawNeonCrystal(ctx, p) {
    ctx.save();
    const t = this.time;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + p.x * 0.05);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(p.x + 3, p.y + p.h - 3, p.w, 6);

    const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    g.addColorStop(0, "#ff4dd2");
    g.addColorStop(0.5, "#7a4dff");
    g.addColorStop(1, "#ff4dd2");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    roundRect(ctx, p.x + 3, p.y + 3, p.w - 6, p.h - 6, 4);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.2;
    for (let y = p.y + 10; y < p.y + p.h - 6; y += 14) {
      ctx.beginPath();
      ctx.moveTo(p.x + 5, y);
      ctx.lineTo(p.x + p.w - 5, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.25 + pulse * 0.3;
    ctx.fillStyle = "#ff8fe6";
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSnowPlatform(ctx, p) {
    ctx.save();
    if (p.h > 24) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.6, "#dcefff");
    g.addColorStop(1, "#a8cdee");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    for (let x = p.x; x < p.x + p.w; x += 7) {
      const hgt = 2 + Math.sin(this.time * 2 + x * 0.2) * 1.5;
      ctx.rect(x, p.y - hgt, 7, hgt + 2);
    }
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 2);
    ctx.restore();
  }

  drawSnowCracked(ctx, p) {
    ctx.save();
    const wobble = Math.sin(this.time * 3 + p.x * 0.01) * 1.2;
    ctx.translate(0, wobble);

    const armed = p.crackTimer >= 0;
    const ratio = armed ? Math.max(0, p.crackTimer / p.crackTotal) : 1;
    const panic = armed ? (1 - ratio) : 0;
    const shake = armed ? Math.sin(this.time * 40) * (1 + panic * 3) : 0;
    ctx.translate(shake, 0);

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
    ctx.fill();

    const topC = armed ? mixColor("#ffffff", "#ff9aa8", panic) : "#ffffff";
    const botC = armed ? mixColor("#a8cdee", "#c95a6a", panic) : "#a8cdee";
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, topC);
    g.addColorStop(0.55, botC);
    g.addColorStop(1, "#7aa8d0");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.strokeStyle = armed ? "#a03a4a" : "#7aa8d0";
    ctx.lineWidth = 2.5;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.stroke();

    ctx.strokeStyle = armed ? "#6a1a2a" : "#5a8ab0";
    ctx.lineWidth = 2;
    const n = Math.max(2, Math.floor(p.w / 30));
    for (let i = 0; i < n; i++) {
      const cx = p.x + 10 + i * ((p.w - 20) / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(cx, p.y + 2);
      ctx.lineTo(cx + 4, p.y + p.h * 0.45);
      ctx.lineTo(cx - 3, p.y + p.h * 0.7);
      ctx.lineTo(cx + 2, p.y + p.h - 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    for (let x = p.x; x < p.x + p.w; x += 7) {
      const hgt = 2 + Math.sin(this.time * 3 + x * 0.2) * 1.5;
      ctx.rect(x, p.y - hgt, 7, hgt + 2);
    }
    ctx.fill();

    if (armed) {
      const barY = p.y - 9;
      const barW = p.w - 8;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, p.x + 4, barY, barW, 4, 2);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? "#ffd24d" : "#ff5a6a";
      roundRect(ctx, p.x + 4, barY, barW * ratio, 4, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawForestPlatform(ctx, p) {
    ctx.save();
    if (p.h > 24) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, "#3a5a4a");
    g.addColorStop(0.5, "#2a4a3a");
    g.addColorStop(1, "#1a2a22");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(10,20,12,0.7)";
    ctx.lineWidth = 1.5;
    for (let x = p.x + 8; x < p.x + p.w - 4; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, p.y + 3);
      ctx.lineTo(x + 4, p.y + p.h - 3);
      ctx.stroke();
    }

    ctx.fillStyle = "#4a7a5a";
    ctx.beginPath();
    for (let x = p.x; x < p.x + p.w; x += 8) {
      const hgt = 2 + Math.sin(this.time * 2 + x * 0.1) * 1.5;
      ctx.rect(x, p.y - hgt, 8, hgt + 2);
    }
    ctx.fill();

    if (p.w > 60) {
      ctx.fillStyle = "#7affc9";
      ctx.beginPath();
      ctx.arc(p.x + 10, p.y - 2, 3, 0, Math.PI * 2);
      ctx.arc(p.x + p.w - 10, p.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(p.x + 10, p.y - 2, 7, 0, Math.PI * 2);
      ctx.arc(p.x + p.w - 10, p.y - 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawForestCracked(ctx, p) {
    ctx.save();
    const wobble = Math.sin(this.time * 3 + p.x * 0.01) * 1.2;
    ctx.translate(0, wobble);

    const armed = p.crackTimer >= 0;
    const ratio = armed ? Math.max(0, p.crackTimer / p.crackTotal) : 1;
    const panic = armed ? (1 - ratio) : 0;
    const shake = armed ? Math.sin(this.time * 40) * (1 + panic * 3) : 0;
    ctx.translate(shake, 0);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
    ctx.fill();

    const topC = armed ? mixColor("#5a7a5a", "#a05a5a", panic) : "#5a7a5a";
    const botC = armed ? mixColor("#2a3a2a", "#5a2a2a", panic) : "#2a3a2a";
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, topC);
    g.addColorStop(0.55, botC);
    g.addColorStop(1, "#1a221a");
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.strokeStyle = armed ? "#2a0a0a" : "#0a1a0a";
    ctx.lineWidth = 2;
    const n = Math.max(2, Math.floor(p.w / 30));
    for (let i = 0; i < n; i++) {
      const cx = p.x + 10 + i * ((p.w - 20) / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(cx, p.y + 2);
      ctx.lineTo(cx + 4, p.y + p.h * 0.45);
      ctx.lineTo(cx - 3, p.y + p.h * 0.7);
      ctx.lineTo(cx + 2, p.y + p.h - 2);
      ctx.stroke();
    }

    ctx.fillStyle = armed ? mixColor("#4a8a5a", "#8a3a3a", panic) : "#4a8a5a";
    ctx.beginPath();
    for (let x = p.x; x < p.x + p.w; x += 7) {
      const hgt = 2 + Math.sin(this.time * 3 + x * 0.2) * 1.5;
      ctx.rect(x, p.y - hgt, 7, hgt + 2);
    }
    ctx.fill();

    if (!armed && p.w > 50) {
      ctx.fillStyle = "rgba(122,255,201,0.9)";
      ctx.beginPath();
      ctx.arc(p.x + 8, p.y - 2, 2.4, 0, Math.PI * 2);
      ctx.arc(p.x + p.w - 8, p.y - 2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (armed) {
      ctx.strokeStyle = `rgba(255,140,100,${0.35 + panic * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const cx = p.x + 12 + i * 18;
        ctx.moveTo(cx, p.y + 4);
        ctx.lineTo(cx + 3, p.y + p.h - 4);
      }
      ctx.stroke();

      const barY = p.y - 9;
      const barW = p.w - 8;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundRect(ctx, p.x + 4, barY, barW, 4, 2);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? "#ffd24d" : "#ff5a6a";
      roundRect(ctx, p.x + 4, barY, barW * ratio, 4, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCandyPlatform(ctx, p) {
    const style = p.style || "biscuit";
    const r = 10;
    ctx.save();

    if (p.h > 30) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }

    if (style === "wafer") {
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      g.addColorStop(0, "#f2c48a");
      g.addColorStop(1, "#d99a4a");
      ctx.fillStyle = g;
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.clip();
      ctx.strokeStyle = "rgba(140,80,30,0.5)";
      ctx.lineWidth = 1.5;
      for (let x = p.x; x < p.x + p.w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
        ctx.stroke();
      }
      for (let y = p.y; y < p.y + p.h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.w, y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = "#fff6e8";
      roundRect(ctx, p.x + 4, p.y + 2, p.w - 8, 4, 2);
      ctx.fill();
    } else if (style === "cream") {
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      g.addColorStop(0, "#fffafc");
      g.addColorStop(1, "#ffd6e6");
      ctx.fillStyle = g;
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.fill();

      ctx.strokeStyle = "#ffb3c9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = p.x + 10; x < p.x + p.w - 6; x += 16) {
        ctx.moveTo(x, p.y + p.h * 0.5);
        ctx.quadraticCurveTo(x + 4, p.y + 4, x + 8, p.y + p.h * 0.5);
        ctx.quadraticCurveTo(x + 12, p.y + p.h - 4, x + 16, p.y + p.h * 0.5);
      }
      ctx.stroke();

      ctx.fillStyle = "#ff8fb1";
      ctx.beginPath();
      ctx.arc(p.x + p.w - 12, p.y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      g.addColorStop(0, "#f0c48a");
      g.addColorStop(0.6, "#d9a05a");
      g.addColorStop(1, "#b97a3a");
      ctx.fillStyle = g;
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.fill();

      ctx.fillStyle = "rgba(120,70,30,0.35)";
      for (let i = 0; i < p.w; i += 18) {
        const dx = p.x + 8 + (i % Math.max(12, p.w - 16));
        const dy = p.y + 6 + ((i * 7) % Math.max(6, p.h - 12));
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ff5a8a";
      ctx.fillRect(p.x + 4, p.y + p.h * 0.45, p.w - 8, Math.max(3, p.h * 0.12));

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(p.x + 5, p.y + 2, p.w - 10, 2);
    }

    ctx.restore();
  }

  drawPlatform(ctx, p, c1, c2, cracked) {
    const r = 10;
    ctx.save();
    if (!cracked && p.type !== "moving" && p.h > 30) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      roundRect(ctx, p.x + 4, p.y + p.h - 4, p.w - 8, 10, 6);
      ctx.fill();
    }

    ctx.fillStyle = c1;
    roundRect(ctx, p.x, p.y, p.w, p.h, r);
    ctx.fill();

    if (!cracked && p.type !== "moving" && this.bg.beach) {
      ctx.fillStyle = this.bg.sandDark || "#c9a06a";
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < p.w; i += 26) {
        const dotX = p.x + 10 + (i % p.w);
        const dotY = p.y + 6 + ((i * 7) % Math.max(8, p.h - 16));
        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = c2;
    ctx.fillRect(p.x + 4, p.y + p.h - 8, p.w - 8, 6);
    ctx.restore();
  }

  drawCandyBlock(ctx, p) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(p.x + 4, p.y + p.h - 4, p.w, 6);

    const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    g.addColorStop(0, "#ff5a8a");
    g.addColorStop(0.5, "#ffd6e6");
    g.addColorStop(1, "#ff5a8a");
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 5;
    for (let i = -p.h; i < p.w + p.h; i += 22) {
      ctx.beginPath();
      ctx.moveTo(p.x + i, p.y);
      ctx.lineTo(p.x + i + p.h, p.y + p.h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#c92a5a";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(p.x + 3, p.y + 3, 4, p.h - 6);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 3);
    ctx.restore();
  }

  drawCracked(ctx, p) {
    ctx.save();
    const wobble = Math.sin(this.time * 3 + p.x * 0.01) * 1.2;
    ctx.translate(0, wobble);

    const armed = p.crackTimer >= 0;
    const ratio = armed ? Math.max(0, p.crackTimer / p.crackTotal) : 1;
    const panic = armed ? (1 - ratio) : 0;
    const shake = armed ? Math.sin(this.time * 40) * (1 + panic * 3) : 0;
    ctx.translate(shake, 0);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    roundRect(ctx, p.x + 3, p.y + p.h - 3, p.w - 6, 8, 5);
    ctx.fill();

    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    const topC = armed ? mixColor("#ffd6e0", "#ff5a6a", panic) : "#ffd6e0";
    const botC = armed ? mixColor("#e88aa0", "#c92a3a", panic) : "#e88aa0";
    g.addColorStop(0, topC);
    g.addColorStop(1, botC);
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();

    ctx.strokeStyle = armed ? mixColor("#a0405a", "#ff2a3a", panic) : "#a0405a";
    ctx.lineWidth = 2.5;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.stroke();

    ctx.strokeStyle = "#6a2030";
    ctx.lineWidth = 2;
    const n = Math.max(2, Math.floor(p.w / 40));
    for (let i = 0; i < n; i++) {
      const cx = p.x + 12 + i * ((p.w - 24) / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(cx, p.y + 2);
      ctx.lineTo(cx + 4, p.y + p.h * 0.4);
      ctx.lineTo(cx - 3, p.y + p.h * 0.7);
      ctx.lineTo(cx + 2, p.y + p.h - 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(p.x + 6, p.y + 3, p.w - 12, 2);

    if (armed) {
      const barY = p.y - 8;
      const barW = p.w;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, p.x, barY, barW, 4, 2);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? "#ffd24d" : "#ff5a6a";
      roundRect(ctx, p.x, barY, barW * ratio, 4, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHazard(ctx, h) {
    ctx.save();
    if (h.type === "water") {
      const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      g.addColorStop(0, "rgba(90,190,255,0.7)");
      g.addColorStop(1, "rgba(30,110,200,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = h.x; x < h.x + h.w; x += 20) {
        const y = h.y + Math.sin((x + this.time * 60) * 0.05) * 4;
        if (x === h.x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (h.type === "icewater") {
      const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      g.addColorStop(0, "rgba(150,230,255,0.75)");
      g.addColorStop(0.25, "rgba(70,150,220,0.85)");
      g.addColorStop(1, "rgba(10,40,90,0.98)");
      ctx.fillStyle = g;
      ctx.fillRect(h.x, h.y, h.w, h.h);

      ctx.strokeStyle = "rgba(210,255,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = h.x; x <= h.x + h.w; x += 10) {
        const y = h.y + 2 + Math.sin((x + this.time * 50) * 0.06) * 4;
        if (x === h.x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const ix = h.x + 20 + ((i * 97 + this.time * 12) % Math.max(20, h.w - 40));
        const iy = h.y + 6 + (i % 3) * 10;
        const iw = 16 + (i % 4) * 5;
        const ih = 6 + (i % 3) * 2;
        ctx.fillStyle = "rgba(235,250,255,0.9)";
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ix + iw * 0.7, iy - 2);
        ctx.lineTo(ix + iw, iy + 2);
        ctx.lineTo(ix + iw * 0.6, iy + ih);
        ctx.lineTo(ix + 2, iy + ih * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(160,210,255,0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const mist = ctx.createLinearGradient(0, h.y - 12, 0, h.y + 18);
      mist.addColorStop(0, "rgba(220,250,255,0)");
      mist.addColorStop(0.5, "rgba(220,250,255,0.28)");
      mist.addColorStop(1, "rgba(220,250,255,0)");
      ctx.fillStyle = mist;
      ctx.fillRect(h.x, h.y - 12, h.w, 30);

      ctx.fillStyle = "rgba(200,240,255,0.55)";
      for (let i = 0; i < 14; i++) {
        const bx = h.x + 10 + ((i * 71 + this.time * 20) % Math.max(20, h.w - 20));
        const by = h.y + 10 + ((i * 29) % Math.max(8, h.h - 16));
        ctx.beginPath();
        ctx.arc(bx, by, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (h.type === "milk") {
      const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      g.addColorStop(0, "rgba(255,255,255,0.92)");
      g.addColorStop(0.5, "rgba(250,245,240,0.95)");
      g.addColorStop(1, "rgba(235,225,215,0.98)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + h.h);
      ctx.lineTo(h.x, h.y + 6);
      for (let x = h.x; x <= h.x + h.w; x += 12) {
        const y = h.y + 6 + Math.sin((x + this.time * 50) * 0.06) * 3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(h.x + h.w, h.y + h.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 10; i++) {
        const bx = h.x + 10 + ((i * 47 + this.time * 20) % Math.max(20, h.w - 20));
        const by = h.y + 8 + ((i * 29) % Math.max(4, h.h - 20));
        ctx.beginPath();
        ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(180,200,230,0.25)";
      ctx.fillRect(h.x, h.y + h.h - 6, h.w, 6);
    } else if (h.type === "spikes") {
      ctx.fillStyle = "#3a2f2a";
      ctx.fillRect(h.x, h.y + h.h - 5, h.w, 5);
      const step = 10;
      ctx.fillStyle = "#c9c9d6";
      for (let x = h.x; x < h.x + h.w - 3; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, h.y + h.h - 5);
        ctx.lineTo(x + step / 2, h.y);
        ctx.lineTo(x + step, h.y + h.h - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.moveTo(x + step / 2, h.y);
        ctx.lineTo(x + step, h.y + h.h - 5);
        ctx.lineTo(x + step * 0.7, h.y + h.h - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#c9c9d6";
      }
    } else if (h.type === "oil") {
      const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      g.addColorStop(0, "rgba(40,30,60,0.95)");
      g.addColorStop(1, "rgba(10,5,20,0.98)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + h.h);
      ctx.lineTo(h.x, h.y + 6);
      for (let x = h.x; x <= h.x + h.w; x += 16) {
        const y = h.y + 6 + Math.sin((x + this.time * 40) * 0.05) * 3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(h.x + h.w, h.y + h.h);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.35;
      const hues = ["#ff6b9d", "#6bd9ff", "#c9a0ff", "#ffe66b"];
      for (let i = 0; i < 8; i++) {
        const bx = h.x + 10 + ((i * 47) % Math.max(20, h.w - 20));
        const by = h.y + 10 + ((i * 31) % Math.max(6, h.h - 14));
        ctx.fillStyle = hues[i % hues.length];
        ctx.beginPath();
        ctx.ellipse(bx, by, 14, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffd24d";
      for (let x = h.x; x < h.x + h.w; x += 20) {
        ctx.fillRect(x, h.y - 4, 10, 4);
      }
    } else if (h.type === "pit") {
      ctx.fillStyle = "#0a0612";
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.strokeStyle = "#4a3a5a";
      ctx.lineWidth = 3;
      for (let x = h.x + 10; x < h.x + h.w - 6; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, h.y);
        ctx.lineTo(x, h.y + h.h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + 4);
      ctx.lineTo(h.x + h.w, h.y + 4);
      ctx.stroke();
      ctx.fillStyle = "#ffd24d";
      for (let x = h.x; x < h.x + h.w; x += 24) {
        ctx.fillRect(x, h.y - 6, 12, 6);
      }
      ctx.fillStyle = "#1a1420";
      for (let x = h.x + 12; x < h.x + h.w; x += 24) {
        ctx.fillRect(x, h.y - 6, 12, 6);
      }
    } else if (h.type === "shock") {
      const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      g.addColorStop(0, "rgba(255,220,80,0.25)");
      g.addColorStop(1, "rgba(255,120,40,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(h.x, h.y, h.w, h.h);

      ctx.strokeStyle = "#ff8a3a";
      ctx.lineWidth = 3;
      for (let row = 0; row < 2; row++) {
        const y = h.y + 12 + row * 16;
        ctx.beginPath();
        for (let x = h.x; x <= h.x + h.w; x += 10) {
          const yy = y + Math.sin((x + this.time * 120) * 0.1 + row) * 3;
          if (x === h.x) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      ctx.fillStyle = "#fff3a0";
      for (let i = 0; i < 12; i++) {
        const sx = h.x + ((i * 53 + this.time * 200) % h.w);
        const sy = h.y + 8 + ((i * 29) % (h.h - 16));
        if (Math.sin(this.time * 8 + i) > 0.3) {
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (h.type === "toxic") {
      const topY = h.y + 8;
      const bottomY = h.y + h.h;

      const g = ctx.createLinearGradient(0, h.y, 0, bottomY);
      g.addColorStop(0, "rgba(120,255,140,0.15)");
      g.addColorStop(0.15, "rgba(60,190,80,0.5)");
      g.addColorStop(0.55, "rgba(30,120,50,0.85)");
      g.addColorStop(1, "rgba(10,40,20,0.95)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(h.x, bottomY);
      for (let x = h.x; x <= h.x + h.w; x += 8) {
        const y =
          topY +
          Math.sin((x + this.time * 55) * 0.07) * 4 +
          Math.sin((x * 0.3 + this.time * 20) * 0.09) * 2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(h.x + h.w, bottomY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(180,255,160,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = h.x; x <= h.x + h.w; x += 8) {
        const y =
          topY +
          Math.sin((x + this.time * 55) * 0.07) * 4 +
          Math.sin((x * 0.3 + this.time * 20) * 0.09) * 2;
        if (x === h.x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const glowG = ctx.createLinearGradient(0, topY, 0, topY + 18);
      glowG.addColorStop(0, "rgba(200,255,170,0.5)");
      glowG.addColorStop(1, "rgba(200,255,170,0)");
      ctx.fillStyle = glowG;
      ctx.fillRect(h.x, topY, h.w, 18);

      for (let i = 0; i < 14; i++) {
        const seed = i * 97.13;
        const speed = 18 + (i % 5) * 4;
        const bx =
          h.x +
          14 +
          ((seed + this.time * speed * 0.4) % Math.max(24, h.w - 28));
        const by =
          bottomY - 6 - ((seed * 0.7 + this.time * speed) % Math.max(12, h.h - 18));
        const r = 1.8 + (i % 3) * 1.2;
        ctx.fillStyle = "rgba(220,255,190,0.85)";
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(30,90,40,0.5)";
        ctx.beginPath();
        ctx.arc(bx - r * 0.3, by - r * 0.35, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(230,255,210,0.75)";
      for (let i = 0; i < 10; i++) {
        const fx = h.x + 10 + ((i * 53 + this.time * 30) % Math.max(16, h.w - 20));
        const fy = topY + Math.sin((fx + this.time * 60) * 0.08) * 3;
        ctx.beginPath();
        ctx.arc(fx, fy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (h.type === "drip") {
      const interval = h.interval || 2;
      const t = this.time % interval;
      const fall = t / interval;

      const cx = h.x + h.w / 2;
      const startY = h.y + 10;
      const endY = h.y + h.h - 8;

      ctx.fillStyle = "rgba(20,30,20,0.55)";
      ctx.fillRect(h.x - 10, h.y, h.w + 20, 6);
      ctx.fillStyle = "#2a1a0a";
      ctx.beginPath();
      ctx.ellipse(cx, h.y + 8, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a2a0a";
      ctx.beginPath();
      ctx.ellipse(cx - 3, h.y + 7, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const py = startY + fall * (endY - startY);
      const glowR = 12 + (1 - fall) * 5;
      const glow = ctx.createRadialGradient(cx, py, 0, cx, py, glowR);
      glow.addColorStop(0, "rgba(255,240,150,0.95)");
      glow.addColorStop(0.5, "rgba(255,220,80,0.4)");
      glow.addColorStop(1, "rgba(255,220,80,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, py, glowR, 0, Math.PI * 2);
      ctx.fill();

      const stretch = 7.5 + fall * 3;
      ctx.fillStyle = "rgba(255,240,120,0.95)";
      ctx.beginPath();
      ctx.ellipse(cx, py, 4.5, stretch, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(cx - 1.5, py - stretch * 0.35, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,240,150,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, py - stretch - 2);
      ctx.lineTo(cx, py - stretch - 10);
      ctx.stroke();

      if (fall > 0.72) {
        const spark = (fall - 0.72) / 0.28;
        const r = 3 + spark * 12;
        ctx.globalAlpha = 1 - spark;
        ctx.strokeStyle = "rgba(255,240,150,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, h.y + h.h - 6, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,240,150,0.9)";
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const px = cx + Math.cos(a) * r;
          const py2 = h.y + h.h - 6 + Math.sin(a) * r * 0.5;
          ctx.beginPath();
          ctx.arc(px, py2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(255,240,150,0.18)";
      ctx.beginPath();
      ctx.ellipse(cx, h.y + h.h - 4, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.type === "icicle") {
      const interval = h.interval || 2.5;
      const cycle = this.time % interval;
      const fallFrac = Math.min(1, cycle / (interval * 0.7));
      const spawnY = h.y + 20;
      const endY = h.y + h.h - 24;
      const py = spawnY + fallFrac * (endY - spawnY);
      const cx = h.x + h.w / 2;

      ctx.fillStyle = "rgba(120,150,190,0.55)";
      ctx.fillRect(h.x - 12, h.y, h.w + 24, 6);
      ctx.fillStyle = "#cfe8ff";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(h.x - 8 + i * (h.w + 16) / 3, h.y + 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (fallFrac < 0.15) {
        const appear = fallFrac / 0.15;
        ctx.globalAlpha = appear;
        drawIcicleShape(ctx, cx, h.y + 4, 6 + appear * 4, 26 + appear * 10, "#eaf8ff", "#9fc9ff");
        ctx.globalAlpha = 1;
      }

      if (fallFrac > 0.05 && fallFrac < 1) {
        const len = 34 + Math.sin(this.time * 10) * 2;
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "rgba(190,230,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, spawnY);
        ctx.lineTo(cx, py - len * 0.4);
        ctx.stroke();
        ctx.globalAlpha = 1;
        drawIcicleShape(ctx, cx, py, 7, len, "#eaf8ff", "#8fbfff");
      }

      if (fallFrac >= 1) {
        const sparkT = Math.min(1, (cycle - interval * 0.7) / (interval * 0.3));
        const r = 4 + sparkT * 16;
        ctx.globalAlpha = 1 - sparkT;
        ctx.strokeStyle = "rgba(210,240,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, endY, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(235,250,255,0.95)";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, endY + Math.sin(a) * r * 0.6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else if (h.type === "snowball") {
      const range = h.rangeX || 300;
      const speed = h.speed || 1.5;
      const phase = Math.sin(this.time * speed + (h.x || 0) * 0.01) * 0.5 + 0.5;
      const cx = h.x + phase * range;
      const cy = h.y + h.h / 2;
      const r = h.w / 2;

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(cx, h.y + h.h + 2, r * 1.1, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.6, "#e8f4ff");
      g.addColorStop(1, "#b9d9ff");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9fc9ff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      for (let i = 0; i < 5; i++) {
        const a = this.time * speed + i * 1.3;
        const bx = cx + Math.cos(a) * r * 0.5;
        const by = cy + Math.sin(a) * r * 0.5;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFinish(ctx, f) {
    ctx.save();
    ctx.fillStyle = "#7a4dff";
    ctx.fillRect(f.x + 20, f.y - 80, 6, 80);
    const wave = Math.sin(this.time * 4) * 5;
    ctx.fillStyle = f.opened ? "#ffd24d" : "#c9c9d6";
    ctx.beginPath();
    ctx.moveTo(f.x + 26, f.y - 80);
    ctx.quadraticCurveTo(f.x + 60, f.y - 70 + wave, f.x + 70, f.y - 50);
    ctx.lineTo(f.x + 26, f.y - 40);
    ctx.closePath();
    ctx.fill();
    if (f.opened) {
      ctx.globalAlpha = 0.4 + Math.sin(this.time * 5) * 0.2;
      ctx.fillStyle = "#fff3a0";
      ctx.beginPath();
      ctx.arc(f.x + 30, f.y - 20, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  camera(player) {
    const W = this.game.W;
    let cam = player.x + player.w / 2 - W / 2;
    cam = Math.max(0, Math.min(this.width - W, cam));
    return cam;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mixColor(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const v = h.length === 3
    ? h.split("").map(c => c + c).join("")
    : h;
  const num = parseInt(v, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function drawIcicleShape(ctx, x, y, r, len, fill, stroke) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x, y - r * 1.2, x + r, y);
  ctx.lineTo(x + r * 0.25, y + len);
  ctx.quadraticCurveTo(x, y + len + 4, x - r * 0.25, y + len);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.35, y + 4);
  ctx.lineTo(x - r * 0.1, y + len * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawNote(ctx, x, y, s, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.55, s * 0.4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.5, 0);
  ctx.lineTo(s * 0.5, -s * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.5, -s * 1.4);
  ctx.quadraticCurveTo(s * 1.1, -s * 1.1, s * 0.7, -s * 0.5);
  ctx.stroke();
  ctx.restore();
}

export function drawStar(ctx, x, y, r, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}