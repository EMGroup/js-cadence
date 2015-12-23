/**
 * This script runs all the automated tests written for jseden.
 */
var qunit = require('qunit');

qunit.setup({
	log: {
		testing: true,
		errors: true
	},
});

qunit.run([
	{
		deps: ['js/language/lang.js'],
		code: 'js/core/lex.js',
		tests: 'js/tests/lex.js'
	},
	{
		deps: ['js/core/lex.js', 'js/core/errors.js'],
		code: 'js/core/parser.js',
		tests: 'js/tests/parser.js'
	}
], function (err, report) {
	if (report.failed) {
		process.exit(1);
	}
});
