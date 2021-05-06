var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');


const userHelper = require('../helpers/user-helpers')
/* GET home page. */
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = 0
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }


  productHelper.getallProducts().then((products) => {


    res.render('user/view-products', { products, user, cartCount })

  })
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { userLoginErr: req.session.userLoginErr })
    
  }
});
router.get('/signup', (req, res) => {
  res.render('user/signup')
});
router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    req.session.user = true
    req.session.user = response
    res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      
      req.session.user = response.user
      req.session.userLoggedIn = true

      res.redirect('/')
    } else {
      req.session.userLoginErr = 'Invalid username or password'
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  
  let totalVlaue = 0

  let count = await userHelpers.getCartCount(req.session.user._id)
  console.log("Count: " + count);
  let cart = true

  if (count != 0) {

     totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    cart = false
  }

  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products)

  res.render('user/cart', { products, user: req.session.user, totalValue, cart })
})

router.get('/view-orders',verifyLogin,async(req,res)=>{
 
  
  let orders = await userHelpers.getUserOrder(req.session.user._id)
  
  
  res.render('user/orders-list', { user: req.session.user, orders })
})

router.get('/add-to-cart/:id', (req, res) => {



  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })

})

router.post('/change-product-quantity', async (req, res, next) => {

  userHelpers.changeProductQuantity(req.body).then(async (response) => {

    response.total = await userHelpers.getTotalAmount(req.body.user)

    res.json(response);

  })

})

router.post('/remove-cart-item', (req, res, next) => {
  userHelpers.deleteCartItem(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  
  res.render('user/place-order', { totalValue, user: req.session.user })
})

router.post('/place-order', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {

    if (req.body['payment-method' == 'COD']) {

      res.json({ codSuccess: true })


    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)


      })
    }



  })
  console.log(req.body)
})

router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/orders-list', verifyLogin, async (req, res) => {

  let orders = await userHelpers.getUserOrder(req.session.user._id)
  res.render('user/orders-list', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)

  console.log(products)
  res.render('user/view-order-products', { user: req.session.user, products })


})

router.post('/verify-payment',verifyLogin,(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('Successful payment');
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})

module.exports = router;
