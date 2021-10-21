const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const entryTypes = (entry, folio) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`

    return [
        {name:'ENTRADA', type:'int', value: folio},
        {name:'OCUPADO', type:'int', value: 0},
        {name:'TIPO_DOC', type:'varchar', value: 'CL+'},
        {name:'F_EMISION', type:'varchar', value: todayDate},
        {name:'IMPORTE', type:'float', value: entry.total},
        {name:'COSTO', type:'float', value: 0},
        {name:'ALMACEN', type:'int', value: entry.warehouse},
        {name:'ESTADO', type:'varchar', value: 'PE'},
        {name:'OBSERV', type:'varchar', value: `Device: ${entry.deviceName} Device ID: ${entry.deviceUniqueID} OBSERV: ${entry?.observations} Hecha Por: ${entry.user}`},
        {name:'DATOS', type:'varchar', value: `Entrada Hecha por la app`},
        {name:'USUARIO', type:'varchar', value: entry.user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'FOLIO', type:'int', value: entry.folio}
    ]
}

const partTypes = (product, folio, id, user) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`

    return [
        {name:'ENTRADA', type:'int', value: folio},
        {name:'TIPO_DOC', type:'varchar', value: 'CL+'},
        {name:'NO_REFEREN', type:'int', value: folio},
        {name:'ARTICULO', type:'varchar', value: product.code},
        {name:'CANTIDAD', type:'float', value: product.quantity},
        {name:'PRECIO', type:'float', value: product.cost},
        {name:'OBSERV', type:'varchar', value: product.description},
        {name:'PARTIDA', type:'int', value: 0 },
        {name:'ID_ENTRADA', type:'int', value: id },
        {name:'USUARIO', type:'varchar', value: user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'PRCANTIDAD', type:'int', value: 0},
        {name:'PRDESCRIP', type:'varchar', value: ''},
        {name:'CLAVEADD', type:'varchar', value: ''},
    ]
}


const downloadEntries = async () =>{
    try {
        const data = await firestore.collection('Entradas').where('server', '==', false).get()
        const entradas = []

        data.forEach( async (entradaData) => {
            const entrada = entradaData.data()
            entradas.push({...entrada, id: entradaData.id})
        })

        for ( const entrada of entradas ){
            try {
                const consec = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'MovEnt'`)
                const [consecMovEntData] = consec.data[0]
                const serverFolio = consecMovEntData.Consec + 1

                const query = await SQL.executeQuery(`INSERT INTO entradas ( ENTRADA , OCUPADO, TIPO_DOC, F_EMISION, IMPORTE, COSTO, ALMACEN, ESTADO, OBSERV, DATOS, USUARIO, USUFECHA, USUHORA, firestore_folio)
                    VALUES (@ENTRADA, @OCUPADO, @TIPO_DOC, @F_EMISION, @IMPORTE, @COSTO, @ALMACEN, @ESTADO, @OBSERV, @DATOS, @USUARIO, @USUFECHA, @USUHORA, @FOLIO)`, entryTypes(entrada, serverFolio) )

                if(query.error) throw query.errorDetail

                console.log('Entra')
                const updateConsec = await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'MovEnt'`)

                for( const product of entrada.products ){
                    const consecPartida = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'entpart'`)
                    const [consecEntPart] = consecPartida.data[0]
                    const idPartida = consecEntPart.Consec + 1

                    const insertPart = await SQL.executeQuery(`INSERT INTO entpart ( ENTRADA , TIPO_DOC, NO_REFEREN, ARTICULO, CANTIDAD, PRECIO, OBSERV, PARTIDA, ID_ENTRADA, USUARIO, USUFECHA, USUHORA, PRCANTIDAD, PRDESCRIP, CLAVEADD )
                    VALUES (@ENTRADA, @TIPO_DOC, @NO_REFEREN, @ARTICULO, @CANTIDAD, @PRECIO, @OBSERV, @PARTIDA, @ID_ENTRADA, @USUARIO, @USUFECHA, @USUHORA, @PRCANTIDAD, @PRDESCRIP, @CLAVEADD)`, partTypes({...product, warehouse: entrada.warehouse}, serverFolio, idPartida, entrada.user) )

                    console.log(insertPart)
                    
                    if(insertPart.error) throw insertPart.errorDetail
                    await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'entpart'`)
                }

                await firestore.collection('Entradas').doc(entrada.id).set({
                    server: true
                }, {merge: true})
            } catch (error) {
                console.log(error)
            }
        }

        return entradas
    } catch (error) {
        console.log(error)
        log.write('entries', error)
    }
    

    return entradas
}


module.exports = {
    downloadEntries
}