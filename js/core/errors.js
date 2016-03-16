/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */



/**
 * Constructor for syntax errors detected in the new parser. It captures the
 * type of error, the context and location.
 */
Cadence.SyntaxError = function(context, errno, extra) {
	this.type = "syntax";
	this.context = context;
	this.errno = errno;
	this.extra = extra;
	this.token = context.token;
	this.prevtoken = context.previous;
	this.line = context.stream.prevline;
	this.position = context.stream.position;
	this.prevposition = context.stream.prevposition;
};

Cadence.SyntaxError.UNKNOWN = 0;
Cadence.SyntaxError.MISSINGSEMICOLON = 1;
Cadence.SyntaxError.MISSINGENTITY = 2;
Cadence.SyntaxError.LHSJAVASCRIPT = 3;
Cadence.SyntaxError.MISSINGIS = 4;
Cadence.SyntaxError.CLOSEPATH = 5;


Cadence.SyntaxError.db = [
/* CADENCE_ERROR_UNKNOWN */
	{ message: function() { return 0; } },
/* CADENCE_ERROR_MISSINGSEMICOLON */
	{ message: function() { return 0; } },
/* CADENCE_ERROR_MISSINGENTITY */
	{ message: function() { return 0; } },
/* CADENCE_ERROR_LHSJAVASCRIPT */
	{ message: function() { return 0; } },
/* CADENCE_ERROR_MISSINGIS */
	{ message: function() { return 0; } },
/* CADENCE_ERROR_CLOSEPATH */
	{ message: function() { return 0; } }
];



Cadence.SyntaxError.prototype.extractBefore = function(maxchar) {
	var pos = this.prevposition;
	while (pos > 0 && maxchar > 0) {
		if (this.context.stream.code.charCodeAt(pos) == 10) {
			break;
		}
		pos--;
		maxchar--;
	}
	if (this.context.stream.code.charCodeAt(pos) == 10) {
		pos++;
	}
	return this.context.stream.code.substr(pos, this.prevposition - pos);
};

Cadence.SyntaxError.prototype.extractToken = function() {
	return this.context.stream.code.substr(this.prevposition, this.position - this.prevposition);
};

Cadence.SyntaxError.prototype.extractAfter = function(maxchar) {
	var pos = this.position;
	while (pos < this.context.stream.code.length && maxchar > 0) {
		if (this.context.stream.code.charCodeAt(pos) == 10) {
			//pos--;
			break;
		}
		pos++;
		maxchar--;
	}
	return this.context.stream.code.substr(this.position, pos - this.position);
};

Cadence.SyntaxError.prototype.buildSuggestion = function() {
	var autofix = Cadence.SyntaxError.db[this.errno].suggestion;
	// Did we get a token that we expect to get next?
	if (autofix.next.indexOf(this.token) != -1) {
		// So insert an expected token because its missing
		return this.extractBefore(10)
				+ autofix.expected[0]
				+ " " + this.extractToken()
				+ this.extractAfter(10);
	} else {
		// Replace token with an expected one.
		// This might just be a spelling mistake.
		// Maybe also check that the next token is in expected.
		// It may also be a keyword used as an observable.
		return this.extractBefore(10)
				+ autofix.expected[0]
				+ " "
				+ this.extractAfter(10);
	}
};

Cadence.SyntaxError.prototype.messageText = function() {
	var err = Cadence.SyntaxError.db[this.errno];
	var txt = Language.errors[this.errno][err.message.call(this)]
	if (this.extra === undefined) {
		return txt;
	} else {
		return txt + ": " + this.extra;
	}
}

Cadence.SyntaxError.prototype.prettyPrint = function() {
	// Move stream to correct location
	this.context.stream.pushPosition();
	this.context.stream.move(this.position);

	var err = Cadence.SyntaxError.db[this.errno];

	var msg = "NO MSG: " + this.errno;
	if (Language.errors && Language.errors[this.errno]) {
		Language.errors[this.errno][err.message.call(this)];
	}
	var errmsg =
			"Error:\n    " + msg +
			"\n    Source : " + this.context.src + ", line " + this.line +
			"\n    Code   : " + this.errno;

	errmsg += "\n    Here   : " + this.extractBefore(10) + ">>> " + this.extractToken() + " <<<" + this.extractAfter(10);

	if (err && err.suggestion) {
		errmsg += "\n    Suggestion : " + this.buildSuggestion();
	}

	// Reset stream position
	this.context.stream.popPosition();

	return errmsg;
};

Cadence.SyntaxError.prototype.toString = function() {
	return this.prettyPrint();
}




/**
 * Constructor for AST runtime errors. This must be given positional info
 * because it can't be extracted from context.
 */
Cadence.RuntimeError = function(context, errno, statement, extra) {
	this.type = "runtime";
	this.line = -1;
	this.statement = statement;
	this.extra = extra;
	this.errno = errno;
}

Cadence.RuntimeError.UNKNOWN = 0;

Cadence.RuntimeError.prototype.messageText = function() {
	switch (this.errno) {
	default: break;
	}

	if (String(this.extra).search("is not a function") >= 0) {
		return "Function does not exist";
	} else if (String(this.extra).match(/Cannot read property .* of undefined/)) {
		return "Not a valid list";
	}
	return this.extra;
}

Cadence.RuntimeError.prototype.prettyPrint = function() {
	return "Run-time Error:\n"+this.extra.stack;
}


