const { MongoClient } = require("mongodb");
const { log } = require('./utils')

function getConnectionString() {
  const password = process.env.DB_PASSWORD
  const username = process.env.DB_USERNAME
  return `mongodb+srv://${username}:${password}@cluster0.ot46brk.mongodb.net/?retryWrites=true&w=majority`
}

function getCollection(client) {
  const database = client.db('luckydog');
  return database.collection('events');
}

/**
 * @returns {Promise<object[]>}
 */
async function readKnownEvents() {
  const client = new MongoClient(getConnectionString());
  try {
    const collection = getCollection(client)
    const eventsData = await collection.findOne({})

    if (!eventsData || typeof eventsData.events !== 'string') {
      return []
    }
    return JSON.parse(eventsData.events)
  } catch (e) {
    log('Failed to read events', e);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }

  return []
}

/**
 *
 * @param newEvents {string}
 * @returns {Promise<void>}
 */
async function writeEvents(newEvents) {
  const client = new MongoClient(getConnectionString());
  try {
    const collection = getCollection(client)
    await collection.deleteMany({})
    await collection.insertOne({ events: newEvents })
  }  catch (e) {
    log('Failed to write events', e);
  }finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

module.exports = { readKnownEvents, writeEvents }
