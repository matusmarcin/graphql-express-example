import fetch from 'node-fetch';
import {
  GraphQLSchema,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
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

function getSomeRandomDataFromFile() {
  return new Promise(function(resolve, reject){
    fs.readFile('data.txt', 'utf8', (err, data) => {
        if (err) { reject(err); }
        resolve(data);
    })
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
        id: { type: GraphQLInt },
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
      resolve: user => getSomeRandomDataFromFile(),
    },
    id: {type: GraphQLInt},
    friends: {
      type: new GraphQLList(UserType),
      resolve: user => user.friends.map(fetchUserById)
    },
  }),
});

export default new GraphQLSchema({
  query: QueryType,
});