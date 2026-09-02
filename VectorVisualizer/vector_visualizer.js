(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Vector Visualizer must be run unsandboxed!');
  }

  const EXT_ID = 'vectorVisualizer';
  const DRAW_SHAPE_ID = EXT_ID + '-drawing';

  const vectors = new Map();
  let activeEditorVectorId = 'default';
  let editorOverlay = null;
  let stageOverlay = null;
  let overlayCtx = null;
  const loadedImages = {};

  function registerDrawShape() {
    if (!Scratch.gui || typeof Scratch.gui.getBlockly !== 'function') return;
    Scratch.gui.getBlockly().then(function (ScratchBlocks) {
      if (!ScratchBlocks || !ScratchBlocks.BlockSvg || typeof ScratchBlocks.BlockSvg.registerCustomShape !== 'function') {
        return;
      }
      ScratchBlocks.BlockSvg.registerCustomShape(DRAW_SHAPE_ID, {
        emptyInputPath:
          'm 16 0 h 16 h 33 a 4 4 0 0 1 4 4 l -27 12 l 27 12 a 4 4 0 0 1 -4 4 h -33 h -16 h -12 a 4 4 0 0 1 -4 -4 l 0 -24 a 4 4 0 0 1 4 -4 z',
        emptyInputWidth: 19 * ScratchBlocks.BlockSvg.GRID_UNIT,
        leftPath: function (block) {
          const edgeWidth = block.height / 2;
          const s = edgeWidth / 16;
          const height = edgeWidth * 2;
          return [
            'h ' + -12 * s +
            ' a 4 4 0 0 1 -4 -4 l ' + 0 * s + ' ' + -(height - 8) +
            ' a 4 4 0 0 1 4 -4'
          ];
        },
        rightPath: function (block) {
          const edgeWidth = block.edgeShapeWidth_;
          const s = edgeWidth / 16;
          const height = edgeWidth * 2;
          return [
            'h ' + 33 * s +
            ' a 4 4 0 0 1 4 4 l ' + -27 * s + ' ' + (height / 2 - 4) +
            ' l ' + 27 * s + ' ' + (height / 2 - 4) +
            ' a 4 4 0 0 1 -4 4 h ' + -33 * s
          ];
        }
      });
    });
  }
  registerDrawShape();

  const drawingArg = {
    shape: DRAW_SHAPE_ID,
    check: DRAW_SHAPE_ID
  };

  function parsePolygon(raw) {
    if (raw == null || raw === '') return [];
    let data = raw;
    if (typeof raw === 'string') {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        const nums = raw.split(/[\s,]+/).map(Number).filter(function (n) { return !isNaN(n); });
        const pts = [];
        for (let i = 0; i + 1 < nums.length; i += 2) {
          pts.push({ x: nums[i], y: nums[i + 1] });
        }
        return pts;
      }
    }
    if (!Array.isArray(data)) {
      if (data.points) data = data.points;
      else if (data.nodes) data = data.nodes;
      else return [];
    }
    return data.map(function (p) {
      if (Array.isArray(p)) return { x: Number(p[0]) || 0, y: Number(p[1]) || 0 };
      if (p && typeof p === 'object') return { x: Number(p.x) || 0, y: Number(p.y) || 0 };
      return null;
    }).filter(Boolean);
  }

  function polygonToDataUrl(points) {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 150, 150);
    if (points.length < 2) return canvas.toDataURL();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
      minX = Math.min(minX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxX = Math.max(maxX, points[i].x);
      maxY = Math.max(maxY, points[i].y);
    }
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const pad = 12;
    const scale = Math.min((150 - pad * 2) / w, (150 - pad * 2) / h);
    const ox = (150 - w * scale) / 2 - minX * scale;
    const oy = (150 - h * scale) / 2 - minY * scale;

    ctx.beginPath();
    ctx.moveTo(points[0].x * scale + ox, points[0].y * scale + oy);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * scale + ox, points[i].y * scale + oy);
    }
    ctx.closePath();
    ctx.fillStyle = '#1A1A2E';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.fill();
    ctx.stroke();
    return canvas.toDataURL();
  }

  class VectorVisualizer {
    getInfo() {
      return {
        id: EXT_ID,
        name: 'Vector Visualizer',
        color1: '#4C97FF',
        color2: '#3373CC',
        blocks: [
          {
            opcode: 'openEditorForId',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Open Vector Drawing Pad for ID [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' }
            }
          },
          '---',
          {
            opcode: 'visualizeVector',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Vector ID [ID] visualize [DATA]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' },
              DATA: drawingArg
            }
          },
          {
            opcode: 'setVectorFromPolygon',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set Vector ID [ID] from polygon [POLY]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' },
              POLY: {
                type: Scratch.ArgumentType.POLYGON || 'polygon',
                nodes: 4
              }
            }
          },
          {
            opcode: 'deleteVisualization',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Delete Vector ID [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' }
            }
          },
          {
            opcode: 'setVectorPosition',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set X and Y of Vector ID [ID] to [X] and [Y]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          },
          {
            opcode: 'setVectorSize',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set Size of Vector ID [ID] to [SIZE]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' },
              SIZE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'vectorReporter',
            blockType: Scratch.BlockType.REPORTER,
            text: 'saved vector drawing for ID [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'vector1' }
            },
            disableMonitor: true,
            blockShape: DRAW_SHAPE_ID,
            forceOutputType: DRAW_SHAPE_ID
          }
        ]
      };
    }

    openEditorForId(args) {
      activeEditorVectorId = Scratch.Cast.toString(args.ID) || 'vector1';
      if (editorOverlay) return;

      editorOverlay = document.createElement('div');
      editorOverlay.style.cssText =
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:#1A1A2E;padding:20px;border-radius:8px;border:2px solid #00FFFF;' +
        'z-index:999999;display:flex;flex-direction:column;align-items:center;' +
        'box-shadow:0 10px 30px rgba(0,0,0,0.8);font-family:sans-serif;color:white;';

      const title = document.createElement('h3');
      title.innerText = 'Vector Editor: [' + activeEditorVectorId + ']';
      title.style.margin = '0 0 10px 0';

      const controls = document.createElement('div');
      controls.style.cssText =
        'display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap;';

      let currentTool = 'draw';
      const tools = ['draw', 'line', 'square', 'circle', 'triangle', 'bucket'];
      const toolSelect = document.createElement('select');
      toolSelect.style.cssText =
        'padding:4px;background:#333;color:#FFF;border:1px solid #555;';
      for (let i = 0; i < tools.length; i++) {
        const t = tools[i];
        const opt = document.createElement('option');
        opt.value = t;
        opt.innerText = t === 'bucket' ? 'BUCKET' : t.toUpperCase();
        toolSelect.appendChild(opt);
      }

      const strokeLabel = document.createElement('span');
      strokeLabel.innerText = 'Stroke:';
      strokeLabel.style.fontSize = '12px';
      const strokeInput = document.createElement('input');
      strokeInput.type = 'color';
      strokeInput.value = '#00FFFF';

      const fillLabel = document.createElement('span');
      fillLabel.innerText = 'Fill:';
      fillLabel.style.fontSize = '12px';
      const fillInput = document.createElement('input');
      fillInput.type = 'color';
      fillInput.value = '#1A1A2E';

      controls.append(toolSelect, strokeLabel, strokeInput, fillLabel, fillInput);

      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      canvas.style.cssText =
        'background:#000;border:1px solid #4C97FF;cursor:crosshair;width:250px;height:250px;image-rendering:pixelated;';
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      toolSelect.onchange = function (e) {
        currentTool = e.target.value;
        canvas.style.cursor = currentTool === 'bucket' ? 'cell' : 'crosshair';
      };

      const history = [];
      let historyIndex = -1;
      const MAX_HISTORY = 40;

      const undoBtn = document.createElement('button');
      undoBtn.innerText = 'Undo';
      undoBtn.style.cssText =
        'padding:8px 14px;cursor:pointer;background:#333;color:white;border:1px solid #555;border-radius:4px;';

      const redoBtn = document.createElement('button');
      redoBtn.innerText = 'Redo';
      redoBtn.style.cssText =
        'padding:8px 14px;cursor:pointer;background:#333;color:white;border:1px solid #555;border-radius:4px;';

      function updateUndoRedoButtons() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
        undoBtn.style.opacity = undoBtn.disabled ? '0.4' : '1';
        redoBtn.style.opacity = redoBtn.disabled ? '0.4' : '1';
      }

      function saveState() {
        history.splice(historyIndex + 1);
        history.push(ctx.getImageData(0, 0, 150, 150));
        if (history.length > MAX_HISTORY) {
          history.shift();
        } else {
          historyIndex++;
        }
        updateUndoRedoButtons();
      }

      function restoreState(index) {
        if (index < 0 || index >= history.length) return;
        ctx.putImageData(history[index], 0, 0);
        historyIndex = index;
        updateUndoRedoButtons();
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 150, 150);
      saveState();

      const existing = vectors.get(activeEditorVectorId);
      if (existing && existing.imageSrc) {
        const img = new Image();
        img.onload = function () {
          ctx.drawImage(img, 0, 0, 150, 150);
          saveState();
        };
        img.src = existing.imageSrc;
      }

      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 150;
      snapCanvas.height = 150;
      const snapCtx = snapCanvas.getContext('2d');

      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      let startX = 0;
      let startY = 0;

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * (150 / rect.width),
          y: (e.clientY - rect.top) * (150 / rect.height)
        };
      }

      function applyStroke() {
        ctx.strokeStyle = strokeInput.value;
        ctx.fillStyle = fillInput.value;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      function floodFill(sx, sy, fillColorHex) {
        const imageData = ctx.getImageData(0, 0, 150, 150);
        const data = imageData.data;
        const width = 150;
        const height = 150;

        const hex = fillColorHex.replace('#', '');
        const fillR = parseInt(hex.substring(0, 2), 16);
        const fillG = parseInt(hex.substring(2, 4), 16);
        const fillB = parseInt(hex.substring(4, 6), 16);
        const fillA = 255;

        const fx = Math.max(0, Math.min(width - 1, Math.floor(sx)));
        const fy = Math.max(0, Math.min(height - 1, Math.floor(sy)));
        const startPos = (fy * width + fx) * 4;
        const targetR = data[startPos];
        const targetG = data[startPos + 1];
        const targetB = data[startPos + 2];
        const targetA = data[startPos + 3];

        if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
          return;
        }

        function match(pos) {
          return (
            data[pos] === targetR &&
            data[pos + 1] === targetG &&
            data[pos + 2] === targetB &&
            data[pos + 3] === targetA
          );
        }

        const stack = [[fx, fy]];
        const visited = new Uint8Array(width * height);

        while (stack.length) {
          const cell = stack.pop();
          const x = cell[0];
          const y = cell[1];
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const idx = y * width + x;
          if (visited[idx]) continue;
          visited[idx] = 1;
          const pos = idx * 4;
          if (!match(pos)) continue;
          data[pos] = fillR;
          data[pos + 1] = fillG;
          data[pos + 2] = fillB;
          data[pos + 3] = fillA;
          stack.push([x + 1, y]);
          stack.push([x - 1, y]);
          stack.push([x, y + 1]);
          stack.push([x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.addEventListener('mousedown', function (e) {
        e.preventDefault();
        const pos = getPos(e);
        startX = pos.x;
        startY = pos.y;
        lastX = pos.x;
        lastY = pos.y;

        if (currentTool === 'bucket') {
          floodFill(startX, startY, fillInput.value);
          saveState();
          return;
        }

        isDrawing = true;
        snapCtx.clearRect(0, 0, 150, 150);
        snapCtx.drawImage(canvas, 0, 0);

        if (currentTool === 'draw') {
          applyStroke();
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(lastX + 0.1, lastY + 0.1);
          ctx.stroke();
        }
      });

      canvas.addEventListener('mousemove', function (e) {
        if (!isDrawing || currentTool === 'bucket') return;
        const pos = getPos(e);
        applyStroke();

        if (currentTool === 'draw') {
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          lastX = pos.x;
          lastY = pos.y;
        } else {
          ctx.clearRect(0, 0, 150, 150);
          ctx.drawImage(snapCanvas, 0, 0);
          ctx.beginPath();
          if (currentTool === 'line') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
          } else if (currentTool === 'square') {
            ctx.rect(startX, startY, pos.x - startX, pos.y - startY);
            ctx.fill();
            ctx.stroke();
          } else if (currentTool === 'circle') {
            const radius = Math.sqrt(
              (pos.x - startX) * (pos.x - startX) + (pos.y - startY) * (pos.y - startY)
            );
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (currentTool === 'triangle') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.lineTo(startX - (pos.x - startX), pos.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      });

      function endDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        saveState();
      }

      window.addEventListener('mouseup', endDrawing);

      undoBtn.onclick = function () {
        if (historyIndex > 0) restoreState(historyIndex - 1);
      };
      redoBtn.onclick = function () {
        if (historyIndex < history.length - 1) restoreState(historyIndex + 1);
      };

      const clearBtn = document.createElement('button');
      clearBtn.innerText = 'Clear';
      clearBtn.style.cssText =
        'padding:8px 14px;cursor:pointer;background:#333;color:white;border:1px solid #555;border-radius:4px;';
      clearBtn.onclick = function () {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 150, 150);
        saveState();
      };

      const saveBtn = document.createElement('button');
      saveBtn.innerText = 'Save & Close';
      saveBtn.style.cssText =
        'padding:8px 16px;background:#4C97FF;color:white;border:none;cursor:pointer;border-radius:4px;';
      saveBtn.onclick = function () {
        const dataUrl = canvas.toDataURL();
        const vec = vectors.get(activeEditorVectorId) || { x: 0, y: 0, size: 50 };
        vec.imageSrc = dataUrl;
        vectors.set(activeEditorVectorId, vec);
        window.removeEventListener('mouseup', endDrawing);
        if (editorOverlay && editorOverlay.parentNode) {
          editorOverlay.parentNode.removeChild(editorOverlay);
        }
        editorOverlay = null;
      };

      const btnContainer = document.createElement('div');
      btnContainer.style.cssText =
        'margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;';
      btnContainer.append(undoBtn, redoBtn, clearBtn, saveBtn);

      editorOverlay.append(title, controls, canvas, btnContainer);
      document.body.appendChild(editorOverlay);
      updateUndoRedoButtons();
    }

    visualizeVector(args) {
      const id = Scratch.Cast.toString(args.ID) || 'vector1';
      const imgData = args.DATA;
      const vec = vectors.get(id) || { x: 0, y: 0, size: 50, imageSrc: null };
      if (imgData) vec.imageSrc = imgData;
      vectors.set(id, vec);
      this._ensureStageOverlay();
      this._redrawAllStages();
    }

    setVectorFromPolygon(args) {
      const id = Scratch.Cast.toString(args.ID) || 'vector1';
      const points = parsePolygon(args.POLY);
      const dataUrl = polygonToDataUrl(points);
      const vec = vectors.get(id) || { x: 0, y: 0, size: 50, imageSrc: null };
      vec.imageSrc = dataUrl;
      vectors.set(id, vec);
      this._ensureStageOverlay();
      this._redrawAllStages();
    }

    deleteVisualization(args) {
      const id = Scratch.Cast.toString(args.ID);
      vectors.delete(id);
      this._redrawAllStages();
    }

    setVectorPosition(args) {
      const id = Scratch.Cast.toString(args.ID) || 'vector1';
      const vec = vectors.get(id) || { x: 0, y: 0, size: 50, imageSrc: null };
      vec.x = Scratch.Cast.toNumber(args.X);
      vec.y = Scratch.Cast.toNumber(args.Y);
      vectors.set(id, vec);
      this._redrawAllStages();
    }

    setVectorSize(args) {
      const id = Scratch.Cast.toString(args.ID) || 'vector1';
      const vec = vectors.get(id) || { x: 0, y: 0, size: 50, imageSrc: null };
      vec.size = Math.max(1, Scratch.Cast.toNumber(args.SIZE));
      vectors.set(id, vec);
      this._redrawAllStages();
    }

    vectorReporter(args) {
      const id = Scratch.Cast.toString(args.ID) || 'vector1';
      const vec = vectors.get(id);
      return vec ? vec.imageSrc || '' : '';
    }

    _ensureStageOverlay() {
      if (stageOverlay) return;
      const stageWrapper = Scratch.renderer.canvas.parentElement;
      stageOverlay = document.createElement('canvas');
      stageOverlay.width = 480;
      stageOverlay.height = 360;
      stageOverlay.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;image-rendering:pixelated;';
      stageWrapper.appendChild(stageOverlay);
      overlayCtx = stageOverlay.getContext('2d');
    }

    _redrawAllStages() {
      if (!overlayCtx) return;
      const self = this;
      overlayCtx.clearRect(0, 0, 480, 360);
      vectors.forEach(function (vec) {
        if (!vec.imageSrc) return;
        if (!loadedImages[vec.imageSrc]) {
          const img = new Image();
          img.src = vec.imageSrc;
          loadedImages[vec.imageSrc] = img;
          img.onload = function () {
            self._redrawAllStages();
          };
        }
        const imgObj = loadedImages[vec.imageSrc];
        if (imgObj && imgObj.complete) {
          const size = vec.size;
          const x = vec.x + 240 - size / 2;
          const y = 180 - vec.y - size / 2;
          overlayCtx.drawImage(imgObj, x, y, size, size);
        }
      });
    }
  }

  Scratch.extensions.register(new VectorVisualizer());
})(Scratch);
