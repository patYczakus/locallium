const { locstxtoarr, locstxtojsdocstx } = require("../assets/main")
const { Warn } = require("../assets/classes")

const flagsinfo = [
    ["getAdvancedWarns", "t:boolean", false],
    ["createDatabaseFileOnReadIfDoesntExist", "t:boolean", false],
    ["setValueToDatabaseFileOnReadIfDoesntExist", "t:string", "{}"],
    ["continueSettingThePathIfValueIsNull", "t:boolean", false],
    ["keepEmptyKeysWhileDeleting", "t:boolean", false],
    ["keySeparator", "t:string", "."],
    ["jsonSpaces", "t:number//null", 4],
    ["alwaysThrowErrorsNoMatterWhat", "t:boolean", false],
    ["checkFileExistFrom", "s:watchFunc//s:methods", "methods"],
    ["customMetadataReviewer", "t:function//null", null],
    ["customMetadataReplacer", "t:function//null", null],
    ["flushTimeout", "t:number", 500],
    ["pendingLimit", "t:number", 10000],
    ["ramUsageFloat", "t:number", 0.5],
    ["getChangesStrategy", "s:smart//s:flush//s:tempCache//s:exclude", "smart"],
    ["includeOutsideChanges", "t:boolean", false],
]

function flagparser(flags) {
    const defaultv = {}
    flagsinfo.map((x) => {
        if (!x) return
        defaultv[x[0]] = x[2]
    })
    if (!flags) return defaultv
    if (typeof flags !== "object") throw new TypeError('"flags" argument must be an object.')
    if (flags instanceof Object) {
        for (const [key, value] of Object.entries(flags)) {
            const keydata = flagsinfo.find((x) => x[0] == key)
            if (!keydata) throw new ReferenceError(`Unknown flag "${key}".`)

            const acceptedValues = locstxtoarr(keydata[1])
            const jsdoc = locstxtojsdocstx(keydata[1])
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
                defaultv[key] = value
            }
        }
        return defaultv
    }
}
// -------------------------------------------------------------------
// /\ Flags
// \/ File databases
// -------------------------------------------------------------------
const fs = require("node:fs")
const fsp = fs.promises
const JSONStream = require("JSONStream")
const LocalliumObjectManipulation = require("./lom")
const LFM = require("./lfm")
const writeFileAtomic = require("write-file-atomic")
const os = require("node:os")

class Database {
    #fp
    #exists
    #pendingChanges = []
    #flushTimeout = null
    #currentData = null
    #isDirty = false
    #chbt = false

    constructor(filePath = "database", flags = null) {
        flags = flagparser(flags)
        this.#fp = filePath.replace(/(.*)\.json/g, "$1") + ".json"
        this.activeFlags = flagparser(flags)
        Object.freeze(this.activeFlags)
        this.#exists = this.activeFlags.checkFileExistFrom !== "methods" ? LFM.exists(this.#fp) : null

        if (this.activeFlags.checkFileExistFrom !== "methods") {
            LFM.createifnotexists(this.#fp, this.activeFlags.setValueToDatabaseFileOnReadIfDoesntExist)
        }
        let lastEvent = 0
        require("fs").watch(this.#fp, null, (type) => {
            const now = Date.now()
            if (type === "rename" && this.activeFlags.checkFileExistFrom !== "methods" && now - lastEvent > 1000) {
                this.#exists = LFM.exists(this.#fp)
                lastEvent = now
            } else if (type === "change" && this.activeFlags.includeOutsideChanges && this.#chbt) {
                this.#chbt = false
                this.#currentData = null
            }
        })

        process.on("exit", async () => {
            await this.close()
        })
    }

    async #fileExistSystem() {
        if (!(this.#exists ?? fs.existsSync(this.#fp))) {
            if (this.activeFlags.createDatabaseFileOnReadIfDoesntExist) {
                LFM.createifnotexists(this.#fp, this.activeFlags.setValueToDatabaseFileOnReadIfDoesntExist)
            }
            return false
        }
        return true
    }

    #getChunkSize() {
        const freeMem = os.freemem()
        const maxMem = freeMem * this.activeFlags.ramUsageFloat
        return Math.min(Math.max(Math.floor(maxMem * 0.1), 16 * 1024), 16 * 1024 * 1024)
    }

    async #scheduleFlush() {
        if (this.#flushTimeout) {
            clearTimeout(this.#flushTimeout)
        }

        this.#flushTimeout = setTimeout(async () => {
            await this.#flush()
        }, this.activeFlags.flushTimeout)
    }

    async #flush() {
        if (!this.#isDirty || this.#pendingChanges.length === 0) return

        try {
            const freeMem = os.freemem() * this.activeFlags.ramUsageFloat
            const fileStats = await fsp.stat(this.#fp).catch(() => ({ size: 0 }))
            const fileSize = fileStats.size

            if (this.#currentData === null && fileSize >= freeMem) {
                this.#currentData = (await this.get()).val || {}
            }

            let updatedData = this.#currentData
            for (const change of this.#pendingChanges) {
                if (change.delete) {
                    updatedData = LocalliumObjectManipulation.delete(updatedData, change.jsonPath, this.activeFlags.keepEmptyKeysWhileDeleting)
                } else {
                    updatedData = LocalliumObjectManipulation.set(updatedData, change.jsonPath, change.newData)
                }
            }

            this.#chbt = true
            await writeFileAtomic(this.#fp, JSON.stringify(updatedData, this.activeFlags.customMetadataReplacer, this.activeFlags.jsonSpaces ?? 0))

            this.#currentData = updatedData
            this.#pendingChanges = []
            this.#isDirty = false
            this.#flushTimeout = null
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    async #get(jsonPath = "") {
        try {
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            jsonPath = jsonPath.split(this.activeFlags.keySeparator)

            if (!(await this.#fileExistSystem())) {
                return { exists: false, val: null }
            }

            if (this.#currentData !== null) {
                const cloneData = structuredClone(this.#currentData)
                return LocalliumObjectManipulation.get(this.#currentData, jsonPath)
            }

            const freeMem = os.freemem() * this.activeFlags.ramUsageFloat
            const fileStats = await fsp.stat(this.#fp).catch(() => ({ size: 0 }))
            const fileSize = fileStats.size

            if (fileSize < freeMem) {
                this.#currentData = JSON.parse(await fsp.readFile(this.#fp, "utf8"))
                const cloneData = structuredClone(this.#currentData)
                return LocalliumObjectManipulation.get(cloneData, jsonPath)
            } else {
                const chunkSize = this.#getChunkSize()
                const stream = fs.createReadStream(this.#fp, { encoding: "utf8", highWaterMark: chunkSize })
                const parser = JSONStream.parse(jsonPath.length ? jsonPath : "*")

                let result
                await new Promise((resolve, reject) => {
                    stream
                        .pipe(parser)
                        .on("data", (data) => {
                            result = this.activeFlags.customMetadataReviewer ? JSON.parse(JSON.stringify(data), this.activeFlags.customMetadataReviewer) : data
                            stream.destroy()
                        })
                        .on("end", resolve)
                        .on("error", reject)
                        .on("close", resolve)
                })

                return { exists: !!result, val: structuredClone(result) }
            }
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    async get(jsonPath = "") {
        try {
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')
            jsonPath = jsonPath.split(this.activeFlags.keySeparator)

            if (!(await this.#fileExistSystem())) {
                return { exists: false, val: null }
            }

            const freeMem = os.freemem() * this.activeFlags.ramUsageFloat
            const fileStats = await fsp.stat(this.#fp).catch(() => ({ size: 0 }))
            const fileSize = fileStats.size

            if (this.#pendingChanges.length > 0) {
                if (this.activeFlags.getChangesStrategy === "flush") {
                    if (this.#flushTimeout) {
                        clearTimeout(this.#flushTimeout)
                        this.#flushTimeout = null
                    }
                    await this.#flush()
                } else if (
                    this.activeFlags.getChangesStrategy === "tempCache" ||
                    (this.activeFlags.getChangesStrategy === "smart" && fileSize < freeMem && this.#pendingChanges.length <= this.activeFlags.pendingLimit)
                ) {
                    if (this.#currentData !== null || fileSize < freeMem) {
                        if (this.#currentData === null) {
                            this.#currentData = JSON.parse(await fsp.readFile(this.#fp, "utf8"))
                        }
                        let tempData = this.#currentData
                        for (const change of this.#pendingChanges) {
                            if (change.delete) {
                                tempData = LocalliumObjectManipulation.delete(tempData, change.jsonPath, this.activeFlags.keepEmptyKeysWhileDeleting)
                            } else {
                                tempData = LocalliumObjectManipulation.set(tempData, change.jsonPath, change.newData)
                            }
                        }
                        return LocalliumObjectManipulation.get(tempData, jsonPath)
                    }
                } else if (this.activeFlags.getChangesStrategy === "smart" && this.#isDirty) {
                    if (this.#flushTimeout) {
                        clearTimeout(this.#flushTimeout)
                        this.#flushTimeout = null
                    }
                    if (this.#isDirty) {
                        setImmediate(() => this.#flush())
                    }
                }
            }

            return await this.#get(jsonPath.join(this.activeFlags.keySeparator))
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    async set(jsonPath, newData) {
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
                await this.delete(jsonPath)
                return
            }

            const freeMem = os.freemem() * this.activeFlags.ramUsageFloat
            const fileStats = await fsp.stat(this.#fp).catch(() => ({ size: 0 }))
            const fileSize = fileStats.size

            if (this.#currentData === null && fileSize < freeMem) {
                this.#currentData = JSON.parse(await fsp.readFile(this.#fp, "utf8").catch(() => "{}"))
            }

            this.#pendingChanges.push({ jsonPath: jsonPath.split(this.activeFlags.keySeparator), newData })
            this.#isDirty = true

            if (this.#pendingChanges.length > this.activeFlags.pendingLimit) {
                if (this.#flushTimeout) {
                    clearTimeout(this.#flushTimeout)
                    this.#flushTimeout = null
                }
                await this.#flush()
            } else {
                this.#scheduleFlush()
            }
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    async delete(jsonPath) {
        try {
            if (typeof jsonPath === "undefined") throw new TypeError('"jsonPath" argument is required.')
            if (typeof jsonPath !== "string") throw new TypeError('"jsonPath" argument must be a string.')

            if (!(await this.#fileExistSystem())) {
                return {
                    deleted: false,
                    code: 1404,
                    reason: `File ${this.#fp} does not exist.`,
                }
            }

            const freeMem = os.freemem() * this.activeFlags.ramUsageFloat
            const fileStats = await fsp.stat(this.#fp).catch(() => ({ size: 0 }))
            const fileSize = fileStats.size

            if (this.#currentData === null && fileSize < freeMem) {
                this.#currentData = JSON.parse(await fsp.readFile(this.#fp, "utf8").catch(() => "{}"))
            }

            const mainVal = this.#currentData || (await this.#get()).val
            if (typeof mainVal !== "object" && jsonPath.split(this.activeFlags.keySeparator).filter((x) => x).length > 0) {
                return {
                    deleted: false,
                    code: 422,
                    reason: `Can't delete "${jsonPath}" when main value is not object like`,
                }
            }

            const pathArray = jsonPath.split(this.activeFlags.keySeparator)
            if (!(await this.#get(jsonPath)).exists) {
                return {
                    deleted: false,
                    code: 2404,
                    reason: `Data in location "${jsonPath}" does not exist.`,
                }
            }

            this.#pendingChanges.push({ jsonPath: pathArray, delete: true })
            this.#isDirty = true

            if (this.#pendingChanges.length > this.activeFlags.pendingLimit) {
                if (this.#flushTimeout) {
                    clearTimeout(this.#flushTimeout)
                    this.#flushTimeout = null
                }
                await this.#flush()
            } else {
                this.#scheduleFlush()
            }

            return {
                deleted: true,
                newJSON: null,
            }
        } catch (err) {
            if (this.activeFlags.alwaysThrowErrorsNoMatterWhat) throw err
            else console.error(err)
        }
    }

    async close() {
        if (this.#flushTimeout) {
            clearTimeout(this.#flushTimeout)
        }
        await this.#flush()
    }
}

module.exports = { Database }
