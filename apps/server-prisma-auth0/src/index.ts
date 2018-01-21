import jwt = require('express-jwt');
import jwksRsa = require('jwks-rsa');
import { GraphQLServer } from 'graphql-yoga';

import { Prisma } from './generated/prisma';
import resolvers from './resolvers';

declare const process: any;

const API_ENDPOINT = '/api';

// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}.auth0.com/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_API_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}.auth0.com/`,
  algorithms: ['RS256'],
});

const server = new GraphQLServer({
  resolvers,
  typeDefs: './src/schema.graphql',
  context: req => ({
    ...req,
    db: new Prisma({
      endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma DB service (value is set in .env)
      secret: process.env.PRISMA_SECRET, // taken from database/prisma.yml (value is set in .env)
      debug: process.env.NODE_ENV === 'development', // log all GraphQL queries & mutations
    }),
  }),
});

// const checkScopes = jwtAuthz([ 'read:messages' ]);

server.express.use(API_ENDPOINT, checkJwt /* , checkScopes */);

// server.express.use(API_ENDPOINT, (req, res) => {
//   res.status(200).json({ foo: 'bar' });
// });

server
  .start({
    endpoint: API_ENDPOINT,
    subscriptions: API_ENDPOINT,
  })
  .then(
    r => {
      console.log('server started on port ' + process.env.PORT);
    },
    e => {
      console.log('error strating', e);
    },
  );
