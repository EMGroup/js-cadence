
Cadence.Entry = function(parent, name) {
	this.id = Cadence.Entry.id++;
	this.parent = parent;
	this.name = name;
	this.children = {};
	this.parts = [];
	this.dependants = {};
	//this.dependencies = [];
	this.pattern = false;
	this.cache = undefined;
	this.newcache = undefined;
}
Cadence.Entry.id = 0;

Cadence.Part = function(def, cond, time, dynamic) {
	this.definition = def;
	this.condition = cond;
	this.timestamp = time;
	this.dynamic = dynamic;
	//this.dependants = [];
	//this.cache = undefined;
	//this.newcache = undefined;
	//this.out_of_date = true;
}

Cadence.Part.prototype.evaluate = function(owner, variables) {
	var result = this.definition.apply(owner, variables);
	if (owner) owner.newcache = result;
	return result;
}

Cadence.Entry.prototype.swap = function() {
	if (this.cache !== this.newcache || this.pattern) {
		this.cache = this.newcache;
		var olddeps = this.dependants;
		this.dependants = {};
		//this.dependencies = [];
		for (var i in olddeps) {
			Cadence.todoExpire(olddeps[i]);
		}
	}
}

Cadence.Entry.prototype.addDependency = function(node) {
	if (node) this.dependants[node.id] = node;
	//if (node && this.dependants.indexOf(node) == -1) {
	//	this.dependants.push(node);
		//node.dependencies.push(this);
	//}
	// TODO MAKE UNIQUE
	//if (this.parent) this.parent.addDependency(node);
}

Cadence.Entry.prototype.expire = function() {
	var changed = false;
	if (!this.pattern) {
		for (var i=0; i<this.parts.length; i++) {
			var cond = (this.parts[i].condition) ? this.parts[i].condition.apply(this, []) : false;
			if (this.parts[i].condition === undefined || (cond && cond != "false")) {
				this.parts[i].evaluate(this, [])
				Cadence.todoSwap(this);
				changed = true;
				break;
			}
		}
	} else {
		Cadence.todoSwap(this);
	}
}

Cadence.expirequeue = [];
Cadence.swapqueue = [];
Cadence.cyclerate = 0;
Cadence.timeout = undefined;
Cadence.pause = false;

Cadence.processQueues = function() {
	Cadence.timeout = undefined;

	for (var i=0; i<Cadence.swapqueue.length; i++) {
		Cadence.swapqueue[i].swap();
	}
	Cadence.swapqueue = [];

	var oldq = Cadence.expirequeue;
	Cadence.expirequeue = [];
	for (var i=0; i<oldq.length; i++) {
		oldq[i].expire();
	}
}

Cadence.todoExpire = function(element) {
	if (Cadence.expirequeue.indexOf(element) == -1) {
		Cadence.expirequeue.push(element);
	}

	if (Cadence.timeout === undefined && !Cadence.pause) {
		Cadence.timeout = setTimeout(Cadence.processQueues, (Cadence.cyclerate < 10000) ? Cadence.cyclerate : 10000);
	}
}

Cadence.todoSwap = function(element) {
	Cadence.swapqueue.push(element);

	if (Cadence.timeout === undefined && !Cadence.pause) {
		Cadence.timeout = setTimeout(Cadence.processQueues, (Cadence.cyclerate < 10000) ? Cadence.cyclerate : 10000);
	}
}

Cadence.CacheEntry = function(node, variables) {
	this.id = Cadence.Entry.id++;
	this.cache = undefined;
	this.dependants = {};
	//this.dependencies = [];
	//this.expired = true;
	this.node = node;
	this.newcache = undefined;
	this.variables = variables;
}

Cadence.CacheEntry.prototype.swap = function() {
	if (this.newcache !== this.cache) {
		//console.log(this.cache);
		this.cache = this.newcache;
		var olddeps = this.dependants;
		this.dependants = {};
		//this.dependencies = [];
		for (var i in olddeps) {
			//olddeps[i].expire();
			Cadence.todoExpire(olddeps[i]);
		}
	}
}

Cadence.CacheEntry.prototype.expire = function() {
	//console.trace("Cache expire: " + JSON.stringify(this.variables));
	//console.log(this);
	for (var j=0; j<this.node.parts.length; j++) {
		var cond = (this.node.parts[j].condition) ? this.node.parts[j].condition.apply(this.node, this.variables) : false;
		if (this.node.parts[j].condition === undefined || (cond && cond != "false")) {
			this.node.parts[j].evaluate(this, this.variables);
			//console.log("New cache for " + this.node.name + " = "+this.newcache);
			this.node.addDependency(this);
			Cadence.todoSwap(this);
			return;
		}
	}
}

Cadence.CacheEntry.prototype.addDependency = function(node) {
	if (node) this.dependants[node.id] = node;
	//if (node && this.dependants.indexOf(node) == -1) {
	//	this.dependants.push(node);
		//node.dependencies.push(this);
	//}
	// TODO MAKE UNIQUE
	//if (this.parent) this.parent.addDependency(node);
}

Cadence.tree = {};
Cadence.cache = {};

Cadence.pathToString = function(path) {
	var end = path.length;
	//return undefined;
	var res = "";
	for (var i=0; i<end; i++) {
		var type = typeof path[i];
		if (type == "object") {
			if (Array.isArray(path[i])) {
				res += "["+Cadence.pathToString(path[i], path[i].length) + "]";
			} else if (path[i] instanceof Element) {
				res += "\""+path[i].id+"\"";
			} else {
				return undefined;
			}
		} else {
			res += "\""+path[i]+"\"";
		}
	}
	return res;
}

Cadence._unflattenSearch = function(path, origin) {
	// No match in unflattened form. So flatten first nested element
	for (var i=0; i<path.length; i++) {
		if (path[i] instanceof Array) {
			var s = Cadence.search(path[i], origin);
			if (s === undefined) {
				//console.log("Flatten: " + JSON.stringify(path));
				path = path.slice(0,i).concat(path[i]).concat(path.slice(i+1));
				//console.log("Flattened: " + JSON.stringify(path));
			} else {
				path[i] = s;
			}
			//console.log("Flattened: " + JSON.stringify(s));
			return Cadence.search(path, origin);
		}
	}
}

Cadence._interpretNode = function(node, part, origin, variables) {
	var result;
	if (node.pattern) {
		if (!part.dynamic) {
			var pathstr = Cadence.pathToString(variables);
			if (pathstr) {
				pathstr = "N"+node.id+pathstr;

				var cache = Cadence.cache[pathstr];
				if (!Cadence.cache.hasOwnProperty(pathstr)) {
					cache = new Cadence.CacheEntry(node, variables);
					Cadence.cache[pathstr] = cache;
					result = part.evaluate(cache, variables);
					//if (result == false) console.log(node.parts[j]);
					cache.swap();
				} else {
					result = cache.cache;
				}
				node.addDependency(cache);
				cache.addDependency(origin);
			} else {
				result = part.evaluate(origin, variables);
			}
		} else {
			result = part.evaluate(origin, variables);
		}
		//console.log("CACHE: " + path.slice(0,i+1).join(" ") + " = " + result);
	} else {
		result = node.cache;
	}

	node.addDependency(origin);

	return result;
}

Cadence.search = function(path, origin) { //, base, index) {
	//var current = this.tree;
	var node;
	var i = 0;
	var variables = [];

	if (!(origin && (origin instanceof Cadence.Entry || origin instanceof Cadence.CacheEntry))) origin = undefined;

	function depth(current) {
		// Follow rest of the path from the base
		for (; i<path.length; i++) {
			var newcur = current[path[i]];
			if (newcur === undefined) {
				newcur = current["__VARIABLE__"];
				if (newcur === undefined) {
					break;
				}

				variables.push(path[i]);
			}
			current = newcur.children;
			node = newcur;
		}
	}

	depth(this.tree);

	//console.log("Variables: " + JSON.stringify(variables));

	// Check all the parts and roll back if not matched
	while(node) {
		var result;

		for (var j=0; j<node.parts.length; j++) {
			var cond = (node.parts[j].condition) ? node.parts[j].condition.apply(origin, variables) : false;
			if (node.parts[j].condition === undefined || (cond && cond != "false")) {
				result = Cadence._interpretNode(node, node.parts[j], origin, variables);

				// Is there more path to go?
				if (path.length > 1 && i < path.length) {
					var npath = Array.prototype.concat.apply([result],path.slice(i));
					//console.log(npath);
					return Cadence.search(npath, origin);
				} else {
					return result;
				}
			}
		}

		if (node.name === "__VARIABLE__") {
			variables.pop();
			i--;
			node = node.parent;
		} else {
			if (i == 1) {
				variables.unshift(node.name);
				node = undefined;
				depth(this.tree["__VARIABLE__"].children);
			} else {
				if (node.parent && node.parent.children["__VARIABLE__"]) {
					variables.unshift(node.name);
					depth(node.parent.children["__VARIABLE__"].children);
				} else {
					node = node.parent;
					i--;
				}
			}
		}
	}

	return Cadence._unflattenSearch(path, origin);

	// Should JS-Cadence now attempt to roll up the pattern and try again?
}
				
Cadence.define = function(path, def, cond, dynamic) {
	var current = this.tree;
	var parent = undefined;
	var pattern = false;

	for (var i=0; i<path.length; i++) {
		if (path[i] === "__VARIABLE__") pattern = true;
		if (current[path[i]] === undefined) {
			current[path[i]] = new Cadence.Entry(parent, path[i]);
			current[path[i]].pattern = pattern;
		}

		if (i < path.length-1) {
			parent = current[path[i]];
			current = current[path[i]].children;
		} else {
			current = current[path[i]];
		}
	}

	current.pattern = pattern;
	if (cond === undefined) {
		current.parts = [new Cadence.Part(def, cond, Date.now(), dynamic)];
	} else {
		current.parts.unshift(new Cadence.Part(def, cond, Date.now(), dynamic));
	}
	current.expire();
	//current.cache = current.newcache;
}

Cadence.eval = function(str) {
	var result;
	var ast = new Cadence.Parser(str);
	ast.parse();
	var source = ast.generate();
	//console.log(str);
	eval(source).call(undefined);
	return result;
}

Cadence.log = function(result) {
	if (Cadence.onoutput) Cadence.onoutput(result);
}


