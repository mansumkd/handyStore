var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
var adminHeleper = require('../helpers/admin-helpers')
const session = require('express-session');
const { Db } = require('mongodb');
const collections = require('../config/collections');
const userHelpers = require('../helpers/user-helpers');



const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    admin=true
    next()
  } else {
    res.redirect('admin/login')
  }
}

/* GET users listing. */
router.get('/', verifyAdminLogin, function (req, res, next) {
  let admin=req.session.admin
  productHelper.getallProducts().then((products) => {



    console.log(products)
    res.render('admin/view-products', { admin, products })

  })

});
router.get('/add-product',verifyAdminLogin,(req, res) => {
  res.render('admin/add-product',{admin:true})
});
router.post('/add-product',verifyAdminLogin,(req, res) => {

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product')

      }
      else {
        console.log(err)
      }

    })


  })
})

router.get('/delete-product/:id',verifyAdminLogin,(req, res) => {
  let prodId = req.params.id

  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin')
  })


})

router.get('/edit-product/:id',verifyAdminLogin, async (req, res) => {

  let prodId = req.params.id
  let product = await productHelpers.getproductDetails(prodId)
  console.log(product)

  res.render('admin/edit-product', { product,admin:true })
})

router.post('/edit-product/:id',verifyAdminLogin, (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then((response) => {

    res.redirect('/admin')
    let id = req.params.id
    if (req.files.Image) {
      let Image = req.files.Image
      Image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

router.get('/login', async(req, res) => {
  
  if (req.session.admin) {
    res.redirect('/')
  } else {
    res.render('admin/login', { adminLoginErr: req.session.adminLoginErr ,admin:true})
    req.session.adminLoginErr = true


  }



})
router.post('/login', (req, res) => {


  adminHeleper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = 'Invalid Username or password'
      res.redirect('/admin/login')
    }



  })

})
router.get('/products',verifyAdminLogin,(req,res)=>{

 res.redirect('/admin')



})
router.get('/settings',async(req,res)=>{
  let adminList= await adminHeleper.getAdminList()
  res.render('admin/settings',{admin:true,adminList})
})
router.post('/add-admin',verifyAdminLogin,(req,res)=>{
  
 adminHeleper.addAdmin(req.body).then((response)=>{

  res.json(response)

 })
})

router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin/login')
})

router.post('/delete-admin',(req,res)=>{
  console.log(req.body)
  adminHeleper.deleteAdmin(req.body.admin).then((response)=>{
    res.json(response)
  })
})
module.exports = router; 
