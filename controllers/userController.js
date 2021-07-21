const firebase = require('../utils/db')
const User = require('../models/user')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')

const uploadUsers = async () =>{
    try {
        const users = await SQL.executeQuery('SELECT usuario, nombre, clave, supervisor FROM USUARIOS')
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

            console.log('Usuario actualizado:', user.usuario)
        }

    } catch (error) {
        console.log(error)
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
    }
}

module.exports = {
    getUsers,
    uploadUsers
}