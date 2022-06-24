const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
    const purchaseCollection = client.db("AllYarns").collection("purchase");
    const usersCollection = client.db("AllYarns").collection("users");
    const reviewCollection = client.db("ReviewCollection").collection("reviews");

    //verify jwt token
    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized access" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, 
        function (err, decoded) {
        if (err) {
          console.log(err);
          return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    }



    //get all yarns
    app.get('/products', async (req, res) => {
      const query = {};
      const result = await yarnCollection.find(query).toArray();

      res.send(result);
    })

    //get single yarns
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await yarnCollection.findOne(query);

      res.send(result);
    })
    //post review
    app.post('/reviews',async (req, res) =>{
       const review = req.body;
       const result = await reviewCollection.insertOne(review);

       res.send(result)
    })

    //get all reviews
    app.get('/reviews', async (req, res) => {
      const query = {};
      const result = await reviewCollection.find(query).toArray();

      res.send(result);
    })
    //get all orders
    app.get('/purchase/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await purchaseCollection.find(query);

      res.send(result);
    })

    //post purchase information
    app.post('/purchase', async (req, res) => {
      const data = req.body;
      const result = await purchaseCollection.insertOne(data);

      res.send(result);
    })

    //post users
    app.post('/users', async (req, res) => {
      const data = req.body;
      const users = await usersCollection.insertOne(data);

      res.send(users)

    })

    //update single user
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, options, updateDoc);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })

      res.send({ result, token });

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