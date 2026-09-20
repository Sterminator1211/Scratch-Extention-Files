(function (Scratch) {
    'use strict';

    const EXTENSION_ID = 'synthesizerengine';

    const DB_NAME = 'synthengine';
    const DB_VERSION = 2;

    const AUDIO_STORE = 'audio';
    const WAVETONE_STORE = 'wavetones';

    const WAVETONE_SAMPLES = 1024;
    const WAVETONE_EXPORT_FREQUENCY = 440;
    const WAVETONE_EXPORT_SECONDS = 3;
    const WAVETONE_EXPORT_SAMPLE_RATE = 44100;

    class SynthesizerEngine {
        constructor() {
            this.runtime =
                Scratch.vm
                    ? Scratch.vm.runtime
                    : null;

            this.audioLibrary = new Map();
            this.wavetoneLibrary = new Map();

            this.db = null;
            this.hydrated = false;

            this.fileInput = null;

            this.editor = null;
            this.wavetoneEditor = null;

            this.hydratePromise =
                this.hydrate();
        }

        // =============================================================
        // EXTENSION INFO
        // =============================================================

        getInfo() {
            return {
                id: EXTENSION_ID,

                name:
                    'Synthesizer Engine',

                color1:
                    '#7B3FE4',

                color2:
                    '#49B86B',

                color3:
                    '#4C2789',

                blocks: [

                    // =================================================
                    // IMPORT / EXPORT
                    // =================================================

                    {
                        blockType:
                            Scratch.BlockType.LABEL,

                        text:
                            'Import / Export'
                    },

                    {
                        opcode:
                            'importFromAudioTab',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Import [AUDIO] from audio tab with name [NAME]',

                        arguments: {
                            AUDIO: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'spriteAudioMenu'
                            },

                            NAME: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                defaultValue:
                                    'Imported Audio'
                            }
                        }
                    },

                    {
                        opcode:
                            'exportToAudioTab',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Export [AUDIO_SAVED] to audio tab with name [NAME]',

                        arguments: {
                            AUDIO_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'extensionAudioMenu'
                            },

                            NAME: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                defaultValue:
                                    'Exported Audio'
                            }
                        }
                    },

                    {
                        opcode:
                            'importFromFile',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Import audio from file with name [NAME]',

                        arguments: {
                            NAME: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                defaultValue:
                                    'Imported Audio'
                            }
                        }
                    },

                    {
                        opcode:
                            'exportToFile',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Export [AUDIO_SAVED] to file with name [NAME]',

                        arguments: {
                            AUDIO_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'extensionAudioMenu'
                            },

                            NAME: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                defaultValue:
                                    'audio'
                            }
                        }
                    },

                    {
                        opcode:
                            'removeFromExtension',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Remove [AUDIO_SAVED] From Extension',

                        arguments: {
                            AUDIO_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'extensionAudioMenu'
                            }
                        }
                    },

                    // =================================================
                    // WAVE TONE
                    // =================================================

                    {
                        blockType:
                            Scratch.BlockType.LABEL,

                        text:
                            'Wave Tone'
                    },

                    {
                        opcode:
                            'createNewWavetone',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Create New Wavetone as name [NAME]',

                        arguments: {
                            NAME: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                defaultValue:
                                    'New Wavetone'
                            }
                        }
                    },

                    {
                        opcode:
                            'exportWavetoneToAudioTab',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Export Wavetone [WAVETONE_SAVED] to Audio Tab',

                        arguments: {
                            WAVETONE_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'wavetoneMenu'
                            }
                        }
                    },

                    {
                        opcode:
                            'exportWavetoneToDevice',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Export Wavetone [WAVETONE_SAVED] to Device',

                        arguments: {
                            WAVETONE_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'wavetoneMenu'
                            }
                        }
                    },

                    {
                        opcode:
                            'deleteWavetone',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Delete Wavetone [WAVETONE_SAVED]',

                        arguments: {
                            WAVETONE_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'wavetoneMenu'
                            }
                        }
                    },

                    // =================================================
                    // AUDIO EDITING
                    // =================================================

                    {
                        blockType:
                            Scratch.BlockType.LABEL,

                        text:
                            'Audio Editing'
                    },

                    {
                        opcode:
                            'openEditor',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Open Editor in [AUDIO_SAVED]',

                        arguments: {
                            AUDIO_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'extensionAudioMenu'
                            }
                        }
                    },

                    {
                        opcode:
                            'openWavetoneEditor',

                        blockType:
                            Scratch.BlockType.COMMAND,

                        text:
                            'Edit Wavetone in Wavetone Editor in [WAVETONE_SAVED]',

                        arguments: {
                            WAVETONE_SAVED: {
                                type:
                                    Scratch.ArgumentType.STRING,

                                menu:
                                    'wavetoneMenu'
                            }
                        }
                    },

                    // =================================================
                    // DATA
                    // =================================================

                    {
                        blockType:
                            Scratch.BlockType.LABEL,

                        text:
                            'Data'
                    },

                    {
                        opcode:
                            'existingAudioFiles',

                        blockType:
                            Scratch.BlockType.REPORTER,

                        text:
                            'Existing Audio Files'
                    },

                    {
                        opcode:
                            'existingWavetones',

                        blockType:
                            Scratch.BlockType.REPORTER,

                        text:
                            'Existing Wavetones'
                    }
                ],

                menus: {
                    spriteAudioMenu: {
                        acceptReporters:
                            true,

                        items:
                            'getSpriteAudioMenu'
                    },

                    extensionAudioMenu: {
                        acceptReporters:
                            true,

                        items:
                            'getExtensionAudioMenu'
                    },

                    wavetoneMenu: {
                        acceptReporters:
                            true,

                        items:
                            'getWavetoneMenu'
                    }
                }
            };
        }

        // =============================================================
        // MENUS
        // =============================================================

        getSpriteAudioMenu() {
            const target =
                this.getCurrentTarget();

            if (
                !target ||
                !target.sprite ||
                !Array.isArray(
                    target.sprite.sounds
                ) ||
                target.sprite.sounds.length ===
                    0
            ) {
                return [
                    {
                        text:
                            '(no audio)',

                        value:
                            ''
                    }
                ];
            }

            return target.sprite.sounds.map(
                (sound, index) => {
                    const name =
                        sound &&
                        sound.name != null
                            ? String(
                                sound.name
                            )
                            : `Sound ${index + 1}`;

                    return {
                        text:
                            name,

                        value:
                            name
                    };
                }
            );
        }

        getExtensionAudioMenu() {
            if (
                !this.hydrated &&
                this.audioLibrary.size ===
                    0
            ) {
                return [
                    {
                        text:
                            '(loading audio...)',

                        value:
                            ''
                    }
                ];
            }

            if (
                this.audioLibrary.size ===
                    0
            ) {
                return [
                    {
                        text:
                            '(no saved audio)',

                        value:
                            ''
                    }
                ];
            }

            return Array.from(
                this.audioLibrary.keys()
            ).map(
                name => ({
                    text:
                        name,

                    value:
                        name
                })
            );
        }

        getWavetoneMenu() {
            if (
                !this.hydrated &&
                this.wavetoneLibrary.size ===
                    0
            ) {
                return [
                    {
                        text:
                            '(loading Wavetones...)',

                        value:
                            ''
                    }
                ];
            }

            if (
                this.wavetoneLibrary.size ===
                    0
            ) {
                return [
                    {
                        text:
                            '(no saved Wavetones)',

                        value:
                            ''
                    }
                ];
            }

            return Array.from(
                this.wavetoneLibrary.keys()
            ).map(
                name => ({
                    text:
                        name,

                    value:
                        name
                })
            );
        }

        // =============================================================
        // TARGET
        // =============================================================

        getCurrentTarget(util) {
            if (
                util &&
                util.target
            ) {
                return util.target;
            }

            if (
                this.runtime &&
                typeof this.runtime
                    .getEditingTarget ===
                    'function'
            ) {
                return this.runtime
                    .getEditingTarget();
            }

            if (
                this.runtime &&
                Array.isArray(
                    this.runtime.targets
                )
            ) {
                return (
                    this.runtime.targets.find(
                        target =>
                            target &&
                            !target.isStage &&
                            target.isOriginal
                    ) ||
                    null
                );
            }

            return null;
        }

        // =============================================================
        // GENERAL HELPERS
        // =============================================================

        normalizeName(
            value,
            fallback
        ) {
            const result =
                String(
                    value == null
                        ? ''
                        : value
                ).trim();

            return (
                result ||
                fallback
            );
        }

        getFileExtension(
            filename
        ) {
            const clean =
                String(
                    filename ||
                        ''
                )
                    .split('?')[0]
                    .split('#')[0];

            const match =
                clean.match(
                    /\.([a-zA-Z0-9]+)$/
                );

            return match
                ? match[1].toLowerCase()
                : '';
        }

        removeExtension(
            filename
        ) {
            return String(
                filename || ''
            ).replace(
                /\.([a-zA-Z0-9]+)$/,
                ''
            );
        }

        mimeFromExtension(
            extension
        ) {
            const map = {
                mp3:
                    'audio/mpeg',

                wav:
                    'audio/wav',

                ogg:
                    'audio/ogg',

                oga:
                    'audio/ogg',

                flac:
                    'audio/flac',

                m4a:
                    'audio/mp4',

                mp4:
                    'audio/mp4',

                aac:
                    'audio/aac',

                webm:
                    'audio/webm'
            };

            return (
                map[
                    String(
                        extension ||
                            ''
                    ).toLowerCase()
                ] ||
                'application/octet-stream'
            );
        }

        extensionFromMime(
            mime
        ) {
            const map = {
                'audio/mpeg':
                    'mp3',

                'audio/mp3':
                    'mp3',

                'audio/wav':
                    'wav',

                'audio/x-wav':
                    'wav',

                'audio/ogg':
                    'ogg',

                'audio/vorbis':
                    'ogg',

                'audio/flac':
                    'flac',

                'audio/mp4':
                    'm4a',

                'audio/aac':
                    'aac',

                'audio/webm':
                    'webm'
            };

            return (
                map[
                    String(
                        mime ||
                            ''
                    ).toLowerCase()
                ] ||
                'bin'
            );
        }

        arrayBufferCopy(
            data
        ) {
            if (
                data instanceof
                ArrayBuffer
            ) {
                return data.slice(0);
            }

            if (
                ArrayBuffer.isView(
                    data
                )
            ) {
                return data.buffer.slice(
                    data.byteOffset,
                    data.byteOffset +
                        data.byteLength
                );
            }

            throw new Error(
                'Expected ArrayBuffer or typed array.'
            );
        }

        arrayBufferToUint8Array(
            data
        ) {
            return new Uint8Array(
                this.arrayBufferCopy(
                    data
                )
            );
        }

        arrayBufferToBlob(
            data,
            mime
        ) {
            return new Blob(
                [
                    this.arrayBufferCopy(
                        data
                    )
                ],
                {
                    type:
                        mime ||
                        'application/octet-stream'
                }
            );
        }

        async blobToArrayBuffer(
            blob
        ) {
            if (
                blob &&
                typeof blob.arrayBuffer ===
                    'function'
            ) {
                return blob.arrayBuffer();
            }

            return new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const reader =
                        new FileReader();

                    reader.onload =
                        () =>
                            resolve(
                                reader.result
                            );

                    reader.onerror =
                        () =>
                            reject(
                                new Error(
                                    'Could not read file.'
                                )
                            );

                    reader.readAsArrayBuffer(
                        blob
                    );
                }
            );
        }

        getAudioContextClass() {
            return (
                window.AudioContext ||
                window.webkitAudioContext ||
                null
            );
        }

        // =============================================================
        // DATABASE
        // =============================================================

        openDatabase() {
            if (
                typeof indexedDB ===
                    'undefined'
            ) {
                return Promise.reject(
                    new Error(
                        'IndexedDB is unavailable.'
                    )
                );
            }

            return new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const request =
                        indexedDB.open(
                            DB_NAME,
                            DB_VERSION
                        );

                    request.onupgradeneeded =
                        event => {
                            const db =
                                event.target
                                    .result;

                            if (
                                !db.objectStoreNames.contains(
                                    AUDIO_STORE
                                )
                            ) {
                                db.createObjectStore(
                                    AUDIO_STORE,
                                    {
                                        keyPath:
                                            'name'
                                    }
                                );
                            }

                            if (
                                !db.objectStoreNames.contains(
                                    WAVETONE_STORE
                                )
                            ) {
                                db.createObjectStore(
                                    WAVETONE_STORE,
                                    {
                                        keyPath:
                                            'name'
                                    }
                                );
                            }
                        };

                    request.onsuccess =
                        () =>
                            resolve(
                                request.result
                            );

                    request.onerror =
                        () =>
                            reject(
                                request.error ||
                                    new Error(
                                        'Could not open database.'
                                    )
                            );
                }
            );
        }

        async hydrate() {
            try {
                this.db =
                    await this.openDatabase();

                const audioRecords =
                    await new Promise(
                        (
                            resolve,
                            reject
                        ) => {
                            const request =
                                this.db
                                    .transaction(
                                        AUDIO_STORE,
                                        'readonly'
                                    )
                                    .objectStore(
                                        AUDIO_STORE
                                    )
                                    .getAll();

                            request.onsuccess =
                                () =>
                                    resolve(
                                        request.result ||
                                            []
                                    );

                            request.onerror =
                                () =>
                                    reject(
                                        request.error
                                    );
                        }
                    );

                for (
                    const record of
                        audioRecords
                ) {
                    if (
                        !record ||
                        !record.name ||
                        !record.data
                    ) {
                        continue;
                    }

                    this.audioLibrary.set(
                        String(
                            record.name
                        ),
                        {
                            name:
                                String(
                                    record.name
                                ),

                            data:
                                this.arrayBufferCopy(
                                    record.data
                                ),

                            mime:
                                record.mime ||
                                'audio/wav',

                            extension:
                                record.extension ||
                                this.extensionFromMime(
                                    record.mime
                                )
                        }
                    );
                }

                const wavetoneRecords =
                    await new Promise(
                        (
                            resolve,
                            reject
                        ) => {
                            const request =
                                this.db
                                    .transaction(
                                        WAVETONE_STORE,
                                        'readonly'
                                    )
                                    .objectStore(
                                        WAVETONE_STORE
                                    )
                                    .getAll();

                            request.onsuccess =
                                () =>
                                    resolve(
                                        request.result ||
                                            []
                                    );

                            request.onerror =
                                () =>
                                    reject(
                                        request.error
                                    );
                        }
                    );

                for (
                    const record of
                        wavetoneRecords
                ) {
                    if (
                        !record ||
                        !record.name ||
                        !record.samples
                    ) {
                        continue;
                    }

                    this.wavetoneLibrary.set(
                        String(
                            record.name
                        ),
                        {
                            name:
                                String(
                                    record.name
                                ),

                            samples:
                                new Float32Array(
                                    this.arrayBufferCopy(
                                        record.samples
                                    )
                                ),

                            created:
                                record.created ||
                                Date.now()
                        }
                    );
                }
            } catch (error) {
                console.warn(
                    '[Synthesizer Engine] Database hydration failed:',
                    error
                );
            }

            this.hydrated =
                true;
        }

        async persistAudio(
            entry
        ) {
            if (!this.db) {
                return;
            }

            await new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const tx =
                        this.db.transaction(
                            AUDIO_STORE,
                            'readwrite'
                        );

                    tx.objectStore(
                        AUDIO_STORE
                    ).put({
                        name:
                            entry.name,

                        data:
                            this.arrayBufferCopy(
                                entry.data
                            ),

                        mime:
                            entry.mime,

                        extension:
                            entry.extension
                    });

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error ||
                                    new Error(
                                        'Could not save audio.'
                                    )
                            );
                }
            );
        }

        async persistWavetone(
            entry
        ) {
            if (!this.db) {
                return;
            }

            const copy =
                new Float32Array(
                    entry.samples
                );

            await new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const tx =
                        this.db.transaction(
                            WAVETONE_STORE,
                            'readwrite'
                        );

                    tx.objectStore(
                        WAVETONE_STORE
                    ).put({
                        name:
                            entry.name,

                        samples:
                            copy.buffer.slice(
                                copy.byteOffset,
                                copy.byteOffset +
                                    copy.byteLength
                            ),

                        created:
                            entry.created ||
                            Date.now()
                    });

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error ||
                                    new Error(
                                        'Could not save Wavetone.'
                                    )
                            );
                }
            );
        }

        async deleteAudioStorage(
            name
        ) {
            if (!this.db) {
                return;
            }

            await new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const tx =
                        this.db.transaction(
                            AUDIO_STORE,
                            'readwrite'
                        );

                    tx.objectStore(
                        AUDIO_STORE
                    ).delete(
                        String(
                            name
                        )
                    );

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error
                            );
                }
            );
        }

        async deleteWavetoneStorage(
            name
        ) {
            if (!this.db) {
                return;
            }

            await new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const tx =
                        this.db.transaction(
                            WAVETONE_STORE,
                            'readwrite'
                        );

                    tx.objectStore(
                        WAVETONE_STORE
                    ).delete(
                        String(
                            name
                        )
                    );

                    tx.oncomplete =
                        resolve;

                    tx.onerror =
                        () =>
                            reject(
                                tx.error
                            );
                }
            );
        }

        async saveAudio(
            name,
            data,
            mime,
            extension
        ) {
            await this.hydratePromise.catch(
                () => {}
            );

            const cleanName =
                this.normalizeName(
                    name,
                    'Imported Audio'
                );

            const entry = {
                name:
                    cleanName,

                data:
                    this.arrayBufferCopy(
                        data
                    ),

                mime:
                    mime ||
                    'application/octet-stream',

                extension:
                    extension ||
                    this.extensionFromMime(
                        mime
                    )
            };

            this.audioLibrary.set(
                cleanName,
                entry
            );

            try {
                await this.persistAudio(
                    entry
                );
            } catch (error) {
                console.warn(
                    '[Synthesizer Engine] Could not persist audio:',
                    error
                );
            }
        }

        async saveWavetone(
            name,
            samples
        ) {
            await this.hydratePromise.catch(
                () => {}
            );

            const cleanName =
                this.normalizeName(
                    name,
                    'New Wavetone'
                );

            const cleaned =
                new Float32Array(
                    samples.length
                );

            for (
                let i = 0;
                i < samples.length;
                i++
            ) {
                cleaned[i] =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            Number(
                                samples[i]
                            ) || 0
                        )
                    );
            }

            const entry = {
                name:
                    cleanName,

                samples:
                    cleaned,

                created:
                    Date.now()
            };

            this.wavetoneLibrary.set(
                cleanName,
                entry
            );

            try {
                await this.persistWavetone(
                    entry
                );
            } catch (error) {
                console.warn(
                    '[Synthesizer Engine] Could not persist Wavetone:',
                    error
                );
            }
        }

        async getSavedAudio(
            name
        ) {
            await this.hydratePromise.catch(
                () => {}
            );

            return this.audioLibrary.get(
                String(
                    name == null
                        ? ''
                        : name
                )
            );
        }

        async getSavedWavetone(
            name
        ) {
            await this.hydratePromise.catch(
                () => {}
            );

            return this.wavetoneLibrary.get(
                String(
                    name == null
                        ? ''
                        : name
                )
            );
        }

        // =============================================================
        // DATA REPORTERS
        // =============================================================

        existingAudioFiles() {
            return (
                '[' +
                Array.from(
                    this.audioLibrary.keys()
                )
                    .map(
                        name =>
                            JSON.stringify(
                                name
                            )
                    )
                    .join(', ') +
                ']'
            );
        }

        existingWavetones() {
            return (
                '[' +
                Array.from(
                    this.wavetoneLibrary.keys()
                )
                    .map(
                        name =>
                            JSON.stringify(
                                name
                            )
                    )
                    .join(', ') +
                ']'
            );
        }

        // =============================================================
        // AUDIO TAB IMPORT
        // =============================================================

        parseMd5Extension(
            sound
        ) {
            if (!sound) {
                return '';
            }

            if (sound.md5) {
                const parts =
                    String(
                        sound.md5
                    ).split('.');

                if (
                    parts.length >=
                    2
                ) {
                    return parts[
                        parts.length - 1
                    ].toLowerCase();
                }
            }

            return String(
                sound.dataFormat ||
                    sound.format ||
                    ''
            ).toLowerCase();
        }

        async getSoundAsset(
            sound
        ) {
            if (!sound) {
                throw new Error(
                    'The selected sound does not exist.'
                );
            }

            if (
                sound.asset &&
                sound.asset.data
            ) {
                return sound.asset;
            }

            const storage =
                this.runtime &&
                this.runtime.storage;

            if (!storage) {
                throw new Error(
                    'PenguinMod storage is unavailable.'
                );
            }

            if (
                sound.assetId
            ) {
                const cached =
                    storage.get(
                        sound.assetId
                    );

                if (
                    cached &&
                    cached.data
                ) {
                    return cached;
                }

                const format =
                    this.parseMd5Extension(
                        sound
                    ) || 'wav';

                const loaded =
                    await storage.load(
                        storage.AssetType
                            .Sound,
                        sound.assetId,
                        format
                    );

                if (
                    loaded &&
                    loaded.data
                ) {
                    return loaded;
                }
            }

            if (
                sound.md5
            ) {
                const parts =
                    String(
                        sound.md5
                    ).split('.');

                const assetId =
                    parts[0];

                const format =
                    parts[1]
                        ? parts[
                            1
                        ].toLowerCase()
                        : 'wav';

                if (assetId) {
                    const cached =
                        storage.get(
                            assetId
                        );

                    if (
                        cached &&
                        cached.data
                    ) {
                        return cached;
                    }

                    const loaded =
                        await storage.load(
                            storage.AssetType
                                .Sound,
                            assetId,
                            format
                        );

                    if (
                        loaded &&
                        loaded.data
                    ) {
                        return loaded;
                    }
                }
            }

            throw new Error(
                'Could not locate sound asset.'
            );
        }

        async getSoundBinary(
            sound
        ) {
            const asset =
                await this.getSoundAsset(
                    sound
                );

            if (
                !asset ||
                !asset.data
            ) {
                throw new Error(
                    'The sound asset contains no binary audio data.'
                );
            }

            const extension =
                asset.dataFormat ||
                this.parseMd5Extension(
                    sound
                ) ||
                'wav';

            return {
                data:
                    this.arrayBufferCopy(
                        asset.data
                    ),

                extension,

                mime:
                    this.mimeFromExtension(
                        extension
                    )
            };
        }

        findSpriteSound(
            target,
            name
        ) {
            if (
                !target ||
                !target.sprite ||
                !Array.isArray(
                    target.sprite.sounds
                )
            ) {
                return null;
            }

            const wanted =
                String(
                    name == null
                        ? ''
                        : name
                );

            return (
                target.sprite.sounds.find(
                    sound =>
                        String(
                            sound.name
                        ) ===
                        wanted
                ) ||
                null
            );
        }

        async importFromAudioTab(
            args,
            util
        ) {
            const target =
                this.getCurrentTarget(
                    util
                );

            const sound =
                this.findSpriteSound(
                    target,
                    args.AUDIO
                );

            if (!sound) {
                return;
            }

            try {
                const audio =
                    await this.getSoundBinary(
                        sound
                    );

                const name =
                    this.normalizeName(
                        args.NAME,
                        sound.name ||
                            'Imported Audio'
                    );

                await this.saveAudio(
                    name,
                    audio.data,
                    audio.mime,
                    audio.extension
                );
            } catch (error) {
                console.error(
                    '[Synthesizer Engine] Audio-tab import failed:',
                    error
                );
            }
        }

        // =============================================================
        // FILE IMPORT
        // =============================================================

        importFromFile(
            args
        ) {
            const name =
                this.normalizeName(
                    args.NAME,
                    'Imported Audio'
                );

            if (this.fileInput) {
                try {
                    this.fileInput.remove();
                } catch (e) {}
            }

            const input =
                document.createElement(
                    'input'
                );

            input.type =
                'file';

            input.accept =
                'audio/*';

            input.style.display =
                'none';

            document.body.appendChild(
                input
            );

            this.fileInput =
                input;

            input.addEventListener(
                'change',
                async () => {
                    const file =
                        input.files &&
                        input.files[0];

                    try {
                        if (!file) {
                            return;
                        }

                        const data =
                            await this.blobToArrayBuffer(
                                file
                            );

                        const extension =
                            this.getFileExtension(
                                file.name
                            ) ||
                            this.extensionFromMime(
                                file.type
                            );

                        await this.saveAudio(
                            name,
                            data,
                            file.type ||
                                this.mimeFromExtension(
                                    extension
                                ),
                            extension
                        );
                    } catch (error) {
                        console.error(
                            '[Synthesizer Engine] File import failed:',
                            error
                        );
                    } finally {
                        try {
                            input.remove();
                        } catch (e) {}

                        if (
                            this.fileInput ===
                            input
                        ) {
                            this.fileInput =
                                null;
                        }
                    }
                },
                {
                    once:
                        true
                }
            );

            input.click();
        }

        // =============================================================
        // REMOVE AUDIO
        // =============================================================

        async removeFromExtension(
            args
        ) {
            const name =
                String(
                    args.AUDIO_SAVED ||
                        ''
                );

            if (!name) {
                return;
            }

            await this.hydratePromise.catch(
                () => {}
            );

            if (
                !this.audioLibrary.has(
                    name
                )
            ) {
                return;
            }

            this.audioLibrary.delete(
                name
            );

            try {
                await this.deleteAudioStorage(
                    name
                );
            } catch (error) {
                console.warn(
                    '[Synthesizer Engine] Could not delete audio:',
                    error
                );
            }

            if (
                this.editor &&
                this.editor.assetName ===
                    name
            ) {
                this.closeEditor();
            }
        }

        // =============================================================
        // AUDIO EXPORT
        // =============================================================

        async exportToFile(
            args
        ) {
            const stored =
                await this.getSavedAudio(
                    args.AUDIO_SAVED
                );

            if (!stored) {
                return;
            }

            const requestedName =
                this.normalizeName(
                    args.NAME,
                    stored.name
                );

            const extension =
                stored.extension ||
                this.extensionFromMime(
                    stored.mime
                ) ||
                'bin';

            this.downloadBlob(
                this.arrayBufferToBlob(
                    stored.data,
                    stored.mime
                ),
                this.removeExtension(
                    requestedName
                ) +
                    '.' +
                    extension
            );
        }

        // =============================================================
        // AUDIO DECODING
        // =============================================================

        async decodeArrayBuffer(
            data
        ) {
            const Context =
                this.getAudioContextClass();

            if (!Context) {
                throw new Error(
                    'Web Audio is unavailable.'
                );
            }

            const context =
                new Context();

            try {
                return await context.decodeAudioData(
                    this.arrayBufferCopy(
                        data
                    )
                );
            } finally {
                try {
                    await context.close();
                } catch (e) {}
            }
        }

        async convertToWavIfNeeded(
            stored
        ) {
            const extension =
                String(
                    stored.extension ||
                        ''
                ).toLowerCase();

            if (
                [
                    'wav',
                    'mp3',
                    'ogg',
                    'flac'
                ].includes(
                    extension
                )
            ) {
                return {
                    data:
                        this.arrayBufferCopy(
                            stored.data
                        ),

                    extension,

                    mime:
                        stored.mime ||
                        this.mimeFromExtension(
                            extension
                        )
                };
            }

            const decoded =
                await this.decodeArrayBuffer(
                    stored.data
                );

            return {
                data:
                    this.audioBufferToWav(
                        decoded
                    ),

                extension:
                    'wav',

                mime:
                    'audio/wav'
            };
        }

        // =============================================================
        // EXPORT AUDIO TO AUDIO TAB
        // =============================================================

        async exportToAudioTab(
            args,
            util
        ) {
            const stored =
                await this.getSavedAudio(
                    args.AUDIO_SAVED
                );

            if (!stored) {
                return;
            }

            const target =
                this.getCurrentTarget(
                    util
                );

            if (
                !target ||
                !target.sprite
            ) {
                return;
            }

            const runtime =
                this.runtime ||
                target.runtime;

            if (
                !runtime ||
                !runtime.storage
            ) {
                return;
            }

            try {
                const prepared =
                    await this.convertToWavIfNeeded(
                        stored
                    );

                const storage =
                    runtime.storage;

                const assetId =
                    storage.cache(
                        storage.AssetType.Sound,
                        prepared.extension,
                        this.arrayBufferToUint8Array(
                            prepared.data
                        )
                    );

                const asset =
                    storage.get(
                        assetId
                    );

                if (!asset) {
                    throw new Error(
                        'Could not retrieve cached audio.'
                    );
                }

                const requestedName =
                    this.normalizeName(
                        args.NAME,
                        stored.name
                    );

                const sound = {
                    name:
                        requestedName,

                    assetId:
                        asset.assetId,

                    md5:
                        `${asset.assetId}.${prepared.extension}`,

                    dataFormat:
                        prepared.extension,

                    asset,

                    data:
                        asset.data,

                    rate:
                        0,

                    sampleCount:
                        0
                };

                if (
                    runtime.audioEngine
                ) {
                    const player =
                        await runtime.audioEngine
                            .decodeSoundPlayer(
                                {
                                    ...sound,

                                    data:
                                        asset.data
                                }
                            );

                    sound.soundId =
                        player.id;

                    if (
                        player.buffer
                    ) {
                        sound.rate =
                            player.buffer
                                .sampleRate;

                        sound.sampleCount =
                            player.buffer
                                .length;
                    }

                    if (
                        target.sprite
                            .soundBank
                    ) {
                        target.sprite
                            .soundBank
                            .addSoundPlayer(
                                player
                            );
                    }
                }

                if (
                    typeof target.addSound ===
                    'function'
                ) {
                    target.addSound(
                        sound
                    );
                } else {
                    if (
                        !Array.isArray(
                            target.sprite.sounds
                        )
                    ) {
                        target.sprite.sounds =
                            [];
                    }

                    target.sprite.sounds.push(
                        sound
                    );
                }

                if (
                    typeof runtime.requestTargetsUpdate ===
                    'function'
                ) {
                    runtime.requestTargetsUpdate(
                        target
                    );
                }

                if (
                    typeof runtime.requestRedraw ===
                    'function'
                ) {
                    runtime.requestRedraw();
                }
            } catch (error) {
                console.error(
                    '[Synthesizer Engine] Audio-tab export failed:',
                    error
                );
            }
        }

        // =============================================================
        // AUDIO BUFFER UTILITIES
        // =============================================================

        makeAudioBuffer(
            channels,
            length,
            sampleRate
        ) {
            const Context =
                this.getAudioContextClass();

            if (!Context) {
                throw new Error(
                    'Web Audio is unavailable.'
                );
            }

            const context =
                new Context();

            try {
                return context.createBuffer(
                    channels,

                    Math.max(
                        1,
                        Math.floor(
                            length
                        )
                    ),

                    sampleRate
                );
            } finally {
                try {
                    context.close();
                } catch (e) {}
            }
        }

        cloneAudioBuffer(
            buffer
        ) {
            const out =
                this.makeAudioBuffer(
                    buffer.numberOfChannels,
                    buffer.length,
                    buffer.sampleRate
                );

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                out
                    .getChannelData(
                        c
                    )
                    .set(
                        buffer.getChannelData(
                            c
                        )
                    );
            }

            return out;
        }

        extractAudioRange(
            buffer,
            startSeconds,
            endSeconds
        ) {
            const start =
                Math.max(
                    0,
                    Math.min(
                        buffer.duration,
                        Number(
                            startSeconds
                        ) || 0
                    )
                );

            const end =
                Math.max(
                    start,
                    Math.min(
                        buffer.duration,
                        Number(
                            endSeconds
                        ) || 0
                    )
                );

            const startFrame =
                Math.floor(
                    start *
                        buffer.sampleRate
                );

            const endFrame =
                Math.floor(
                    end *
                        buffer.sampleRate
                );

            const length =
                endFrame -
                startFrame;

            if (
                length <= 0
            ) {
                return null;
            }

            const out =
                this.makeAudioBuffer(
                    buffer.numberOfChannels,
                    length,
                    buffer.sampleRate
                );

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                out
                    .getChannelData(
                        c
                    )
                    .set(
                        buffer
                            .getChannelData(
                                c
                            )
                            .subarray(
                                startFrame,
                                endFrame
                            )
                    );
            }

            return out;
        }

        concatAudioBuffers(
            buffers,
            channels,
            sampleRate
        ) {
            const usable =
                buffers.filter(Boolean);

            if (
                usable.length ===
                    0
            ) {
                return this.makeAudioBuffer(
                    channels,
                    1,
                    sampleRate
                );
            }

            const total =
                usable.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        item.length,
                    0
                );

            const out =
                this.makeAudioBuffer(
                    channels,
                    total,
                    sampleRate
                );

            let offset = 0;

            for (
                const item of
                    usable
            ) {
                for (
                    let c = 0;
                    c < channels;
                    c++
                ) {
                    const source =
                        item.getChannelData(
                            Math.min(
                                c,
                                item.numberOfChannels -
                                    1
                            )
                        );

                    out
                        .getChannelData(
                            c
                        )
                        .set(
                            source,
                            offset
                        );
                }

                offset +=
                    item.length;
            }

            return out;
        }

        // =============================================================
        // EDIT OPERATIONS
        // =============================================================

        applyGain(
            buffer,
            gain
        ) {
            const out =
                this.cloneAudioBuffer(
                    buffer
                );

            for (
                let c = 0;
                c <
                out.numberOfChannels;
                c++
            ) {
                const data =
                    out.getChannelData(
                        c
                    );

                for (
                    let i = 0;
                    i < data.length;
                    i++
                ) {
                    data[i] =
                        Math.max(
                            -1,
                            Math.min(
                                1,
                                data[i] *
                                    gain
                            )
                        );
                }
            }

            return out;
        }

        normalizeBuffer(
            buffer
        ) {
            let peak = 0;

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                const data =
                    buffer.getChannelData(
                        c
                    );

                for (
                    let i = 0;
                    i < data.length;
                    i++
                ) {
                    peak =
                        Math.max(
                            peak,
                            Math.abs(
                                data[i]
                            )
                        );
                }
            }

            if (
                peak <= 0
            ) {
                return this.cloneAudioBuffer(
                    buffer
                );
            }

            return this.applyGain(
                buffer,
                1 / peak
            );
        }

        reverseBuffer(
            buffer
        ) {
            const out =
                this.cloneAudioBuffer(
                    buffer
                );

            for (
                let c = 0;
                c <
                out.numberOfChannels;
                c++
            ) {
                out
                    .getChannelData(
                        c
                    )
                    .reverse();
            }

            return out;
        }

        fadeBuffer(
            buffer,
            seconds,
            fadeIn
        ) {
            const out =
                this.cloneAudioBuffer(
                    buffer
                );

            const frames =
                Math.min(
                    out.length,
                    Math.max(
                        1,
                        Math.floor(
                            seconds *
                                out.sampleRate
                        )
                    )
                );

            for (
                let c = 0;
                c <
                out.numberOfChannels;
                c++
            ) {
                const data =
                    out.getChannelData(
                        c
                    );

                for (
                    let i = 0;
                    i < frames;
                    i++
                ) {
                    const ratio =
                        frames <= 1
                            ? 1
                            : i /
                              (frames -
                                  1);

                    const factor =
                        fadeIn
                            ? ratio
                            : 1 - ratio;

                    const index =
                        fadeIn
                            ? i
                            : data.length -
                              frames +
                              i;

                    data[index] *=
                        factor;
                }
            }

            return out;
        }

        toMonoWhole(
            buffer
        ) {
            if (
                buffer.numberOfChannels ===
                    1
            ) {
                return this.cloneAudioBuffer(
                    buffer
                );
            }

            const out =
                this.makeAudioBuffer(
                    1,
                    buffer.length,
                    buffer.sampleRate
                );

            const destination =
                out.getChannelData(
                    0
                );

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                const source =
                    buffer.getChannelData(
                        c
                    );

                for (
                    let i = 0;
                    i < buffer.length;
                    i++
                ) {
                    destination[i] +=
                        source[i] /
                        buffer.numberOfChannels;
                }
            }

            return out;
        }

        toMonoPreservingChannels(
            buffer
        ) {
            if (
                buffer.numberOfChannels ===
                    1
            ) {
                return this.cloneAudioBuffer(
                    buffer
                );
            }

            const out =
                this.makeAudioBuffer(
                    buffer.numberOfChannels,
                    buffer.length,
                    buffer.sampleRate
                );

            const channels =
                [];

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                channels.push(
                    buffer.getChannelData(
                        c
                    )
                );
            }

            for (
                let i = 0;
                i < buffer.length;
                i++
            ) {
                let sum = 0;

                for (
                    const channel of
                        channels
                ) {
                    sum +=
                        channel[i];
                }

                const average =
                    sum /
                    channels.length;

                for (
                    let c = 0;
                    c <
                    out.numberOfChannels;
                    c++
                ) {
                    out
                        .getChannelData(
                            c
                        )[i] =
                        average;
                }
            }

            return out;
        }

        addSilenceBuffer(
            buffer,
            seconds
        ) {
            const frames =
                Math.max(
                    1,
                    Math.floor(
                        seconds *
                            buffer.sampleRate
                    )
                );

            return this.makeAudioBuffer(
                buffer.numberOfChannels,
                frames,
                buffer.sampleRate
            );
        }

        changeSpeed(
            buffer,
            speed
        ) {
            speed =
                Math.max(
                    0.1,
                    Math.min(
                        4,
                        Number(
                            speed
                        ) || 1
                    )
                );

            const newLength =
                Math.max(
                    1,
                    Math.round(
                        buffer.length /
                            speed
                    )
                );

            const out =
                this.makeAudioBuffer(
                    buffer.numberOfChannels,
                    newLength,
                    buffer.sampleRate
                );

            for (
                let c = 0;
                c <
                buffer.numberOfChannels;
                c++
            ) {
                const source =
                    buffer.getChannelData(
                        c
                    );

                const destination =
                    out.getChannelData(
                        c
                    );

                for (
                    let i = 0;
                    i < newLength;
                    i++
                ) {
                    const position =
                        i * speed;

                    const a =
                        Math.min(
                            source.length -
                                1,
                            Math.floor(
                                position
                            )
                        );

                    const b =
                        Math.min(
                            source.length -
                                1,
                            a + 1
                        );

                    const fraction =
                        position -
                        a;

                    destination[i] =
                        source[a] *
                            (
                                1 -
                                fraction
                            ) +
                        source[b] *
                            fraction;
                }
            }

            return out;
        }

        applyToSelection(
            buffer,
            selection,
            transformer
        ) {
            if (!selection) {
                return transformer(
                    this.cloneAudioBuffer(
                        buffer
                    )
                );
            }

            const [
                start,
                end
            ] = selection;

            const before =
                this.extractAudioRange(
                    buffer,
                    0,
                    start
                );

            const selected =
                this.extractAudioRange(
                    buffer,
                    start,
                    end
                );

            const after =
                this.extractAudioRange(
                    buffer,
                    end,
                    buffer.duration
                );

            if (!selected) {
                return this.cloneAudioBuffer(
                    buffer
                );
            }

            const transformed =
                transformer(
                    selected
                );

            return this.concatAudioBuffers(
                [
                    before,
                    transformed,
                    after
                ],
                buffer.numberOfChannels,
                buffer.sampleRate
            );
        }

        trimToSelection(
            buffer,
            selection
        ) {
            if (!selection) {
                return this.cloneAudioBuffer(
                    buffer
                );
            }

            return (
                this.extractAudioRange(
                    buffer,
                    selection[0],
                    selection[1]
                ) ||
                this.cloneAudioBuffer(
                    buffer
                )
            );
        }

        deleteSelection(
            buffer,
            selection
        ) {
            if (!selection) {
                return this.makeAudioBuffer(
                    buffer.numberOfChannels,
                    Math.max(
                        1,
                        Math.floor(
                            buffer.sampleRate *
                                0.01
                        )
                    ),
                    buffer.sampleRate
                );
            }

            const before =
                this.extractAudioRange(
                    buffer,
                    0,
                    selection[0]
                );

            const after =
                this.extractAudioRange(
                    buffer,
                    selection[1],
                    buffer.duration
                );

            return this.concatAudioBuffers(
                [
                    before,
                    after
                ],
                buffer.numberOfChannels,
                buffer.sampleRate
            );
        }

        addSilenceBefore(
            buffer,
            selection
        ) {
            const silence =
                this.addSilenceBuffer(
                    buffer,
                    0.5
                );

            if (!selection) {
                return this.concatAudioBuffers(
                    [
                        silence,
                        buffer
                    ],
                    buffer.numberOfChannels,
                    buffer.sampleRate
                );
            }

            const before =
                this.extractAudioRange(
                    buffer,
                    0,
                    selection[0]
                );

            const selected =
                this.extractAudioRange(
                    buffer,
                    selection[0],
                    selection[1]
                );

            const after =
                this.extractAudioRange(
                    buffer,
                    selection[1],
                    buffer.duration
                );

            return this.concatAudioBuffers(
                [
                    before,
                    silence,
                    selected,
                    after
                ],
                buffer.numberOfChannels,
                buffer.sampleRate
            );
        }

        addSilenceAfter(
            buffer,
            selection
        ) {
            const silence =
                this.addSilenceBuffer(
                    buffer,
                    0.5
                );

            if (!selection) {
                return this.concatAudioBuffers(
                    [
                        buffer,
                        silence
                    ],
                    buffer.numberOfChannels,
                    buffer.sampleRate
                );
            }

            const before =
                this.extractAudioRange(
                    buffer,
                    0,
                    selection[0]
                );

            const selected =
                this.extractAudioRange(
                    buffer,
                    selection[0],
                    selection[1]
                );

            const after =
                this.extractAudioRange(
                    buffer,
                    selection[1],
                    buffer.duration
                );

            return this.concatAudioBuffers(
                [
                    before,
                    selected,
                    silence,
                    after
                ],
                buffer.numberOfChannels,
                buffer.sampleRate
            );
        }

        speedSelected(
            buffer,
            selection,
            speed
        ) {
            return this.applyToSelection(
                buffer,
                selection,
                part =>
                    this.changeSpeed(
                        part,
                        speed
                    )
            );
        }

        // =============================================================
        // WAV ENCODER
        // =============================================================

        audioBufferToWav(
            audioBuffer
        ) {
            const channelCount =
                audioBuffer.numberOfChannels;

            const sampleRate =
                audioBuffer.sampleRate;

            const frameCount =
                audioBuffer.length;

            const bytesPerSample =
                2;

            const blockAlign =
                channelCount *
                bytesPerSample;

            const dataSize =
                frameCount *
                blockAlign;

            const buffer =
                new ArrayBuffer(
                    44 +
                        dataSize
                );

            const view =
                new DataView(
                    buffer
                );

            let offset = 0;

            const writeString =
                value => {
                    for (
                        let i = 0;
                        i < value.length;
                        i++
                    ) {
                        view.setUint8(
                            offset++,
                            value.charCodeAt(
                                i
                            )
                        );
                    }
                };

            writeString(
                'RIFF'
            );

            view.setUint32(
                offset,
                36 +
                    dataSize,
                true
            );

            offset += 4;

            writeString(
                'WAVE'
            );

            writeString(
                'fmt '
            );

            view.setUint32(
                offset,
                16,
                true
            );

            offset += 4;

            view.setUint16(
                offset,
                1,
                true
            );

            offset += 2;

            view.setUint16(
                offset,
                channelCount,
                true
            );

            offset += 2;

            view.setUint32(
                offset,
                sampleRate,
                true
            );

            offset += 4;

            view.setUint32(
                offset,
                sampleRate *
                    blockAlign,
                true
            );

            offset += 4;

            view.setUint16(
                offset,
                blockAlign,
                true
            );

            offset += 2;

            view.setUint16(
                offset,
                16,
                true
            );

            offset += 2;

            writeString(
                'data'
            );

            view.setUint32(
                offset,
                dataSize,
                true
            );

            offset += 4;

            const channels =
                [];

            for (
                let c = 0;
                c <
                channelCount;
                c++
            ) {
                channels.push(
                    audioBuffer.getChannelData(
                        c
                    )
                );
            }

            for (
                let frame = 0;
                frame <
                frameCount;
                frame++
            ) {
                for (
                    let c = 0;
                    c <
                    channelCount;
                    c++
                ) {
                    let sample =
                        channels[c][
                            frame
                        ];

                    sample =
                        Math.max(
                            -1,
                            Math.min(
                                1,
                                sample
                            )
                        );

                    const pcm =
                        sample < 0
                            ? sample *
                                0x8000
                            : sample *
                                0x7FFF;

                    view.setInt16(
                        offset,
                        pcm,
                        true
                    );

                    offset += 2;
                }
            }

            return buffer;
        }

        // =============================================================
        // AUDIO EDITOR
        // =============================================================

        openEditor(
            args
        ) {
            this._openEditor(
                args.AUDIO_SAVED
            );
        }

        async _openEditor(
            name
        ) {
            const stored =
                await this.getSavedAudio(
                    name
                );

            if (!stored) {
                return;
            }

            this.closeEditor();

            try {
                const buffer =
                    await this.decodeArrayBuffer(
                        stored.data
                    );

                const original =
                    this.cloneAudioBuffer(
                        buffer
                    );

                this.editor =
                    this.createAudioEditor(
                        stored.name,
                        buffer,
                        original
                    );

                this.editor.refresh();
            } catch (error) {
                console.error(
                    '[Synthesizer Engine] Could not open audio editor:',
                    error
                );
            }
        }

        createAudioEditor(
            assetName,
            initialBuffer,
            original
        ) {
            const extension =
                this;

            let buffer =
                initialBuffer;

            let currentAssetName =
                assetName;

            const originalCopy =
                extension.cloneAudioBuffer(
                    original
                );

            const root =
                document.createElement(
                    'div'
                );

            root.style.cssText =
                'position:fixed;inset:0;z-index:2147483647;background:rgba(10,10,18,.76);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;';

            const panel =
                document.createElement(
                    'div'
                );

            panel.style.cssText =
                'width:min(1120px,94vw);height:min(820px,94vh);background:#171820;color:#fff;border:2px solid #7b3fe4;border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden;';

            root.appendChild(
                panel
            );

            // =========================================================
            // HEADER
            // =========================================================

            const header =
                document.createElement(
                    'div'
                );

            header.style.cssText =
                'display:flex;align-items:center;gap:12px;padding:12px 16px;background:#20222d;border-bottom:1px solid #343746;';

            const title =
                document.createElement(
                    'div'
                );

            title.textContent =
                'Synthesizer Engine — Audio Editor';

            title.style.cssText =
                'font-size:20px;font-weight:700;flex:1;';

            const close =
                this.editorButton(
                    '×',
                    '#5a314a'
                );

            close.onclick =
                () =>
                    this.closeEditor();

            header.append(
                title,
                close
            );

            panel.appendChild(
                header
            );

            // =========================================================
            // BODY
            // =========================================================

            const body =
                document.createElement(
                    'div'
                );

            body.style.cssText =
                'flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;';

            panel.appendChild(
                body
            );

            // =========================================================
            // NAME
            // =========================================================

            const nameRow =
                this.editorRow();

            const nameInput =
                document.createElement(
                    'input'
                );

            nameInput.value =
                currentAssetName;

            nameInput.style.cssText =
                this.editorInputCSS();

            nameRow.append(
                this.editorLabel(
                    'Asset name'
                ),

                nameInput
            );

            body.append(
                nameRow
            );

            // =========================================================
            // WAVEFORM
            // =========================================================

            const canvasWrap =
                document.createElement(
                    'div'
                );

            canvasWrap.style.cssText =
                'background:#0e0f15;border:1px solid #343746;border-radius:10px;padding:8px;';

            const canvas =
                document.createElement(
                    'canvas'
                );

            canvas.style.cssText =
                'width:100%;height:280px;display:block;cursor:crosshair;touch-action:none;';

            canvasWrap.appendChild(
                canvas
            );

            body.append(
                canvasWrap
            );

            // =========================================================
            // SELECTION INPUTS
            // =========================================================

            const timeRow =
                this.editorRow();

            const startInput =
                this.numberInput(
                    '0'
                );

            const endInput =
                this.numberInput(
                    '0'
                );

            timeRow.append(
                this.editorLabel(
                    'Selection start (s)'
                ),

                startInput,

                this.editorLabel(
                    'Selection end (s)'
                ),

                endInput
            );

            body.append(
                timeRow
            );

            // =========================================================
            // TRANSPORT
            // =========================================================

            const transport =
                document.createElement(
                    'div'
                );

            transport.style.cssText =
                'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';

            const play =
                this.editorButton(
                    'Play'
                );

            const playSelection =
                this.editorButton(
                    'Play Selection'
                );

            const stop =
                this.editorButton(
                    'Stop'
                );

            const unselect =
                this.editorButton(
                    'Unselect'
                );

            const volume =
                document.createElement(
                    'input'
                );

            volume.type =
                'range';

            volume.min =
                '0';

            volume.max =
                '1';

            volume.step =
                '0.01';

            volume.value =
                '1';

            volume.style.flex =
                '1';

            volume.style.minWidth =
                '160px';

            transport.append(
                play,
                playSelection,
                stop,
                unselect,

                this.editorLabel(
                    'Playback volume'
                ),

                volume
            );

            body.append(
                transport
            );

            // =========================================================
            // RANGE SLIDERS
            // =========================================================

            const rangeRow =
                document.createElement(
                    'div'
                );

            rangeRow.style.cssText =
                'display:flex;align-items:center;gap:9px;';

            const startRange =
                document.createElement(
                    'input'
                );

            startRange.type =
                'range';

            startRange.min =
                '0';

            startRange.step =
                '0.001';

            startRange.style.flex =
                '1';

            const endRange =
                document.createElement(
                    'input'
                );

            endRange.type =
                'range';

            endRange.min =
                '0';

            endRange.step =
                '0.001';

            endRange.style.flex =
                '1';

            rangeRow.append(
                this.editorLabel(
                    'Start'
                ),

                startRange,

                this.editorLabel(
                    'End'
                ),

                endRange
            );

            body.append(
                rangeRow
            );

            // =========================================================
            // STATUS
            // =========================================================

            const status =
                document.createElement(
                    'div'
                );

            status.style.cssText =
                'color:#bfc2ce;font-size:13px;';

            body.append(
                status
            );

            // =========================================================
            // STATE
            // =========================================================

            const state = {
                root,

                assetName:
                    currentAssetName,

                stop:
                    () => {},

                refresh:
                    () => {},

                selected:
                    false,

                source:
                    null,

                context:
                    null,

                gainNode:
                    null
            };

            // =========================================================
            // SELECTION
            // =========================================================

            const getSelection =
                () => {
                    if (
                        !state.selected
                    ) {
                        return null;
                    }

                    let s =
                        Number(
                            startRange.value
                        ) || 0;

                    let e =
                        Number(
                            endRange.value
                        ) || 0;

                    s =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                s
                            )
                        );

                    e =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                e
                            )
                        );

                    if (
                        e < s
                    ) {
                        [
                            s,
                            e
                        ] = [
                            e,
                            s
                        ];
                    }

                    if (
                        e <= s
                    ) {
                        return null;
                    }

                    return [
                        s,
                        e
                    ];
                };

            // =========================================================
            // WAVEFORM DRAWING
            // =========================================================

            const resizeCanvas =
                () => {
                    const rect =
                        canvas.getBoundingClientRect();

                    const ratio =
                        window.devicePixelRatio ||
                        1;

                    canvas.width =
                        Math.max(
                            1,
                            Math.floor(
                                rect.width *
                                    ratio
                            )
                        );

                    canvas.height =
                        Math.max(
                            1,
                            Math.floor(
                                rect.height *
                                    ratio
                            )
                        );
                };

            const drawWaveform =
                () => {
                    resizeCanvas();

                    const ctx =
                        canvas.getContext(
                            '2d'
                        );

                    const width =
                        canvas.width;

                    const height =
                        canvas.height;

                    ctx.clearRect(
                        0,
                        0,
                        width,
                        height
                    );

                    ctx.fillStyle =
                        '#0e0f15';

                    ctx.fillRect(
                        0,
                        0,
                        width,
                        height
                    );

                    if (
                        !buffer ||
                        buffer.length ===
                            0
                    ) {
                        return;
                    }

                    const data =
                        buffer.getChannelData(
                            0
                        );

                    ctx.strokeStyle =
                        '#49b86b';

                    ctx.lineWidth =
                        1;

                    ctx.beginPath();

                    for (
                        let x = 0;
                        x < width;
                        x++
                    ) {
                        const from =
                            Math.floor(
                                x /
                                    width *
                                    data.length
                            );

                        const to =
                            Math.min(
                                data.length,
                                from +
                                    Math.max(
                                        1,
                                        Math.floor(
                                            data.length /
                                                width
                                        )
                                    )
                            );

                        let min =
                            1;

                        let max =
                            -1;

                        for (
                            let i = from;
                            i < to;
                            i++
                        ) {
                            min =
                                Math.min(
                                    min,
                                    data[i]
                                );

                            max =
                                Math.max(
                                    max,
                                    data[i]
                                );
                        }

                        const y1 =
                            height / 2 -
                            max *
                                height *
                                0.42;

                        const y2 =
                            height / 2 -
                            min *
                                height *
                                0.42;

                        if (
                            x ===
                            0
                        ) {
                            ctx.moveTo(
                                x,
                                y1
                            );
                        } else {
                            ctx.lineTo(
                                x,
                                y1
                            );
                        }

                        ctx.lineTo(
                            x,
                            y2
                        );
                    }

                    ctx.stroke();

                    ctx.strokeStyle =
                        '#444756';

                    ctx.beginPath();

                    ctx.moveTo(
                        0,
                        height / 2
                    );

                    ctx.lineTo(
                        width,
                        height / 2
                    );

                    ctx.stroke();

                    const selection =
                        getSelection();

                    if (
                        selection
                    ) {
                        const sx =
                            (
                                selection[0] /
                                buffer.duration
                            ) *
                            width;

                        const ex =
                            (
                                selection[1] /
                                buffer.duration
                            ) *
                            width;

                        ctx.fillStyle =
                            'rgba(123,63,228,.25)';

                        ctx.fillRect(
                            sx,
                            0,
                            Math.max(
                                0,
                                ex -
                                    sx
                            ),
                            height
                        );

                        ctx.strokeStyle =
                            '#7b3fe4';

                        ctx.lineWidth =
                            2;

                        ctx.beginPath();

                        ctx.moveTo(
                            sx,
                            0
                        );

                        ctx.lineTo(
                            sx,
                            height
                        );

                        ctx.moveTo(
                            ex,
                            0
                        );

                        ctx.lineTo(
                            ex,
                            height
                        );

                        ctx.stroke();
                    }
                };

            // =========================================================
            // SYNC
            // =========================================================

            const syncUI =
                () => {
                    startRange.max =
                        String(
                            Math.max(
                                0.001,
                                buffer.duration
                            )
                        );

                    endRange.max =
                        String(
                            Math.max(
                                0.001,
                                buffer.duration
                            )
                        );

                    const selection =
                        getSelection();

                    if (
                        selection
                    ) {
                        startRange.value =
                            String(
                                selection[0]
                            );

                        endRange.value =
                            String(
                                selection[1]
                            );

                        startInput.value =
                            selection[0].toFixed(
                                3
                            );

                        endInput.value =
                            selection[1].toFixed(
                                3
                            );

                        status.textContent =
                            `${buffer.duration.toFixed(
                                3
                            )} s · ${buffer.numberOfChannels} ch · ${buffer.sampleRate} Hz · Selected ${selection[0].toFixed(
                                3
                            )}–${selection[1].toFixed(
                                3
                            )} s`;
                    } else {
                        startInput.value =
                            '0';

                        endInput.value =
                            '0';

                        startRange.value =
                            '0';

                        endRange.value =
                            '0';

                        status.textContent =
                            `${buffer.duration.toFixed(
                                3
                            )} s · ${buffer.numberOfChannels} ch · ${buffer.sampleRate} Hz · No selection — edits affect entire audio`;
                    }

                    drawWaveform();
                };

            // =========================================================
            // PLAYBACK
            // =========================================================

            const stopPlayback =
                () => {
                    if (
                        state.source
                    ) {
                        try {
                            state.source.onended =
                                null;
                        } catch (e) {}

                        try {
                            state.source.stop(
                                0
                            );
                        } catch (e) {}
                    }

                    state.source =
                        null;

                    if (
                        state.context
                    ) {
                        try {
                            state.context.close();
                        } catch (e) {}
                    }

                    state.context =
                        null;

                    state.gainNode =
                        null;
                };

            const playAudio =
                useSelection => {
                    stopPlayback();

                    const Context =
                        extension.getAudioContextClass();

                    if (!Context) {
                        return;
                    }

                    const context =
                        new Context();

                    const source =
                        context.createBufferSource();

                    const gain =
                        context.createGain();

                    source.buffer =
                        buffer;

                    gain.gain.value =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                Number(
                                    volume.value
                                ) || 1
                            )
                        );

                    source
                        .connect(
                            gain
                        )
                        .connect(
                            context.destination
                        );

                    const selection =
                        getSelection();

                    const offset =
                        useSelection &&
                        selection
                            ? selection[0]
                            : 0;

                    const duration =
                        useSelection &&
                        selection
                            ? Math.max(
                                0.001,
                                selection[1] -
                                    selection[0]
                            )
                            : Math.max(
                                0.001,
                                buffer.duration
                            );

                    state.source =
                        source;

                    state.context =
                        context;

                    state.gainNode =
                        gain;

                    source.onended =
                        () => {
                            if (
                                state.source !==
                                source
                            ) {
                                return;
                            }

                            state.source =
                                null;

                            state.context =
                                null;

                            state.gainNode =
                                null;

                            try {
                                context.close();
                            } catch (e) {}
                        };

                    try {
                        source.start(
                            0,
                            offset,
                            duration
                        );
                    } catch (error) {
                        stopPlayback();

                        console.error(
                            '[Synthesizer Engine] Playback failed:',
                            error
                        );
                    }
                };

            play.onclick =
                () => {
                    playAudio(
                        false
                    );
                };

            playSelection.onclick =
                () => {
                    playAudio(
                        true
                    );
                };

            stop.onclick =
                () => {
                    stopPlayback();
                };

            volume.oninput =
                () => {
                    if (
                        state.gainNode
                    ) {
                        state.gainNode.gain.value =
                            Math.max(
                                0,
                                Math.min(
                                    1,
                                    Number(
                                        volume.value
                                    ) || 1
                                )
                            );
                    }
                };

            state.stop =
                stopPlayback;

            // =========================================================
            // UNSELECT
            // =========================================================

            unselect.onclick =
                () => {
                    stopPlayback();

                    state.selected =
                        false;

                    syncUI();
                };

            // =========================================================
            // RANGE SELECTION
            // =========================================================

            startRange.oninput =
                () => {
                    let s =
                        Number(
                            startRange.value
                        ) || 0;

                    let e =
                        Number(
                            endRange.value
                        ) || 0;

                    if (
                        s > e
                    ) {
                        [
                            s,
                            e
                        ] = [
                            e,
                            s
                        ];
                    }

                    state.selected =
                        s !== e;

                    startRange.value =
                        String(
                            s
                        );

                    endRange.value =
                        String(
                            e
                        );

                    syncUI();
                };

            endRange.oninput =
                () => {
                    let s =
                        Number(
                            startRange.value
                        ) || 0;

                    let e =
                        Number(
                            endRange.value
                        ) || 0;

                    if (
                        e < s
                    ) {
                        [
                            s,
                            e
                        ] = [
                            e,
                            s
                        ];
                    }

                    state.selected =
                        s !== e;

                    startRange.value =
                        String(
                            s
                        );

                    endRange.value =
                        String(
                            e
                        );

                    syncUI();
                };

            startInput.onchange =
                () => {
                    let s =
                        Number(
                            startInput.value
                        ) || 0;

                    let e =
                        Number(
                            endInput.value
                        ) || 0;

                    s =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                s
                            )
                        );

                    e =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                e
                            )
                        );

                    if (
                        e > s
                    ) {
                        state.selected =
                            true;

                        startRange.value =
                            String(
                                s
                            );

                        endRange.value =
                            String(
                                e
                            );
                    } else {
                        state.selected =
                            false;
                    }

                    syncUI();
                };

            endInput.onchange =
                () => {
                    let s =
                        Number(
                            startInput.value
                        ) || 0;

                    let e =
                        Number(
                            endInput.value
                        ) || 0;

                    s =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                s
                            )
                        );

                    e =
                        Math.max(
                            0,
                            Math.min(
                                buffer.duration,
                                e
                            )
                        );

                    if (
                        e > s
                    ) {
                        state.selected =
                            true;

                        startRange.value =
                            String(
                                s
                            );

                        endRange.value =
                            String(
                                e
                            );
                    } else {
                        state.selected =
                            false;
                    }

                    syncUI();
                };

            // =========================================================
            // CANVAS SELECTION
            // =========================================================

            const canvasTime =
                event => {
                    const rect =
                        canvas.getBoundingClientRect();

                    const x =
                        Math.max(
                            0,
                            Math.min(
                                rect.width,
                                event.clientX -
                                    rect.left
                            )
                        );

                    return (
                        x /
                        rect.width *
                        buffer.duration
                    );
                };

            let dragging =
                false;

            let dragStart =
                0;

            canvas.addEventListener(
                'pointerdown',
                event => {
                    dragging =
                        true;

                    dragStart =
                        canvasTime(
                            event
                        );

                    state.selected =
                        true;

                    startRange.value =
                        String(
                            dragStart
                        );

                    endRange.value =
                        String(
                            dragStart
                        );

                    canvas.setPointerCapture(
                        event.pointerId
                    );

                    syncUI();
                }
            );

            canvas.addEventListener(
                'pointermove',
                event => {
                    if (
                        !dragging
                    ) {
                        return;
                    }

                    const now =
                        canvasTime(
                            event
                        );

                    const s =
                        Math.min(
                            dragStart,
                            now
                        );

                    const e =
                        Math.max(
                            dragStart,
                            now
                        );

                    state.selected =
                        e -
                            s >
                        0.0005;

                    startRange.value =
                        String(
                            s
                        );

                    endRange.value =
                        String(
                            e
                        );

                    syncUI();
                }
            );

            canvas.addEventListener(
                'pointerup',
                event => {
                    dragging =
                        false;

                    try {
                        canvas.releasePointerCapture(
                            event.pointerId
                        );
                    } catch (e) {}

                    syncUI();
                }
            );

            // =========================================================
            // EDIT BUTTON FACTORY
            // =========================================================

            const editButton =
                (
                    label,
                    operation,
                    structural
                ) => {
                    const button =
                        extension.editorButton(
                            label
                        );

                    button.onclick =
                        () => {
                            try {
                                stopPlayback();

                                const selection =
                                    getSelection();

                                buffer =
                                    operation(
                                        buffer,
                                        selection
                                    );

                                if (
                                    structural
                                ) {
                                    state.selected =
                                        false;
                                }

                                syncUI();
                            } catch (error) {
                                console.error(
                                    '[Synthesizer Engine] Edit failed:',
                                    error
                                );

                                status.textContent =
                                    'Edit failed: ' +
                                    error.message;
                            }
                        };

                    return button;
                };

            // =========================================================
            // SELECTION
            // =========================================================

            const selectionSection =
                this.editorSection(
                    'Selection'
                );

            selectionSection.append(
                editButton(
                    'Trim to selection',

                    (
                        audio,
                        selection
                    ) =>
                        extension.trimToSelection(
                            audio,
                            selection
                        ),

                    true
                ),

                editButton(
                    'Delete selection',

                    (
                        audio,
                        selection
                    ) =>
                        extension.deleteSelection(
                            audio,
                            selection
                        ),

                    true
                )
            );

            body.append(
                selectionSection
            );

            // =========================================================
            // PROCESSING
            // =========================================================

            const processingSection =
                this.editorSection(
                    'Processing'
                );

            processingSection.append(
                editButton(
                    'Normalize',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.normalizeBuffer(
                                    part
                                )
                        )
                ),

                editButton(
                    'Gain +3 dB',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.applyGain(
                                    part,
                                    Math.pow(
                                        10,
                                        3 /
                                            20
                                    )
                                )
                        )
                ),

                editButton(
                    'Gain -3 dB',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.applyGain(
                                    part,
                                    Math.pow(
                                        10,
                                        -3 /
                                            20
                                    )
                                )
                        )
                ),

                editButton(
                    'Reverse',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.reverseBuffer(
                                    part
                                )
                        )
                ),

                editButton(
                    'Fade in 1 s',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.fadeBuffer(
                                    part,
                                    1,
                                    true
                                )
                        )
                ),

                editButton(
                    'Fade out 1 s',

                    (
                        audio,
                        selection
                    ) =>
                        extension.applyToSelection(
                            audio,
                            selection,
                            part =>
                                extension.fadeBuffer(
                                    part,
                                    1,
                                    false
                                )
                        )
                ),

                editButton(
                    'Mono',

                    (
                        audio,
                        selection
                    ) =>
                        selection
                            ? extension.applyToSelection(
                                audio,
                                selection,
                                part =>
                                    extension.toMonoPreservingChannels(
                                        part
                                    )
                            )
                            : extension.toMonoWhole(
                                audio
                            )
                ),

                editButton(
                    'Add 0.5 s before',

                    (
                        audio,
                        selection
                    ) =>
                        extension.addSilenceBefore(
                            audio,
                            selection
                        ),

                    true
                ),

                editButton(
                    'Add 0.5 s after',

                    (
                        audio,
                        selection
                    ) =>
                        extension.addSilenceAfter(
                            audio,
                            selection
                        ),

                    true
                )
            );

            body.append(
                processingSection
            );

            // =========================================================
            // SPEED / PITCH
            // =========================================================

            const speedSection =
                this.editorSection(
                    'Speed / Pitch'
                );

            speedSection.append(
                editButton(
                    '0.5×',

                    (
                        audio,
                        selection
                    ) =>
                        extension.speedSelected(
                            audio,
                            selection,
                            0.5
                        ),

                    true
                ),

                editButton(
                    '0.75×',

                    (
                        audio,
                        selection
                    ) =>
                        extension.speedSelected(
                            audio,
                            selection,
                            0.75
                        ),

                    true
                ),

                editButton(
                    '1×',

                    audio =>
                        extension.cloneAudioBuffer(
                            audio
                        )
                ),

                editButton(
                    '1.25×',

                    (
                        audio,
                        selection
                    ) =>
                        extension.speedSelected(
                            audio,
                            selection,
                            1.25
                        ),

                    true
                ),

                editButton(
                    '1.5×',

                    (
                        audio,
                        selection
                    ) =>
                        extension.speedSelected(
                            audio,
                            selection,
                            1.5
                        ),

                    true
                ),

                editButton(
                    '2×',

                    (
                        audio,
                        selection
                    ) =>
                        extension.speedSelected(
                            audio,
                            selection,
                            2
                        ),

                    true
                )
            );

            body.append(
                speedSection
            );

            // =========================================================
            // FOOTER
            // =========================================================

            const footer =
                document.createElement(
                    'div'
                );

            footer.style.cssText =
                'display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;background:#20222d;border-top:1px solid #343746;';

            const save =
                this.editorButton(
                    'Save to Extension',
                    '#49b86b'
                );

            const exportDevice =
                this.editorButton(
                    'Export WAV to Device'
                );

            const reset =
                this.editorButton(
                    'Reset'
                );

            footer.append(
                save,
                exportDevice,
                reset
            );

            panel.appendChild(
                footer
            );

            // =========================================================
            // SAVE
            // =========================================================

            save.onclick =
                async () => {
                    try {
                        stopPlayback();

                        const newName =
                            extension.normalizeName(
                                nameInput.value,
                                currentAssetName
                            );

                        const wav =
                            extension.audioBufferToWav(
                                buffer
                            );

                        if (
                            newName !==
                            currentAssetName
                        ) {
                            extension.audioLibrary.delete(
                                currentAssetName
                            );

                            try {
                                await extension.deleteAudioStorage(
                                    currentAssetName
                                );
                            } catch (e) {}
                        }

                        await extension.saveAudio(
                            newName,
                            wav,
                            'audio/wav',
                            'wav'
                        );

                        currentAssetName =
                            newName;

                        state.assetName =
                            newName;

                        status.textContent =
                            `Saved to extension as "${newName}"`;
                    } catch (error) {
                        status.textContent =
                            'Save failed: ' +
                            error.message;
                    }
                };

            // =========================================================
            // EXPORT WAV
            // =========================================================

            exportDevice.onclick =
                () => {
                    try {
                        stopPlayback();

                        const filename =
                            extension.removeExtension(
                                extension.normalizeName(
                                    nameInput.value,
                                    currentAssetName
                                )
                            ) +
                            '.wav';

                        extension.downloadBlob(
                            new Blob(
                                [
                                    extension.audioBufferToWav(
                                        buffer
                                    )
                                ],
                                {
                                    type:
                                        'audio/wav'
                                }
                            ),
                            filename
                        );

                        status.textContent =
                            'WAV exported to device';
                    } catch (error) {
                        status.textContent =
                            'Export failed: ' +
                            error.message;
                    }
                };

            // =========================================================
            // RESET
            // =========================================================

            reset.onclick =
                () => {
                    stopPlayback();

                    buffer =
                        extension.cloneAudioBuffer(
                            originalCopy
                        );

                    state.selected =
                        false;

                    syncUI();

                    status.textContent =
                        'Reset to original';
                };

            // =========================================================
            // ESCAPE
            // =========================================================

            root.tabIndex =
                -1;

            root.addEventListener(
                'keydown',
                event => {
                    if (
                        event.key ===
                        'Escape'
                    ) {
                        extension.closeEditor();
                    }
                }
            );

            document.body.appendChild(
                root
            );

            window.addEventListener(
                'resize',
                drawWaveform
            );

            state.refresh =
                syncUI;

            return state;
        }

        closeEditor() {
            if (!this.editor) {
                return;
            }

            try {
                this.editor.stop();
            } catch (e) {}

            try {
                this.editor.root.remove();
            } catch (e) {}

            this.editor =
                null;
        }

        // =============================================================
        // WAVETONE CREATION
        // =============================================================

        createDefaultWavetone() {
            const samples =
                new Float32Array(
                    WAVETONE_SAMPLES
                );

            for (
                let i = 0;
                i < samples.length;
                i++
            ) {
                samples[i] =
                    Math.sin(
                        2 *
                            Math.PI *
                            i /
                            samples.length
                    );
            }

            return samples;
        }

        createNewWavetone(
            args
        ) {
            const name =
                this.normalizeName(
                    args.NAME,
                    'New Wavetone'
                );

            this.saveWavetone(
                name,
                this.createDefaultWavetone()
            );
        }

        // =============================================================
        // WAVETONE RENDERING
        // =============================================================

        wavetoneToAudioBuffer(
            wavetone,
            seconds,
            sampleRate
        ) {
            const outputLength =
                Math.max(
                    1,
                    Math.floor(
                        seconds *
                            sampleRate
                    )
                );

            const audio =
                this.makeAudioBuffer(
                    1,
                    outputLength,
                    sampleRate
                );

            const output =
                audio.getChannelData(
                    0
                );

            const samples =
                wavetone.samples;

            for (
                let i = 0;
                i < output.length;
                i++
            ) {
                const phase =
                    (
                        i *
                        WAVETONE_EXPORT_FREQUENCY
                    ) /
                    sampleRate;

                const position =
                    (
                        phase *
                        samples.length
                    ) %
                    samples.length;

                const a =
                    Math.floor(
                        position
                    );

                const b =
                    (
                        a + 1
                    ) %
                    samples.length;

                const fraction =
                    position -
                    a;

                output[i] =
                    samples[a] *
                        (
                            1 -
                            fraction
                        ) +
                    samples[b] *
                        fraction;
            }

            return audio;
        }

        // =============================================================
        // WAVETONE DEVICE EXPORT
        // =============================================================

        async exportWavetoneToDevice(
            args
        ) {
            const wavetone =
                await this.getSavedWavetone(
                    args.WAVETONE_SAVED
                );

            if (!wavetone) {
                return;
            }

            const audio =
                this.wavetoneToAudioBuffer(
                    wavetone,
                    WAVETONE_EXPORT_SECONDS,
                    WAVETONE_EXPORT_SAMPLE_RATE
                );

            const wav =
                this.audioBufferToWav(
                    audio
                );

            this.downloadBlob(
                new Blob(
                    [
                        wav
                    ],
                    {
                        type:
                            'audio/wav'
                    }
                ),
                this.removeExtension(
                    wavetone.name
                ) +
                    '.wav'
            );
        }

        // =============================================================
        // WAVETONE AUDIO TAB EXPORT
        // =============================================================

        async exportWavetoneToAudioTab(
            args,
            util
        ) {
            const wavetone =
                await this.getSavedWavetone(
                    args.WAVETONE_SAVED
                );

            if (!wavetone) {
                return;
            }

            const target =
                this.getCurrentTarget(
                    util
                );

            if (
                !target ||
                !target.sprite
            ) {
                return;
            }

            const runtime =
                this.runtime ||
                target.runtime;

            if (
                !runtime ||
                !runtime.storage
            ) {
                return;
            }

            try {
                const audio =
                    this.wavetoneToAudioBuffer(
                        wavetone,
                        WAVETONE_EXPORT_SECONDS,
                        WAVETONE_EXPORT_SAMPLE_RATE
                    );

                const wav =
                    this.audioBufferToWav(
                        audio
                    );

                const storage =
                    runtime.storage;

                const assetId =
                    storage.cache(
                        storage.AssetType.Sound,
                        'wav',
                        this.arrayBufferToUint8Array(
                            wav
                        )
                    );

                const asset =
                    storage.get(
                        assetId
                    );

                if (!asset) {
                    throw new Error(
                        'Could not create Wavetone audio asset.'
                    );
                }

                const sound = {
                    name:
                        wavetone.name,

                    assetId:
                        asset.assetId,

                    md5:
                        `${asset.assetId}.wav`,

                    dataFormat:
                        'wav',

                    asset,

                    data:
                        asset.data,

                    rate:
                        WAVETONE_EXPORT_SAMPLE_RATE,

                    sampleCount:
                        audio.length
                };

                if (
                    runtime.audioEngine
                ) {
                    const player =
                        await runtime.audioEngine
                            .decodeSoundPlayer(
                                {
                                    ...sound,

                                    data:
                                        asset.data
                                }
                            );

                    sound.soundId =
                        player.id;

                    if (
                        target.sprite
                            .soundBank
                    ) {
                        target.sprite
                            .soundBank
                            .addSoundPlayer(
                                player
                            );
                    }
                }

                if (
                    typeof target.addSound ===
                    'function'
                ) {
                    target.addSound(
                        sound
                    );
                } else {
                    if (
                        !Array.isArray(
                            target.sprite.sounds
                        )
                    ) {
                        target.sprite.sounds =
                            [];
                    }

                    target.sprite.sounds.push(
                        sound
                    );
                }

                if (
                    typeof runtime.requestTargetsUpdate ===
                    'function'
                ) {
                    runtime.requestTargetsUpdate(
                        target
                    );
                }

                if (
                    typeof runtime.requestRedraw ===
                    'function'
                ) {
                    runtime.requestRedraw();
                }
            } catch (error) {
                console.error(
                    '[Synthesizer Engine] Wavetone Audio Tab export failed:',
                    error
                );
            }
        }

        // =============================================================
        // WAVETONE DELETE
        // =============================================================

        async deleteWavetone(
            args
        ) {
            const name =
                String(
                    args.WAVETONE_SAVED ||
                        ''
                );

            if (!name) {
                return;
            }

            this.wavetoneLibrary.delete(
                name
            );

            try {
                await this.deleteWavetoneStorage(
                    name
                );
            } catch (error) {
                console.warn(
                    '[Synthesizer Engine] Wavetone deletion failed:',
                    error
                );
            }

            if (
                this.wavetoneEditor &&
                this.wavetoneEditor.assetName ===
                    name
            ) {
                this.closeWavetoneEditor();
            }
        }

        // =============================================================
        // WAVETONE EDITOR
        // =============================================================

        openWavetoneEditor(
            args
        ) {
            this._openWavetoneEditor(
                args.WAVETONE_SAVED
            );
        }

        async _openWavetoneEditor(
            name
        ) {
            const stored =
                await this.getSavedWavetone(
                    name
                );

            if (!stored) {
                return;
            }

            this.closeWavetoneEditor();

            this.wavetoneEditor =
                this.createWavetoneEditor(
                    stored
                );

            this.wavetoneEditor.refresh();
        }

        createWavetoneEditor(
            stored
        ) {
            const extension =
                this;

            let samples =
                new Float32Array(
                    stored.samples
                );

            const original =
                new Float32Array(
                    samples
                );

            let assetName =
                stored.name;

            const root =
                document.createElement(
                    'div'
                );

            root.style.cssText =
                'position:fixed;inset:0;z-index:2147483647;background:rgba(10,10,18,.76);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;';

            const panel =
                document.createElement(
                    'div'
                );

            panel.style.cssText =
                'width:min(1050px,94vw);height:min(720px,92vh);background:#171820;color:#fff;border:2px solid #7b3fe4;border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden;';

            root.appendChild(
                panel
            );

            // =========================================================
            // HEADER
            // =========================================================

            const header =
                document.createElement(
                    'div'
                );

            header.style.cssText =
                'display:flex;align-items:center;gap:10px;padding:12px 16px;background:#20222d;border-bottom:1px solid #343746;';

            const heading =
                document.createElement(
                    'div'
                );

            heading.textContent =
                'Synthesizer Engine — Wavetone Editor';

            heading.style.cssText =
                'font-size:20px;font-weight:700;flex:1;';

            const close =
                this.editorButton(
                    '×',
                    '#5a314a'
                );

            close.onclick =
                () =>
                    this.closeWavetoneEditor();

            header.append(
                heading,
                close
            );

            panel.appendChild(
                header
            );

            // =========================================================
            // BODY
            // =========================================================

            const body =
                document.createElement(
                    'div'
                );

            body.style.cssText =
                'flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;';

            panel.appendChild(
                body
            );

            // =========================================================
            // NAME
            // =========================================================

            const nameRow =
                this.editorRow();

            const nameInput =
                document.createElement(
                    'input'
                );

            nameInput.value =
                assetName;

            nameInput.style.cssText =
                this.editorInputCSS();

            nameRow.append(
                this.editorLabel(
                    'Wavetone name'
                ),

                nameInput
            );

            body.append(
                nameRow
            );

            // =========================================================
            // WAVEFORM CANVAS
            // =========================================================

            const canvas =
                document.createElement(
                    'canvas'
                );

            canvas.style.cssText =
                'width:100%;height:300px;background:#0e0f15;border:1px solid #343746;border-radius:10px;display:block;cursor:crosshair;touch-action:none;';

            body.append(
                canvas
            );

            const info =
                document.createElement(
                    'div'
                );

            info.textContent =
                'Draw directly on the waveform. Left/right = waveform phase. Vertical position = amplitude.';

            info.style.cssText =
                'color:#bfc2ce;font-size:13px;';

            body.append(
                info
            );

            // =========================================================
            // PRESETS
            // =========================================================

            const presets =
                this.editorSection(
                    'Waveforms'
                );

            const presetList = [
                [
                    'Sine',
                    phase =>
                        Math.sin(
                            2 *
                                Math.PI *
                                phase
                        )
                ],

                [
                    'Triangle',
                    phase =>
                        1 -
                        4 *
                            Math.abs(
                                Math.round(
                                    phase
                                ) -
                                    phase
                            )
                ],

                [
                    'Square',
                    phase =>
                        phase < 0.5
                            ? 1
                            : -1
                ],

                [
                    'Saw',
                    phase =>
                        2 *
                            phase -
                        1
                ],

                [
                    'Reverse Saw',
                    phase =>
                        1 -
                        2 *
                            phase
                ],

                [
                    'Noise',
                    () =>
                        Math.random() *
                            2 -
                        1
                ],

                [
                    'Silence',
                    () =>
                        0
                ]
            ];

            for (
                const [
                    label,
                    generator
                ] of presetList
            ) {
                const button =
                    this.editorButton(
                        label
                    );

                button.onclick =
                    () => {
                        for (
                            let i = 0;
                            i <
                            samples.length;
                            i++
                        ) {
                            samples[i] =
                                Math.max(
                                    -1,
                                    Math.min(
                                        1,
                                        generator(
                                            i /
                                                samples.length
                                        )
                                    )
                                );
                        }

                        draw();
                    };

                presets.append(
                    button
                );
            }

            body.append(
                presets
            );

            // =========================================================
            // PROCESSING
            // =========================================================

            const processing =
                this.editorSection(
                    'Processing'
                );

            const invert =
                this.editorButton(
                    'Invert'
                );

            invert.onclick =
                () => {
                    for (
                        let i = 0;
                        i < samples.length;
                        i++
                    ) {
                        samples[i] *=
                            -1;
                    }

                    draw();
                };

            const normalize =
                this.editorButton(
                    'Normalize'
                );

            normalize.onclick =
                () => {
                    let peak =
                        0;

                    for (
                        const sample of
                            samples
                    ) {
                        peak =
                            Math.max(
                                peak,
                                Math.abs(
                                    sample
                                )
                            );
                    }

                    if (
                        peak <= 0
                    ) {
                        return;
                    }

                    for (
                        let i = 0;
                        i < samples.length;
                        i++
                    ) {
                        samples[i] /=
                            peak;
                    }

                    draw();
                };

            const smooth =
                this.editorButton(
                    'Smooth'
                );

            smooth.onclick =
                () => {
                    const output =
                        new Float32Array(
                            samples.length
                        );

                    for (
                        let i = 0;
                        i < samples.length;
                        i++
                    ) {
                        const a =
                            samples[
                                (
                                    i -
                                    1 +
                                    samples.length
                                ) %
                                    samples.length
                            ];

                        const b =
                            samples[i];

                        const c =
                            samples[
                                (
                                    i + 1
                                ) %
                                    samples.length
                            ];

                        output[i] =
                            (
                                a +
                                b * 2 +
                                c
                            ) /
                            4;
                    }

                    samples =
                        output;

                    draw();
                };

            processing.append(
                invert,
                normalize,
                smooth
            );

            body.append(
                processing
            );

            // =========================================================
            // PLAYBACK
            // =========================================================

            const playback =
                this.editorSection(
                    'Playback'
                );

            const play =
                this.editorButton(
                    'Play'
                );

            const stop =
                this.editorButton(
                    'Stop'
                );

            const frequency =
                this.numberInput(
                    '440'
                );

            frequency.min =
                '1';

            frequency.max =
                '20000';

            frequency.step =
                '1';

            playback.append(
                play,
                stop,

                this.editorLabel(
                    'Frequency (Hz)'
                ),

                frequency
            );

            body.append(
                playback
            );

            let audioContext =
                null;

            let oscillator =
                null;

            const stopTone =
                () => {
                    if (
                        oscillator
                    ) {
                        try {
                            oscillator.onended =
                                null;
                        } catch (e) {}

                        try {
                            oscillator.stop(
                                0
                            );
                        } catch (e) {}

                        oscillator =
                            null;
                    }

                    if (
                        audioContext
                    ) {
                        try {
                            audioContext.close();
                        } catch (e) {}

                        audioContext =
                            null;
                    }
                };

            const buildPeriodicWave =
                context => {
                    const harmonics =
                        Math.min(
                            64,
                            Math.floor(
                                samples.length /
                                    2
                            )
                        );

                    const real =
                        new Float32Array(
                            harmonics + 1
                        );

                    const imag =
                        new Float32Array(
                            harmonics + 1
                        );

                    for (
                        let k = 1;
                        k <= harmonics;
                        k++
                    ) {
                        let re = 0;
                        let im = 0;

                        for (
                            let n = 0;
                            n <
                            samples.length;
                            n++
                        ) {
                            const angle =
                                2 *
                                Math.PI *
                                k *
                                n /
                                samples.length;

                            re +=
                                samples[n] *
                                Math.cos(
                                    angle
                                );

                            im -=
                                samples[n] *
                                Math.sin(
                                    angle
                                );
                        }

                        real[k] =
                            2 *
                            re /
                            samples.length;

                        imag[k] =
                            2 *
                            im /
                            samples.length;
                    }

                    return context.createPeriodicWave(
                        real,
                        imag
                    );
                };

            play.onclick =
                () => {
                    stopTone();

                    const Context =
                        extension.getAudioContextClass();

                    if (!Context) {
                        return;
                    }

                    audioContext =
                        new Context();

                    oscillator =
                        audioContext.createOscillator();

                    oscillator.setPeriodicWave(
                        buildPeriodicWave(
                            audioContext
                        )
                    );

                    oscillator.frequency.value =
                        Math.max(
                            1,
                            Math.min(
                                20000,
                                Number(
                                    frequency.value
                                ) ||
                                    440
                            )
                        );

                    oscillator.connect(
                        audioContext.destination
                    );

                    oscillator.start();
                };

            stop.onclick =
                () => {
                    stopTone();
                };

            // =========================================================
            // WAVETONE DRAWING
            // =========================================================

            const resize =
                () => {
                    const rect =
                        canvas.getBoundingClientRect();

                    const ratio =
                        window.devicePixelRatio ||
                        1;

                    canvas.width =
                        Math.max(
                            1,
                            Math.floor(
                                rect.width *
                                    ratio
                            )
                        );

                    canvas.height =
                        Math.max(
                            1,
                            Math.floor(
                                rect.height *
                                    ratio
                            )
                        );
                };

            const draw =
                () => {
                    resize();

                    const ctx =
                        canvas.getContext(
                            '2d'
                        );

                    const width =
                        canvas.width;

                    const height =
                        canvas.height;

                    ctx.clearRect(
                        0,
                        0,
                        width,
                        height
                    );

                    ctx.fillStyle =
                        '#0e0f15';

                    ctx.fillRect(
                        0,
                        0,
                        width,
                        height
                    );

                    ctx.strokeStyle =
                        '#444756';

                    ctx.beginPath();

                    ctx.moveTo(
                        0,
                        height / 2
                    );

                    ctx.lineTo(
                        width,
                        height / 2
                    );

                    ctx.stroke();

                    ctx.strokeStyle =
                        '#49b86b';

                    ctx.lineWidth =
                        2;

                    ctx.beginPath();

                    for (
                        let x = 0;
                        x < width;
                        x++
                    ) {
                        const index =
                            Math.min(
                                samples.length -
                                    1,
                                Math.floor(
                                    x /
                                        width *
                                        samples.length
                                )
                            );

                        const y =
                            height / 2 -
                            samples[index] *
                                height *
                                0.43;

                        if (
                            x ===
                            0
                        ) {
                            ctx.moveTo(
                                x,
                                y
                            );
                        } else {
                            ctx.lineTo(
                                x,
                                y
                            );
                        }
                    }

                    ctx.stroke();

                    ctx.strokeStyle =
                        '#7b3fe4';

                    ctx.lineWidth =
                        1;

                    ctx.beginPath();

                    ctx.moveTo(
                        0,
                        0
                    );

                    ctx.lineTo(
                        0,
                        height
                    );

                    ctx.moveTo(
                        width - 1,
                        0
                    );

                    ctx.lineTo(
                        width - 1,
                        height
                    );

                    ctx.stroke();
                };

            let drawing =
                false;

            const drawAt =
                event => {
                    const rect =
                        canvas.getBoundingClientRect();

                    const x =
                        Math.max(
                            0,
                            Math.min(
                                rect.width,
                                event.clientX -
                                    rect.left
                            )
                        );

                    const y =
                        Math.max(
                            0,
                            Math.min(
                                rect.height,
                                event.clientY -
                                    rect.top
                            )
                        );

                    const index =
                        Math.min(
                            samples.length -
                                1,
                            Math.floor(
                                x /
                                    rect.width *
                                    samples.length
                            )
                        );

                    const amplitude =
                        -(
                            (
                                y /
                                rect.height
                            ) *
                            2 -
                            1
                        );

                    for (
                        let i =
                            index -
                            3;
                        i <=
                            index +
                                3;
                        i++
                    ) {
                        if (
                            i >= 0 &&
                            i <
                                samples.length
                        ) {
                            samples[i] =
                                amplitude;
                        }
                    }

                    draw();
                };

            canvas.addEventListener(
                'pointerdown',
                event => {
                    drawing =
                        true;

                    canvas.setPointerCapture(
                        event.pointerId
                    );

                    drawAt(
                        event
                    );
                }
            );

            canvas.addEventListener(
                'pointermove',
                event => {
                    if (
                        drawing
                    ) {
                        drawAt(
                            event
                        );
                    }
                }
            );

            canvas.addEventListener(
                'pointerup',
                event => {
                    drawing =
                        false;

                    try {
                        canvas.releasePointerCapture(
                            event.pointerId
                        );
                    } catch (e) {}
                }
            );

            // =========================================================
            // WAVETONE FOOTER
            // =========================================================

            const footer =
                document.createElement(
                    'div'
                );

            footer.style.cssText =
                'display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px;background:#20222d;border-top:1px solid #343746;';

            const save =
                this.editorButton(
                    'Save to Extension',
                    '#49b86b'
                );

            const exportDevice =
                this.editorButton(
                    'Export WAV to Device'
                );

            const reset =
                this.editorButton(
                    'Reset'
                );

            footer.append(
                save,
                exportDevice,
                reset
            );

            panel.appendChild(
                footer
            );

            // =========================================================
            // WAVETONE SAVE
            // =========================================================

            save.onclick =
                async () => {
                    const newName =
                        extension.normalizeName(
                            nameInput.value,
                            assetName
                        );

                    if (
                        newName !==
                        assetName
                    ) {
                        extension.wavetoneLibrary.delete(
                            assetName
                        );

                        try {
                            await extension.deleteWavetoneStorage(
                                assetName
                            );
                        } catch (e) {}
                    }

                    await extension.saveWavetone(
                        newName,
                        samples
                    );

                    assetName =
                        newName;

                    if (
                        extension.wavetoneEditor
                    ) {
                        extension.wavetoneEditor.assetName =
                            newName;
                    }
                };

            // =========================================================
            // WAVETONE EXPORT
            // =========================================================

            exportDevice.onclick =
                () => {
                    const temporary = {
                        name:
                            assetName,

                        samples:
                            new Float32Array(
                                samples
                            )
                    };

                    const audio =
                        extension.wavetoneToAudioBuffer(
                            temporary,
                            WAVETONE_EXPORT_SECONDS,
                            WAVETONE_EXPORT_SAMPLE_RATE
                        );

                    const wav =
                        extension.audioBufferToWav(
                            audio
                        );

                    extension.downloadBlob(
                        new Blob(
                            [
                                wav
                            ],
                            {
                                type:
                                    'audio/wav'
                            }
                        ),
                        extension.removeExtension(
                            extension.normalizeName(
                                nameInput.value,
                                assetName
                            )
                        ) +
                            '.wav'
                    );
                };

            // =========================================================
            // RESET
            // =========================================================

            reset.onclick =
                () => {
                    stopTone();

                    samples =
                        new Float32Array(
                            original
                        );

                    draw();
                };

            // =========================================================
            // ESCAPE
            // =========================================================

            root.tabIndex =
                -1;

            root.addEventListener(
                'keydown',
                event => {
                    if (
                        event.key ===
                        'Escape'
                    ) {
                        extension.closeWavetoneEditor();
                    }
                }
            );

            document.body.appendChild(
                root
            );

            window.addEventListener(
                'resize',
                draw
            );

            return {
                root,

                assetName,

                refresh:
                    draw,

                stop:
                    stopTone
            };
        }

        // =============================================================
        // UI HELPERS
        // =============================================================

        editorSection(
            title
        ) {
            const section =
                document.createElement(
                    'div'
                );

            section.style.cssText =
                'background:#20222d;border:1px solid #343746;border-radius:10px;padding:10px;display:flex;flex-wrap:wrap;gap:7px;align-items:center;';

            const heading =
                document.createElement(
                    'div'
                );

            heading.textContent =
                title;

            heading.style.cssText =
                'width:100%;font-weight:700;color:#d7d9e4;margin-bottom:2px;';

            section.appendChild(
                heading
            );

            return section;
        }

        editorRow() {
            const row =
                document.createElement(
                    'div'
                );

            row.style.cssText =
                'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';

            return row;
        }

        editorLabel(
            text
        ) {
            const label =
                document.createElement(
                    'span'
                );

            label.textContent =
                text;

            label.style.cssText =
                'font-size:13px;color:#bfc2ce;';

            return label;
        }

        editorInputCSS() {
            return (
                'background:#0f1016;color:#fff;border:1px solid #464a5c;border-radius:7px;padding:7px 9px;min-width:180px;outline:none;'
            );
        }

        editorButtonCSS(
            background
        ) {
            return (
                'background:' +
                (
                    background ||
                    '#343747'
                ) +
                ';color:#fff;border:1px solid #515568;border-radius:8px;padding:7px 11px;cursor:pointer;font-weight:600;'
            );
        }

        editorButton(
            text,
            background
        ) {
            const button =
                document.createElement(
                    'button'
                );

            button.textContent =
                text;

            button.style.cssText =
                this.editorButtonCSS(
                    background
                );

            return button;
        }

        numberInput(
            value
        ) {
            const input =
                document.createElement(
                    'input'
                );

            input.type =
                'number';

            input.value =
                value;

            input.step =
                '0.001';

            input.min =
                '0';

            input.style.cssText =
                this.editorInputCSS() +
                'min-width:100px;';

            return input;
        }

        // =============================================================
        // CLOSE WAVETONE EDITOR
        // =============================================================

        closeWavetoneEditor() {
            if (
                !this.wavetoneEditor
            ) {
                return;
            }

            try {
                this.wavetoneEditor.stop();
            } catch (e) {}

            try {
                this.wavetoneEditor.root.remove();
            } catch (e) {}

            this.wavetoneEditor =
                null;
        }

        // =============================================================
        // DOWNLOAD
        // =============================================================

        downloadBlob(
            blob,
            filename
        ) {
            const url =
                URL.createObjectURL(
                    blob
                );

            const anchor =
                document.createElement(
                    'a'
                );

            anchor.href =
                url;

            anchor.download =
                filename;

            anchor.style.display =
                'none';

            document.body.appendChild(
                anchor
            );

            anchor.click();

            anchor.remove();

            setTimeout(
                () =>
                    URL.revokeObjectURL(
                        url
                    ),
                1500
            );
        }
    }

    Scratch.extensions.register(
        new SynthesizerEngine()
    );

})(Scratch);
