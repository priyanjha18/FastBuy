const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./models/user");
const session = require("express-session");
const errorController = require("./controllers/error");
const MongoDbStore = require("connect-mongodb-session")(session);
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
//initialing express app
const app = express();

//creating express-session wuth mongodb
const MONGODB_URI =
  "mongodb+srv://priyan18:uW153jr24jFAJcwz@cluster0.j0yybjj.mongodb.net/shop";
const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
//enabling csrf protection
const csrfProtection = csrf();

//creating storage and file Filter 
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter=(req,file,cb)=>{
  if(file.mimetype==="image/png" || file.mimetype==="image/jpg" || file.mimetype==="image/jpeg"){
    
  cb(null,true)
  }
  else{
    
  cb(null,false)

  }
}

//initialing bodyparser and multer for encoding and path for css and js(public folder)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage,fileFilter:fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images",express.static(path.join(__dirname,"images")))

//initializing session and store
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//using csrfProtection
app.use(csrfProtection);
app.use(flash());

//adding templating engine
app.set("view engine", "ejs");
app.set("views", "views");

//finding user by id and then adding it as an admin
app.use((req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    User.findById(req.session.user._id)
      .then((user) => {
        if (!user) {
          next();
        }
        req.user = user;
        next();
      })
      .catch((err) => {
        next(new Error(err));
      });
  }
});
//setting csrfToken and IsAuthenticated as a local varialble
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//adding various routes
app.use("/admin", adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);
//error state management
app.get("/500", errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
  console.log(error)
  res
    .status(500)
    .render("500", {
      pageTitle: "An error occured",
      path: "/500",
      isAuthenticated: req.session ? req.session.isLoggedIn : "false" ,
      csrfToken:req.csrfToken ? req.csrfToken() : '',
    });
});

//connecting moongoose
mongoose
  .connect(
    `use env variable for this `
  )
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });

