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


const uri =process.env.MONGODB_URI

 const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
      console.log(JWKS,
        'FROM JWKS'
      );


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
    } ;
  
    const verifyToken = async (req, res, next) => {
      const {authorization} = req.headers;
      const token = authorization?.split(' ')[1];

 if(!token){
  return res.status(401).json({message: 'Unauthorized'});
 };
    try {
    const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )

    const { payload } = await jwtVerify(token, JWKS,);
    req.user = payload;
//  console.log(req.user);

    next();
  } catch (error) {
    console.error('Token validation failed:', error);

    return res.status(401).json({message: 'Unauthorized'});
  }
  };

 async function run() {
  try {
    
    await client.connect();

// 1. CONNECTED WITH MONGODB
    const db = client.db('studynook');
    const studyroomsCollection = db.collection('studyrooms');
    const bookingCollection = db.collection('booking');



    app.get('/studyrooms', async (req, res) => {
      const {search} = req.query;

      let cursor;
      if(search) {
        cursor = studyroomsCollection.find({name: {$regex: search, $options: 'i'}});

        console.log( 'from search')
        
        
      }else{
        cursor = studyroomsCollection.find();
      };


      const result = await cursor.toArray();
      console.log(result);


      res.send(result);
    });

    app.get('/featured', async (req, res) => {
      const cursor = studyroomsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/studyrooms/:studyroomsId', logger, verifyToken,
   async (req, res) => {
    // console.log(req.user, 'req');
    
     const {studyroomsId} = req.params;
    const query = {_id: new ObjectId(studyroomsId)};
    const result = await studyroomsCollection.findOne(query);
    res.send(result);
    });

   app.get('booking/:userId', async (req, res) => {
    const {userId} = req.params;
    const result = await bookingCollection.find({userId: userId}).toArray();
    res.send(result);
   })


    app.patch('/booking/:studyroomsId',verifyToken,  async (req, res) => {
      const {studyroomsId} = req.params;
      const bookingData = req.body;

      const studyrooms = await studyroomsCollection.findOne({_id: new ObjectId(studyroomsId)});

      if(!studyrooms) {
        res.status(404).json({message: "Rooms not found"});
      }
      await studyroomsCollection.updateOne({_id: new ObjectId(studyroomsId)}, 
    {
      $inc: {bookingCount: 1},
      $set: {
        lastBookingAt: new Date(),
      },
    }
  );
   const result = await bookingCollection.insertOne({
    ...bookingData,
    bookedAt: new Date(),
   });
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
