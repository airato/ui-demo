import auth0 from 'auth0-js';

export class Auth {
  homeUrl: '/';
  history: any;
  auth0 = new auth0.WebAuth({
    domain: 'z-frontend-test-auth0.auth0.com',
    clientID: 'Qs8NT0yO0jJ1hwIZO842RX9zTc22jAZF',
    redirectUri: 'http://localhost:8080/authcallback',
    audience: 'http://localhost:8081',
    responseType: 'token id_token',
    scope: 'openid profile',
  });

  login = () => {
    this.auth0.authorize();
  };

  handleAuthentication = async () => {
    return new Promise((resolve, reject) => {
      this.auth0.parseHash((err, authResult) => {
        if (err) {
          reject(err);
        } else if (!(authResult && authResult.accessToken && authResult.idToken)) {
          reject(new Error('bad auth result'));
        } else {
          this.setSession(authResult);
          resolve();
        }
      });
    });
  };

  setSession = authResult => {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  };

  logout = () => {
    // Clear access token and ID token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    location.reload();
  };

  isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  };

  getAccessToken = () => {
    return localStorage.getItem('access_token');
  };
}

const auth = new Auth();

declare const window: any;
window.auth = auth;

export default auth;
