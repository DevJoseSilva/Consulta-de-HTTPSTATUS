const { MongoClient } = require('mongodb');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

// Leer configuración desde el JSON
const config = JSON.parse(fs.readFileSync('mongo_config.json', 'utf8'));
const { uri, dbName, collectionName } = config;

async function exportToCSV() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const cursor = collection.find(
      { httpstatus: 400 },
      { projection: { _id: 0, key: 1 } }
    );

    const results = await cursor.toArray();

    const records = results.map(doc => ({
      mlm_error_under_review: doc.key
    }));

    const csvWriter = createCsvWriter({
      path: 'mlm_error_under_review.csv',
      header: [
        { id: 'mlm_error_under_review', title: 'mlm_error_under_review' }
      ]
    });

    await csvWriter.writeRecords(records);
    console.log('CSV generado correctamente.');
  } catch (err) {
    console.error('Error al exportar a CSV:', err);
  } finally {
    await client.close();
  }
}

exportToCSV();