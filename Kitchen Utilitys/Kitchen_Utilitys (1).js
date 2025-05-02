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
                "blockIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAABIlJREFUeF7tnTtu3DAQhiW37tK48Z7AfQ6QKpXvEyClgdwgB/EBcoD0ixzAbtKkS5sNuF4uKIqcNx+i7MYGJFLip/+fGVIPz1MHPy/PDyfuaRwejzO3TYn9m5xEDOzweGSP7eX5YdGmFdBqAENo9z+XvOYnPsCYeAi0JsyiACFoMQALiL7PmjCLAPTgYqVhPrWEGMMspUpzgA4eF1xJNYYgS0A0AwipLlbW6esyAaSUuRU1mgDMqu72bpr+/p5SMFpBdBfLxUgrNaoAUmNdTk2tITqYWpBigCvVXdTmTur1z7/p/sPN1ZmQHVcQg358ByXsbBUbRQAliYIFMREUe4XIBiiBR1FSSztr4iILoAbeqBDJACF43DJlJDuTACbhBcFeUqaMAhEFSLGttEzhQIwzuwsJPSSWogDdILHkwIF4Tc5RqVMCJLXYBgFS1GeRHEQQo1KnFcQsQA68PUMkAeRkWY2aNG0pFxFbTkttx6ycBBirj5tlURCJ6RoFABZPKX1YQ1wBjOG57Hf4/it53HhAYaZEIQIj0bStDREFiJULkCooIFLlCfuYiYUM66SSs/IC4Fl9x7c1PM4qsRbi4lhIge73xexsDTA3X14DjO6YhYOjKCrlTGk7SImbBMi2VkDTGmJ3ADl1nxSGtF3qwknDhiQLh23iWHi1MAiQuUosHdyiHVDqQBBKxD49wMwZg4r69imZjDRhAFNPaXipRHJWoFOffz4Fiy3U7Iz1o7EzN1Fh4LnbQxuvALrOsMG3gJirFzFFc+FQ9kcB9gqxtfL88UkAuRA1lpQsyNaIdzk1LgCG8S/VALVzwZlD7p5xS3ixCmcMYBElZkoUyrJZD/DCbEwCWAQiJVpH+/QCTwSwB4ibB5iCKC0v0NgqKN4FohY38YmEbOHwSJzBU7IzdBF6KV3i81ABtLIz50JQi3expJgN1QAtIGKLDhjgljHRBKAG4om42NArRDOAEERubMvNa3uEaAqQq8RcuMEsiVmeGcZUu5sD1EDEwFErAE4/KnrBg+qiMgY6OGa3Rdvbu2n+8oM9lh6UeFXgZVpyXVBljybRgApRo5iWEMnLWRqYGEQNPH9erSBWAQjFRAt4LSFWA5iCaAmPAnESxlnIfSuAJeKgxv6StmDIMIQI3heWvDkuGWypNjUgDg0QrUUNlJgFOIKNS8fE1CNuq6eztm5jEkThKxK7AojaWQARBTiSja2VSHpCdUSAVkokA3yHuC6yoFcdwPdERkkoGjuL3hMZVYWYnVOvdIgB7hWiG7efr2Pwzvti0yrKszNYHz1ux5bCKPB2DRCys7Py9PmG9EkUVIEjWzkH8fUj/XsyJIB7gzg/0T/uSAa4B4gc5fm4zgI4MkRq0ogTIhvgiBCl8EhZOFeCjFLeaOCpAHolut9bnPI5cJdzF7lQHANTityaGrWqCxmo6Icd+W8J9qxGK9UVAeg77VWNlqorCrC32FhCdcUBhmr0f9e0todmkSSwhRCzGIgdKPwodwmYNaFVUyBUQ4bbJEBDYDWUlhtLNQVCCn3/bw6Yfwfe/h/0e85+oSD8uQAAAABJRU5ErkJggg==",
                "id": "KitchenUtils",
                "name": "Kitchen Utilitys",
                "color1": "#0088ff",
                "color2": "#0063ba",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: "1",
        blockType: Scratch.BlockType.COMMAND,
        text: "Wait Until [WU]",
        arguments: {
            "WU": {
                type: Scratch.ArgumentType.STRING,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["1"] = async (args, util) => {
        await new Promise(resolve => {
            let x = setInterval(() => {
                if (args["WU"]) {
                    clearInterval(x);
                    resolve()
                }
            }, 50)
        })
    };

    blocks.push({
        opcode: "10",
        blockType: Scratch.BlockType.COMMAND,
        text: "Alert [alert]",
        arguments: {
            "alert": {
                type: Scratch.ArgumentType.STRING,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["10"] = async (args, util) => {
        alert(args["alert"])
    };

    blocks.push({
        opcode: "11",
        blockType: Scratch.BlockType.REPORTER,
        text: "Prompt [prompt]",
        arguments: {
            "prompt": {
                type: Scratch.ArgumentType.STRING,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["11"] = async (args, util) => {
        return prompt(args["prompt"])
    };

    blocks.push({
        opcode: "12",
        blockType: Scratch.BlockType.REPORTER,
        text: "Confirm [conf]",
        arguments: {
            "conf": {
                type: Scratch.ArgumentType.STRING,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["12"] = async (args, util) => {
        return confirm(args["conf"])
    };

    blocks.push({
        opcode: "20",
        blockType: Scratch.BlockType.BOOLEAN,
        text: "True",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["20"] = async (args, util) => {
        return true
    };

    blocks.push({
        opcode: "21",
        blockType: Scratch.BlockType.BOOLEAN,
        text: "False",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["21"] = async (args, util) => {
        return false
    };

    blocks.push({
        opcode: "22",
        blockType: Scratch.BlockType.REPORTER,
        text: "Color [color]",
        arguments: {
            "color": {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: '#ff0000',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["22"] = async (args, util) => {
        return args["color"]
    };

    false;

    Scratch.extensions.register(new Extension());
})(Scratch);