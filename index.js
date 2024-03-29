const express = require('express');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
const uri = `mongodb+srv://${process.env.YARN_DB}:${process.env.DB_PASS}@cluster0.xc0o9.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {

    await client.connect();
    const yarnCollection = client.db("AllYarns").collection("yarn");
    const purchaseCollection = client.db("AllYarns").collection("purchase");
    const usersCollection = client.db("AllYarns").collection("users");
    const BuyerCollection = client.db("AllYarns").collection("buyer");
    const profileCollection = client.db("AllYarns").collection("profile");
    const reviewCollection = client.db("ReviewCollection").collection("reviews");
    const messageCollection = client.db("AllYarns").collection("messages");


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

      // (GET)Get A Admin
      app.get('/useadmin/:email',async(req,res)=>{
        const email=req.params.email;
        const user=await userCollection.findOne({email:email});
        const isAdmin=user.role==='admin';
        res.send({admin:isAdmin});
    })
    

    //post payment card intend
    app.post('/create-payment-intent', async(req, res) =>{
      const order = req.body;
      const price = order.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types:['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
        
      });
      console.log(clientSecret);
    })


    //post new products
    app.post('/product', async (req, res) =>{
      const data = req.body;
      const result = await yarnCollection.insertOne(data);
      res.send(result);
    })

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
    app.post('/review',async (req, res) =>{
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
    app.get('/purchase/:email', verifyJWT, async (req, res) => {
      const email = req.params.email
      const decodedEmail = req.decoded.email;
      if(decodedEmail == email){
        const query = { email: email }
      const result = await purchaseCollection.find(query);
      res.send(result);
      }
      else{
        return res.status(403).send({ message: "Not allow to access" });
      }
      
      
    })

    //save purchase order list
    app.post('/purchase', async (req, res) => {
      const order = req.body;
      const query =  {product:order.product }
      const exist = await purchaseCollection.findOne(query)
      
      if(exist){
        return res.send({ success: false, booking: exist })
      }
      const result = await purchaseCollection.insertOne(order);

      return res.send({success:true, result});
    })

     //get signle purchase / orders
     app.get('/buy/:id', async (req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await purchaseCollection.findOne(query)

      
      res.send(result);
    })

    //get all purchase
    app.get('/purchase', async(req, res) =>{
      const query = {}
      const result = await purchaseCollection.find(query).toArray();
      res.send(result);
    })

    
    //delete signle purchase / orders
    app.delete('/purchase/:id', async (req, res) =>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)}
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    })

    //GET ALL USERS
    app.get('/users', async(req, res)=>{
      const users = await usersCollection.find().toArray();
      res.send(users);
    })

    //set uer role and make admin
    app.put('/user/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const filter = {email:email};
      const updateDoc = {
        $set:{role:'admin'}
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    //update single user
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.send({ result, token });

    
    })

    
    //post user profile info
    app.put('/profile/:email', async(req, res) =>{
      const email = req.params.email;
      const data = req.body;
      const query =  {email:email }
      const options = { upsert: true };
      const updateDoc = {
        $set: data
      };
      const result = await profileCollection.updateOne(query,updateDoc,options);
      res.send(result);
    })

    //trusted buyers
    app.get('/buyer', async (req, res) =>{
      const query = {}
      const result = await BuyerCollection.find(query).toArray();
      res.send(result);
    })

    //post user message and email
    app.post('/message', async(req, res) =>{
      const data = req.body;
      const result = await messageCollection.insertOne(data);
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