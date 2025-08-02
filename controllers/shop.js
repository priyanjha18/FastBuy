const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
//integrating stripe
const stripe = require("stripe")(
  "sk_test_51RUrs54hS5cCN0X0335i9ZYuJhGQO4IgGLuufS9hxloEFcPi6zpw4N27qe7HD9pMrhyc9bUGtLbZvJVVYzdBNh3Z00pdxBbBcz"
);

//initializing items per page for pagination
const ITEMS_PER_PAGE = 2;

//getting product page
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = null;
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      //implementing pagination and gettings  products
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      //renderingn pages
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
//getting specific products by using id from params
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
};

//getting homepage
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = null;
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//getting cart page
exports.getCart = (req, res, next) => {
  //populating cart.items of user
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      console.log(user.cart.items);
      //rendering cart with cart.items
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: user.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//adding an item to cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      //using models addtocart method
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//deleting items from cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

//adding cart to order
exports.postOrder = (req, res, next) => {
  //populating products of cart item then sending object with quantity and product with ref
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const product = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      //creating order
      const order = new Order({
        user: {
          name: req.session.user.name,
          userId: req.user,
        },
        products: product,
      });
      console.log(order);
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//getting order page

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//getting invoice using pdfkit
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  //finding if order exist
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("no order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("The order and user do not match"));
      }
      //creating filename
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      const pdfDoc = new PDFDocument();
      //setting header for specific application
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      //using fs streamline data transfer
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      //modifying pdf
      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------------------------");
      let totalPrice = 0;
      order.products.map((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - :" +
              prod.quantity +
              " X " +
              " $" +
              prod.product.price
          );
      });

      pdfDoc.text("-----------------------------------------");
      pdfDoc.fontSize(20).text("Total Price - :$ " + totalPrice);

      pdfDoc.text("************************************");
      pdfDoc.fontSize(10).text("Thank yu For Buying ");
      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filename="' + invoiceName + '"'
      //   );
      //   res.send(data);
      // });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//implementing checkout page
exports.getCheckout = (req, res, next) => {
  let total = 0;

  let products;
  let userDoc;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      userDoc = user;
      products = user.cart.items;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
            unit_amount: p.productId.price * 100,
          },
          quantity: p.quantity,
        })),
        mode: "payment",
        success_url:req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: userDoc.cart.items,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
