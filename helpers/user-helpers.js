var db = require('../config/connection')
var collections = require('../config/collections')
const bcrypt = require('bcrypt')
var objId = require('mongodb').ObjectId
const { response } = require('express')
const Razorpay=require('razorpay')
const { promises } = require('fs')
var instance = new Razorpay({
    key_id: 'rzp_test_CtSrnpZc3RxFae',
    key_secret: 'ya7eJTVLZIxZMRRwguy6yFYc',
  });

module.exports = {
    doSignup: (userData) => {


        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collections.COLLECTION_USER).insertOne(userData).then((data) => {

                return resolve(data.ops[0])
            })

        })


    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collections.COLLECTION_USER).findOne({ Email: userData.Email })

            if (user) {

                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login Success')
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({status: false })
                    }

                })

            } else {
                console.log('User not found');
                resolve({ status: false })
            }

        })
    },

    addToCart: (prodId, userId) => {
        let prodObj={
            item:objId(prodId),
            quantity:1
        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collections.COLLECTION_CART).findOne({ user: objId(userId) })
            if (userCart) {

                let proExist=userCart.products.findIndex(product => product.item==prodId)
                console.log(proExist)
                if(proExist!=-1){
                db.get().collection(collections.COLLECTION_CART)
                .updateOne({user:objId(userId),'products.item':objId(prodId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
                }else{
                 
                db.get().collection(collections.COLLECTION_CART).updateOne({ user: objId(userId) },

                    {

                        $push: { products: prodObj }



                    }
                ).then((response) => {
                    resolve()
                })
            }


            } else {
                cartObj = {
                    user: objId(userId),
                    products: [prodObj]

                }

                db.get().collection(collections.COLLECTION_CART).insertOne(cartObj).then((response) => {
                    resolve()
                })


            }


        })




    },

    getCartProducts: (userId) => {
        return new Promise(async(resolve, reject) => {
            let cartItems = await db.get().collection(collections.COLLECTION_CART).aggregate([
                {


                    $match:{user:objId(userId)} 


                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.COLLECTION_PRODUCT,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,
                        product:{

                            $arrayElemAt:['$product',0]

                        }
                    }
                }
               
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)

        })
    },

    getCartCount:(userId)=>{
    
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collections.COLLECTION_CART).findOne({user:objId(userId)})
            if(cart){

                count=cart.products.length

            }

            resolve(count)


        })

    },

    changeProductQuantity:(details)=>{

        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{

            if(details.count ==-1 && details.quantity == 1){
                db.get().collection(collections.COLLECTION_CART)
                .updateOne({_id:objId(details.cart)},
                {
                    $pull:{products:{item:objId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
            db.get().collection(collections.COLLECTION_CART)
                .updateOne({_id:objId(details.cart),'products.item':objId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
                ).then((response)=>{
                    resolve({status:true})
                })
            }
                

        })
    },

   deleteCartItem:(details)=>{
        return new Promise((resolve,reject)=>{
        db.get().collection(collections.COLLECTION_CART)
        .updateOne({_id:objId(details.cart)},
        {
            $pull:{products:{item:objId(details.product)}}
        }).then((response)=>{
            resolve({status:true})
        })
    })
    },

    getTotalAmount:(userId)=>{
        console.log(userId,"/////////////////////////userid")
        return new Promise(async(resolve, reject) => {
            // let cartEmpty=parseInt(collections.COLLECTION_CART.count)  
            
            let Total = await db.get().collection(collections.COLLECTION_CART).aggregate([
                {


                    $match:{user:objId(userId)} 


                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.COLLECTION_PRODUCT,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,
                        product:{

                            $arrayElemAt:['$product',0]

                        }
                    }
                },
                 
                { 
                    
                     
                        
                    $group:{
                        
                        
                        _id:null,
                        
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    
                    }
                }
                
               
               
            ]).toArray()
            console.log(Total,"/////////////////////////////////////");
            resolve(Total[0].total)

        })

    },

    placeOrder:(order,products,total,)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method']==='COD'?'placed':'pending'

            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date: new Date()
            
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{

                db.get().collection(collections.COLLECTION_CART).removeOne({user:objId(order.userId)})

                resolve(response.ops[0]._id)


            })

        })


    },

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collections.COLLECTION_CART).findOne({user:objId(userId)})
            resolve(cart.products)
        })
    },

    getUserOrder:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collections.ORDER_COLLECTION).find({userId:objId(userId)}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{

            let orderProducts = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {


                    $match:{_id:objId(orderId)} 


                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.COLLECTION_PRODUCT,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,
                        product:{

                            $arrayElemAt:['$product',0]

                        }
                    }
                }
               
            ]).toArray()
            console.log(orderProducts);
            resolve(orderProducts)

        

        })
    },

    generateRazorpay:(orderId,totalPrice)=>{

        return new Promise((resolve,reject)=>{

            var options = {
                amount: totalPrice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log('!!!',err);
                  }else{
                console.log('New Order',order);
                resolve(order)
                  }
              });

            
        })
    },

    verifyPayment:(details)=>{

    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
        let hmac=crypto.createHmac('sha256','ya7eJTVLZIxZMRRwguy6yFYc')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac=hmac.digest('hex')
        if(hmac===details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })

    },

    changePaymentStatus:(orderId)=>{

        return new Promise((resolve,reject)=>{

            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:objId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })

        })

    },
    
        
    





}