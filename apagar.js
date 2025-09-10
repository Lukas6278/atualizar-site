async testAllSites(sites) {
  const errorPagesObj = [];
  const emptyContentPagesObj = [];
  const testedSites = [];

  const MAX_CONCURRENT_BROWSERS = 1;

  // Passando diretamente a URL para teste
  const site = {
    url: 'https://mixcity.net/',
    languages: ['en', 'pt', 'es', 'de', 'fr'], // Defina os idiomas que você deseja testar
  };

  await this.runWithConcurrency([site], MAX_CONCURRENT_BROWSERS, async (site) => {
    const siteInfo = {
      url: site.url,
      languagesTested: site.languages,
      errorPages: [],
      emptyContentPages: [],
      status: 'Testado com sucesso',
    };

    try {
      Logger.log(`🚀 Iniciando testes para o site: ${site.url}`);
      await this.testSite(site, errorPagesObj, emptyContentPagesObj);

      siteInfo.errorPages = errorPagesObj;
      siteInfo.emptyContentPages = emptyContentPagesObj;
      testedSites.push(siteInfo);

      Logger.log(`✅ Finalizado testes para o site: ${site.url}`);
    } catch (error) {
      siteInfo.status = 'Erro durante o teste';
      testedSites.push(siteInfo);
      Logger.log(`❌ Erro ao testar o site ${site.url}: ${error.message}`);
    }
  });

  // Salvar relatório dos sites testados
  const fs = require('fs');
  const path = require('path');
  const reportDir = path.resolve(__dirname, '..', 'report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const filePath = path.resolve(reportDir, 'tested_sites.json');
  fs.writeFileSync(filePath, JSON.stringify(testedSites, null, 2));
  Logger.log(`📋 Relatório dos sites testados salvo em: ${filePath}`);

  // Salvar erros detalhados
  this.reportView.saveErrorPages(this.errorRegistry.errorPages, this.errorRegistry.emptyContentPages);

  if (errorPagesObj.length > 0 || emptyContentPagesObj.length > 0) {
    this.reportView.saveErrorPages({ errorPages: errorPagesObj, emptyContentPages: emptyContentPagesObj });
  }
}

