import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import { Route, Switch } from 'react-router-dom';

import RouteNotFound from './RouteNotFound';
import Home from './home/Home';
import Login from './login/Login';
import NavBar from './components/NavBar';
import AuthCallbackRoute from './components/AuthCallbackRoute';
import auth from './auth';

type Props = RouteComponentProps<{}>;

class App extends Component<Props> {
  render() {
    return (
      <div>
        <NavBar auth={auth} />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route path="/authcallback" component={AuthCallbackRoute} />
          <Route component={RouteNotFound} />
        </Switch>
      </div>
    );
  }
}

export default App;
