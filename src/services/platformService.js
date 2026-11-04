import API from '../api';

const platformService = {
  async getGyms() {
    return (await API.get('/platform/gyms')).data;
  },

  async createGym(payload) {
    return (await API.post('/platform/gyms', payload)).data;
  },

  async updateGymStatus(id, status) {
    return (
      await API.patch(`/platform/gyms/${id}/status`, { status })
    ).data;
  },

  async getPlans() {
    return (await API.get('/platform/plans')).data;
  },

  async createPlan(payload) {
    return (await API.post('/platform/plans', payload)).data;
  },

  async updatePlan(id, payload) {
    return (await API.patch(`/platform/plans/${id}`, payload)).data;
  },

  async getInvoices() {
    return (await API.get('/platform/invoices')).data;
  },

  async issueInvoice(gymId, planId) {
    return (
      await API.post(`/platform/gyms/${gymId}/invoices`, { planId })
    ).data;
  },

  async payInvoice(id, payload) {
    return (
      await API.post(`/platform/invoices/${id}/pay`, payload)
    ).data;
  },

  async voidInvoice(id) {
    return (
      await API.post(`/platform/invoices/${id}/void`)
    ).data;
  },

  async resetPassword(userId, newPassword) {
    return (
      await API.post(`/platform/users/${userId}/reset-password`, {
        newPassword,
      })
    ).data;
  },
};

export default platformService;