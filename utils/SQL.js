const config = require('./config')
const SQL = new (require('rest-mssql-nodejs'))(config.sqlServerConfig)

module.exports = SQL