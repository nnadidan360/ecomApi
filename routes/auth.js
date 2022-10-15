const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");



class error {
  constructor() {
    this.count = 0;
    this.lowesCount = 0;
    this.items = {};
  }

  enqueue(element) {
    this.items[this.count] = element;
    this.count++;
  }
  
  
}

//REGISTER
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString(),
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.post("/adminRegister", async (req, res) => {
  const { username, email, password } = req.body
   newUser = new User({
    username,
    firstname:"admin",
    lastname: "admin",
    email,
    password: CryptoJS.AES.encrypt(
      password,
      process.env.PASS_SEC
    ).toString(),
    isAdmin: true
  });

  


  try {
    const errors = new error();

    if (!username || !email || !password) {
      JSON.stringify(errors.enqueue("please fill in all fields"));
    }
    if (password.length < 6) {
      JSON.stringify(
        errors.enqueue(
          "please ensure password is greater than 6 characters"
        )
      );
    }
  
    if (errors.count > 0) {
      res.status(400).json(errors.items);
      console.log(errors.items);
    } else {
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err)
  }
});

//LOGIN

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(401).json("Wrong credentials!");

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );
    const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    OriginalPassword !== req.body.password &&
      res.status(401).json("Wrong credentials!");

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SEC,
      {expiresIn:"10m"}
    );

    const { password, ...others } = user._doc;

    res.status(200).json({...others, accessToken});
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
