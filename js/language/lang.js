var Language = {
	language: "en",

	loadSymbols: function(root) {
		for (var s in this.symbols) {
			if (s != this.symbols[s] && root.symbols[this.symbols[s]] === undefined) {
				root.symbols[this.symbols[s]] = root.lookup(s);
			}
		}
	},

	addKeywords: function(keywords) {
		for (var k in keywords) {
			this.keywords[k] = keywords[k];
		}
	},
	addSymbols: function(symbols) {
		for (var s in symbols) {
			this.symbols[s] = symbols[s];
		}
	},

	doxytags: {
		"title": "title",
		"author": "author",
		"version": "version",
		"param": "param",
		"return": "return",
		"fixed": "fixed"
	},

	keywords: {
		"when": "when",
		"is": "is",
		"action": "action",
		"do": "do"
	},

	objects: {
		"math": "math",
		"string": "string",
		"strings": "strings",
		"numbers": "numbers",
		"integers": "integers",
		"global": "global",
		"reals": "reals",
		"booleans": "booleans"
	},

	operations: {

	},

	values: { "true":"true", "false":"false", "undefined": "undefined" },

	errors: {}
};

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.Language = Language;
}
