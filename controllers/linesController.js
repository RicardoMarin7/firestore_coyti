const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const uploadLines = async () =>{
    try {
        const data = await SQL.executeQuery(`SELECT linea as 'line', descrip as 'description', firestore FROM lineas WHERE firestore = 0`)
        if(data.error) throw data.errorDetail
        const lines = data.data[0]        
        
        for( const line of lines){
            console.log(`Cargando Linea ${line.line} ${line.description}`);
            await firestore.collection('Lineas').doc(line.line.toUpperCase()).set({
                line: line.line,
                description: line.description
            })
            console.log(`Linea cargada ${line.line} ${line.description}`)

            const updateline = await SQL.executeQuery(`UPDATE lineas SET firestore = 1 WHERE linea = '${line.line}'`)
            console.log(updateline)
            if(updateline.error) throw updateline.errorDetail
        }
        return lines
    } catch (error) {
        log.write('lines', error)
    }
}

module.exports = {
    uploadLines
}