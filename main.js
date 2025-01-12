const fs = require("fs")
const fsp = fs.promises
const typeofKeys = ["string", "boolean", "number", "bigint", "function", "undefined", "object", "symbol"]

class Warn extends Error {}
class StackedError extends Error {
    /**
     * @param {...Error} errors
     */
    constructor(...errors) {
        super("Received more errors in one while")
        this.errors = errors
    }
}

/**
 * **Loc**allium **s**yn**t**a**x to Arr**ay class
 * @overload
 * @param {string} locstx
 * @param {false} [keepStrings]
 * @returns {any[] | "*"}
 */
/**
 * The same idea of `locstxtoarr`, but whole values are string representation
 * @overload
 * @param {string} locstx
 * @param {true} keepStrings
 * @returns {string[] | "*"}
 */
/**
 * @param {string} locstx
 * @param {boolean} [keepStrings=false]
 * @returns {any[] | "*"}
 */
function locstxtoarr(locstx, keepStrings = false) {
    if (locstx == "*") return "*"
    const _locstx = locstx.split("//").map((x) => x.trim())

    return keepStrings
        ? _locstx
        : _locstx.map((x) => {
              if (x == "null") return null
              if (x == "undefined") return undefined
              if (x == "NaN" || x == "nan") return NaN
              if (x == "infinite" || x == "Infinite" || x == "Infinity" || x == "infinity") return Infinity
              if (!x.replace(/[-_0-9e.]/g, "")) return Number(x)
              if (x.toLowerCase().startsWith("0b") && !x.slice(2).replace(/[0-1]/g, "")) return parseInt(x, 2)
              if (x.toLowerCase().startsWith("0o") && !x.slice(2).replace(/[0-7]/g, "")) return parseInt(x, 8)
              if (x.toLowerCase().startsWith("0x") && !x.slice(2).replace(/[0-9a-fA-F]/g, "")) return parseInt(x, 16)
              if (x == "true") return true
              if (x == "false") return false
              return x
          })
}
/**
 * **Loc**allium **s**yn**t**a**x to JSDoc s**yn**t**a**x**
 * @param {string} locstx
 */
function locstxtojsdocstx(locstx) {
    const anyv = locstxtoarr(locstx)
    const strv = locstxtoarr(locstx, true)
    if (strv == "*") return "any"
    if (anyv == "*") return "any"
    return strv
        .map((x, i) => {
            if (x.startsWith("t:") && typeofKeys.includes(x.slice(2))) return x.slice(2)
            if (x.startsWith("s:")) return `"${x.slice(2)}"`
            if (typeof anyv[i] == "string") return `/* unresolved */ ${x}`
            return x
        })
        .join(" | ")
}

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
     * Gets value from Object (not only) based on the path.
     * @param {*} json Any value, but recommend an Object.
     * @param {string[]} jsonPath Special path localizing the place to get.
     * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
     * @example
     * const { LocalliumObjectManipulation } = require("locallium")
     *
     * const obj = { a: { b: { c: 3 } } }
     * //classic JSON operation
     * const snapshot = LocalliumObjectManipulation.get(obj, ["a", "b", "c"])
     * console.log(snapshot) // => { exists: true, val: 3 }
     *
     * const snapshot2 = LocalliumObjectManipulation.get(obj, ["a", "b", "d"])
     * console.log(snapshot2) // => { exists: false, val: null }
     *
     * const snapshot3 = LocalliumObjectManipulation.get({}, ["a", "b", "c"])
     * console.log(snapshot3) // => { exists: false, val: null }
     *
     * //some primitives
     * const snapshot3 = LocalliumObjectManipulation.get(2137, []])
     * console.log(snapshot3) // => { exists: true, val: 2137 }
     *
     * const snapshot3 = LocalliumObjectManipulation.get("bcd", ["a"])
     * console.log(snapshot3) // => { exists: false, val: null }
     *
     * //and getting whole
     * const snapshot5 = LocalliumObjectManipulation.get(obj, [])
     * console.log(snapshot5) // => { exists: true, val: { a: { b: { c: 3 } } } }
     */
    static get(json, jsonPath) {
        if (typeof json == "object" ? Object.keys(json).length == 0 : !Boolean(json)) {
            return {
                exists: false,
                val: null,
            }
        }

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
     * Sets value to Object based on the path.
     * @param {*} json Any value, but **highly** recommend an Object.
     * @param {string[]} jsonPath Special path localizing the place to set.
     * @param {*} newData New data to be set.
     * @returns {Object} New object with the value set.
     * @example
     * const { LocalliumObjectManipulation } = require("locallium")
     *
     * const json = { a: 1 }
     * const newJson = LocalliumObjectManipulation.set(json, ["b"], 2)
     * console.log(newJson) // => { "a": 1, "b": 2 }
     *
     * const newJson2 = LocalliumObjectManipulation.set(json, ["a"], 2)
     * console.log(newJson2) // => { "a": 2 }
     *
     * const newJson3 = LocalliumObjectManipulation.set("", ["a", "b"], 3)
     * console.log(newJson3) // => { "a": { "b": 3 } }
     *
     * const newJson4 = LocalliumObjectManipulation.set(json, [], 2)
     * console.log(newJson4) // => 2
     */
    static set(json, jsonPath, newData) {
        const changeJSONValue = (json, keys) => {
            const data = json
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

            return data
        }

        if (typeof json != "object") json = {}

        let ndata

        if (jsonPath.filter((x) => x).length > 0) {
            ndata = changeJSONValue(json, jsonPath)
        } else {
            ndata = newData
        }

        return ndata
    }
    /**
     * Deletes a value from the Object based on the provided path.
     * @param {Object} json An Object.
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
        const data = json
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

    static "v1.2.0" = {
        /**
         * Gets value from JSON string based on JSON path.
         * @param {string} json JSON data (stringified or object).
         * @param {string[]} jsonPath JSON path to the value.
         * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
         * @deprecated since version **`1.3.0`**; use `.get(JSON.parse(json))` or `.get(object)` instead
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
        get(json, jsonPath) {
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
        },

        /**
         * Sets value to JSON data based on JSON path.
         * @param {string | Object} json JSON data (stringified or object).
         * @param {string[]} jsonPath JSON path to the value.
         * @param {*} newData New data to be set.
         * @param {number | null} spaces Number of spaces for pretty printing JSON.
         * @returns {string} New JSON string with the value set.
         * @deprecated since version **`1.3.0`**; use `.get(JSON.parse(json))` or `.get(object)` instead
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
        set(json, jsonPath, newData, spaces) {
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

                return JSON.stringify(data, null, spaces ?? 0)
            }

            if (typeof json == "string" && json.length > 0) json = JSON.parse(json)
            else if ((typeof json == "string" && json.length == 0) || typeof json != "object") json = {}

            let ndata

            if (typeof json == "object") {
                if (jsonPath.filter((x) => x).length > 0) {
                    ndata = changeJSONValue(json, jsonPath)
                } else {
                    ndata = JSON.stringify(newData, null, spaces ?? 0)
                }
            } else {
                if (jsonPath.filter((x) => x).length > 0) {
                    ndata = changeJSONValue({}, jsonPath)
                } else {
                    ndata = JSON.stringify(newData, null, spaces ?? 0)
                }
            }

            return ndata
        },

        /**
         * Deletes a value from the JSON data based on the provided path.
         * @param {string | Object} json JSON data (stringified or object).
         * @param {string[]} keys Path to the value to delete.
         * @param {boolean} keepEmptyKeys If true, empty objects are preserved.
         * @returns {Object} The modified JSON data.
         * @example
         * @deprecated since version **`1.3.0`**; use `.delete(JSON.parse(json))` or `.delete(object)` instead
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
        delete(json, keys, keepEmptyKeys = false) {
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
        },
    }
}

/**
 * @typedef {"getAdvancedWarns" | "createDatabaseFileOnReadIfDoesntExist" | "setValueToDatabaseFileOnReadIfDoesntExist" | "continueSettingThePathIfValueIsNull" | "keepEmptyKeysWhileDeleting" | "keySeparator" | "jsonSpaces" | "alwaysThrowErrorsNoMatterWhat" | "checkFileExistFrom" | "customMetadataReviewer" | "customMetadataReplacer"} DatabaseFlagsNames
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
     * @type {[string, string, string, any][]}
     */
    static #flagsInfo = [
        ["getAdvancedWarns", "Uses the Warn class, extended from Error, to print a warn.", "t:boolean", false],
        ["createDatabaseFileOnReadIfDoesntExist", "When used Database#get (also Database#aget), creates a file if it doesn't exist.", "t:boolean", false],
        [
            "setValueToDatabaseFileOnReadIfDoesntExist",
            "When used Database#get (also Database#aget), [createDatabaseFileOnReadIfDoesntExist] is activated and the file was freshly created, writes the declared stringified JSON object.",
            "t:string",
            "{}",
        ],
        [
            "continueSettingThePathIfValueIsNull",
            "In default, `null` is treated like it is no value, and as a result, the path is being deleted on Database#set (also Database#aset). Enabling this flag prevents this situation.",
            "t:boolean",
            false,
        ],
        [
            "keepEmptyKeysWhileDeleting",
            "Changes the behavior in deleting the main location keeping the parent key empty. Notice that it might also change the behavior when using Database#get (also Database#aget)",
            "t:boolean",
            false,
        ],
        ["keySeparator", "Declares the symbol to used as the separator on locations.", "t:string", "."],
        ["jsonSpaces", "Tells how many spaces is used (as a tab) on beautifing the JSON file. Setting 0 or null turns off the prettier.", "t:number//null", 4],
        ["alwaysThrowErrorsNoMatterWhat", "Means that all of errors (catched or locallium-maked) will be throwed.", "t:boolean", false],
        [
            "checkFileExistFrom",
            'Declarates which function use to check existence of file. "methods" means that checking will be in all methods from Database class. "watchFunc" uses fs#watch() listener.',
            "s:watchFunc//s:methods",
            "methods",
        ],
        ["customMetadataReviewer", "Acts as a reviewer to Database#get (also Database#aget).", "t:function//null", null],
        ["customMetadataReplacer", "Acts as a replacer to Database#set (also Database#aset).", "t:function//null", null],
    ]
    /**
     * Static variable getting all of the flags.
     * @returns {string[]}
     */
    static get flagsList() {
        return this.#flagsInfo.map((x) => x[0])
    }

    static get DEFAULT() {
        const sk = {}
        this.#flagsInfo.forEach((x) => {
            sk[x[0]] = x[3]
        })
        return sk
    }
    /**
     * Static function getting information about the specific flag.
     * @param {string} flag Flag name
     * @returns {{ description: string, JSDoc_possibleValues: string, defaultValue: any }}
     */
    static getFlagInfo(flag) {
        if (!this.flagsList.includes(flag)) return console.error(new RangeError(`Unknown flag ${flag}`))
        var flag = this.#flagsInfo.find((x) => x[0] === flag)
        return {
            description: flag[1],
            JSDoc_possibleValues: locstxtojsdocstx(flag[2]),
            defaultValue: flag[3],
        }
    }

    /**
     * @param {{ [flag in DatabaseFlagsNames]?: any }} options Flags from `DatabaseFlags.flagsList` with equally JSDoc syntax
     */
    constructor(options = {}) {
        var errors = []
        /**
         * @type {{ [flag in DatabaseFlagsNames]: any }}
         */
        this.flags = {}
        DatabaseFlags.flagsList.forEach((flag) => {
            try {
                this.setFlag(flag, options[flag] ?? DatabaseFlags.getFlagInfo(flag).defaultValue)
            } catch (err) {
                errors.push(err)
            }
        })
        if (errors.length > 0) {
            this.flags = {}
            throw new StackedError(...errors)
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
        }

        const acceptedValues = locstxtoarr(DatabaseFlags.#flagsInfo.find((s) => s[0] == flag)[2])
        const jsdoc = locstxtojsdocstx(DatabaseFlags.#flagsInfo.find((s) => s[0] == flag)[2])

        if (
            typeof acceptedValues === "object" &&
            !acceptedValues.includes("t:" + typeof value) &&
            !(typeof value == "string" && acceptedValues.includes("s:" + value)) &&
            !(typeof value != "string" && acceptedValues.includes(value))
        ) {
            throw new TypeError(`Flag ${flag} in "options" argument has non-acceptable value. This flag must be equal to this JSDoc syntax: ${jsdoc}`)
        }

        if (typeof acceptedValues === "string" && acceptedValues !== "*") {
            console.error(new Error(`In analyzing, flag "${flag}" didn't have a value such as array or specific string.`))
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
        this.activeFlags = (flags ?? new DatabaseFlags()).flags
        Object.freeze(this.activeFlags)
        this.#exists = this.activeFlags.checkFileExistFrom !== "methods" ? fs.existsSync(this.#fp) : null

        if (this.activeFlags.checkFileExistFrom !== "methods") {
            fs.watch(this.#fp, null, (type) => {
                if (type == "rename") this.#exists = fs.existsSync(this.#fp)
            })
        }
    }
    #fileExistSystem(createFile = true) {
        if (!(this.#exists ?? fs.existsSync(this.#fp))) {
            if (this.activeFlags.createDatabaseFileOnReadIfDoesntExist)
                fs.writeFileSync(this.#fp, this.activeFlags.setValueToDatabaseFileOnReadIfDoesntExist, {
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
            jsonPath = jsonPath.split(this.activeFlags.keySeparator)

            if (!this.#fileExistSystem()) {
                return {
                    exists: false,
                    val: null,
                }
            }

            const file = fs.readFileSync(this.#fp, {
                encoding: "utf8",
            })

            const json = this.activeFlags.customMetadataReviewer ? JSON.parse(file, this.activeFlags.customMetadataReviewer) : JSON.parse(file)
            // console.log(file, json)
            return LocalliumObjectManipulation.get(json, jsonPath)
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
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
                    this.activeFlags.getAdvancedWarns
                        ? new Warn('"newData" argument isn\'t specified, it was changed to null.')
                        : '<WARNING> "newData" argument isn\'t specified, it was changed to null.'
                )
                newData = null
            } else if (newData === null && !this.activeFlags.continueSettingThePathIfValueIsNull) {
                console.warn(
                    this.activeFlags.getAdvancedWarns ? new Warn('"newData" argument value is null, deleting...') : '<WARNING> "newData" argument value is null, deleting...'
                )
                this.delete(jsonPath)
                return
            }

            const ndata = LocalliumObjectManipulation.set(this.get().val, jsonPath.split(this.activeFlags.keySeparator), newData)

            fs.writeFileSync(this.#fp, JSON.stringify(ndata, this.activeFlags.customMetadataReplacer, this.activeFlags.jsonSpaces ?? 0), {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
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
            var spaces = this.activeFlags.jsonSpaces

            if (!this.#fileExistSystem()) {
                return {
                    deleted: false,
                    code: 1404,
                    reason: `File ${this.#fp} does not exist.`,
                }
            }

            const mainVal = this.get().val
            if (typeof mainVal !== "object" && jsonPath.split(this.activeFlags.keySeparator).filter((x) => x).length > 0) {
                return {
                    deleted: false,
                    code: 422,
                    reason: `Can't delete "${jsonPath}" when main value is not object like`,
                }
            }

            if (!this.get(jsonPath).exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            const newData = LocalliumObjectManipulation.delete(mainVal, jsonPath.split(this.activeFlags.keySeparator), this.activeFlags.keepEmptyKeysWhileDeleting)
            fs.writeFileSync(this.#fp, JSON.stringify(newData, this.activeFlags.customMetadataReplacer, this.activeFlags.jsonSpaces ?? 0), {
                encoding: "utf8",
            })

            // console.log(newData)

            return {
                deleted: true,
                newJSON: LocalliumObjectManipulation.get(JSON.stringify(newData), []).val,
            }
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
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
            jsonPath = jsonPath.split(this.activeFlags.keySeparator)

            if (!this.#fileExistSystem()) {
                return {
                    exists: false,
                    val: null,
                }
            }

            const file = await fsp.readFile(this.#fp, {
                encoding: "utf8",
            })

            return LocalliumObjectManipulation.get(JSON.parse(file, this.activeFlags.customMetadataReviewer), jsonPath)
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
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
                    this.activeFlags.getAdvancedWarns
                        ? new Warn('"newData" argument isn\'t specified, it was changed to null.')
                        : '<WARNING> "newData" argument isn\'t specified, it was changed to null.'
                )
                newData = null
            } else if (newData === null && !this.activeFlags.continueSettingThePathIfValueIsNull) {
                console.warn(
                    this.activeFlags.getAdvancedWarns ? new Warn('"newData" argument value is null, deleting...') : '<WARNING> "newData" argument value is null, deleting...'
                )
                await this.adelete(jsonPath)
                return
            }

            const ndata = LocalliumObjectManipulation.set((await this.aget()).val, jsonPath.split(this.activeFlags.keySeparator), newData)

            await fsp.writeFile(this.#fp, ndata, {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
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
            var spaces = this.activeFlags.jsonSpaces

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

            const mainVal = (await this.aget()).val
            if (typeof mainVal !== "object" && jsonPath.split(this.activeFlags.keySeparator).filter((x) => x).length > 0) {
                return {
                    deleted: false,
                    code: 422,
                    reason: `Can't delete "${jsonPath}" when main value is not object like`,
                }
            }

            if (!(await this.aget(jsonPath)).exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            const newData = LocalliumObjectManipulation.delete(mainVal, jsonPath.split(this.activeFlags.keySeparator), this.activeFlags.keepEmptyKeysWhileDeleting)

            await fsp.writeFile(this.#fp, JSON.stringify(newData, this.activeFlags.customMetadataReplacer, this.activeFlags.jsonSpaces ?? 0), {
                encoding: "utf8",
            })

            return {
                deleted: true,
                newJSON: LocalliumObjectManipulation.get(JSON.stringify(newData), []).val,
            }
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
}

module.exports = {
    Database,
    DatabaseFlags,
    LocalliumObjectManipulation,
}
