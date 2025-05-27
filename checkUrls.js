const fs = require('fs');
const fetch = require('node-fetch');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const pLimit = require('p-limit');

const inputFile = 'input.csv';
const outputFile = 'output.csv';
const urls = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    if (row.url) urls.push(row.url);
  })
  .on('end', async () => {
    console.log(`Se leyeron ${urls.length} URLs. Procesando con concurrencia...`);

    const limit = pLimit(15); // Máximo 10 peticiones simultáneas

    const promises = urls.map((url) =>
      limit(async () => {
        console.log(`Verificando: ${url} \n\n`);
        try {
          const res = await fetch(url, { method: 'GET' });
          return { url, status: res.status };
        } catch (error) {
          return { url, status: 'ERROR' };
        }
      })
    );

    const results = await Promise.all(promises);

    const csvWriter = createCsvWriter({
      path: outputFile,
      header: [
        { id: 'url', title: 'url' },
        { id: 'status', title: 'http_status' },
      ],
    });

    await csvWriter.writeRecords(results);
    console.log(`Resultados guardados en ${outputFile}`);
  });