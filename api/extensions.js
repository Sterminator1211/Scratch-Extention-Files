import fs from "fs";
import path from "path";

const IGNORE = new Set([
    "api",
    ".git",
    ".github",
    ".vercel",
    "node_modules"
]);

export default function handler(req, res) {

    try {

        const root = process.cwd();

        const folders = fs.readdirSync(root, {
            withFileTypes: true
        });

        const extensions = [];

        for (const item of folders) {

            if (!item.isDirectory()) continue;

            if (IGNORE.has(item.name)) continue;

            const folderPath = path.join(root, item.name);

            const files = fs.readdirSync(folderPath);

            if (!files.includes("icon.png")) continue;
            if (!files.includes("config.json")) continue;

            const jsFile = files.find(file =>
                file.toLowerCase().endsWith(".js")
            );

            if (!jsFile) continue;

            try {

                const config = JSON.parse(
                    fs.readFileSync(
                        path.join(folderPath, "config.json"),
                        "utf8"
                    )
                );

                extensions.push({

                    folder: item.name,

                    name: config.name || item.name,

                    description:
                        config.description || "No description provided.",

                    version:
                        config.version || "Unknown",

                    author:
                        config.author || "Unknown",

                    icon:
                        `/${encodeURIComponent(item.name)}/icon.png`,

                    script:
                        `/${encodeURIComponent(item.name)}/${encodeURIComponent(jsFile)}`

                });

            } catch (err) {

                console.log(
                    "Skipping",
                    item.name,
                    err.message
                );

            }

        }

        res.status(200).json(extensions);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

}
