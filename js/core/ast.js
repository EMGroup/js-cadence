Cadence.AST = {
	errors: [],
	error: function(errobject) {
		this.errors.push(errobject);
	},
	hasErrors: function() {
		return this.errors.length > 0;
	}
};

////////////////////////////////////////////////////////////////////////////////
//    Script
////////////////////////////////////////////////////////////////////////////////

Cadence.AST.Script = function() {
	this.type = "script";
	this.errors = [];
	this.definitions = [];
}

Cadence.AST.Script.prototype.error = Cadence.AST.error;
Cadence.AST.Script.prototype.hasErrors = Cadence.AST.hasErrors;

Cadence.AST.Script.prototype.addDefinition = function(def) {
	this.definitions.push(def);
	if (def && def.hasErrors()) {
		this.errors.push.apply(this.errors, def.errors);
	}
}

Cadence.AST.Script.prototype.addQuery = function(q) {
	this.definitions.push(q);
	if (q && q.hasErrors()) {
		this.errors.push.apply(this.errors, q.errors);
	}
}

Cadence.AST.Script.prototype.generate = function() {
	var res = "(function() { var origin;\n";
	for (var i=0; i<this.definitions.length; i++) {
		if (this.definitions[i].type == "path") res += "result = ";
		res += this.definitions[i].generate() + ";\n";
	}
	res += "});\n";
	return res;
}

////////////////////////////////////////////////////////////////////////////////
//    Definition
////////////////////////////////////////////////////////////////////////////////


Cadence.AST.Definition = function() {
	this.type = "definition";
	this.errors = [];
	this.variables = {};
	this.varcount = 0;
	this.lhs = [];
	this.path = undefined;
	this.condition = undefined;
}

Cadence.AST.Definition.prototype.error = Cadence.AST.error;
Cadence.AST.Definition.prototype.hasErrors = Cadence.AST.hasErrors;

Cadence.AST.Definition.prototype.addLHSPath = function(path) {
	for (var i=0; i<path.components.length; i++) {
		if (typeof path.components[i] == "object") {
			if (path.components[i].type == "variable") {
				this.addLHSVariable(path.components[i].label);
			} else if (path.components[i].type == "path") {
				this.addLHSPath(path.components[i]);
			}
		} else {
			this.addLHSLiteral(path.components[i]);
		}
	}
}

Cadence.AST.Definition.prototype.addLHSVariable = function(ent) {
	var id;
	if (this.variables[ent] !== undefined) id = this.variables[ent];
	else {
		this.variables[ent] = this.varcount;
		id = this.varcount;
		this.varcount++;
	}
	this.lhs.push({type: "variable", label: ent});
}

Cadence.AST.Definition.prototype.addLHSLiteral = function(ent) {
	this.lhs.push(ent);
}

Cadence.AST.Definition.prototype.addPath = function(path) {
	this.path = path;
	if (path && path.hasErrors()) {
		this.errors.push.apply(this.errors, path.errors);
	}
}

Cadence.AST.Definition.prototype.addCondition = function(cond) {
	this.condition = cond;
	if (cond && cond.hasErrors()) {
		this.errors.push.apply(this.errors, cond.errors);
	}
}

Cadence.AST.Definition.prototype.generate = function() {
	var lhs = "[";
	var params = "";
	for (var i=0; i<this.lhs.length; i++) {
		var type = typeof this.lhs[i];
		if (type == "object") {
			lhs += "\"__VARIABLE__\"";
			params += this.lhs[i].label+",";
		} else {
			if (type == "number" || type == "boolean") {
				lhs += this.lhs[i];
			} else {
				lhs += "\""+this.lhs[i]+"\"";
			}
		}
		if (i < this.lhs.length-1) {
			lhs += ", ";
		}
	}
	lhs += "]";

	if (params != "") params = params.slice(0,-1);

	var res = "\tCadence.define(\n\t\t" + lhs
				+ ",\n\t\tfunction("+params+") { var origin = this; return " + this.path.generate(this)
				+ "; },\n\t\t"+((this.condition) ? "function("+params+") { var origin = this; return "+ this.condition.generate(this) + "; }" : "undefined") + ","+ this.path.hasJavascript + "\n\t)";
	return res;
}

////////////////////////////////////////////////////////////////////////////////
//    Path
////////////////////////////////////////////////////////////////////////////////

Cadence.AST.Path = function() {
	this.type = "path";
	this.errors = [];
	this.components = [];
	this.hasJavascript = false;
}

Cadence.AST.Path.prototype.error = Cadence.AST.error;
Cadence.AST.Path.prototype.hasErrors = Cadence.AST.hasErrors;

Cadence.AST.Path.prototype.addComponent = function(comp) {
	this.components.push(comp);
	if (comp && (typeof comp == "object") && (comp instanceof Cadence.AST.Path)) {
		if (comp.hasErrors()) this.errors.push.apply(this.errors, comp.errors);
	}
}

Cadence.AST.Path.prototype.generate = function(ctx, nosingle) {
	if (this.components.length > 1) {
		var res;
		if (this.type == "path") res = "Cadence.search([";
		else res = "[";
		for (var i=0; i<this.components.length; i++) {
			var type = typeof this.components[i];
			if (type == "object") {
				if (this.components[i].type == "path") {
					res += this.components[i].generate(ctx, true);
				} else if (this.components[i].type == "list") {
					res += this.components[i].generate(ctx);
				} else if (this.components[i].type == "variable") {
					res += this.components[i].label;
				}
			} else {
				if (type == "number" || type == "boolean") {
					res += this.components[i];
				} else {
					res += "\""+this.components[i]+"\"";
				}
			}
			if (i < this.components.length-1) {
				res += ",";
			}
		}
		if (this.type == "path") res += "], origin)";
		else res += "]";
		return res;
	} else {
		var type = typeof this.components[0];
		var res;
		if (type == "object") {
			if (this.components[0].type == "path") {
				res = this.components[0].generate(ctx, true);
			} else if (this.components[0].type == "list") {
				res = this.components[0].generate(ctx);
			} else if (this.components[0].type == "javascript") {
				this.hasJavascript = true;
				res = this.components[0].script;
			} else {
				res = this.components[0].label;
			}
		} else if (type == "string") {
			res = "\"" + this.components[0] + "\"";
		} else {
			res = this.components[0];
		}

		if (this.type == "list") {
			if (res) {
				return "[" + res + "]";
			} else {
				return "[]";
			}
		} else {
			//if (nosingle) {
			//	return "Cadence.search(["+res+"])";
			//} else {
				return res;
			//}
		}
	}
}

