// Import the necessary modules
const express = require('express');
const QueryEngine = require('@comunica/query-sparql').QueryEngine;

// Create a new QueryEngine instance
const myEngine = new QueryEngine();

// Create a new Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to serve static files from the "public" directory
app.use(express.static('public'));

// Define a route handler for GET requests to '/search/spanishteams'
// This handler executes a SPARQL query to get Spanish football teams
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
    // Array to store the results
    const results = [];
    // Event listener for 'data' event
    bindingsStream.on('data', (binding) => {
        results.push(binding.toString());
    });

    // Event listener for 'end' event
    bindingsStream.on('end', () => {
        res.json(results);
    });

    // Event listener for 'error' event
    bindingsStream.on('error', (error) => {
        console.error(error);
        res.status(500).send('Error executing SPARQL query');
    });
});

// Define a route handler for GET requests to '/search/teamsportstitles'
// This handler executes a SPARQL query to get football teams and their titles
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

// Define a route handler for GET requests to '/search/teamstadiums'
// This handler executes a SPARQL query to get football teams and their stadiums
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

// Define a route handler for GET requests to '/search/city/:city'
// This handler executes a SPARQL query to get football players born in a specific city
app.get('/search/city/:city', async (req, res) => {
    const city = req.params.city;
    // Execute the SPARQL query and get the results stream
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

// Define the port number and start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));