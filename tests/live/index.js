import express from "express";
import mongoose, { Schema, get, model } from "mongoose";
import dotenv from "dotenv";
import parseProjection from "../../src/parseProjection.js";
import createCrud from "../../src/createCrudRouter.js";

dotenv.config();

const UserSchema = new Schema({
  name: String,
  email: String,
  age: Number,
  role: String,
  password: String,
}, {
  timestamps: true,
  versionKey: false
});

const User = mongoose.models.User || model("User", UserSchema);

const app = express();
app.use(express.json());
app.use('/users',createCrud(User,{
  hide: ["password"],
}))
// GET /users?fields=name,email
app.get("/test_users", async (req, res) => {
    try{
        const projection = parseProjection(req.query.fields,["password"], User);
        const users = await User.find({}, projection).lean();
        res.json(users);
    }catch{
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Connect and start server
const PORT = process.env.PORT || 4001;
mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/test_projection")
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Projection test API running on http://localhost:${PORT}/users`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
  });