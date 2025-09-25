const fs = require("fs")
const path = require("path")

class LocalliumFileManager {
    static exists(filepath) {
        const dirs = path.dirname(filepath).split(path.sep)
        let adir = ""
        for (const dir of dirs) {
            if (!fs.existsSync(path.join(adir, dir))) {
                return false
            }
            adir = path.join(adir, dir)
        }
        return fs.existsSync(filepath)
    }
    static createifnotexists(filepath, value = "{}") {
        const dir = path.dirname(filepath)
        fs.mkdirSync(dir, { recursive: true })
        if (!fs.existsSync(filepath)) {
            fs.writeFileSync(filepath, value, { encoding: "utf8" })
            return true
        }

        return false
    }
}

module.exports = LocalliumFileManager
