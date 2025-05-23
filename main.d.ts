/**
```txt
|  __        ______    ______    ______    __        __        __    __  __    __    __ 
| /\ \      /\  __ \  /\  ___\  /\  __ \  /\ \      /\ \      /\ \  /\ \/\ \  /\ "-./  \
| \ \ \____ \ \ \/\ \ \ \ \____ \ \  __ \ \ \ \____ \ \ \____ \ \ \ \ \ \_\ \ \ \ \-./\ \     .   . .   .-. 
|  \ \_____\ \ \_____\ \ \_____\ \ \_\ \_\ \ \_____\ \ \_____\ \ \_\ \ \_____\ \ \_\ \ \_\   '|   `-|   |\| 
|   \/_____/  \/_____/  \/_____/  \/_/\/_/  \/_____/  \/_____/  \/_/  \/_____/  \/_/  \/_/    ' .   ' . `-' 
    ```
# | Your powerful local database system based on JSON.
## | Made by [patYczakus](https://github.com/patYczakus). Licensed under MIT License.
`Copyright (c) 2023 patYczakus`
*/
export as namespace locallium

/**
 * Snapshot of a value in an object. Used in `get` methods of various data classes.
 * @param exist Indicates whether the value exists in the object.
 * @param val The value itself. If the value does not exist, it will be `null`.
 */
declare type LocalliumSnapshot = {
    exist: boolean
    val: any
}

declare type LocalliumDeleteState<deleted extends boolean, errorcode extends number = number> = deleted extends true
    ? {
          deleted: true
          code: errorcode
          message: string
      }
    : {
          deleted: false
          newJSON: any
      }

declare type FileDatabaseFlags = {
    /**
     * Uses the Warn class, extended from Error, to print a warn.
     * @default false
     */
    getAdvancedWarns: boolean
    /**
     * When used `FileDatabase#get()` (also `FileDatabase#aget()` and `FileDatabaseV2#get()`), creates a file if it doesn't exist.
     * @default false
     */
    createDatabaseFileOnReadIfDoesntExist: boolean
    /**
     * When used `FileDatabase#get()` (also `FileDatabase#aget()` and `FileDatabaseV2#get()`), *`createDatabaseFileOnReadIfDoesntExist`* is activated, and the file was freshly created, writes the declared stringified JSON object.
     * @default "{}"
     */
    setValueToDatabaseFileOnReadIfDoesntExist: string
    /**
     * In default, `null` is treated like it is no value, and as a result, the path is being deleted on `FileDatabase#set()` (also `FileDatabase#aset()` and `FileDatabaseV2#set()`). Enabling this flag prevents this situation.
     * @default false
     */
    continueSettingThePathIfValueIsNull: boolean
    /**
     * Changes the behavior in deleting the main location keeping the parent key empty. Notice that it might also change the behavior when using `FileDatabase#get()` (also `FileDatabase#aget()` and `FileDatabaseV2#get()`)
     * @default false
     */
    keepEmptyKeysWhileDeleting: boolean
    /**
     * Declares the symbol to used as the separator on locations.
     * @default "."
     */
    keySeparator: string
    /**
     * Tells how many spaces is used (as a tab) on beautifing the JSON file. Setting `0` or `null` turns off the prettier.
     * @default 4
     */
    jsonSpaces: number | null
    /**
     * Means that all of errors (catched or locallium-maked) will be throwed.
     * @default false
     */
    alwaysThrowErrorsNoMatterWhat: boolean
    /**
     * Declarates which function use to check existence of file. `"methods"` means that checking will be in all methods from `FileDatabase` class. `"watchFunc"` uses `fs#watch()` listener.
     * @default "methods"
     */
    checkFileExistFrom: "watchFunc" | "methods"
    /**
     * Acts as a reviewer to `FileDatabase#get()` (also `FileDatabase#aget()` and `FileDatabaseV2#get()`).
     * @default (key, value) => value
     */
    customMetadataReviewer: (key: string, value: any, context: { source: string }) => any
    /**
     * Acts as a replacer to `FileDatabase#get()` (also `FileDatabase#aget()` and `FileDatabaseV2#get()`).
     * @default (key, value) => value
     */
    customMetadataReplacer: (key: string, value: any) => any
}
declare type FileDatabaseV2Flags = {
    /**
     * Time when the flush is activated.
     * @default 500
     */
    flushTimeout: number
    /**
     * The maximum elements that can be in pending state. If the amount of elements are exceeded, the flush is activated.
     * @default 10000
     */
    pendingLimit: number
    /**
     * Declares how many avaible RAM can be used on cache and chunking.
     * @default 0.5
     */
    ramUsageFloat: number
    /**
     * Declares how the pending changes will be threaten on `FileDatabaseV2#get()`.
     * - `"smart"` uses two methods `"flush"` and `"tempCache"` depending on RAM and elements. Flushing, *if neccesary**, is made in background.
     * - `"flush"` always flushes the pending changes.
     * - `"tempCache"` makes temponary changes
     * - `"exclude"` doesn't use pending changes, only when it flushes, it is saved.
     * @default "smart"
     */
    getChangesStrategy: "smart" | "flush" | "tempCache" | "exclude"
}

/**
 * Class for manipulating local objects.
 */
export class LocalliumObjectManipulation {
    /**
     * Gets value from Object (not only) based on the path.
     * @param json Any value, but recommend an Object.
     * @param jsonPath Special path localizing the place to get.
     * @returns `LocalliumSnapshot` with properties `#exists` and `#val`
     * @example
     * const { LocalliumObjectManipulation } = require("locallium")
     *
     * const obj = { a: { b: { c: 3 } } } // example object
     *
     * const snapshots = [
     *   //classic JSON operation
     *   LocalliumObjectManipulation.get(obj, ["a", "b", "c"]),
     *   LocalliumObjectManipulation.get(obj, ["a", "b", "d"]),
     *   LocalliumObjectManipulation.get({}, ["a", "b", "c"]),
     *
     *   //some primitives
     *   LocalliumObjectManipulation.get(2137, []),
     *   LocalliumObjectManipulation.get("bcd", ["a"]),
     *
     *   //and getting whole
     *   LocalliumObjectManipulation.get(obj, []),
     * ]
     *
     * console.log(...snapshots)
     * // => { exists: true, val: 3 }
     * // => { exists: false, val: null }
     * // => { exists: false, val: null }
     * // => { exists: true, val: 2137 }
     * // => { exists: false, val: null }
     * // => { exists: true, val: { a: { b: { c: 3 } } } }
     */
    static get(json: any, jsonPath: string[]): LocalliumSnapshot
    /**
     * Sets value to Object based on the path.
     * @param json Any value, but **highly** recommend an Object.
     * @param jsonPath Special path localizing the place to set.
     * @param newData New data to be set.
     * @returns New object with the value set.
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
    static set(json: any, jsonPath: string[], newData: any): any
    /**
     * Deletes a value from the Object based on the provided path.
     * @param {Object} json An Object.
     * @param {string[]} jsonPath Path to the value to delete.
     * @param {boolean} keepEmptySpace If true, empty objects are preserved.
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
     * console.log(newJson4) // => {}
     */
    static delete(json: Object, jsonPath: string[], keepEmptySpace: boolean): Object
    static "v1.2.0": {
        /**
         * Gets value from JSON string based on JSON path.
         * @deprecated since version **`1.3.0`**; use `.get(JSON.parse(json))` or `.get(object)` instead
         * @param json JSON data (stringified or object).
         * @param jsonPath JSON path to the value.
         * @returns `LocalliumSnapshot` with properties `#exists` and `#val`
         */
        get: (json: string, jsonPath: string[]) => LocalliumSnapshot
        /**
         * Sets value to JSON data based on JSON path.
         * @deprecated since version **`1.3.0`**; use `.set(JSON.parse(json))` or `.set(object)` instead
         * @param json JSON data (stringified or object).
         * @param jsonPath JSON path to the value.
         * @param newData New data to be set.
         * @param spaces Number of spaces for pretty printing JSON.
         * @returns New JSON string with the value set.
         */
        set: (json: string, jsonPath: string[], newData: any, spaces: number | null) => string
        /**
         * Deletes a value from the JSON data based on the provided path.
         * @deprecated since version **`1.3.0`**; use `.delete(JSON.parse(json))` or `.delete(object)` instead
         * @param json JSON data (stringified or object).
         * @param keys Path to the value to delete.
         * @param keepEmptyKeys If true, empty objects are preserved.
         * @returns The modified JSON data.
         */
        delete: (json: string | Object, keys: string[], keepEmptyKeys: boolean) => Object
    }
}

/**
 * First version of database system. Relies on `fs#readFile()` and `fs#writeFile()`.
 *
 * Best for small files that are not be saved that much.
 */
export class FileDatabase {
    constructor(jsonPath: string, flags?: Partial<FileDatabaseFlags>)
    readonly activeFlags: FileDatabaseFlags

    //synchronous methods
    /**
     * Gets some data in provided path.
     * @param {string} jsonPath JSON Path (default: empty string - it means get all)
     * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
     */
    get(jsonPath?: string): LocalliumSnapshot
    /**
     * Creates or replaces some value in provided path.
     * @param {string} jsonPath JSON path
     * @param {*} value Data to be inserted into the database, setting to `null` without enabled *`continueSettingThePathIfValueIsNull`* flag causes **the path deletion**.
     * @returns
     */
    set(jsonPath: string, value: any): void
    /**
     * Deletes value in provided path.
     * @param {string} jsonPath Existing path
     * @returns {LocalliumDeletionState} Deletion information. All empty values from the any key specified in the `jsonPath` argument will be deleted if *`keepEmptyKeysWhileDeleting`* flag is disabled.
     * @example
     * const { Databasae } = require("locallium")
     * const db = new FileDatabase()
     *
     * db.set("somePath", "someValue")
     * console.log(db.delete("somePath")) // => { deleted: true, newJSON: { ... } | null }
     * console.log(db.delete("somePath")) // => { deleted: false, code: 2404, reason: 'Data in location "somePath" does not exist.' }
     *
     * const anotherdb = new FileDatabase("../noExistingFolder/andFile")
     * console.log(anotherdb.delete("somePath")) // => { deleted: false, code: 1404, reason: 'File ../noExistingFolder/andFile.json does not exist.' }
     */
    delete(jsonPath: string): LocalliumDeleteState<boolean>

    //asynchronous methods
    /**
     * The same as `FileDatabase#get()`, but asynchromous
     */
    aget(jsonPath?: string): Promise<LocalliumSnapshot>
    /**
     * The same as `FileDatabase#set()`, but asynchromous
     */
    aset(jsonPath: string, value: any): Promise<void>
    /**
     * The same as `FileDatabase#delete()`, but asynchromous
     */
    adelete(jsonPath: string): Promise<LocalliumDeleteState<boolean>>
}
/**
 * @deprecated since version **`1.4.0`**; use `FileDatabase` instead.
 */
export const Database: typeof FileDatabase

/**
 * Fast database provider. Best for big files and ready to-go anytime.
 */
export class FileDatabaseV2 {
    constructor(jsonPath: string, flags?: Partial<FileDatabaseFlags & FileDatabaseV2Flags>)
    readonly activeFlags: FileDatabaseFlags & FileDatabaseV2Flags
    /**
     * Gets some data in provided path.
     * @param {string} jsonPath JSON Path (default: empty string - it means get all)
     * @returns {LocalliumSnapshot} `LocalliumSnapshot` with properties `#exists` and `#val`
     */
    get(jsonPath?: string): Promise<LocalliumSnapshot>
    /**
     * Creates or replaces some value in provided path.
     * @param {string} jsonPath JSON path
     * @param {*} value Data to be inserted into the database, setting to `null` without enabled *`continueSettingThePathIfValueIsNull`* flag causes **the path deletion**.
     * @returns
     */
    set(jsonPath: string, value: any): Promise<void>
    /**
     * Deletes value in provided path.
     * @param {string} jsonPath Existing path
     * @returns {LocalliumDeletionState} Deletion information. All empty values from the any key specified in the `jsonPath` argument will be deleted if *`keepEmptyKeysWhileDeleting`* flag is disabled.
     * @example
     * const { Databasae } = require("locallium")
     * const db = new FileDatabaseV2()
     *
     * await db.set("somePath", "someValue")
     * console.log(await db.delete("somePath")) // => { deleted: true, newJSON: { ... } | null }
     * console.log(await db.delete("somePath")) // => { deleted: false, code: 2404, reason: 'Data in location "somePath" does not exist.' }
     *
     * const anotherdb = new FileDatabaseV2("../noExistingFolder/andFile")
     * console.log(await anotherdb.delete("somePath")) // => { deleted: false, code: 1404, reason: 'File ../noExistingFolder/andFile.json does not exist.' }
     */
    delete(jsonPath: string): Promise<LocalliumDeleteState<boolean>>
}

/**
 * Just an alias for `LocalliumObjectManipulation` class.
 */
export const LOM: typeof LocalliumObjectManipulation
