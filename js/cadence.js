/*
JS-Cadence

The core code implementing the OD-net and dependency maintenance.
*/

function CadenceObject(node) {
	this.node = node;
	this.edges = {};
}

function Entry(node,edge) {
	this.node = node;
	this.edge = edge;
	this.cached_value = T.Null;
	this.dependants = new Array();
	this.agents = new Array();
	this.definition = undefined;
	this.outofdate = false;
}

Entry.prototype.dependency = function(ent) {
	this.dependants.push(ent);
}

Entry.prototype.agent = function(agent) {
	this.agents.push(agent);
}

Entry.prototype.trigger = function() {
	this.outofdate = true;
	this.trigger_dependants();
	this.trigger_agents();
}

Entry.prototype.trigger_agents = function() {
	var i;
	var me = this;
	for (i=0; i<this.agents.length; i++) {
		var myagent = this.agents[i];
		setTimeout(function(){myagent.call(me)},0);
	}
	this.agents = new Array();
}

Entry.prototype.trigger_dependants = function() {
	var i;
	for (i=0; i<this.dependants.length; i++) {
		this.dependants[i].trigger();
	}
	this.dependants = new Array();
}

Entry.prototype.getvalue = function() {
	if (this.outofdate == true) {
		this.cached_value = this.evaluate(this.definition);
	}

	return this.cached_value;
}

Entry.prototype.evaluate = function(def) {
	//Loop over all elements and apply together
	var base = def[0];
	var i=0;
	for (i=1; i<def.length; i++) {
		if (typeof def[i] == "string") {
			base = cadence.lookup(base,def[i]);
			base.dependency(this);
			base = base.getvalue();
		} else {
			//A sub list within the definition
			base = cadence.lookup(base,this.evaluate(def[i]));
			base.dependency(this);
			base = base.getvalue();
		}
	}
	return base;
}

Entry.prototype.setvalue = function(value) {
	this.cached_value = value;
	if (this.definition !== undefined) {
		this.definition = undefined;
		this.outofdate = false;
	}
	this.trigger_dependants();
	this.trigger_agents();
}

Entry.prototype.define = function(def) {
	this.definition = def;
	this.trigger();
}

function Cadence() {
	this.nodes = {};
	this._agents = {};
}

Cadence.prototype.lookup = function(node,edge) {
	var t = this.nodes[node]
	if (t === undefined) { return undefined; }
	t = t.edges[edge];
	return t;
}

Cadence.prototype.get = function(node,edge) {
	var entry = this.lookup(node,edge);
	if (entry !== undefined) {
		return entry.getvalue();
	} else {
		return T.Null;
	}
}

Cadence.prototype.set = function(node,edge,value) {
	var entry = this.lookup(node,edge);
	if (entry === undefined) {
		entry = new Entry(node,edge);
		if (this.nodes[node] === undefined) {
			this.nodes[node] = new CadenceObject(node);
		}
		this.nodes[node].edges[edge] = entry;
	}
	entry.setvalue(value);
}

Cadence.prototype.define = function(node,edge,def) {
	var entry = this.lookup(node,edge);
	if (entry === undefined) {
		entry = new Entry(node,edge);
		if (this.nodes[node] === undefined) {
			this.nodes[node] = new CadenceObject(node);
		}
		this.nodes[node].edges[edge] = entry;
	}
	entry.define(def);
}

Cadence.prototype.registerAgent = function(name, func) {
	this._agents[name] = new Agent(name,func);
}

Cadence.prototype.agent = function(name) {
	return this._agents[name];
}

//Parse a collection of individual casm strings.
Cadence.prototype.eval = function(input) {
	var statements = input.replace(/\n/g, "").split(";");
	var i;
	var result;
	for (i=0; i<statements.length; i++) {
		result = _(statements[i]);
	}
	return result;
}

cadence = new Cadence();

