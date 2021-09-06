const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const exitTypes = (exit, folio) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`

    return [
        {name:'SALIDA', type:'int', value: folio},
        {name:'OCUPADO', type:'int', value: 0},
        {name:'TIPO_DOC', type:'varchar', value: 'CL+'},
        {name:'F_EMISION', type:'varchar', value: exit.date},
        {name:'IMPORTE', type:'float', value: exit.total},
        {name:'COSTO', type:'float', value: 0},
        {name:'ALMACEN', type:'int', value: exit.warehouse},
        {name:'ESTADO', type:'varchar', value: 'PE'},
        {name:'OBSERV', type:'varchar', value: `Device: ${exit.deviceName} Device ID: ${exit.deviceUniqueID} OBSERV: ${exit?.observations} Hecha Por: ${exit.user}`},
        {name:'DATOS', type:'varchar', value: `Salida Hecha por la app`},
        {name:'USUARIO', type:'varchar', value: exit.user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'ALMT', type:'int', value: 0},
        {name:'ESTRASPASO', type:'int', value: 0},
        {name:'SUCURSAL', type:'varchar', value: ''},
        {name:'ESPARASUCURSAL', type:'int', value: 0},
        {name:'ESTACION', type:'varchar', value: 'ESTACION01'},
        {name:'TRASPASOAESTACION', type:'int', value: 0},
        {name:'CLIENTE', type:'varchar', value: ''},
        {name:'FECHARETORNO', type:'varchar', value: '06-21-1999'},
        {name:'EMPLEADO', type:'varchar', value: ''},
        {name:'PARAEMPLEADO', type:'int', value: 0},
        {name:'DIRECCIONEMBARQUE', type:'varchar', value: ''},
        {name:'FOLIO', type:'int', value: folio}
    ]
}

const partTypes = (product, folio, id, user) =>{
    const date = new Date()
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const todayDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`

    return [
        {name:'SALIDA', type:'int', value: folio},
        {name:'TIPO_DOC', type:'varchar', value: 'CL-'},
        {name:'NO_REFEREN', type:'int', value: folio},
        {name:'ARTICULO', type:'varchar', value: product.code},
        {name:'CANTIDAD', type:'float', value: product.quantity},
        {name:'PRECIO', type:'float', value: product.cost},
        {name:'OBSERV', type:'varchar', value: product.description},
        {name:'PARTIDA', type:'int', value: 0 },
        {name:'ID_SALIDA', type:'int', value: id },
        {name:'USUARIO', type:'varchar', value: user},
        {name:'USUFECHA', type:'varchar', value: todayDate},
        {name:'USUHORA', type:'varchar', value: time},
        {name:'PRCANTIDAD', type:'int', value: 0},
        {name:'PRDESCRIP', type:'varchar', value: ''},
        {name:'CLAVEADD', type:'varchar', value: ''},
    ]
}


const downloadExits = async () =>{
    try {
        const data = await firestore.collection('Salidas').where('server', '==', false).get()
        const salidas = []

        data.forEach( async (salidaData) => {
            const salida = salidaData.data()
            salidas.push({...salida, id: salidaData.id})
        })

        for ( const salida of salidas ){
            try {
                const consec = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'Salida'`)
                const [consecSalidaData] = consec.data[0]
                const serverFolio = consecSalidaData.Consec + 1

                const query = await SQL.executeQuery(`INSERT INTO salidas ( SALIDA , OCUPADO, TIPO_DOC, F_EMISION, IMPORTE, COSTO, ALMACEN, ESTADO, OBSERV, DATOS, USUARIO, USUFECHA, USUHORA, firestore_folio, ALMT, ESTRASPASO, SUCURSAL, ESPARASUCURSAL, ESTACION, TRASPASOAESTACION, CLIENTE, FECHARETORNO, EMPLEADO, PARAEMPLEADO, DIRECCIONEMBARQUE)
                    VALUES (@SALIDA, @OCUPADO, @TIPO_DOC, @F_EMISION, @IMPORTE, @COSTO, @ALMACEN, @ESTADO, @OBSERV, @DATOS, @USUARIO, @USUFECHA, @USUHORA, @FOLIO, @ALMT, @ESTRASPASO, @SUCURSAL, @ESPARASUCURSAL, @ESTACION, @TRASPASOAESTACION, @CLIENTE, @FECHARETORNO, @EMPLEADO, @PARAEMPLEADO, @DIRECCIONEMBARQUE)`, exitTypes(salida, serverFolio) )

                if(query.error) throw query.errorDetail

                console.log('Entra')
                const updateConsec = await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'Salida'`)

                for( const product of salida.products ){
                    const consecPartida = await SQL.executeQuery(`SELECT * FROM consec WHERE dato = 'salpart'`)
                    const [consecSalPart] = consecPartida.data[0]
                    const idPartida = consecSalPart.Consec + 1

                    const insertPart = await SQL.executeQuery(`INSERT INTO salpart ( SALIDA , TIPO_DOC, NO_REFEREN, ARTICULO, CANTIDAD, PRECIO, OBSERV, PARTIDA, ID_SALIDA, USUARIO, USUFECHA, USUHORA, PRCANTIDAD, PRDESCRIP, CLAVEADD )
                    VALUES (@SALIDA, @TIPO_DOC, @NO_REFEREN, @ARTICULO, @CANTIDAD, @PRECIO, @OBSERV, @PARTIDA, @ID_SALIDA, @USUARIO, @USUFECHA, @USUHORA, @PRCANTIDAD, @PRDESCRIP, @CLAVEADD)`, partTypes({...product, warehouse: salida.warehouse}, serverFolio, idPartida, salida.user) )

                    console.log(insertPart)
                    
                    if(insertPart.error) throw insertPart.errorDetail
                    await SQL.executeQuery(`UPDATE consec SET consec = consec + 1 WHERE dato = 'salpart'`)
                }

                await firestore.collection('Salidas').doc(salida.id).set({
                    server: true
                }, {merge: true})
            } catch (error) {
                console.log(error)
            }
        }

        return salidas
    } catch (error) {
        console.log(error)
        log.write('Exits', error)
    }
}


module.exports = {
    downloadExits
}