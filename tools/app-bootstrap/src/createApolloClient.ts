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
import fetch from 'unfetch';

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
    fetch: window.fetch || fetch,
    uri: graphqlUrl,
    // credentials: 'same-origin',
    credentials: 'include',
    // transportBatching: true,
  });

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

  function setDefaultHeaders() {
    const headers = {};
    if (window && window.document) {
      // const ajaxToken = (new RegExp(`(?:^|; )${encodeURIComponent('ajaxtoken')}=([^;]*)`).exec(
      //   window.document.cookie,
      // ) || [null, null])[1];
      // headers['X-CSRFToken'] = getCookie('csrftoken');
      // headers['X-PAGEUrl'] = window.location.href;
      // headers['X-AJAXToken'] = ajaxToken;
    }
    return headers;
  }

  const middlewareLink = setContext(() => {
    const headers = {
      ...setDefaultHeaders(),
    };

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
          console.error('Got a graphql error', err);
        }
      });
    }
    if ((networkError as any).statusCode === 401) {
      if (__DEVELOPMENT__) {
        console.error('Got a network error from GraphQL server', networkError);
      }
    }
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

export interface ApolloClientOptions {
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
