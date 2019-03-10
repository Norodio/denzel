const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const graphqlHTTP = require('express-graphql');
const { GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require('graphql');
const _ = require('lodash');
const {movieType} = require('./src/types.js');
let {movies,directors} = require('./src/data.js');

const CONNECTION_URL = "mongodb+srv://Norodio:xSGhUr0WIhRjO9nB@myawesomecluster-y47hi.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "denzel";
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';
const PORT = 9292;
var app = Express();



app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        },

        movies: {
            type: movieTypes,
            resolve: function (source, args) {
              return collection.aggregate([ {$match : {metascore : {$gt:70} }},{ $sample: { size: 1 }}]).toArray((error, result) => {
                    if(error) {
                        return response.status(500).send(error);
                    }
                    console.log(result[0]);
                    return _.find(result,{id: result[0].id});
                });;
            }
        },

        movie: {
            type: movieTypes,
            args: {
                id: { type: GraphQLInt }
            },
            resolve: function (source, args) {
              console.log(_.find(movies, { id: args.id }));
                return _.find(movies, { id: args.id });
            }
}

    }
});

const schema = new GraphQLSchema({ query: queryType });

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));



app.get("/movies/populate", async (request, response) => {
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

app.get("/movies/cleandb" , (request, response)=> {
  collection.deleteMany({}, (error, result)=>{
    if(error){
      return response.status(500).send(error);
    }
    response.send(result);
  })
});

app.get("/movies/search", (request, response) => {
    let limit = 5;
    let meta = 0;
    if(String(request.query.metascore) != "undefined"){
      meta = request.query.metascore;
    }
    if(String(request.query.limit) != "undefined"){
      limit = request.query.limit;
    }
    console.log(limit);
    collection.aggregate([ {$match : {metascore : {$gt:parseInt(meta)} }},{$sort : {"metascore" : -1}} ] ).limit(parseInt(limit)).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }

        let resultat = {
            limit: limit,
            MetascoreMin: meta,
            results: result
        };
        response.send(resultat);
    });
});

app.get("/movies", (request, response) => {
    collection.aggregate([ {$match : {metascore : {$gt:70} }},{ $sample: { size: 1 }}]).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/movies/:id", (request, response) => {
    collection.findOne({"id": request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.post("/movies/:id", (request, response) => {
      collection.updateOne({ "id": request.params.id },{$set : {"date": request.body.date , "review": request.body.review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});
