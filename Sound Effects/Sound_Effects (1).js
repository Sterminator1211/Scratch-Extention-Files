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
                "blockIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAflJREFUeF7tmmtuxCAMhNmb9EJRz1rlQr1JKqSySgiPMWuDCc7vPJjPM4aQvNzix2tx/c4AmAMWJ2ARWNwA1gQtAhaBxQmoj8D3rzt+vuR6lXoA3qCSEKYAIAlBPYBz9SWcoBHA8d+X32OThKAFQBDttm1z+757BpexSUHQAODwos9HAFASzRUH1QDi5heL5oAwGsCt+l70OQI10Z9CGAHgkvfUQjTuAZIQegNIVjyG0NIEW53QEwAkPo5AgFNzQetiqQeAquURB6QEpqpOdQIVwFsM+hIZT3HIdakISDmBDKBFECI6tQ7IXYcsilAnTA8gl/1HA0D6wSMAeBFxDMLmCNesoDoCJQBcLjAAxA4NL2aI982+DeYiYA5I7BUifSEGahEgWtUi0HMlSJkFWux/23cD3NDVAaXx1AQ/YiGkEgDgksspLZEpvQ1yTX9hkNRZgKrfn8+2H8AtvqUHtAAI18D9I+cArtyfRfRwwPl5EAQEQA0GWqneAKBIUDdF0Y6fgjICQNURpW1xrsr3bIIlN5I+jHCL790EcyCW/zZ46wvUL0Now9PYA1JjuvwfIGH7kdMgqVjS4rX0AAjKJ1Nd6QGjp8Gh4qdwgFTltawDIAdInjRFBAyAIAFzgCDcKW5tDpiiTIKDNAcIwp3i1uaAKcokOMjlHfAHvKnRUHFiuyMAAAAASUVORK5CYII=",
                "id": "AUXinfinite",
                "name": "Sound Effects",
                "color1": "#29b40e",
                "color2": "#044903",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: "EFEb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Echoed Fart Effect",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["EFEb"] = async (args, util) => {
        doSound(`https://t.ly/2gHlM`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "EFEr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Echoed Fart Effect",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["EFEr"] = async (args, util) => {
        doSound(`https://t.ly/2gHlM`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "DDDb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Dun Dun Duuuuh",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["DDDb"] = async (args, util) => {
        doSound(`https://tinyurl.com/y9jec3n2`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "DDDr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Dun Dun Duuuuh",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["DDDr"] = async (args, util) => {
        doSound(`https://tinyurl.com/y9jec3n2`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "VBb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Vine Boom",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["VBb"] = async (args, util) => {
        doSound(`https://tinyurl.com/4ka95bjc`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "VBr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Vine Boom",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["VBr"] = async (args, util) => {
        doSound(`https://tinyurl.com/4ka95bjc`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "Bb",
        blockType: Scratch.BlockType.COMMAND,
        text: "BRUH",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["Bb"] = async (args, util) => {
        doSound(`https://tinyurl.com/yyu24jnr`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "Br",
        blockType: Scratch.BlockType.REPORTER,
        text: "BRUH",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["Br"] = async (args, util) => {
        doSound(`https://tinyurl.com/yyu24jnr`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "EMDb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Emotional Damage",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["EMDb"] = async (args, util) => {
        doSound(`https://tinyurl.com/wzpaxn4t`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "EMDr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Emotional Damage",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["EMDr"] = async (args, util) => {
        doSound(`https://tinyurl.com/wzpaxn4t`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "WABb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Buzzer",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["WABb"] = async (args, util) => {
        doSound(`https://tinyurl.com/8kf3rn7a`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "WABr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Buzzer",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["WABr"] = async (args, util) => {
        doSound(`https://tinyurl.com/8kf3rn7a`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "YIPb",
        blockType: Scratch.BlockType.COMMAND,
        text: "YIPEEEE",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["YIPb"] = async (args, util) => {
        doSound(`https://tinyurl.com/4tbesbjv`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "YIPr",
        blockType: Scratch.BlockType.REPORTER,
        text: "YIPEEEE",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["YIPr"] = async (args, util) => {
        doSound(`https://tinyurl.com/4tbesbjv`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "BCb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Bone Crack",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["BCb"] = async (args, util) => {
        doSound(`https://tinyurl.com/5fwx4aeu`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "BCr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Bone Crack",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["BCr"] = async (args, util) => {
        doSound(`https://tinyurl.com/5fwx4aeu`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "MPCb",
        blockType: Scratch.BlockType.COMMAND,
        text: "Metal Pipe",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["MPCb"] = async (args, util) => {
        doSound(`https://tinyurl.com/3mczn9kx`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    blocks.push({
        opcode: "MPCr",
        blockType: Scratch.BlockType.REPORTER,
        text: "Metal Pipe",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["MPCr"] = async (args, util) => {
        doSound(`https://tinyurl.com/3mczn9kx`, Scratch.vm.runtime.targets.find(target => target.isStage), Scratch.vm.runtime);
    };

    Scratch.extensions.register(new Extension());
})(Scratch);