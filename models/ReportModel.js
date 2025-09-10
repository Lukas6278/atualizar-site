const fs = require('fs');
const path = require('path');

class ReportModel {
  constructor() {
    this.reportDir = path.resolve(__dirname, '..', 'report');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  saveJson(filename, data) {
    const filePath = path.resolve(this.reportDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }
}

module.exports = ReportModel;