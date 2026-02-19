const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());

// ------- Session ---------
app.use(session({
  secret: "securefile",
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

// ------- MongoDB ---------
mongoose.connect("mongodb://localhost:27017/SFS_database")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ------- User Schema ---------
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

// ------- File Schema ---------
const FileSchema = new mongoose.Schema({
  email: String,
  ipfsHash: String,
  secretKey: String,
  iv: String,
  uploadDate: { type: Date, default: Date.now }
});

const File = mongoose.model("File", FileSchema);

const upload = multer({ storage: multer.memoryStorage() });

const fileOwners = {};

// AES Encryption
function encrypt(buffer) {
  const algorithm = "aes-256-cbc";
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encryptedData: encrypted,
    key: key.toString("hex"),
    iv: iv.toString("hex"),
  };
}

// -------- Upload ---------
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Login Check
    if (!req.session.user) return res.status(401).send("Login first");

    const encrypted = encrypt(req.file.buffer);

    const data = new FormData();
    data.append("file", encrypted.encryptedData, "securefile");

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: {
          ...data.getHeaders(),
          pinata_api_key: "2cbdedecc09c886bdb00",
          pinata_secret_api_key: "ae4996594ef8586624e210c145c3845522ffda8ed4fc452b1a25910598ddcdae",
        },
      }
    );

    fileOwners[response.data.IpfsHash] = req.session.user;

    await File.create({
      email: req.session.user,
      ipfsHash: response.data.IpfsHash,
      secretKey: encrypted.key,
      iv: encrypted.iv
    })

    res.json({
      ipfsHash: response.data.IpfsHash,
      secretKey: encrypted.key,
      iv: encrypted.iv,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

// -------- Download ---------
app.post("/download", async (req, res) => {

  const { hash, secretKey, iv } = req.body;

  if (fileOwners[hash] !== req.session.user)
  return res.status(403).send("Access denied");

  try {

    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const encryptedBuffer = Buffer.from(response.data);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(secretKey, "hex"),
      Buffer.from(iv, "hex")
    );

    const decrypted =
      Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);

    res.send(decrypted);

  } catch (err) {
    console.log(err);
    res.status(500).send("Download failed");
  }
});

// -------- Verify ---------
app.post("/verify", async (req, res) => {

  const { hash, secretKey, iv } = req.body;

  if (fileOwners[hash] !== req.session.user)
  return res.status(403).send("Access denied");

  try {

    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const encryptedBuffer = Buffer.from(response.data);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(secretKey, "hex"),
      Buffer.from(iv, "hex")
    );

    const decrypted =
      Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);

    const recalculatedHash = crypto
      .createHash("sha256")
      .update(decrypted)
      .digest("hex");

    res.json({
      verified: true,
      localHash: recalculatedHash
    });

  } catch (err) {
    res.status(500).send("Verification failed");
  }
});

// -------- Auth ---------
app.post("/signup", async (req, res) => {

  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).send("User exists");

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ email, password: hashed });

  res.json({ success: true });
});

app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("Invalid");

  req.session.user = email;

  res.json({ success: true });
});

// -------- File History ---------
app.get("/history", async (req, res) => {
  if (!req.session.user) 
    return res.status(401).send("Login first");

  const files = (await File.find({ email: req.session.user })).toSorted({ uploadDate: -1 });

  res.json(files);
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
