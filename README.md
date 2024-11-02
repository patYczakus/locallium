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
    -   > Uses `Error`-likes classes to show warns
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `createDatabaseFileOnReadIfDoesntExist`
    -   > Creates file when used any method from `Database` class
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `setValueToDatabaseFileOnReadIfDoesntExist`
    -   > Only if _`createDatabaseFileOnReadIfDoesntExist`_ is set to `true`
    -   Possible values: string (stringified JSON)
    -   Default value: empty string
-   Flag `continueSettingThePathIfValueIsNull`
    -   > Changes the behavior hen new data is `null` - when this flag is `false`, `Database#delete()` (or `Database#adelete()` if asynchromous) is used.
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keepEmptyKeysWhileDeleting`
    -   > Means that JSON target path is deleted, not touching the empty parents
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keySeparator`
    -   > Only changable on JSON path (file path)
    -   Possible values: string
    -   Default value: `"."`
-   Flag `jsonSpaces`
    -   > Causes formatting file when provided
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

## `LocalliumObjectManipulation`

> Requires _Locallium_ v1.2.0 or later

_Locallium_ also provides class to easily and fast import, export or remove the data from object variables. As mentioned before, `LocalliumObjectManipulation` has a built-in JSDoc.

```js
const { LocalliumObjectManipulation } = require("./main.js")

const jsonData = JSON.stringify({
    name: "John Doe",
    age: 30,
    address: {
        street: "123 Main St",
        city: "Anytown",
        zip: "12345",
    },
})

const nameSnapshot = LocalliumObjectManipulation.get(jsonData, ["name"])
console.log(nameSnapshot.exists) // => true
console.log(nameSnapshot.val) // => "John Doe"

const newJsonData = LocalliumObjectManipulation.set(jsonData, ["address", "zip"], "54321", null)
console.log(newJsonData) // => {"name": "John Doe", "age": 30, "address": {"street": "123 Main St", "city": "Anytown", "zip": "54321"}}

const updatedJsonData = LocalliumObjectManipulation.delete(newJsonData, ["address", "city"])
console.log(updatedJsonData) // => {"name": "John Doe", "age": 30, "address": {"street": "123 Main St", "zip": "54321"}}
```

## License

This package is licensed under the Apache License, Version 2.0.
