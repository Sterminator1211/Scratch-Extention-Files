import fs from "fs";
import path from "path";

const IGNORE = new Set([
    "api",
    ".git",
    ".github",
    ".vercel",
    "node_modules",
    "___vc"
]);

// Use 1024 bytes per KB.
const toKB = bytes => bytes / 1024;

function fileSize(filePath) {
    try {
        if (!fs.existsSync(filePath)) return 0;

        const stat = fs.statSync(filePath);
        return stat.isFile() ? stat.size : 0;
    } catch {
        return 0;
    }
}

function average(values) {
    if (values.length === 0) return 0;

    return values.reduce(
        (total, value) => total + value,
        0
    ) / values.length;
}

function total(values) {
    return values.reduce(
        (sum, value) => sum + value,
        0
    );
}

function listDirectories(folderPath) {
    try {
        return fs.readdirSync(folderPath, {
            withFileTypes: true
        }).filter(entry => entry.isDirectory());
    } catch {
        return [];
    }
}

function listFiles(folderPath) {
    try {
        return fs.readdirSync(folderPath, {
            withFileTypes: true
        }).filter(entry => entry.isFile())
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

export default function handler(req, res) {
    // CORS headers.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Accept"
    );

    // Handle browser preflight requests.
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    // Only GET requests are supported.
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET, OPTIONS");

        return res.status(405).json({
            error: "Method not allowed. Use GET."
        });
    }

    try {
        const root = process.cwd();

        const iconSizes = [];
        const jsSizes = [];
        const configSizes = [];
        const dllCombinedSizes = [];

        let extensionCount = 0;
        let dllCount = 0;

        const folders = listDirectories(root);

        for (const entry of folders) {
            if (IGNORE.has(entry.name)) continue;

            const extensionPath = path.join(
                root,
                entry.name
            );

            const configPath = path.join(
                extensionPath,
                "config.json"
            );

            // An extension requires a valid config.json
            // and at least one top-level JavaScript file.
            if (!fs.existsSync(configPath)) continue;

            let config;

            try {
                config = JSON.parse(
                    fs.readFileSync(configPath, "utf8")
                );
            } catch {
                continue;
            }

            if (
                !config ||
                typeof config !== "object" ||
                Array.isArray(config)
            ) {
                continue;
            }

            const mainJS = listFiles(extensionPath).find(
                file => file.toLowerCase().endsWith(".js")
            );

            if (!mainJS) continue;

            extensionCount++;

            // Record the extension config size.
            configSizes.push(
                fileSize(configPath)
            );

            // Record the main extension JavaScript size.
            jsSizes.push(
                fileSize(
                    path.join(extensionPath, mainJS)
                )
            );

            // Record the extension icon size, if present.
            const iconPath = path.join(
                extensionPath,
                "icon.png"
            );

            const iconBytes = fileSize(iconPath);

            if (iconBytes > 0) {
                iconSizes.push(iconBytes);
            }

            // Scan DLLs inside this extension's DLLs folder.
            const dllRoot = path.join(
                extensionPath,
                "DLLs"
            );

            for (const dllFolder of listDirectories(dllRoot)) {
                const dllPath = path.join(
                    dllRoot,
                    dllFolder.name
                );

                const dllConfigPath = path.join(
                    dllPath,
                    "config.json"
                );

                if (!fs.existsSync(dllConfigPath)) continue;

                let dllConfig;

                try {
                    dllConfig = JSON.parse(
                        fs.readFileSync(
                            dllConfigPath,
                            "utf8"
                        )
                    );
                } catch {
                    continue;
                }

                if (
                    !dllConfig ||
                    typeof dllConfig !== "object" ||
                    Array.isArray(dllConfig)
                ) {
                    continue;
                }

                const dllJS = listFiles(dllPath).find(
                    file => file.toLowerCase().endsWith(".js")
                );

                if (!dllJS) continue;

                dllCount++;

                // Total size of this DLL:
                // JavaScript + config.json + optional icon.png.
                const dllBytes =
                    fileSize(
                        path.join(dllPath, dllJS)
                    ) +
                    fileSize(dllConfigPath) +
                    fileSize(
                        path.join(dllPath, "icon.png")
                    );

                dllCombinedSizes.push(dllBytes);
            }
        }

        // Generate the response.
        const stats = {
            extensions: {
                count: extensionCount,

                // Average file sizes.
                averageIconSizeKB: Number(
                    toKB(average(iconSizes)).toFixed(2)
                ),

                averageJSTextSizeKB: Number(
                    toKB(average(jsSizes)).toFixed(2)
                ),

                averageConfigSizeKB: Number(
                    toKB(average(configSizes)).toFixed(2)
                ),

                // NEW: Total file sizes across main extensions.
                totalJSTextSizeKB: Number(
                    toKB(total(jsSizes)).toFixed(2)
                ),

                totalConfigSizeKB: Number(
                    toKB(total(configSizes)).toFixed(2)
                ),

                totalIconSizeKB: Number(
                    toKB(total(iconSizes)).toFixed(2)
                )
            },

            dlls: {
                count: dllCount,

                // Average combined size per DLL.
                averageCombinedSizeKB: Number(
                    toKB(average(dllCombinedSizes)).toFixed(2)
                )
            },

            samples: {
                icons: iconSizes.length,
                extensionJSFiles: jsSizes.length,
                extensionConfigFiles: configSizes.length,
                dlls: dllCombinedSizes.length
            },

            units: {
                size: "KB",
                bytesPerKB: 1024,

                extensionTotalsInclude: [
                    "Top-level extension JavaScript files",
                    "Top-level extension config.json files",
                    "Top-level extension icon.png files"
                ],

                dllSizeIncludes: [
                    "JavaScript file",
                    "config.json",
                    "icon.png if present"
                ]
            }
        };

        res.setHeader("Cache-Control", "no-store");

        return res.status(200).json(stats);

    } catch (error) {
        console.error("Stats API error:", error);

        return res.status(500).json({
            error: "Failed to calculate repository statistics."
        });
    }
}
