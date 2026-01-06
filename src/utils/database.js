const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectToDatabase() {
  if (db) return db;

  const uri = process.env.MONGODB_URI || process.env.MDB_MCP_CONNECTION_STRING;
  
  if (!uri) {
    throw new Error('MongoDB connection string not found in environment variables');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('legacy-code-agent');
  
  console.log('Connected to MongoDB');
  return db;
}

async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabase
};
