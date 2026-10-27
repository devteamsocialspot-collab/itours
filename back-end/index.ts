import cors from 'cors';
import http from 'http';
import express, { Application } from 'express';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import config from './src/config';
import router from './src/route';
import { typeDefs } from './src/graphql/schemas';
import { resolvers } from './src/graphql/resolvers';
import { connectDatabase } from './src/config/database';
import UserController from './src/controllers/user/user.controller';

import { seedAdmin } from './src/seeds/user.seed';
import { seedDemo } from './src/seeds/demo.seed';

import { TTokenValue } from './src/types/common.type';
import { pickLocale } from './src/utils/i18n';
import { authDirective, authLogin } from './src/middleware/auth.middleware';

const { PORT } = config;
const app: Application = express();
app.use(cors());
app.use(router); // REST first: /upload brings its own parser

const httpServer = http.createServer(app);

let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirective(schema, 'auth');
schema = authLogin(schema, 'authLogin');

const server = new ApolloServer<TTokenValue>({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

Promise.all([connectDatabase(), server.start()])
  .then(async () => {
    await seedAdmin();
    await seedDemo();

    app.use(
      '/graphql',
      express.json({ limit: '1mb' }), // the plan editor sends the whole plan at once
      expressMiddleware(server, {
        context: async ({ req }): Promise<TTokenValue> => ({
          ...(await UserController.verifyJwt(req.headers.authorization)),
          lang: pickLocale(req.headers)
        })
      })
    );

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });

    // graceful shutdown for pm2 / docker: finish in-flight requests first
    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down`);
      await server.stop();
      httpServer.close();
      process.exit(0);
    };
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error(`⛔ Error occurred during startup: ${err.message}`);
    process.exit(1);
  });
