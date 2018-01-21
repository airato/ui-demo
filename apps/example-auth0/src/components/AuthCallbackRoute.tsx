import { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';

import auth from '../auth';
import { setAuthStateAction } from '../reducers/auth';

type CallbackRouteProps = RouteComponentProps<{}> & {
  setAuthState: (isAuthenticated: boolean) => void;
};

class AuthCallbackRoute extends Component<CallbackRouteProps> {
  checkAuthResult = async () => {
    if (/access_token|id_token|error/.test(this.props.location.hash)) {
      await auth.handleAuthentication();
    }
    this.props.setAuthState(auth.isAuthenticated());
    this.props.history.push('/');
  };

  componentDidMount() {
    this.checkAuthResult();
  }
  render() {
    return null;
  }
}

export default connect(null, dispatch => ({
  setAuthState(isAuthenticated) {
    dispatch(setAuthStateAction(isAuthenticated));
  },
}))(AuthCallbackRoute);
