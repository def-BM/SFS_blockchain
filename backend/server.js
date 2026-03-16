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
require("dotenv").config();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());

// ------- Session ---------
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

// ------- MongoDB ---------
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ------- User Schema ---------
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  securityQuestion: String,
  securityAnswer: String
});

const User = mongoose.model("User", UserSchema);

// ------- File Schema ---------
const FileSchema = new mongoose.Schema({
  email: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  ipfsHash: String,
  secretKey: String,
  iv: String,
  sharedWith: [{
    email: String,
    permission: String // "read" or "write"
  }],

  uploadDate: { type: Date, default: Date.now }
});

const File = mongoose.model("File", FileSchema);

const upload = multer({ storage: multer.memoryStorage() });

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
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      }
    );

    await File.create({
      email: req.session.user,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
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

  const file = await File.findOne({ 
    ipfsHash: hash,
    $or: [
      { email: req.session.user },
      { "sharedWith.email": req.session.user }
    ]
  });

  if (!file) return res.status(403).send("Access denied");

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

  const file = await File.findOne({ 
    ipfsHash: hash,
    $or: [
      { email: req.session.user },
      { "sharedWith.email": req.session.user }
    ]
  });

  if (!file) return res.status(403).send("Access denied");

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

// -------- Sign up ---------
app.post("/signup", async (req, res) => {

  const { firstName, lastName, email, password, securityQuestion, securityAnswer } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).send("User exists");

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ firstName, lastName, email, password: hashed, securityQuestion, securityAnswer });

  res.json({ 
    success: true,
    user: user.firstName + " " + user.lastName });
});

// -------- Login ---------
app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("Invalid");

  req.session.user = email;

  res.json({ 
    success: true,
    user: user.firstName + " " + user.lastName });
});

// -------- Reset Password ---------
app.post("/reset-password", async (req, res) => {
  const { email, securityAnswer, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).send("User not found");
  
  if (securityAnswer !== user.securityAnswer) return res.status(400).send("Invalid security answer");
  const hashed = await bcrypt.hash(password, 10);

  await User.updateOne(
    { email },
    { password: hashed }
  );

  res.json({ success: true });

});

// -------- File History ---------
app.get("/history", async (req, res) => {
  try{
    if (!req.session.user) 
      return res.status(401).send("Login first");

    const files = await File
      .find({ email: req.session.user })
      .sort({ uploadDate: -1 });

    res.json(files);
  } catch (err) {
    console.log(err);
    res.status(500).send("History fetch failed");
  }
});

// -------- Share File ---------
app.post("/share", async (req, res) => {
  const { hash, email, permission } = req.body;

  if (!req.session.user) return res.status(401).send("Login first");
  
  const file = await File.findOne({ ipfsHash: hash, email: req.session.user });
  if (!file) return res.status(403).send("Access denied");

  file.sharedWith.push({ email, permission });
  await file.save();
  res.json({ success: true });
});

// -------- Shared Files ---------
app.get("/shared-files", async (req, res) => {
  if (!req.session.user) return res.status(401).send("Login first");

  const files = await File.find({ "sharedWith.email": req.session.user });

  const result = files.map(file => {
    const shared = file.sharedWith.find(u => u.email === req.session.user);
    return {
      fileName: file.fileName,
      fileType: file.fileType,
      ipfsHash: file.ipfsHash,
      owner: file.email,
      permission: shared.permission,
      secretKey: file.secretKey,
      iv: file.iv
    }
  });
  res.json(result);
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
