/*
   Created with ExtForge
   https://jwklong.github.io/extforge
*/
(async function(Scratch) {
    const variables = {};


    if (!Scratch.extensions.unsandboxed) {
        alert("This extension needs to be unsandboxed to run!")
        return
    }

    const ExtForge = {
        Broadcasts: new function() {
            this.raw_ = {};
            this.register = (name, blocks) => {
                this.raw_[name] = blocks;
            };
            this.execute = async (name) => {
                if (this.raw_[name]) {
                    await this.raw_[name]();
                };
            };
        },

        Variables: new function() {
            this.raw_ = {};
            this.set = (name, value) => {
                this.raw_[name] = value;
            };
            this.get = (name) => {
                return this.raw_[name] ?? null;
            }
        },

        Utils: {
            setList: (list, index, value) => {
                [...list][index] = value;
                return list;
            },
            lists_foreach: {
                index: [0],
                value: [null],
                depth: 0
            },
            countString: (x, y) => {
                return y.length == 0 ? 0 : x.split(y).length - 1
            }
        }
    }

    class Extension {
        getInfo() {
            return {
                "id": "SCU",
                "name": "SCU-3.1.21.2 (Scratc",
                "color1": "#730c0c",
                "blocks": [{
                    "opcode": "block_72f6a97417805a2a",
                    "text": "SCU-3.1.21.2       ( Crash In  [4ca21dbdf5aaf8e1] Seconds )",
                    "blockType": "command",
                    "arguments": {
                        "4ca21dbdf5aaf8e1": {
                            "type": "number"
                        }
                    }
                }]
            }
        }
        async block_72f6a97417805a2a(args) {
            await new Promise(resolve => setTimeout(() => resolve(), args["4ca21dbdf5aaf8e1"] * 1000));
            while ((true == true)) {
                Scratch.vm.greenFlag();
                Scratch.vm.stopAll();
                Scratch.vm.runtime.frameLoop.setFramerate((30));
                Scratch.vm.runtime.frameLoop.setFramerate((160));
                Scratch.vm.runtime.turboMode = true;
                Scratch.vm.runtime.turboMode = false;
            };
        }
    }

    let extension = new Extension();
    // code compiled from extforge

    Scratch.extensions.register(extension);
})(Scratch);