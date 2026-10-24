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

const ROOT = process.cwd();

// Encode each URL path segment independently.
function makeURL(...segments) {
    return "/" + segments
        .map(segment => encodeURIComponent(String(segment)))
        .join("/");
}

function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch {
        return false;
    }
}

function readJSON(filePath) {
    try {
        if (!isFile(filePath)) return null;

        const contents = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(contents);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
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
        })
            .filter(entry => entry.isFile())
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

function findExtensionScript(folderPath, config) {
    // Prefer the configured filename, including non-JS extensions.
    if (
        typeof config.file_name === "string" &&
        config.file_name.trim() !== ""
    ) {
        const configuredName = config.file_name.trim();

        // Extension scripts must be files in the extension's root.
        if (path.basename(configuredName) === configuredName) {
            const configuredPath = path.join(
                folderPath,
                configuredName
            );

            if (isFile(configuredPath)) {
                return configuredName;
            }
        }
    }

    // Backward-compatible fallback: first top-level .js file.
    return listFiles(folderPath).find(
        file => file.toLowerCase().endsWith(".js")
    ) || null;
}

function dllIsEnabled(config) {
    return (
        config.dll_available === true ||
        String(config.dll_available).trim().toLowerCase() === "true"
    );
}

function findDLLs(extensionFolder, extensionName) {
    const dllRoot = path.join(extensionFolder, "DLLs");

    const dllFolders = listDirectories(dllRoot);
    const dlls = [];

    for (const entry of dllFolders) {
        const dllFolderPath = path.join(
            dllRoot,
            entry.name
        );

        const configPath = path.join(
            dllFolderPath,
            "config.json"
        );

        const config = readJSON(configPath);

        // Each DLL needs a valid config.json.
        if (!config) continue;

        // DLLs use a JavaScript file in their own folder.
        const jsFile = listFiles(dllFolderPath).find(
            file => file.toLowerCase().endsWith(".js")
        );

        if (!jsFile) continue;

        const iconPath = path.join(
            dllFolderPath,
            "icon.png"
        );

        const hasIcon = isFile(iconPath);

        dlls.push({
            folder: entry.name,

            title: config.title || entry.name,
            version: config.version || "",

            file_name: jsFile,

            script: makeURL(
                extensionName,
                "DLLs",
                entry.name,
                jsFile
            ),

            icon: hasIcon
                ? makeURL(
                    extensionName,
                    "DLLs",
                    entry.name,
                    "icon.png"
                )
                : "/defaultDLL.png"
        });
    }

    return dlls;
}

function discoverExtensions() {
    const directories = listDirectories(ROOT);
    const extensions = [];

    for (const entry of directories) {
        if (IGNORE.has(entry.name)) continue;

        const folderName = entry.name;

        const extensionPath = path.join(
            ROOT,
            folderName
        );

        const configPath = path.join(
            extensionPath,
            "config.json"
        );

        const config = readJSON(configPath);

        // An extension must have a valid config.json.
        if (!config) continue;

        const scriptFile = findExtensionScript(
            extensionPath,
            config
        );

        // Skip folders without a usable extension script.
        if (!scriptFile) continue;

        const iconPath = path.join(
            extensionPath,
            "icon.png"
        );

        const hasIcon = isFile(iconPath);

        const dllAvailable = dllIsEnabled(config);

        const extension = {
            folder: folderName,

            name: config.name || folderName,
            description: config.description || "",
            longdescription: config.longdescription || "",

            version: config.version || "",
            author: config.author || "",

            state: config.state || "Stable",
            statecolor: config.statecolor || "#486586",

            // Empty type means an ordinary extension.
            type: config.type || "",

            file_name: scriptFile,

            script: makeURL(
                folderName,
                scriptFile
            ),

            icon: hasIcon
                ? makeURL(folderName, "icon.png")
                : "/default-icon.png",

            // Preserve the configured value for compatibility.
            dll_available: config.dll_available ?? false,

            // Discover DLLs only when DLL support is enabled.
            dlls: dllAvailable
                ? findDLLs(extensionPath, folderName)
                : []
        };

        extensions.push(extension);
    }

    // Keep the API response in a stable alphabetical order.
    extensions.sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return extensions;
}

export default function handler(req, res) {
    // CORS: allow browser-based clients from other origins.
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Accept"
    );

    // Respond to browser CORS preflight requests.
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    // Only GET is supported for fetching extension information.
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET, OPTIONS");

        return res.status(405).json({
            error: "Method not allowed. Use GET."
        });
    }

    try {
        const extensions = discoverExtensions();

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        return res.status(200).json(extensions);

    } catch (error) {
        console.error(
            "Extensions API error:",
            error
        );

        return res.status(500).json({
            error: "Failed to discover extensions."
        });
    }
}
