const ReportModel = require('../models/ReportModel');
const Logger = require('./Logger');

class ReportView {
  constructor() {
    this.reportModel = new ReportModel();
  }

  saveErrorPages(errorPages, emptyContentPages) {
    try {
      const errorPath = this.reportModel.saveJson('error_pages_detalhado.json', errorPages);
      Logger.log(`📋 Páginas com erro detalhadas salvas em: ${errorPath}`);

      const emptyContentPath = this.reportModel.saveJson('empty_content_pages_detalhado.json', emptyContentPages);
      Logger.log(`📋 Páginas sem conteúdo detalhadas salvas em: ${emptyContentPath}`);
    } catch (err) {
      Logger.log(`❌ Erro ao salvar arquivos de relatório: ${err.message}`);
    }
  }

  saveSummaryReport(summary) {
    try {
      const reportPath = this.reportModel.saveJson('test_report.json', summary);
      Logger.log(`📝 Relatório gerado: ${reportPath}`);
    } catch (err) {
      Logger.log(`❌ Erro ao salvar relatório final: ${err.message}`);
    }
  }
}

module.exports = ReportView;