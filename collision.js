// Simple AABB helpers (used optionally; main collision logic lives in Player/Level)
export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveX(entity, platforms) {
  for (const p of platforms) {
    if (p.solid === false) continue;
    if (aabb(entity, p)) {
      if (entity.vx > 0) { entity.x = p.x - entity.w; entity.vx = 0; }
      else if (entity.vx < 0) { entity.x = p.x + p.w; entity.vx = 0; }
    }
  }
}