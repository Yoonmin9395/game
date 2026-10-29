// Draw helpers: all characters drawn with primitives.

function drawTata(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 6) * 1.2 : 0;
  const swing = onGround ? Math.sin(animTime * 6) * 2 : 0;

  const line = "#111111";
  const red = "#e8352e";
  const blue = "#5b7fd4";
  const yellow = "#ffd92e";
  const mouthFill = "#f6dfa8";

  ctx.save();
  ctx.translate(x, y + bob + 11);
  ctx.scale(scale * 0.83, scale * 0.83);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = line;

  // ручки по бокам
  ctx.fillStyle = blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(-17, -20 + swing, 6, 11, 0.12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(17, -20 - swing, 6, 11, -0.12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // тело-комбинезон
  ctx.fillStyle = blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, -27);
  ctx.bezierCurveTo(-16, -17, -16, -7, -14, -3);
  ctx.quadraticCurveTo(-12, 1, -6, 1);
  ctx.lineTo(6, 1);
  ctx.quadraticCurveTo(12, 1, 14, -3);
  ctx.bezierCurveTo(16, -7, 16, -17, 14, -27);
  ctx.quadraticCurveTo(0, -31, -14, -27);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // разделение лапок
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(0, -10);
  ctx.stroke();

  // жёлтые горошины
  ctx.fillStyle = yellow;
  const dots = [[-8, -24, 3.2], [6, -24, 3.2], [-4, -15, 3.2], [9, -14, 3], [-10, -7, 2.8], [5, -6, 3], [0, -20, 2.8]];
  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2);
    ctx.fill();
  }

  // голова-сердце
  ctx.fillStyle = red;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(-16, -36, -38, -49, -38, -67);
  ctx.bezierCurveTo(-38, -86, -16, -91, 0, -75);
  ctx.bezierCurveTo(16, -91, 38, -86, 38, -67);
  ctx.bezierCurveTo(38, -49, 16, -36, 0, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // брови
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, -59);
  ctx.lineTo(-8, -59);
  ctx.moveTo(8, -59);
  ctx.lineTo(16, -59);
  ctx.stroke();

  // глаза
  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.arc(-12, -51, 4.6, 0, Math.PI * 2);
  ctx.arc(12, -51, 4.6, 0, Math.PI * 2);
  ctx.fill();

  // рот
  ctx.fillStyle = mouthFill;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.ellipse(0, -40, 10.5, 7.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-4, -40);
  ctx.lineTo(4, -40);
  ctx.stroke();

  ctx.restore();
}

function drawChimmy(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 7) * 1.2 : 0;
  const swing = onGround ? Math.sin(animTime * 7) * 2 : 0;

  const line = "#000000";
  const yellow = "#ffe000";
  const white = "#ffffff";
  const orange = "#f35a24";
  const tongueColor = "#ff6b81";

  ctx.save();
  ctx.translate(x, y + bob + 8);
  ctx.scale(scale * 0.55, scale * 0.55);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Черные висячие уши по бокам капюшона
  ctx.fillStyle = line;
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(-30, -55, 12, 26, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(30, -55, 12, 26, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Желтый комбинезон (тело и ножки)
  ctx.fillStyle = yellow;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, -35);
  ctx.lineTo(-20, -10);
  ctx.quadraticCurveTo(-20, 6, -11, 6);
  ctx.quadraticCurveTo(-4, 6, -4, -4);
  ctx.quadraticCurveTo(-4, 6, 11, 6);
  ctx.quadraticCurveTo(20, 6, 20, -10);
  ctx.lineTo(18, -35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Разделение ножек
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -4);
  ctx.stroke();

  // 3. Белые лапки-ручки
  ctx.fillStyle = white;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(-20, -16 + swing, 6, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(20, -16 - swing, 6, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Желтый капюшон
  ctx.fillStyle = yellow;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -56, 35, 31, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Оранжевые шнурки капюшона
  ctx.strokeStyle = orange;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, -30);
  ctx.lineTo(-6, -16);
  ctx.moveTo(6, -30);
  ctx.lineTo(6, -13);
  ctx.stroke();

  ctx.fillStyle = orange;
  ctx.beginPath();
  ctx.arc(-6, -14, 3.5, 0, Math.PI * 2);
  ctx.arc(6, -11, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Белая мордочка
  ctx.fillStyle = white;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -56, 25, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 7. Глаза
  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.arc(-9, -60, 3.5, 0, Math.PI * 2);
  ctx.arc(9, -60, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 8. Нос
  ctx.beginPath();
  ctx.ellipse(0, -52, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 9. Язычок
  ctx.fillStyle = tongueColor;
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(3, -43, 4.5, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 10. Наклоненная линия рта
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -45);
  ctx.lineTo(10, -47);
  ctx.stroke();

  ctx.restore();
}

function drawCooky(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 8) * 1.5 : 0;
  const swing = onGround ? Math.sin(animTime * 8) * 2 : 0;

  // Основные цвета по картинке
  const line = "#1a1a1a";
  const pink = "#fba4d0";
  const white = "#fffff0";
  const mouthDark = "#3a1a1a";
  const mouthTongue = "#e83a30";

  ctx.save();
  ctx.translate(x, y + bob + 10);
  ctx.scale(scale * 0.85, scale * 0.85);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Лапки (сзади)
  ctx.fillStyle = white;
  ctx.strokeStyle = line;
  ctx.lineWidth = 5;
  // Левая лапка (машет)
  ctx.beginPath();
  ctx.ellipse(-26, -18 + swing, 8, 13, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Правая лапка
  ctx.beginPath();
  ctx.ellipse(26, -18 - swing, 8, 13, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Тело
  ctx.fillStyle = pink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-16, -38);
  ctx.lineTo(-18, -8);
  ctx.quadraticCurveTo(-18, 8, -10, 8);
  ctx.quadraticCurveTo(-4, 8, -4, -2);
  ctx.quadraticCurveTo(-4, 8, 10, 8);
  ctx.quadraticCurveTo(18, 8, 18, -8);
  ctx.lineTo(16, -38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Разделение ножек
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, -2);
  ctx.stroke();

  // 3. Уши (подняты на 6 вверх, чтобы остаться на голове)
  ctx.fillStyle = pink;
  ctx.strokeStyle = line;
  ctx.lineWidth = 5;

  // Левое длинное ухо
  ctx.beginPath();
  ctx.ellipse(-12, -76, 10, 23, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Внутренняя часть левого уха
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.ellipse(-12, -76, 4.5, 14, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Правое загнутое круглое ухо
  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.arc(21, -64, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Голова — меньше и выше
  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.ellipse(0, -46, 23, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Лицо (сдвинуто вверх на 6 и слегка уменьшено)
  ctx.fillStyle = line;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;

  // Сердитые брови
  ctx.beginPath();
  ctx.moveTo(-15, -55); ctx.lineTo(-6, -52);
  ctx.moveTo(15, -55); ctx.lineTo(6, -52);
  ctx.stroke();

  // Глаза
  ctx.beginPath();
  ctx.arc(-8, -48, 3.2, 0, Math.PI * 2);
  ctx.arc(8, -48, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Нос
  ctx.beginPath();
  ctx.ellipse(0, -43, 3.2, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Рот с языком
  // Задняя часть рта
  ctx.fillStyle = mouthDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, -41);
  ctx.quadraticCurveTo(0, -39, 7, -41);
  ctx.quadraticCurveTo(9, -34, 0, -34);
  ctx.quadraticCurveTo(-9, -34, -7, -41);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Язык внутри рта
  ctx.fillStyle = mouthTongue;
  ctx.beginPath();
  ctx.arc(0, -36, 4.5, 0, Math.PI);
  ctx.fill();

  ctx.restore();
}

function drawShooky(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 9) * 1.5 : 0;
  const swing = onGround ? Math.sin(animTime * 9) * 2 : 0;

  const line = "#111111";
  const body = "#b07a45";      // основной коричневый
  const limbColor = "#8a5a3a"; // тёмно-коричневый для ручек/ножек
  const mouthDark = "#4a2a1a";
  const white = "#ffffff";

  ctx.save();
  // Немного уменьшен: 0.72 вместо 0.83
  ctx.translate(x, y + bob);
  ctx.scale(scale * 0.72, scale * 0.72);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Ручки по бокам (машут)
  ctx.fillStyle = limbColor;
  ctx.strokeStyle = line;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(-36, -22 + swing, 7, 12, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(36, -22 - swing, 7, 12, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Ножки
  ctx.beginPath();
  ctx.ellipse(-11, 4, 8, 11, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(11, 4, 8, 11, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Голова/тело
  ctx.fillStyle = body;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, -32, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Нахмуренные брови
  ctx.strokeStyle = line;
  ctx.lineWidth = 6;
  ctx.beginPath();
  // Левая — уходит вниз к центру
  ctx.moveTo(-20, -52);
  ctx.lineTo(-9, -45);
  // Правая — зеркально
  ctx.moveTo(20, -52);
  ctx.lineTo(9, -45);
  ctx.stroke();

  // 5. Глаза
  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.arc(-11, -38, 5.5, 0, Math.PI * 2);
  ctx.arc(11, -38, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Рот (улыбка)
  ctx.fillStyle = mouthDark;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-20, -26);
  ctx.quadraticCurveTo(0, -16, 20, -26);
  ctx.quadraticCurveTo(20, -13, 0, -11);
  ctx.quadraticCurveTo(-20, -13, -20, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 7. Белый зуб (шире)
  ctx.fillStyle = white;
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-2, -24);
  ctx.lineTo(11, -24);
  ctx.lineTo(11, -16);
  ctx.quadraticCurveTo(4.5, -13.5, -2, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKoya(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 5) * 1.5 : 0;
  const armSwing = onGround ? Math.sin(animTime * 5) * 2 : 0;
  
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * 0.68, scale * 0.68); // Уменьшено с 0.83
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const line = "#000000";
  const blue = "#88d8f5"; // Светло-голубой цвет тела
  const noseColor = "#6c5ce7"; // Фиолетовый нос

  // 1. Ножки (снизу)
  ctx.fillStyle = blue;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4.5;
  
  ctx.beginPath();
  ctx.ellipse(-12, 2, 9, 12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(12, 2, 9, 12, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Тело
  ctx.beginPath();
  ctx.ellipse(0, -16, 22, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Белый живот
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, -12, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Ручки (спереди)
  ctx.fillStyle = blue;
  ctx.lineWidth = 4.5;
  
  ctx.beginPath();
  ctx.ellipse(-22, -16 + armSwing, 7, 13, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(22, -16 - armSwing, 7, 13, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Уши (сзади головы)
  ctx.beginPath();
  ctx.ellipse(-25, -48, 14, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(25, -48, 14, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Внутренняя часть ушей (светло-голубая)
  ctx.fillStyle = "#d4f0ff";
  ctx.beginPath();
  ctx.ellipse(-25, -48, 8, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(25, -48, 8, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 6. Голова
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.ellipse(0, -45, 28, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 7. Мордочка
  // Глаза (закрытые, изогнутые линии)
  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-16, -50);
  ctx.quadraticCurveTo(-12, -54, -8, -50);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, -50);
  ctx.quadraticCurveTo(12, -54, 16, -50);
  ctx.stroke();

  // Нос (большой овальный фиолетовый)
  ctx.fillStyle = noseColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, -46, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Рот (маленькая дуга под носом)
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, -34);
  ctx.quadraticCurveTo(0, -30, 5, -34);
  ctx.stroke();

  ctx.restore();
}

function drawRJ(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 6) * 1.5 : 0;
  const armSwing = onGround ? Math.sin(animTime * 6) * 1.5 : 0;

  ctx.save();
  // Масштаб 0.65, сдвиг вверх на -6 для идеального стояния на платформе (42 * 0.65 = 27.3)
  ctx.translate(x, y + bob - 6);
  ctx.scale(scale * 0.65, scale * 0.65);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const line = "#000000";
  const white = "#ffffff";
  const brown = "#5c3a21";
  const blushColor = "#ffb5c5";
  const scarfColor = "#f15a24";

  ctx.fillStyle = white;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;

  // 1. Ушки (маленькие облачка)
  ctx.beginPath();
  ctx.ellipse(-20, -70, 6, 9, -0.4, 0, Math.PI * 2);
  ctx.ellipse(20, -70, 6, 9, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Основа головы (облако)
  ctx.beginPath();
  ctx.ellipse(0, -48, 29, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Пушистые выступы головы
  const headBumps = [
    [-22, -62, 10], [-10, -70, 11], [10, -70, 11], [22, -62, 10],
    [28, -48, 10], [22, -34, 10], [-22, -34, 10], [-28, -48, 10]
  ];
  for (const b of headBumps) {
    ctx.beginPath();
    ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4. Тело (тоже облако)
  ctx.beginPath();
  ctx.moveTo(-18, -18);
  ctx.bezierCurveTo(-28, -12, -28, -2, -18, 4);
  ctx.bezierCurveTo(-28, 10, -28, 20, -14, 26);
  ctx.lineTo(-8, 30);
  ctx.lineTo(8, 30);
  ctx.lineTo(14, 26);
  ctx.bezierCurveTo(28, 20, 28, 10, 18, 4);
  ctx.bezierCurveTo(28, -2, 28, -12, 18, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Ножки (белые)
  ctx.beginPath();
  ctx.moveTo(-6, 28);
  ctx.lineTo(-6, 38);
  ctx.quadraticCurveTo(-6, 42, -1, 42);
  ctx.lineTo(-1, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1, 28);
  ctx.lineTo(1, 42);
  ctx.quadraticCurveTo(6, 42, 6, 38);
  ctx.lineTo(6, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Коричневые подошвы ножек
  ctx.fillStyle = brown;
  ctx.beginPath();
  ctx.rect(-6, 34, 5, 8);
  ctx.rect(1, 34, 5, 8);
  ctx.fill();
  ctx.stroke();

  // 7. Оранжевый шарф
  ctx.fillStyle = scarfColor;
  ctx.beginPath();
  ctx.moveTo(-20, -24);
  ctx.quadraticCurveTo(0, -14, 20, -24);
  ctx.lineTo(26, -20);
  ctx.quadraticCurveTo(28, -14, 22, -12);
  ctx.lineTo(0, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 8. Брови-домики
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -56);
  ctx.quadraticCurveTo(-8, -59, -4, -56);
  ctx.moveTo(4, -56);
  ctx.quadraticCurveTo(8, -59, 12, -56);
  ctx.stroke();

  // 9. Глаза
  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.arc(-8, -48, 4, 0, Math.PI * 2);
  ctx.arc(8, -48, 4, 0, Math.PI * 2);
  ctx.fill();

  // 10. Румянец
  ctx.fillStyle = blushColor;
  ctx.beginPath();
  ctx.ellipse(-15, -44, 5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(15, -44, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 11. Нос
  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.ellipse(0, -44, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 12. Рот (улыбка)
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(0, -38);
  ctx.moveTo(-4, -38);
  ctx.quadraticCurveTo(0, -35, 4, -38);
  ctx.stroke();

  // 13. Ручки (сложены спереди)
  ctx.fillStyle = white;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(-8, -10 + armSwing, 8, 14, 0.2, 0, Math.PI * 2);
  ctx.ellipse(8, -10 - armSwing, 8, 14, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 14. Коричневые ладошки
  ctx.fillStyle = brown;
  ctx.beginPath();
  ctx.ellipse(-3, -16 + armSwing, 4, 5, 0.2, 0, Math.PI * 2);
  ctx.ellipse(3, -16 - armSwing, 4, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMang(ctx, x, y, scale, animTime = 0, onGround = true) {
  const bob = onGround ? Math.sin(animTime * 7) * 1.5 : 0;
  const armSwing = onGround ? Math.sin(animTime * 7) * 1.5 : 0;

  ctx.save();
  // Масштаб 0.72, сдвиг вверх на -9 для идеального стояния (32 * 0.72 = 23). Отрицательный scale для взгляда вправо.
  ctx.translate(x, y + bob - 9);
  ctx.scale(-scale * 0.72, scale * 0.72); 
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const line = "#000000";
  const blueHead = "#71d3f5";
  const pinkNose = "#f26e9f";
  const purpleMane = "#6c429c";
  const bodyPurple = "#d6bbf2";
  const white = "#ffffff";

  ctx.strokeStyle = line;
  ctx.lineWidth = 4;

  // ===== 1. ХВОСТ =====
  ctx.beginPath();
  ctx.moveTo(15, -10);
  ctx.quadraticCurveTo(30, 10, 45, 18);
  ctx.stroke();

  ctx.fillStyle = purpleMane;
  ctx.beginPath();
  ctx.arc(45, 18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ===== 2. ГРИВА =====
  ctx.fillStyle = purpleMane;
  const maneBumps = [[18, -60, 10], [25, -46, 10], [25, -30, 10], [20, -15, 10]];
  for (const b of maneBumps) {
    ctx.beginPath();
    ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Чёрточки на гриве
  ctx.beginPath();
  ctx.moveTo(12, -54);
  ctx.lineTo(18, -52);
  ctx.moveTo(17, -38);
  ctx.lineTo(23, -36);
  ctx.moveTo(16, -22);
  ctx.lineTo(22, -20);
  ctx.stroke();

  // ===== 3. ТЕЛО =====
  ctx.fillStyle = bodyPurple;
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(-18, 20);
  ctx.quadraticCurveTo(-18, 32, -8, 32);
  ctx.quadraticCurveTo(0, 32, 0, 20);
  ctx.quadraticCurveTo(0, 32, 8, 32);
  ctx.quadraticCurveTo(18, 32, 18, 20);
  ctx.lineTo(18, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ===== 4. РУЧКА =====
  ctx.beginPath();
  ctx.ellipse(-18, -4 + armSwing, 8, 12, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ===== 5. ГОЛОВА-МАСКА =====
  ctx.fillStyle = blueHead;
  ctx.beginPath();
  ctx.moveTo(-25, -55);
  ctx.bezierCurveTo(-50, -55, -55, -25, -45, -10);
  ctx.quadraticCurveTo(-38, -2, -22, -2);
  ctx.lineTo(18, -2);
  ctx.lineTo(18, -50);
  ctx.quadraticCurveTo(12, -68, 5, -75);
  ctx.quadraticCurveTo(-5, -68, -25, -55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ===== 6. УШКО =====
  ctx.beginPath();
  ctx.ellipse(8, -72, 7, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ===== 7. НОЗДРЯ =====
  ctx.fillStyle = pinkNose;
  ctx.beginPath();
  ctx.ellipse(-44, -28, 11, 16, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = line;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-44, -33);
  ctx.lineTo(-44, -23);
  ctx.stroke();

  // ===== 8. ГЛАЗ =====
  ctx.fillStyle = white;
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-5, -34, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = line;
  ctx.beginPath();
  ctx.arc(-5, -34, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const CHARACTERS = {
  tata: {
    id: "tata", name: "TATA", speed: 230, jumpPower: 640, w: 48, h: 64,
    colors: { main: "#f24b4b", accent: "#ffe066" },
    draw: drawTata,
  },
  chimmy: {
    id: "chimmy", name: "CHIMMY", speed: 300, jumpPower: 650, w: 46, h: 60,
    colors: { main: "#ffe100", accent: "#f37324" },
    draw: drawChimmy,
  },
  cooky: {
    id: "cooky", name: "COOKY", speed: 240, jumpPower: 650, w: 46, h: 62,
    colors: { main: "#ff9ec7", accent: "#ff6b9d" },
    draw: drawCooky,
  },
  shooky: {
    id: "shooky", name: "SHOOKY", speed: 240, jumpPower: 620, w: 30, h: 42,
    colors: { main: "#8a5a3a", accent: "#c98a5a" },
    draw: drawShooky,
  },
  koya: {
    id: "koya", name: "KOYA", speed: 220, jumpPower: 640, w: 40, h: 54,
    colors: { main: "#9ad9ff", accent: "#6c5ce7" },
    draw: drawKoya,
  },
  rj: {
    id: "rj", name: "RJ", speed: 220, jumpPower: 640, w: 50, h: 66,
    colors: { main: "#ffffff", accent: "#f15a24" },
    draw: drawRJ,
  },
  mang: {
    id: "mang", name: "MANG", speed: 250, jumpPower: 640, w: 44, h: 60,
    colors: { main: "#71d3f5", accent: "#6c429c" },
    draw: drawMang,
  },
};