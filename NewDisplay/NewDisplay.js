(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error(
      "NewDisplay must be loaded as an unsandboxed extension."
    );
  }

  class NewDisplay {
    constructor(runtime) {
      this.runtime =
        runtime ||
        Scratch.vm?.runtime ||
        Scratch.vm ||
        null;

      this.recorder = null;
      this.sourceStream = null;
      this.outputStream = null;
      this.video = null;
      this.outputCanvas = null;
      this.outputContext = null;

      this.frameCallbackId = null;
      this.animationFrame = null;
      this.usingVideoFrameCallback = false;

      this.chunks = [];
      this.recording = null;
      this.lastError = "";

      this.keepRecording = false;
      this.isStopping = false;
      this.stopResolver = null;
      this.recordingStartedAt = 0;

      this.fps = 60;
      this.bitrate = 12000000;
      this.resolution = "720p";
      this.mimeType = "video/webm";

      this.cropCache = null;
      this.frameCounter = 0;
      this.cropRefreshInterval = 8;

      this.showDangerousBlocks = false;
    }

    getInfo() {
      const blocks = [
        {
          opcode: "startRecording",
          blockType: Scratch.BlockType.COMMAND,
          text: "Start Recording"
        },
        {
          opcode: "saveAndStopRecording",
          blockType: Scratch.BlockType.COMMAND,
          text: "Save and Stop Recording"
        },
        {
          opcode: "stopRecording",
          blockType: Scratch.BlockType.COMMAND,
          text: "Stop Recording"
        },
        {
          opcode: "downloadRecording",
          blockType: Scratch.BlockType.COMMAND,
          text: "Download Recording"
        },
        {
          opcode: "setFPS",
          blockType: Scratch.BlockType.COMMAND,
          text: "Set FPS to [FPS]",
          arguments: {
            FPS: {
              type: Scratch.ArgumentType.STRING,
              menu: "fpsMenu",
              defaultValue: "60"
            }
          }
        },
        {
          opcode: "setBitrate",
          blockType: Scratch.BlockType.COMMAND,
          text: "Set Video Bitrate to [BITRATE]",
          arguments: {
            BITRATE: {
              type: Scratch.ArgumentType.STRING,
              menu: "bitrateMenu",
              defaultValue: "12 Mbps"
            }
          }
        },
        {
          opcode: "setResolution",
          blockType: Scratch.BlockType.COMMAND,
          text: "Set Resolution to [RESOLUTION]",
          arguments: {
            RESOLUTION: {
              type: Scratch.ArgumentType.STRING,
              menu: "resolutionMenu",
              defaultValue: "720p"
            }
          }
        },
        {
          opcode: "getTimeRecording",
          blockType: Scratch.BlockType.REPORTER,
          text: "Time Recording"
        },
        {
          opcode: "getCurrentFrame",
          blockType: Scratch.BlockType.REPORTER,
          text: "Current Frame"
        },
        {
          opcode: "getFPS",
          blockType: Scratch.BlockType.REPORTER,
          text: "Set FPS"
        },
        {
          opcode: "getBitrate",
          blockType: Scratch.BlockType.REPORTER,
          text: "Set Bitrate"
        },
        {
          opcode: "getResolution",
          blockType: Scratch.BlockType.REPORTER,
          text: "Set Resolution"
        },
        {
          opcode: "getError",
          blockType: Scratch.BlockType.REPORTER,
          text: "error"
        },
        {
          opcode: "currentlyRecording",
          blockType: Scratch.BlockType.BOOLEAN,
          text: "Currently Recording?"
        },
        {
          blockType: Scratch.BlockType.BUTTON,
          text: this.showDangerousBlocks
            ? "⚠ HIDE DANGEROUS ⚠"
            : "⚠ DANGEROUS ⚠",
          func: "toggleDangerousBlocks"
        }
      ];

      if (this.showDangerousBlocks) {
        blocks.push(
          {
            opcode: "setCropRecache",
            blockType: Scratch.BlockType.COMMAND,
            text: "Set Crop Recache to Every [FRAMES] Frames",
            arguments: {
              FRAMES: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "8"
              }
            }
          },
          {
            opcode: "getCropRecache",
            blockType: Scratch.BlockType.REPORTER,
            text: "Set Crop Recache"
          }
        );
      }

      return {
        id: "newdisplay",
        name: "NewDisplay",
        color1: "#5B8DEF",
        color2: "#4169C1",
        color3: "#2E4B8F",

        blocks,

        menus: {
          fpsMenu: {
            acceptReporters: false,
            items: [
              "10",
              "20",
              "24",
              "30",
              "40",
              "50",
              "60",
              "120"
            ]
          },

          bitrateMenu: {
            acceptReporters: false,
            items: [
              "3 Mbps",
              "6 Mbps",
              "8 Mbps",
              "12 Mbps",
              "24 Mbps"
            ]
          },

          resolutionMenu: {
            acceptReporters: false,
            items: [
              "360p",
              "480p",
              "720p",
              "1080p",
              "1440p"
            ]
          }
        }
      };
    }

    toggleDangerousBlocks() {
      this.showDangerousBlocks =
        !this.showDangerousBlocks;

      const extensionManager =
        Scratch.vm?.extensionManager ||
        this.runtime?.extensionManager;

      if (
        extensionManager &&
        typeof extensionManager.refreshBlocks ===
          "function"
      ) {
        extensionManager.refreshBlocks("newdisplay");
      } else if (
        Scratch.vm &&
        typeof Scratch.vm.refreshBlocks ===
          "function"
      ) {
        Scratch.vm.refreshBlocks("newdisplay");
      }
    }

    setError(message) {
      this.lastError = String(message);
      console.error("NewDisplay:", this.lastError);
    }

    clearError() {
      this.lastError = "";
    }

    getRenderer() {
      const runtime =
        this.runtime ||
        Scratch.vm?.runtime ||
        Scratch.vm;

      const renderer =
        runtime?.renderer ||
        Scratch.vm?.renderer ||
        Scratch.vm?.runtime?.renderer;

      if (!renderer) {
        throw new Error("Scratch renderer was not found.");
      }

      return renderer;
    }

    getStageCanvas() {
      const renderer = this.getRenderer();

      const canvas =
        renderer.canvas ||
        renderer._gl?.canvas ||
        renderer.gl?.canvas;

      if (!canvas) {
        throw new Error(
          "Scratch stage canvas was not found."
        );
      }

      return canvas;
    }

    chooseMimeType() {
      if (
        typeof MediaRecorder === "undefined" ||
        typeof MediaRecorder.isTypeSupported !==
          "function"
      ) {
        return "";
      }

      const types = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm"
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }

      return "";
    }

    getBitrateValue(value) {
      const number = Number(
        String(value)
          .replace(" Mbps", "")
          .trim()
      );

      return Number.isFinite(number)
        ? number * 1000000
        : 12000000;
    }

    getResolutionSize() {
      const sizes = {
        "360p": [480, 360],
        "480p": [640, 480],
        "720p": [960, 720],
        "1080p": [1440, 1080],
        "1440p": [1920, 1440]
      };

      const size =
        sizes[this.resolution] || sizes["720p"];

      return {
        width: size[0],
        height: size[1]
      };
    }

    setFPS(args) {
      const value = Number(args.FPS);

      if (!Number.isFinite(value) || value <= 0) {
        this.setError("Invalid FPS value.");
        return;
      }

      this.fps = value;
      this.clearError();
    }

    setBitrate(args) {
      this.bitrate =
        this.getBitrateValue(args.BITRATE);

      this.clearError();
    }

    setResolution(args) {
      const value = String(args.RESOLUTION);

      const allowed = [
        "360p",
        "480p",
        "720p",
        "1080p",
        "1440p"
      ];

      if (!allowed.includes(value)) {
        this.setError("Invalid resolution value.");
        return;
      }

      this.resolution = value;
      this.clearError();
    }

    setCropRecache(args) {
      const frames = Math.floor(
        Number(args.FRAMES)
      );

      if (!Number.isFinite(frames) || frames < 1) {
        this.setError(
          "Crop recache must be at least 1 frame."
        );
        return;
      }

      this.cropRefreshInterval = frames;
      this.cropCache = null;
      this.frameCounter = 0;
      this.clearError();
    }

    getFPS() {
      return this.fps;
    }

    getBitrate() {
      return `${this.bitrate / 1000000} Mbps`;
    }

    getResolution() {
      return this.resolution;
    }

    getCropRecache() {
      return this.cropRefreshInterval;
    }

    getCurrentFrame() {
      return this.frameCounter;
    }

    getTimeRecording() {
      if (!this.currentlyRecording()) {
        return 0;
      }

      return (
        (Date.now() - this.recordingStartedAt) /
        1000
      );
    }

    waitForMetadata(video) {
      return new Promise((resolve, reject) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }

        const loaded = () => {
          cleanup();
          resolve();
        };

        const failed = () => {
          cleanup();
          reject(
            new Error(
              "The captured tab could not be read."
            )
          );
        };

        const cleanup = () => {
          video.removeEventListener(
            "loadedmetadata",
            loaded
          );

          video.removeEventListener(
            "error",
            failed
          );
        };

        video.addEventListener(
          "loadedmetadata",
          loaded
        );

        video.addEventListener(
          "error",
          failed
        );
      });
    }

    calculateCrop(video) {
      const rect =
        this.getStageCanvas()
          .getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        throw new Error(
          "The Scratch stage is not visible."
        );
      }

      const viewportWidth =
        window.innerWidth ||
        document.documentElement.clientWidth;

      const viewportHeight =
        window.innerHeight ||
        document.documentElement.clientHeight;

      const scaleX =
        video.videoWidth / viewportWidth;

      const scaleY =
        video.videoHeight / viewportHeight;

      let x = rect.left * scaleX;
      let y = rect.top * scaleY;
      let width = rect.width * scaleX;
      let height = rect.height * scaleY;

      x = Math.max(0, x);
      y = Math.max(0, y);

      width = Math.min(
        width,
        video.videoWidth - x
      );

      height = Math.min(
        height,
        video.videoHeight - y
      );

      if (width <= 0 || height <= 0) {
        throw new Error(
          "Could not find the stage in the captured tab."
        );
      }

      return {
        x,
        y,
        width,
        height
      };
    }

    getCachedCrop(video) {
      if (
        !this.cropCache ||
        this.frameCounter %
          this.cropRefreshInterval ===
          0
      ) {
        this.cropCache =
          this.calculateCrop(video);
      }

      return this.cropCache;
    }

    copyStageFrame() {
      if (
        !this.video ||
        !this.outputCanvas ||
        !this.outputContext ||
        this.video.readyState < 2 ||
        this.video.paused ||
        this.video.ended
      ) {
        return;
      }

      try {
        this.frameCounter++;

        const crop =
          this.getCachedCrop(this.video);

        this.outputContext.drawImage(
          this.video,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          this.outputCanvas.width,
          this.outputCanvas.height
        );
      } catch (error) {
        this.setError(
          error?.message ||
          "Unable to copy the stage."
        );
      }
    }

    startFrameLoop() {
      if (
        this.video &&
        typeof this.video.requestVideoFrameCallback ===
          "function"
      ) {
        this.usingVideoFrameCallback = true;

        const onVideoFrame = () => {
          if (
            !this.recorder ||
            this.recorder.state !== "recording"
          ) {
            this.frameCallbackId = null;
            return;
          }

          this.copyStageFrame();

          this.frameCallbackId =
            this.video.requestVideoFrameCallback(
              onVideoFrame
            );
        };

        this.frameCallbackId =
          this.video.requestVideoFrameCallback(
            onVideoFrame
          );

        return;
      }

      this.usingVideoFrameCallback = false;

      const loop = () => {
        if (
          !this.recorder ||
          this.recorder.state !== "recording"
        ) {
          this.animationFrame = null;
          return;
        }

        this.copyStageFrame();

        this.animationFrame =
          requestAnimationFrame(loop);
      };

      loop();
    }

    stopFrameLoop() {
      if (
        this.usingVideoFrameCallback &&
        this.video &&
        this.frameCallbackId !== null &&
        typeof this.video.cancelVideoFrameCallback ===
          "function"
      ) {
        this.video.cancelVideoFrameCallback(
          this.frameCallbackId
        );
      }

      if (this.animationFrame !== null) {
        cancelAnimationFrame(
          this.animationFrame
        );
      }

      this.frameCallbackId = null;
      this.animationFrame = null;
      this.usingVideoFrameCallback = false;
    }

    cleanupMedia() {
      this.stopFrameLoop();

      if (this.sourceStream) {
        this.sourceStream
          .getTracks()
          .forEach(track => {
            track.onended = null;
            track.stop();
          });
      }

      if (this.outputStream) {
        this.outputStream
          .getTracks()
          .forEach(track => track.stop());
      }

      if (this.video) {
        this.video.pause();
        this.video.srcObject = null;

        if (this.video.parentNode) {
          this.video.parentNode.removeChild(
            this.video
          );
        }
      }

      if (
        this.outputCanvas &&
        this.outputCanvas.parentNode
      ) {
        this.outputCanvas.parentNode.removeChild(
          this.outputCanvas
        );
      }

      this.sourceStream = null;
      this.outputStream = null;
      this.video = null;
      this.outputCanvas = null;
      this.outputContext = null;
      this.cropCache = null;
      this.frameCounter = 0;
    }

    async startRecording() {
      this.clearError();

      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getDisplayMedia !==
          "function"
      ) {
        this.setError(
          "Tab capture is not supported. Use Chrome or Edge over HTTPS."
        );
        return;
      }

      if (typeof MediaRecorder === "undefined") {
        this.setError(
          "MediaRecorder is not supported by this browser."
        );
        return;
      }

      if (
        this.recorder &&
        this.recorder.state !== "inactive"
      ) {
        this.setError(
          "A recording is already in progress."
        );
        return;
      }

      try {
        this.sourceStream =
          await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: {
                ideal: this.fps,
                max: this.fps
              }
            },
            audio: false,
            preferCurrentTab: true,
            selfBrowserSurface: "include",
            surfaceSwitching: "include"
          });

        const sourceTrack =
          this.sourceStream.getVideoTracks()[0];

        if (!sourceTrack) {
          throw new Error(
            "No tab video track was provided."
          );
        }

        this.video =
          document.createElement("video");

        this.video.autoplay = true;
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.srcObject = this.sourceStream;
        this.video.style.display = "none";

        document.body.appendChild(this.video);

        await this.waitForMetadata(this.video);
        await this.video.play();

        const size =
          this.getResolutionSize();

        this.outputCanvas =
          document.createElement("canvas");

        this.outputCanvas.width = size.width;
        this.outputCanvas.height = size.height;
        this.outputCanvas.style.display = "none";

        document.body.appendChild(
          this.outputCanvas
        );

        this.outputContext =
          this.outputCanvas.getContext("2d", {
            alpha: false,
            desynchronized: true
          });

        if (!this.outputContext) {
          throw new Error(
            "Could not create the output canvas."
          );
        }

        this.outputContext.imageSmoothingEnabled =
          true;

        this.outputContext.imageSmoothingQuality =
          "high";

        this.outputStream =
          this.outputCanvas.captureStream(
            this.fps
          );

        if (
          !this.outputStream ||
          this.outputStream.getVideoTracks().length === 0
        ) {
          throw new Error(
            "Could not create the stage video stream."
          );
        }

        this.chunks = [];
        this.recording = null;
        this.keepRecording = false;
        this.isStopping = false;
        this.stopResolver = null;
        this.recordingStartedAt = Date.now();
        this.cropCache = null;
        this.frameCounter = 0;

        this.mimeType =
          this.chooseMimeType() ||
          "video/webm";

        const options = {
          videoBitsPerSecond: this.bitrate
        };

        if (this.mimeType) {
          options.mimeType = this.mimeType;
        }

        this.recorder = new MediaRecorder(
          this.outputStream,
          options
        );

        this.recorder.ondataavailable = event => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            this.chunks.push(event.data);
          }
        };

        this.recorder.onerror = event => {
          this.setError(
            event.error?.message ||
            "The recorder encountered an error."
          );
        };

        sourceTrack.onended = () => {
          if (
            this.recorder &&
            this.recorder.state === "recording"
          ) {
            this.keepRecording = true;
            this.recorder.stop();
          }
        };

        this.recorder.onstop = () => {
          const chunks =
            this.chunks.slice();

          const type =
            this.recorder?.mimeType ||
            this.mimeType ||
            "video/webm";

          if (
            this.keepRecording &&
            chunks.length > 0
          ) {
            this.recording = new Blob(
              chunks,
              { type }
            );

            if (this.recording.size === 0) {
              this.recording = null;
              this.setError(
                "The saved recording is empty."
              );
            }
          } else if (this.keepRecording) {
            this.recording = null;
            this.setError(
              "The recorder produced no video data."
            );
          } else {
            this.recording = null;
          }

          this.cleanupMedia();

          this.chunks = [];
          this.recorder = null;
          this.isStopping = false;
          this.recordingStartedAt = 0;

          const resolve =
            this.stopResolver;

          this.stopResolver = null;

          if (resolve) {
            setTimeout(resolve, 100);
          }
        };

        this.recorder.start();
        this.startFrameLoop();
      } catch (error) {
        if (error?.name === "NotAllowedError") {
          this.setError(
            "Tab capture was cancelled or permission was denied."
          );
        } else if (error?.name === "AbortError") {
          this.setError(
            "Tab capture was cancelled."
          );
        } else {
          this.setError(
            error?.message ||
            "Unable to start recording."
          );
        }

        this.cleanupMedia();
        this.recorder = null;
        this.recordingStartedAt = 0;
      }
    }

    stopRecorder(shouldSave) {
      return new Promise(resolve => {
        if (
          !this.recorder ||
          this.recorder.state === "inactive"
        ) {
          if (shouldSave) {
            this.setError(
              "There is no recording in progress."
            );
          }

          resolve();
          return;
        }

        if (this.isStopping) {
          resolve();
          return;
        }

        this.isStopping = true;
        this.keepRecording = shouldSave;
        this.stopResolver = resolve;

        try {
          this.recorder.stop();
        } catch (error) {
          this.isStopping = false;
          this.stopResolver = null;

          this.setError(
            error?.message ||
            "Unable to stop recording."
          );

          this.cleanupMedia();
          resolve();
        }
      });
    }

    saveAndStopRecording() {
      this.clearError();
      return this.stopRecorder(true);
    }

    stopRecording() {
      this.clearError();
      return this.stopRecorder(false);
    }

    downloadRecording() {
      this.clearError();

      if (!this.recording) {
        this.setError(
          "There is no saved recording. Use Save and Stop Recording first."
        );
        return;
      }

      if (this.recording.size === 0) {
        this.setError(
          "The saved recording is empty."
        );
        return;
      }

      try {
        const url =
          URL.createObjectURL(this.recording);

        const link =
          document.createElement("a");

        link.href = url;
        link.download =
          "NewDisplay-stage-recording.webm";
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (error) {
        this.setError(
          error?.message ||
          "Unable to download recording."
        );
      }
    }

    getError() {
      return this.lastError;
    }

    currentlyRecording() {
      return Boolean(
        this.recorder &&
        this.recorder.state === "recording"
      );
    }
  }

  Scratch.extensions.register(
    new NewDisplay()
  );
})(Scratch);