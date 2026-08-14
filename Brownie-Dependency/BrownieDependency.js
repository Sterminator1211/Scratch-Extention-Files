(function (Scratch) {
  'use strict';

  class BrownieDependency {
    getInfo() {
      return {
        id: 'brownieDependency',
        name: 'Brownie Dependency',
        color1: '#8B4513',
        color2: '#A0522D',
        color3: '#5C3317',
        blocks: [
          {
            opcode: 'getOSName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Name of OS',
            disableMonitor: true
          },
          {
            opcode: 'getBrowserName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Name of Browser',
            disableMonitor: true
          },
          '---',
          {
            opcode: 'supportsControllers',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Controllers?'
          },
          {
            opcode: 'supportsNotifications',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Notifications?'
          },
          {
            opcode: 'supportsLocation',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Location?'
          },
          {
            opcode: 'supportsCamera',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Camera?'
          },
          {
            opcode: 'supportsMicrophone',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Microphone?'
          },
          {
            opcode: 'supportsSpeaker',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Speaker?'
          },
          {
            opcode: 'supportsMIDI',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports MIDI Input?'
          },
          {
            opcode: 'supportsSerial',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Serial Input?'
          },
          {
            opcode: 'supportsVR',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports Virtual Reality?'
          },
          {
            opcode: 'supportsLocalStorage',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Browser supports LocalStorage?'
          }
        ]
      };
    }

    getOSName() {
      if (navigator.userAgentData && navigator.userAgentData.platform) {
        return navigator.userAgentData.platform;
      }

      const ua = navigator.userAgent || '';
      if (/Windows/i.test(ua)) return 'Windows';
      if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
      if (/Android/i.test(ua)) return 'Android';
      if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
      if (/Linux/i.test(ua)) return 'Linux';
      if (/CrOS/i.test(ua)) return 'ChromeOS';
      return 'Unknown';
    }

    getBrowserName() {
      const ua = navigator.userAgent || '';

      if (/Edg\//i.test(ua)) return 'Microsoft Edge';
      if (/OPR\/|Opera/i.test(ua)) return 'Opera';
      if (/Firefox|FxiOS/i.test(ua)) return 'Mozilla Firefox';
      if (/Chrome|CriOS|Chromium/i.test(ua)) return 'Google Chrome';
      if (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS/i.test(ua)) return 'Apple Safari';
      if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
      if (/UCBrowser/i.test(ua)) return 'UC Browser';
      if (/Trident|MSIE/i.test(ua)) return 'Internet Explorer';

      return 'Unknown';
    }

    supportsControllers() {
      return 'getGamepads' in navigator;
    }

    supportsNotifications() {
      return 'Notification' in window;
    }

    supportsLocation() {
      return 'geolocation' in navigator;
    }

    supportsCamera() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    supportsMicrophone() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    supportsSpeaker() {
      return !!(window.AudioContext || window.webkitAudioContext);
    }

    supportsMIDI() {
      return 'requestMIDIAccess' in navigator;
    }

    supportsSerial() {
      return 'serial' in navigator;
    }

    supportsVR() {
      return ('xr' in navigator) || ('getVRDisplays' in navigator);
    }

    supportsLocalStorage() {
      try {
        return typeof localStorage !== 'undefined' && localStorage !== null;
      } catch (e) {
        return false;
      }
    }
  }

  Scratch.extensions.register(new BrownieDependency());
})(Scratch);
