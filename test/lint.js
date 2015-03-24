'use strict';

var eslint = require('eslint');
var should = require('should');

var cli = new eslint.CLIEngine();
var formatter = cli.getFormatter();

var report;

describe('code style guide', function() {
  it('index.js should follow our lint style guide', function(done) {
    cli = new eslint.CLIEngine({
      'rules': {
        'strict': [ 2, 'function' ]
      }
    });
    report = cli.executeOnFiles(['index.js']);
    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });

  it('test/main.js should follow our lint style guide', function(done) {
    cli = new eslint.CLIEngine({
      'rules': {
        'strict': [ 2, 'global' ]
      }
    });
    report = cli.executeOnFiles(['test/main.js']);
    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });

  it('test/lint.js should follow our lint style guide', function(done) {
    cli = new eslint.CLIEngine({
      'rules': {
        'no-console': 0,
        'strict': [ 2, 'global' ]
      }
    });
    report = cli.executeOnFiles(['test/lint.js']);
    if (report.errorCount > 0 || report.warningCount > 0) {
      console.log(formatter(report.results));
    }

    should(report.errorCount).equal(0);
    should(report.warningCount).equal(0);
    done();
  });
});
