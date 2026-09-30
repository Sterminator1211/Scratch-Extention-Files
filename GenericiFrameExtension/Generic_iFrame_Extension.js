(function(Scratch) {
    'use strict';

    class MultiIFrameExtension {
        constructor() {
            this.iframes = {};
            this.urlErrors = {};
            this.iframeErrors = {};
            this.configs = {};
            this.fullscreenListener = this.handleFullscreenChange.bind(this);
            this.setupFullscreenListeners();
        }

        setupFullscreenListeners() {
            document.addEventListener('fullscreenchange', this.fullscreenListener);
            document.addEventListener('webkitfullscreenchange', this.fullscreenListener);
            document.addEventListener('mozfullscreenchange', this.fullscreenListener);
            document.addEventListener('msfullscreenchange', this.fullscreenListener);
        }

        handleFullscreenChange() {
            // Reposition all active iframes when fullscreen state changes
            setTimeout(() => {
                Object.keys(this.iframes).forEach(id => {
                    this.repositionIframe(Number(id));
                });
            }, 50);
        }

        repositionIframe(id) {
            if (!this.iframes[id]) return;

            const config = this.configs[id];
            const iframe = this.iframes[id];
            const canvas = Scratch.renderer.canvas || document.querySelector('canvas');

            if (canvas) {
                const canvasRect = canvas.getBoundingClientRect();
                
                // Use fixed positioning with viewport coordinates
                iframe.style.position = 'fixed';
                iframe.style.top = (canvasRect.top + config.y) + 'px';
                iframe.style.left = (canvasRect.left + config.x) + 'px';
                
                // Ensure it's not hidden and has proper z-index
                iframe.style.zIndex = '10000';
                iframe.style.pointerEvents = 'auto';
            } else {
                iframe.style.position = 'absolute';
                iframe.style.top = config.y + 'px';
                iframe.style.left = config.x + 'px';
            }
        }

        _ensureConfig(id) {
            if (!this.configs[id]) {
                this.configs[id] = {
                    url: 'https://example.com',
                    width: 480,
                    height: 360,
                    x: 0,
                    y: 0,
                    visible: true
                };
            }
        }

        getInfo() {
            return {
                id: 'multiIframeExtension',
                name: 'Generic iFrame Extension',
                color1: '#4a90e2', 
                blocks: [
                    {
                        opcode: 'startIframe',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Start iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'stopIframe',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Stop iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'hideIframe',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Hide iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'showIframe',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Show iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'setUrl',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set URL of iFrame [ID] to [URL]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com' }
                        }
                    },
                    {
                        opcode: 'setSize',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set Width and Height of iFrame [ID] to [WIDTH] and [HEIGHT]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: 480 },
                            HEIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 360 }
                        }
                    },
                    {
                        opcode: 'setXAndY',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set X and Y of iFrame [ID] to [X] and [Y]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
                            Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'listActiveIframes',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'List all active iFrames'
                    },
                    {
                        opcode: 'getCurrentWidth',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Current Width of iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'getCurrentHeight',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Current Height of iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'getLastUrlError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last URL Error for iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'getLastIframeError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last iFrame Error for iFrame [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'isIframeStarted',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'iFrame [ID] Started?',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'isIframeError',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'iFrame [ID] Error?',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'isUrlError',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'URL [ID] Error?',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    }
                ]
            };
        }

        startIframe(args) {
            const id = Number(args.ID);
            if (this.iframes[id]) return; 
            
            this._ensureConfig(id);
            const config = this.configs[id];

            try {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.zIndex = '10000';
                iframe.style.border = 'none';
                iframe.style.pointerEvents = 'auto';
                iframe.src = config.url;
                iframe.width = config.width + 'px';
                iframe.height = config.height + 'px';
                iframe.style.display = config.visible ? 'block' : 'none';
                
                const canvas = Scratch.renderer.canvas || document.querySelector('canvas');
                
                // Always append to body for fixed positioning
                document.body.appendChild(iframe);
                
                if (canvas) {
                    const canvasRect = canvas.getBoundingClientRect();
                    iframe.style.top = (canvasRect.top + config.y) + 'px';
                    iframe.style.left = (canvasRect.left + config.x) + 'px';
                } else {
                    iframe.style.top = config.y + 'px';
                    iframe.style.left = config.x + 'px';
                }

                iframe.onerror = () => {
                    this.iframeErrors[id] = true;
                };

                this.iframes[id] = iframe;
                this.iframeErrors[id] = false;
            } catch (e) {
                this.iframeErrors[id] = true;
            }
        }

        stopIframe(args) {
            const id = Number(args.ID);
            if (this.iframes[id]) {
                this.iframes[id].remove();
                delete this.iframes[id];
            }
        }

        hideIframe(args) {
            const id = Number(args.ID);
            this._ensureConfig(id);
            this.configs[id].visible = false;
            if (this.iframes[id]) {
                this.iframes[id].style.display = 'none';
            }
        }

        showIframe(args) {
            const id = Number(args.ID);
            this._ensureConfig(id);
            this.configs[id].visible = true;
            if (this.iframes[id]) {
                this.iframes[id].style.display = 'block';
            }
        }

        setUrl(args) {
            const id = Number(args.ID);
            const url = String(args.URL);
            this._ensureConfig(id);
            this.configs[id].url = url;
            
            if (this.iframes[id]) {
                try {
                    this.iframes[id].src = url;
                    this.urlErrors[id] = false;
                } catch (e) {
                    this.urlErrors[id] = true;
                }
            }
        }

        setSize(args) {
            const id = Number(args.ID);
            const width = Number(args.WIDTH);
            const height = Number(args.HEIGHT);
            this._ensureConfig(id);
            this.configs[id].width = width;
            this.configs[id].height = height;
            
            if (this.iframes[id]) {
                this.iframes[id].width = width + 'px';
                this.iframes[id].height = height + 'px';
            }
        }

        setXAndY(args) {
            const id = Number(args.ID);
            const x = Number(args.X);
            const y = Number(args.Y);
            this._ensureConfig(id);
            this.configs[id].x = x;
            this.configs[id].y = y;

            this.repositionIframe(id);
        }

        listActiveIframes() {
            return Object.keys(this.iframes).join(', ');
        }

        getCurrentWidth(args) {
            const id = Number(args.ID);
            return this.configs[id] ? this.configs[id].width : 0;
        }

        getCurrentHeight(args) {
            const id = Number(args.ID);
            return this.configs[id] ? this.configs[id].height : 0;
        }

        getLastUrlError(args) {
            const id = Number(args.ID);
            return this.urlErrors[id] ? "Invalid format or cross-origin restriction" : "None";
        }

        getLastIframeError(args) {
            const id = Number(args.ID);
            return this.iframeErrors[id] ? "DOM append error" : "None";
        }
        
        isIframeStarted(args) {
            const id = Number(args.ID);
            return !!this.iframes[id];
        }

        isIframeError(args) {
            const id = Number(args.ID);
            return !!this.iframeErrors[id];
        }

        isUrlError(args) {
            const id = Number(args.ID);
            return !!this.urlErrors[id];
        }
    }

    Scratch.extensions.register(new MultiIFrameExtension());
})(Scratch);
