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
            await firestore.collection('Usuarios').doc(user.usuario).set({
                user: user.usuario,
                name: user.nombre,
                password: user.clave,
                supervisor: user.supervisor === 1 ? true : false
            }, { merge: true})

            console.log('Usuarios actualizados con éxito')
        }

    } catch (error) {
        console.log(error)
    }
}

const decryptUserPassword = () => {

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