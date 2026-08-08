// Name: Generic Controller Extension
// ID: genericController
// Description: Full controller/gamepad support — buttons, axes, hats, edge detection, rumble (where available), raw dumps, hold times, and more.
// Compatible with PenguinMod / TurboWarp (MUST be loaded unsandboxed)
// License: MIT

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Generic Controller Extension must run unsandboxed");
  }

  // ===== Configuration =====
  const DEFAULT_AXIS_DEADZONE = 0.1;
  let axisDeadzone = DEFAULT_AXIS_DEADZONE;
  const BUTTON_DEADZONE = 0.05;
  let axisMoveThreshold = 0.05; // for "axis moved" detection

  /**
   * @typedef InternalGamepadState
   * @property {string} id
   * @property {string} mapping
   * @property {Gamepad} realGamepad
   * @property {number} timestamp
   * @property {number} index
   * @property {number[]} axisDirections
   * @property {number[]} axisMagnitudes
   * @property {number[]} axisValues
   * @property {number[]} buttonValues
   * @property {boolean[]} buttonPressed
   * @property {boolean[]} buttonTouched
   */

  /** @type {Array<InternalGamepadState|null>} */
  let gamepadState = [];

  // Edge detection + hold timing
  /** @type {Map<string, boolean[]>} */
  const previousButtonPressed = new Map();
  /** @type {Map<string, number[]>} */
  const previousAxisValues = new Map();
  /** @type {Map<string, number[]>}  key → array of press-start timestamps (ms) */
  const buttonPressStart = new Map();
  /** @type {Set<string>} */
  const connectedIds = new Set();
  /** @type {Set<string>} */
  const justConnected = new Set();
  /** @type {Set<string>} */
  const justDisconnected = new Set();

  const now = () => performance.now();

  const updateState = () => {
    const gamepads = navigator.getGamepads();
    const oldState = gamepadState;
    const currentIds = new Set();
    const t = now();

    gamepadState = Array.from(gamepads).map((gamepad) => {
      if (!gamepad) return null;

      const key = gamepad.id + "|" + gamepad.index;
      currentIds.add(key);

      /** @type {InternalGamepadState} */
      const result = {
        id: gamepad.id,
        mapping: gamepad.mapping || "standard",
        realGamepad: gamepad,
        timestamp: gamepad.timestamp,
        index: gamepad.index,
        axisDirections: [],
        axisMagnitudes: [],
        axisValues: [],
        buttonValues: [],
        buttonPressed: [],
        buttonTouched: [],
      };

      const oldResult = oldState.find(
        (i) => i !== null && i.id === gamepad.id && i.index === gamepad.index
      );

      // Circular deadzone for axis pairs
      for (let i = 0; i < gamepad.axes.length; i += 2) {
        const x = gamepad.axes[i];
        const y = i + 1 >= gamepad.axes.length ? 0 : gamepad.axes[i + 1];
        const magnitude = Math.sqrt(x * x + y * y);

        if (magnitude > axisDeadzone) {
          let direction = (Math.atan2(y, x) * 180) / Math.PI + 90;
          if (direction < 0) direction += 360;
          result.axisDirections.push(direction, direction);
          result.axisMagnitudes.push(magnitude, magnitude);
          result.axisValues.push(x, y);
        } else {
          const oldDirection = oldResult ? oldResult.axisDirections[i] : 90;
          result.axisDirections.push(oldDirection, oldDirection);
          result.axisMagnitudes.push(0, 0);
          result.axisValues.push(0, 0);
        }
      }

      // Leftover single axis
      if (gamepad.axes.length % 2 === 1) {
        const last = gamepad.axes[gamepad.axes.length - 1];
        const abs = Math.abs(last);
        result.axisValues.push(abs > axisDeadzone ? last : 0);
        result.axisMagnitudes.push(abs > axisDeadzone ? abs : 0);
        result.axisDirections.push(90);
      }

      // Buttons + hold timing
      let starts = buttonPressStart.get(key);
      if (!starts || starts.length !== gamepad.buttons.length) {
        starts = new Array(gamepad.buttons.length).fill(0);
        buttonPressStart.set(key, starts);
      }

      for (let i = 0; i < gamepad.buttons.length; i++) {
        let value = gamepad.buttons[i].value;
        if (value < BUTTON_DEADZONE) value = 0;
        const pressed = !!gamepad.buttons[i].pressed;

        result.buttonValues.push(value);
        result.buttonPressed.push(pressed);
        result.buttonTouched.push(!!gamepad.buttons[i].touched);

        if (pressed) {
          if (starts[i] === 0) starts[i] = t; // just pressed
        } else {
          starts[i] = 0; // released
        }
      }

      return result;
    });

    // Connect / disconnect detection
    justConnected.clear();
    justDisconnected.clear();

    for (const id of currentIds) {
      if (!connectedIds.has(id)) {
        justConnected.add(id);
        connectedIds.add(id);
      }
    }
    for (const id of [...connectedIds]) {
      if (!currentIds.has(id)) {
        justDisconnected.add(id);
        connectedIds.delete(id);
        previousButtonPressed.delete(id);
        previousAxisValues.delete(id);
        buttonPressStart.delete(id);
      }
    }
  };

  Scratch.vm.runtime.on("BEFORE_EXECUTE", () => {
    updateState();
  });

  window.addEventListener("gamepadconnected", (e) => {
    justConnected.add(e.gamepad.id + "|" + e.gamepad.index);
    connectedIds.add(e.gamepad.id + "|" + e.gamepad.index);
    updateState();
  });
  window.addEventListener("gamepaddisconnected", (e) => {
    justDisconnected.add(e.gamepad.id + "|" + e.gamepad.index);
    connectedIds.delete(e.gamepad.id + "|" + e.gamepad.index);
    updateState();
  });

  /**
   * @param {unknown} index 1-indexed or 'any'
   * @returns {InternalGamepadState[]}
   */
  const getGamepads = (index) => {
    if (index === "any") return gamepadState.filter((i) => i);
    const n = Scratch.Cast.toNumber(index) - 1;
    const gp = gamepadState[n];
    return gp ? [gp] : [];
  };

  const isButtonPressed = (gamepad, buttonIndex) => {
    if (buttonIndex === "any") return gamepad.buttonPressed.some((v) => v);
    return !!gamepad.buttonPressed[Scratch.Cast.toNumber(buttonIndex) - 1];
  };

  const getButtonValue = (gamepad, buttonIndex) => {
    return gamepad.buttonValues[Scratch.Cast.toNumber(buttonIndex) - 1] || 0;
  };

  const getAxisValue = (gamepad, axisIndex) => {
    return gamepad.axisValues[Scratch.Cast.toNumber(axisIndex) - 1] || 0;
  };

  const getAxisPairMagnitude = (gamepad, startIndex) => {
    return gamepad.axisMagnitudes[Scratch.Cast.toNumber(startIndex) - 1] || 0;
  };

  const getAxisPairDirection = (gamepad, startIndex) => {
    return gamepad.axisDirections[Scratch.Cast.toNumber(startIndex) - 1] || 0;
  };

  // ===== Extension Class =====
  class GenericControllerExtension {
    getInfo() {
      return {
        id: "genericController",
        name: "Generic Controller Extension",
        color1: "#4C97FF",
        color2: "#3373CC",
        color3: "#2E5AA6",
        blocks: [
          // ---------- Connection ----------
          {
            opcode: "gamepadConnected",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "controller [PAD] connected?",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenGamepadConnected",
            blockType: Scratch.BlockType.HAT,
            text: "when controller [PAD] connected",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenGamepadDisconnected",
            blockType: Scratch.BlockType.HAT,
            text: "when controller [PAD] disconnected",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "numberOfGamepads",
            blockType: Scratch.BlockType.REPORTER,
            text: "number of controllers connected",
          },
          {
            opcode: "listControllerIds",
            blockType: Scratch.BlockType.REPORTER,
            text: "list of connected controller ids",
          },
          {
            opcode: "gamepadId",
            blockType: Scratch.BlockType.REPORTER,
            text: "id of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "gamepadIndex",
            blockType: Scratch.BlockType.REPORTER,
            text: "index of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "gamepadMapping",
            blockType: Scratch.BlockType.REPORTER,
            text: "mapping of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "gamepadTimestamp",
            blockType: Scratch.BlockType.REPORTER,
            text: "timestamp of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },

          "---",

          // ---------- Buttons ----------
          {
            opcode: "buttonDown",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "button [B] on controller [PAD] pressed?",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "buttonJustPressed",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "button [B] on controller [PAD] just pressed?",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "buttonJustReleased",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "button [B] on controller [PAD] just released?",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "buttonValue",
            blockType: Scratch.BlockType.REPORTER,
            text: "value of button [B] on controller [PAD]",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "buttonTouched",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "button [B] on controller [PAD] touched?",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "buttonHoldTime",
            blockType: Scratch.BlockType.REPORTER,
            text: "hold time of button [B] on controller [PAD] (seconds)",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "numberOfButtons",
            blockType: Scratch.BlockType.REPORTER,
            text: "number of buttons on controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "rawButtons",
            blockType: Scratch.BlockType.REPORTER,
            text: "raw button values of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenButtonPressed",
            blockType: Scratch.BlockType.HAT,
            text: "when button [B] on controller [PAD] pressed",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenButtonReleased",
            blockType: Scratch.BlockType.HAT,
            text: "when button [B] on controller [PAD] released",
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "buttonMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenAnyButtonPressed",
            blockType: Scratch.BlockType.HAT,
            text: "when any button on controller [PAD] pressed",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },

          "---",

          // ---------- Axes ----------
          {
            opcode: "axisValue",
            blockType: Scratch.BlockType.REPORTER,
            text: "value of axis [AXIS] on controller [PAD]",
            arguments: {
              AXIS: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "axisMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "axisDirection",
            blockType: Scratch.BlockType.REPORTER,
            text: "direction of axes [AXIS] on controller [PAD]",
            arguments: {
              AXIS: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "axesGroupMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "axisMagnitude",
            blockType: Scratch.BlockType.REPORTER,
            text: "magnitude of axes [AXIS] on controller [PAD]",
            arguments: {
              AXIS: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "axesGroupMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "axisMovedPast",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "axis [AXIS] on controller [PAD] moved past [THRESHOLD]?",
            arguments: {
              AXIS: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "axisMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
              THRESHOLD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.2" },
            },
          },
          {
            opcode: "numberOfAxes",
            blockType: Scratch.BlockType.REPORTER,
            text: "number of axes on controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "rawAxes",
            blockType: Scratch.BlockType.REPORTER,
            text: "raw axis values of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenAxisMoved",
            blockType: Scratch.BlockType.HAT,
            text: "when axis [AXIS] on controller [PAD] moved",
            arguments: {
              AXIS: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "axisMenu" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "whenAnyAxisMoved",
            blockType: Scratch.BlockType.HAT,
            text: "when any axis on controller [PAD] moved",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },

          "---",

          // ---------- Rumble / Haptics ----------
          {
            opcode: "rumble",
            blockType: Scratch.BlockType.COMMAND,
            text: "rumble strong [STRONG] and weak [WEAK] for [TIME] seconds on controller [PAD]",
            arguments: {
              STRONG: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.25" },
              WEAK: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.5" },
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.25" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "triggerRumble",
            blockType: Scratch.BlockType.COMMAND,
            text: "trigger rumble left [LEFT] right [RIGHT] for [TIME] seconds on controller [PAD]",
            arguments: {
              LEFT: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.5" },
              RIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.5" },
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.25" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "pulse",
            blockType: Scratch.BlockType.COMMAND,
            text: "pulse intensity [VALUE] for [TIME] seconds on controller [PAD]",
            arguments: {
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1" },
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.2" },
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "stopRumble",
            blockType: Scratch.BlockType.COMMAND,
            text: "stop rumble on controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "canRumble",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "controller [PAD] supports rumble?",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },
          {
            opcode: "supportedHapticEffects",
            blockType: Scratch.BlockType.REPORTER,
            text: "supported haptic effects of controller [PAD]",
            arguments: {
              PAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1", menu: "padMenu" },
            },
          },

          "---",

          // ---------- Settings ----------
          {
            opcode: "setAxisDeadzone",
            blockType: Scratch.BlockType.COMMAND,
            text: "set axis deadzone to [DEADZONE]",
            arguments: {
              DEADZONE: { type: Scratch.ArgumentType.NUMBER, defaultValue: String(DEFAULT_AXIS_DEADZONE) },
            },
          },
          {
            opcode: "getAxisDeadzone",
            blockType: Scratch.BlockType.REPORTER,
            text: "axis deadzone",
          },
          {
            opcode: "setAxisMoveThreshold",
            blockType: Scratch.BlockType.COMMAND,
            text: "set axis move threshold to [THRESHOLD]",
            arguments: {
              THRESHOLD: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.05" },
            },
          },
          {
            opcode: "getAxisMoveThreshold",
            blockType: Scratch.BlockType.REPORTER,
            text: "axis move threshold",
          },
          {
            opcode: "forceUpdate",
            blockType: Scratch.BlockType.COMMAND,
            text: "force update controller state",
          },
        ],
        menus: {
          padMenu: {
            acceptReporters: true,
            items: [
              { text: "any", value: "any" },
              { text: "1", value: "1" },
              { text: "2", value: "2" },
              { text: "3", value: "3" },
              { text: "4", value: "4" },
            ],
          },
          buttonMenu: {
            acceptReporters: true,
            items: [
              { text: "any", value: "any" },
              { text: "A / Cross (1)", value: "1" },
              { text: "B / Circle (2)", value: "2" },
              { text: "X / Square (3)", value: "3" },
              { text: "Y / Triangle (4)", value: "4" },
              { text: "Left bumper (5)", value: "5" },
              { text: "Right bumper (6)", value: "6" },
              { text: "Left trigger (7)", value: "7" },
              { text: "Right trigger (8)", value: "8" },
              { text: "Select / Share (9)", value: "9" },
              { text: "Start / Options (10)", value: "10" },
              { text: "Left stick press (11)", value: "11" },
              { text: "Right stick press (12)", value: "12" },
              { text: "D-pad up (13)", value: "13" },
              { text: "D-pad down (14)", value: "14" },
              { text: "D-pad left (15)", value: "15" },
              { text: "D-pad right (16)", value: "16" },
              { text: "17", value: "17" },
              { text: "18", value: "18" },
              { text: "19", value: "19" },
              { text: "20", value: "20" },
            ],
          },
          axisMenu: {
            acceptReporters: true,
            items: [
              { text: "Left stick X (1)", value: "1" },
              { text: "Left stick Y (2)", value: "2" },
              { text: "Right stick X (3)", value: "3" },
              { text: "Right stick Y (4)", value: "4" },
              { text: "5", value: "5" },
              { text: "6", value: "6" },
              { text: "7", value: "7" },
              { text: "8", value: "8" },
            ],
          },
          axesGroupMenu: {
            acceptReporters: true,
            items: [
              { text: "Left stick (1 & 2)", value: "1" },
              { text: "Right stick (3 & 4)", value: "3" },
              { text: "Axes 5 & 6", value: "5" },
              { text: "Axes 7 & 8", value: "7" },
            ],
          },
        },
      };
    }

    // ---------- Connection ----------
    gamepadConnected({ PAD }) {
      return getGamepads(PAD).length > 0;
    }

    whenGamepadConnected({ PAD }) {
      if (PAD === "any") return justConnected.size > 0;
      for (const gp of getGamepads(PAD)) {
        if (justConnected.has(gp.id + "|" + gp.index)) return true;
      }
      return false;
    }

    whenGamepadDisconnected({ PAD }) {
      if (PAD === "any") return justDisconnected.size > 0;
      const requested = Scratch.Cast.toNumber(PAD) - 1;
      for (const key of justDisconnected) {
        if (parseInt(key.split("|").pop(), 10) === requested) return true;
      }
      return false;
    }

    numberOfGamepads() {
      return gamepadState.filter((g) => g).length;
    }

    listControllerIds() {
      return gamepadState
        .filter((g) => g)
        .map((g) => g.id)
        .join(", ");
    }

    gamepadId({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].id : "";
    }

    gamepadIndex({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].index + 1 : 0; // 1-based for users
    }

    gamepadMapping({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].mapping : "";
    }

    gamepadTimestamp({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].timestamp : 0;
    }

    // ---------- Buttons ----------
    buttonDown({ B, PAD }) {
      for (const gp of getGamepads(PAD)) {
        if (isButtonPressed(gp, B)) return true;
      }
      return false;
    }

    buttonJustPressed({ B, PAD }) {
      for (const gp of getGamepads(PAD)) {
        const key = gp.id + "|" + gp.index;
        const prev = previousButtonPressed.get(key) || [];
        const curr = gp.buttonPressed;

        if (B === "any") {
          for (let i = 0; i < curr.length; i++) {
            if (curr[i] && !prev[i]) {
              previousButtonPressed.set(key, [...curr]);
              return true;
            }
          }
        } else {
          const idx = Scratch.Cast.toNumber(B) - 1;
          if (curr[idx] && !prev[idx]) {
            previousButtonPressed.set(key, [...curr]);
            return true;
          }
        }
        previousButtonPressed.set(key, [...curr]);
      }
      return false;
    }

    buttonJustReleased({ B, PAD }) {
      for (const gp of getGamepads(PAD)) {
        const key = gp.id + "|" + gp.index;
        const prev = previousButtonPressed.get(key) || [];
        const curr = gp.buttonPressed;

        if (B === "any") {
          for (let i = 0; i < curr.length; i++) {
            if (!curr[i] && prev[i]) {
              previousButtonPressed.set(key, [...curr]);
              return true;
            }
          }
        } else {
          const idx = Scratch.Cast.toNumber(B) - 1;
          if (!curr[idx] && prev[idx]) {
            previousButtonPressed.set(key, [...curr]);
            return true;
          }
        }
        previousButtonPressed.set(key, [...curr]);
      }
      return false;
    }

    buttonValue({ B, PAD }) {
      let max = 0;
      for (const gp of getGamepads(PAD)) {
        const v = getButtonValue(gp, B);
        if (v > max) max = v;
      }
      return max;
    }

    buttonTouched({ B, PAD }) {
      for (const gp of getGamepads(PAD)) {
        if (B === "any") {
          if (gp.buttonTouched.some((t) => t)) return true;
        } else {
          if (gp.buttonTouched[Scratch.Cast.toNumber(B) - 1]) return true;
        }
      }
      return false;
    }

    buttonHoldTime({ B, PAD }) {
      const t = now();
      let longest = 0;
      for (const gp of getGamepads(PAD)) {
        const key = gp.id + "|" + gp.index;
        const starts = buttonPressStart.get(key);
        if (!starts) continue;

        if (B === "any") {
          for (let i = 0; i < starts.length; i++) {
            if (starts[i] > 0) {
              const held = (t - starts[i]) / 1000;
              if (held > longest) longest = held;
            }
          }
        } else {
          const idx = Scratch.Cast.toNumber(B) - 1;
          if (starts[idx] > 0) {
            const held = (t - starts[idx]) / 1000;
            if (held > longest) longest = held;
          }
        }
      }
      return longest;
    }

    numberOfButtons({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].buttonPressed.length : 0;
    }

    rawButtons({ PAD }) {
      const gps = getGamepads(PAD);
      if (!gps.length) return "[]";
      return JSON.stringify(gps[0].buttonValues.map((v) => +v.toFixed(4)));
    }

    whenButtonPressed({ B, PAD }) {
      return this.buttonJustPressed({ B, PAD });
    }

    whenButtonReleased({ B, PAD }) {
      return this.buttonJustReleased({ B, PAD });
    }

    whenAnyButtonPressed({ PAD }) {
      return this.buttonJustPressed({ B: "any", PAD });
    }

    // ---------- Axes ----------
    axisValue({ AXIS, PAD }) {
      let best = 0;
      for (const gp of getGamepads(PAD)) {
        const v = getAxisValue(gp, AXIS);
        if (Math.abs(v) > Math.abs(best)) best = v;
      }
      return best;
    }

    axisDirection({ AXIS, PAD }) {
      let greatestMag = 0;
      let direction = 90;
      const gps = getGamepads(PAD);

      for (const gp of gps) {
        const mag = getAxisPairMagnitude(gp, AXIS);
        if (mag > greatestMag) {
          greatestMag = mag;
          direction = getAxisPairDirection(gp, AXIS);
        }
      }

      if (greatestMag === 0 && gps.length > 0) {
        gps.sort((a, b) => b.timestamp - a.timestamp);
        direction = getAxisPairDirection(gps[0], AXIS);
      }
      return direction;
    }

    axisMagnitude({ AXIS, PAD }) {
      let greatest = 0;
      for (const gp of getGamepads(PAD)) {
        const mag = getAxisPairMagnitude(gp, AXIS);
        if (mag > greatest) greatest = mag;
      }
      return greatest;
    }

    axisMovedPast({ AXIS, PAD, THRESHOLD }) {
      const thresh = Math.abs(Scratch.Cast.toNumber(THRESHOLD));
      for (const gp of getGamepads(PAD)) {
        if (Math.abs(getAxisValue(gp, AXIS)) >= thresh) return true;
      }
      return false;
    }

    numberOfAxes({ PAD }) {
      const gps = getGamepads(PAD);
      return gps.length ? gps[0].axisValues.length : 0;
    }

    rawAxes({ PAD }) {
      const gps = getGamepads(PAD);
      if (!gps.length) return "[]";
      return JSON.stringify(gps[0].axisValues.map((v) => +v.toFixed(4)));
    }

    whenAxisMoved({ AXIS, PAD }) {
      for (const gp of getGamepads(PAD)) {
        const key = gp.id + "|" + gp.index;
        const prev = previousAxisValues.get(key) || [];
        const curr = gp.axisValues;
        const idx = Scratch.Cast.toNumber(AXIS) - 1;
        const currVal = curr[idx] || 0;
        const prevVal = prev[idx] || 0;

        if (Math.abs(currVal - prevVal) > axisMoveThreshold) {
          previousAxisValues.set(key, [...curr]);
          return true;
        }
        previousAxisValues.set(key, [...curr]);
      }
      return false;
    }

    whenAnyAxisMoved({ PAD }) {
      for (const gp of getGamepads(PAD)) {
        const key = gp.id + "|" + gp.index;
        const prev = previousAxisValues.get(key) || [];
        const curr = gp.axisValues;

        for (let i = 0; i < curr.length; i++) {
          if (Math.abs((curr[i] || 0) - (prev[i] || 0)) > axisMoveThreshold) {
            previousAxisValues.set(key, [...curr]);
            return true;
          }
        }
        previousAxisValues.set(key, [...curr]);
      }
      return false;
    }

    // ---------- Rumble / Haptics ----------
    // Note: Firefox does not expose vibrationActuator at all.
    // Even on Chrome many 3rd-party pads (incl. most 8BitDo) never get the property.
    rumble({ STRONG, WEAK, TIME, PAD }) {
      const s = Math.max(0, Math.min(1, Scratch.Cast.toNumber(STRONG)));
      const w = Math.max(0, Math.min(1, Scratch.Cast.toNumber(WEAK)));
      const t = Math.max(0, Scratch.Cast.toNumber(TIME));

      for (const { realGamepad } of getGamepads(PAD)) {
        const actuator = realGamepad.vibrationActuator;
        if (actuator && typeof actuator.playEffect === "function") {
          try {
            actuator.playEffect("dual-rumble", {
              startDelay: 0,
              duration: t * 1000,
              weakMagnitude: w,
              strongMagnitude: s,
            });
          } catch (e) {
            /* ignore */
          }
        }
      }
    }

    triggerRumble({ LEFT, RIGHT, TIME, PAD }) {
      const l = Math.max(0, Math.min(1, Scratch.Cast.toNumber(LEFT)));
      const r = Math.max(0, Math.min(1, Scratch.Cast.toNumber(RIGHT)));
      const t = Math.max(0, Scratch.Cast.toNumber(TIME));

      for (const { realGamepad } of getGamepads(PAD)) {
        const actuator = realGamepad.vibrationActuator;
        if (
          actuator &&
          typeof actuator.playEffect === "function" &&
          Array.isArray(actuator.effects) &&
          actuator.effects.includes("trigger-rumble")
        ) {
          try {
            actuator.playEffect("trigger-rumble", {
              startDelay: 0,
              duration: t * 1000,
              leftTrigger: l,
              rightTrigger: r,
            });
          } catch (e) {
            /* ignore */
          }
        }
      }
    }

    pulse({ VALUE, TIME, PAD }) {
      // Older / alternate haptic API (hapticActuators + pulse)
      const v = Math.max(0, Math.min(1, Scratch.Cast.toNumber(VALUE)));
      const t = Math.max(0, Scratch.Cast.toNumber(TIME)) * 1000;

      for (const { realGamepad } of getGamepads(PAD)) {
        // Modern path
        if (realGamepad.vibrationActuator) {
          try {
            realGamepad.vibrationActuator.playEffect("dual-rumble", {
              startDelay: 0,
              duration: t,
              weakMagnitude: v,
              strongMagnitude: v,
            });
          } catch (e) {}
        }
        // Legacy path (some older Chrome / experimental)
        // @ts-ignore
        const actuators = realGamepad.hapticActuators;
        if (Array.isArray(actuators)) {
          for (const act of actuators) {
            if (typeof act.pulse === "function") {
              try {
                act.pulse(v, t);
              } catch (e) {}
            }
          }
        }
      }
    }

    stopRumble({ PAD }) {
      for (const { realGamepad } of getGamepads(PAD)) {
        const actuator = realGamepad.vibrationActuator;
        if (actuator) {
          try {
            if (typeof actuator.reset === "function") {
              actuator.reset();
            } else {
              actuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 1,
                weakMagnitude: 0,
                strongMagnitude: 0,
              });
            }
          } catch (e) {}
        }
      }
    }

    canRumble({ PAD }) {
      for (const { realGamepad } of getGamepads(PAD)) {
        if (realGamepad.vibrationActuator) return true;
        // @ts-ignore
        if (Array.isArray(realGamepad.hapticActuators) && realGamepad.hapticActuators.length) {
          return true;
        }
      }
      return false;
    }

    supportedHapticEffects({ PAD }) {
      for (const { realGamepad } of getGamepads(PAD)) {
        const actuator = realGamepad.vibrationActuator;
        if (actuator && Array.isArray(actuator.effects)) {
          return actuator.effects.join(", ");
        }
        if (actuator) return "dual-rumble"; // assume basic support
      }
      return "";
    }

    // ---------- Settings ----------
    setAxisDeadzone({ DEADZONE }) {
      axisDeadzone = Math.max(0, Math.min(1, Scratch.Cast.toNumber(DEADZONE)));
      updateState();
    }

    getAxisDeadzone() {
      return axisDeadzone;
    }

    setAxisMoveThreshold({ THRESHOLD }) {
      axisMoveThreshold = Math.max(0, Scratch.Cast.toNumber(THRESHOLD));
    }

    getAxisMoveThreshold() {
      return axisMoveThreshold;
    }

    forceUpdate() {
      updateState();
    }
  }

  Scratch.extensions.register(new GenericControllerExtension());
})(Scratch);
