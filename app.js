require('dotenv').config()
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const graphqlHTTP = require('express-graphql');
const { GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLID,
    GraphQLList,
    GraphQLDate
} = require('graphql');
const _ = require('lodash');
const movie = require('./src/types.js').movie;

const CONNECTION_URL = process.env.DB_CONNECTION_URL;
const DATABASE_NAME = "denzel";
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';
const PORT = process.env.PORT;
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
        populate:{
          type: GraphQLString,
          resolve: async () => {
            const movies = await imdb(DENZEL_IMDB_ID);
            collection.insertMany(movies, (error, result) => {
                if(error) {
                    return response.status(500).send(error);
                }

            });
            return "done";
          }
        },

        randomMovie:{
          type: movie,
          resolve: async () => {
                  const res = await collection.aggregate([{ $match: { "metascore": {$gt:70}}}, { $sample: { size: 1 }}]).toArray()
                  return res[0]
          },
        },

        findMovie:{
          type: movie,
          args:{
            id: { type: GraphQLString }
          },
          resolve: async (source, args) => {
            let res =  await collection.findOne({id : args.id});

            return res;
          }
        },
        search:{
          type: GraphQLList(movie),
          args:{
            limit: {type : GraphQLInt},
            metascore: {type : GraphQLInt}
          },
          resolve : async (source, args) => {
                let metascore;
                let limit;
                if(args.limit == undefined) {
                  limit = 5
                } else {
                  limit = args.limit;
                }
                if(args.metascore == undefined) {
                  metascore = 0
                }else {
                  metascore = args.metascore;
                }
                const res = await collection.aggregate([{$match:{"metascore": {$gte:Number(metascore)}}}, {$limit:Number(limit)}, {$sort:{"metascore":-1}}]).toArray()
                return res
              }
        },
        review:{
          type:GraphQLString,
          args:{
            id: {type : GraphQLString},
            date:{type : GraphQLString},
            review:{type : GraphQLString}
          },
          resolve : async (source,args) =>{
            collection.updateOne({ "id": args.id },{$set : {"date": args.date , "review": args.review}}, (error, result) => {
              if(error) {
                  return response.status(500).send(error);
              }
          });
          return "done";
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
