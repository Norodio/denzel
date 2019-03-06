const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://Norodio:xSGhUr0WIhRjO9nB@myawesomecluster-y47hi.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "denzel";

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';



var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(3000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


app.get("/movies/populate", async (request, response) => {
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insert(movies, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

app.get("/movies", (request, response) => {
    collection.aggregate([ {$match : {metascore : {$gt:70} }},{ $sample: { size: 1 } } ] ).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});



app.get("/movie/:id", (request, response) => {
    collection.findOne({ "_id": new ObjectId(request.param.id) }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/movie/search", (request,response)=> {

})


//Marche pas
app.post("/movie/:id", (request, response) => {
  /*
  date = request.form['date'];
  review = request.form['review'];
    collection.update({ "_id": new ObjectId(request.param.id) },{$set : {"date": date , "review": review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
    */
});
