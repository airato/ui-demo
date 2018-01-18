import 'z-frontend-global-types';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { SchemaLink } from 'apollo-link-schema';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import { Store } from 'react-redux';

type GetAdditonalHeaders = () => { [key: string]: string };

function initializeNetworkInterface(getAdditionalHeaders: GetAdditonalHeaders) {
  let graphqlUrl = '/api';
  if (__NATIVE__) {
    if (__DEVELOPMENT__) {
      if (__ANDROID__) {
        // this is default IP address for localhost in genymotion emulator
        graphqlUrl = 'http://10.0.3.2:3000/graphql';
      } else if (__IOS__) {
        graphqlUrl = 'TODO';
      }
    } else {
      // TODO
    }
  }
  let apolloLink = createHttpLink({
    uri: graphqlUrl,
    // credentials: 'same-origin',
    credentials: 'include',
    // transportBatching: true,
  });

  // TODO: MM: extract so we can re-use this in abstract.js and other apps
  // function getCookie(name) {
  //   let cookieValue = null;
  //   if (document.cookie && document.cookie !== '') {
  //     const cookies = document.cookie.split(';');
  //     for (let i = 0; i < cookies.length; i += 1) {
  //       const cookie = (cookies[i] + '').trim();
  //       // Does this cookie string begin with the name we want?
  //       if (cookie.substring(0, name.length + 1) === `${name}=`) {
  //         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
  //         break;
  //       }
  //     }
  //   }
  //   return cookieValue;
  // }

  function setDefaultHeaders(req) {
    // Ideally would just use https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
    //  But due to compatibility used
    //  http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
    //  this won't work with service workers since we don't have the dom
    // if (window && window.document) {
    //   const ajaxToken = (new RegExp(`(?:^|; )${encodeURIComponent('ajaxtoken')}=([^;]*)`).exec(
    //     window.document.cookie,
    //   ) || [null, null])[1];
    //   const a = window.document.createElement('a');
    //   a.href = req.url;
    //   // The below check for !a.host is because IE for relative URLs i.e. (/my_fav_api)
    //   //  doesn't put anything in host which is a reasonable choice.
    //   if (!a.host || a.host === window.location.host) {
    //     req.options.headers['X-CSRFToken'] = getCookie('csrftoken');
    //     req.options.headers['X-PAGEUrl'] = window.location.href;
    //     req.options.headers['X-AJAXToken'] = ajaxToken;
    //   }
    // }
  }

  const middlewareLink = setContext(req => {
    const headers = {};

    headers['accept'] = 'application/json';
    setDefaultHeaders(req);

    if (typeof getAdditionalHeaders === 'function') {
      const additonalHeaders = getAdditionalHeaders();
      Object.assign(headers, additonalHeaders);
    }
    return {
      headers,
    };
  });

  apolloLink = middlewareLink.concat(apolloLink);

  const errorLink = onError(({ networkError, graphQLErrors }) => {
    if (graphQLErrors && graphQLErrors.length) {
      graphQLErrors.forEach(err => {
        if (__DEVELOPMENT__) {
          console.error('Got error from GraphQL server', err);
        }
      });
    }
    // if (networkError.statusCode === 401) {
    //   // logout();
    // }
  });

  apolloLink = errorLink.concat(apolloLink);

  // apolloLink.useAfter([
  //   {
  //     async applyAfterware({ response }, next) {
  //       const res = response.clone();

  //       // TODO: handle (log) transport level errors (browser-to-backend transport)
  //       if (res.status >= 400) {
  //         next();
  //         return;
  //       }

  //       // Handle backend grapqhl resolver level errors
  //       const json = await res.json();
  //       if (json.errors && json.errors.length) {
  //         json.errors.forEach(gqlError => {
  //           // maybe log these errors?
  //           if (__DEVELOPMENT__) {
  //             console.error('Got error from GraphQL server', gqlError);
  //           }
  //           if (gqlError.isNetworkError && gqlError.status === 401) {
  //             // TODO: check if hash part is not being dropped after going back to the app
  //             window.location.replace(
  //               '/accounts/login/?next=' + encodeURIComponent(window.location.pathname + window.location.hash),
  //             );
  //           }
  //         });
  //       }
  //       next();
  //     },
  //   },
  // ]);

  return apolloLink;
}

export function initializeMockedNetworkInterface(typeDefs, resolvers, mocks) {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  if (mocks) {
    addMockFunctionsToSchema({
      schema,
      mocks,
      preserveResolvers: true,
    });
  }
  return new SchemaLink({ schema });
}

interface ApolloClientCreatorProps {
  client: ApolloClient<any>;
  store?: Store<{}>;
}

interface ApolloClientOptions {
  mockConfig?: any;
  getAdditionalHeaders?: GetAdditonalHeaders;
}

export interface ApolloClientFactoryOptions {
  apolloClientOptions?: ApolloClientOptions;
}

export default function createApolloClient(
  apolloClientOptions: ApolloClientOptions = {},
): [typeof ApolloProvider, ApolloClientCreatorProps] {
  const { mockConfig, getAdditionalHeaders } = apolloClientOptions;
  let apolloLink = null;

  if (__MOCK_MODE__ && mockConfig) {
    const { typeDefs, resolvers, mocks } = mockConfig;
    apolloLink = initializeMockedNetworkInterface(typeDefs, resolvers, mocks);
  } else {
    apolloLink = initializeNetworkInterface(getAdditionalHeaders);
  }

  const client = new ApolloClient({
    link: apolloLink,
    cache: new InMemoryCache({
      addTypename: true,
    }),
  });

  const apollorProviderProps: ApolloClientCreatorProps = { client };

  return [ApolloProvider, apollorProviderProps];
}
