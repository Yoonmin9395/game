// localStorage with error handling
const PREFIX = "bt21_";

export const Storage = {
  safeGet(key, fallback) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      if (v === null) return fallback;
      return JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  safeSet(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },
  getUnlocked() {
    const arr = this.safeGet("unlocked", ["tata"]);
    return Array.isArray(arr) && arr.includes("tata") ? arr : ["tata"];
  },
  unlockChar(id) {
    const cur = this.getUnlocked();
    if (!cur.includes(id)) {
      cur.push(id);
      this.safeSet("unlocked", cur);
    }
  },
  getSound() {
    return this.safeGet("sound", true) !== false;
  },
  setSound(on) {
    this.safeSet("sound", !!on);
  },
  getBest() {
    const v = this.safeGet("best", 0);
    return typeof v === "number" ? v : 0;
  },
  setBestIfHigher(score) {
    const best = this.getBest();
    if (score > best) this.safeSet("best", score);
  },
  addScore(score) {
    // no-op in base; could accumulate
  },
  getLevelProgress() {
    const v = this.safeGet("levelProgress", 0);
    return typeof v === "number" && v >= 0 ? v : 0;
  },
  setLevelProgress(index) {
    const cur = this.getLevelProgress();
    if (index > cur) this.safeSet("levelProgress", index);
  },
  resetProgress() {
    this.safeSet("levelProgress", 0);
  },
  reset() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(PREFIX)) localStorage.removeItem(k);
      });
    } catch (e) {}
  },
};