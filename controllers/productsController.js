const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const uploadAllProducts = async () =>{
    try {
        const products = await SQL.executeQuery(`SELECT articulo as 'code', costo_u as 'cost', descrip as 'description', linea as 'line', precio1 as 'price', impuesto as 'tax' FROM prods` )
        if(products.error) throw products.errorDetail
        const data = products.data[0]        
        
        for( const product of data){
            console.log(`Cargando Producto ${product.code} ${product.description}`);
            await firestore.collection('Productos').doc(product.code.toUpperCase()).set({
                code: product.code.toUpperCase(),
                cost: product.cost,
                description: product.description,
                line: product.line,
                price: product.price,
                tax: product.tax,
                app: false,
                server: true
            })
            console.log(`Producto Cargado ${product.code} ${product.description}`);
        }
        return data
    } catch (error) {
        console.log('Error:', error)
        log.write('products', error)
    }
}

const uploadModifiedProducts = async () => {
    try {
        const data = await SQL.executeQuery("SELECT DISTINCT mensaje, emisor, guid FROM mensajesparalanube WHERE tipo = 'sku' ")
        if(data.error) throw data.errorDetail
        const messages = data.data[0]
        if(messages.length === 0){
            log.write('products', 'No hay articulos para subir')
            return
        }

        for( const message of messages){
            const response = await SQL.executeQuery(`SELECT articulo as 'code', costo_u as 'cost', descrip as 'description', linea as 'line', precio1 as 'price', impuesto as 'tax' FROM prods WHERE articulo = '${message.guid}'`)
            if(response.error) throw response.errorDetail
            const [product] = response.data[0]
            await firestore.collection('Productos').doc(product.code.toUpperCase()).set({
                code: product.code.toUpperCase(),
                cost: product.cost,
                description: product.description,
                line: product.line,
                price: product.price,
                tax: product.tax,
                app: false,
                server: true
            })

            const wipe = await SQL.executeQuery(`DELETE FROM mensajesparalanube WHERE tipo = 'sku' AND guid = '${product.code}'`)
            if(wipe.error) throw wipe.errorDetail
        }
        return messages
    } catch (error) {
        console.log(error)
        log.write('products', error)
    }
}


module.exports = {
    uploadAllProducts,
    uploadModifiedProducts
}