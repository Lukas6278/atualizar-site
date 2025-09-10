const ApiService = require('./services/ApiService');
const SiteTestController = require('./controllers/SiteTestController');
const { SiteModel } = require('./models/SiteModel');
const ReportView = require('./views/ReportView');
const Logger = require('./views/Logger');

(async () => {
  try {
    const domains = await ApiService.getSitesFromAPI();

    if (domains.length > 0) {
      const sites = domains.map(domain => new SiteModel(domain));

      const siteTestController = new SiteTestController();
      await siteTestController.testAllSites(sites);

      const reportView = new ReportView();
      reportView.saveSummaryReport({
        timestamp: new Date().toISOString(),
        testedSites: sites.map(site => site.url),
        summary: 'Todos os sites testados com sucesso',
      });
    } else {
      Logger.log("❌ Nenhum site encontrado para testar.");
    }
  } catch (error) {
    Logger.log(`❌ Erro ao buscar os sites da API: ${error.message}`);
  }
})();