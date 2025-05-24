class LocalliumObjectManipulation {
    static get(json, jsonPath) {
        if (typeof json == "object" && json !== null ? Object.keys(json).length == 0 : !Boolean(json)) {
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

    static set(json, jsonPath, newData) {
        const changeJSONValue = (json, keys) => {
            const data = json
            let current = data

            for (const key of keys.slice(0, -1)) {
                if (!current[key]) {
                    current[key] = {}
                }
                current = current[key]
            }
            current[keys.at(-1)] = newData

            return data
        }

        if (typeof json != "object" || json == null) json = {}

        let ndata

        if (jsonPath.filter((x) => x).length > 0) {
            ndata = changeJSONValue(json, jsonPath)
        } else {
            ndata = newData
        }

        return ndata
    }

    static delete(json, jsonPath, keepEmptyKeys = false) {
        if (jsonPath.length === 0) {
            return keepEmptyKeys ? json : {}
        }

        const data = json
        let n = 0
        let ended = false

        do {
            let current = data
            for (let i = 0; i < jsonPath.length - 1 - n; i++) {
                const key = jsonPath[i]
                current = current[key]
            }

            if (
                ((typeof current[jsonPath.at(-1 - n)] === "object" ? Object.keys(current[jsonPath.at(-1 - n)] ?? {}).length === 0 : !current[jsonPath.at(-1 - n)]) || n == 0) &&
                n < jsonPath.length
            ) {
                delete current[jsonPath.at(-1 - n)]
                n++
            } else {
                ended = true
            }
        } while (!keepEmptyKeys && !ended)

        return data
    }

    static "v1.2.0" = {
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
                val: structuredClone(json),
            }
        },

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

            return structuredClone(ndata)
        },

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

            return structuredClone(data)
        },
    }
}

module.exports = LocalliumObjectManipulation
