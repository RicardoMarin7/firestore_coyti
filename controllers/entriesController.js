const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const entryTypes = entry =>(
    [
        {name:'TIPO_DOC', type:'varchar', value: 'CL+'},
        {name:'F_EMISION', type:'varchar', value: entry.date},
        {name:'IMPORTE', type:'float', value: entry.total},
        {name:'COSTO', type:'float', value: 0},
        {name:'ALMACEN', type:'int', value: entry.warehouse},
        {name:'ESTADO', type:'varchar', value: 'CO'},
        {name:'OBSERV', type:'varchar', value: `Device: ${entry.deviceName} Device ID:${entry.deviceUniqueID}`},
        {name:'DATOS', type:'varchar', value: `Entrada Hecha por la app`},
        {name:'USUARIO', type:'varchar', value: entry.user},
        {name:'FOLIO', type:'int', value: entry.folio}
    ]
)


const downloadEntries = async () =>{
    try {
        const data = await firestore.collection('Entradas').where('server', '==', false).get()
        const entradas = []

        data.forEach( async (entradaData) => {
            const entrada = entradaData.data()
            entradas.push(entrada)
            const query = await SQL.executeQuery(`INSERT INTO entradas (TIPO_DOC, F_EMISION, IMPORTE, COSTO, ALMACEN, ESTADO, OBSERV, DATOS, USUARIO, USUFECHA, USUHORA, firestore_folio)
                VALUES (@TIPO_DOC, @F_EMISION, @IMPORTE, @COSTO, @ALMACEN, @ESTADO, @OBSERV, @DATOS, @USUARIO, NOW(), NOW(), @FOLIO)`, entryTypes(entrada) )
            console.log(query)
        })

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