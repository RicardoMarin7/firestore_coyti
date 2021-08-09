const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const uploadProducts = async () =>{
    try {
        const products = await SQL.executeQuery(`SELECT articulo as 'code', costo_u as 'cost', descrip as 'description', linea as 'line', precio1 as 'price', impuesto as 'tax' FROM prods WHERE firestore = 0` )
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

const articleExists = async code => {
    try {
        const query = await SQL.executeQuery(`SELECT TOP 1 * FROM prods WHERE articulo = '${code}'`)
        return query.data[0].length > 0 ? true : false
    } catch (error) {
        console.log(error)
        log.write('products', error)
    }
}


const downloadModifiedProducts = async () =>{
    try {
        let products = []
        const data = await firestore.collection('Productos').where('server', '==', false).get()
        data.forEach( async (producto) => {
            products.push(producto.data())
        })

        for( const product of products){
            const articleExist = await articleExists(product.code)
            if(articleExist){
                updateArticleSQL(product)
                console.log(`Articulo actualizado con éxito ${product.code}`)
            }else{
                insertArticleSQL(product)
                console.log(`Articulo insertado con éxito ${product.code}`)
            }
        }
        
        return products
    } catch (error) {
        console.log('error')
        log.write('products', error)
    }
}

const articleTypes = product => {
    let taxValue = 0
    switch (product.tax){
        case 'IVA':
            taxValue = 16
        break
        case 'IE3':
            taxValue = 8
        break
        case 'SYS':
            taxValue = 0
        break
    }

    return [
        {name:'articulo', type:'varchar', value: product.code},
        {name:'descrip', type:'varchar', value: product.description},
        {name:'linea', type:'varchar', value: product.line},
        {name:'marca', type:'varchar', value: 'SYS'},
        {name:'unidad', type:'varchar', value: 'PIEZA'},
        {name:'impuesto', type:'nvarchar', value: product.tax},
        {name:'costo', type:'float', value: round(product.cost / (1 + (taxValue/100)), 4)},
        {name:'precio', type:'float', value: round(product.price / (1 + (taxValue/100)), 4)},
        {name:'paraventa', type:'bit', value: 1},
    ]
}
const insertArticleSQL = async product => {
    try {
        const query = await SQL.executeQuery(`INSERT INTO prods (articulo, descrip, linea, marca, unidad, impuesto, costo_u, precio1, paraventa) 
        VALUES (@articulo, @descrip, @linea, @marca, @unidad, @impuesto, @costo, @precio, @paraventa)`, articleTypes(product))

        if(!query.error){
            await firestore.collection('Productos').doc(product.code).set({
                server: true
            }, {merge: true})
        }
        
        if(query.error) throw query.errorDetail
    } catch (error) {
        console.log(error)
        log.write('products', error)
    }
}

const updateArticleSQL = async product =>{
    try {
        const query = await SQL.executeQuery(`UPDATE prods SET articulo = @articulo, 
        descrip = @descrip, 
        linea = @linea, 
        marca = @marca, 
        unidad = @unidad, 
        impuesto = @impuesto, 
        costo = @costo, 
        precio1 = @precio, 
        paraventa = @paraventa WHERE articulo = '${product.code}'`, articleTypes(product))

        if(!query.error){
            await firestore.collection('Productos').doc(product.code).set({
                server: true
            }, {merge: true})
        }
        
        if(query.error) throw query.errorDetail
    } catch (error) {
        console.log(error)
        log.write('products', error)
    }
}

const round = (value, decimals) =>  {
    return Number(Math.round(value +'e'+ decimals) +'e-'+ decimals).toFixed(decimals);
}


module.exports = {
    uploadProducts,
    uploadModifiedProducts,
    downloadModifiedProducts
}