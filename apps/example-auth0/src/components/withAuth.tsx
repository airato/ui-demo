import React, { Component, ComponentClass, StatelessComponent } from 'react';
import { connect } from 'react-redux';

export default function withAuth<WrappedComponentProps = {}>(options = {}) {
  return function withAuth(WrappedComponent: ComponentClass | StatelessComponent) {
    type Props = WrappedComponentProps & { isAuthenticated: boolean };
    class AuthCheckerWrapper extends Component<Props> {
      static displayName = `Auth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
      render() {
        const { isAuthenticated, ...rest } = this.props as any;
        if (isAuthenticated) {
          return <WrappedComponent {...rest} />;
        }
        return <div>please login</div>;
      }
    }
    return connect((state: any) => {
      return {
        isAuthenticated: state.auth.isAuthenticated,
      };
    })(AuthCheckerWrapper);
  };
}
