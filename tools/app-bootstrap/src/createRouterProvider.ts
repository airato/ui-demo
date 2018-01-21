import { HashRouter, BrowserRouter } from 'react-router-dom';

export default function createRouterProvider(useBrowserRouter = false) {
  return useBrowserRouter ? BrowserRouter : HashRouter;
}
