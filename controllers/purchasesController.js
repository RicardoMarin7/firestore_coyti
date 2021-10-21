const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const purchaseTypes = (purchase, folio) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`

    return [
        {name:'COMPRA', type:'int', value: folio},
        {name:'OCUPADO', type:'int', value: 0},
        {name:'TIPO_DOC', type:'varchar', value: 'COM'},
        {name:'F_EMISION', type:'varchar', value: todayDate},
        {name:'PROVEEDOR', type:'varchar', value: purchase.provider},
        {name:'FACTURA', type:'varchar', value: ''},
        {name:'IMPORTE', type:'float', value: purchase.total},
        {name:'DESCUENTO', type:'float', value: 0},
        {name:'IMPUESTO', type:'float', value: 0},
        {name:'COSTO', type:'float', value: 0},
        {name:'ALMACEN', type:'int', value: purchase.warehouse},
        {name:'ESTADO', type:'varchar', value: 'PE'},
        {name:'OBSERV', type:'varchar', value: `Device: ${purchase.deviceName} Device ID: ${purchase.deviceUniqueID} OBSERV: ${purchase?.observations} Hecha Por: ${purchase.user}`},
        {name:'TIPO_CAM', type:'int', value: 1},
        {name:'MONEDA', type:'varchar', value: 'MXN'},
        {name:'DESC1', type:'int', value: 0},
        {name:'DESC2', type:'int', value: 0},
        {name:'DESC3', type:'int', value: 0},
        {name:'DESC4', type:'int', value: 0},
        {name:'DESC5', type:'int', value: 0},
        {name:'DATOS', type:'varchar', value: `Compra Hecha por la app`},
        {name:'DESGLOSE', type:'int', value: -1},
        {name:'USUARIO', type:'varchar', value: purchase.user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'VENCIMIENTO', type:'varchar', value: todayDate},
        {name:'PORCENTAJEDERETENCION', type:'float', value: 0.00},
        {name:'RETENCION', type:'float', value: 0.00},
        {name:'FOLIO', type:'int', value: purchase.folio}
    ]
}

const partTypes = (product, folio, id, user) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`
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
        {name:'COMPRA', type:'int', value: folio},
        {name:'NO_REFEREN', type:'int', value: folio},
        {name:'TIPO_DOC', type:'varchar', value: 'COM'},
        {name:'ARTICULO', type:'varchar', value: product.code},
        {name:'CANTIDAD', type:'float', value: product.quantity},
        {name:'PRECIO', type:'float', value: product.cost},
        {name:'DESCUENTO', type:'float', value: 0},
        {name:'IMPUESTO', type:'float', value: taxValue},
        {name:'OBSERV', type:'varchar', value: product.description},
        {name:'PARTIDA', type:'int', value: 0 },
        {name:'ID_ENTRADA', type:'int', value: id },
        {name:'USUARIO', type:'varchar', value: user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'PRCANTIDAD', type:'int', value: 0},
        {name:'PRDESCRIP', type:'varchar', value: 0},
        {name:'CLAVEADD', type:'varchar', value: ''},
        {name:'DESCUENTOADICIONAL', type:'int', value: 0},
        {name:'DONATIVO', type:'int', value: 0},
        {name:'DESCUENTO1', type:'int', value: 0},
        {name:'DESCUENTO2', type:'int', value: 0},
        {name:'DESCUENTO3', type:'int', value: 0},
        {name:'DESCUENTO4', type:'int', value: 0},
        {name:'DESCUENTO5', type:'int', value: 0},
        {name:'DESCUENTO6', type:'int', value: 0},
        {name:'DESCUENTO7', type:'int', value: 0},
        {name:'DESCUENTO8', type:'int', value: 0},
        {name:'DESCUENTO9', type:'int', value: 0},
        {name:'DESCUENTO10', type:'int', value: 0},
    ]
}


const downloadPurchases = async () =>{
    try {
        const data = await firestore.collection('Compras').where('server', '==', false).get()
        const compras = []

        data.forEach( async (purchaseData) => {
            const purchase = purchaseData.data()
            compras.push({...purchase, id: purchaseData.id})
        })

        for ( const purchase of compras ){
            try {
                const consec = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'Compra'`)
                const [consecCompraData] = consec.data[0]
                const serverFolio = consecCompraData.Consec + 1

                const query = await SQL.executeQuery(`INSERT INTO compras ( COMPRA , OCUPADO, TIPO_DOC, FACTURA, F_EMISION, PROVEEDOR, IMPORTE, DESCUENTO, IMPUESTO, COSTO, ALMACEN, ESTADO, OBSERV, TIPO_CAM, MONEDA, DESC1, DESC2, DESC3, DESC4, DESC5, DATOS, DESGLOSE, USUARIO, USUFECHA, USUHORA, VENCIMIENTO, PORCENTAJEDERETENCION, RETENCION, firestore_folio)
                    VALUES (@COMPRA, @OCUPADO, @TIPO_DOC, @FACTURA, @F_EMISION, @PROVEEDOR, @IMPORTE, @DESCUENTO, @IMPUESTO, @COSTO, @ALMACEN, @ESTADO, @OBSERV, @TIPO_CAM, @MONEDA, @DESC1, @DESC2, @DESC3, @DESC4, @DESC5, @DATOS, @DESGLOSE, @USUARIO, @USUFECHA, @USUHORA, @VENCIMIENTO, @PORCENTAJEDERETENCION, @RETENCION, @FOLIO)`, purchaseTypes(purchase, serverFolio) )

                if(query.error) throw query.errorDetail

                console.log('Entra')
                const updateConsec = await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'compra'`)

                for( const product of purchase.products ){
                    const consecPartida = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'partcomp'`)
                    const [consecPartComp] = consecPartida.data[0]
                    const idPartida = consecPartComp.Consec + 1

                    const insertPart = await SQL.executeQuery(`INSERT INTO partcomp ( COMPRA , TIPO_DOC, NO_REFEREN, ARTICULO, CANTIDAD, PRECIO, DESCUENTO, IMPUESTO, OBSERV, PARTIDA, ID_ENTRADA, USUARIO, USUFECHA, USUHORA, PRCANTIDAD, PRDESCRIP, CLAVEADD, DESCUENTOADICIONAL, DONATIVO, DESCUENTO1, DESCUENTO2, DESCUENTO3, DESCUENTO4, DESCUENTO5, DESCUENTO6, DESCUENTO7, DESCUENTO8, DESCUENTO9, DESCUENTO10 )
                    VALUES (@COMPRA, @TIPO_DOC, @NO_REFEREN, @ARTICULO, @CANTIDAD, @PRECIO, @DESCUENTO, @IMPUESTO, @OBSERV, @PARTIDA, @ID_ENTRADA, @USUARIO, @USUFECHA, @USUHORA, @PRCANTIDAD, @PRDESCRIP, @CLAVEADD, @DESCUENTOADICIONAL, @DONATIVO, @DESCUENTO1, @DESCUENTO2, @DESCUENTO3, @DESCUENTO4, @DESCUENTO5, @DESCUENTO6, @DESCUENTO7, @DESCUENTO8, @DESCUENTO9, @DESCUENTO10 )`, partTypes({...product, warehouse: purchase.warehouse}, serverFolio, idPartida, purchase.user) )

                    console.log(insertPart)
                    
                    if(insertPart.error) throw insertPart.errorDetail
                    await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'partcomp'`)
                }

                await firestore.collection('Compras').doc(purchase.id).set({
                    server: true
                }, {merge: true})
            } catch (error) {
                console.log(error)
            }
        }

        return compras
    } catch (error) {
        console.log(error)
        log.write('entries', error)
    }
}


module.exports = {
    downloadPurchases
}