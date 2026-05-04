(function(Scratch) {
  'use strict';

  class YTUtilities {
    constructor() {
      this.apiKey = '';
    }

    getInfo() {
      return {
        id: 'ytutilities',
        name: 'YT Utilities',
        color1: '#FF0000',
        blocks: [
          { opcode: 'setKey', blockType: Scratch.BlockType.COMMAND, text: 'set API key to [KEY]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'API_KEY_HERE' } } },

          // ==================== VIDEO SECTION ====================
          { blockType: Scratch.BlockType.LABEL, text: "Video" },
          { opcode: 'getTitle', blockType: Scratch.BlockType.REPORTER, text: 'title of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getDescription', blockType: Scratch.BlockType.REPORTER, text: 'description of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getViews', blockType: Scratch.BlockType.REPORTER, text: 'views of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getLikes', blockType: Scratch.BlockType.REPORTER, text: 'likes of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getLength', blockType: Scratch.BlockType.REPORTER, text: 'length of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getHandle', blockType: Scratch.BlockType.REPORTER, text: 'publisher handle of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },
          { opcode: 'getVideoCreationDate', blockType: Scratch.BlockType.REPORTER, text: 'creation date of video [ID]', arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'dQw4w9WgXcQ' } } },

          // ==================== CHANNEL / MEMBER SECTION ====================
          { blockType: Scratch.BlockType.LABEL, text: "Channel / Member" },
          { opcode: 'getSubscriberCount', blockType: Scratch.BlockType.REPORTER, text: 'current subscriber count of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'getVideoCount', blockType: Scratch.BlockType.REPORTER, text: 'video count of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'getChannelViewCount', blockType: Scratch.BlockType.REPORTER, text: 'total view count of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'getChannelCreationDate', blockType: Scratch.BlockType.REPORTER, text: 'creation date of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'getRegion', blockType: Scratch.BlockType.REPORTER, text: 'region of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'getChannelDescription', blockType: Scratch.BlockType.REPORTER, text: 'description of [HANDLE]', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },

          // ==================== CONVERSION BLOCKS ====================
          { blockType: Scratch.BlockType.LABEL, text: "Handle ↔ Channel ID" },
          { opcode: 'handleToChannelId', blockType: Scratch.BlockType.REPORTER, text: '[HANDLE] to channel ID', arguments: { HANDLE: { type: Scratch.ArgumentType.STRING, defaultValue: '@MrBeast' } } },
          { opcode: 'channelIdToHandle', blockType: Scratch.BlockType.REPORTER, text: '[CHANNELID] to handle', arguments: { CHANNELID: { type: Scratch.ArgumentType.STRING, defaultValue: 'UCX6OQ3DkcsbYNE6H8uQQuVA' } } }
        ]
      };
    }

    setKey(args) {
      this.apiKey = args.KEY.trim();
    }

    parseDuration(duration) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return "0:00";
      const h = parseInt(match[1]) || 0;
      const m = parseInt(match[2]) || 0;
      const s = parseInt(match[3]) || 0;

      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    formatDate(isoString) {
      if (!isoString) return "Unknown";
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    async fetchVideoData(id) {
      if (!this.apiKey) return "Missing API Key";
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(id)}&key=${this.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) return `Error: ${data.error.message}`;
        if (!data.items || data.items.length === 0) return "Video Not Found";

        return data.items[0];
      } catch (e) {
        return "Network Error";
      }
    }

    async fetchChannelData(handle) {
      if (!this.apiKey) return "Missing API Key";
      try {
        const clean = handle.trim().replace('@', '');

        let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(clean)}&key=${this.apiKey}`;
        let response = await fetch(url);
        let data = await response.json();

        if (data.items && data.items.length > 0) return data.items[0];

        url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${encodeURIComponent(clean)}&key=${this.apiKey}`;
        response = await fetch(url);
        data = await response.json();

        if (data.items && data.items.length > 0) return data.items[0];

        return "Channel Not Found";
      } catch (e) {
        return "Network Error";
      }
    }

    async fetchChannelById(channelId) {
      if (!this.apiKey) return "Missing API Key";
      try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${this.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) return `Error: ${data.error.message}`;
        if (data.items && data.items.length > 0) return data.items[0];

        return "Channel Not Found";
      } catch (e) {
        return "Network Error";
      }
    }

    // ==================== VIDEO BLOCKS ====================
    async getTitle(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object' && video.snippet) ? video.snippet.title : video;
    }

    async getDescription(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object' && video.snippet) ? video.snippet.description : video;
    }

    async getViews(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object') ? (video.statistics?.viewCount || "0") : video;
    }

    async getLikes(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object') ? (video.statistics?.likeCount || "Hidden") : video;
    }

    async getLength(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object' && video.contentDetails) 
        ? this.parseDuration(video.contentDetails.duration) 
        : "0:00";
    }

    async getHandle(args) { 
      const video = await this.fetchVideoData(args.ID);
      if (typeof video !== 'object' || !video.snippet) return "@unknown";

      try {
        const channelId = video.snippet.channelId;
        const data = await this.fetchChannelById(channelId);
        if (typeof data === 'object' && data.snippet?.customUrl) {
          let custom = data.snippet.customUrl;
          return custom.startsWith('@') ? custom : '@' + custom;
        }
        return "@unknown";
      } catch (e) {
        return "@unknown";
      }
    }

    async getVideoCreationDate(args) { 
      const video = await this.fetchVideoData(args.ID);
      return (typeof video === 'object' && video.snippet?.publishedAt) 
        ? this.formatDate(video.snippet.publishedAt) 
        : video;
    }

    // ==================== CHANNEL BLOCKS ====================
    async getSubscriberCount(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object') ? (channel.statistics?.subscriberCount || "Hidden") : channel;
    }

    async getVideoCount(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object') ? (channel.statistics?.videoCount || "0") : channel;
    }

    async getChannelViewCount(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object') ? (channel.statistics?.viewCount || "0") : channel;
    }

    async getChannelCreationDate(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object' && channel.snippet?.publishedAt) 
        ? this.formatDate(channel.snippet.publishedAt) 
        : channel;
    }

    async getRegion(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object' && channel.snippet?.country) 
        ? channel.snippet.country 
        : "Unknown";
    }

    async getChannelDescription(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object' && channel.snippet) 
        ? (channel.snippet.description || "No description") 
        : channel;
    }

    // ==================== CONVERSION BLOCKS ====================
    async handleToChannelId(args) {
      const channel = await this.fetchChannelData(args.HANDLE);
      return (typeof channel === 'object') ? channel.id : channel;
    }

    async channelIdToHandle(args) {
      const channel = await this.fetchChannelById(args.CHANNELID);
      if (typeof channel === 'object' && channel.snippet?.customUrl) {
        let custom = channel.snippet.customUrl;
        return custom.startsWith('@') ? custom : '@' + custom;
      }
      return (typeof channel === 'object') ? "@unknown" : channel;
    }
  }

  Scratch.extensions.register(new YTUtilities());
})(Scratch);