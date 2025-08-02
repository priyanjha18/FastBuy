const path = require("path");

const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin");
const isAuth = require("../middlewares/is-auth");
const router = express.Router();

// // /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// // /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title","Invalid Title").isString().isLength({ min: 3 }).trim(),
    body("price","Invalid price").isFloat(),
    body("description","invalid description").isLength({min:5,max:400})
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product",[
    body("title","Invalid Title").isString().isLength({ min: 3 }).trim(),
    body("price","Invalid Price").isFloat(),
    body("description","Invalid description").isLength({min:5,max:400})
  ], isAuth, adminController.postEditProduct);

router.delete("/product/:productId", isAuth, adminController.DeleteProduct);

module.exports = router;
