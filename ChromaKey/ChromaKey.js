(function (Scratch) {
  'use strict';

  const MODES = [
    'None',
    'Deuteranomaly',
    'Protanomaly',
    'Deuteranopia',
    'Protanopia',
    'Tritanomaly',
    'Tritanopia',
    'Achromatopsia'
  ];

  const state = {
    red: 100,
    green: 100,
    blue: 100,
    mode: 'None',
    effect: 'none'
  };

  let filterNumber = 0;

  function clampAmount(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 100;
    }

    return Math.max(0, Math.min(200, number));
  }

  function getStageCanvas() {
    return (
      Scratch.vm?.runtime?.renderer?._canvas ||
      Scratch.vm?.runtime?.renderer?.canvas ||
      Scratch.vm?.renderer?.canvas ||
      document.querySelector('canvas')
    );
  }

  const SIMULATION_MATRICES = {
    None: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0
    ],

    Deuteranomaly: [
      0.8, 0.2, 0, 0, 0,
      0.258, 0.742, 0, 0, 0,
      0, 0.142, 0.858, 0, 0,
      0, 0, 0, 1, 0
    ],

    Protanomaly: [
      0.817, 0.183, 0, 0, 0,
      0.333, 0.667, 0, 0, 0,
      0, 0.125, 0.875, 0, 0,
      0, 0, 0, 1, 0
    ],

    Deuteranopia: [
      0.625, 0.375, 0, 0, 0,
      0.7, 0.3, 0, 0, 0,
      0, 0.3, 0.7, 0, 0,
      0, 0, 0, 1, 0
    ],

    Protanopia: [
      0.567, 0.433, 0, 0, 0,
      0.558, 0.442, 0, 0, 0,
      0, 0.242, 0.758, 0, 0,
      0, 0, 0, 1, 0
    ],

    Tritanomaly: [
      0.967, 0.033, 0, 0, 0,
      0, 0.733, 0.267, 0, 0,
      0, 0.183, 0.817, 0, 0,
      0, 0, 0, 1, 0
    ],

    Tritanopia: [
      0.95, 0.05, 0, 0, 0,
      0, 0.433, 0.567, 0, 0,
      0, 0.475, 0.525, 0, 0,
      0, 0, 0, 1, 0
    ],

    Achromatopsia: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0
    ]
  };

  const CORRECTION_MATRICES = {
    None: SIMULATION_MATRICES.None,

    Deuteranomaly: [
      1.2, -0.2, 0, 0, 0,
      -0.1, 1.1, 0, 0, 0,
      0, -0.1, 1.1, 0, 0,
      0, 0, 0, 1, 0
    ],

    Protanomaly: [
      1.2, -0.2, 0, 0, 0,
      -0.05, 1.05, 0, 0, 0,
      0, -0.05, 1.05, 0, 0,
      0, 0, 0, 1, 0
    ],

    Deuteranopia: [
      1.35, -0.35, 0, 0, 0,
      -0.25, 1.25, 0, 0, 0,
      0, -0.2, 1.2, 0, 0,
      0, 0, 0, 1, 0
    ],

    Protanopia: [
      1.35, -0.35, 0, 0, 0,
      -0.2, 1.2, 0, 0, 0,
      0, -0.15, 1.15, 0, 0,
      0, 0, 0, 1, 0
    ],

    Tritanomaly: [
      1.1, 0, -0.1, 0, 0,
      0, 1.2, -0.2, 0, 0,
      -0.1, 0, 1.1, 0, 0,
      0, 0, 0, 1, 0
    ],

    Tritanopia: [
      1.2, 0, -0.2, 0, 0,
      0, 1.35, -0.35, 0, 0,
      -0.2, 0, 1.2, 0, 0,
      0, 0, 0, 1, 0
    ],

    Achromatopsia: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0
    ]
  };

  function getBaseMatrix() {
    if (state.effect === 'simulate') {
      return SIMULATION_MATRICES[state.mode] || SIMULATION_MATRICES.None;
    }

    if (state.effect === 'correct') {
      return CORRECTION_MATRICES[state.mode] || CORRECTION_MATRICES.None;
    }

    return SIMULATION_MATRICES.None;
  }

  function getAdjustedMatrix() {
    const base = getBaseMatrix();

    const redFactor = state.red / 100;
    const greenFactor = state.green / 100;
    const blueFactor = state.blue / 100;

    return [
      base[0] * redFactor,
      base[1] * redFactor,
      base[2] * redFactor,
      base[3] * redFactor,
      base[4] * redFactor,

      base[5] * greenFactor,
      base[6] * greenFactor,
      base[7] * greenFactor,
      base[8] * greenFactor,
      base[9] * greenFactor,

      base[10] * blueFactor,
      base[11] * blueFactor,
      base[12] * blueFactor,
      base[13] * blueFactor,
      base[14] * blueFactor,

      0,
      0,
      0,
      1,
      0
    ];
  }

  function removeOldFilters() {
    document
      .querySelectorAll('[id^="chromakey-svg-"]')
      .forEach(element => element.remove());
  }

  function applyFilter() {
    const canvas = getStageCanvas();

    if (!canvas) {
      return;
    }

    removeOldFilters();

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg');
    const filter = document.createElementNS(svgNamespace, 'filter');
    const colorMatrix = document.createElementNS(svgNamespace, 'feColorMatrix');

    const filterId = `chromakey-filter-${++filterNumber}`;
    const svgId = `chromakey-svg-${filterNumber}`;

    svg.setAttribute('id', svgId);
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');

    svg.style.position = 'absolute';
    svg.style.left = '-99999px';
    svg.style.top = '-99999px';
    svg.style.pointerEvents = 'none';

    filter.setAttribute('id', filterId);
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', getAdjustedMatrix().join(' '));

    filter.appendChild(colorMatrix);
    svg.appendChild(filter);
    document.body.appendChild(svg);

    canvas.style.filter = `url("#${filterId}")`;
  }

  function updateStage() {
    const canvas = getStageCanvas();

    if (!canvas) {
      return;
    }

    const isDefault =
      state.red === 100 &&
      state.green === 100 &&
      state.blue === 100 &&
      state.mode === 'None';

    if (isDefault) {
      removeOldFilters();
      canvas.style.filter = 'none';
      return;
    }

    applyFilter();
  }

  class ChromaKeyExtension {
    getInfo() {
      return {
        id: 'chromakey',
        name: 'ChromaKey',
        color1: '#666666',
        color2: '#A6A6A6',

        blocks: [
          {
            opcode: 'reset',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Reset'
          },

          {
            opcode: 'setRedAmount',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set Red Amount to [VALUE]%',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },

          {
            opcode: 'setGreenAmount',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set Green Amount to [VALUE]%',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },

          {
            opcode: 'setBlueAmount',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set Blue Amount to [VALUE]%',
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },

          {
            opcode: 'simulate',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Simulate [MODE]',
            arguments: {
              MODE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'modes'
              }
            }
          },

          {
            opcode: 'filterStage',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Filter Stage for [MODE]',
            arguments: {
              MODE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'modes'
              }
            }
          }
        ],

        menus: {
          modes: MODES
        }
      };
    }

    reset() {
      state.red = 100;
      state.green = 100;
      state.blue = 100;
      state.mode = 'None';
      state.effect = 'none';

      updateStage();
    }

    setRedAmount(args) {
      state.red = clampAmount(args.VALUE);
      updateStage();
    }

    setGreenAmount(args) {
      state.green = clampAmount(args.VALUE);
      updateStage();
    }

    setBlueAmount(args) {
      state.blue = clampAmount(args.VALUE);
      updateStage();
    }

    simulate(args) {
      state.mode = args.MODE || 'None';
      state.effect = 'simulate';

      updateStage();
    }

    filterStage(args) {
      state.mode = args.MODE || 'None';
      state.effect = 'correct';

      updateStage();
    }
  }

  Scratch.extensions.register(new ChromaKeyExtension());
})(Scratch);
