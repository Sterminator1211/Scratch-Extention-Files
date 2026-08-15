(function (Scratch) {
  'use strict';
  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Lollipop Dependency must run unsandboxed');
  }
  // ---------- detection helpers ----------
  function supportsCanvas2D() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext && c.getContext('2d'));
    } catch (e) {
      return false;
    }
  }
  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(
        c.getContext('webgl') ||
        c.getContext('experimental-webgl') ||
        c.getContext('webgl2')
      );
    } catch (e) {
      return false;
    }
  }
  function supportsWebGPU() {
    return !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function');
  }
  function supportsWebAssembly() {
    return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  }
  // Engine detection (feature + UA hybrid, best-effort)
  function isBlink() {
    // Chromium family
    if (window.chrome && window.chrome.runtime) return true;
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('(-webkit-appearance:none)')) {
      // further narrow
    }
    const ua = navigator.userAgent || '';
    if (/Chrome\/|Chromium\/|Edg\/|OPR\//.test(ua) && !/Firefox|FxiOS/.test(ua)) {
      // exclude iOS browsers that pretend to be Chrome (they are WebKit)
      if (!/iPhone|iPad|iPod/.test(ua) || /CriOS/.test(ua) === false) {
        // still imperfect on iOS
      }
    }
    // Strong signals
    return !!(
      (window.chrome && !window.opr && !window.opera) ||
      (navigator.userAgentData &&
        navigator.userAgentData.brands &&
        navigator.userAgentData.brands.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand)))
    );
  }
  function isGecko() {
    // Firefox family
    return !!(
      typeof InstallTrigger !== 'undefined' ||
      'MozAppearance' in (document.documentElement.style || {}) ||
      navigator.buildID ||
      /Gecko\/|Firefox\//.test(navigator.userAgent || '')
    ) && !isBlink();
  }
  function isWebKit() {
    // Safari / WebKit (including all iOS browsers)
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    return (
      (vendor.indexOf('Apple') === 0 || /AppleWebKit/.test(ua)) &&
      !isBlink() &&
      !isGecko()
    );
  }
  function isServo() {
    // Extremely rare in the wild
    return /Servo/.test(navigator.userAgent || '');
  }
  // ANGLE detection via WebGL renderer string
  function supportsANGLE() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return false;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (!dbg) return false;
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
      return /ANGLE/i.test(renderer);
    } catch (e) {
      return false;
    }
  }
  // GPU name via WebGL debug renderer info
  function getGPUName() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl') || c.getContext('webgl2');
      if (!gl) return 'Unknown (no WebGL)';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (!dbg) return 'Unknown (debug info unavailable)';
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
      return renderer || 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  }
  // Library presence (only true if the library script has been loaded and exposed a global)
  function hasThreeJS() {
    return typeof window.THREE === 'object' && window.THREE !== null;
  }
  function hasBabylonJS() {
    return typeof window.BABYLON === 'object' && window.BABYLON !== null;
  }
  function hasPlayCanvas() {
    return typeof window.pc === 'object' && window.pc !== null;
  }
  function hasFilament() {
    return typeof window.Filament === 'object' && window.Filament !== null;
  }
  function hasPixiJS() {
    return typeof window.PIXI === 'object' && window.PIXI !== null;
  }
  function hasPhaser() {
    return typeof window.Phaser === 'object' && window.Phaser !== null;
  }
  function hasPaperJS() {
    return typeof window.paper === 'object' && window.paper !== null;
  }
  // ---------- extension ----------
  class LollipopDependency {
    getInfo() {
      return {
        id: 'lollipopdependency',
        name: 'Lollipop Dependency',
        color1: '#FF6B9D',
        color2: '#C44D7A',
        color3: '#9B3A5E',
        blocks: [
          {
            opcode: 'returnGPUName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Return GPU Name',
            disableMonitor: true
          },
          {
            opcode: 'supportsWebGL',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports WebGL?',
            disableMonitor: true
          },
          {
            opcode: 'supportsWebGPU',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports WebGPU?',
            disableMonitor: true
          },
          {
            opcode: 'supportsCanvas2D',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Canvas2D Context?',
            disableMonitor: true
          },
          {
            opcode: 'supportsWebAssembly',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports WebAssembly?',
            disableMonitor: true
          },
          {
            opcode: 'supportsBlink',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Blink?',
            disableMonitor: true
          },
          {
            opcode: 'supportsGecko',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Gecko?',
            disableMonitor: true
          },
          {
            opcode: 'supportsWebKit',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports WebKit?',
            disableMonitor: true
          },
          {
            opcode: 'supportsServo',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Servo?',
            disableMonitor: true
          },
          {
            opcode: 'supportsANGLE',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports ANGLE?',
            disableMonitor: true
          },
          {
            opcode: 'supportsThreeJS',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Three.js?',
            disableMonitor: true
          },
          {
            opcode: 'supportsBabylonJS',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Babylon.js?',
            disableMonitor: true
          },
          {
            opcode: 'supportsPlayCanvas',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports PlayCanvas?',
            disableMonitor: true
          },
          {
            opcode: 'supportsFilament',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Filament?',
            disableMonitor: true
          },
          {
            opcode: 'supportsPixiJS',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports PixiJS?',
            disableMonitor: true
          },
          {
            opcode: 'supportsPhaser',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Phaser?',
            disableMonitor: true
          },
          {
            opcode: 'supportsPaperJS',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser Supports Paper.js?',
            disableMonitor: true
          }
        ]
      };
    }
    supportsWebGL() {
      return supportsWebGL();
    }
    supportsWebGPU() {
      return supportsWebGPU();
    }
    supportsCanvas2D() {
      return supportsCanvas2D();
    }
    supportsWebAssembly() {
      return supportsWebAssembly();
    }
    supportsBlink() {
      return isBlink();
    }
    supportsGecko() {
      return isGecko();
    }
    supportsWebKit() {
      return isWebKit();
    }
    supportsServo() {
      return isServo();
    }
    supportsANGLE() {
      return supportsANGLE();
    }
    returnGPUName() {
      return getGPUName();
    }
    supportsThreeJS() {
      return hasThreeJS();
    }
    supportsBabylonJS() {
      return hasBabylonJS();
    }
    supportsPlayCanvas() {
      return hasPlayCanvas();
    }
    supportsFilament() {
      return hasFilament();
    }
    supportsPixiJS() {
      return hasPixiJS();
    }
    supportsPhaser() {
      return hasPhaser();
    }
    supportsPaperJS() {
      return hasPaperJS();
    }
  }
  Scratch.extensions.register(new LollipopDependency());
})(Scratch);
