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

            // Only look at folders
            if (!item.isDirectory()) {
                continue;
            }

            // Ignore Vercel/system folders
            if (IGNORE.has(item.name)) {
                continue;
            }

            const folderPath = path.join(root, item.name);

            let files;

            try {

                files = fs.readdirSync(folderPath);

            } catch (error) {

                console.log(
                    `Could not read folder ${item.name}:`,
                    error.message
                );

                continue;

            }

            // config.json is required
            if (!files.includes("config.json")) {
                continue;
            }

            // Find the JavaScript file
            const jsFile = files.find(file =>
                file.toLowerCase().endsWith(".js")
            );

            // A JavaScript file is required
            if (!jsFile) {
                continue;
            }

            let config;

            try {

                config = JSON.parse(
                    fs.readFileSync(
                        path.join(folderPath, "config.json"),
                        "utf8"
                    )
                );

            } catch (error) {

                console.log(
                    `Invalid config.json in ${item.name}:`,
                    error.message
                );

                continue;

            }

            /*
             * icon.png is optional.
             *
             * If it doesn't exist, the frontend will
             * use the default icon.
             */
            const hasIcon = files.includes("icon.png");

            extensions.push({

                folder: item.name,

                name:
                    config.name ||
                    item.name,

                description:
                    config.description ||
                    "No description provided.",

                longdescription:
                    config.longdescription ||
                    config.description ||
                    "No description provided.",

                version:
                    config.version ||
                    "Unknown",

                author:
                    config.author ||
                    "Unknown",

                icon:
                    hasIcon
                        ? `/${encodeURIComponent(item.name)}/icon.png`
                        : "/default-icon.png",

                script:
                    `/${encodeURIComponent(item.name)}/${encodeURIComponent(jsFile)}`

            });

        }

        // Sort alphabetically
        extensions.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        res.status(200).json(extensions);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to load extensions."
        });

    }

}
