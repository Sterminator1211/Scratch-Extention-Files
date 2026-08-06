import fs from "fs";
import path from "path";

export default function handler(req, res) {

    const root = process.cwd();

    res.status(200).json({

        cwd: root,

        files: fs.readdirSync(root),

        exists: {
            test: fs.existsSync(
                path.join(root, "Extension1")
            )
        }

    });

}
