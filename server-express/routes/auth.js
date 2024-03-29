const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const privateKey = "";
const saltRounds = 10;

router.use(function(req, res, next) { //router lvl middleware
  bcrypt.genSalt(saltRounds, function(err, salt) {
    //hashes PW, so handler only utilizes hashed version
    bcrypt.hash(req.body.password, salt, function(err, hash) {
        req.hashedPassword = hash;
        next();
    });
  });
});

//register handler
router.post("/register", async function (req, res) {
    if (req.body.username && req.body.password && req.body.passwordConfirmation) {
      if (req.body.password === req.body.passwordConfirmation) {
        const user = new User({
          username: req.body.username,
          password: req.hashedPassword,
        });
        return await user
          .save()                           //persist to DB
          .then((savedUser) => {
             return res.status(201).json({
                id: savedUser._id,
                username: savedUser.username,
             });
          })
          .catch((error) => {
             return res.status(500).json({ error: error.message });
          });
       }
       res.status(400).json({ error: "Passwords not matching" });
    } else {
       res.status(400).json({ error: "Username or Password Missing" });
    }
});
  
//login handler 
router.post("/login", async function (req, res) {
    if (req.body.username && req.body.password) {
      const user = await User.findOne()
        .where("username")
        .equals(req.body.username)     
        .exec();
      if (user) {
        return bcrypt
          .compare(req.body.password, user.password)        //bcrypt compares two pw's (stored, provided)
          .then((result) => {
              if (result === true) {
                 const token = jwt.sign({ id: user._id }, privateKey, {
                    algorithm: "RS256",                     //requires RSA key 
                 });
                 return res.status(200).json({ access_token: token });
              } else {
                 return res.status(401).json({ error: "Invalid credentials." });
              }
          })
          .catch((error) => {
              return res.status(500).json({ error: error.message });
          });
      }
      return res.status(401).json({ error: "Invalid credentials." });
    } else {
      res.status(400).json({ error: "Username or Password Missing" });
    }
});

module.exports = router;