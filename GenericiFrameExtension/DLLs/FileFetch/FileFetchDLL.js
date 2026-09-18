(function(Scratch) {
    'use strict';

    class DLLHTMLFetcher {
        constructor() {
            this.fetchedData = {};
            this.htmlCache = {};
            this.filesList = {};
            this.fetchErrors = {};
        }

        getInfo() {
            return {
                id: 'dllHtmlFetcher',
                name: 'File Fetch DLL',
                color1: '#e74c3c',
                blocks: [
                    {
                        opcode: 'fetchData',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Fetch Data from ID [ID]',
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'isGenericIFrameAvailable',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Generic iFrame Extension Available?'
                    },
                    {
                        opcode: 'fetchHtml',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Fetch HTML from ID [ID]',
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'fetchFilesList',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Fetch List of files attached to website ID [ID]',
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'fetchFile',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Fetch File from Website ID [ID] File Name [FILENAME]',
                        arguments: {
                            ID: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            },
                            FILENAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'file.txt'
                            }
                        }
                    }
                ]
            };
        }

        fetchData(args) {
            const id = Number(args.ID);

            try {
                const iframes = document.querySelectorAll('iframe');
                let targetIframe = null;

                for (const iframe of iframes) {
                    if (iframe.src && iframe.src !== '') {
                        targetIframe = iframe;
                        break;
                    }
                }

                if (!targetIframe) {
                    this.fetchErrors[id] = true;
                    return;
                }

                const iframeDoc =
                    targetIframe.contentDocument ||
                    targetIframe.contentWindow.document;

                if (!iframeDoc) {
                    this.fetchErrors[id] = true;
                    return;
                }

                this.htmlCache[id] =
                    iframeDoc.documentElement.outerHTML;

                const files = new Set();

                iframeDoc
                    .querySelectorAll('[src], [href]')
                    .forEach(element => {
                        const source =
                            element.getAttribute('src') ||
                            element.getAttribute('href');

                        if (source && !source.startsWith('#')) {
                            files.add(source);
                        }
                    });

                this.filesList[id] = Array.from(files);
                this.fetchErrors[id] = false;
            } catch (error) {
                this.fetchErrors[id] = true;
            }
        }

        isGenericIFrameAvailable() {
            const extensionManager =
                Scratch.vm?.extensionManager;

            if (!extensionManager) {
                return false;
            }

            return extensionManager.isExtensionLoaded(
                'multiIframeExtension'
            );
        }

        fetchHtml(args) {
            const id = Number(args.ID);

            if (Object.prototype.hasOwnProperty.call(
                this.htmlCache,
                id
            )) {
                return this.htmlCache[id];
            }

            return this.fetchErrors[id]
                ? 'Error fetching HTML'
                : 'HTML not yet fetched';
        }

        fetchFilesList(args) {
            const id = Number(args.ID);

            if (Object.prototype.hasOwnProperty.call(
                this.filesList,
                id
            )) {
                return JSON.stringify(this.filesList[id]);
            }

            return '[]';
        }

        fetchFile(args) {
            const id = Number(args.ID);
            const filename = String(args.FILENAME);

            if (!this.filesList[id]) {
                return 'File list not yet fetched';
            }

            if (!this.filesList[id].includes(filename)) {
                return 'File not found in list';
            }

            try {
                const iframes = document.querySelectorAll('iframe');
                let targetIframe = null;

                for (const iframe of iframes) {
                    if (iframe.src && iframe.src !== '') {
                        targetIframe = iframe;
                        break;
                    }
                }

                if (!targetIframe) {
                    return 'iFrame not found';
                }

                const iframeDocument =
                    targetIframe.contentDocument ||
                    targetIframe.contentWindow.document;

                const fileUrl = new URL(
                    filename,
                    targetIframe.src
                ).href;

                const request = new XMLHttpRequest();
                request.open('GET', fileUrl, false);
                request.send();

                if (
                    request.status >= 200 &&
                    request.status < 300
                ) {
                    return request.responseText;
                }

                return 'Error fetching file';
            } catch (error) {
                return 'Error fetching file';
            }
        }
    }

    Scratch.extensions.register(new DLLHTMLFetcher());
})(Scratch);