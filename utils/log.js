const fs = require('fs')


const write = (type,error) =>{
    const date = new Date()
    // const today = `${date.getDay()}-${date.getMonth()}${date.getFullYear()}`
    const today = new Date().toLocaleDateString('en-CA')
    const hour = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    try {
        fs.appendFileSync(`./logs/${type}${today}`, `\n${hour} ${error}`)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    write
}