import React, { useState } from "react";
import axios from "axios";

function App() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);

  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [secret, setSecret] = useState("");
  const [iv, setIv] = useState("");

  axios.defaults.withCredentials = true;

  const signup = async () => {
    await axios.post("http://localhost:5000/signup", { email, password });
    alert("Signup successful. Now login.");
  };

  const login = async () => {
    await axios.post("http://localhost:5000/login", { email, password });
    setLogged(true);
  };

  const uploadFile = async () => {
    const form = new FormData();
    form.append("file", file);

    const res = await axios.post("http://localhost:5000/upload", form);
    setHash(res.data.ipfsHash);
    setSecret(res.data.secretKey);
    setIv(res.data.iv);
  };

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

  const verifyFile = async () => {
    const res = await axios.post("http://localhost:5000/verify", {
      hash,
      secretKey: secret,
      iv
    });

    alert(res.data.verified ? "Authentic" : "Tampered");
  };

  if (!logged)
    return (
      <div style={{ padding: 40 }}>
        <h2>Login</h2>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <br /><br />

        <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
        <br /><br />

        <button onClick={signup}>Signup</button>
        <br /><br />
        
        <button onClick={login}>Login</button>

      </div>
    );

  return (
    <div style={{ padding: 40 }}>
      <h2>Secure File Storage</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <br /><br />

      <button onClick={uploadFile}>Upload</button>

      {hash && (
        <>
          <p>{hash}</p>
          <button onClick={downloadFile}>Download</button>
          <button onClick={verifyFile}>Verify</button>
        </>
      )}
    </div>
  );
}

export default App;
