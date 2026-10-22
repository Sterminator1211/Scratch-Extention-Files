
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
        return fs.readdirSync(folderPath);
    } catch {
        return [];
    }
}

export default function handler(req, res) {
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

            // Extension config size.
            configSizes.push(fileSize(configPath));

            // Main extension JS size.
            jsSizes.push(
                fileSize(path.join(extensionPath, mainJS))
            );

            // Count extension icons only when present.
            const iconPath = path.join(
                extensionPath,
                "icon.png"
            );

            if (fs.existsSync(iconPath)) {
                const size = fileSize(iconPath);

                if (size > 0) {
                    iconSizes.push(size);
                }
            }

            // DLLs are scanned only inside DLLs/.
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
                        fs.readFileSync(dllConfigPath, "utf8")
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

                // Total size of this DLL's JS, config,
                // and optional icon, in bytes.
                const dllBytes =
                    fileSize(path.join(dllPath, dllJS)) +
                    fileSize(dllConfigPath) +
                    fileSize(path.join(dllPath, "icon.png"));

                dllCombinedSizes.push(dllBytes);
            }
        }

        const stats = {
            extensions: {
                count: extensionCount,
                averageIconSizeKB: Number(
                    toKB(average(iconSizes)).toFixed(2)
                ),
                averageJSTextSizeKB: Number(
                    toKB(average(jsSizes)).toFixed(2)
                ),
                averageConfigSizeKB: Number(
                    toKB(average(configSizes)).toFixed(2)
                )
            },

            dlls: {
                count: dllCount,
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
                dllSizeIncludes: [
                    "JavaScript file",
                    "config.json",
                    "icon.png if present"
                ]
            }
        };

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        res.status(200).json(stats);

    } catch (error) {
        console.error("Stats API error:", error);

        res.status(500).json({
            error: "Failed to calculate repository statistics."
        });
    }
}
