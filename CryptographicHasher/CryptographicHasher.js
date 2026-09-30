(() => {
  "use strict";

  const EXTENSION_NAME = "Cryptographic Hasher";
  const globalScope =
    typeof globalThis !== "undefined" ? globalThis : window;

  const loadedLibraries = new Map();

  async function loadLibrary(name, urls, test) {
    if (test()) {
      return;
    }

    if (loadedLibraries.has(name)) {
      await loadedLibraries.get(name);
      return;
    }

    const loadingPromise = (async () => {
      let lastError = null;

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            cache: "force-cache"
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const source = await response.text();

          if (!source || source.length < 100) {
            throw new Error("The downloaded library was empty.");
          }

          new Function(`${source}\n//# sourceURL=${url}`)();

          if (test()) {
            return;
          }

          throw new Error(
            "The library loaded but did not expose the expected API."
          );
        } catch (error) {
          lastError = error;
        }
      }

      throw new Error(
        `${name} failed to load. ${
          lastError ? lastError.message : "No compatible CDN was available."
        }`
      );
    })();

    loadedLibraries.set(name, loadingPromise);

    try {
      await loadingPromise;
    } catch (error) {
      loadedLibraries.delete(name);
      throw error;
    }
  }

  async function ensureCryptoJS() {
    await loadLibrary(
      "CryptoJS",
      [
        "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.js",
        "https://unpkg.com/crypto-js@4.2.0/crypto-js.js",
        "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.1/crypto-js.min.js"
      ],
      () => Boolean(globalScope.CryptoJS)
    );
  }

  async function ensureBcrypt() {
    await loadLibrary(
      "bcrypt.js",
      [
        "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.js",
        "https://unpkg.com/bcryptjs@2.4.3/dist/bcrypt.js",
        "https://cdnjs.cloudflare.com/ajax/libs/bcrypt.js/2.4.1/bcrypt.min.js"
      ],
      () => Boolean(globalScope.dcodeIO?.bcrypt || globalScope.bcrypt)
    );
  }

  async function ensureArgon2() {
    await loadLibrary(
      "argon2-browser",
      [
        "https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2-bundled.min.js",
        "https://unpkg.com/argon2-browser@1.18.0/dist/argon2-bundled.min.js",
        "https://cdn.jsdelivr.net/npm/argon2-browser@1.3.0/dist/argon2.min.js"
      ],
      () => Boolean(globalScope.argon2)
    );
  }

  async function ensureHashWasm() {
    await loadLibrary(
      "hash-wasm",
      [
        "https://cdn.jsdelivr.net/npm/hash-wasm@4.12.0/dist/index.umd.min.js",
        "https://unpkg.com/hash-wasm@4.12.0/dist/index.umd.min.js"
      ],
      () => Boolean(globalScope.hashwasm)
    );
  }

  function getBcrypt() {
    return globalScope.dcodeIO?.bcrypt || globalScope.bcrypt;
  }

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(String(value ?? ""));
    let binary = "";

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary);
  }

  function textToBytes(value) {
    return new TextEncoder().encode(String(value ?? ""));
  }

  function bufferToHex(buffer) {
    if (typeof buffer === "string") {
      return buffer;
    }

    if (buffer instanceof ArrayBuffer) {
      buffer = new Uint8Array(buffer);
    }

    if (ArrayBuffer.isView(buffer)) {
      buffer = new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength
      );
    }

    return Array.from(buffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function normalizeSalt(value) {
    const salt = String(value ?? "");

    if (new TextEncoder().encode(salt).length >= 8) {
      return salt;
    }

    return `penguinmod-salt-${salt}`;
  }

  async function generateMD5(value) {
    await ensureCryptoJS();

    return globalScope.CryptoJS.MD5(
      String(value ?? "")
    ).toString(globalScope.CryptoJS.enc.Hex);
  }

  async function generateSHA(value, algorithm) {
    await ensureCryptoJS();

    const text = String(value ?? "");
    const selectedAlgorithm = String(algorithm ?? "256");
    const cryptoJS = globalScope.CryptoJS;

    switch (selectedAlgorithm) {
      case "3":
        return cryptoJS.SHA3(text).toString(cryptoJS.enc.Hex);

      case "224":
        return cryptoJS.SHA224(text).toString(cryptoJS.enc.Hex);

      case "256":
        return cryptoJS.SHA256(text).toString(cryptoJS.enc.Hex);

      case "384":
        return cryptoJS.SHA384(text).toString(cryptoJS.enc.Hex);

      case "512":
        return cryptoJS.SHA512(text).toString(cryptoJS.enc.Hex);

      default:
        throw new Error(
          `Unsupported SHA algorithm: ${selectedAlgorithm}`
        );
    }
  }

  async function generateBcrypt(value) {
    await ensureBcrypt();

    const bcrypt = getBcrypt();

    if (!bcrypt) {
      throw new Error("bcrypt.js did not expose a bcrypt API.");
    }

    return bcrypt.hashSync(String(value ?? ""), 10);
  }

  async function generateArgon2(value, optionalKey) {
    await ensureArgon2();

    if (!globalScope.argon2) {
      throw new Error("argon2-browser did not expose an argon2 API.");
    }

    const argonType = globalScope.argon2.ArgonType
      ? globalScope.argon2.ArgonType.Argon2id
      : 2;

    const result = await globalScope.argon2.hash({
      pass: String(value ?? ""),
      salt: normalizeSalt(optionalKey),
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 1,
      hashLen: 32,
      type: argonType
    });

    if (result.encoded) {
      return result.encoded;
    }

    if (result.hashHex) {
      return result.hashHex;
    }

    if (result.hash) {
      return bufferToHex(result.hash);
    }

    throw new Error("Argon2 returned an unknown result format.");
  }

  async function generatePBKDF2(value) {
    if (!globalScope.crypto?.subtle) {
      throw new Error("Web Crypto API is unavailable.");
    }

    const password = textToBytes(value);
    const salt = textToBytes("penguinmod-pbkdf2-salt");

    const keyMaterial = await globalScope.crypto.subtle.importKey(
      "raw",
      password,
      {
        name: "PBKDF2"
      },
      false,
      ["deriveBits"]
    );

    const derivedBits = await globalScope.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return bufferToHex(derivedBits);
  }

  async function generateBlake(value, algorithm, optionalKey) {
    await ensureHashWasm();

    const hashWasm = globalScope.hashwasm;

    if (!hashWasm) {
      throw new Error("hash-wasm did not expose an API.");
    }

    const selectedAlgorithm = String(algorithm ?? "2b");
    const input = textToBytes(value);
    const keyText = String(optionalKey ?? "");
    const key = keyText.length > 0 ? textToBytes(keyText) : null;

    let hasher;
    let hashLength;

    switch (selectedAlgorithm) {
      case "2s":
      case "2sp":
        hashLength = 256;
        hasher = await hashWasm.createBLAKE2s(hashLength);
        break;

      case "2b":
      case "2bp":
        hashLength = 512;
        hasher = await hashWasm.createBLAKE2b(hashLength);
        break;

      case "3":
        hashLength = 256;
        hasher = await hashWasm.createBLAKE3(hashLength);
        break;

      default:
        throw new Error(
          `Unsupported BLAKE algorithm: ${selectedAlgorithm}`
        );
    }

    if (key && typeof hasher.init === "function") {
      await hasher.init(key);
    }

    await hasher.update(input);

    return await hasher.digest("hex");
  }

  /*
   * Self-contained KangarooTwelve implementation.
   *
   * This implements the standard 32-byte KangarooTwelve digest
   * using Keccak-p[1600, 12]. It does not use fetch(), WebAssembly,
   * a CDN, or an external library.
   */

  const K12_ROTATION_OFFSETS = [
    0, 1, 62, 28, 27,
    36, 44, 6, 55, 20,
    3, 10, 43, 25, 39,
    41, 45, 15, 21, 8,
    18, 2, 61, 56, 14
  ];

  const K12_ROUND_CONSTANTS = [
    0x0000000000000001n,
    0x0000000000008082n,
    0x800000000000808an,
    0x8000000080008000n,
    0x000000000000808bn,
    0x0000000080000001n,
    0x8000000080008081n,
    0x8000000000008009n,
    0x000000000000008an,
    0x0000000000000088n,
    0x0000000080008009n,
    0x000000008000000an
  ];

  const K12_MASK_64 = 0xffffffffffffffffn;
  const K12_RATE = 168;

  function k12RotateLeft(value, amount) {
    if (amount === 0) {
      return value;
    }

    return (
      ((value << BigInt(amount)) |
        (value >> BigInt(64 - amount))) &
      K12_MASK_64
    );
  }

  function k12KeccakP1600(state) {
    for (const roundConstant of K12_ROUND_CONSTANTS) {
      const columnParity = new Array(5).fill(0n);

      for (let x = 0; x < 5; x++) {
        columnParity[x] =
          state[x] ^
          state[x + 5] ^
          state[x + 10] ^
          state[x + 15] ^
          state[x + 20];
      }

      const theta = new Array(5);

      for (let x = 0; x < 5; x++) {
        theta[x] =
          columnParity[(x + 4) % 5] ^
          k12RotateLeft(columnParity[(x + 1) % 5], 1);
      }

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x + 5 * y] =
            (state[x + 5 * y] ^ theta[x]) & K12_MASK_64;
        }
      }

      const rotated = new Array(25).fill(0n);

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const index = x + 5 * y;
          const newX = y;
          const newY = (2 * x + 3 * y) % 5;

          rotated[newX + 5 * newY] = k12RotateLeft(
            state[index],
            K12_ROTATION_OFFSETS[index]
          );
        }
      }

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x + 5 * y] =
            rotated[x + 5 * y] ^
            ((~rotated[(x + 1) % 5 + 5 * y]) &
              rotated[(x + 2) % 5 + 5 * y]);

          state[x + 5 * y] &= K12_MASK_64;
        }
      }

      state[0] =
        (state[0] ^ roundConstant) & K12_MASK_64;
    }
  }

  function k12AbsorbBlock(state, block) {
    for (let index = 0; index < block.length; index++) {
      const laneIndex = Math.floor(index / 8);
      const shift = BigInt((index % 8) * 8);

      state[laneIndex] ^= BigInt(block[index]) << shift;
      state[laneIndex] &= K12_MASK_64;
    }

    k12KeccakP1600(state);
  }

  function k12Squeeze(state, outputLength) {
    const output = new Uint8Array(outputLength);
    let outputIndex = 0;

    while (outputIndex < outputLength) {
      for (let byteIndex = 0; byteIndex < K12_RATE; byteIndex++) {
        if (outputIndex >= outputLength) {
          break;
        }

        const laneIndex = Math.floor(byteIndex / 8);
        const shift = BigInt((byteIndex % 8) * 8);

        output[outputIndex++] = Number(
          (state[laneIndex] >> shift) & 0xffn
        );
      }

      if (outputIndex < outputLength) {
        k12KeccakP1600(state);
      }
    }

    return output;
  }

  function generateKangarooTwelve(value) {
    const message = textToBytes(value);

    /*
     * K12's single-node form:
     *
     * message || customization || right_encode(customization_length)
     * || 0x07
     *
     * This extension has no customization-string input, so the
     * customization length is zero and the encoded trailer is 0x00.
     */
    const suffix = new Uint8Array([0x07]);
    const customizationLength = new Uint8Array([0x00]);

    const input = new Uint8Array(
      message.length +
        suffix.length +
        customizationLength.length
    );

    input.set(message, 0);
    input.set(suffix, message.length);
    input.set(
      customizationLength,
      message.length + suffix.length
    );

    const state = new Array(25).fill(0n);
    let offset = 0;

    while (offset + K12_RATE <= input.length) {
      k12AbsorbBlock(
        state,
        input.slice(offset, offset + K12_RATE)
      );

      offset += K12_RATE;
    }

    const finalBlock = new Uint8Array(K12_RATE);
    finalBlock.set(input.slice(offset));

    /*
     * 0x07 is the KangarooTwelve domain-separation suffix.
     * The final bit of Keccak padding is placed in the final rate byte.
     */
    finalBlock[input.length - offset] ^= 0x07;
    finalBlock[K12_RATE - 1] ^= 0x80;

    k12AbsorbBlock(state, finalBlock);

    return bufferToHex(k12Squeeze(state, 32));
  }

  class CryptographicHasherExtension {
    getInfo() {
      return {
        id: "cryptographichasher",
        name: EXTENSION_NAME,
        color1: "#4B6584",
        color2: "#34495E",
        color3: "#263746",

        blocks: [
          {
            opcode: "convertToBase64",
            blockType: Scratch.BlockType.REPORTER,
            text: "Convert [STRING] to Base64",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          },

          {
            opcode: "generateMD5",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate MD5 String from [STRING]",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          },

          {
            opcode: "generateSHA",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate SHA-[SHA] from [STRING]",
            arguments: {
              SHA: {
                type: Scratch.ArgumentType.STRING,
                menu: "shaAlgorithms"
              },
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          },

          {
            opcode: "generateBcrypt",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate bcrypt from [STRING]",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          },

          {
            opcode: "generateArgon2",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate Argon2 from [STRING] using OPTIONAL [KEY]",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              },
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              }
            }
          },

          {
            opcode: "generatePBKDF2",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate PBKDF2 from [STRING]",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          },

          {
            opcode: "generateBlake",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate BLAKE[BLAKE] from [STRING] with optional KEY [KEY]",
            arguments: {
              BLAKE: {
                type: Scratch.ArgumentType.STRING,
                menu: "blakeAlgorithms"
              },
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              },
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              }
            }
          },

          {
            opcode: "generateKangarooTwelve",
            blockType: Scratch.BlockType.REPORTER,
            text: "Generate KangarooTwelve from [STRING]",
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello, world!"
              }
            }
          }
        ],

        menus: {
          shaAlgorithms: {
            acceptReporters: true,
            items: ["3", "224", "256", "384", "512"]
          },

          blakeAlgorithms: {
            acceptReporters: true,
            items: [
              "2s",
              "2b",
              "2sp",
              "2bp",
              "3"
            ]
          }
        }
      };
    }

    convertToBase64(args) {
      try {
        return encodeBase64(args.STRING);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generateMD5(args) {
      try {
        return await generateMD5(args.STRING);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generateSHA(args) {
      try {
        return await generateSHA(args.STRING, args.SHA);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generateBcrypt(args) {
      try {
        return await generateBcrypt(args.STRING);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generateArgon2(args) {
      try {
        return await generateArgon2(args.STRING, args.KEY);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generatePBKDF2(args) {
      try {
        return await generatePBKDF2(args.STRING);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    async generateBlake(args) {
      try {
        return await generateBlake(
          args.STRING,
          args.BLAKE,
          args.KEY
        );
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    generateKangarooTwelve(args) {
      try {
        return generateKangarooTwelve(args.STRING);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }
  }

  Scratch.extensions.register(new CryptographicHasherExtension());
})();
