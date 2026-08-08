(function (Scratch) {
    'use strict';

    class DiscordWebhook {
        constructor() {
            this._currentWebhook = '';
            this._lastError = '';
        }

        getInfo() {
            return {
                id: 'discordwebhook',
                name: 'Discord Webhook',

                color1: '#5865F2',
                color2: '#4752C4',
                color3: '#3C45A5',

                blocks: [
                    {
                        opcode: 'connectWebhook',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Connect to Discord webhook URL [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'https://discord.com/api/webhooks/...'
                            }
                        }
                    },

                    {
                        opcode: 'connectWebhookThread',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Connect to Discord webhook URL thread [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'https://discord.com/api/webhooks/...?...'
                            }
                        }
                    },

                    {
                        opcode: 'clearWebhook',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Clear current Webhook URL'
                    },

                    {
                        opcode: 'sendMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Send [MESSAGE] to connected Webhook',
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Hello from Scratch!'
                            }
                        }
                    },

                    '---',

                    {
                        opcode: 'currentWebhook',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Current Webhook URL'
                    },

                    {
                        opcode: 'lastError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Last Received Error'
                    }
                ]
            };
        }

        connectWebhook(args) {
            const url = String(args.URL || '').trim();

            if (!url) {
                this._currentWebhook = '';
                this._lastError = 'Webhook URL cannot be empty.';
                return;
            }

            if (!this.isValidWebhookURL(url)) {
                this._currentWebhook = '';
                this._lastError = 'Invalid Discord webhook URL.';
                return;
            }

            this._currentWebhook = url;
            this._lastError = '';
        }

        connectWebhookThread(args) {
            const url = String(args.URL || '').trim();

            if (!url) {
                this._currentWebhook = '';
                this._lastError = 'Webhook URL cannot be empty.';
                return;
            }

            if (!this.isValidWebhookURL(url)) {
                this._currentWebhook = '';
                this._lastError = 'Invalid Discord webhook URL.';
                return;
            }

            this._currentWebhook = url;
            this._lastError = '';
        }

        clearWebhook() {
            this._currentWebhook = '';
            this._lastError = '';
        }

        async sendMessage(args) {
            if (!this._currentWebhook) {
                this._lastError = 'No Discord webhook is connected.';
                return;
            }

            const message = String(args.MESSAGE ?? '');

            this._lastError = '';

            try {
                const response = await fetch(this._currentWebhook, {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        content: message
                    })
                });

                if (!response.ok) {
                    let errorText = '';

                    try {
                        errorText = await response.text();
                    } catch (e) {
                        errorText = '';
                    }

                    if (errorText) {
                        try {
                            const errorJSON = JSON.parse(errorText);

                            if (errorJSON.message) {
                                this._lastError =
                                    `Discord returned ${response.status}: ${errorJSON.message}`;
                            } else {
                                this._lastError =
                                    `Discord returned HTTP ${response.status}.`;
                            }
                        } catch (e) {
                            this._lastError =
                                `Discord returned HTTP ${response.status}.`;
                        }
                    } else {
                        this._lastError =
                            `Discord returned HTTP ${response.status}.`;
                    }

                    return;
                }

                this._lastError = '';

            } catch (error) {
                this._lastError =
                    error && error.message
                        ? error.message
                        : String(error);
            }
        }

        currentWebhook() {
            return this._currentWebhook;
        }

        lastError() {
            return this._lastError;
        }

        isValidWebhookURL(url) {
            try {
                const parsed = new URL(url);

                const validHosts = [
                    'discord.com',
                    'discordapp.com',
                    'canary.discord.com',
                    'ptb.discord.com'
                ];

                if (!validHosts.includes(parsed.hostname)) {
                    return false;
                }

                return parsed.pathname.startsWith('/api/webhooks/');

            } catch (e) {
                return false;
            }
        }
    }

    Scratch.extensions.register(new DiscordWebhook());

})(Scratch);
