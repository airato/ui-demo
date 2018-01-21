const createProxyServer = require('http-proxy').createProxyServer;

module.exports = function graphqlProxy(app) {
  // You can call yarn start with `GRAPHQL_BASEURL=http://localhost:3000` to proxy
  // your local server instead of the host.
  const graphqlTarget = process.env.GRAPHQL_BASEURL || 'http://localhost:8081';
  const proxy = createProxyServer({
    // TODO: add options
    target: graphqlTarget,
  });

  proxy.on('error', (err, req) => {
    console.error(err, req.url);
  });
  app.use('/api', (req, res) => {
    // include root path in proxied request
    req.url = `/api${req.url ? '/' + req.url : ''}`;
    proxy.web(req, res, {});
  });
};
