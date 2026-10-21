(function(Scratch) {
    'use strict';

    class HTTPClientExtension {
        constructor() {
            this.lastResponse = null;
            this.lastError = null;
            this.requestInProgress = false;
        }

        getInfo() {
            return {
                id: 'httpClientExtension',
                name: 'HTTP Client',
                color1: '#2E7D32',
                color2: '#1B5E20',
                color3: '#43A047',
                blocks: [
                    {
                        opcode: 'sendRequest',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Send [METHOD] Request to URL [URL] Headers [HEADERS] with JSON [JSON]',
                        arguments: {
                            METHOD: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'httpMethods'
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
                        opcode: 'getLastResponse',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last Response'
                    },
                    {
                        opcode: 'getLastError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last Error'
                    },
                    {
                        opcode: 'isRequesting',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is Requesting?'
                    }
                ],
                menus: {
                    httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
                }
            };
        }

        sendRequest(args) {
            const method = String(args.METHOD || 'GET').toUpperCase();
            const url = String(args.URL);
            let headers = {};
            let jsonData = {};

            try {
                headers = JSON.parse(String(args.HEADERS));
                if (typeof headers !== 'object' || headers === null) {
                    headers = {};
                }
            } catch (e) {
                this.lastError = 'Invalid Headers JSON: ' + e.message;
                return;
            }

            try {
                jsonData = JSON.parse(String(args.JSON));
                if (typeof jsonData !== 'object' || jsonData === null) {
                    jsonData = {};
                }
            } catch (e) {
                this.lastError = 'Invalid JSON data: ' + e.message;
                return;
            }

            this.requestInProgress = true;
            this.lastResponse = null;
            this.lastError = null;

            if (method !== 'GET' && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            const fetchOptions = {
                method: method,
                headers: headers
            };

            if (method !== 'GET') {
                fetchOptions.body = JSON.stringify(jsonData);
            }

            fetch(url, fetchOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(data => {
                    this.lastResponse = data;
                    this.lastError = null;
                    this.requestInProgress = false;
                })
                .catch(error => {
                    this.lastError = error.message;
                    this.lastResponse = null;
                    this.requestInProgress = false;
                });
        }

        getLastResponse() {
            return this.lastResponse || '';
        }

        getLastError() {
            return this.lastError || 'None';
        }

        isRequesting() {
            return this.requestInProgress;
        }
    }

    Scratch.extensions.register(new HTTPClientExtension());
})(Scratch);
