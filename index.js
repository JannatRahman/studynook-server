const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.3036qk8.mongodb.net/?appName=Cluster0`;

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
{
    cache: true,
    cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  }
);


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization?.split(' ')[1];
  // console.log(token, authorization);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  };
  try {
    const { payload } = await jwtVerify(token, JWKS,);
    req.user = payload;
    next();
  } catch (error) {
    // console.error('Token validation failed:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
};


async function run() {
  try {

    // await client.connect();

    // 1. CONNECTED WITH MONGODB
    const db = client.db('studynook');
    const studyRoomsCollection = db.collection('studyrooms');
    const bookingCollection = db.collection('booking');




   app.post('/studyrooms',verifyToken, async (req, res) => {
    const studyRoomsData = req.body;
    const result = await studyRoomsCollection.insertOne(studyRoomsData)
    res.send(result);
   })


    app.get('/studyrooms', async (req, res) => {
      const { search } = req.query;
      // console.log(search, 'search');
      let cursor;
      if (search) {
        cursor = await  studyRoomsCollection.find({
           $or: [
            {
              name: {
                $regex: search,
                $options: 'i',
              }
            },
            {
              description: {
                $regex: search,
                $options: 'i',
              }
            }
           ]
      });
      } else {
        cursor = studyRoomsCollection.find();
      };
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    app.get('/featured', async (req, res) => {
      const cursor = studyRoomsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/studyrooms/:id', 
      async (req, res) => {
        const id  = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await studyRoomsCollection.findOne(query);
        res.send(result);
      });
      

    app.get('/booking/:userId',verifyToken,  async (req, res) => {
      const { userId } = req.params;
      // console.log(userId);
      const result = await bookingCollection.find({ userId: (userId) }).toArray();
      // console.log(result);
      res.json(result);
    })

    app.get('/mystudyrooms/:userId',verifyToken,  async (req, res) => {
      const { userId } = req.params;
      // console.log(userId);
      const result = await studyRoomsCollection.find({userId}).toArray();
      // console.log(result);
      res.json(result);
    })
   
    

    app.patch('/booking/:studyroomsId',verifyToken,  async (req, res) => {
      const { studyroomsId } = req.params;
      const bookingData = req.body;

      const studyrooms = await studyRoomsCollection.findOne({ _id: new ObjectId(studyroomsId) });

      if (!studyrooms) {
        return res.status(404).json({
          message: "Rooms not found"
        });
      }
      await studyRoomsCollection.updateOne({ _id: new ObjectId(studyroomsId) },
        {
          $inc: { bookingCount: 1 },
          $set: {
            lastBookingAt: new Date(),
          },
        }
      );
      const result = await bookingCollection.insertOne({
        ...bookingData,
        userId: req.user.id,
        bookedAt: new Date(),
      });
      res.send(result);
    });

    app.patch('/studyroomsEdit/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id)};
      const updateQuery = { $set: updatedData } 
      // console.log( id, updatedData, query);
      const result = await studyRoomsCollection.updateOne(query, updateQuery)
      res.send(result)
    })
    
   
    app.delete('/studyrooms/:id',verifyToken, async (req, res) => {
      const {id} = req.params;
      const result = await studyRoomsCollection.deleteOne({_id: new ObjectId(id)})
      res.json(result);
    })


   

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
