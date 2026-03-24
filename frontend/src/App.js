import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import "./responsive.css";
import bg from "./bg.png";
import logo from "./logo.png";  

function App() {

  const [page, setPage] = useState("login");
     
  const [userName, setUserName] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [logged, setLogged] = useState(false);

  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [secret, setSecret] = useState("");
  const [iv, setIv] = useState("");

  const [history, setHistory] = useState([]);

  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  
  const [dashboard, setDashboard] = useState("upload");
  const [dragActive, setDragActive] = useState(false);

  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read");
  const [shareFileHash, setShareFileHash] = useState("");
  const [sharedFiles, setSharedFiles] = useState([]);

  axios.defaults.withCredentials = true;

  // -------- Signup ---------
  const signup = async () => {
    if (password !== confirm){
      alert("Passwords do not match");
      return;
    }
    await axios.post("http://localhost:5000/signup", { firstName, lastName, email, password, securityQuestion, securityAnswer });
    alert("Signup successful. Please login.");
    setPage("login");
  };

  // -------- Login ---------
  const login = async () => {
    const res = await axios.post("http://localhost:5000/login", { email, password });
    setUserName(res.data.user);
    setPage("dashboard");
    loadHistory();
  };

  // -------- Logout ---------
  const logout = ()=>{
    setPage("login");
    setUserName("");
  };

  // -------- Forgot Password ---------
  const resetPassword = async () => {
    await axios.post("http://localhost:5000/reset-password", { email, securityAnswer, password: newPassword });
    alert("Password reset successful. Please login.");
    setPage("login");
  };

  // -------- History ---------
  const loadHistory = async () => {
    const res = await axios.get("http://localhost:5000/history");
    setHistory(res.data);
  };

  // -------- Upload ----------
  const uploadFile = async () => {
    if(!file){
      alert("Please select a file");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    const res = await axios.post("http://localhost:5000/upload", form);
    setHash(res.data.ipfsHash);
    setSecret(res.data.secretKey);
    setIv(res.data.iv);

    alert("File uploaded successfully");
    setFile(null);    

    loadHistory();
  };

  // -------- Download ---------

  const downloadFile = async () => {
    const res = await axios.post(
      "http://localhost:5000/download",
      { hash, secretKey: secret, iv },
      { responseType: "blob" }
    );

    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "file";
    a.click();
  };

  // -------- Verify ---------
  const verifyFile = async () => {
    const res = await axios.post("http://localhost:5000/verify", {
      hash,
      secretKey: secret,
      iv
    });

    alert(res.data.verified ? "Authentic" : "Tampered");
  };

  // -------- Preview ---------
  const previewFile = async(file) => {
      const res = await axios.post(
        "http://localhost:5000/download",
        { hash: file.ipfsHash, secretKey: file.secretKey, iv: file.iv },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: file.fileType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
  };

  // -------- Drag and Drop ---------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if(e.type === "dragenter" || e.type === "dragover"){
      setDragActive(true);
    } else if(e.type === "dragleave"){
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      setFile(e.dataTransfer.files[0]);
    }
  };

  // -------- Share File ---------
  const shareFile = async () => {
    if(!shareFileHash){
      alert("Please select a file");
      return;
    }

    await axios.post("http://localhost:5000/share", {
      hash: shareFileHash,
      email: shareEmail,
      permission: sharePermission
    });

    alert("File shared successfully");
  };

  // -------- Load Shared Files ---------
  const loadSharedFiles = async () => {
    const res = await axios.get("http://localhost:5000/shared-files");

    setSharedFiles(res.data);
    setDashboard("shared");
  };

  // -------- Login Page ---------
  if (page==="login")
    return (
      <div style={center}>
        <div style={card} className="card">

        <h2>Secure File Storage</h2>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} style={input} />

        <div style={passwordContainer}>
          <input
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            onChange={e => setPassword(e.target.value)}
            style={input}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={eye}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        
        <button 
        style={loginBtn} 
        onMouseOver={e => e.target.style.background="#2980b9"}
        onMouseOut={e => e.target.style.background="#3498db"}
        onClick={login}
        >
          Login
        </button>
        
        <p style={link} onClick={() => setPage("forgot")}>Forgot password?</p>
        <p>Don't have an account? <span style={link} onClick={() => setPage("signup")}>Sign up</span></p>
        </div>
      </div>
    );

    // -------- Signup Page ---------
    if(page==="signup")
      return(

        <div style={center}>
          <div style={card} className="card">

            <h2>Create Account</h2>

            <input style={input} placeholder="First Name" onChange={e=>setFirstName(e.target.value)}/>

            <input style={input} placeholder="Last Name" onChange={e=>setLastName(e.target.value)}/>

            <input style={input} placeholder="Email" onChange={e=>setEmail(e.target.value)}/>

            <div style={passwordContainer}>
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                onChange={e => setPassword(e.target.value)}
                style={input}
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={eye}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div style={passwordContainer}>
              <input
                placeholder="Confirm Password"
                type={showConfirm ? "text" : "password"}
                onChange={e => setConfirm(e.target.value)}
                style={input}
              />

              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={eye}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <select style={input} onChange={e=>setSecurityQuestion(e.target.value)}>
              <option value="">Select Security Question</option>
              <option value="What is your pet's name?">What is your pet's name?</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What was the name of your first school?">What was the name of your first school?</option>
              <option value="What is your favorite food?">What is your favorite food?</option>
              <option value="What city were you born in?">What city were you born in?</option>
            </select>

            <input style={input} placeholder="Security Answer" onChange={e=>setSecurityAnswer(e.target.value)}/>

            <button 
            style={signupBtn} 
            onMouseOver={e => e.target.style.background="#1e8449"}
            onMouseOut={e => e.target.style.background="#27ae60"}
            onClick={signup}
            >
              Signup
            </button>

            <p>Already have an account?{" "}<span style={link} onClick={()=>setPage("login")}>
            Login
            </span>
            </p>

          </div>
        </div>
      );

    // -------- Forgot Password Page ---------
    if(page==="forgot")
      return(
      
        <div style={center}>
          <div style={card}  className="card">
      
            <h2>Reset Password</h2>

            <input style={input} placeholder="Email" onChange={e=>setEmail(e.target.value)}/>
            <input style={input} placeholder="Security Answer" onChange={e=>setSecurityAnswer(e.target.value)}
/>
            <div style={passwordContainer}>
              <input
                style={input}
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                onChange={e=>setNewPassword(e.target.value)}
              />

              <span style={eye} onClick={()=>setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button 
            style={signupBtn} 
            onMouseOver={e => e.target.style.background="#1e8449"}
            onMouseOut={e => e.target.style.background="#27ae60"}
            onClick={resetPassword}
            >
              Update Password
            </button>

            <p>Back to{" "}<span style={link} onClick={()=>setPage("login")}>
            Login
            </span>
            </p>

          </div>
        </div>
      );

    // -------- Dashboard ---------
    return(
      <div>
        {/* Top Bar */}

        <div style={topbar} className="topbar">

          <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
            <img src={logo} alt="BlockVault" style={{height:"30px"}}/>
            <h2 style={{margin:0}}>BlockVault</h2>
          </div>
            <div>
              <span style={{marginRight:"20px"}}>Welcome, {userName}</span>
              <button style={logoutBtn} onClick={logout}>Logout</button>
            </div>  
        </div>

        {/* Main Layout */}
        <div style={layout} className="layout">

          {/* Sidebar */}
          <div style={sidebar} className="sidebar">
            <p 
              style={menu} className="menu" 
              onMouseOver={e => e.target.style.color="#1abc9c"}
              onMouseOut={e => e.target.style.color="white"}
              onClick={()=>setDashboard("upload")}
            >
              Upload File
            </p>

            <p 
              style={menu} className="menu"
              onMouseOver={e => e.target.style.color="#1abc9c"}
              onMouseOut={e => e.target.style.color="white"}
              onClick={()=>setDashboard("view")}
            >
              Documents
            </p>

            <p 
              style={menu} className="menu"
              onMouseOver={e => e.target.style.color="#1abc9c"}
              onMouseOut={e => e.target.style.color="white"}
              onClick={()=>setDashboard("share")}
            >
              Share File
            </p>

            <p 
              style={menu} className="menu"
              onMouseOver={e => e.target.style.color="#1abc9c"}
              onMouseOut={e => e.target.style.color="white"}
              onClick={()=>setDashboard("history")}
            >
              File History
            </p>

            <p 
              style={menu} className="menu"
              onClick={()=>loadSharedFiles()}
              onMouseOver={e => e.target.style.color="#1abc9c"}
              onMouseOut={e => e.target.style.color="white"}
            >
              Shared With Me
            </p>
          </div>

          {/* Content */}
          <div style={content} className="content">
            {dashboard==="upload" && (
            <div>
              <h2>Upload File</h2>
              <div
              style={{
                border: dragActive ? "2px dashed #27ae60" : "2px dashed #ccc",
                padding:"clamp(20px, 5vw, 40px)",
                textAlign:"center",
                borderRadius:"10px",
                background:"#fafafa"
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              >

                <p>Drag & Drop File Here</p>

                <p>OR</p>

                <input type="file" onChange={e=>setFile(e.target.files[0])}/>
              </div>

              <button 
              style={uploadBtn} 
              onMouseOver={e => e.target.style.background="#1e8449"}
              onMouseOut={e => e.target.style.background="#27ae60"}
              onClick={uploadFile}
              >
                Upload File
              </button>

              {file && (
                <p style={{marginTop:"10px"}}>
                  Selected File: {file.name}
                </p>
              )}
            </div> 
            )}

            {dashboard==="view" && (
              <div>
                <h2>Your Documents</h2>

                <div style={{overflowX:"auto"}}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>File Name</th>
                      <th style={th}>Type</th>
                      <th style={th}>IPFS Hash</th>
                      <th style={th}>Upload Date</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(file=>(
                      <tr 
                      key={file.ipfsHash}
                      style={rowHover}
                      onMouseOver={e=>e.currentTarget.style.background="#f5f5f5"}
                      onMouseOut={e=>e.currentTarget.style.background="white"}
                      >
                        <td style={td}>{file.fileName}</td>
                        <td style={td}>{file.fileType}</td>
                        <td style={td}>
                          <span title={file.ipfsHash}>
                            {file.ipfsHash.substring(0, 10)}...
                          </span>
                        </td>
                        <td style={td}>{new Date(file.uploadDate).toLocaleString()}</td>

                        <td>
                          <button
                          style={{...downloadBtn, background:"#3498db"}}
                          onClick={()=>previewFile(file)}
                          >
                            Preview
                          </button>

                          <button style={downloadBtn} onClick={()=>{
                            setHash(file.ipfsHash);
                            setSecret(file.secretKey);
                            setIv(file.iv);
                            downloadFile();
                          }}>
                            Download
                          </button>
                          
                          <button style={verifyBtn} onClick={()=>{
                            setHash(file.ipfsHash);
                            setSecret(file.secretKey);
                            setIv(file.iv);
                            verifyFile();
                          }}>
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {dashboard==="share" &&(
              <div>
                <h2>Share File</h2>
                <select style={input} onChange={e=>setShareFileHash(e.target.value)}>
                  <option value="">Select File</option>
                  {history.map(file=>(
                    <option key={file.ipfsHash} value={file.ipfsHash}>
                      {file.fileName}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Enter user email"
                  style={input}
                  onChange={e=>setShareEmail(e.target.value)}
                />

                <select 
                style={input}
                onChange={e=>setSharePermission(e.target.value)}
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>

                <button
                style={uploadBtn} 
                onMouseOver={e => e.target.style.background="#1e8449"}
                onMouseOut={e => e.target.style.background="#27ae60"}
                onClick={shareFile}
                >
                  Share File
                </button>
              </div>
            )}

            {dashboard==="history" && (
              <div>
                <h2>File Activity</h2>

                <div style={{overflowX:"auto"}}>
                  <table style={table}>

                    <thead>
                      <tr>
                        <th style={th}>File Name</th>
                        <th style={th}>Type</th>
                        <th style={th}>Size</th>
                        <th style={th}>IPFS Hash</th>
                        <th style={th}>Uploaded</th>
                        <th style={th}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map(file => (                  
                        <tr
                        key={file.ipfsHash}
                        style={rowHover}
                        onMouseOver={e=>e.currentTarget.style.background="#f5f5f5"}
                        onMouseOut={e=>e.currentTarget.style.background="white"}
                        >
                          <td style={td}>{file.fileName}</td>
                          <td style={td}>{file.fileType}</td>
                          <td style={td}>{(file.fileSize/1024).toFixed(2)} KB</td>
                          <td style={td}>
                            <span title={file.ipfsHash}>
                              {file.ipfsHash.slice(0,10)}...
                            </span>
                          </td>
                          <td style={td}>{new Date(file.uploadDate).toLocaleString()}</td>
                          <td style={td}>

                          <button
                          style={downloadBtn}
                          onClick={()=>{
                          setHash(file.ipfsHash)
                          setSecret(file.secretKey)
                          setIv(file.iv)
                          downloadFile()
                          }}
                          >
                            Download
                          </button>

                          <button
                          style={verifyBtn}
                          onClick={()=>{
                          setHash(file.ipfsHash)
                          setSecret(file.secretKey)
                          setIv(file.iv)
                          verifyFile()
                          }}
                          >
                            Verify
                          </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>
                  </table>
                </div>
              </div>
            )}
        
            {dashboard==="shared" &&(
              <div>
                <h2>Files Shared With You</h2>

                <div style={{overflowX:"auto"}}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}>File Name</th>
                        <th style={th}>Type</th>
                        <th style={th}>IPFS Hash</th>
                        <th style={th}>Owner</th>
                        <th style={th}>Permission</th>
                        <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedFiles.map(file=>(
                      <tr 
                      key={file.ipfsHash} 
                      style={rowHover}
                      onMouseOver={e=>e.currentTarget.style.background="#f5f5f5"}
                      onMouseOut={e=>e.currentTarget.style.background="white"}
                      >
                        <td style={td}>{file.fileName}</td>
                        <td style={td}>{file.fileType}</td>
                        <td style={td}>
                          <span title={file.ipfsHash}>
                            {file.ipfsHash.slice(0,10)}...
                          </span>
                        </td>
                        <td style={td}>{file.owner}</td>
                        <td style={td}>{file.permission}</td>

                        <td>
                          <button
                          style={{...downloadBtn, background:"#3498db"}}
                          onClick={()=>previewFile(file)}
                          >
                            Preview
                          </button>

                          <button style={downloadBtn} onClick={()=>{
                            setHash(file.ipfsHash);
                            setSecret(file.secretKey);
                            setIv(file.iv);
                            downloadFile();
                          }}>
                            Download
                          </button>
                          
                          <button style={verifyBtn} onClick={()=>{
                            setHash(file.ipfsHash);
                            setSecret(file.secretKey);
                            setIv(file.iv);
                            verifyFile();
                          }}>
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
}

/* ---------- Styles ---------- */

const center = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat"
};

const card = {
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(5px)",
  padding: "40px",
  width: "350px",
  borderRadius: "10px",
  boxShadow: "0 0 15px rgba(0,0,0,0.1)"
};

const input = {
  width: "100%",
  padding: "10px",
  marginTop: "15px",
  border: "1px solid #ccc",
  borderRadius: "5px"
};

const loginBtn = {
  width: "100%",
  padding: "10px",
  marginTop: "20px",
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "0.3s"
};

const signupBtn = {
  width: "100%",
  padding: "10px",
  marginTop: "20px",
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const uploadBtn = {
  padding: "10px 20px",
  marginTop: "20px",
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const downloadBtn = {
  padding: "8px 15px",
  marginRight: "10px",
  background: "#e67e22",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const verifyBtn = {
  padding: "8px 15px",
  background: "#8e44ad",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const selectBtn = {
  padding: "6px 10px",
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "5px"
};

const historyCard = {
  border: "1px solid #ddd",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px"
};

const link = {
  color: "#3498db",
  cursor: "pointer",
};

const topbar={
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  background:"#2c3e50",
  color:"white",
  padding:"10px 20px"
};

const logoutBtn={
  background:"#e74c3c",
  border:"none",
  color:"white",
  padding:"8px 12px",
  borderRadius:"5px",
  cursor:"pointer"
};

const layout={
  display:"flex"
};

const sidebar={
  width:"200px",
  background:"#34495e",
  color:"white",
  height:"calc(100vh - 50px)",
  padding:"20px"
};

const menu={
  cursor:"pointer",
  marginBottom:"20px"
};

const content={
  flex:1,
  padding:"30px"
};

const passwordContainer = {
  position: "relative"
};

const eye = {
  position: "absolute",
  right: "10px",
  top: "70%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "18px",
  color: "#555"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
  background: "white",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const th = {
  background: "#2c3e50",
  color: "white",
  padding: "12px",
  textAlign: "left"
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #ddd"
};

const rowHover = {
  cursor:"pointer"
};

export default App;
