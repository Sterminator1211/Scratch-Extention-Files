(function (Scratch) {
    "use strict";

    class MyMemoryTranslatorExtension {
        constructor() {
            // Official MyMemory API endpoint.
            this.baseURL = "https://api.mymemory.translated.net";

            // These are intentionally separate.
            this.siteOnline = false;
            this.translationConnected = false;

            // Cached language list.
            this.languages = null;

            // Start checking the service after registration.
            setTimeout(() => {
                this.checkSite();
            }, 1000);

            // Keep the site status updated.
            setInterval(() => {
                this.checkSite();
            }, 30000);
        }

        getInfo() {
            return {
                id: "generictranslatorextension",
                name: "Generic Translator Extension",

                color1: "#4C97FF",
                color2: "#3373CC",
                color3: "#285FA5",

                blocks: [
                    {
                        opcode: "translate",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Translate [TEXT] from [SOURCE] to [TARGET]",
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Hello world!"
                            },

                            SOURCE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "English"
                            },

                            TARGET: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Spanish"
                            }
                        }
                    },

                    {
                        opcode: "translateAuto",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Translate [TEXT] from Auto to [TARGET]",
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Bonjour tout le monde!"
                            },

                            TARGET: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "English"
                            }
                        }
                    },

                    {
                        opcode: "connected",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "Connected?",
                        disableMonitor: true
                    },

                    {
                        opcode: "onSite",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "MyMemory on-site?",
                        disableMonitor: true
                    }
                ]
            };
        }

        // ------------------------------------------------------------
        // LANGUAGE HANDLING
        // ------------------------------------------------------------

        resolveLanguage(language) {
            const value = String(language || "")
                .trim()
                .toLowerCase();

            if (!value) {
                return "";
            }

            // Already a language code.
            if (/^[a-z]{2,3}(-[a-z]{2,4})?$/.test(value)) {
                return value.split("-")[0];
            }

            const aliases = {
                afrikaans: "af",
                albanian: "sq",
                arabic: "ar",
                armenian: "hy",
                azerbaijani: "az",
                basque: "eu",
                bengali: "bn",
                bulgarian: "bg",
                catalan: "ca",
                chinese: "zh",
                croatian: "hr",
                czech: "cs",
                danish: "da",
                dutch: "nl",
                english: "en",
                estonian: "et",
                filipino: "tl",
                finnish: "fi",
                french: "fr",
                galician: "gl",
                georgian: "ka",
                german: "de",
                greek: "el",
                hebrew: "he",
                hindi: "hi",
                hungarian: "hu",
                icelandic: "is",
                indonesian: "id",
                irish: "ga",
                italian: "it",
                japanese: "ja",
                korean: "ko",
                latvian: "lv",
                lithuanian: "lt",
                malay: "ms",
                norwegian: "no",
                persian: "fa",
                polish: "pl",
                portuguese: "pt",
                romanian: "ro",
                russian: "ru",
                serbian: "sr",
                slovak: "sk",
                slovenian: "sl",
                spanish: "es",
                swedish: "sv",
                thai: "th",
                turkish: "tr",
                ukrainian: "uk",
                urdu: "ur",
                vietnamese: "vi"
            };

            if (aliases[value]) {
                return aliases[value];
            }

            // Try the cached MyMemory language list if available.
            if (Array.isArray(this.languages)) {
                const match = this.languages.find(languageObject => {
                    return String(languageObject.name || "")
                        .trim()
                        .toLowerCase() === value;
                });

                if (match && match.code) {
                    return match.code;
                }
            }

            // Let MyMemory handle unknown language codes.
            return value;
        }

        // ------------------------------------------------------------
        // SERVICE STATUS
        // ------------------------------------------------------------

        async checkSite() {
            try {
                /*
                 * MyMemory does not have a dedicated /languages
                 * endpoint like LibreTranslate.
                 *
                 * Instead, make a very small translation request.
                 */
                const url =
                    this.baseURL +
                    "/get?q=" +
                    encodeURIComponent("Hello") +
                    "&langpair=en|es";

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                this.siteOnline = response.ok;

                if (!response.ok) {
                    this.translationConnected = false;
                }

                return this.siteOnline;
            } catch (error) {
                this.siteOnline = false;
                this.translationConnected = false;

                return false;
            }
        }

        // ------------------------------------------------------------
        // CONNECTION TEST
        // ------------------------------------------------------------

        async checkConnection() {
            try {
                const result = await this.requestTranslation(
                    "Hello",
                    "en",
                    "es"
                );

                if (
                    result !== null &&
                    typeof result === "string" &&
                    result.length > 0
                ) {
                    this.translationConnected = true;
                    this.siteOnline = true;

                    return true;
                }

                this.translationConnected = false;

                return false;
            } catch (error) {
                this.translationConnected = false;

                return false;
            }
        }

        // ------------------------------------------------------------
        // TRANSLATION REQUEST
        // ------------------------------------------------------------

        async requestTranslation(text, source, target) {
            const url =
                this.baseURL +
                "/get?q=" +
                encodeURIComponent(String(text)) +
                "&langpair=" +
                encodeURIComponent(source + "|" + target);

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                // The server responded.
                this.siteOnline = true;

                let data;

                try {
                    data = await response.json();
                } catch (error) {
                    return null;
                }

                if (!response.ok) {
                    return null;
                }

                /*
                 * MyMemory returns:
                 *
                 * {
                 *   responseData: {
                 *     translatedText: "..."
                 *   }
                 * }
                 */

                if (
                    !data ||
                    !data.responseData ||
                    typeof data.responseData.translatedText === "undefined"
                ) {
                    return null;
                }

                const translatedText =
                    String(data.responseData.translatedText);

                if (!translatedText) {
                    return null;
                }

                return translatedText;
            } catch (error) {
                this.siteOnline = false;

                return null;
            }
        }

        // ------------------------------------------------------------
        // TRANSLATE
        // ------------------------------------------------------------

        async translate(args) {
            const text = String(args.TEXT || "");

            if (text === "") {
                return "";
            }

            const source = this.resolveLanguage(args.SOURCE);
            const target = this.resolveLanguage(args.TARGET);

            if (!source) {
                return "[Translation error: source language is empty]";
            }

            if (!target) {
                return "[Translation error: target language is empty]";
            }

            const result = await this.requestTranslation(
                text,
                source,
                target
            );

            if (result === null) {
                this.translationConnected = false;

                return "[Translation error: MyMemory request failed]";
            }

            this.translationConnected = true;

            return result;
        }

        // ------------------------------------------------------------
        // AUTO TRANSLATE
        // ------------------------------------------------------------

        async translateAuto(args) {
            const text = String(args.TEXT || "");

            if (text === "") {
                return "";
            }

            const target = this.resolveLanguage(args.TARGET);

            if (!target) {
                return "[Translation error: target language is empty]";
            }

            /*
             * MyMemory does not use LibreTranslate's "auto"
             * source-language value.
             *
             * The special "autodetect" source is used here.
             */
            const result = await this.requestTranslation(
                text,
                "autodetect",
                target
            );

            if (result === null) {
                this.translationConnected = false;

                return "[Translation error: MyMemory request failed]";
            }

            this.translationConnected = true;

            return result;
        }

        // ------------------------------------------------------------
        // BOOLEAN: CONNECTED?
        // ------------------------------------------------------------

        connected() {
            /*
             * True means an actual translation request
             * has successfully returned a translation.
             */
            return this.translationConnected;
        }

        // ------------------------------------------------------------
        // BOOLEAN: MYMEMORY ON-SITE?
        // ------------------------------------------------------------

        onSite() {
            /*
             * True means the MyMemory service responded.
             *
             * This does NOT necessarily mean the last
             * translation succeeded.
             */
            return this.siteOnline;
        }
    }

    // ------------------------------------------------------------
    // REGISTER EXTENSION
    // ------------------------------------------------------------

    Scratch.extensions.register(
        new MyMemoryTranslatorExtension()
    );

})(Scratch);
