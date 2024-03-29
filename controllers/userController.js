const firebase = require('../utils/db')
const User = require('../models/user')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const uploadUsers = async () =>{
    try {
        const users = await SQL.executeQuery('SELECT usuario, nombre, clave, supervisor, firestore FROM USUARIOS WHERE firestore = 0')
        if(users.error){
            throw users.errorDetail
        }
        const data = users.data[0]

        for( const user of data){
            // const password = user.clave.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            await firestore.collection('Usuarios').doc(user.usuario.toUpperCase()).set({
                user: user.usuario.toUpperCase(),
                name: user.nombre,
                password: user.clave,
                supervisor: user.supervisor === 1 ? true : false
            }, { merge: true})

            const userUpdate = await SQL.executeQuery(`UPDATE usuarios SET firestore = 1 WHERE usuario = '${user.usuario}'`)
            console.log('Usuario actualizado:', user.usuario)
        }

    } catch (error) {
        console.log(error)
        log.write('users', error)
    }
}

const getUsers = async () =>{
    try {
        const users = await firestore.collection('Usuarios').get()
        users.forEach( doc =>{
            console.log(`${doc.id} =>`)
            console.log(doc.data())
        })
    } catch (error) {
        console.log(error);
        log.write('users', error)
    }
}

module.exports = {
    getUsers,
    uploadUsers
}