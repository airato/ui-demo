import {
  renderApp,
  createReduxProvider,
  createApolloClient,
  createRouterProvider,
  createIntlProvider,
} from 'z-frontend-app-bootstrap';
import { createThemeProvider } from 'z-frontend-theme';

import reducers from './reducers';
import App from './App';
import mockConfig from '../mock';

declare const module;

const apolloClientOptions = __MOCK_MODE__ ? { mockConfig } : {};

renderApp({
  App,
  providers: [
    createIntlProvider(),
    createReduxProvider({ reducers }),
    createApolloClient(apolloClientOptions),
    createThemeProvider(),
    createRouterProvider(),
  ],
  hotReloadCallback: renderApp => {
    module.hot.accept('./App', () => {
      renderApp(App);
    });
  },
});
