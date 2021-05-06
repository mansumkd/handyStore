var db = require('../config/connection')
var collections = require('../config/collections')
var objId=require('mongodb').ObjectID
const { response } = require('express')
module.exports = {

    addProduct: (product, callback) => {
        product.Price=parseInt(product.Price);

        db.get().collection(collections.COLLECTION_PRODUCT).insertOne(product).then((data) => {
            console.log(data)
            callback(data.ops[0]._id)
            
        })


    },

    getallProducts: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.COLLECTION_PRODUCT).find().toArray()
            resolve(product)
        })

    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collections.COLLECTION_PRODUCT).removeOne({_id:objId(prodId)}).then((response)=>{
                resolve(response)
            })

        })

    },

    getproductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{

            db.get().collection(collections.COLLECTION_PRODUCT).findOne({_id:objId(prodId)}).then((product)=>{
                resolve(product)
            })

        
        })
    },

    updateProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            prodDetails.Price=parseInt(prodDetails.Price)
            db.get().collection(collections.COLLECTION_PRODUCT).updateOne({_id:objId(prodId)},{
                $set:{
                    Name:prodDetails.Name,
                    Category:prodDetails.Category,
                    Price:prodDetails.Price,
                    Description:prodDetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    
       
}