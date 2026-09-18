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


/* ============================= */
/* Find DLLs */
/* ============================= */

function findDLLs(extensionPath) {

    const dllsPath =
        path.join(
            extensionPath,
            "DLLs"
        );


    /*
     * DLLs folder does not exist.
     */

    if (
        !fs.existsSync(dllsPath) ||
        !fs.statSync(dllsPath).isDirectory()
    ) {
        return [];
    }


    const entries =
        fs.readdirSync(
            dllsPath,
            {
                withFileTypes: true
            }
        );


    const dlls = [];


    for (const entry of entries) {

        /*
         * Every DLL is represented by
         * its own folder.
         */

        if (!entry.isDirectory()) {
            continue;
        }


        const dllFolderName =
            entry.name;


        const dllPath =
            path.join(
                dllsPath,
                dllFolderName
            );


        const configPath =
            path.join(
                dllPath,
                "config.json"
            );


        /*
         * DLL must have config.json.
         */

        if (!fs.existsSync(configPath)) {
            continue;
        }


        let config;


        try {

            config =
                JSON.parse(
                    fs.readFileSync(
                        configPath,
                        "utf8"
                    )
                );

        } catch (error) {

            console.error(
                `Invalid DLL config in ${dllFolderName}:`,
                error
            );

            continue;

        }


        /*
         * Find the DLL's JS file.
         */

        const files =
            fs.readdirSync(
                dllPath
            );


        const jsFile =
            files.find(
                file =>
                    file
                        .toLowerCase()
                        .endsWith(".js")
            );


        /*
         * DLL must have a JS file.
         */

        if (!jsFile) {
            continue;
        }


        /*
         * title and version come
         * directly from the DLL config.
         */

        const title =
            config.title ||
            dllFolderName;


        const version =
            config.version ||
            "Unknown";


        const encodedFolder =
            encodeURIComponent(
                dllFolderName
            );


        const encodedJS =
            encodeURIComponent(
                jsFile
            );


        dlls.push({

            folder:
                dllFolderName,

            title:
                title,

            version:
                version,

            file:
                jsFile,

            script:
                `/${encodeURIComponent(
                    path.basename(extensionPath)
                )}/DLLs/${encodedFolder}/${encodedJS}`

        });

    }


    /*
     * Sort DLLs alphabetically.
     */

    dlls.sort(
        (a, b) =>
            a.title.localeCompare(
                b.title
            )
    );


    return dlls;

}


/* ============================= */
/* API Handler */
/* ============================= */

export default function handler(
    req,
    res
) {

    try {

        const root =
            process.cwd();


        const entries =
            fs.readdirSync(
                root,
                {
                    withFileTypes: true
                }
            );


        const extensions = [];


        for (const entry of entries) {

            /*
             * Only inspect folders.
             */

            if (!entry.isDirectory()) {
                continue;
            }


            /*
             * Ignore internal folders.
             */

            if (
                IGNORE.has(
                    entry.name
                )
            ) {
                continue;
            }


            const folderName =
                entry.name;


            const folderPath =
                path.join(
                    root,
                    folderName
                );


            const configPath =
                path.join(
                    folderPath,
                    "config.json"
                );


            /*
             * config.json is required.
             */

            if (
                !fs.existsSync(
                    configPath
                )
            ) {
                continue;
            }


            let config;


            try {

                config =
                    JSON.parse(
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


            const files =
                fs.readdirSync(
                    folderPath
                );


            /*
             * Find the main extension JS file.
             */

            const jsFile =
                files.find(
                    file =>
                        file
                            .toLowerCase()
                            .endsWith(".js")
                );


            /*
             * JS file is required.
             */

            if (!jsFile) {
                continue;
            }


            /*
             * Icon is optional.
             */

            const iconPath =
                path.join(
                    folderPath,
                    "icon.png"
                );


            const hasIcon =
                fs.existsSync(
                    iconPath
                );


            /*
             * Main extension information.
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
             * DLL availability.
             *
             * The requested format is:
             *
             * "dll_available": "true"
             */

            const dllAvailable =
                config.dll_available === "true";


            /*
             * Only scan DLLs when the
             * extension says they are available.
             */

            const dlls =
                dllAvailable
                    ? findDLLs(
                        folderPath
                    )
                    : [];


            const encodedFolder =
                encodeURIComponent(
                    folderName
                );


            const encodedJS =
                encodeURIComponent(
                    jsFile
                );


            extensions.push({

                folder:
                    folderName,

                name:
                    name,

                description:
                    description,

                longdescription:
                    longdescription,

                version:
                    version,

                author:
                    author,

                state:
                    state,

                statecolor:
                    statecolor,

                type:
                    type,

                dll_available:
                    dllAvailable,

                dlls:
                    dlls,

                icon:
                    hasIcon
                        ? `/${encodedFolder}/icon.png`
                        : "/default-icon.png",

                script:
                    `/${encodedFolder}/${encodedJS}`

            });

        }


        /*
         * Alphabetical ordering.
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

            error:
                "Failed to load extensions."

        });

    }

}
