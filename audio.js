// Web Audio chiptune synthesis + optional mp3 fallback + sfx
export class AudioManager {
  constructor(Storage) {
    this.Storage = Storage;
    this.ctx = null;
    this.enabled = Storage.getSound();
    this.master = null;
    this.musicNodes = [];
    this.musicTimer = null;
    this.currentLevel = -1;
    this.playingMusic = false;
    this.mp3 = null;
    this.mp3Fallback = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.28 : 0;
    this.master.connect(this.ctx.destination);
  }

  toggle() {
    this.enabled = !this.enabled;
    this.Storage.setSound(this.enabled);
    if (this.master) this.master.gain.value = this.enabled ? 0.28 : 0;
    if (!this.enabled) this.stopMusic();
    else if (this.currentLevel >= 0) this.playMusicForLevel(this.currentLevel);
  }

  // --- SFX ---
  sfx(type) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.master);

    if (type === "jump") {
      o.type = "square"; o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(660, t + 0.1);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.16);
    } else if (type === "collect") {
      o.type = "triangle"; o.frequency.setValueAtTime(880, t);
      o.frequency.setValueAtTime(1100, t + 0.05);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.21);
    } else if (type === "hurt") {
      o.type = "sawtooth"; o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.2);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
    } else if (type === "win") {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        const oo = this.ctx.createOscillator();
        const gg = this.ctx.createGain();
        oo.connect(gg); gg.connect(this.master);
        oo.type = "triangle";
        oo.frequency.value = f;
        gg.gain.setValueAtTime(0.001, t + i * 0.1);
        gg.gain.exponentialRampToValueAtTime(0.2, t + i * 0.1 + 0.02);
        gg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.18);
        oo.start(t + i * 0.1); oo.stop(t + i * 0.1 + 0.2);
      });
    } else if (type === "jingle") {
      const notes = [659, 784, 988, 1319];
      notes.forEach((f, i) => {
        const oo = this.ctx.createOscillator();
        const gg = this.ctx.createGain();
        oo.connect(gg); gg.connect(this.master);
        oo.type = "square";
        oo.frequency.value = f;
        gg.gain.setValueAtTime(0.001, t + i * 0.12);
        gg.gain.exponentialRampToValueAtTime(0.15, t + i * 0.12 + 0.02);
        gg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.16);
        oo.start(t + i * 0.12); oo.stop(t + i * 0.12 + 0.18);
      });
    }
  }

  // --- Music ---
  playMusicForLevel(index) {
    if (!this.enabled) return;
    this.currentLevel = index;
    this.ensure();
    if (!this.ctx) return;
    this.stopMusic();

    // try mp3 first
    this.mp3Fallback = false;
    const url = `assets/music/level${index + 1}.mp3`;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.4;
    audio.addEventListener("canplaythrough", () => {
      if (!this.mp3Fallback) {
        audio.play().catch(() => {});
        this.mp3 = audio;
        this.playingMusic = true;
      }
    }, { once: true });
    audio.addEventListener("error", () => {
      this.mp3Fallback = true;
      this.startChiptune(index);
    }, { once: true });
    // also fallback if metadata fails
    const fallbackTimer = setTimeout(() => {
      if (!this.mp3 && !this.playingMusic) {
        this.mp3Fallback = true;
        this.startChiptune(index);
      }
    }, 700);
    audio.load();
    this._fallbackTimer = fallbackTimer;

    this.playingMusic = true;
  }

  startChiptune(index) {
    if (!this.ctx || !this.enabled) return;
    clearTimeout(this._fallbackTimer);
    this.chiptuneIndex = index;
    const mood = MOODS[index] || MOODS[0];
    let step = 0;
    const beat = mood.tempo;
    const tick = () => {
      if (!this.playingMusic) return;
      const t = this.ctx.currentTime;
      const freq = mood.melody[step % mood.melody.length];
      if (freq) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.master);
        o.type = mood.wave || "square";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(mood.gain || 0.12, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
        o.start(t); o.stop(t + beat);
        this.musicNodes.push(o);
      }
      // bass
      const bassNote = mood.bass[step % mood.bass.length];
      if (bassNote) {
        const ob = this.ctx.createOscillator();
        const gb = this.ctx.createGain();
        ob.connect(gb); gb.connect(this.master);
        ob.type = "triangle";
        ob.frequency.value = bassNote;
        gb.gain.setValueAtTime(0.001, t);
        gb.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
        gb.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.5);
        ob.start(t); ob.stop(t + beat * 1.6);
        this.musicNodes.push(ob);
      }
      step++;
      this.musicTimer = setTimeout(tick, beat * 1000);
    };
    tick();
  }

  stopMusic() {
    this.playingMusic = false;
    clearTimeout(this.musicTimer);
    clearTimeout(this._fallbackTimer);
    this.musicTimer = null;
    if (this.mp3) {
      this.mp3.pause();
      this.mp3 = null;
    }
    // stop nodes
    for (const n of this.musicNodes) {
      try { n.stop(); } catch (e) {}
    }
    this.musicNodes = [];
  }

  resumeMusic() {
    if (this.currentLevel >= 0 && this.enabled) this.playMusicForLevel(this.currentLevel);
  }
}

// Original simple chiptune moods (not copies). Each: tempo (seconds per step), melody freqs, bass freqs.
const MOODS = [
  // 1 dreamy light (Serendipity vibe)
  { tempo: 0.28, wave: "triangle", gain: 0.1,
    melody: [523, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 587, 523, 440],
    bass: [131, 131, 165, 165, 147, 147, 196, 196] },
  // 2 energetic sporty (Euphoria vibe)
  { tempo: 0.18, wave: "square", gain: 0.12,
    melody: [659, 784, 988, 784, 659, 784, 988, 1319, 1175, 988, 784, 659, 587, 659, 784, 988],
    bass: [165, 165, 196, 196, 220, 220, 247, 247] },
  // 3 bold hiphop (Agust D vibe)
  { tempo: 0.22, wave: "sawtooth", gain: 0.1,
    melody: [220, 247, 262, 247, 220, 196, 220, 262, 294, 262, 247, 220, 196, 175, 196, 220],
    bass: [110, 110, 123, 123, 131, 131, 110, 110] },
  // 4 calm night (Mono vibe)
  { tempo: 0.34, wave: "sine", gain: 0.11,
    melody: [392, 440, 523, 440, 392, 349, 392, 440, 523, 587, 523, 440, 392, 349, 330, 392],
    bass: [98, 98, 110, 110, 123, 123, 110, 110] },
  // 5 warm fun (Super Tuna vibe)
  { tempo: 0.2, wave: "triangle", gain: 0.12,
    melody: [523, 587, 659, 587, 523, 659, 784, 659, 587, 523, 440, 523, 587, 659, 587, 523],
    bass: [131, 147, 165, 147, 131, 165, 196, 165] },
  // 6 dance bright (Hope World vibe)
  { tempo: 0.16, wave: "square", gain: 0.11,
    melody: [784, 880, 988, 880, 784, 988, 1175, 988, 880, 784, 659, 784, 880, 988, 880, 784],
    bass: [196, 196, 220, 220, 247, 247, 262, 262] },
];