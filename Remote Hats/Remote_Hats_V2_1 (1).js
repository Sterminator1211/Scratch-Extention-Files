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
                "blockIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAyCAYAAADsg90UAAAAAXNSR0IArs4c6QAAAUBJREFUaEPtmMsRwjAMRJ02aAP6rwDaoI0wEHzAg6JPNFhIm2OQbe3qySZeWvFnKa6/wQAQUNwBtEBxALAJogXQAsUdQAsIAViFcWNYeIMlCa7tbNR/e00vWcPo7/FhXHJ28T234CbsGXBc/B+YQBmwMW9FfyRzo2DmQyZAG+Alfqbs59pMC8IAokB+/Z+GgOv9u5TL6fN9j9O+77OM46QGUuu6tQAMeBPAVVZKgDSOI2AszJifOwHlDRgrQhlCVY7qcYoIjoD+e7g9IK0BvYLaHtbGSyv/cwJgAHPuSytNHavU/wFuXmpvCn8KSPeK6QZoezJKvBsBUQRp84AB+9dy+BwmP4e1qMWOV98IxZbjmN30yzpHLaapYIDJtkSDQECiYpqkgACTbYkGgYBExTRJAQEm2xINAgGJimmSUp6AB0nJtTP4cMW2AAAAAElFTkSuQmCC",
                "id": "RHV2",
                "name": "Remote Hats V2.1",
                "docsURI": "https://docs.google.com/document/d/1-a5aZnc2YF_k3mDZ24DPDr1vyns5fGZgSdKW-ikyik8/edit?usp=sharing",
                "color1": "#0033ff",
                "color2": "#5ca5e6",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: "RemoteCall1",
        blockType: Scratch.BlockType.COMMAND,
        text: "RemoteHat1 Call",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteCall1"] = async (args, util) => {
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat1`)
    };

    blocks.push({
        opcode: "RemoteHat1",
        blockType: Scratch.BlockType.EVENT,
        text: "RemoteHat1",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteHat1"] = async (args, util) => {};

    blocks.push({
        opcode: "RemoteCall2",
        blockType: Scratch.BlockType.COMMAND,
        text: "RemoteHat2 Call",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteCall2"] = async (args, util) => {
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat2`)
    };

    blocks.push({
        opcode: "RemoteHat2",
        blockType: Scratch.BlockType.EVENT,
        text: "RemoteHat2",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteHat2"] = async (args, util) => {};

    blocks.push({
        opcode: "RemoteCall3",
        blockType: Scratch.BlockType.COMMAND,
        text: "RemoteHat3 Call",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteCall3"] = async (args, util) => {
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat3`)
    };

    blocks.push({
        opcode: "RemoteHat3",
        blockType: Scratch.BlockType.EVENT,
        text: "RemoteHat3",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteHat3"] = async (args, util) => {};

    blocks.push({
        opcode: "RemoteCall4",
        blockType: Scratch.BlockType.COMMAND,
        text: "RemoteHat4 Call",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteCall4"] = async (args, util) => {
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat4`)
    };

    blocks.push({
        opcode: "RemoteHat4",
        blockType: Scratch.BlockType.EVENT,
        text: "RemoteHat4",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteHat4"] = async (args, util) => {};

    blocks.push({
        opcode: "RemoteCallA",
        blockType: Scratch.BlockType.COMMAND,
        text: "RemoteHat Call All",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RemoteCallA"] = async (args, util) => {
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat1`)
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat2`)
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat3`)
        Scratch.vm.runtime.startHats(`${Extension.prototype.getInfo().id}_RemoteHat4`)
    };

    Scratch.extensions.register(new Extension());
})(Scratch);