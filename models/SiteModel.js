class SiteModel {
  constructor(url, languages = ['pt', 'en', 'es', 'de', 'fr'], categories = []) {
    this.url = url.startsWith('http') ? url : `https://${url}`;
    this.languages = languages;
    this.categories = categories;
  }
}

class ErrorRegistry {
  constructor() {
    this.errorPages = {};       // { siteUrl: { language: { url: { errorType, details } } } }
    this.emptyContentPages = {};
  }

  registerError(siteUrl, language, url, errorType, details) {
    if (!this.errorPages[siteUrl]) this.errorPages[siteUrl] = {};
    if (!this.errorPages[siteUrl][language]) this.errorPages[siteUrl][language] = {};
    this.errorPages[siteUrl][language][url] = { errorType, details };
  }

  registerEmptyContent(siteUrl, language, url, details) {
    if (!this.emptyContentPages[siteUrl]) this.emptyContentPages[siteUrl] = {};
    if (!this.emptyContentPages[siteUrl][language]) this.emptyContentPages[siteUrl][language] = {};
    this.emptyContentPages[siteUrl][language][url] = { details };
  }
}

module.exports = { SiteModel, ErrorRegistry };