const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

const app = express();
const publicPort = 9001;
const privatePort = 8001;
const secretKey = "verysecretkey123";

const sampleUser = {
  user_id: 123,
  username: "admin",
};

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "db_employee",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + db.threadId);
});

// Middleware
app.use(bodyParser.json());

// Middleware for JWT Auth on Public API
app.use('/api_fe/list_employee', (req, res, next) => {
  const token = req.headers.authorization;
  const port = req.connection.remotePort;

  // Apply JWT Auth only for requests to the public API (port 9001)
  if (port === publicPort && !token) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          message: 'Unauthorized: Invalid token',
          token: token, 
          secretKey: secretKey,
        });
      }

      // Attach user information to the request
      req.user = decoded;
      next();
    });
  } else {
    // No token required for the private API (port 8001)
    next();
  }
});

// API Routes
app.get("/api_fe/list_employee", (req, res) => {
  db.query("SELECT * FROM tbl_employee", (err, results) => {
    if (err) {
      console.error("Error executing MySQL query: " + err.stack);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.json(results);
  });
});

// Endpoint to obtain a JWT token (for demonstration purposes)
app.post("/api_fe/get_token", (req, res) => {
  // For demonstration purposes, using a sample user
  const { username, password } = req.body;

  if (username === "admin" && password === "adminpassword") {
    const token = jwt.sign(sampleUser, secretKey, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Unauthorized: Invalid credentials" });
  }
});

// Start the server
app.listen(privatePort, () => {
  console.log(
    `Private API listening at http://localhost:${privatePort}/api_fe/list_employee`
  );
});

app.listen(publicPort, () => {
  console.log(
    `Public API listening at http://localhost:${publicPort}/api_fe/list_employee`
  );
});
