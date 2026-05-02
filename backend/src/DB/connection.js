const mongoose = require("mongoose");

const connectToDatabase = async (uri) => {
  if (!uri) {
    throw new Error("MONGO_URI is not set.");
  }

  return mongoose.connect(uri);
};

module.exports = { connectToDatabase };
