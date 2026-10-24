(function(Scratch) {
    'use strict';

    class DebugClientDLL {
        getInfo() {
            return {
                id: 'debugClientDLL',
                name: 'Debug Client DLL',
                color1: '#7B1FA2',
                color2: '#4A148C',
                color3: '#9C27B0',

                blocks: [
                    {
                        opcode: 'sendDebugMethod',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Send [METHOD] Request to URL [URL] Headers [HEADERS] with JSON [JSON]',
                        arguments: {
                            METHOD: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'debugMethods',
                                defaultValue: 'HEAD'
                            },
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'https://example.com/api'
                            },
                            HEADERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '{}'
                            },
                            JSON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '{}'
                            }
                        }
                    },
                    {
                        opcode: 'sendCustomMethod',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Send [METHOD] Request to URL [URL] Headers [HEADERS] with JSON [JSON]',
                        arguments: {
                            METHOD: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'QUERY'
                            },
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'https://example.com/api'
                            },
                            HEADERS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '{}'
                            },
                            JSON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '{}'
                            }
                        }
                    }
                ],

                menus: {
                    debugMethods: {
                        acceptReporters: true,
                        items: [
                            'HEAD',
                            'OPTIONS',
                            'TRACE',
                            'CONNECT',
                            'QUERY'
                        ]
                    }
                }
            };
        }

        sendDebugMethod(args) {
            this.sendThroughHTTPClient(args);
        }

        sendCustomMethod(args) {
            this.sendThroughHTTPClient(args);
        }

        sendThroughHTTPClient(args) {
            const runtime = Scratch.vm && Scratch.vm.runtime;

            const sendRequest = runtime &&
                runtime._primitives &&
                runtime._primitives[
                    'httpClientExtension_sendRequest'
                ];

            if (typeof sendRequest !== 'function') {
                console.error(
                    '[Debug Client DLL] HTTP Client is required. ' +
                    'Load HTTP Client first and ensure it is not sandboxed.'
                );
                return;
            }

            sendRequest({
                METHOD: String(args.METHOD || 'GET'),
                URL: String(args.URL || ''),
                HEADERS: String(args.HEADERS || '{}'),
                JSON: String(args.JSON || '{}')
            });
        }
    }

    Scratch.extensions.register(new DebugClientDLL());
})(Scratch);
