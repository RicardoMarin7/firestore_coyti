const express = require('express')
const config = require('./utils/config')
const SQL = require('./utils/SQL')
const app = express()
const userController = require('./controllers/userController')

app.use(express.json())

app.listen(config.port, () => console.log(`App listening on ${config.url} Port: ${config.port}`))

app.get('/users', (req, res) =>{
    userController.getUsers()
    res.send('Users')
})

app.get('/uploadUsers', (req, res) =>{
    userController.uploadUsers()
    res.send('Users')
})