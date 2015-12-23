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

Cadence.AST.Script.prototype.generate = function() {
	var res = "{\n";
	for (var i=0; i<this.definitions.length; i++) {
		res += this.definitions[i].generate() + ";\n";
	}
	res += "}\n";
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
		if (typeof this.lhs[i] == "object") {
			lhs += "undefined";
			params += this.lhs[i].label + ",";
		} else {
			lhs += "\""+this.lhs[i]+"\"";
		}
		if (i < this.lhs.length-1) {
			lhs += ", ";
		}
	}
	lhs += "]";

	if (params != "") params = params.slice(0,-1);

	var res = "\tCadence.define(\n\t\t" + lhs
				+ ",\n\t\tfunction("+params+") { return " + this.path.generate(this)
				+ "; },\n\t\t"+((this.condition) ? "function("+params+") { return "+ this.condition.generate(this) + "; }" : "undefined") + "\n\t)";
	return res;
}

////////////////////////////////////////////////////////////////////////////////
//    Path
////////////////////////////////////////////////////////////////////////////////

Cadence.AST.Path = function() {
	this.type = "path";
	this.errors = [];
	this.components = [];
}

Cadence.AST.Path.prototype.error = Cadence.AST.error;
Cadence.AST.Path.prototype.hasErrors = Cadence.AST.hasErrors;

Cadence.AST.Path.prototype.addComponent = function(comp) {
	this.components.push(comp);
	if (comp && (typeof comp == "object") && (comp instanceof Cadence.AST.Path)) {
		if (comp.hasErrors()) this.errors.push.apply(this.errors, comp.errors);
	}
}

Cadence.AST.Path.prototype.generate = function(ctx) {

	if (this.components.length > 1) {
		var res = "Cadence.search([";
		for (var i=0; i<this.components.length; i++) {
			if (typeof this.components[i] == "object") {
				if (this.components[i] instanceof Cadence.AST.Path) {
					res += this.components[i].generate(ctx);
				} else if (this.components[i].type == "variable") {
					res += this.components[i].label;
				}
			} else {
				res += "\""+this.components[i]+"\"";
			}
			if (i < this.components.length-1) {
				res += ",";
			}
		}
		res += "])";
		return res;
	} else {
		if (typeof this.components[0] == "object") {
			if (this.components[0].type == "javascript") {
				return this.components[0].script;
			} else {
				return this.components[0].label;
			}
		} else {
			return this.components[0];
		}
	}
}

