const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


//middle ware3
app.use(cors())
app.use(express.json())


//connect to database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xc0o9.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {

    await client.connect();
    const yarnCollection = client.db("AllYarns").collection("yarn");
    const reviewCollection = client.db("ReviewCollection").collection("reviews");


    //get all yarns
    app.get('/products', async(req, res) =>{
        const query ={};
        const result = await yarnCollection.find(query).toArray();

        res.send(result);
    })

    //get all reviews
    app.get('/reviews', async (req, res) =>{
      const query = {};
      const result = await reviewCollection.find(query).toArray();

      res.send(result);
    })
    

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello from laizu yarn')
  })
  
  app.listen(port, () => {
    console.log(` laizu yarn listening on port ${port}`)
  })