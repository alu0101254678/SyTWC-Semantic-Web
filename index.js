const express = require('express');
const QueryEngine = require('@comunica/query-sparql').QueryEngine;
const myEngine = new QueryEngine();

const app = express();

app.get('/', async (req, res) => {
    const bindingsStream = await myEngine.queryBindings(
      `
      PREFIX wd: <http://www.wikidata.org/entity/>
      PREFIX wdt: <http://www.wikidata.org/prop/direct/>
      SELECT *
      WHERE
      {
      ?s wdt:P31 wd:Q3305213 .
      }
      `, {
          sources: [{type: 'sparql',value:'https://query.wikidata.org/sparql'}]
      },
    );

    let results = [];
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    bindingsStream.on('end', () => {
        res.send(results.join('<br>'));
    });

    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));