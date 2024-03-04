const {
  createProxyMiddleware
} = require('http-proxy-middleware');
require('dotenv').config()
const adminProxy = createProxyMiddleware({
  target: process.env.ADMIN_SERVICE,
  changeOrigin: true
});

const userProxy = createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  // pathRewrite: {
  //   '^/users': '/', // Remove the '/tasks' prefix
  // },
});

const cartProxy = createProxyMiddleware({
  target: process.env.CART_SERVICE,
  changeOrigin: true
});


const productProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE,
  changeOrigin: true
});


const categoryProxy = createProxyMiddleware({
  target: process.env.CATEGORY_SERVICE,
  changeOrigin: true
});

const orderProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE,
  changeOrigin: true
});

const wishlistProxy = createProxyMiddleware({
  target: process.env.WISHLIST_SERVICE,
  changeOrigin: true
});



//   const paymentProxy = createProxyMiddleware({
//     target: 'http://localhost:3003',
//     changeOrigin: true
//   });

module.exports = {
  wishlistProxy,
  orderProxy,
  categoryProxy,
  productProxy,
  userProxy,
  adminProxy,
  cartProxy
}