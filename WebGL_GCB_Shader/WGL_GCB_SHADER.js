// Easy Cardboard VR – fixed black box version
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Must run unsandboxed");
  }

  const runtime = Scratch.vm.runtime;
  const renderer = runtime.renderer;

  let activeVersion = 0;
  let overlay = null;
  let ctx = null;
  let originalDraw = null;
  let hooked = false;

  function createOverlay() {
    if (overlay) return;

    const stageCanvas = renderer.canvas;
    overlay = document.createElement("canvas");
    overlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 99999 !important;
      background: #000;
    `;

    const parent = stageCanvas.parentElement;
    if (parent) {
      if (getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }
      parent.appendChild(overlay);
      ctx = overlay.getContext("2d");
      syncSize();
    }
  }

  function removeOverlay() {
    if (overlay) {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      ctx = null;
    }
  }

  function syncSize() {
    if (!overlay) return;
    const c = renderer.canvas;
    if (overlay.width !== c.width || overlay.height !== c.height) {
      overlay.width = c.width;
      overlay.height = c.height;
    }
  }

  function drawSplit() {
    if (!ctx || !overlay || activeVersion === 0) return;

    syncSize();
    const src = renderer.canvas;
    const w = overlay.width;
    const h = overlay.height;

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    try {
      // Left eye
      ctx.drawImage(
        src,
        0, 0, src.width / 2, src.height,
        0, 0, w / 2, h
      );

      // Right eye
      ctx.drawImage(
        src,
        src.width / 2, 0, src.width / 2, src.height,
        w / 2, 0, w / 2, h
      );
    } catch (e) {
      // if drawImage fails we just leave it black
    }
  }

  function hook() {
    if (hooked) return;

    originalDraw = renderer.draw.bind(renderer);
    renderer.draw = function () {
      originalDraw();

      if (activeVersion !== 0) {
        createOverlay();
        drawSplit();
      } else {
        // make sure overlay is gone when not active
        removeOverlay();
      }
    };
    hooked = true;
  }

  function stopEverything() {
    activeVersion = 0;
    removeOverlay();
  }

  // Clean up on project events
  runtime.on("PROJECT_STOP_ALL", stopEverything);
  runtime.on("PROJECT_LOADED", () => {
    stopEverything();
    if (hooked && originalDraw) {
      renderer.draw = originalDraw;
      hooked = false;
      originalDraw = null;
    }
  });

  class EasyCardboard {
    getInfo() {
      return {
        id: "easycardboard",
        name: "Easy Cardboard VR",
        color1: "#4C97FF",
        color2: "#3373CC",
        blocks: [
          {
            opcode: "activateV1",
            blockType: Scratch.BlockType.COMMAND,
            text: "Activate Version 1 on Stage",
          },
          {
            opcode: "activateV2",
            blockType: Scratch.BlockType.COMMAND,
            text: "Activate Version 2 on Stage",
          },
          {
            opcode: "stopVR",
            blockType: Scratch.BlockType.COMMAND,
            text: "Stop VR",
          },
          {
            opcode: "currentVersion",
            blockType: Scratch.BlockType.REPORTER,
            text: "Currently Active Version",
          },
          {
            opcode: "isVRActive",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "VR Active?",
          },
        ],
      };
    }

    activateV1() {
      hook();
      activeVersion = 1;
      createOverlay();
    }

    activateV2() {
      hook();
      activeVersion = 2;
      createOverlay();
    }

    stopVR() {
      stopEverything();
      // force a normal redraw
      if (renderer.draw) renderer.draw();
    }

    currentVersion() {
      return activeVersion === 1 ? "1" : activeVersion === 2 ? "2" : "Neither";
    }

    isVRActive() {
      return activeVersion !== 0;
    }
  }

  Scratch.extensions.register(new EasyCardboard());
})(Scratch);
