const express = require('express')
const config = require('./utils/config')
const app = express()
const userController = require('./controllers/userController')
const productController = require('./controllers/productsController')
const linesController = require('./controllers/linesController')
const entriesController = require('./controllers/entriesController')
const exitsController = require('./controllers/exitsController')
const providersController = require('./controllers/providersController')
const purchasesController = require('./controllers/purchasesController')

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

app.get('/uploadProds', async (req, res) =>{
    const data = await productController.uploadProducts()
    res.send(data)
})

app.get('/uploadLines', async (req, res) =>{
    const data = await linesController.uploadAllLines()
    res.send(data)
})

app.get('/downloadProducts', async (req, res) =>{
    const data = await productController.downloadModifiedProducts()
    res.send(data)
})

app.get('/downloadEntries', async (req,res) =>{
    const products = await productController.downloadModifiedProducts()
    const data = await entriesController.downloadEntries()
    res.send(data)
})

app.get('/downloadExits', async (req,res) =>{
    const products = await productController.downloadModifiedProducts()
    const data = await exitsController.downloadExits()
    res.send(data)
})

app.get('/uploadProviders', async (req,res) =>{
    const data = await providersController.uploadProviders()
    res.send(data)
})

app.get('/downloadPurchases', async (req,res) =>{
    const products = await productController.downloadModifiedProducts()
    const data = await purchasesController.downloadPurchases()
    res.send(data)
})