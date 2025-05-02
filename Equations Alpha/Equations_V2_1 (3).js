/*
   This extension was made with TurboBuilder!
   https://turbobuilder-steel.vercel.app/
*/
(async function(Scratch) {
    const variables = {};
    const blocks = [];
    const menus = {};


    if (!Scratch.extensions.unsandboxed) {
        alert("This extension needs to be unsandboxed to run!")
        return
    }

    function doSound(ab, cd, runtime) {
        const audioEngine = runtime.audioEngine;

        const fetchAsArrayBufferWithTimeout = (url) =>
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let timeout = setTimeout(() => {
                    xhr.abort();
                    reject(new Error("Timed out"));
                }, 5000);
                xhr.onload = () => {
                    clearTimeout(timeout);
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP error ${xhr.status} while fetching ${url}`));
                    }
                };
                xhr.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to request ${url}`));
                };
                xhr.responseType = "arraybuffer";
                xhr.open("GET", url);
                xhr.send();
            });

        const soundPlayerCache = new Map();

        const decodeSoundPlayer = async (url) => {
            const cached = soundPlayerCache.get(url);
            if (cached) {
                if (cached.sound) {
                    return cached.sound;
                }
                throw cached.error;
            }

            try {
                const arrayBuffer = await fetchAsArrayBufferWithTimeout(url);
                const soundPlayer = await audioEngine.decodeSoundPlayer({
                    data: {
                        buffer: arrayBuffer,
                    },
                });
                soundPlayerCache.set(url, {
                    sound: soundPlayer,
                    error: null,
                });
                return soundPlayer;
            } catch (e) {
                soundPlayerCache.set(url, {
                    sound: null,
                    error: e,
                });
                throw e;
            }
        };

        const playWithAudioEngine = async (url, target) => {
            const soundBank = target.sprite.soundBank;

            let soundPlayer;
            try {
                const originalSoundPlayer = await decodeSoundPlayer(url);
                soundPlayer = originalSoundPlayer.take();
            } catch (e) {
                console.warn(
                    "Could not fetch audio; falling back to primitive approach",
                    e
                );
                return false;
            }

            soundBank.addSoundPlayer(soundPlayer);
            await soundBank.playSound(target, soundPlayer.id);

            delete soundBank.soundPlayers[soundPlayer.id];
            soundBank.playerTargets.delete(soundPlayer.id);
            soundBank.soundEffects.delete(soundPlayer.id);

            return true;
        };

        const playWithAudioElement = (url, target) =>
            new Promise((resolve, reject) => {
                const mediaElement = new Audio(url);

                mediaElement.volume = target.volume / 100;

                mediaElement.onended = () => {
                    resolve();
                };
                mediaElement
                    .play()
                    .then(() => {
                        // Wait for onended
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

        const playSound = async (url, target) => {
            try {
                if (!(await Scratch.canFetch(url))) {
                    throw new Error(`Permission to fetch ${url} denied`);
                }

                const success = await playWithAudioEngine(url, target);
                if (!success) {
                    return await playWithAudioElement(url, target);
                }
            } catch (e) {
                console.warn(`All attempts to play ${url} failed`, e);
            }
        };

        playSound(ab, cd)
    }
    class Extension {
        getInfo() {
            return {
                "blockIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAUtJREFUeF7tmmsOgyAQhPVG3v8U3qhN09oag467HeKDr3+BxR3mQRP6rvFf33j/HQDAgMYRQAKNEwATlBIYhuFxZZaM47jZIwCo04UBrUtAMaQ0vmSN0qHaw11vvp/0APVxAFBAwH1i7nowYIYAEshoXK1xU9ZdDwkggR8CeIDSc2bcrVl3PTwAD8ADvghgghmTU2vcpuWuhwligpggJjghQAooR8+Mu13bXY8UIAVIAVKAFPggQAxmYk6tcceWux4xSAwSg8QgMUgMvhHgHqAyPTPuzm13Pe4B0XtA9ASi8xXL3PXCDIh8QOld4eVfiUWaioClTn4ar1EzdA9Yey26PNkIUHubf807HIDSR+xt4F/6XxoAR/OnASDDgtsBsGZKSzm4Gj+NCe7Ve615pzDBWs0dXbfKn6Gjm4rsDwARtO44Fwbc8VQjPT0BJmiMUMXQEjIAAAAASUVORK5CYII=",
                "id": "EQV2",
                "name": "Equations V2.1",
                "color1": "#0088ff",
                "color2": "#0063ba",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: "-7",
        blockType: Scratch.BlockType.REPORTER,
        text: "[MU1] * [MU2] * [MU3]",
        arguments: {
            "MU1": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "MU2": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "MU3": {
                type: Scratch.ArgumentType.NUMBER,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["-7"] = async (args, util) => {
        return ((args["MU1"] * args["MU2"]) * args["MU3"])
    };

    blocks.push({
        opcode: "-6",
        blockType: Scratch.BlockType.REPORTER,
        text: "[DI1] ÷ [DI2] ÷ [DI3]",
        arguments: {
            "DI1": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "DI2": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "DI3": {
                type: Scratch.ArgumentType.NUMBER,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["-6"] = async (args, util) => {
        return ((args["DI1"] / args["DI2"]) / args["DI3"])
    };

    blocks.push({
        opcode: "-5",
        blockType: Scratch.BlockType.REPORTER,
        text: "[A1] + [A2] + [A3]",
        arguments: {
            "A1": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "A2": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "A3": {
                type: Scratch.ArgumentType.NUMBER,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["-5"] = async (args, util) => {
        return (args["A1"] + (args["A2"] + args["A3"]))
    };

    blocks.push({
        opcode: "-4",
        blockType: Scratch.BlockType.REPORTER,
        text: "[M1] - [M2] - [M3]",
        arguments: {
            "M1": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "M2": {
                type: Scratch.ArgumentType.NUMBER,
            },
            "M3": {
                type: Scratch.ArgumentType.NUMBER,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["-4"] = async (args, util) => {
        return ((args["M1"] - args["M2"]) - args["M3"])
    };

    blocks.push({
        opcode: "1",
        blockType: Scratch.BlockType.REPORTER,
        text: "Pi",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["1"] = async (args, util) => {
        return 3.141592654
    };

    blocks.push({
        opcode: "2",
        blockType: Scratch.BlockType.REPORTER,
        text: "e",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["2"] = async (args, util) => {
        return 2.71828
    };

    blocks.push({
        opcode: "3",
        blockType: Scratch.BlockType.REPORTER,
        text: "Thousand",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["3"] = async (args, util) => {
        return 1000
    };

    blocks.push({
        opcode: "4",
        blockType: Scratch.BlockType.REPORTER,
        text: "Million",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["4"] = async (args, util) => {
        return 1000000
    };

    blocks.push({
        opcode: "5",
        blockType: Scratch.BlockType.REPORTER,
        text: "Billion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["5"] = async (args, util) => {
        return 1000000000
    };

    blocks.push({
        opcode: "6",
        blockType: Scratch.BlockType.REPORTER,
        text: "Trillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["6"] = async (args, util) => {
        return 1000000000000
    };

    blocks.push({
        opcode: "8",
        blockType: Scratch.BlockType.REPORTER,
        text: "Quintillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["8"] = async (args, util) => {
        return 1000000000000000000
    };

    blocks.push({
        opcode: "7",
        blockType: Scratch.BlockType.REPORTER,
        text: "Quadrillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["7"] = async (args, util) => {
        return 1000000000000000
    };

    blocks.push({
        opcode: "9",
        blockType: Scratch.BlockType.REPORTER,
        text: "Sextillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["9"] = async (args, util) => {
        return 1e+21
    };

    blocks.push({
        opcode: "10",
        blockType: Scratch.BlockType.REPORTER,
        text: "Septillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["10"] = async (args, util) => {
        return 1e+24
    };

    blocks.push({
        opcode: "11",
        blockType: Scratch.BlockType.REPORTER,
        text: "Octillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["11"] = async (args, util) => {
        return 1e+27
    };

    blocks.push({
        opcode: "12",
        blockType: Scratch.BlockType.REPORTER,
        text: "Nonillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["12"] = async (args, util) => {
        return 1e+30
    };

    blocks.push({
        opcode: "13",
        blockType: Scratch.BlockType.REPORTER,
        text: "Decillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["13"] = async (args, util) => {
        return 1e+33
    };

    blocks.push({
        opcode: "14",
        blockType: Scratch.BlockType.REPORTER,
        text: "Undecillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["14"] = async (args, util) => {
        return 1e+36
    };

    blocks.push({
        opcode: "15",
        blockType: Scratch.BlockType.REPORTER,
        text: "Duodecillion",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["15"] = async (args, util) => {
        return 1e+39
    };

    Scratch.extensions.register(new Extension());
})(Scratch);