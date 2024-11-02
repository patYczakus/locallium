const fs = require("fs")
const fsp = fs.promises
const typeofKeys = ["string", "boolean", "number", "bigint", "function", "undefined", "object", "symbol"]

/**
 * `Database#get()` and `Database#aget()` snapshot (mainly `LocalliumObjectManipulation#get()`)
 * @typedef {Object} LocalliumSnapshot
 * @property {boolean} exists A boolean which checks if value isn't `null`
 * @property {any} val A posibble value of snapshot (can get object, array, string, number, boolean or `null`)
 */

/**
 * `Database#delete()` and `Database#adelete()` deletion state (mainly `LocalliumObjectManipulation#delete()`)
 * @typedef {{deleted: true, newJSON: *} | {deleted: false, code: number, reason: string}} LocalliumDeletionState
 */
class LocalliumObjectManipulation {
    /**
     * Gets value from JSON string based on JSON path.
     * @param {string} json Stringified JSON string.
     * @param {string[]} jsonPath JSON path to the value.
     * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
     * @example
     * const { LocalliumObjectManipulation } = require("locallium")
     *
     * const json = JSON.stringify({ a: { b: { c: 3 } } })
     * const snapshot = LocalliumObjectManipulation.get(json, ["a", "b", "c"])
     * console.log(snapshot) // => { exists: true, val: 3 }
     *
     * const snapshot2 = LocalliumObjectManipulation.get(json, ["a", "b", "d"])
     * console.log(snapshot2) // => { exists: false, val: null }
     *
     * const snapshot3 = LocalliumObjectManipulation.get("", ["a", "b", "c"])
     * console.log(snapshot3) // => { exists: false, val: null }
     *
     * const snapshot4 = LocalliumObjectManipulation.get(json, [])
     * console.log(snapshot4) // => { exists: true, val: { a: { b: { c: 3 } } } }
     */
    static get(json, jsonPath) {
        if (json === "") {
            return {
                exists: false,
                val: null,
            }
        }

        json = JSON.parse(json)

        if (jsonPath.filter((x) => x !== "").length > 0 && typeof json === "object" && json) {
            for (let i = 0; i < jsonPath.length; i++) {
                if (typeof json[jsonPath[i]] !== "undefined") {
                    json = json[jsonPath[i]]
                } else {
                    json = null
                    break
                }
            }
        } else if (jsonPath.filter((x) => x !== "").length > 0 && (typeof json !== "object" || !json)) {
            json = null
        }

        return {
            exists: json !== null,
            val: json,
        }
    }

    /**
     * Sets value to JSON string based on JSON path.
     * @param {string | Object} json Stringified JSON string.
     * @param {string[]} jsonPath JSON path to the value.
     * @param {*} newData New data to be set.
     * @param {number | null} spaces Number of spaces for pretty printing JSON.
     * @param {string} keySeparator Separator for keys in jsonPath (default: ".")
     * @returns {string} New JSON string with the value set.
     * @example
     * const { LocalliumObjectManipulation } = require("locallium")
     *
     * const json = JSON.stringify({ a: 1 })
     * const newJson = LocalliumObjectManipulation.set(json, ["b"], 2)
     * console.log(newJson) // => {"a":1,"b":2}
     *
     * const newJson2 = LocalliumObjectManipulation.set(json, ["a"], 2, 2)
     * console.log(newJson2) // => {\n  "a": 2\n}
     *
     * const newJson3 = LocalliumObjectManipulation.set("", ["a", "b"], 3)
     * console.log(newJson3) // => {"a":{"b":3}}
     *
     * const newJson4 = LocalliumObjectManipulation.set(json, [], 2)
     * console.log(newJson4) // => 2
     */
    static set(json, jsonPath, newData, spaces) {
        const changeJSONValue = (jsonStr, keys) => {
            const data = (typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr) || {}
            let current = data

            // console.log(data)
            for (const key of keys.slice(0, -1)) {
                // console.log(current, key, current[key])
                if (!current[key]) {
                    current[key] = {}
                }
                current = current[key]
            }
            current[keys.at(-1)] = newData

            return spaces !== null ? JSON.stringify(data, null, spaces) : JSON.stringify(data)
        }

        if (typeof json == "string" && json.length > 0) json = JSON.parse(json)
        else if ((typeof json == "string" && json.length == 0) || typeof json != "object") json = {}

        let ndata

        if (typeof json == "object") {
            if (jsonPath.filter((x) => x).length > 0) {
                ndata = changeJSONValue(json, jsonPath)
            } else {
                ndata = spaces !== null ? JSON.stringify(newData, null, spaces) : JSON.stringify(newData)
            }
        } else {
            if (jsonPath.filter((x) => x).length > 0) {
                ndata = changeJSONValue({}, jsonPath)
            } else {
                ndata = spaces !== null ? JSON.stringify(newData, null, spaces) : JSON.stringify(newData)
            }
        }

        return ndata
    }
    /**
     * Deletes a value from the JSON data based on the provided path.
     * @param {string | Object} json JSON data (stringified or object).
     * @param {string[]} keys Path to the value to delete.
     * @param {boolean} keepEmptyKeys If true, empty objects are preserved.
     * @returns {Object} The modified JSON data.
     * @example
     * const json = { a: 1, b: { c: 3 } }
     * const newJson = LocalliumObjectManipulation.delete(json, ["b", "c"])
     * console.log(newJson) // => { a: 1 }
     *
     * const newJson2 = LocalliumObjectManipulation.delete(json, ["b", "c"], true)
     * console.log(newJson2) // => { a: 1, b: {} }
     *
     * const newJson3 = LocalliumObjectManipulation.delete(json, ["a"])
     * console.log(newJson3) // => { b: { c: 3 } }
     *
     * const newJson4 = LocalliumObjectManipulation.delete(json, [])
     * console.log(newJson4) // => { a: 1, b: { c: 3 } }
     */
    static delete(json, keys, keepEmptyKeys = false) {
        const data = typeof json == "string" ? JSON.parse(json) : json

        // console.log(data)

        let n = 0
        let ended = false

        do {
            let current = data
            for (let i = 0; i < keys.length - 1 - n; i++) {
                const key = keys[i]
                current = current[key]
            }

            if (
                ((typeof current[keys.at(-1 - n)] === "object" ? Object.keys(current[keys.at(-1 - n)] ?? {}).length === 0 : !current[keys.at(-1 - n)]) || n == 0) &&
                n < keys.length
            ) {
                delete current[keys.at(-1 - n)]
                n++
            } else {
                ended = true
            }
        } while (!keepEmptyKeys && !ended)

        return data
    }
}

/**
 * @typedef {"getAdvancedWarns" | "createDatabaseFileOnReadIfDoesntExist" | "setValueToDatabaseFileOnReadIfDoesntExist" | "continueSettingThePathIfValueIsNull" | "keepEmptyKeysWhileDeleting" | "keySeparator" | "jsonSpaces" | "alwaysThrowErrorsNoMatterWhat" | "checkFileExistFrom"} DatabaseFlagsNames
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
            // console.log(DatabaseFlags.#flagsInfo[i])
        }

        for (var i = 0; i < Object.keys(options).length; i++) {
            var x = Object.entries(options)[i]
            // console.log(x)
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

        // console.log(constructor.errorsHave, constructor.errorsHave ? constructor.errorSpecify : "")
        // console.log(nf)

        if (constructor.errorsHave) {
            throw constructor.errorSpecify
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
            throw new ReferenceError(`"options" argument contains undefined flag "${flag}". Acceptable options are: ${DatabaseFlags.#flagsInfo.map((s) => s[0]).join(", ")}.`)
        } else if (
            typeof DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)] === "object" &&
            !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)].map((s) => s[1]).includes("t:" + typeof value) &&
            !DatabaseFlags.#flagsInfo[DatabaseFlags.#flagsInfo.map((s) => s[0]).indexOf(flag)].map((s) => s[1]).includes(value)
        ) {
            throw new TypeError(
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

    toString() {
        return `DatabaseFlags<${Object.entries(this.flags)
            .map((x) => `${x[0]}=${x[1]}`)
            .join(";")}>`
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
        flags = flags ?? null

        if (!flags instanceof DatabaseFlags && flags !== null) {
            return TypeError('"flags" must be an DatabaseFlags class')
        }
        if (typeof filePath !== "string") {
            throw new TypeError('"filePath" argument must be a string.')
        }

        this.#fp = filePath.replace(/(.*)\.json/g, "$1") + ".json"
        this.#flags = flags ?? new DatabaseFlags()
        this.#exists = this.#flags.flags.checkFileExistFrom !== "methods" ? fs.existsSync(this.#fp) : null

        if (this.#flags.flags.checkFileExistFrom !== "methods") {
            fs.watch(this.#fp, null, (type) => {
                if (type == "rename") this.#exists = fs.existsSync(this.#fp)
            })
        }
    }
    #fileExistSystem(createFile = true) {
        if (!(this.#exists ?? fs.existsSync(this.#fp))) {
            if (this.#flags.flags.createDatabaseFileOnReadIfDoesntExist)
                fs.writeFileSync(this.#fp, this.#flags.flags.setValueToDatabaseFileOnReadIfDoesntExist, {
                    encoding: "utf8",
                })
            return false
        }
        return true
    }
    /**
     * Gets from the file (declared in the class before)
     * @param {string} jsonPath JSON Path (default: empty string - it means get all)
     * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
     */
    get(jsonPath = "") {
        try {
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            jsonPath = jsonPath.split(this.#flags.flags.keySeparator)

            if (!this.#fileExistSystem()) {
                return {
                    exists: false,
                    val: null,
                }
            }

            const file = fs.readFileSync(this.#fp, {
                encoding: "utf8",
            })

            return LocalliumObjectManipulation.get(file, jsonPath)
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
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
            if (typeof jsonPath === "undefined") throw new TypeError('"jsonPath" argument is required.')
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            if (typeof newData === "undefined") {
                console.warn(
                    this.#flags.flags.getAdvancedWarns
                        ? new TypeError('"newData" argument isn\'t specified, it was changed to null.')
                        : '<warning> "newData" argument isn\'t specified, it was changed to null.'
                )
                newData = null
            } else if (newData === null && !this.#flags.flags.continueSettingThePathIfValueIsNull) {
                console.warn(
                    this.#flags.flags.getAdvancedWarns ? new TypeError('"newData" argument value is null, deleting...') : '<warning> "newData" argument value is null, deleting...'
                )
                this.delete(jsonPath)
                return
            }

            const ndata = LocalliumObjectManipulation.set(this.get().val, jsonPath.split(this.#flags.flags.keySeparator), newData, this.#flags.flags.jsonSpaces)

            fs.writeFileSync(this.#fp, ndata, {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
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

            if (!this.#fileExistSystem()) {
                return {
                    deleted: false,
                    code: 1404,
                    reason: `File ${this.#fp} does not exist.`,
                }
            }

            const snpsht = this.get(jsonPath)
            if (!snpsht.exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            const newData = LocalliumObjectManipulation.delete(this.get().val, jsonPath.split(this.#flags.flags.keySeparator), this.#flags.flags.keepEmptyKeysWhileDeleting)
            fs.writeFileSync(this.#fp, spaces !== null ? JSON.stringify(newData, null, spaces) : JSON.stringify(newData), {
                encoding: "utf8",
            })

            // console.log(newData)

            return {
                deleted: true,
                newJSON: LocalliumObjectManipulation.get(JSON.stringify(newData), []).val,
            }
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    /**
     * The same as `Database#get()`, but asynchromous
     * @param {string} jsonPath
     * @returns {Promise<LocalliumSnapshot>}
     */
    async aget(jsonPath = "") {
        try {
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            jsonPath = jsonPath.split(this.#flags.flags.keySeparator)

            if (!this.#fileExistSystem()) {
                return {
                    exists: false,
                    val: null,
                }
            }

            const file = await fsp.readFile(this.#fp, {
                encoding: "utf8",
            })

            return LocalliumObjectManipulation.get(file, jsonPath)
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
    /**
     * The same as `Database#set()`, but asynchromous
     * @param {string} jsonPath
     * @param {any} newData
     * @returns {Promise<void>}
     */
    async aset(jsonPath, newData) {
        try {
            if (typeof jsonPath === "undefined") throw new TypeError('"jsonPath" argument is required.')
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            if (typeof newData === "undefined") {
                console.warn(
                    this.#flags.flags.getAdvancedWarns
                        ? new TypeError('"newData" argument isn\'t specified, it was changed to null.')
                        : '<warning> "newData" argument isn\'t specified, it was changed to null.'
                )
                newData = null
            } else if (newData === null && !this.#flags.flags.continueSettingThePathIfValueIsNull) {
                console.warn(
                    this.#flags.flags.getAdvancedWarns ? new TypeError('"newData" argument value is null, deleting...') : '<warning> "newData" argument value is null, deleting...'
                )
                await this.adelete(jsonPath)
                return
            }

            const ndata = LocalliumObjectManipulation.set((await this.aget()).val, jsonPath.split(this.#flags.flags.keySeparator), newData, this.#flags.flags.jsonSpaces)

            await fsp.writeFile(this.#fp, ndata, {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
    /**
     * The same as `Database#delete()`, but asynchromous
     * @param {string} jsonPath
     * @returns {Promise<LocalliumDeletionState>}
     */
    async adelete(jsonPath) {
        try {
            var spaces = this.#flags.flags.jsonSpaces

            if (!this.#fileExistSystem()) {
                return {
                    deleted: false,
                    code: 1404,
                    reason: `File ${this.#fp} does not exist.`,
                }
            }

            const snpsht = await this.aget(jsonPath)
            if (!snpsht.exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            const newData = LocalliumObjectManipulation.delete(
                (await this.aget()).val,
                jsonPath.split(this.#flags.flags.keySeparator),
                this.#flags.flags.keepEmptyKeysWhileDeleting
            )
            await fsp.writeFile(this.#fp, spaces !== null ? JSON.stringify(newData, null, spaces) : JSON.stringify(newData), {
                encoding: "utf8",
            })

            return {
                deleted: true,
                newJSON: LocalliumObjectManipulation.get(JSON.stringify(newData), []).val,
            }
        } catch (err) {
            if (this.#flags.flags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
}

module.exports = {
    Database,
    DatabaseFlags,
    LocalliumObjectManipulation,
}
