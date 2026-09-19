(function (Scratch) {
    "use strict";

    const COLOR_TYPES = ["RGB", "HEX", "HSL", "CMYK", "PMS", "OKLCH"];

    const PMS_COLORS = [
        { name: "PMS 100 C", rgb: [244, 237, 124] },
        { name: "PMS 109 C", rgb: [255, 209, 0] },
        { name: "PMS 165 C", rgb: [255, 103, 31] },
        { name: "PMS 186 C", rgb: [200, 16, 46] },
        { name: "PMS process magenta C", rgb: [214, 0, 114] },
        { name: "PMS 259 C", rgb: [110, 46, 145] },
        { name: "PMS 300 C", rgb: [0, 114, 206] },
        { name: "PMS 320 C", rgb: [0, 150, 136] },
        { name: "PMS 354 C", rgb: [0, 177, 64] },
        { name: "PMS 361 C", rgb: [67, 176, 42] },
        { name: "PMS Black C", rgb: [45, 45, 45] },
        { name: "PMS White C", rgb: [255, 255, 255] }
    ];

    function clamp(value, min = 0, max = 1) {
        return Math.min(max, Math.max(min, value));
    }

    function parseNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function parseRGB(input) {
        const text = String(input ?? "").trim();

        if (!text) {
            return [255, 0, 0];
        }

        if (text.startsWith("#")) {
            let hex = text.slice(1);

            if (hex.length === 3) {
                hex = hex
                    .split("")
                    .map(ch => ch + ch)
                    .join("");
            }

            if (/^[0-9a-fA-F]{6}$/.test(hex)) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16)
                ];
            }
        }

        const rgbMatch = text.match(
            /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)/i
        );

        if (rgbMatch) {
            return [
                parseNumber(rgbMatch[1]),
                parseNumber(rgbMatch[2]),
                parseNumber(rgbMatch[3])
            ];
        }

        const hslMatch = text.match(
            /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)/i
        );

        if (hslMatch) {
            return hslToRGB(
                parseNumber(hslMatch[1]),
                parseNumber(hslMatch[2]),
                parseNumber(hslMatch[3])
            );
        }

        const cmykMatch = text.match(
            /cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i
        );

        if (cmykMatch) {
            return cmykToRGB([
                parseNumber(cmykMatch[1]),
                parseNumber(cmykMatch[2]),
                parseNumber(cmykMatch[3]),
                parseNumber(cmykMatch[4])
            ]);
        }

        const oklchMatch = text.match(
            /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i
        );

        if (oklchMatch) {
            return oklchToRGB(
                parseNumber(oklchMatch[1]) / 100,
                parseNumber(oklchMatch[2]),
                parseNumber(oklchMatch[3])
            );
        }

        const pmsExact = PMS_COLORS.find(
            color =>
                color.name.toLowerCase() ===
                text.toLowerCase()
        );

        if (pmsExact) {
            return pmsExact.rgb;
        }

        const pmsShort = text.match(/^pms\s+(.+)$/i);

        if (pmsShort) {
            const match = PMS_COLORS.find(color =>
                color.name
                    .toLowerCase()
                    .includes(pmsShort[1].toLowerCase())
            );

            if (match) {
                return match.rgb;
            }
        }

        const named = {
            red: [255, 0, 0],
            green: [0, 128, 0],
            blue: [0, 0, 255],
            black: [0, 0, 0],
            white: [255, 255, 255],
            yellow: [255, 255, 0],
            cyan: [0, 255, 255],
            magenta: [255, 0, 255],
            orange: [255, 128, 0],
            purple: [128, 0, 128]
        };

        const mapped = named[text.toLowerCase()];

        if (mapped) {
            return mapped;
        }

        return [255, 0, 0];
    }

    function rgbToHex(rgb) {
        return "#" +
            rgb
                .map(v =>
                    Math.round(v)
                        .toString(16)
                        .padStart(2, "0")
                )
                .join("")
                .toUpperCase();
    }

    function rgbToHSL(rgb) {
        let r = rgb[0] / 255;
        let g = rgb[1] / 255;
        let b = rgb[2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let h = 0;
        let s = 0;

        const l = (max + min) / 2;
        const d = max - min;

        if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));

            switch (max) {
                case r:
                    h = 60 * (((g - b) / d) % 6);
                    break;

                case g:
                    h = 60 * (((b - r) / d) + 2);
                    break;

                case b:
                    h = 60 * (((r - g) / d) + 4);
                    break;
            }
        }

        if (h < 0) {
            h += 360;
        }

        return [
            h,
            s * 100,
            l * 100
        ];
    }

    function hslToRGB(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = clamp(s / 100);
        l = clamp(l / 100);

        const c =
            (1 - Math.abs(2 * l - 1)) * s;

        const x =
            c * (1 - Math.abs((h / 60) % 2 - 1));

        const m = l - c / 2;

        let r = 0;
        let g = 0;
        let b = 0;

        if (h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }

        return [
            r * 255 + m * 255,
            g * 255 + m * 255,
            b * 255 + m * 255
        ];
    }

    function rgbToCMYK(rgb) {
        const r = rgb[0] / 255;
        const g = rgb[1] / 255;
        const b = rgb[2] / 255;

        const k = 1 - Math.max(r, g, b);

        if (k === 1) {
            return [0, 0, 0, 100];
        }

        return [
            ((1 - r - k) / (1 - k)) * 100,
            ((1 - g - k) / (1 - k)) * 100,
            ((1 - b - k) / (1 - k)) * 100,
            k * 100
        ];
    }

    function cmykToRGB(cmyk) {
        const c = clamp(cmyk[0] / 100);
        const m = clamp(cmyk[1] / 100);
        const y = clamp(cmyk[2] / 100);
        const k = clamp(cmyk[3] / 100);

        return [
            255 * (1 - c) * (1 - k),
            255 * (1 - m) * (1 - k),
            255 * (1 - y) * (1 - k)
        ];
    }

    function rgbToOKLCH(rgb) {
        const [r, g, b] =
            rgb.map(v => v / 255);

        const l =
            0.4122214708 * r +
            0.5363325363 * g +
            0.0514459929 * b;

        const m =
            0.2119034982 * r +
            0.6806995451 * g +
            0.1073969566 * b;

        const s =
            0.0883024619 * r +
            0.2817188376 * g +
            0.6299787005 * b;

        const l3 = Math.cbrt(l);
        const m3 = Math.cbrt(m);
        const s3 = Math.cbrt(s);

        const L =
            0.2104542553 * l3 +
            0.793617785 * m3 -
            0.0040720468 * s3;

        const a =
            1.9779984951 * l3 -
            2.428592205 * m3 +
            0.4505937099 * s3;

        const bVal =
            0.0259040371 * l3 +
            0.7827717662 * m3 -
            0.808675766 * s3;

        const C =
            Math.sqrt(a * a + bVal * bVal);

        let H =
            (Math.atan2(bVal, a) * 180) / Math.PI;

        if (H < 0) {
            H += 360;
        }

        return [L, C, H];
    }

    function oklchToRGB(L, C, H) {
        const h =
            (H * Math.PI) / 180;

        const a =
            C * Math.cos(h);

        const bVal =
            C * Math.sin(h);

        const l3 =
            L +
            0.3963377774 * a +
            0.2158037573 * bVal;

        const m3 =
            L -
            0.1055613458 * a -
            0.0638541728 * bVal;

        const s3 =
            L -
            0.0894841775 * a -
            1.291485548 * bVal;

        const l = l3 ** 3;
        const m = m3 ** 3;
        const s = s3 ** 3;

        const rLinear =
            4.0767416621 * l -
            3.3077115913 * m +
            0.2309699292 * s;

        const gLinear =
            -1.2684380046 * l +
            2.6097574013 * m -
            0.3413193965 * s;

        const bLinear =
            -0.0041960863 * l -
            0.7034186147 * m +
            1.707614701 * s;

        function srgb(v) {
            v = clamp(v);

            return v <= 0.0031308
                ? 12.92 * v
                : 1.055 *
                    Math.pow(v, 1 / 2.4) -
                    0.055;
        }

        return [
            srgb(rLinear) * 255,
            srgb(gLinear) * 255,
            srgb(bLinear) * 255
        ];
    }

    function nearestPMS(rgb) {
        let best = PMS_COLORS[0];
        let bestDistance = Infinity;

        for (const pms of PMS_COLORS) {
            const dist =
                (rgb[0] - pms.rgb[0]) ** 2 +
                (rgb[1] - pms.rgb[1]) ** 2 +
                (rgb[2] - pms.rgb[2]) ** 2;

            if (dist < bestDistance) {
                bestDistance = dist;
                best = pms;
            }
        }

        return best.name;
    }

    function formatColor(type, rgb) {
        switch (type) {
            case "RGB":
                return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;

            case "HEX":
                return rgbToHex(rgb);

            case "HSL": {
                const hsl = rgbToHSL(rgb);

                return `hsl(${Math.round(hsl[0])}, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%)`;
            }

            case "CMYK": {
                const cmyk = rgbToCMYK(rgb);

                return `cmyk(${cmyk.map(v => `${Math.round(v)}%`).join(", ")})`;
            }

            case "PMS":
                return nearestPMS(rgb);

            case "OKLCH": {
                const oklch = rgbToOKLCH(rgb);

                return `oklch(${Math.round(oklch[0] * 100)}% ${oklch[1].toFixed(3)} ${Math.round(oklch[2])})`;
            }

            default:
                return rgbToHex(rgb);
        }
    }

    class ColorGalores {
        getInfo() {
            return {
                id: "colorgalores",
                name: "Color Galores",

                color1: "#FF4D4D",
                color2: "#FFB000",
                color3: "#00D4FF",

                blocks: [
                    {
                        opcode: "getColorValue",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Get [TYPE] value of [COLOR]",

                        arguments: {
                            TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "colorTypes"
                            },

                            COLOR: {
                                type: Scratch.ArgumentType.COLOR,
                                defaultValue: "#FF0000"
                            }
                        }
                    },

                    {
                        opcode: "getCanvasColor",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Get [TYPE] value of X [X] and Y [Y]",

                        arguments: {
                            TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "colorTypes"
                            },

                            X: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },

                            Y: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },

                    {
                        opcode: "convertColor",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "Convert [FROM] [COLOR] to [TO]",

                        arguments: {
                            FROM: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "colorTypes"
                            },

                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "#FF0000"
                            },

                            TO: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "colorTypes"
                            }
                        }
                    }
                ],

                menus: {
                    colorTypes: {
                        acceptReporters: false,
                        items: COLOR_TYPES
                    }
                }
            };
        }

        getColorValue({ TYPE, COLOR }) {
            return formatColor(
                TYPE,
                parseRGB(COLOR)
            );
        }

        getCanvasColor({ TYPE, X, Y }) {
            const renderer =
                Scratch.vm &&
                Scratch.vm.renderer;

            if (
                !renderer ||
                typeof renderer.extractColor !== "function"
            ) {
                return "N/A";
            }

            const canvas = renderer.canvas;

            if (!canvas) {
                return "N/A";
            }

            try {
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;

                if (
                    !Number.isFinite(width) ||
                    !Number.isFinite(height) ||
                    width <= 0 ||
                    height <= 0
                ) {
                    return "N/A";
                }

                /*
                 * Scratch/PenguinMod-style coordinates:
                 *
                 * (0, 0) = center
                 * +X = right
                 * -X = left
                 * +Y = up
                 * -Y = down
                 */

                const stageX = parseNumber(X);
                const stageY = parseNumber(Y);

                /*
                 * Convert center-origin coordinates
                 * into top-left canvas coordinates.
                 */
                let x = (width / 2) + stageX;
                let y = (height / 2) - stageY;

                /*
                 * Keep the requested position inside
                 * the canvas.
                 */
                x = Math.max(
                    0,
                    Math.min(width - 1, x)
                );

                y = Math.max(
                    0,
                    Math.min(height - 1, y)
                );

                /*
                 * PenguinMod's renderer needs a
                 * non-zero extraction radius.
                 */
                const extracted =
                    renderer.extractColor(
                        Math.round(x),
                        Math.round(y),
                        1
                    );

                if (
                    !extracted ||
                    !extracted.color
                ) {
                    return "N/A";
                }

                const r =
                    Number(extracted.color.r);

                const g =
                    Number(extracted.color.g);

                const b =
                    Number(extracted.color.b);

                if (
                    !Number.isFinite(r) ||
                    !Number.isFinite(g) ||
                    !Number.isFinite(b)
                ) {
                    return "N/A";
                }

                return formatColor(
                    TYPE,
                    [r, g, b]
                );

            } catch (error) {
                return "N/A";
            }
        }

        convertColor({ FROM, COLOR, TO }) {
            const rgb =
                parseRGB(COLOR);

            return formatColor(
                TO,
                rgb
            );
        }
    }

    Scratch.extensions.register(
        new ColorGalores()
    );
})(Scratch);
