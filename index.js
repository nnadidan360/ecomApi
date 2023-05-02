const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const productRoute = require("./routes/product");
const cartRoute = require("./routes/cart");
const orderRoute = require("./routes/order");
const stripeRoute = require("./routes/stripe");
const cors = require("cors");
const morgan = require("morgan")


const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL)
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

app.use(cors());
app.use(morgan("common"));
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/carts", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/checkout", stripeRoute);

app.get("/", async(req,res) => {
  res.send("you are allowed to view server just this once")
})

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
  console.log("Backend server is running!");
})
})
