const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
    try {
        const cwd = process.cwd();

        const entries = fs.readdirSync(cwd, {
            withFileTypes: true
        });

        const extensions = [];

        for (const entry of entries) {

            /*
             * Only inspect folders.
             */
            if (!entry.isDirectory()) {
                continue;
            }

            /*
             * Ignore Vercel/internal folders.
             */
            if (
                entry.name === "api" ||
                entry.name === ".git" ||
                entry.name === ".vercel" ||
                entry.name === "node_modules" ||
                entry.name === "___vc"
            ) {
                continue;
            }

            const folderName = entry.name;
            const folderPath = path.join(
                cwd,
                folderName
            );

            const configPath = path.join(
                folderPath,
                "config.json"
            );

            /*
             * A folder must contain config.json
             * to be considered an extension.
             */
            if (!fs.existsSync(configPath)) {
                continue;
            }

            let config;

            try {
                config = JSON.parse(
                    fs.readFileSync(
                        configPath,
                        "utf8"
                    )
                );
            } catch (error) {
                console.error(
                    `Could not read ${folderName}/config.json:`,
                    error
                );

                continue;
            }

            /*
             * Find the JavaScript file.
             */
            const files = fs.readdirSync(
                folderPath
            );

            const jsFile = files.find(
                file =>
                    file.toLowerCase().endsWith(".js")
            );

            /*
             * If there is no JS file,
             * don't show the folder.
             */
            if (!jsFile) {
                continue;
            }

            /*
             * Check for icon.png.
             */
            const iconPath = path.join(
                folderPath,
                "icon.png"
            );

            const hasIcon =
                fs.existsSync(iconPath);

            /*
             * Defaults.
             */
            const name =
                config.name ||
                folderName;

            const description =
                config.description ||
                "No description provided.";

            const longdescription =
                config.longdescription ||
                description;

            const version =
                config.version ||
                "Unknown";

            const author =
                config.author ||
                "Unknown";

            const state =
                config.state ||
                "Stable";

            const statecolor =
                config.statecolor ||
                "#486586";

            const type =
                config.type ||
                "extension";

            /*
             * Encode path components so folders/files
             * containing spaces or special characters work.
             */
            const encodedFolder =
                encodeURIComponent(folderName);

            const encodedJS =
                encodeURIComponent(jsFile);

            extensions.push({

                folder: folderName,

                name: name,

                description: description,

                longdescription:
                    longdescription,

                version: version,

                author: author,

                state: state,

                statecolor: statecolor,

                type: type,

                icon:
                    hasIcon
                        ? `/${encodedFolder}/icon.png`
                        : "/default-icon.png",

                script:
                    `/${encodedFolder}/${encodedJS}`

            });
        }

        /*
         * Keep the results in alphabetical order.
         */
        extensions.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

        res.status(200).json(
            extensions
        );

    } catch (error) {

        console.error(
            "Extension API error:",
            error
        );

        res.status(500).json({
            error: "Failed to load extensions."
        });
    }
};
