/*
 * Copyright (c) 2015, Nicolas Pope
 * All rights reserved.
 *
 * See LICENSE.txt
 */


/**
 * Abstract Syntax Tree generator for JS-Cadence code.
 * Each production in the grammar has a function in this class. It makes use
 * of the Cadence.Stream class to tokenise the script, and the Cadence.SyntaxError class to
 * report the errors found. To use, pass the script to the constructor.
 * @param code String containing the script.
 */
Cadence.Parser = function(code, imports) {
	this.stream = new Cadence.Stream(code);
	this.data = new Cadence.SyntaxData();
	this.token = "INVALID";
	this.previous = "INVALID";
	this.src = "input";
	this.lines = [];
	this.parent = undefined;
	this.scripts = {};			// Actions table
	this.triggers = {};			// Guarded actions
	this.definitions = {};		// Definitions mapping
	this.imports = (imports) ? imports : [];
	this.errors = undefined;

	this.lastDoxyComment = undefined;
	this.mainDoxyComment = undefined;

	this.stream.data = this.data;
}


Cadence.Parser.precedence = {
	"OBSERVABLE": 0,
	"NUMBER": 0,
	"STRING": 0,
	"*": 1,
	"/": 1,
	"%": 1,
	"+": 2,
	"-": 2,
	",": 3,
	"⟨": 4,
	"⟩": 4
};

Cadence.Parser.precedenceOf = function(token) {
	var prec = Cadence.Parser.precedence[token];
	if (prec) return prec;
	//console.log("UNKNOWN PREC: " + token);
	return 0;
}


Cadence.Parser.prototype.parse = function() {
	this.stream.position = 0;
	// Get First Token;
	this.next();
	// Start parse with SCRIPT production
	this.script = this.pSCRIPT();
	this.errors = this.script.errors;
}

Cadence.Parser.prototype.generate = function() {
	if (this.script) {
		return this.script.generate();
	}
	return "";
}



/**
 * Recursive search of all imports for the required action code.
 */
Cadence.Parser.prototype.getActionByName = function(name) {
	var script = this.scripts[name];

	if (script === undefined) {
		for (var i=0; i<this.imports.length; i++) {
			if (this.imports[i] && this.imports[i].ast) {
				// Check this scripts actions for the one we want
				script = this.imports[i].ast.getActionByName(name);
				if (script) return script;
			}
		}
	}

	return script;
}



Cadence.Parser.prototype.generate = function() {
	return this.script.generate();
}



Cadence.Parser.prototype.execute = function(root) {
	this.script.execute(root, undefined, this);
}



/**
 * Reset all statements that have been marked as executed previously. Used
 * by the input window gutter for polling changes of execution state.
 */
Cadence.Parser.prototype.clearExecutedState = function() {
	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i]) {
			if (this.lines[i].executed > 0) {
				this.lines[i].executed = 0;
			}
		}
	}
}


/* Execute a particular line of script.
 * If the statement is part of a larger statement block then execute
 * that instead (eg. a proc).
 */
Cadence.Parser.prototype.executeLine = function(lineno) {
	var line = lineno;
	// Make sure we are not in the middle of a proc or func.
	//while ((line > 0) && (this.lines[line] === undefined)) {
	//	line--;
	//}

	var statement;
	if (lineno == -1) {
		statement = this.script;
	} else {
		statement = this.lines[line];
	}
	if (statement === undefined) return;

	// Find root statement and execute that one
	statement = this.getBase(statement);

	// Execute only the currently changed root statement
	this.executeStatement(statement, line);
}



/**
 * Find the base/parent statement of a given statement. Used to make sure
 * statements inside functions etc are not executed directly and out of context.
 */
Cadence.Parser.prototype.getBase = function(statement) {
	var base = statement;
	while (base.parent && base.parent != this.script) base = base.parent;
	return base; 
}



/**
 * Return the start and end line of the statement block located at a particular
 * line. Returns an array of two items, startline and endline.
 */
Cadence.Parser.prototype.getBlockLines = function(lineno) {
	var line = lineno;
	var me = this;

	var startstatement = this.getBase(this.lines[line]);
	while (line > 0 && this.lines[line-1] && this.getBase(this.lines[line-1]) == startstatement) line--;
	var startline = line;

	while (line < this.lines.length-1 && this.lines[line+1] && (this.lines[line+1] === startstatement || this.lines[line+1].parent != this.script)) line++;
	var endline = line;

	return [startline,endline];
}



/**
 * Execute the given statement and catch any errors.
 */
Cadence.Parser.prototype.executeStatement = function(statement, line) {
	var result;
	var origin;
	var source = statement.generate();
	console.log(source);
	eval("result = "+source+";");
	Cadence.log(result);
}



/**
 * Get the js-eden source code for a specific statement.
 */
Cadence.Parser.prototype.getSource = function(ast) {
	return this.stream.code.slice(ast.start,ast.end).trim();
}


Cadence.Parser.prototype.getRoot = function() {
	return this.script;
}



Cadence.Parser.prototype.getErrors = function() {
	return this.script.errors;
}



Cadence.Parser.prototype.hasErrors = function() {
	return this.script.errors.length > 0;
}


/**
 * Dump the AST as stringified JSON, or pretty print any error messages.
 * @return String of AST or errors.
 */
Cadence.Parser.prototype.prettyPrint = function() {
	var result = "";

	if (this.script.errors.length > 0) {
		for (var i = 0; i < this.script.errors.length; i++) {
			result = result + this.script.errors[i].prettyPrint() + "\n\n";
		}
	} else {
		result = JSON.stringify(this.script, function(key, value) {
			if (key == "errors") return undefined;
			if (key == "parent") {
				if (value) return true;
				else return undefined;
			} 
			return value;
		}, "    ");
	}

	return result;
};


/**
 * Move to next token. This skips comments, extracts doxygen comments and
 * parses out any embedded javascript. The javascript is parsed here instead of
 * in the lexer because it needs to deal with multi-line code.
 */
Cadence.Parser.prototype.next = function() {
	this.previous = this.token;
	this.token = this.stream.readToken();

	//Cache prev line so it isn't affected by comments
	var prevline = this.stream.prevline;

	//Skip comments
	while (true) {
		// Skip block comments
		if (this.token == "/*") {
			var count = 1;
			var isDoxy = false;
			var start = this.stream.position-2;
			var startline = this.stream.line;

			// Extra * after comment token means DOXY comment.
			if (this.stream.peek() == 42) isDoxy = true;

			// Find terminating comment token
			while (this.stream.valid() && (this.token != "*/" || count > 0)) {
				this.token = this.stream.readToken();
				// But make sure we count any inner comment tokens
				if (this.token == "/*") {
					count++;
				} else if (this.token == "*/") {
					count--;
				}
			}

			// Store doxy comment so next statement can use it, or if we are
			// at the beginning of the script then its the main doxy comment.
			if (isDoxy) {
				this.lastDoxyComment = new Cadence.Parser.DoxyComment(this.stream.code.substring(start, this.stream.position), startline, this.stream.line);
				if (startline == 1) this.mainDoxyComment = this.lastDoxyComment;
			}
			this.token = this.stream.readToken();
		// Skip line comments
		} else if (this.token == "//") {
			this.stream.skipLine();
			this.token = this.stream.readToken();
		// Extract javascript code blocks
		} else if (this.token == "${{") {
			var start = this.stream.position;
			var startline = this.stream.line;
			this.data.line = startline;

			// Go until terminating javascript block token
			while (this.stream.valid() && this.token != "}}$") {
				this.token = this.stream.readToken();
			}

			// Return code as value and generate JAVASCRIPT token
			this.data.value = this.stream.code.substring(start, this.stream.position-3);
			this.token = "JAVASCRIPT";
		} else {
			break;
		}
	}

	// Update previous line to ignore any comments.
	this.stream.prevline = prevline;
};



Cadence.Parser.prototype.skipUntil = function(tok) {
	while (this.stream.valid() && this.token != tok) {
		this.next();
	}
}



Cadence.Parser.prototype.peekNext = function(count) {
	var res;
	var localdata = {value: ""};
	this.stream.data = localdata;
	this.stream.pushPosition();
	while (count > 0) {
		res = this.stream.readToken();
		count--;
	}
	this.stream.popPosition();
	this.stream.data = this.data;
	return res;
};



////////////////////////////////////////////////////////////////////////////////
//    Grammar Productions                                                     //
////////////////////////////////////////////////////////////////////////////////

Cadence.Parser.prototype.pSCRIPT = function() {
	var script = new Cadence.AST.Script();
	var stat;

	while (this.stream.valid()) {
		var curline = this.stream.line - 1;
		var endline = -1;
		var path = this.pPATH();

		if (path.hasErrors()) {
			this.skipUntil(";");
			continue;
		}

		if (this.token == "is") {
			var definition = this.pDEFINITION();
			definition.addLHSPath(path);
			stat = definition;
			script.addDefinition(definition);
			if (definition.hasErrors()) {
				this.skipUntil(";");
				continue;
			} else {
				if (this.stream.valid()) {
					if (this.token == "}") {
						return script;
					} else if (this.token != ";") {
						script.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.MISSINGSEMICOLON));
						this.skipUntil(";");
					}
					this.next();
				}
			}
		} else if (this.token == ";") {
			stat = path;
			script.addQuery(path);
			this.next();
		}

		endline = this.stream.line;

		this.lines[curline] = stat;
		//var endline = this.stream.line;
		for (var i=curline+1; i<endline; i++) {
			if (this.lines[i] === undefined || stat.errors.length > 0) this.lines[i] = stat;
		}
	}

	return script;
}

Cadence.Parser.prototype.pDEFINITION = function() {
	var definition = new Cadence.AST.Definition();
	
	/*if (this.token == "is") {
		definition.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.MISSINGENTITY));
		return definition;
	}

	//this.next();

	// Get the LHS pattern
	while (this.stream.valid() && this.token != "is") {
		if (this.token == "VARIABLE") {
			definition.addLHSVariable(this.data.value);
		} else if (this.token == "STRING") {
			definition.addLHSLiteral(this.data.value);
		} else if (this.token == "BOOLEAN") {
			definition.addLHSLiteral(this.data.value);
		} else if (this.token == "NUMBER") {
			definition.addLHSLiteral(this.data.value);
		} else if (this.token == "JAVASCRIPT") {
			definition.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.LHSJAVASCRIPT));
			return definition;
		} else {
			definition.addLHSLiteral(this.token);
		}
		this.next();
	}

	if (this.token != "is") {
		definition.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.MISSINGIS));
		return definition;
	}*/

	this.next();

	var path = this.pPATH();
	definition.addPath(path);
	if (definition.hasErrors()) return definition;
	
	if (this.token == "when") {
		this.next();
		var condition = this.pPATH();
		definition.addCondition(condition);
	}

	return definition;
}

/*Cadence.Parser.prototype.pPATH = function() {
	var path = new Cadence.AST.Path();
	while (this.token != "EOF") {
		var spath = this.pPATH2(-1);

		//if (spath.components.length > 0)
		path.components = path.components.concat(spath.components);

		console.log(this.token);

		//path.addComponent(spath);
		switch(this.token) {
		case ")":
		case ";":
		case "is":
		case "when": return path;
		}
	}
	return path;
}*/

Cadence.Parser.prototype.pPATH = function() {
	return this.pPATH2(1000000);
}

Cadence.Parser.prototype.pPATH2 = function(maxprec) {
	var path = new Cadence.AST.Path();
	var myprec = (this.token == "LABEL") ? Cadence.Parser.precedenceOf(this.data.value) : Cadence.Parser.precedenceOf(this.token);
	var eqcount = 0;

	if (myprec > maxprec) maxprec = myprec+1;
	//myprec = 0;

	while (this.token != "EOF") {
		var prec = (this.token == "LABEL") ? Cadence.Parser.precedenceOf(this.data.value) : Cadence.Parser.precedenceOf(this.token);
		var npath;

		if (prec >= maxprec) {
			//console.log("MAXPREC ON " + this.token);
			return path;
		}

		if (prec > myprec) {
			//console.log("MORE PREC ON " + this.token + ":" + prec + ","+myprec);
			//myprec = prec;
			npath = new Cadence.AST.Path();
			if (path.components.length > 1) {
				npath.addComponent(path);
			} else {
				npath.addComponent(path.components[0]);
			}
			path = npath;
		}
		/* else {
			eqcount++;
		}*/
		//lastprec = prec;

		switch(this.token) {
		case "VARIABLE"		:	path.addComponent({type: "variable", label: this.data.value});
								this.next();
								break;
		case "JAVASCRIPT"	:	path.addComponent({type: "javascript", script: this.data.value});
								this.next();
								break;
		case "NUMBER"		:
		case "BOOLEAN"		:
		case "LABEL"		:
		case "STRING"		:	path.addComponent(this.data.value);
								this.next();
								break;
		case "is"			:	//path.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.ISINPATH));
							 	return path;
		//case "="			:
		case "+="			:
		case "-="			:
		case "/="			:
		case "*="			:	path.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.ASSIGNINPATH));
								return path;
		case "when"			:	return path;
		case "["			:	this.next();
								var list = this.pPATH();
								list.type = "list";
								path.addComponent(list);
								if (this.token != "]") {
									path.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.CLOSEPATH));
									return path;
								}
								this.next();
								break;
		case "("			:	this.next();
								path.addComponent(this.pPATH());
								if (this.token != ")") {
									path.error(new Cadence.SyntaxError(this, Cadence.SyntaxError.CLOSEPATH));
									return path;
								}
								this.next();
								break;
		case "]"			:
		case ")"			:	return path;
		case ";"			:	return path;
		default				:	path.addComponent(this.token);
								this.next();
		}

		if (prec > myprec) {
			//myprec = prec;
			var npath2 = this.pPATH2(prec);
			if (npath2.components.length > 1) {
				path.addComponent(npath2)
			} else {
				path.addComponent(npath2.components[0]);
			}
		}

		//myprec = prec;
	}

	return path;
}


