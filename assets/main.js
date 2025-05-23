const typeofKeys = ["string", "boolean", "number", "bigint", "function", "undefined", "object", "symbol"]

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

module.exports = {
    locstxtoarr,
    locstxtojsdocstx,
    typeofKeys,
}
