const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.sendStatus(200);
})

// Path to your SSL certificate and key
const sslOptions = {
    key: fs.readFileSync(process.env.SERVER_KEY),
    cert: fs.readFileSync(process.env.SERVER_CERT)
  };
  
  // Create HTTPS server
  https.createServer(sslOptions, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
  });