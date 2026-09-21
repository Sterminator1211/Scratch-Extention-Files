(function (Scratch) {
    'use strict';

    const KEY_MENU = [
        ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((key) => ({
            text: key,
            value: key.toLowerCase()
        })),

        ...'0123456789'.split('').map((key) => ({
            text: key,
            value: key
        })),

        { text: 'Space', value: ' ' },
        { text: 'Shift', value: 'Shift' },
        { text: 'Ctrl', value: 'Control' },
        { text: 'Alt', value: 'Alt' },
        { text: 'Enter', value: 'Enter' },
        { text: 'Tab', value: 'Tab' },
        { text: 'Escape', value: 'Escape' },
        { text: 'Backspace', value: 'Backspace' },
        { text: 'Arrow Up', value: 'ArrowUp' },
        { text: 'Arrow Down', value: 'ArrowDown' },
        { text: 'Arrow Left', value: 'ArrowLeft' },
        { text: 'Arrow Right', value: 'ArrowRight' }
    ];

    class MacroDetector {
        constructor() {
            this.MOUSE_MAX_INTERVAL = 110;
            this.KEY_MAX_INTERVAL = 120;
            this.MIN_INTERVAL = 4;
            this.REQUIRED_INTERVALS = 4;
            this.MAX_BUFFER = 4;

            this.lastMacroInput = '';
            this.lastMacroInputRaw = '';

            this.mouseStates = {
                0: this.createState(),
                1: this.createState(),
                2: this.createState()
            };

            this.keyStates = Object.create(null);

            this.handleMouseDown = this.handleMouseDown.bind(this);
            this.handleKeyDown = this.handleKeyDown.bind(this);

            document.addEventListener('mousedown', this.handleMouseDown, {
                capture: true,
                passive: true
            });

            document.addEventListener('keydown', this.handleKeyDown, {
                capture: true,
                passive: true
            });
        }

        createState() {
            return {
                lastTime: 0,
                intervals: [],
                triggered: false
            };
        }

        getInfo() {
            return {
                id: 'macrodector',
                name: 'Macro Detector',

                color1: '#D94A4A',
                color2: '#B93A3A',
                color3: '#8E2D2D',

                blocks: [
                    {
                        opcode: 'macroUsedOnMouse',
                        blockType: Scratch.BlockType.HAT,
                        text: 'Macro Used on Mouse',
                        isEdgeActivated: false
                    },
                    {
                        opcode: 'macroUsedOnAnyKey',
                        blockType: Scratch.BlockType.HAT,
                        text: 'Macro Used on Any Key',
                        isEdgeActivated: false
                    },
                    {
                        opcode: 'macroUsedOnKey',
                        blockType: Scratch.BlockType.HAT,
                        text: 'Macro Used on Key [KEY]',
                        isEdgeActivated: false,
                        arguments: {
                            KEY: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'keys'
                            }
                        }
                    },
                    {
                        opcode: 'lastKeyUsedWithMacro',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last Key Used with Macro'
                    }
                ],

                menus: {
                    keys: KEY_MENU
                }
            };
        }

        macroUsedOnMouse() {
            return true;
        }

        macroUsedOnAnyKey() {
            return true;
        }

        macroUsedOnKey() {
            return true;
        }

        lastKeyUsedWithMacro() {
            return this.lastMacroInput;
        }

        handleMouseDown(event) {
            if (![0, 1, 2].includes(event.button)) {
                return;
            }

            const state = this.mouseStates[event.button];
            const now = performance.now();

            if (state.lastTime === 0) {
                state.lastTime = now;
                return;
            }

            const interval = now - state.lastTime;
            state.lastTime = now;

            if (
                interval < this.MIN_INTERVAL ||
                interval > this.MOUSE_MAX_INTERVAL * 1.6
            ) {
                this.resetState(state);
                state.lastTime = now;
                return;
            }

            state.intervals.push(interval);

            if (state.intervals.length > this.MAX_BUFFER) {
                state.intervals.shift();
            }

            if (
                !state.triggered &&
                this.isMacroPattern(
                    state.intervals,
                    this.MOUSE_MAX_INTERVAL
                )
            ) {
                state.triggered = true;

                const mouseButton = this.getMouseButtonName(event.button);

                this.lastMacroInputRaw = mouseButton;
                this.lastMacroInput = mouseButton;

                Scratch.vm.runtime.startHats(
                    'macrodector_macroUsedOnMouse'
                );
            }
        }

        handleKeyDown(event) {
            if (event.repeat) {
                return;
            }

            const key = this.normalizeKey(event);

            if (!key) {
                return;
            }

            if (!this.keyStates[key]) {
                this.keyStates[key] = this.createState();
            }

            const state = this.keyStates[key];
            const now = performance.now();

            if (state.lastTime === 0) {
                state.lastTime = now;
                return;
            }

            const interval = now - state.lastTime;
            state.lastTime = now;

            if (
                interval < this.MIN_INTERVAL ||
                interval > this.KEY_MAX_INTERVAL * 1.6
            ) {
                this.resetState(state);
                state.lastTime = now;
                return;
            }

            state.intervals.push(interval);

            if (state.intervals.length > this.MAX_BUFFER) {
                state.intervals.shift();
            }

            if (
                state.triggered ||
                !this.isMacroPattern(
                    state.intervals,
                    this.KEY_MAX_INTERVAL
                )
            ) {
                return;
            }

            state.triggered = true;

            this.lastMacroInputRaw = key;
            this.lastMacroInput = this.getDisplayKey(key);

            Scratch.vm.runtime.startHats(
                'macrodector_macroUsedOnAnyKey'
            );

            Scratch.vm.runtime.startHats(
                'macrodector_macroUsedOnKey',
                {
                    KEY: key
                }
            );
        }

        normalizeKey(event) {
            const key = event.key;

            if (!key) {
                return '';
            }

            if (key === ' ') {
                return ' ';
            }

            const specialKeys = [
                'Shift',
                'Control',
                'Alt',
                'Enter',
                'Tab',
                'Escape',
                'Backspace',
                'ArrowUp',
                'ArrowDown',
                'ArrowLeft',
                'ArrowRight'
            ];

            if (specialKeys.includes(key)) {
                return key;
            }

            if (key.length === 1) {
                return key.toLowerCase();
            }

            return '';
        }

        getDisplayKey(key) {
            if (key === ' ') return 'Space';
            if (key === 'Control') return 'Ctrl';
            if (key === 'ArrowUp') return 'Arrow Up';
            if (key === 'ArrowDown') return 'Arrow Down';
            if (key === 'ArrowLeft') return 'Arrow Left';
            if (key === 'ArrowRight') return 'Arrow Right';

            if (key.length === 1) {
                return key.toUpperCase();
            }

            return key;
        }

        getMouseButtonName(button) {
            if (button === 0) return 'LMB';
            if (button === 1) return 'MMB';
            if (button === 2) return 'RMB';
            return '';
        }

        isMacroPattern(intervals, maximumInterval) {
            if (intervals.length < this.REQUIRED_INTERVALS) {
                return false;
            }

            const total = intervals.reduce(
                (sum, interval) => sum + interval,
                0
            );

            const average = total / intervals.length;

            if (average > maximumInterval) {
                return false;
            }

            const minimum = Math.min(...intervals);
            const maximum = Math.max(...intervals);
            const range = maximum - minimum;

            if (range > Math.max(8, average * 0.12)) {
                return false;
            }

            const variance =
                intervals.reduce(
                    (sum, interval) =>
                        sum + ((interval - average) ** 2),
                    0
                ) / intervals.length;

            const standardDeviation = Math.sqrt(variance);

            return standardDeviation <= average * 0.08;
        }

        resetState(state) {
            state.lastTime = 0;
            state.intervals.length = 0;
            state.triggered = false;
        }

        dispose() {
            document.removeEventListener(
                'mousedown',
                this.handleMouseDown,
                true
            );

            document.removeEventListener(
                'keydown',
                this.handleKeyDown,
                true
            );
        }
    }

    Scratch.extensions.register(new MacroDetector());
})(Scratch);
