class GenericLocalStorage {
  constructor() {
    // Extension setup
  }

  getInfo() {
    return {
      id: 'genericlocalstorage',
      name: 'Generic LocalStorage Extension', // Updated extension name
      color1: '#005b6d', // Deep teal primary color
      color3: '#ffffff', // White text color for high contrast
      blocks: [
        {
          opcode: 'saveToLocalStorage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'Save [VALUE] to [KEY]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'world'
            },
            KEY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'hello'
            }
          }
        },
        {
          opcode: 'getFromLocalStorage',
          blockType: Scratch.BlockType.REPORTER,
          text: 'String of [KEY]',
          arguments: {
            KEY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'hello'
            }
          }
        }
      ]
    };
  }

  saveToLocalStorage(args) {
    const key = String(args.KEY);
    const value = String(args.VALUE);
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  getFromLocalStorage(args) {
    const key = String(args.KEY);
    try {
      const value = localStorage.getItem(key);
      return value === null ? '' : value;
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return '';
    }
  }
}

Scratch.extensions.register(new GenericLocalStorage());
