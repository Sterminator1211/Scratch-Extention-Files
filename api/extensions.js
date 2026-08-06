import fs from "fs";
import path from "path";

const IGNORE = new Set([
    "api",
    ".git",
    ".github",
    ".vercel",
    "node_modules",
    "public",
    "assets"
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

            const folder = path.join(root, item.name);

            const files = fs.readdirSync(folder);

            if (!files.includes("config.json")) continue;
            if (!files.includes("icon.png")) continue;

            const jsFile = files.find(file =>
                file.toLowerCase().endsWith(".js")
            );

            if (!jsFile) continue;

            let config;

            try {

                config = JSON.parse(
                    fs.readFileSync(
                        path.join(folder, "config.json"),
                        "utf8"
                    )
                );

            } catch {

                continue;

            }

            extensions.push({

                folder: item.name,

                name: config.name ?? item.name,

                description: config.description ?? "",

                version: config.version ?? "Unknown",

                author: config.author ?? "Unknown",

                icon: `/${item.name}/icon.png`,

                script: `/${item.name}/${jsFile}`

            });

        }

        extensions.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        res.status(200).json(extensions);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

}
