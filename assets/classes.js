module.exports = {
    Warn: class extends Error {},
    StackedError: class extends Error {
        /**
         * @param {...Error} errors
         */
        constructor(...errors) {
            super("Received more errors in one while")
            this.errors = errors
        }
    },
}
