const fs = require("fs")
const typeofKeys = ["string", "boolean", "number", "bigint", "function", "undefined", "object", "symbol"]

/**
 * `Database#get()` snapshot
 * @typedef {Object} LocalliumSnapshot
 * @property {boolean} exist
 * @property {any} val
 */

/**
 * @typedef {"getAdvancedWarns" | "createDatabaseFileOnReadIfDoesntExist" | "setValueToDatabaseFileOnReadIfDoesntExist" | "continueSettingThePathIfValueIsNull" | "keepEmptyKeysWhileDeleting" | "keySeparator" | "jsonSpaces" | "alwaysThrowErrorsNoMatterWhat" | "checkFileExistFrom"} DatabaseFlagsNames
 */

/**
 * @typedef {{deleted: true, newJSON: *} | {deleted: false, code: number, reason: string}} LocalliumDeletionState
 */
/**
 * Class enabling features (such as creating file on read if it doesn't exist) on `Database` class.
 * @example
 * const { DatabaseFlags } = require("locallium")
 *
 * // First option
 * const flags = new DatabaseFlags({
 *     getAdvancedWarns: true,
 *     continueSettingThePathIfValueIsNull: true,
 *     //...
 * })
 *
 * // Second option
 * const anotherFlags = new DatabaseFlags()
 * anotherFlags
 *     .setFlag("createDatabaseFileOnReadIfDoesntExist", true)
 *     .setFlag("setValueToDatabaseFileOnReadIfDoesntExist", JSON.stringify({
 *         "name": "anonymous",
 *         "description": "No description provided."
 *         "games": []
 *     }))
 */
class DatabaseFlags {
    /**
     * @type {[string, any[] | "*", any][]}
     */
    static #flagsInfo = [
        ["getAdvancedWarns", ["t:boolean"], false],
        ["createDatabaseFileOnReadIfDoesntExist", ["t:boolean"], false],
        ["setValueToDatabaseFileOnReadIfDoesntExist", ["t:string"], ""],
        ["continueSettingThePathIfValueIsNull", ["t:boolean"], false],
        ["keepEmptyKeysWhileDeleting", ["t:boolean"], false],
        ["keySeparator", ["t:string"], "."],
        ["jsonSpaces", ["t:number", null], 4],
        ["alwaysThrowErrorsNoMatterWhat", ["t:boolean"], false],
        ["checkFileExistFrom", ["watchFunc", "methods"], "methods"],
        // ["checkFileExistInterval", ["t:number"], 5000]
    ]
    /**
     * Static variable getting all of the flags.
     * @returns {string[]}
     */
    static get flagsList() {
        return this.#flagsInfo.map((x) => x[0])
    }
    /**
     * Static function getting information about the specific flag.
     * @param {string} flag Flag name
     * @returns {{ JSDoc_possibleValues: string, defaultValue: any }}
     */
    static getFlagInfo(flag) {
        if (!this.flagsList.includes(flag)) return console.error(new RangeError(`Unknown flag ${flag}`))
        var syntaxPlace = this.#flagsInfo.find((x) => x[0] === flag)[1]
        return {
            JSDoc_possibleValues:
                typeof syntaxPlace === "string"
                    ? "*"
                    : syntaxPlace
                          .map((s) => {
                              if (typeof s == "string" && typeofKeys.includes(s.slice(2))) return s.slice(2)
                              if (typeof s == "string") return `"${s}"`
                              else return `${s}`
                          })
                          .join(" | "),
            defaultValue: this.#flagsInfo.find((x) => x[0] === flag)[2],
        }
    }

    /**
     * @param {{ [flag: DatabaseFlagsNames]: any }} options Flags from `DatabaseFlags.flagsList` with equally JSDoc syntax
     */
    constructor(options = {}) {
        var constructor = {
            errorsHave: false,
            errorSpecify: new Error(),
        }
        /**
         * @type {{ [flag: DatabaseFlagsNames]: any }}
         */
        var nf = {}
        for (var i = 0; i < DatabaseFlags.#flagsInfo.length; i++) {
            nf[DatabaseFlags.#flagsInfo[i][0]] = DatabaseFlags.#flagsInfo[i][2]
        }

        for (var i = 0; i < Object.keys(options).length; i++) {
            var x = Object.entries(options)[i]
            if (!DatabaseFlags.#flagsInfo.map((s) => s[0]).includes(x[0])) {
                constructor.errorsHave = true
                constructor.errorSpecify = new ReferenceError(
                    `"options" argument contains undefined flag "${x[0]}". Acceptable options are: ${DatabaseFlags.#flagsInfo.map((s) => s[0]).join(", ")}.`
                )
                break
            } else if (
                !(
                    !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(x[0])].map((s) => s[1]).includes("t:" + typeof x[1]) &&
                    !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(x[0])].map((s) => s[1]).includes(typeof x[1] === "string" ? "v:" + x[1] : x[1])
                )
            ) {
                constructor.errorsHave = true
                constructor.errorSpecify = new TypeError(
                    `Flag ${x[0]} in "options" argument has non-acceptable value. This flag must be equal to this JSDoc syntax: ${DatabaseFlags.#flagsInfo[
                        DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(x[0])
                    ][1]
                        .map((s) => {
                            if (typeof s == "string" && typeofKeys.includes(s)) return s.slice(2)
                            if (typeof s == "string") return `"${s}"`
                            else return `${s}`
                        })
                        .join(" | ")}`
                )
                break
            } else {
                nf[x[0]] = x[1]
            }
        }

        if (constructor.errorsHave) {
            throw console.error(constructor.errorSpecify)
        } else {
            this.flags = nf
        }
    }
    /**
     * Sets the flags, can be chained together.
     * @param {DatabaseFlagsNames} flag
     * @param {*} value Flags value equally to JSDoc syntax
     * @returns {DatabaseFlags}
     */
    setFlag(flag, value) {
        if (!DatabaseFlags.#flagsInfo.map((s) => s[0]).includes(flag)) {
            throw console.error(
                new ReferenceError(`"options" argument contains undefined flag "${flag}". Acceptable options are: ${DatabaseFlags.#flagsInfo.map((s) => s[0]).join(", ")}.`)
            )
        } else if (
            typeof DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)] === "object" &&
            !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)].map((s) => s[1]).includes("t:" + typeof value) &&
            !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)].map((s) => s[1]).includes(value)
        ) {
            throw console.error(
                new TypeError(
                    `Flag ${flag} in "options" argument has non-acceptable value. This flag must be equal to this JSDoc syntax: ${DatabaseFlags.#flagsInfo[
                        DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)
                    ][1]
                        .map((s) => {
                            if (typeof s == "string" && typeofKeys.includes(s)) return s.slice(2)
                            if (typeof s == "string") return `"${s}"`
                            return `${s}`
                        })
                        .join(" | ")}`
                )
            )
        } else if (
            typeof DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)] === "string" &&
            DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)] !== "*"
        ) {
            console.error(new Error(`In analyzing, flag ${flag} didn't have a value such as array or specific string.`))
        } else {
            this.flags[flag] = value
            return this
        }
    }
}

/**
 * Local database handler, getting values and rewrites them.
 *
 * All of data keeps in JSON file (defaults to *database.json*), and only can be modified locally
 * @example
 * // This is basic example using the database
 *
 * const { Database, DatabaseFlags } = require("locallium")
 *
 * const flags = new DatabaseFlags({
 *     // some flags if important
 * })
 *
 * // Handling database2.json file as a local database
 * const db = new Database("database2", flags)
 * // ...and giving data
 * let data2 = db.get("existingPath.number")
 * console.log(data2.exists) // => true
 * console.log(data2.val) // => 5 [ for example ]
 *
 * data2 = data2.val
 * data2++ // some changing
 *
 * // Saving the data
 * db.set("undefined.andNotExisting.json.path.0", data2)
 * console.log(db.get("undefined.andNotExisting.json.path.0") === data2 && data2 === 6) // => true
 *
 * // Deleting data
 * console.log(db.remove("undefined.andNotExisting.json.path")) // => { deleted: boolean, [some other values] }
 */
class Database {
    #fp
    #flags
    #exists
    /**
     * @param {string} filePath File path (default: `"database"` - means the file *./database.json*)
     * @param {DatabaseFlags} [flags=null] Features about the database (default: default values from `DatabaseFlags` class)
     * @returns
     */
    constructor(filePath = "database", flags = null) {
        if (typeof flags !== "object" || !flags instanceof DatabaseFlags) return TypeError('"flags" must be an DatabaseFlags class')
        if (typeof filePath !== "string") throw console.error(new TypeError('"filePath" argument must be a string.'))
        this.#fp = filePath.replace(/(.*)\.json/g, "$1") + ".json"
        this.#flags = flags || new DatabaseFlags()
        this.#exists = flags.flags.checkFileExistFrom !== "methods" ? fs.existsSync(this.#fp) : null

        if (flags.flags.checkFileExistFrom !== "methods") {
            fs.watch(this.#fp, null, (type) => {
                if (type == "rename") this.#exists = fs.existsSync(this.#fp)
            })
        }
    }
    /**
     * Gets from the file (declared in the class before)
     * @param {string} jsonPath JSON Path (default: empty string - it means get all)
     * @returns {LocalliumSnapshot} Returns `.exists` boolean (checks if value isn't just `null`) and `.val` posibble value (can get object, array, string, number, boolean or `null`)
     */
    get(jsonPath = "") {
        try {
            if (typeof jsonPath !== "string") throw console.error(new TypeError('"jsonPath" argument must be a string.'))
            jsonPath = jsonPath.split(this.#flags.flags.keySeparator)

            if (this.#exists ?? !fs.existsSync(this.#fp)) {
                if (this.#flags.flags.createDatabaseFileOnReadIfDoesntExist)
                    fs.writeFileSync(this.#fp, this.#flags.flags.setValueToDatabaseFileOnReadIfDoesntExist, {
                        encoding: "utf8",
                    })
                return {
                    exists: false,
                    val: null,
                }
            }

            const file = fs.readFileSync(this.#fp, {
                encoding: "utf8",
            })

            if (file == "")
                return {
                    exists: false,
                    val: null,
                }

            var json = JSON.parse(file)
            //console.log(typeof json)

            if (jsonPath.filter((x) => x !== "").length > 0 && typeof json === "object" && json) {
                for (let i = 0; i < jsonPath.length; i++) {
                    if (typeof json[jsonPath[i]] !== "undefined") json = json[jsonPath[i]]
                    else {
                        json = null
                        break
                    }
                }
            } else if (jsonPath.filter((x) => x !== "").length > 0 && (typeof json !== "object" || !json)) json = null

            return {
                exists: json !== null,
                val: json,
            }
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw console.error(err)
            else console.error(err)
        }
    }
    /**
     * Creates or replaces some value to the database
     * @param {string} jsonPath JSON path
     * @param {*} newData Data to be inserted into the database, setting to `null` without enabled *`continueSettingThePathIfValueIsNull`* flag causes **the path deletion**.
     * @returns
     */
    set(jsonPath, newData) {
        try {
            var spaces = this.#flags.flags.jsonSpaces
            function zmienWartoscWJson(jsonStr, argument1, argument2) {
                try {
                    const data = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr || {}
                    const keys = typeof argument1 === "string" ? argument1.split(this.#flags.flags.keySeparator) : argument1
                    let current = data
                    for (const key of keys.slice(0, -1)) {
                        if (!current[key]) {
                            current[key] = {}
                        }
                        current = current[key]
                    }
                    current[keys[keys.length - 1]] = argument2
                    if (spaces !== null) return JSON.stringify(data, null, spaces)
                    else return JSON.stringify(data)
                } catch (error) {
                    throw console.error(err)
                }
            }

            if (typeof jsonPath === "undefined") throw console.error(new TypeError('"jsonPath" argument is required.'))
            if (typeof jsonPath !== "string") throw console.error(new TypeError('"jsonPath" argument must be a string.'))
            if (typeof newData === "undefined") {
                console.warn(
                    this.#flags.flags.getAdvancedWarns
                        ? new TypeError('(as a warn) "newData" argument isn\'t specified, it was changed to null.')
                        : '<warning> "newData" argument isn\'t specified, it was changed to null.'
                )
                newData = null
            } else if (newData === null) {
                console.warn(
                    this.#flags.flags.getAdvancedWarns
                        ? new TypeError('(as a warn) "newData" argument value is null, deleting...')
                        : '<warning> "newData" argument value is null, deleting...'
                )
            }

            if (newData === null && !this.#flags.flags.continueSettingThePathIfValueIsNull) {
                this.delete(jsonPath)
                return
            }

            jsonPath = jsonPath.split(this.#flags.flags.keySeparator)

            if (this.#exists ?? !fs.existsSync(this.#fp)) {
                if (jsonPath.filter((x) => x !== "").length > 0) var ndata = zmienWartoscWJson({}, jsonPath, newData)
                else {
                    if (spaces !== null) var ndata = JSON.stringify(newData, null, spaces)
                    else var ndata = JSON.stringify(newData)
                }
            } else {
                if (jsonPath.filter((x) => x !== "").length > 0) var ndata = zmienWartoscWJson(typeof this.get().val === "object" ? this.get().val : {}, jsonPath, newData)
                else {
                    if (spaces !== null) var ndata = JSON.stringify(newData, null, spaces)
                    else var ndata = JSON.stringify(newData)
                }
            }

            fs.writeFileSync(this.#fp, ndata, {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw console.error(err)
            else console.error(err)
        }
    }
    /**
     * Deletes value from path
     * @param {string} jsonPath Existing path
     * @returns {LocalliumDeletionState} Deletion information. All empty values from the any key specified in the `jsonPath` argument will be deleted if *`keepEmptyKeysWhileDeleting`* flag is disabled.
     * @example
     * const { Databasae } = require("locallium")
     * const db = new Database()
     *
     * db.set("somePath", "someValue")
     * console.log(db.delete("somePath")) // => { deleted: true, newJSON: { ... } | null }
     * console.log(db.delete("somePath")) // => { deleted: false, code: 2404, reason: 'Data in location "somePath" does not exist.' }
     *
     * const anotherdb = new Database("../noExistingFolder/andFile")
     * console.log(anotherdb.delete("somePath")) // => { deleted: false, code: 1404, reason: 'File ../noExistingFolder/andFile.json does not exist.' }
     */
    delete(jsonPath) {
        try {
            var spaces = this.#flags.flags.jsonSpaces
            let jsonData = fs.readFileSync(this.#fp, {
                encoding: "utf8",
            })

            if (this.#exists ?? !fs.existsSync(this.#fp)) {
                return {
                    deleted: false,
                    code: 1404,
                    reason: `File ${this.#fp} does not exist.`,
                }
            }
            if (!this.get(jsonPath).exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            const keys = jsonPath.split(this.#flags.flags.keySeparator)
            const data = JSON.parse(jsonData)

            var n = 0
            var ended = false

            do {
                // console.log(n)
                let current = data
                for (let i = 0; i < keys.length - 1 - n; i++) {
                    const key = keys[i]
                    // console.log(i, keys[i])
                    current = current[key]
                }

                // console.log(keys[keys.length - 1 - n])

                // console.log(
                //     n < keys.length,
                //     "|",
                //     n == 0,
                //     typeof current[keys[keys.length - 1 - n]],
                //     typeof current[keys[keys.length - 1 - n]] === "object" ? Object.keys(current[keys[keys.length - 1 - n]] ?? {}).length == 0 : !current[keys[keys.length - 1 - n]]
                // )

                if (
                    ((typeof current[keys[keys.length - 1 - n]] === "object"
                        ? Object.keys(current[keys[keys.length - 1 - n]] ?? {}).length == 0
                        : !current[keys[keys.length - 1 - n]]) ||
                        n == 0) &&
                    n < keys.length
                ) {
                    delete current[keys[keys.length - 1 - n]]
                    n++
                } else {
                    ended = true
                }
            } while (!this.#flags.flags.keepEmptyKeysWhileDeleting && !ended)

            if (spaces !== null) var x = JSON.stringify(data, null, spaces)
            else var x = JSON.stringify(data)

            fs.writeFileSync(this.#fp, x, {
                encoding: "utf8",
            })

            return {
                deleted: true,
                newJSON: !data ? null : data,
            }
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw console.error(err)
            else console.error(err)
        }
    }

    /**
     * The same as `Database#get()`, but asynchromous
     * @param {string} jsonPath
     * @returns {Promise<LocalliumSnapshot>}
     */
    async aget(jsonPath = "") {
        return new Promise((resolve, reject) => {
            resolve(this.get(jsonPath))
        })
    }

    /**
     * The same as `Database#set()`, but asynchromous
     * @param {string} jsonPath
     * @param {any} newData
     * @returns {Promise<void>}
     */
    async aset(jsonPath, newData) {
        return new Promise((resolve, reject) => {
            resolve(this.set(jsonPath, newData))
        })
    }
    /**
     * The same as `Database#delete()`, but asynchromous
     * @param {string} jsonPath
     * @returns {Promise<LocalliumDeletionState>}
     */
    async adelete(jsonPath) {
        return new Promise((resolve, reject) => {
            const info = this.delete(jsonPath)
            if (info.deleted) resolve(info)
            else reject(info)
        })
    }
}

module.exports = {
    Database,
    DatabaseFlags,
}
