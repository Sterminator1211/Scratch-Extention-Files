// Name: IPSW.me API
// ID: ipswmeapi
// Description: Fetch Apple firmware (IPSW & OTA) for every iDevice OS – iOS, iPadOS, macOS, watchOS, tvOS, audioOS, visionOS – via the official IPSW.me API v4.
// License: MIT

(function (Scratch) {
  "use strict";

  const BASE = "https://api.ipsw.me/v4";

  async function apiFetch(path) {
    const url = BASE + path;
    try {
      const response = await (Scratch.fetch ? Scratch.fetch(url) : fetch(url));
      if (!response.ok) {
        return JSON.stringify({
error: true,
status: response.status,
message: response.statusText
        });
      }
      const data = await response.json();
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({
error: true,
message: e.message||String(e)
      });
    }
  }

  function getProp(jsonStr, prop) {
    try {
      const data = JSON.parse(jsonStr);
      const val = data[prop];
      if (val===undefined||val===null) return "";
      if (typeof val==="boolean") return val ? "true" : "false";
      return String(val);
    } catch {
      return "";
    }
  }

  class IPSWMeAPI {
    getInfo() {
      return {
        id: "ipswmeapi",
        name: "IPSW.me API",
        color1: "#007AFF",
        color2: "#0051D5",
        color3: "#003D9E",
        blocks: [
          // ─── Devices ───────────────────────────────────────────────
          {
            opcode: "getAllDevices",
            blockType: Scratch.BlockType.REPORTER,
            text: "all devices (JSON)",
            disableMonitor: true
          },
          {
            opcode: "getDevicesByType",
            blockType: Scratch.BlockType.REPORTER,
            text: "devices of type [TYPE]",
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "deviceTypes",
                defaultValue: "iPhone"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getDeviceInfo",
            blockType: Scratch.BlockType.REPORTER,
            text: "device info for [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getDeviceName",
            blockType: Scratch.BlockType.REPORTER,
            text: "name of device [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            }
          },
          {
            opcode: "identifyByModel",
            blockType: Scratch.BlockType.REPORTER,
            text: "identify by model number [MODEL]",
            arguments: {
              MODEL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "A2846"
              }
            },
            disableMonitor: true
          },

          // ─── IPSW ──────────────────────────────────────────────────
          {
            opcode: "getIPSWsForDevice",
            blockType: Scratch.BlockType.REPORTER,
            text: "all IPSWs for [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getIPSWInfo",
            blockType: Scratch.BlockType.REPORTER,
            text: "IPSW [IDENTIFIER] build [BUILDID]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              },
              BUILDID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "22A3354"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getIPSWsByVersion",
            blockType: Scratch.BlockType.REPORTER,
            text: "all IPSWs for version [VERSION]",
            arguments: {
              VERSION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "18.1"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getIPSWDownloadURL",
            blockType: Scratch.BlockType.REPORTER,
            text: "IPSW download URL [IDENTIFIER] [BUILDID]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              },
              BUILDID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "22A3354"
              }
            }
          },
          {
            opcode: "isIPSWSigned",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "IPSW [IDENTIFIER] [BUILDID] signed?",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              },
              BUILDID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "22A3354"
              }
            }
          },
          {
            opcode: "getIPSWProperty",
            blockType: Scratch.BlockType.REPORTER,
            text: "IPSW [IDENTIFIER] [BUILDID] [PROP]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              },
              BUILDID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "22A3354"
              },
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: "firmwareProperties",
                defaultValue: "version"
              }
            }
          },
          {
            opcode: "getLatestSignedIPSW",
            blockType: Scratch.BlockType.REPORTER,
            text: "latest signed IPSW for [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            },
            disableMonitor: true
          },

          // ─── OTA ───────────────────────────────────────────────────
          {
            opcode: "getOTAsForDevice",
            blockType: Scratch.BlockType.REPORTER,
            text: "all OTAs for [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getOTAInfo",
            blockType: Scratch.BlockType.REPORTER,
            text: "OTA [IDENTIFIER] build [BUILDID]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              },
              BUILDID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "22A3354"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getOTAsByVersion",
            blockType: Scratch.BlockType.REPORTER,
            text: "all OTAs for version [VERSION]",
            arguments: {
              VERSION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "18.1"
              }
            },
            disableMonitor: true
          },
          {
            opcode: "getLatestSignedOTA",
            blockType: Scratch.BlockType.REPORTER,
            text: "latest signed OTA for [IDENTIFIER]",
            arguments: {
              IDENTIFIER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "iPhone16,1"
              }
            },
            disableMonitor: true
          },

          // ─── Releases & iTunes ─────────────────────────────────────
          {
            opcode: "getReleases",
            blockType: Scratch.BlockType.REPORTER,
            text: "release timeline (JSON)",
            disableMonitor: true
          },
          {
            opcode: "getiTunesVersions",
            blockType: Scratch.BlockType.REPORTER,
            text: "iTunes versions for [PLATFORM]",
arguments: {
PLATFORM: {
type: Scratch.ArgumentType.STRING,
menu: "itunesPlatforms",
defaultValue: "windows"
              }
            },
disableMonitor: true
          },

// ───Raw───────────────────────────────────────────────────
          {
opcode: "rawRequest",
            blockType: Scratch.BlockType.REPORTER,
            text: "raw API path [PATH]",
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/devices"
              }
            },
            disableMonitor: true
          }
        ],
        menus: {
          deviceTypes: {
            acceptReporters: true,
            items: [
              "iPhone",
              "iPad",
              "iPod",
              "Mac",
              "Watch",
              "AppleTV",
              "AudioAccessory",
              "RealityDevice"
            ]
          },
          firmwareProperties: {
            acceptReporters: true,
            items: [
              "version",
              "buildid",
              "url",
              "filesize",
              "sha1sum",
              "md5sum",
              "sha256sum",
              "signed",
              "releasedate",
              "uploaddate",
              "identifier"
            ]
          },
itunesPlatforms: {
acceptReporters: true,
items: ["windows", "macOS"]
          }
        }
      };
    }

// ───Implementation ──────────────────────────────────────────────

    getAllDevices() {
      return apiFetch("/devices");
    }

    async getDevicesByType(args) {
      const type = String(args.TYPE).trim();
      const raw = await apiFetch("/devices");
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return raw;
        const filtered = list.filter(d =>
          (d.identifier || "").startsWith(type) ||
          (d.name || "").toLowerCase().includes(type.toLowerCase())
        );
        return JSON.stringify(filtered);
      } catch {
        return raw;
      }
    }

    getDeviceInfo(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      return apiFetch(`/ipsw/device/${id}`);
    }

    async getDeviceName(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const raw = await apiFetch(`/ipsw/device/${id}`);
      return getProp(raw, "name");
    }

    identifyByModel(args) {
      const model = encodeURIComponent(String(args.MODEL).trim());
      return apiFetch(`/model/${model}`);
    }

    getIPSWsForDevice(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      return apiFetch(`/ipsw/device/${id}`);
    }

    getIPSWInfo(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const build = encodeURIComponent(String(args.BUILDID).trim());
      return apiFetch(`/ipsw/${id}/${build}`);
    }

    getIPSWsByVersion(args) {
      const ver = encodeURIComponent(String(args.VERSION).trim());
      return apiFetch(`/ipsw/${ver}`);
    }

    async getIPSWDownloadURL(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const build = encodeURIComponent(String(args.BUILDID).trim());
      const raw = await apiFetch(`/ipsw/${id}/${build}`);
      return getProp(raw, "url");
    }

    async isIPSWSigned(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const build = encodeURIComponent(String(args.BUILDID).trim());
      const raw = await apiFetch(`/ipsw/${id}/${build}`);
      try {
        const data = JSON.parse(raw);
        return!!data.signed;
      } catch {
        return false;
      }
    }

    async getIPSWProperty(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const build = encodeURIComponent(String(args.BUILDID).trim());
      const prop = String(args.PROP).trim().toLowerCase();
      const raw = await apiFetch(`/ipsw/${id}/${build}`);
      return getProp(raw, prop);
    }

    async getLatestSignedIPSW(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const raw = await apiFetch(`/ipsw/device/${id}`);
      try {
        const data = JSON.parse(raw);
        const firmwares = data.firmwares || [];
        const signed = firmwares.find(f => f.signed === true);
        return signed
          ? JSON.stringify(signed)
          : JSON.stringify({ error: true, message: "No signed IPSW found" });
      } catch {
        return JSON.stringify({error: true, message: "Parse error" });
      }
    }

    getOTAsForDevice(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      return apiFetch(`/ota/device/${id}`);
    }

    getOTAInfo(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const build = encodeURIComponent(String(args.BUILDID).trim());
      return apiFetch(`/ota/${id}/${build}`);
    }

    getOTAsByVersion(args) {
      const ver = encodeURIComponent(String(args.VERSION).trim());
      return apiFetch(`/ota/${ver}`);
    }

    async getLatestSignedOTA(args) {
      const id = encodeURIComponent(String(args.IDENTIFIER).trim());
      const raw = await apiFetch(`/ota/device/${id}`);
      try {
        const data = JSON.parse(raw);
        const firmwares = data.firmwares||[];
        const signed = firmwares.find(f=>f.signed===true);
        return signed
          ? JSON.stringify(signed)
          : JSON.stringify({error: true, message: "No signed OTA found" });
      } catch {
        return JSON.stringify({error: true, message: "Parse error" });
      }
    }

    getReleases() {
      return apiFetch("/releases");
    }

    getiTunesVersions(args) {
      const platform = encodeURIComponent(String(args.PLATFORM).trim());
      return apiFetch(`/itunes/${platform}`);
    }

    rawRequest(args) {
      let path = String(args.PATH).trim();
      if (!path.startsWith("/")) path = "/" + path;
      return apiFetch(path);
    }
  }

  Scratch.extensions.register(new IPSWMeAPI());
Scratch
