const express = require('express');
const cors = require ('cors');
const app = express();
require ('dotenv').config()
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mmlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
}
});

async function run() {
try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const celestoraCollection = client.db('pastFinderDB').collection('celestora')
    
    const likedCelestoraCollection = client.db('pastFinderDB').collection('likedCelestora');

    await likedCelestoraCollection.createIndex(
        {celestora_id: 1, applicant_email: 1 },
        { unique: true }
    );

    // data fetch with search and email

    app.get('/celestora', async (req, res) => {
        const email = req.query.email;
        const search = req.query.search || ""; 
    
        const query = {};
    
        // Filter by email if provided
        if (email) {
            query.userEmail = email;
        }
    
        // Add regex-based search filter if search term is provided
        if (search) {
            query.name = { $regex: search, $options: "i" }; // Fixed here
        }
    
        try {
            const cursor = celestoraCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        } catch (error) {
            console.error("Error fetching celestoras:", error);
            res.status(500).send({ success: false, error: error.message });
        }
    });
    

    // my artifact data delete

    app.delete('/celestora/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await celestoraCollection.deleteOne(query);
        res.send(result);
      })

// my artifact update handleUpdate

app.put('/celestora/:id', async (req, res) => {
    const id = req.params.id;
    const updatedCelestora = req.body;
    const filter = { _id: new ObjectId(id) };
    const update = { $set: updatedCelestora };
    const options = { upsert: true };

    try {
        const result = await celestoraCollection.updateOne(filter, update, options);
        res.send(result);
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

    // data details
    app.get('/celestora/:id', async(req, res)=> {
        const id = req.params.id;
        const query={_id: new ObjectId(id)}
        const result =await celestoraCollection.findOne(query);
        res.send(result);
    })
    
    // data post
    app.post('/celestora',async(req,res)=>{
        const newCelestora = req.body;
        console.log(newCelestora);
        const result = await celestoraCollection.insertOne(newCelestora);
        res.send(result);
    })



     // Like antiques apis 

     app.get('/likedCelestora', async (req, res) => {
        const email = req.query.email;
        const query = { applicant_email: email }
        const result = await likedCelestoraCollection.find(query).toArray();
        res.send(result);
    })



app.post('/likedCelestora', async (req, res) => {
    const like = req.body;

    try {
        const result = await likedCelestoraCollection.insertOne(like);
        res.send(result);
    } catch (error) {
        console.error("Error saving liked artifact:", error.message);
        if (error.code === 11000) {
            res.status(400).send({ error: "Artifact already liked" });
        } else {
            res.status(500).send({ error: "Failed to like artifact" });
        }
    }
});

app.get('/likedCelestora/:id', async (req, res) => {
    const { id } = req.params;
    const email = req.query.email;

    const query = { celestora_id: id, applicant_email: email };
    const likedCelestora = await likedCelestoraCollection.findOne(query);

    res.send({ liked: !!likedCelestora });
});

app.delete('/likedCelestora/:id', async (req, res) => {
    const { id } = req.params;
    const email = req.query.email;

    const query = { celestora_id: id, applicant_email: email };
    const result = await likedCelestoraCollection.deleteOne(query);

    if (result.deletedCount > 0) {
        res.send({ success: true });
    } else {
        res.status(404).send({ error: "Like not found" });
    }
});


} finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
}
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('You’re digging in the wrong place!')
})

app.listen(port,()=>{
    console.log(`I’ve got a bad feeling about this:${port}`)
})

