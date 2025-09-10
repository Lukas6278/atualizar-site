const { ErrorRegistry } = require('../models/SiteModel');
const PuppeteerService = require('../services/PuppeteerService');
const Logger = require('../views/Logger');
const ReportView = require('../views/ReportView');

class SiteTestController {
  constructor() {
    this.errorRegistry = new ErrorRegistry();
    this.reportView = new ReportView();
    this.globalTestedUrlsSet = new Set();

    this.results = {
      urlsTested: new Set(),
      urlsSuccess: [],
      urlsEmptyContent: [],
      urlsError: [],
      languageSummary: {}
    };
  }

  _addLanguageSummary(language, url, status) {
    if (!this.results.languageSummary[language]) {
      this.results.languageSummary[language] = {
        success: [],
        error: [],
        emptyContent: []
      };
    }
    this.results.languageSummary[language][status].push(url);
  }

  setLanguageUrl(baseUrl, language) {
    return `${baseUrl.replace(/\/$/, '')}/${language}/`;
  }

  async getNavAndFooterUrls(page, baseUrl) {
    const baseOrigin = new URL(baseUrl).origin;

    const navLinks = await page.$$eval('nav a[href], ul a[href], ol a[href]', anchors =>
      anchors.map(a => a.href.trim())
    );

    const footerLinks = await page.$$eval('footer a[href]', anchors =>
      anchors.map(a => a.href.trim())
    );
    console.log("cddddddddddd")
    console.log(navLinks,footerLinks);

    const allLinks = new Set(
      [...navLinks, ...footerLinks].filter(href => {
        try {
          return new URL(href).origin === baseOrigin;
        } catch {
          return false;
        }
      })
    );
    console.log("fffffff")
    console.log(allLinks);

    return [...allLinks];
  }

  async testPageUrl(page, url, siteUrl, language, errorPagesObj, emptyContentPagesObj, testedUrlsSet) {
    if (testedUrlsSet.has(url)) {
      Logger.log(`⚠️ URL já testada, pulando: ${url}`);
      return;
    }

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      this.globalTestedUrlsSet.add(url);

      if (!response || response.status() >= 400) {
        const status = response ? response.status() : 'No Response';
        Logger.log(`❌ Erro HTTP ${status} em ${url}`);
        this.errorRegistry.registerError(siteUrl, language, url, `HTTP ${status}`, `Status HTTP ${status}`);
        errorPagesObj.push(url);

        this.results.urlsTested.add(url);
        this.results.urlsError.push(url);
        this._addLanguageSummary(language, url, 'error');
        return;
      }

      const hasContent = await page.evaluate(() => {
        const content = document.querySelector('.popularCate');
        if (!content) return false;
        return content.innerText.trim().length > 5;
      });

      if (!hasContent) {
        this.errorRegistry.registerEmptyContent(siteUrl, language, url, 'Conteúdo insuficiente ou classe .popularCate vazia');
        emptyContentPagesObj.push(url);

        this.results.urlsEmptyContent.push(url);
        this._addLanguageSummary(language, url, 'emptyContent');
      } else {
        this.results.urlsSuccess.push(url);
        this._addLanguageSummary(language, url, 'success');
      }

      testedUrlsSet.add(url);
    } catch (error) {
      Logger.log(`❌ Erro ao testar ${url}: ${error.message}`);
      this.errorRegistry.registerError(siteUrl, language, url, 'exception', error.message);
      errorPagesObj.push(url);

      this.results.urlsTested.add(url);
      this.results.urlsError.push(url);
      this._addLanguageSummary(language, url, 'error');
    }
  }

  async testSite(site, errorPagesObj, emptyContentPagesObj) {
    const browser = await PuppeteerService.launchBrowser();

    try {
      const pagePromises = site.languages.map(async (language) => {
        const page = await browser.newPage();
        await PuppeteerService.setMobileViewport(page);

        const languageUrl = this.setLanguageUrl(site.url, language);
        const testedUrlsSet = new Set();

        await this.testPageUrl(page, languageUrl, site.url, language, errorPagesObj, emptyContentPagesObj, testedUrlsSet);
        this.globalTestedUrlsSet.add(languageUrl);

        const navFooterUrls = await this.getNavAndFooterUrls(page, languageUrl);

        const newUrls = navFooterUrls.filter(url => !this.globalTestedUrlsSet.has(url));
        newUrls.forEach(url => this.globalTestedUrlsSet.add(url));

        for (const url of newUrls) {
          await this.testPageUrl(page, url, site.url, language, errorPagesObj, emptyContentPagesObj, testedUrlsSet);
        }

        await page.close();
        Logger.log(`🛑 Testes para idioma ${language} concluídos.`);
      });

      await Promise.all(pagePromises);
    } finally {
      await browser.close();
    }
  }

  async runWithConcurrency(items, maxConcurrent, fn) {
    const results = [];
    const executing = [];

    for (const item of items) {
      const p = fn(item);
      results.push(p);

      if (maxConcurrent <= items.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= maxConcurrent) {
          await Promise.race(executing);
        }
      }
    }
    return Promise.all(results);
  }

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

        siteInfo.errorPages = [...errorPagesObj];
        siteInfo.emptyContentPages = [...emptyContentPagesObj];
        testedSites.push(siteInfo);

        Logger.log(`✅ Finalizado testes para o site: ${site.url}`);
      } catch (error) {
        siteInfo.status = 'Erro durante o teste';
        testedSites.push(siteInfo);
        Logger.log(`❌ Erro ao testar o site ${site.url}: ${error.message}`);
      }
    });

    const fs = require('fs');
    const path = require('path');
    const reportDir = path.resolve(__dirname, '..', 'report');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filePath = path.resolve(reportDir, 'tested_sites.json');
    fs.writeFileSync(filePath, JSON.stringify(testedSites, null, 2));

    this.reportView.saveErrorPages(this.errorRegistry.errorPages, this.errorRegistry.emptyContentPages);

    if (errorPagesObj.length > 0 || emptyContentPagesObj.length > 0) {
      this.reportView.saveErrorPages({ errorPages: errorPagesObj, emptyContentPages: emptyContentPagesObj });
    }

       console.log(JSON.stringify(this.results))
    // Logger.log('📊 ==== RESUMO FINAL DOS TESTES ====');
    // Logger.log(`✅ Sucesso (${this.results.urlsSuccess.length}):`);
    // this.results.urlsSuccess.forEach(url => Logger.log(`   - ${url}`));

    // Logger.log(`❌ Erros (${this.results.urlsError.length}):`);
    // this.results.urlsError.forEach(url => Logger.log(`   - ${url}`));

    // if (this.results.urlsEmptyContent.length > 0) {
    //   Logger.log(`⚠️ Conteúdo vazio (${this.results.urlsEmptyContent.length}):`);
    //   this.results.urlsEmptyContent.forEach(url => Logger.log(`   - ${url}`));
    // }

    // Logger.log('🌐 Sumário por idioma:');
    // for (const [lang, summary] of Object.entries(this.results.languageSummary)) {
    //   Logger.log(`   Idioma: ${lang}`);
    //   Logger.log(`      ✅ Success: ${summary.success.length}`);
    //   Logger.log(`      ❌ Error: ${summary.error.length}`);
    //   Logger.log(`      ⚠️ EmptyContent: ${summary.emptyContent.length}`);
    // }
  }
}

module.exports = SiteTestController;
