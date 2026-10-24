(function(Scratch) {
    'use strict';

    class HTTPClientExtension {
        constructor() {
            this.lastResponse = null;
            this.lastError = null;
            this.lastStatusCode = null;
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
                                menu: 'httpMethods',
                                defaultValue: 'GET'
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
                        opcode: 'getLastStatusCode',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last Status Code'
                    },
                    {
                        opcode: 'isRequesting',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is Requesting?'
                    }
                ],

                menus: {
                    httpMethods: {
                        acceptReporters: true,
                        items: [
                            'GET',
                            'POST',
                            'PUT',
                            'PATCH',
                            'DELETE'
                        ]
                    }
                }
            };
        }

        sendRequest(args) {
            const method = String(args.METHOD || 'GET')
                .trim()
                .toUpperCase();

            const url = String(args.URL || '');

            // Reset results for this request.
            this.lastResponse = null;
            this.lastError = null;
            this.lastStatusCode = null;

            let headers;
            let jsonData;

            try {
                headers = JSON.parse(String(args.HEADERS || '{}'));

                if (
                    typeof headers !== 'object' ||
                    headers === null ||
                    Array.isArray(headers)
                ) {
                    throw new Error('Headers must be a JSON object.');
                }
            } catch (e) {
                this.lastError = 'Invalid Headers JSON: ' + e.message;
                this.requestInProgress = false;
                return;
            }

            try {
                jsonData = JSON.parse(String(args.JSON || '{}'));
            } catch (e) {
                this.lastError = 'Invalid JSON data: ' + e.message;
                this.requestInProgress = false;
                return;
            }

            const hasBody = method !== 'GET' && method !== 'HEAD';

            const hasContentType = Object.keys(headers).some(
                key => key.toLowerCase() === 'content-type'
            );

            if (hasBody && !hasContentType) {
                headers['Content-Type'] = 'application/json';
            }

            const fetchOptions = {
                method: method,
                headers: headers
            };

            if (hasBody) {
                fetchOptions.body = JSON.stringify(jsonData);
            }

            this.requestInProgress = true;

            fetch(url, fetchOptions)
                .then(response => {
                    // Save the status code even for HTTP errors (404, 500, etc.).
                    this.lastStatusCode = response.status;

                    if (!response.ok) {
                        throw new Error(
                            `HTTP Error: ${response.status} ${response.statusText}`
                        );
                    }

                    return response.text();
                })
                .then(data => {
                    this.lastResponse = data;
                    this.lastError = null;
                })
                .catch(error => {
                    this.lastError = error.message;
                    this.lastResponse = null;
                })
                .finally(() => {
                    this.requestInProgress = false;
                });
        }

        getLastResponse() {
            return this.lastResponse || '';
        }

        getLastError() {
            return this.lastError || 'None';
        }

        getLastStatusCode() {
            // Return an empty string until a response status is available.
            return this.lastStatusCode === null
                ? ''
                : this.lastStatusCode;
        }

        isRequesting() {
            return this.requestInProgress;
        }
    }

    Scratch.extensions.register(new HTTPClientExtension());
})(Scratch);
