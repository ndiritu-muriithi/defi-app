import Cookies from 'js-cookie';

export const setAuthToken = (token) => {
  Cookies.set('auth_token', token, { expires: 7 }); // Expires in 7 days
};

export const getAuthToken = () => {
  return Cookies.get('auth_token');
};

export const removeAuthToken = () => {
  Cookies.remove('auth_token');
};