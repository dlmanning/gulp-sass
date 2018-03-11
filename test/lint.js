const eslint = require('eslint');
const should = require('should');

describe('code style guide', () => {
  it('index.js should follow our lint style guide', (done) => {
    const cli = new eslint.CLIEngine({ rules: { 'spaced-comment': 0 } });
    const formatter = cli.getFormatter();
    const report = cli.executeOnFiles(['index.js']);

    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });

  it('test/main.js should follow our lint style guide', (done) => {
    const cli = new eslint.CLIEngine();
    const formatter = cli.getFormatter();
    const report = cli.executeOnFiles(['test/main.js']);

    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });

  it('test/lint.js should follow our lint style guide', (done) => {
    const cli = new eslint.CLIEngine({ rules: { 'no-console': 0 } });
    const formatter = cli.getFormatter();
    const report = cli.executeOnFiles(['test/lint.js']);

    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });
});
