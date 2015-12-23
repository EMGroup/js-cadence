
function cadenceModule(description) {
	QUnit.module(description, {
		setup: function () {
			Cadence.AST = {
				errors: [],
				error: function(errobject) {
					this.errors.push(errobject);
				},
				hasErrors: function() {
					return this.errors.length > 0;
				}
			};

			Cadence.AST.Definition = function() {
				this.type = "definition";
				this.errors = [];
				this.lhs = [];
				this.path = undefined;
				this.cond = undefined;
			}
			Cadence.AST.Definition.prototype.error = Cadence.AST.error;
			Cadence.AST.Definition.prototype.hasErrors = Cadence.AST.hasErrors;
			Cadence.AST.Definition.prototype.addLHSVariable = function(ent) {
				this.lhs.push({type: "variable", label: ent});
			}
			Cadence.AST.Definition.prototype.addLHSLiteral = function(ent) {
				this.lhs.push(ent);
			}
			Cadence.AST.Definition.prototype.addPath = function(path) {
				this.path = path;
			}
			Cadence.AST.Definition.prototype.addCondition = function(cond) {
				this.cond = cond;
			}

			Cadence.AST.Path = function() {
				this.type = "path";
				this.comp = [];
				this.errors = [];
			}
			Cadence.AST.Path.prototype.addComponent = function(ent) {
				this.comp.push(ent);
			}
			Cadence.AST.Path.prototype.error = Cadence.AST.error;
			Cadence.AST.Path.prototype.hasErrors = Cadence.AST.hasErrors;
		}
	});
}


cadenceModule("Parser");

test("Path Rule - Simple", function() {
	var parser = new Cadence.Parser("a b c");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.type, "path");
	equal(ast.comp[0], "a");
	equal(ast.comp[1], "b");
	equal(ast.comp[2], "c");

	parser = new Cadence.Parser("a 5 c");
	parser.next();
	ast = parser.pPATH();
	equal(ast.type, "path");
	equal(ast.comp[0], "a");
	equal(ast.comp[1], 5);
	equal(ast.comp[2], "c");
});

test("Path Rule - Nested", function() {
	var parser = new Cadence.Parser("a (b c) d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.comp.length, 3);
	equal(ast.comp[1].type, "path");
	equal(ast.comp[1].comp[0], "b");
	equal(ast.comp[1].comp[1], "c");
	equal(ast.comp[2], "d");
});

test("Path Rule - Variables", function() {
	var parser = new Cadence.Parser("a A d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.comp.length, 3);
	equal(ast.comp[1].type, "variable");
	equal(ast.comp[1].label, "A");
	equal(ast.comp[2], "d");
});

test("Path Rule - Error IS", function() {
	var parser = new Cadence.Parser("a is d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.errors.length, 1);
	equal(ast.errors[0].errno, Cadence.SyntaxError.ISINPATH);
});

test("Path Rule - Error Assign", function() {
	var parser = new Cadence.Parser("a = d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.errors.length, 1);
	equal(ast.errors[0].errno, Cadence.SyntaxError.ASSIGNINPATH);

	parser = new Cadence.Parser("a += d");
	parser.next();
	ast = parser.pPATH();
	equal(ast.errors.length, 1);
	equal(ast.errors[0].errno, Cadence.SyntaxError.ASSIGNINPATH);
});

test("Path Rule - Termination", function() {
	var parser = new Cadence.Parser("a b; c d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.comp.length, 2);
	equal(ast.comp[1], "b");

	// Remove semicolon
	parser.next();

	ast = parser.pPATH();
	equal(ast.comp.length, 2);
	equal(ast.comp[1], "d");

	parser = new Cadence.Parser("a b when c d");
	parser.next();
	ast = parser.pPATH();
	equal(ast.comp.length, 2);
	equal(ast.comp[1], "b");
});

test("Path Rule - Operators", function() {
	var parser = new Cadence.Parser("a + d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.comp.length, 3);
	equal(ast.comp[1], "+");
});

test("Path Rule - JavaScript", function() {
	var parser = new Cadence.Parser("a ${{ some }}$ d");
	parser.next();
	var ast = parser.pPATH();
	equal(ast.comp.length, 3);
	equal(ast.comp[1].type, "javascript");
	equal(ast.comp[1].script," some ");
	equal(ast.comp[2], "d");
});

test("Definition Rule", function () {
	var parser = new Cadence.Parser("a A is b");
	parser.next();
	var ast = parser.pDEFINITION();
	equal(ast.type, "definition");
	equal(ast.lhs[0], "a");
	equal(ast.lhs[1].label, "A");
	equal(ast.lhs[1].type, "variable");
	equal(ast.path.comp[0], "b");
});

