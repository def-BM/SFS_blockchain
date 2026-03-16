# 🔐 BlockVault

### Secure File Storage Using Blockchain (IPFS)

BlockVault is a secure decentralized file storage system that allows users to upload, share, and verify files using **IPFS (InterPlanetary File System)** with **AES encryption** and **access control**.

The system ensures that uploaded files remain **tamper-proof**, **encrypted**, and **accessible only to authorized users**.

---

# 🚀 Features

* 🔑 User Authentication (Signup / Login / Password Reset)
* 🔐 AES-256 File Encryption
* ☁️ IPFS Decentralized Storage
* 📁 Secure File Upload
* 📜 File History Tracking
* 🤝 File Sharing with Permission Control
* 👁 File Preview
* ⬇ File Download
* ✔ File Integrity Verification
* 🎨 Responsive UI Dashboard

---

# 🏗 System Architecture

User → React Frontend → Node.js Backend → MongoDB
↓
IPFS (Pinata)

Files are encrypted before uploading to IPFS to ensure privacy.

---

# 🛠 Tech Stack

### Frontend

* React.js
* Axios
* CSS

### Backend

* Node.js
* Express.js
* Multer
* Crypto

### Database

* MongoDB
* Mongoose

### Storage

* IPFS (Pinata API)

### Security

* AES-256 Encryption
* bcrypt password hashing
* Express Session authentication

---

# 📂 Project Structure

```
SecureFileBlockchain/
│
├── backend/
│   ├── server.js
│   ├── models/
|   |── .env
│   └── package.json
| 
|── blockchain/  
│
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── responsive.css
│   │   └── assets/
│   ├── public/
│   └── package.json
│
|
├── .gitignore
└── README.md
```

---

# ⚙ Installation

## 1️⃣ Clone Repository

```
git clone https://github.com/yourusername/blockvault.git
cd blockvault
```

---

## 2️⃣ Install Backend Dependencies

```
cd backend
npm install
```

---

## 3️⃣ Install Frontend Dependencies

```
cd ../frontend
npm install
```

---

# 🔑 Environment Variables

Create a file in the **backend folder**:

```
backend/.env
```

Example:

```
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
SESSION_SECRET=blockvault_secret
MONGO_URI=mongodb://localhost:27017/SFS_database
```

---

# ▶ Running the Project

### Start Backend

```
cd backend
node server.js
```

Server runs on:

```
http://localhost:5000
```

---

### Start Frontend

```
cd frontend
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

# 🔒 Security Implementation

### Encryption

Files are encrypted using:

```
AES-256-CBC
```

before uploading to IPFS.

### Authentication

* Password hashing with **bcrypt**
* Session authentication using **express-session**

### Access Control

Files can only be accessed by:

* Owner
* Users explicitly shared with

---

# 📸 Application Screens

### Login

Secure login system with password visibility toggle.

### Dashboard

* Upload files
* View documents
* Share files
* File history
* Shared files

---

# 🧪 Example File Flow

1️⃣ Upload File
2️⃣ File encrypted (AES)
3️⃣ Encrypted file stored on IPFS
4️⃣ IPFS hash stored in MongoDB
5️⃣ Authorized users can download/decrypt

---

# 📜 License

This project is developed for **educational and research purposes**.

---

# 👨‍💻 Author

Brijesh Maurya
Information Technology Engineering Student

---
