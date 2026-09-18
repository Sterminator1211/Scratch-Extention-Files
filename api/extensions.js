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


    if (
        !fs.existsSync(dllsPath) ||
        !fs.statSync(dllsPath).isDirectory()
    ) {
        return [];
    }


    const extensionFolderName =
        path.basename(extensionPath);


    const entries =
        fs.readdirSync(
            dllsPath,
            {
                withFileTypes: true
            }
        );


    const dlls = [];


    for (const entry of entries) {

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


        if (!jsFile) {
            continue;
        }


        /*
         * DLL icon:
         *
         * DLL folder/icon.png
         *      ↓
         * otherwise
         * /defaultDLL.png
         */

        const dllIconPath =
            path.join(
                dllPath,
                "icon.png"
            );


        const hasDLLIcon =
            fs.existsSync(
                dllIconPath
            );


        const encodedExtensionFolder =
            encodeURIComponent(
                extensionFolderName
            );


        const encodedDLLFolder =
            encodeURIComponent(
                dllFolderName
            );


        const encodedJS =
            encodeURIComponent(
                jsFile
            );


        const icon =
            hasDLLIcon
                ? `/${encodedExtensionFolder}/DLLs/${encodedDLLFolder}/icon.png`
                : "/defaultDLL.png";


        const script =
            `/${encodedExtensionFolder}/DLLs/${encodedDLLFolder}/${encodedJS}`;


        dlls.push({

            folder:
                dllFolderName,

            title:
                config.title ||
                dllFolderName,

            version:
                config.version ||
                "Unknown",

            file:
                jsFile,

            icon:
                icon,

            script:
                script

        });

    }


    dlls.sort(
        (a, b) =>
            a.title.localeCompare(
                b.title
            )
    );


    return dlls;

}


/* ============================= */
/* Main API Handler */
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

            if (!entry.isDirectory()) {
                continue;
            }


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


            const jsFile =
                files.find(
                    file =>
                        file
                            .toLowerCase()
                            .endsWith(".js")
                );


            if (!jsFile) {
                continue;
            }


            /*
             * Main extension icon.
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
             * Metadata defaults.
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
             */

            const dllAvailable =
                config.dll_available ===
                "true";


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
