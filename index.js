// ✅ Import dependencies
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// ✅ Load .env
dotenv.config();

// ✅ Create app
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// ✅ Route
app.get("/", (req, res) => {
  res.send("Parcel Server is up and running!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1pqy4da.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("easy-buy");
    const parcelCollection = db.collection("parcels");

    //   request api
    app.get("/parcels", async (req, res) => {
      const result = await parcelCollection.find().toArray();
      res.send(result);
    });
    // ✅ Route for adding a new parcel
    app.post("/parcels", async (req, res) => {
      try {
        const parcelData = req.body;

        // if (!parcelData) {
        //   return res.status(400).send({ error: "No parcel data found" });
        // }

        const result = await parcelCollection.insertOne(parcelData);
        res.status(201).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to add parcel" });
      }
    });
    // get parcel sorted by email
    app.get("/myParcels", async (req, res) => {
      try {
        const email = req.query.email;

        // ✅ If no email is provided
        if (!email) {
          return res.status(400).send({ error: "Email is required" });
        }

        const result = await parcelCollection
          .find({ sender_email: email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch parcels" });
      }
    });
    //   delete a parcel from db

    app.delete("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await parcelCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Parcel not found" });
        }

        res.send({ message: "Parcel deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to delete parcel" });
      }
    });
    //  Get a parcel by id
    app.get("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Find parcel by id
        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!parcel) {
          return res.status(404).send({ error: "Parcel not found" });
        }

        res.send(parcel);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch parcel" });
      }
    });

    // create payment intention

    app.post("/create-payment-intent", async (req, res) => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // Amount in cents
        currency: "usd",
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ✅ Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
