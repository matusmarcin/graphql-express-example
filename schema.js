import fetch from 'node-fetch';
import {
  GraphQLSchema,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

function fetchResponseByURL(relativeURL) {
  return fetch(`${BASE_URL}${relativeURL}`).then(res => res.json());
}

function fetchUsers() {
  return fetchResponseByURL('/users/').then(json => json.users);
}

function fetchUserById(id) {
  return fetchResponseByURL('/users/'+id).then(json => json.user);
}

function getUserMessageFromFile(firstName) {
  return new Promise(function(resolve, reject){
    fs.readFile(`data/${firstName}.txt`, 'utf8', (err, data) => {
        // if (err) { reject(err); }
        resolve(data);
    })
  });
}

function extractFirstName(name) {
  return name.toLowerCase().split(" ")[0];
}

function saveUserMessage(id, message) {
  return new Promise(function(resolve, reject){
    fetchUserById(id).then(user => {
      fs.writeFile(`data/${extractFirstName(user.name)}.txt`, message, function(err) {
        if(err) {
          console.log('Got error!', err);
          reject(err);
        }
        const newUserObject = Object.assign({}, user, { message } );
        resolve(newUserObject);
      }); 
    });
  });
}

const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'The root of all... queries',
  fields: () => ({
    allUsers: {
      type: new GraphQLList(UserType),
      resolve: root => fetchUsers(),
    },
    user: {
      type: UserType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: (root, args) => fetchUserById(args.id),
    },
  }),
});

const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'Somebody that you used to know',
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: user => user.name,
    },
    message: { 
      type: GraphQLString,
      resolve: user => getUserMessageFromFile(extractFirstName(user.name)),
    },
    id: { type: GraphQLString },
    friends: {
      type: new GraphQLList(UserType),
      resolve: user => user.friends.map(fetchUserById)
    },
  }),
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    changeUserMessage: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        message: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (parentValue, args) => saveUserMessage(args.id, args.message),
    }
  })
})

export default new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});