// Name: OWM API Fetcher
// ID: owmapifetcher
// Description: Get public IP, location, and weather data (OpenWeatherMap) with configurable units and air quality.
// By: converted from the provided Bash script
// License: MIT

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("OWM API Fetcher extension must run unsandboxed.");
  }

  // Hardcoded free IPinfo token from the original script
  const IPINFO_TOKEN = "85a82d4b3659ce";

  class OwmApiFetcher {
    constructor() {
      // Preferences (replaces config.json)
      this.owmKey = "";
      this.ipifyKey = ""; // optional
      this.tempUnit = "fahrenheit"; // "fahrenheit" | "celsius"
      this.windUnit = "mph"; // "mph" | "kmh"
      this.showPm10 = false;
      this.showPm25 = false;

      // Cached data
      this.ip = "";
      this.city = "Unknown";
      this.region = "Unknown";
      this.country = "Unknown";
      this.lat = "";
      this.lon = "";
      this.temp = "N/A";
      this.feelsLike = "N/A";
      this.humidity = "N/A";
      this.wind = "N/A";
      this.condition = "Unknown";
      this.wmoCode = 0;
      this.pm10 = "N/A";
      this.pm25 = "N/A";
      this.lastError = "";
      this.dataReady = false;
    }

    getInfo() {
      return {
        id: "owmapifetcher",
        name: "OWM API Fetcher",
        color1: "#1E88E5",
        color2: "#1565C0",
        color3: "#0D47A1",
        blocks: [
          // ── API Key ──────────────────────────────────────────────
          {
            opcode: "setApiKey",
            blockType: Scratch.BlockType.COMMAND,
            text: "set OpenWeatherMap API key to [KEY]",
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "your_owm_api_key_here"
              }
            }
          },
          {
            opcode: "setIpifyKey",
            blockType: Scratch.BlockType.COMMAND,
            text: "set IPify API key (optional) to [KEY]",
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              }
            }
          },
          "---",
          // ── Preferences ──────────────────────────────────────────
          {
            opcode: "setTempUnit",
            blockType: Scratch.BlockType.COMMAND,
            text: "set temperature unit to [UNIT]",
            arguments: {
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: "tempUnits"
              }
            }
          },
          {
            opcode: "setWindUnit",
            blockType: Scratch.BlockType.COMMAND,
            text: "set wind speed unit to [UNIT]",
            arguments: {
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: "windUnits"
              }
            }
          },
          {
            opcode: "setShowPm10",
            blockType: Scratch.BlockType.COMMAND,
            text: "show PM10 air quality [BOOL]",
            arguments: {
              BOOL: {
                type: Scratch.ArgumentType.STRING,
                menu: "onOff"
              }
            }
          },
          {
            opcode: "setShowPm25",
            blockType: Scratch.BlockType.COMMAND,
            text: "show PM2.5 air quality [BOOL]",
            arguments: {
              BOOL: {
                type: Scratch.ArgumentType.STRING,
                menu: "onOff"
              }
            }
          },
          "---",
          // ── Fetch ────────────────────────────────────────────────
          {
            opcode: "refreshData",
            blockType: Scratch.BlockType.COMMAND,
            text: "refresh environment data"
          },
          {
            opcode: "isDataReady",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "environment data ready?"
          },
          {
            opcode: "getLastError",
            blockType: Scratch.BlockType.REPORTER,
            text: "last error"
          },
          "---",
          // ── Network / Location reporters ─────────────────────────
          {
            opcode: "getIp",
            blockType: Scratch.BlockType.REPORTER,
            text: "public IP"
          },
          {
            opcode: "getLocation",
            blockType: Scratch.BlockType.REPORTER,
            text: "location"
          },
          {
            opcode: "getCity",
            blockType: Scratch.BlockType.REPORTER,
            text: "city"
          },
          {
            opcode: "getRegion",
            blockType: Scratch.BlockType.REPORTER,
            text: "region"
          },
          {
            opcode: "getCountry",
            blockType: Scratch.BlockType.REPORTER,
            text: "country"
          },
          {
            opcode: "getLatitude",
            blockType: Scratch.BlockType.REPORTER,
            text: "latitude"
          },
          {
            opcode: "getLongitude",
            blockType: Scratch.BlockType.REPORTER,
            text: "longitude"
          },
          "---",
          // ── Weather reporters ────────────────────────────────────
          {
            opcode: "getCondition",
            blockType: Scratch.BlockType.REPORTER,
            text: "condition"
          },
          {
            opcode: "getWmoCode",
            blockType: Scratch.BlockType.REPORTER,
            text: "WMO code"
          },
          {
            opcode: "getTemp",
            blockType: Scratch.BlockType.REPORTER,
            text: "current temperature"
          },
          {
            opcode: "getFeelsLike",
            blockType: Scratch.BlockType.REPORTER,
            text: "feels like"
          },
          {
            opcode: "getHumidity",
            blockType: Scratch.BlockType.REPORTER,
            text: "humidity %"
          },
          {
            opcode: "getWindSpeed",
            blockType: Scratch.BlockType.REPORTER,
            text: "wind speed"
          },
          {
            opcode: "getWindUnitLabel",
            blockType: Scratch.BlockType.REPORTER,
            text: "wind unit label"
          },
          {
            opcode: "getTempUnitLabel",
            blockType: Scratch.BlockType.REPORTER,
            text: "temperature unit label"
          },
          "---",
          // ── Air quality ──────────────────────────────────────────
          {
            opcode: "getPm10",
            blockType: Scratch.BlockType.REPORTER,
            text: "PM10 μg/m³"
          },
          {
            opcode: "getPm25",
            blockType: Scratch.BlockType.REPORTER,
            text: "PM2.5 μg/m³"
          },
          "---",
          // ── Convenience ──────────────────────────────────────────
          {
            opcode: "getFullReport",
            blockType: Scratch.BlockType.REPORTER,
            text: "full environment report (text)"
          }
        ],
        menus: {
          tempUnits: {
            acceptReporters: true,
            items: [
              { text: "fahrenheit", value: "fahrenheit" },
              { text: "celsius", value: "celsius" }
            ]
          },
          windUnits: {
            acceptReporters: true,
            items: [
              { text: "mph", value: "mph" },
              { text: "km/h", value: "kmh" }
            ]
          },
          onOff: {
            acceptReporters: true,
            items: [
              { text: "on", value: "true" },
              { text: "off", value: "false" }
            ]
          }
        }
      };
    }

    // ── Preference / Key setters ─────────────────────────────────
    setApiKey(args) {
      this.owmKey = String(args.KEY || "").trim();
    }

    setIpifyKey(args) {
      this.ipifyKey = String(args.KEY || "").trim();
    }

    setTempUnit(args) {
      const u = String(args.UNIT || "").toLowerCase();
      this.tempUnit = u === "celsius" ? "celsius" : "fahrenheit";
    }

    setWindUnit(args) {
      const u = String(args.UNIT || "").toLowerCase();
      this.windUnit = u === "kmh" || u === "km/h" ? "kmh" : "mph";
    }

    setShowPm10(args) {
      this.showPm10 = String(args.BOOL).toLowerCase() === "true" || args.BOOL === true;
    }

    setShowPm25(args) {
      this.showPm25 = String(args.BOOL).toLowerCase() === "true" || args.BOOL === true;
    }

    // ── Core data fetch ──────────────────────────────────────────
    async refreshData() {
      this.dataReady = false;
      this.lastError = "";

      if (!this.owmKey) {
        this.lastError = "OpenWeatherMap API key is missing. Use the 'set OpenWeatherMap API key' block first.";
        return;
      }

      try {
        // 1. Public IP
        let ipUrl = "https://api.ipify.org";
        if (this.ipifyKey) {
          ipUrl += `?format=text&key=${encodeURIComponent(this.ipifyKey)}`;
        }
        const ipRes = await fetch(ipUrl);
        if (!ipRes.ok) throw new Error("Could not retrieve IP address from IPify");
        this.ip = (await ipRes.text()).trim();
        if (!this.ip) throw new Error("Empty IP address returned");

        // 2. Geo from IPinfo
        const geoRes = await fetch(`https://ipinfo.io/${this.ip}?token=${IPINFO_TOKEN}`);
        if (!geoRes.ok) throw new Error("Could not retrieve coordinates from IPinfo");
        const geo = await geoRes.json();

        const loc = (geo.loc || "").split(",");
        this.lat = loc[0] || "";
        this.lon = loc[1] || "";
        this.city = geo.city || "Unknown";
        this.region = geo.region || "Unknown";
        this.country = geo.country || "Unknown";

        if (!this.lat || !this.lon) {
          throw new Error("Could not retrieve coordinates from IPinfo");
        }

        // 3. OpenWeatherMap current weather
        const owmUnits = this.tempUnit === "fahrenheit" ? "imperial" : "metric";
        const weatherUrl =
          `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lon}` +
          `&units=${owmUnits}&appid=${encodeURIComponent(this.owmKey)}`;

        const weatherRes = await fetch(weatherUrl);
        const weather = await weatherRes.json();

        if (String(weather.cod) !== "200") {
          throw new Error(weather.message || "OpenWeatherMap error");
        }

        this.temp = weather.main?.temp ?? "N/A";
        this.feelsLike = weather.main?.feels_like ?? "N/A";
        this.humidity = weather.main?.humidity ?? "N/A";
        let windSpeed = weather.wind?.speed ?? "N/A";

        // Convert m/s → km/h if requested
        if (this.windUnit === "kmh" && owmUnits === "metric" && windSpeed !== "N/A") {
          windSpeed = Math.round(Number(windSpeed) * 3.6 * 100) / 100;
        }
        this.wind = windSpeed;

        const owmId = weather.weather?.[0]?.id ?? 0;
        this.wmoCode = this.mapOwmToWmo(owmId);
        this.condition = this.wmoToText(this.wmoCode);

        // 4. Air quality (optional)
        this.pm10 = "N/A";
        this.pm25 = "N/A";
        if (this.showPm10 || this.showPm25) {
          const aqUrl =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${this.lat}&lon=${this.lon}` +
            `&appid=${encodeURIComponent(this.owmKey)}`;
          const aqRes = await fetch(aqUrl);
          const aq = await aqRes.json();
          const components = aq.list?.[0]?.components || {};
          if (this.showPm10) this.pm10 = components.pm10 ?? "N/A";
          if (this.showPm25) this.pm25 = components.pm2_5 ?? "N/A";
        }

        this.dataReady = true;
      } catch (err) {
        this.lastError = err.message || String(err);
        this.dataReady = false;
      }
    }

    // ── Mapping helpers (copied from the Bash script) ────────────
    mapOwmToWmo(owmId) {
      const id = Number(owmId);
      if (id === 800) return 0;
      if (id === 801) return 1;
      if (id === 802) return 2;
      if (id === 803 || id === 804) return 3;
      if (id === 741) return 45;
      if ([300, 301, 310].includes(id)) return 51;
      if ([302, 311, 312].includes(id)) return 53;
      if ([313, 314, 321].includes(id)) return 55;
      if ([500, 520].includes(id)) return 61;
      if ([501, 521].includes(id)) return 63;
      if ([502, 503, 504, 522, 531].includes(id)) return 65;
      if (id === 511) return 66;
      if ([600, 620].includes(id)) return 71;
      if ([601, 621].includes(id)) return 73;
      if ([602, 622].includes(id)) return 75;
      if ([611, 612, 613, 615, 616].includes(id)) return 77;
      if ([200, 201, 210, 211].includes(id)) return 95;
      if ([202, 230, 231, 232].includes(id)) return 96;
      return 0;
    }

    wmoToText(code) {
      const c = Number(code);
      switch (c) {
        case 0: return "Clear sky";
        case 1:
        case 2:
        case 3: return "Mainly clear / Partly cloudy";
        case 19: return "# WARNING # : FUNNEL CLOUDS";
        case 35: return "! DANGEROUS ! : SANDSTORM";
        case 45:
        case 48: return "Foggy / Depositing rime fog";
        case 51: return "Drizzle (Light)";
        case 53: return "Drizzle (Moderate)";
        case 55: return "Drizzle (Dense)";
        case 56:
        case 57: return "Freezing Drizzle";
        case 61: return "Rain (Slight)";
        case 63: return "Rain (Moderate)";
        case 65: return "Rain (Heavy)";
        case 66:
        case 67: return "Freezing Rain";
        case 71: return "Snow fall (Slight)";
        case 73: return "Snow Fall (Moderate)";
        case 75: return "Snow Fall (Heavy)";
        case 77: return "Snow grains";
        case 80:
        case 81: return "Rain showers";
        case 82: return "Violent Rain Showers";
        case 85:
        case 86: return "Snow showers";
        case 95: return "Thunderstorm";
        case 96: return "Thunderstorm w/ hail";
        case 98: return "! DANGEROUS ! : THUNDERSTORM & SANDSTORM";
        case 99: return "! DANGEROUS ! : Heavy Thunderstorm w/ hail";
        default: return `Unknown Code (${c})`;
      }
    }

    // ── Simple reporters ─────────────────────────────────────────
    isDataReady() {
      return this.dataReady;
    }

    getLastError() {
      return this.lastError || "";
    }

    getIp() {
      return this.ip || "";
    }

    getLocation() {
      return `${this.city}, ${this.region} (${this.country})`;
    }

    getCity() {
      return this.city;
    }

    getRegion() {
      return this.region;
    }

    getCountry() {
      return this.country;
    }

    getLatitude() {
      return this.lat;
    }

    getLongitude() {
      return this.lon;
    }

    getCondition() {
      return this.condition;
    }

    getWmoCode() {
      return this.wmoCode;
    }

    getTemp() {
      return this.temp;
    }

    getFeelsLike() {
      return this.feelsLike;
    }

    getHumidity() {
      return this.humidity;
    }

    getWindSpeed() {
      return this.wind;
    }

    getWindUnitLabel() {
      if (this.windUnit === "kmh") return "km/h";
      if (this.tempUnit === "fahrenheit") return "mph";
      return "m/s";
    }

    getTempUnitLabel() {
      return this.tempUnit === "fahrenheit" ? "°F" : "°C";
    }

    getPm10() {
      return this.pm10;
    }

    getPm25() {
      return this.pm25;
    }

    getFullReport() {
      if (!this.dataReady) {
        return this.lastError || "Data not ready. Run 'refresh environment data' first.";
      }

      const lines = [
        "ENVIRONMENT REPORT",
        `Public IP: ${this.ip}`,
        `Location: ${this.city}, ${this.region} (${this.country})`,
        `Coordinates: ${this.lat}, ${this.lon}`,
        `Condition: ${this.condition}  -=-  WMO Code : ${this.wmoCode}`,
        `Current Temp: ${this.temp}${this.getTempUnitLabel()}`,
        `Feels Like: ${this.feelsLike}${this.getTempUnitLabel()}`,
        `Humidity: ${this.humidity}%`,
        `Wind Speed: ${this.wind}${this.getWindUnitLabel()}`
      ];

      if (this.showPm10) {
        lines.push(`PM10 Air Qual: ${this.pm10} μg/m³`);
      }
      if (this.showPm25) {
        lines.push(`PM2.5 Air Qual: ${this.pm25} μg/m³`);
      }

      return lines.join("\n");
    }
  }

  Scratch.extensions.register(new OwmApiFetcher());
})(Scratch);
