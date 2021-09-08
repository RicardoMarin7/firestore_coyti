const firebase = require('../utils/db')
const firestore = firebase.firestore()
const SQL = require('../utils/SQL')
const log = require('../utils/log')

const uploadProviders = async () =>{
    try {
        const data = await SQL.executeQuery(`SELECT proveedor as 'id', nombre as 'name' FROM proveed WHERE firestore = 0`)
        if(data.error){
            throw data.errorDetail
        }

        const providers = data.data[0]

        if(providers.length === 0){
            log.write('providers', 'No hay proveedores para subir')
            return 'No Hay Proveedores Para Subir'
        }

        const devices = await firestore.collection('Dispositivos').get()
        devices.forEach( async (deviceData) => {
            const device = deviceData.data()
            for( const provider of providers){
                await firestore.collection(`Proveedores${device.id}`).doc(provider.id.toUpperCase()).set({
                    provider: provider.id,
                    name: provider.name,
                    app:false
                }, { merge: true})
    
                const updateProvider = await SQL.executeQuery(`UPDATE proveed SET firestore = 1 WHERE proveedor = '${provider.id}'`)
                if(updateProvider.error) throw updateProvider.errorDetail
                console.log(`Proveedor Cargado con éxito ${provider.id} ${provider.name} al dispositivo ${device.id}`);
            }
        })

        for( const provider of providers){
            await firestore.collection(`Proveedores`).doc(provider.id.toUpperCase()).set({
                provider: provider.id,
                name: provider.name,
            }, { merge: true})

            console.log('Proveedor actualizado:', provider.name)
            console.log(`Proveedor Cargado ${provider.id} ${provider.name} al catalogo maestro`);
        }


        return providers
    } catch (error) {
        console.log(error)
        log.write('providers', error)
    }
}


module.exports = {
    uploadProviders
}