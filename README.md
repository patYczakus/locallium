# Locallium

_Locallium_ is a package that makes the local database from your JSON file. Concept is derivatived from [Firebase](https://firebase.google.com/), and created making private Discord bot to polish server [_Kraczy gaj_](https://discord.gg/Y5pNk7Qn4X).

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

There is a list of flags, you can also use static getter `DatabaseFlags.flagsList` and method `DatabaseFlags.getFlagInfo()`:

-   Flag `getAdvancedWarns`
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `createDatabaseFileOnReadIfDoesntExist`
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `setValueToDatabaseFileOnReadIfDoesntExist`
    -   > Only if _`createDatabaseFileOnReadIfDoesntExist`_ is set to `true`
    -   Possible values: string (stringified JSON)
    -   Default value: empty string
-   Flag `continueSettingThePathIfValueIsNull`
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keepEmptyKeysWhileDeleting`
    -   Possible values: boolean
    -   Default value: `false`
-   Flag `keySeparator`
    -   Possible values: string
    -   Default value: `"."`

## License

This package is licensed under the Apache License, Version 2.0.
