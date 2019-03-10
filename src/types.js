const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList
} = require('graphql');

// Define Movie Type
movieTypes = new GraphQLObjectType({
    name: 'Movierand',
    fields: {
        _id: { type: GraphQLID },
        link: { type: GraphQLString },
        id: { type: GraphQLString },
        metascore: { type: GraphQLInt },
        poster: { type: GraphQLString },
        rating: { type: GraphQLFloat },
        synopsis: { type: GraphQLString },
        title: { type: GraphQLString },
        votes: { type: GraphQLFloat},
        year: { type: GraphQLInt },

    }
});

movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        year: { type: GraphQLInt },
        directorId: { type: GraphQLID }

    }
});



exports.movieTypes = movieTypes;
exports.movieType = movieType;
