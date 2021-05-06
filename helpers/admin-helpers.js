var db = require('../config/connection')
var collections = require('../config/collections')
var objId=require('mongodb').ObjectID
const bcrypt=require('bcrypt')
const { response } = require('express')
module.exports={

    superAdminSetup:()=>{

        return new Promise(async(resolve,reject)=>{
            const adminPassword=await bcrypt.hash('adminpassword',10)
      let superAdmin=db.get().collection(collections.ADMIN_COLLECTION).insertOne({name:'SuperAdmin',email:'admin@shopping.com',password:adminPassword}).then((res)=>{
          resolve(superAdmin)
      })
        })

      

  },
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
        let loginStaus=false
        let response = {}
        let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({ email: adminData.email })

        if (admin) {

            bcrypt.compare(adminData.password, admin.password).then((status) => {
                if (status) {
                    console.log('login Success')
                    response.admin = admin
                    response.status = true
                    resolve(response)
                } else {
                    console.log('login failed');
                    resolve({loginStatus: false })
                }

            })

        } else {
            console.log('Admin not found');
            resolve({loginStatus: false })
        }

    })
},

addAdmin:(adminData)=>{
   
    
    return new Promise(async(resolve,reject)=>{

        adminData.password = await bcrypt.hash(adminData.password, 10)

        db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
            console.log(data);
            return resolve(data.ops[0])
        })

    })
},

getAdminList:()=>{
    return new Promise((resolve,reject)=>{
        let adminList= db.get().collection(collections.ADMIN_COLLECTION).find().toArray()
            resolve(adminList)
        })
    
},

deleteAdmin:(adminId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.ADMIN_COLLECTION).removeOne({_id:objId(adminId)}).then((response)=>{
            resolve(response)
        })
        
    })
}





  

 

}