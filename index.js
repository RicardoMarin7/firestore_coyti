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
const log = require('./utils/log')


app.use(express.json())

app.listen(config.port, () => console.log(`App listening on ${config.url} Port: ${config.port}`))


const cronUsers = async () =>{
    await userController.uploadUsers()
}


const cronProducts = async () =>{
    await productController.uploadProducts()
    await productController.downloadModifiedProducts()
}

const cronLines = async () =>{
    await linesController.uploadAllLines()
}

const cronEntries = async () =>{
    await productController.downloadModifiedProducts()
    await entriesController.downloadEntries()
}


const cronExits = async () =>{
    await productController.downloadModifiedProducts()
    await exitsController.downloadExits()
}

const cronProviders =  async () =>{
    await providersController.uploadProviders()
}

const cronPurchases =  async () =>{
    await productController.downloadModifiedProducts()
    purchasesController.downloadPurchases()
}

const initialUpload = async () =>{
    await userController.uploadUsers()
    await linesController.uploadLines()
    await providersController.uploadProviders()
    await productController.uploadProducts()
}

const minutes = 10, interval = minutes * 60 * 1000

const firstCron = async () =>{
    log.write('Cron',`First Cron`)
    await cronUsers()
    await cronProviders()
    await cronLines()
    await cronProducts()
    await cronEntries()
    await cronExits()
    await cronPurchases()
}

firstCron()

setInterval( async () =>{
    log.write('Cron',`Every ${minutes} minutes`)
    await cronUsers()
    await cronProviders()
    await cronLines()
    await cronProducts()
    await cronEntries()
    await cronExits()
    await cronPurchases()

}, interval)