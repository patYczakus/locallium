const { locstxtoarr, locstxtojsdocstx } = require("../assets/main")
const { Warn, StackedError } = require("../assets/classes")

const flagsinfo = [
    ["getAdvancedWarns", "Uses the Warn class, extended from Error, to print a warn.", "t:boolean", false],
    ["createDatabaseFileOnReadIfDoesntExist", "When used Database#get (also Database#aget), creates a file if it doesn't exist.", "t:boolean", false],
    [
        "setValueToDatabaseFileOnReadIfDoesntExist",
        "When used Database#get (also Database#aget), [createDatabaseFileOnReadIfDoesntExist] is activated, and the file was freshly created, writes the declared stringified JSON object.",
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

class DatabaseFlags {
    /**
     * Static variable getting all of the flags.
     * @returns {string[]}
     */
    static get flagsList() {
        console.warn(new Warn("Whole class is deprecated since 1.4.0. Read the flags in JSDoc instead."))
        return flagsinfo.map((x) => x[0])
    }

    static get DEFAULT() {
        const sk = {}
        flagsinfo.forEach((x) => {
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
        console.warn(new Warn("Whole class is deprecated since 1.4.0. Read the flags in JSDoc instead."))
        if (!this.flagsList.includes(flag)) return console.error(new RangeError(`Unknown flag ${flag}`))
        var flag = flagsinfo.find((x) => x[0] === flag)
        return {
            description: flag[1],
            JSDoc_possibleValues: locstxtojsdocstx(flag[2]),
            defaultValue: flag[3],
        }
    }

    constructor(options = {}) {
        console.warn(new Warn("Whole class is deprecated since 1.4.0. To set flags, pass to the constructor of Database class."))
        var errors = []
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

    setFlag(flag, value) {
        if (!flagsinfo.map((s) => s[0]).includes(flag)) {
            throw new ReferenceError(`"options" argument contains undefined flag "${flag}". Acceptable options are: ${flagsinfo.map((s) => s[0]).join(", ")}.`)
        }

        const acceptedValues = locstxtoarr(flagsinfo.find((s) => s[0] == flag)[2])
        const jsdoc = locstxtojsdocstx(flagsinfo.find((s) => s[0] == flag)[2])

        if (
            typeof acceptedValues == "object" &&
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

function flagparser(flags) {
    if (!flags) {
        const sk = {}
        flagsinfo.forEach((x) => {
            sk[x[0]] = x[3]
        })
        return sk
    }
    if (typeof flags !== "object") throw new TypeError('"flags" argument must be an object.')
    if (flags instanceof DatabaseFlags) return flags.flags
    if (flags instanceof Object) {
        const _flags = DatabaseFlags.DEFAULT
        for (const [key, value] of Object.entries(flags)) {
            const keydata = flagsinfo.find((x) => x[0] == key)
            if (!keydata) throw new ReferenceError(`Unknown flag "${key}".`)

            const acceptedValues = locstxtoarr(keydata[2])
            const jsdoc = locstxtojsdocstx(keydata[2])
            if (
                typeof acceptedValues == "object" &&
                !acceptedValues.includes("t:" + typeof value) &&
                !(typeof value == "string" && acceptedValues.includes("s:" + value)) &&
                !(typeof value != "string" && acceptedValues.includes(value))
            ) {
                throw new TypeError(`Flag "${key}" has non-acceptable value. This flag must be equal to this JSDoc syntax: ${jsdoc}`)
            }

            if (typeof acceptedValues === "string" && acceptedValues !== "*") {
                console.error(new Error(`In analyzing, flag "${key}" didn't have a value such as array or specific string.`))
            } else {
                _flags[key] = value
            }
        }
        return _flags
    }
}
// -------------------------------------------------------------------
// /\ Flags
// \/ File databases
// -------------------------------------------------------------------
const fs = require("node:fs")
const fsp = fs.promises
const LocalliumObjectManipulation = require("./lom")
const LFM = require("./lfm")

class Database {
    #fp
    #exists
    constructor(filePath = "database", flags = null) {
        flags = flagparser(flags)

        this.#fp = filePath.replace(/(.*)\.json/g, "$1") + ".json"
        this.activeFlags = this.activeFlags = flagparser(flags)
        Object.freeze(this.activeFlags)
        this.#exists = this.activeFlags.checkFileExistFrom !== "methods" ? fs.existsSync(this.#fp) : null

        if (this.activeFlags.checkFileExistFrom !== "methods") {
            LFM.createifnotexists(this.#fp, this.activeFlags.setValueToDatabaseFileOnReadIfDoesntExist)
            fs.watch(this.#fp, null, (type) => {
                if (type == "rename") this.#exists = LFM.exists(this.#fp)
            })
        }
    }
    #fileExistSystem(createFile = true) {
        if (!(this.#exists ?? fs.existsSync(this.#fp))) {
            if (this.activeFlags.createDatabaseFileOnReadIfDoesntExist) {
                LFM.createifnotexists(this.#fp, this.activeFlags.setValueToDatabaseFileOnReadIfDoesntExist)
            }
            return false
        }
        return true
    }

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

            const json = this.activeFlags.customMetadataReviewer ? JSON.parse(file, this.activeFlags.customMetadataReviewer) : JSON.parse(file)
            // console.log(file, json)
            return LocalliumObjectManipulation.get(json, jsonPath)
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
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

            await fsp.writeFile(this.#fp, JSON.stringify(ndata, this.activeFlags.customMetadataReplacer, this.activeFlags.jsonSpaces ?? 0), {
                encoding: "utf8",
            })
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }
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

module.exports = { Database, DatabaseFlags }
