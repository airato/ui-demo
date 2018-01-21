import React, { Component } from 'react';
import { graphql, ChildProps } from 'react-apollo';
import gql from 'graphql-tag';

import withAuth from '../components/withAuth';

interface Result {
  me: {
    id: string;
    email: string;
  };
}
interface Props {}
type AllProps = ChildProps<{}, Result>;

const query = gql`
  query {
    me {
      id
      email
    }
  }
`;

@(withAuth<Props>() as ((c) => any))
@(graphql<Result, Props>(query) as ((c) => any))
class Home extends Component<AllProps> {
  render() {
    if (this.props.data.loading) {
      return <div>loading...</div>;
    } else if (this.props.data.error) {
      return <div>something went wrong...</div>;
    }

    const { email } = this.props.data.me;

    return <div>Hi {email}!</div>;
  }
}

export default Home;
