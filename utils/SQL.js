const SQL = new (require('rest-mssql-nodejs'))({
    user: 'sa',
    password: '12345678',
    server: 'localhost',
    database: 'MyBusiness20',
    port: 1400
})

module.exports = SQL