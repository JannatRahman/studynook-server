const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 5000;






const uri = "mongodb://studynook:6w1QuiTPu7iSMO87@ac-q3n4nqa-shard-00-00.erd7kb0.mongodb.net:27017,ac-q3n4nqa-shard-00-01.erd7kb0.mongodb.net:27017,ac-q3n4nqa-shard-00-02.erd7kb0.mongodb.net:27017/?ssl=true&replicaSet=atlas-s39w7z-shard-0&authSource=admin&appName=Cluster0";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

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


    app.get('/studyrooms/:studyroomsId', async (req, res) => {
     const {studyroomsId} = req.params;
    //  console.log(studyroomsId);
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
