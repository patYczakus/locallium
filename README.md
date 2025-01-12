# Locallium

_Locallium_ is a package that makes the local database from your JSON file. Concept is derivatived from [Firebase](https://firebase.google.com/), and created making private Discord bot to polish server [_Kruczy Gaj_](https://discord.gg/Y5pNk7Qn4X).

## Instalation

In command prompt, copy this command:

```bash
npm install locallium
```

## Database usage

All classes and functions have JSDoc documentation, so you can learn more about them while coding and see some examples. In the bottom you can also see some program example.

> For flags configuration see: [Types of flags and usage](#types-of-flags-and-usage)

```js
const { Database, DatabaseFlags } = require("locallium")

const info = {
    filepath: "./databases/1", //converts as "./databases/1.json"
    flags: new DatabaseFlags(),
}
const db = new Database(info.filepath, info.flags)
let data = db.get()

if (data.exists) {
    data = data.val
    data.uses.last.i++
    data.uses.last.timestamp = Date.now()

    if ("dice" in data) console.log(`Dice number: ${data.dice}`)

    const deleteStatus = db.remove("data.dice")
    if (deleteStatus.deleted) {
        data = deleteStatus.newJSON
    } else {
        console.error("Couldn't delete data from database.", deleteStatus.reason)
    }
} else
    data = {
        uses: {
            firstTimestamp: Date.now(),
            last: {
                timestamp: Date.now(),
                i: 1,
            },
        },
        dice: Math.floor(Math.random() * 6) + 1,
    }

db.set("", data)
```

You can also use asynchromous functions, prefixed with letter "a": `Database#aget()`, `Database#aset()` and `Database#adelete()`

## Types of flags and usage

`DatabaseFlags` classes have some flags that can be used to enable features. To use, check the code below:

```js
const { Database, DatabaseFlags } = require("locallium")

// First method
const flags1 = new DatabaseFlags({
    getAdvancedWarns: true,
    continueSettingThePathIfDoesntExist: true,
    continueSettingThePathIfValueIsNull: true,
})

// Second method
const flags2 = new DatabaseFlags().setFlag("getAdvancedWarns", true).setFlag("continueSettingThePathIfDoesntExist", true).setFlag("continueSettingThePathIfValueIsNull", true)

flags2.setFlag("createDatabaseFileOnReadIfDoesntExist", true) // It will set it, too

const dbs = [new Database("database", flags1), new Database("database2", flags2)]
```

There is a list of flags, you can also use static getter `DatabaseFlags#flagsList` and method `DatabaseFlags#getFlagInfo()`:

-   Flag `getAdvancedWarns`
    -   > Uses the `Warn` class, extended from `Error`, to print a warn.
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `createDatabaseFileOnReadIfDoesntExist`
    -   > When used `Database#get()` or `Database#delete()` (or `Database#aget()`/`Database#adelete()` if asynchromous), creates a file if it doesn't exist.
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `setValueToDatabaseFileOnReadIfDoesntExist`
    -   > When used `Database#get()` (or `Database#aget()` if asynchromous), _`createDatabaseFileOnReadIfDoesntExist`_ is activated and the file was freshly created, writes the declared stringified JSON object.
    -   Possible values: string (stringified JSON)
    -   Default value: empty string
-   Flag `continueSettingThePathIfValueIsNull`
    -   > In default, `null` is treated like it is no value, and as a result, the path is being deleted on `Database#set()` using `Database#delete()` (also on `Database#aset()` using `Database#adelete()` if asynchromous). Enabling this flag prevents this situation.
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keepEmptyKeysWhileDeleting`
    -   > Changes the behavior in deleting the main location keeping the parent key empty. Notice that it might also change the behavior when using `Database#get()` (or `Database#aget()` if asynchromous)
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keySeparator`
    -   > Only changable on JSON path (file path)
    -   Possible values: string
    -   Default value: `"."`
-   Flag `jsonSpaces`
    -   > Tells how many spaces is used (as a tab) on beautifing the JSON file. Setting `0` or `null` turns off the prettier.
    -   Possible values: number or `null`
    -   Default value: `4`
-   Flag `alwaysThrowErrorsNoMatterWhat`
    -   > Means that all of errors (catched or locallium-maked) will be throwed
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `checkFileExistFrom`
    -   > Declarates which function use to check existence of file. `"methods"` means that checking will be in all methods from `Database` class. `"watchFunc"` uses `fs#watch()` listener.
    -   Possible values: `"watchFunc"` or `"methods"`
    -   Default value: `"methods"`
-   Flags `customMetadataReviewer` and `customMetadataReplacer`
    -   > Act as a special and standalone function to `Database#get()` (or `Database#aget()` if asynchromous).

## `LocalliumObjectManipulation`

> Requires _Locallium_ v1.2.0 or later

_Locallium_ also provides class to easily and fast import, export or remove the data from object variables. As mentioned before, `LocalliumObjectManipulation` has a built-in JSDoc.

```js
const { LocalliumObjectManipulation } = require("./main.js")

const info = {
    name: "John Doe",
    age: 30,
    address: {
        street: "123 Main St",
        city: "Anytown",
        zip: "12345",
    },
}

const nameSnapshot = LocalliumObjectManipulation.get(info, ["name"])
console.log(nameSnapshot.exists) // => true
console.log(nameSnapshot.val) // => "John Doe"

const newJsonData = LocalliumObjectManipulation.set(info, ["address", "zip"], "54321", null)
console.log(newJsonData) // => { "name": "John Doe", "age": 30, "address": { "street": "123 Main St", "city": "Anytown", "zip": "54321" } }

const updatedJsonData = LocalliumObjectManipulation.delete(info, ["address", "city"])
console.log(updatedJsonData) // => { "name": "John Doe", "age": 30, "address": { "street": "123 Main St", "zip": "54321" } }
```

> You can also use the older versions. There is a list:
>
> -   `v1.2.0`
>
> To use this, simply use `LocalliumObjectManipulation#<version>`.
>
> ```js
> LocalliumObjectManipulation["v1.2.0"].get("", [])
> ```
>
> It is not, however, recommended to use. They are flagged as `@deprecated`

## License

This package is licensed under the Apache License, Version 2.0.
