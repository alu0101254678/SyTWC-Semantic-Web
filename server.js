const express = require('express');
const QueryEngine = require('@comunica/query-sparql').QueryEngine;
const myEngine = new QueryEngine();

const app = express();

app.use(express.json()); // for parsing application/json

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/search/spanishteams', async (req, res) => {
    const bindingsStream = await myEngine.queryBindings(
        `
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>

        SELECT ?team ?teamLabel
        WHERE {
        ?team wdt:P31 wd:Q476028;  # Instancia de equipo de fútbol
                wdt:P17 wd:Q29.      # País: España
        ?team rdfs:label ?teamLabel.
        FILTER(LANG(?teamLabel) = "es").
        }
        `, {
      sources: [{type: 'sparql',value:'https://query.wikidata.org/sparql'}]
        },
    );
    const results = [];
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    bindingsStream.on('end', () => {
        res.json(results);
    });

    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});

app.get('/search/teamsportstitles', async (req, res) => {
    const scientist = req.params.scientist;
    const bindingsStream = await myEngine.queryBindings(
        `
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX p: <http://www.wikidata.org/prop/>
        PREFIX ps: <http://www.wikidata.org/prop/statement/>

        SELECT ?teamLabel (COUNT(?championship) AS ?titles) WHERE {
        ?championship wdt:P31 wd:Q27020041;  # Instancia de "Campeonato de fútbol español"
                        wdt:P1346 ?team.      # Ganador
        ?team wdt:P31 wd:Q476028;           # Instancia de "equipo de fútbol"
                rdfs:label ?teamLabel.
        FILTER(LANG(?teamLabel) = "es").
        }
        GROUP BY ?teamLabel
        ORDER BY DESC(?titles)
        LIMIT 50
        `, {
      sources: [{type: 'sparql',value:'https://query.wikidata.org/sparql'}]
        },
    );
    const results = [];
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    bindingsStream.on('end', () => {
        res.json(results);
    });

    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});

// server.js
app.get('/search/teamstadiums', async (req, res) => {
    const bindingsStream = await myEngine.queryBindings(
        `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>

        SELECT ?team ?teamLabel ?stadium ?stadiumLabel
        WHERE {
        ?team a dbo:SportsTeam;
                dbo:ground ?stadium.
        ?stadium dbo:country dbr:Spain.
        ?team rdfs:label ?teamLabel.
        ?stadium rdfs:label ?stadiumLabel.
        FILTER(LANG(?teamLabel) = "es" && LANG(?stadiumLabel) = "es")
        }
        ORDER BY ?teamLabel
        `, {
      sources: [{type: 'sparql',value:'https://dbpedia.org/sparql'}]
        },
    );
    const results = [];
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    bindingsStream.on('end', () => {
        res.json(results);
    });

    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});

app.get('/search/city/:city', async (req, res) => {
    const city = req.params.city;
    const bindingsStream = await myEngine.queryBindings(
        `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        SELECT *
        WHERE {
        ?athlete a dbo:SoccerPlayer ;
                dbo:birthPlace [ rdfs:label "${city}"@en ] ;
                dbo:number ?number .
        }
        `, {
      sources: [{type: 'sparql',value:'https://dbpedia.org/sparql'}]
        },
    );
    const results = [];
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    bindingsStream.on('end', () => {
        res.json(results);
    });

    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));