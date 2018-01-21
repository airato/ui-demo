import auth from '../auth';

const setAuthStateActionName = 'SET_AUTH_STATE';

export const setAuthStateAction = (isAuthenticated = false) => ({
  type: setAuthStateActionName,
  payload: isAuthenticated,
});

export default function authReducer(state = { isAuthenticated: auth.isAuthenticated() }, { type, payload }) {
  if (type === setAuthStateActionName) {
    return {
      ...state,
      isAuthenticated: payload,
    };
  }
  return state;
}
