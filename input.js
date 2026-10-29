export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.prev = {};
    this.virtual = {};
    this.virtualPrev = {};
    // Буфер прыжка: если нажатие пришло и было отпущено между кадрами,
    // оно всё равно сработает в ближайшем update.
    this.jumpBuffer = 0;

    this.map = {
      ArrowLeft: "left", KeyA: "left",
      ArrowRight: "right", KeyD: "right",
      Space: "jump", KeyW: "jump", ArrowUp: "jump",
      Escape: "pause", KeyP: "pause",
    };

    this.onKeyDown = (e) => {
      const action = this.map[e.code];
      if (action) {
        e.preventDefault();
        if (!this.keys[action]) {
          this.keys[action] = true;
          if (action === "jump") this.jumpBuffer = 0.12;
        }
      }
    };
    this.onKeyUp = (e) => {
      const action = this.map[e.code];
      if (action) {
        e.preventDefault();
        this.keys[action] = false;
      }
    };
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  setVirtual(key, val) {
    const was = this.virtual[key];
    this.virtual[key] = val;
    if (key === "jump" && val && !was) {
      this.jumpBuffer = 0.12;
    }
  }

  isDown(action) {
    return !!(this.keys[action] || this.virtual[action]);
  }

  justPressed(action) {
    // Прыжок: сначала проверяем буфер (работает и для тача, и для клавы)
    if (action === "jump") {
      if (this.jumpBuffer > 0) {
        this.jumpBuffer = 0;
        // синхронизируем prev, чтобы следующая проверка не сработала ложно
        this.prev.jump = this.keys.jump;
        this.virtualPrev.jump = this.virtual.jump;
        return true;
      }
      const now = this.isDown(action);
      const was = this.prev[action] || this.virtualPrev[action];
      this.prev[action] = this.keys[action];
      this.virtualPrev[action] = this.virtual[action];
      return now && !was;
    }

    const now = this.isDown(action);
    const was = this.prev[action] || this.virtualPrev[action];
    this.prev[action] = this.keys[action];
    this.virtualPrev[action] = this.virtual[action];
    return now && !was;
  }

  tick(dt) {
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
  }

  clear() {
    this.keys = {};
    this.prev = {};
    this.virtual = {};
    this.virtualPrev = {};
    this.jumpBuffer = 0;
  }
}