const puppeteer = require('puppeteer');
const Logger = require('../views/Logger');

class PuppeteerService {
  static async launchBrowser() {
    return puppeteer.launch({ headless: false, slowMo: 100 });
  }

  static async setMobileViewport(page) {
    await page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
  }

  static async checkLinks(page, validLinks) {
    let brokenLinks = [];
    for (const link of validLinks) {
      try {
        const response = await page.goto(link, { waitUntil: 'networkidle0', timeout: 5000 });
        if (!response.ok()) brokenLinks.push(link);
      } catch {
        brokenLinks.push(link);
      }
    }
    return brokenLinks;
  }

  static async testForm(page) {
    const formElements = await page.$$eval('form', forms => forms.map(form => form.action));
    // Logger.log(`📝 Testando formulários: ${formElements.length} encontrados`);
     try {
    //   const usernameField = await page.$('input[name="username"]');
    //   const passwordField = await page.$('input[name="password"]');
    //   if (usernameField && passwordField) {
    //     await page.type('input[name="username"]', 'testuser');
    //     await page.type('input[name="password"]', 'password123');
    //     await page.click('button[type="submit"]');
    //     Logger.log('✅ Formulário enviado com sucesso!');
    //   } else {
    //     Logger.log(`❌ Campos do formulário não encontrados!`);
    //   }
     } catch (error) {
      Logger.log(`❌ Erro ao interagir com o formulário: ${error.message}`);
        }
  }
}

module.exports = PuppeteerService;