const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 5000;


const uri =process.env.MONGODB_URI


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next)    => {
      console.log(`${req.method} | ${req.url}`);
      next();
    } 

async function run() {
  try {
    
    await client.connect();

// 1. CONNECTED WITH MONGODB
    const db = client.db('studynook');
    const studyroomsCollection = db.collection('studyrooms');



    app.get('/studyrooms', async (req, res) => {
       const cursor = studyroomsCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    app.get('/featured', async (req, res) => {
      const cursor = studyroomsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/studyrooms/:studyroomsId', 
      logger,

    async (req, res) => {
     const {studyroomsId} = req.params;
    
    const query = {_id: new ObjectId(studyroomsId)};
    const result = await studyroomsCollection.findOne(query);
    res.send(result);
    });



    
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
