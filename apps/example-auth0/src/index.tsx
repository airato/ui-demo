import {
  renderApp,
  createApolloClient,
  createReduxProvider,
  createRouterProvider,
  createIntlProvider,
} from 'z-frontend-app-bootstrap';
import { createThemeProvider } from 'z-frontend-theme';

import reducers from './reducers';
import App from './App';
import mockConfig from '../mock';
import auth from './auth';

declare const module;

const apolloClientOptions = {
  mockConfig: __MOCK_MODE__ ? mockConfig : undefined,
  getAdditionalHeaders: () => {
    if (auth.isAuthenticated()) {
      return {
        Authorization: `Bearer ${auth.getAccessToken()}`,
      };
    }
    return {};
  },
};

renderApp({
  App,
  providers: [
    createIntlProvider(),
    createReduxProvider({ reducers }),
    createApolloClient(apolloClientOptions),
    createThemeProvider(),
    createRouterProvider(true),
  ],
  hotReloadCallback: renderApp => {
    module.hot.accept('./App', () => {
      renderApp(App);
    });
  },
});
