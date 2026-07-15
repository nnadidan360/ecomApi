const Product = require("../models/Product");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");
const multer = require("multer");
const supabase = require("../supabase");
const path = require("path");

const router = require("express").Router();

// Use memory storage — file goes to Supabase, not disk
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload buffer to Supabase Storage, return public URL
const uploadToSupabase = async (file) => {
  const ext = path.extname(file.originalname);
  const fileName = `products/${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// CREATE
router.post("/", verifyTokenAndAdmin, upload.single("image"), async (req, res) => {
  try {
    let img = req.body.img;
    if (req.file) {
      img = await uploadToSupabase(req.file);
    }

    const categories = req.body["categories[]"]
      ? [].concat(req.body["categories[]"])
      : [];

    const newProduct = new Product({ ...req.body, img, categories });
    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.put("/:id", verifyTokenAndAdmin, upload.single("image"), async (req, res) => {
  try {
    let updates = { ...req.body };

    if (req.file) {
      updates.img = await uploadToSupabase(req.file);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET PRODUCT
router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  const qNew = req.query.new;
  const qCategory = req.query.category;
  try {
    let products;

    if (qNew) {
      products = await Product.find().sort({ createdAt: -1 }).limit(1);
    } else if (qCategory) {
      products = await Product.find({
        categories: { $in: [qCategory] },
      });
    } else {
      products = await Product.find();
    }

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
