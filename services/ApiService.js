const axios = require('axios');
const Logger = require('../views/Logger');

class ApiService {
  static async getSitesFromAPI() {
    const apiUrl = 'https://metacms.highstakes.tech/api/repotable-domains-by-org/highstakes/';
    try {
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error) {
      Logger.log(`❌ Erro ao buscar sites da API: ${error.message}`);
      return [];
    }
  }
}

module.exports = ApiService;