const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");
const user = require("../models/user");
const { errorStrictEqual } = require("mongodb/lib/core/utils");

//creating transport of nodemailer with sendgrid
const transporter = nodeMailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

// getting login page
exports.getLogin = (req, res, next) => {
  //checking flash messages for getLogin 
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(req.session.isLoggedIn);
  res.render("auth/login", {
    path: "/login",
    pageTitle: "login",
    errorMessage: message,
  });
};


//logging in by post request 
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  //returning validation error using express validator 
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "login",
      errorMessage: error.array()[0].msg,
    });
  }
  //finding user in mongoose through email
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "invalid email or password");
        return res.redirect("/login");
      }
  //comparing password with bcrypt
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            //if match then adding user in session 
            req.session.user = user;

            req.session.isLoggedIn = true;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          //else sending error through req.flash
          req.flash("error", "Invalid password");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

//logging out by destroying session
exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};



//loading signup page
exports.getSignup = (req, res, next) => {
  //checking error key in flash session
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "signup",
    errorMessage: message,

    oldValue: null,
    validationError: null,
  });
};


//post request for sign up user
exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const error = validationResult(req);
  const confirmPassword = req.body.password;
  //returnining error through express-validator
  if (!error.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: error.array()[0].msg,
      //sending old value 
      oldValue: {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationError: error.array(),
    });
  }
  //if not error then hashing password and creating new user using bcrypt
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      //creating new user
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
      //sending email using nodemailer to created user email
      return transporter
        .sendMail({
          to: email,
          from: "priyanjha18@outlook.com",
          subject: "Signup succeded!",
          html: "<h1>You successfully signed up In our node shop </h1>",
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



//getting reset page which will contain only email  input
exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};



//posting reset value
exports.postReset = (req, res, next) => {
  //creating random token thrugh crypto
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    //finding user through email
    User.findOne({ email: req.body.email })
      .then((user) => {
        //if user not found then error
        if (!user) {
          req.flash("error", "no account with that email found");
          return res.redirect("/reset");
        }
        //adding reset token and time limit in user document 
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      //transporting reset password link(with resettoken in params) mail to email using nodemailer   
      .then((result) => {
        res.redirect("/");
        transporter.sendMail({
          to: req.body.email,
          from: "priyanjha18@outlook.com",
          subject: "Password Reset",
          html: `<p>You requested for Password Reset</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a> to reset Password</p>`,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};


//page for getting new password reset
exports.getNewPassword = (req, res, next) => {
  //comparing reset token and checking time limit
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      //if user found then sending the new password page with token and userId
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/newPassword", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        passwordToken: token,
        userId: user._id.toString(),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


//updating password post request 
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
//finding user and comparing token and time limit
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      //if found then hashing new password with bcrypt
      bcrypt
        .hash(newPassword, 12)
        .then((hashedPassword) => {
          //saving new password and resetting token and time limit
          user.password = hashedPassword;
          user.resetToken = null;
          user.resetTokenExpiration = null;
          return user.save();
        })
        .then((result) => {
          res.redirect("login");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
