module.exports = {
    FileDatabase: require("./addons/filedb").Database,
    FileDatabaseV2: require("./addons/filedbv2").Database,
    Database: require("./addons/filedb").Database,
    DatabaseFlags: require("./addons/filedb").DatabaseFlags,
    LocalliumObjectManipulation: require("./addons/lom"),
    LOM: require("./addons/lom"),
}
