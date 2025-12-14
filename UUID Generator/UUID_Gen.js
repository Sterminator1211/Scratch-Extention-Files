class UUIDExtension {
  getInfo() {
    return {
      id: 'uuidext',
      name: 'UUID Generator',
      blocks: [
        {
          opcode: 'uuidV1',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v1 (time)'
        },
        {
          opcode: 'uuidV3',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v3 (name) [SEED]',
          arguments: {
            SEED: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'name'
            }
          }
        },
        {
          opcode: 'uuidV5',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v5 (name) [SEED]',
          arguments: {
            SEED: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'name'
            }
          }
        },
        {
          opcode: 'uuidV4',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v4 (random)'
        },
        {
          opcode: 'uuidV7',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v7 (time+rand)'
        },
        {
          opcode: 'uuid75',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v7.5 (seeded) [SEED]',
          arguments: {
            SEED: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'A.B'
            }
          }
        },
        {
          opcode: 'uuid76',
          blockType: Scratch.BlockType.REPORTER,
          text: 'UUID v7.6 (time+seed+rand) [SEED]',
          arguments: {
            SEED: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'name'
            }
          }
        }
      ]
    };
  }

  // ---------- Utilities ----------
  seededRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
      h = Math.imul(48271, h) | 0;
      return ((h >>> 0) % 100000) / 100000;
    };
  }

  hex(n, len) {
    return (n >>> 0).toString(16).padStart(len, '0');
  }

  randHex(len) {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += Math.floor(Math.random() * 16).toString(16);
    }
    return out;
  }

  // ---------- UUID v1 ----------
  uuidV1() {
    const time = Date.now();
    const rand = Math.floor(Math.random() * 0xffffffff);
    return (
      this.hex(time, 8) + '-' +
      this.hex(rand >> 16, 4) + '-1' +
      this.hex(rand >> 12, 3) + '-' +
      this.hex(rand >> 8, 4) + '-' +
      this.hex(rand, 12)
    );
  }

  // ---------- UUID v3 ----------
  uuidV3(args) {
    const rand = this.seededRandom('v3:' + String(args.SEED));
    let hex = '';
    for (let i = 0; i < 32; i++) hex += Math.floor(rand() * 16).toString(16);
    hex = hex.slice(0, 12) + '3' + hex.slice(13);
    return (
      hex.slice(0, 8) + '-' +
      hex.slice(8, 12) + '-' +
      hex.slice(12, 16) + '-' +
      hex.slice(16, 20) + '-' +
      hex.slice(20)
    );
  }

  // ---------- UUID v5 ----------
  uuidV5(args) {
    const rand = this.seededRandom('v5:' + String(args.SEED));
    let hex = '';
    for (let i = 0; i < 32; i++) hex += Math.floor(rand() * 16).toString(16);
    hex = hex.slice(0, 12) + '5' + hex.slice(13);
    return (
      hex.slice(0, 8) + '-' +
      hex.slice(8, 12) + '-' +
      hex.slice(12, 16) + '-' +
      hex.slice(16, 20) + '-' +
      hex.slice(20)
    );
  }

  // ---------- UUID v4 ----------
  uuidV4() {
    return (
      this.randHex(8) + '-' +
      this.randHex(4) + '-4' +
      this.randHex(3) + '-' +
      this.randHex(4) + '-' +
      this.randHex(12)
    );
  }

  // ---------- UUID v7 ----------
  uuidV7() {
    const time = Date.now().toString(16).padStart(12, '0');
    return (
      time.slice(0, 8) + '-' +
      time.slice(8, 12) + '-7' +
      this.randHex(3) + '-' +
      this.randHex(4) + '-' +
      this.randHex(12)
    );
  }

  // ---------- UUID v7.5 ----------
  uuid75(args) {
    const rand = this.seededRandom(String(args.SEED));

    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const alphanum = letters + numbers;
    const pick = s => s[Math.floor(rand() * s.length)];

    let out = '';
    for (let i = 0; i < 5; i++) out += pick(letters);
    out += '-';
    out += pick(numbers) + pick(letters) + pick(letters);
    out += '-';
    out += pick(letters) + pick(numbers) + pick(numbers) + pick(letters);
    out += '-';
    for (let i = 0; i < 5; i++) out += pick(alphanum);

    return out;
  }

  // ---------- UUID v7.6 ----------
  uuid76(args) {
    const seed = String(args.SEED);
    const timeHex = Date.now().toString(16).padStart(12, '0');
    const seeded = this.seededRandom('v7.6:' + seed + ':' + timeHex);

    const mixedHex = () => {
      const r1 = Math.floor(Math.random() * 16);
      const r2 = Math.floor(seeded() * 16);
      return ((r1 + r2) & 15).toString(16);
    };

    let randHex = '';
    for (let i = 0; i < 19; i++) randHex += mixedHex();

    return (
      timeHex.slice(0, 8) + '-' +
      timeHex.slice(8, 12) + '-7' +
      randHex.slice(0, 3) + '-' +
      randHex.slice(3, 7) + '-' +
      randHex.slice(7)
    );
  }
}

Scratch.extensions.register(new UUIDExtension());