// Randomness Utilities - Scratch / TurboWarp Extension
// Compatible with TurboWarp, PenguinMod, and other Scratch mods that support custom extensions.

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    // Still works sandboxed, but warn for best experience
    console.warn('Randomness Utilities works best unsandboxed');
  }

  // Chromatic scale note names (without octave)
  const NOTE_NAMES = [
    'C', 'C#', 'D', 'D#', 'E', 'F',
    'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  // Convert a note string like "C4", "D#5", "Bb3", "A" to MIDI number (0-127)
  // Defaults octave to 4 if missing. Supports # and b.
  function noteToMidi(noteStr) {
    if (typeof noteStr !== 'string') noteStr = String(noteStr || 'C4');
    noteStr = noteStr.trim().toUpperCase().replace('♯', '#').replace('♭', 'B');

    // Match note + optional accidental + optional octave
    const match = noteStr.match(/^([A-G])([#B]?)(-?\d+)?$/i);
    if (!match) {
      // Fallback: try pure number (already MIDI)
      const num = Number(noteStr);
      if (!isNaN(num)) return Math.max(0, Math.min(127, Math.round(num)));
      return 60; // middle C
    }

    let [, letter, accidental, octaveStr] = match;
    letter = letter.toUpperCase();
    accidental = accidental || '';
    let octave = octaveStr !== undefined ? parseInt(octaveStr, 10) : 4;

    // Base MIDI for C of the given octave: C4 = 60
    let midi = (octave + 1) * 12;

    const letterOffset = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    };
    midi += letterOffset[letter] || 0;

    if (accidental === '#') midi += 1;
    else if (accidental === 'B') midi -= 1; // flat

    return Math.max(0, Math.min(127, midi));
  }

  // Convert MIDI number back to note name with octave (e.g. 60 → "C4")
  function midiToNote(midi) {
    midi = Math.round(Number(midi));
    midi = Math.max(0, Math.min(127, midi));
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTE_NAMES[midi % 12];
    return name + octave;
  }

  class RandomnessUtilities {
    getInfo() {
      return {
        id: 'randomnessutilities',
        name: 'Randomness Utilities',
        color1: '#FF6B6B',
        color2: '#EE5A5A',
        color3: '#FF8787',
        blocks: [
          {
            opcode: 'randomNumberDecimals',
            blockType: Scratch.BlockType.REPORTER,
            text: 'generate random number from [FROM] to [TO] with [DECIMALS] decimals',
            arguments: {
              FROM: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              TO: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              },
              DECIMALS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2
              }
            }
          },
          {
            opcode: 'randomText',
            blockType: Scratch.BlockType.REPORTER,
            text: 'generate [LENGTH] long random text from [CHARS]',
            arguments: {
              LENGTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8
              },
              CHARS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
              }
            }
          },
          {
            opcode: 'randomHex',
            blockType: Scratch.BlockType.REPORTER,
            text: 'generate random HEX'
          },
          {
            opcode: 'randomNoteRange',
            blockType: Scratch.BlockType.REPORTER,
            text: 'generate random note from [FROM] to [TO]',
            arguments: {
              FROM: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'C4'
              },
              TO: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'B5'
              }
            }
          },
          {
            opcode: 'randomNote',
            blockType: Scratch.BlockType.REPORTER,
            text: 'generate random note'
          }
        ]
      };
    }

    /**
     * Generate a random number between FROM and TO (inclusive) rounded to DECIMALS decimal places.
     */
    randomNumberDecimals(args) {
      let from = Number(args.FROM);
      let to = Number(args.TO);
      let decimals = Math.max(0, Math.min(15, Math.floor(Number(args.DECIMALS) || 0)));

      if (isNaN(from)) from = 0;
      if (isNaN(to)) to = 0;
      if (from > to) {
        const tmp = from;
        from = to;
        to = tmp;
      }

      const value = from + Math.random() * (to - from);
      // Round to the requested number of decimal places
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    }

    /**
     * Generate a string of given LENGTH using only characters from CHARS.
     */
    randomText(args) {
      let length = Math.max(0, Math.floor(Number(args.LENGTH) || 0));
      const chars = String(args.CHARS || '');

      if (length === 0 || chars.length === 0) return '';

      // Cap length to avoid freezing the editor with huge values
      length = Math.min(length, 10000);

      let result = '';
      for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        result += chars.charAt(idx);
      }
      return result;
    }

    /**
     * Generate a random HEX color string in the form #RRGGBB
     */
    randomHex() {
      const hex = Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, '0')
        .toUpperCase();
      return '#' + hex;
    }

    /**
     * Generate a random musical note (as note name with octave) between two notes (inclusive).
     * Accepts note names like "C4", "D#5", "Bb3" or MIDI numbers.
     */
    randomNoteRange(args) {
      let fromMidi = noteToMidi(args.FROM);
      let toMidi = noteToMidi(args.TO);

      if (fromMidi > toMidi) {
        const tmp = fromMidi;
        fromMidi = toMidi;
        toMidi = tmp;
      }

      const midi = Math.floor(Math.random() * (toMidi - fromMidi + 1)) + fromMidi;
      return midiToNote(midi);
    }

    /**
     * Generate a random musical note across a useful range (C3 to B6).
     */
    randomNote() {
      // C3 = 48, B6 = 95  (a practical musical range)
      const midi = Math.floor(Math.random() * (95 - 48 + 1)) + 48;
      return midiToNote(midi);
    }
  }

  Scratch.extensions.register(new RandomnessUtilities());
})(Scratch);
