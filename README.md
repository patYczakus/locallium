# Locallium

_Locallium_ is a package that makes the local database from your JSON file. Concept is derivatived from [Firebase](https://firebase.google.com/), and created making private Discord bot to polish server [_Kruczy Gaj_](https://discord.gg/Y5pNk7Qn4X).

## Instalation

In command prompt, copy this command:

```bash
npm install locallium
```

## Database usage

All classes and functions have JSDoc documentation, so you can learn more about them while coding and see some examples.

> [!TIP]
> You can enable some flags. Check [_Types of flags and usage_](#types-of-flags-and-usage) for more

### Basics

All databases goes with get/set/delete pack.

-   **Get** returns a snapshot - existance boolean and value.
-   **Set** is just a void.
-   **Delete** return deletion state - if deleted, returns new JSON. If not, it gives an error code and a description.

### Differences

-   `FileDatabase` (old deprecated name: `Database`)
    -   It have a synchromous functions, and asynchromous ones ( prefixed with `a-`).
    -   Small system.
    -   Subtaible to small files.
    -   Saves alike 6200-6400 keys in 30 seconds.
-   `FileDatabaseV2`
    -   Only asynchromous functions.
    -   RAM Consumer (but it can be handled normally)
    -   Subtaible to huge files.
    -   Saves alike 171800-172000 keys in 30 seconds.

## Types of flags and usage

All databases classes have some flags that can be used to enable features. To use, check the code below:

```js
const { FileDatabase, FileDatabaseV2 } = require("locallium")

const data1 = new FileDatabase("database", {
    getAdvancedWarns: true,
    continueSettingThePathIfDoesntExist: true,
    continueSettingThePathIfValueIsNull: true,
})
const data2 = new FileDatabaseV2("database", {
    createDatabaseFileOnReadIfDoesntExist: true
    getAdvancedWarns: true,
    pendingLimit: 20000
})
```

List of flags will be shown by the IntelliDev, due to variaty of system types

> [!IMPORTANT]
> Using `DatabaseFlags` is deprecated since v1.4.0 due to TypeScript support. Although it is still supported, it is not recommended to use, and it isn't declarated in types. Plans about deleting it are on v1.6.0.

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

> [!NOTE]
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
