cadence.objects = {};

/* Lookup an object based upon its OID string. */
cadence.lookup = function(node) {
	var obj = this.objects[node];
	if (obj === undefined) {
		obj = new CadenceObject(node);
		this.objects[node] = obj;
	}
	return obj;
}

function CadenceObject(name) {
	this.__controller__ = new ObjectController(name, this);
}

CadenceObject.prototype.watch = function(edge, name, f) {
	if (edge === null) {
		this.__controller__.watch(name,f);
	} else {
		this.__controller__.edge(edge).watch(name,f);
	}
}

CadenceObject.prototype.new = function(name,value) {
	this.__controller__.edge(name).assign(value);
}

function ObjectController(name, cobj) {
	this.name = name;
	this.cobj = cobj;
	this.edges = {};
	this.observers = {};
	this.up_to_date = false;

	//Get a list of keys.
	cadence.comms.remote_keys(name);
}

ObjectController.prototype.edge = function(edge) {
	var e = this.edges[edge];
	if (e === undefined) {
		e = new CadenceEdge(this, edge);
		this.edges[edge] = e;
	}
	return e;
}

ObjectController.prototype.update = function(edge, value) {
	var converted;

	if (value.charAt(0) == '#') {
		converted = cadence.lookup(value);
	} else if (value.charAt(0) > '0' && value.charAt(0) < '9') {
		converted = parseInt(value);
	} else {
		converted = value;
	}

	this.edge(edge).cached = converted;
	this.edge(edge).up_to_date = true;
	this.edge(edge).trigger();
	this.trigger(edge);
}

ObjectController.prototype.update_keys = function(keys) {
	for (x in keys) {
		if (this.edges[x] === undefined) {
			var e = this.edge(x);
		}
	}
	this.trigger(null);
}

ObjectController.prototype.watch = function(name, f) {
	this.observers[name] = f;
}

ObjectController.prototype.trigger = function(edge) {
	for (x in this.observers) {
		this.observers[x].call(this.cobj,edge);
	}
}

cadence.update = function(node,edge,value) {
	cadence.lookup(node).__controller__.update(edge,value);
}

cadence.update_keys = function(node, keys) {
	cadence.lookup(node).__controller__.update_keys(keys);
}

function CadenceEdge(node,name) {
	this.node = node;
	this.name = name;
	this.up_to_date = false;
	this.observers = {};
	this.cached = "unknown";
	var me = this;
	var gfunc = function(){ return me.value(); };
	var sfunc = function(v){ me.assign(v); };

	node.cobj.__defineGetter__(name, gfunc);
	node.cobj.__defineSetter__(name, sfunc);

	//cadence.comms.remote_get(node.name,name);
}

CadenceEdge.prototype.trigger = function() {
	for (x in this.observers) {
		this.observers[x].call(this);
	}
}

CadenceEdge.prototype.value = function() {
	if (this.up_to_date === false) {
		cadence.comms.remote_get(this.node.name,this.name);
	}
	return this.cached;
}

CadenceEdge.prototype.assign = function(value) {
	this.cached = value;
	this.up_to_date = true;
	cadence.comms.remote_set(this.node.name, this.name, value);
}

CadenceEdge.prototype.watch = function(name, f) {
	this.observers[name] = f;
}

cadence.comms.onupdate = cadence.update;
cadence.comms.onerror = cadence.error;
cadence.comms.onkeys = cadence.update_keys;
cadence.comms.post();

//========================================


/*cadence.lookup = function(node,edge) {
	var symname = node + ":" + edge;
	if (this.graph[symname] === undefined) {
		this.graph[symname] = new Symbol(this, node, edge);
	}
	
	return this.graph[symname];
}

cadence.get = function(n,e) {
	return this.lookup(n,e).get();
}

cadence.set = function(n,e,v) {
	return this.lookup(n,e).set(v);
}

cadence.watch = function(n,e,f) {
	this.lookup(n,e).watch(f);
}

function Symbol(context, node, edge) {
	this.context = context;
	this.node = node;
	this.edge = edge;
	this.cached = null;
	this.up_to_date = false;
	this.observers = {};
	
	cadence.comms.remote_get(node,edge);
}

Symbol.prototype.watch = function(name, f) {
	this.observers[name] = f;
}

Symbol.prototype.get = function() {
	return this.cached;
}

Symbol.prototype.set = function(val) {
	this.cached = val;
	cadence.comms.remote_set(this.node, this.edge, val);
	this.trigger();
}

Symbol.prototype.trigger = function() {
	for (x in this.observers) {
		this.observers[x].call(this, x);
	}
}

Symbol.prototype.update = function(val) {
	this.cached = val;
	this.up_to_date = true;
	this.trigger();
}
*/
