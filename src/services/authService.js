import API from '../api';

const authService = {
  async login(credentials) {
    const { data } = await API.post(
      '/auth/login',
      credentials,
      { skipAuth: true }
    );

    if (!data?.token) {
      throw new Error('Login response did not contain a token.');
    }

    return data;
  },

  async me() {
    const { data } = await API.get('/auth/me');
    return data;
  },

  async selectGym(gymId) {
    const { data } = await API.post('/auth/select-gym', {
      gymId,
    });

    if (!data?.token) {
      throw new Error('Gym selection did not return a token.');
    }

    return data;
  },

  async logout() {
    await API.post('/auth/logout');
  },

  async changePassword(payload) {
    const { data } = await API.post(
      '/auth/change-password',
      payload
    );

    return data;
  },
};

export default authService;