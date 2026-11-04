import API from '../api';

const gymService = {
  async billing() {
    return (await API.get('/gym/billing')).data;
  },

  async update(payload) {
    return (await API.patch('/gym', payload)).data;
  },

  async staff() {
    return (await API.get('/gym/staff')).data;
  },

  async createStaff(payload) {
    return (await API.post('/gym/staff', payload)).data;
  },

  async updateStaff(membershipId, payload) {
    return (
      await API.patch(`/gym/staff/${membershipId}`, payload)
    ).data;
  },
};

export default gymService;