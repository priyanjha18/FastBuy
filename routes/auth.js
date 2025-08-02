const express = require("express");

const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");
const router = express.Router();


//Routes for login 
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post(
  "/logout",
  [
    body("email", "Please enter a valid email").isEmail().normalizeEmail(),
    body("password", "Please enter a valid Password")
      .isAlphanumeric()
      .trim()
      .isLength({ min: 5 }),
  ],
  authController.postLogout
);
router.get("/signup", authController.getSignup);
router.post(
  "/signup",
  [

    //Using express validator for checking user data
    check("email", "Please enter a valid email")
      .isEmail()
      .normalizeEmail()
      .custom((value, { req }) => {
        //custom validation for checking if email is already present or not
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-mail exist already,Please pick a different one"
            );
          }
          return true;
        });
      }),
    body(
      "password",
      "Please enter a valid Password with minimum 6 charaacters of length"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword").custom((value, { req }) => {
      //custom validation for checking if passwords match or not
      if (value !== req.body.password) {
        throw new Error("The passwords do not match");
      }
      return true;
    }),
    body("name").notEmpty(),
  ],
  authController.postSignup
);

//routes for Resetting passwords
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);
router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);
module.exports = router;
