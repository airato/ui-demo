import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Auth } from '../auth';

class NavBar extends Component<{ auth: Auth; isAuthenticated: boolean }> {
  render() {
    return (
      <div>
        Nav
        <div>
          {this.props.isAuthenticated ? (
            <button type="button" onClick={() => this.props.auth.logout()}>
              Logout
            </button>
          ) : (
            <button type="button" onClick={() => this.props.auth.login()}>
              Login
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default connect((state: any) => ({
  isAuthenticated: state.auth.isAuthenticated,
}))(NavBar);
