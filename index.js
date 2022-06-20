const express = require('express');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;



app.get('/', (req, res) => {
    res.send('Hello from laizu yarn')
  })
  
  app.listen(port, () => {
    console.log(` laizu yarn listening on port ${port}`)
  })