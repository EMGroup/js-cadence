
Cadence.Entry = function(parent, name) {
	this.parent = parent;
	this.name = name;
	this.children = {};
	this.parts = [];
	this.dependants = [];
	this.pattern = false;
}

Cadence.Part = function(def, cond, time) {
	this.definition = def;
	this.condition = cond;
	this.timestamp = time;
	//this.dependants = [];
	this.cache = undefined;
	//this.out_of_date = true;
}

Cadence.Part.prototype.evaluate = function(owner, variables) {
	var result = this.definition.apply(owner, variables);
	this.cache = result;
	return result;
}

Cadence.Entry.prototype.addDependency = function(node) {
	if (this.dependants.indexOf(node) == -1) {
		this.dependants.push(node);
	}
	// TODO MAKE UNIQUE
	//if (this.parent) this.parent.addDependency(node);
}

Cadence.Entry.prototype.expire = function() {
	var changed = false;
	if (!this.pattern) {
		for (var i=0; i<this.parts.length; i++) {
			var old = this.parts[i].cache;
			if (this.parts[i].evaluate(this, []) !== old) changed = true;
		}
	}
	if (changed || this.pattern) {
		var olddeps = this.dependants;
		this.dependants = [];
		for (var i=0; i<olddeps.length; i++) {
			olddeps[i].expire();
		}
	}
}

Cadence.CacheEntry = function() {
	this.value = undefined;
	this.dependants = [];
	this.expired = true;
}

Cadence.CacheEntry.prototype.update = function(value) {
	this.expired = false;
	this.value = value;
}

Cadence.CacheEntry.prototype.expire = function() {
	if (this.expired) return;
	this.expired = true;
	var olddeps = this.dependants;
	this.dependants = [];
	for (var i=0; i<olddeps.length; i++) {
		olddeps[i].expire();
	}
}

Cadence.CacheEntry.prototype.addDependency = function(node) {
	if (this.dependants.indexOf(node) == -1) {
		this.dependants.push(node);
	}
	// TODO MAKE UNIQUE
	//if (this.parent) this.parent.addDependency(node);
}

Cadence.tree = {};
Cadence.cache = {};

Cadence.pathToString = function(path, end) {
	var res = "";
	for (var i=0; i<end; i++) {
		var type = typeof path[i];
		if (type == "object") {
			if (Array.isArray(path[i])) {
				res += "["+Cadence.pathToString(path[i], path[i].length) + "]";
			} else {
				return undefined;
			}
		}
		res += "\""+path[i]+"\"";
	}
	return res;
}


Cadence.search = function(path, origin) { //, base, index) {
	//var current = this.tree;
	var node;
	var i = 0;
	var variables = [];

	function depth(current) {
		// Follow rest of the path from the base
		for (; i<path.length; i++) {
			var newcur = current[path[i]];
			if (newcur === undefined) {
				newcur = current["undefined"];
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
		//console.log(node);
		//console.log(i);
		var result;
		for (var j=0; j<node.parts.length; j++) {
			var cond = (node.parts[j].condition) ? node.parts[j].condition.apply(node, variables) : false;
			if (node.parts[j].condition === undefined || (cond && cond != "false")) {
				//console.log(path);
				if (variables.length > 0 || node.pattern) {
					var pathstr = Cadence.pathToString(path, i); //path.slice(0,i+1).join(" ");
					if (pathstr) {
						var cache = Cadence.cache[pathstr];
						if (Cadence.cache[pathstr] === undefined) {
							cache = new Cadence.CacheEntry();
							Cadence.cache[pathstr] = cache;
						}

						if (!(cache.expired)) {
							//console.log("USE CACHE: " + pathstr);
							result = cache.value;
						} else {
							result = node.parts[j].evaluate((node.pattern)?cache:node, variables);
							cache.update(result);
							node.addDependency(cache);
							cache.addDependency(origin);
						}
					} else {
						result = node.parts[j].evaluate((node.pattern)?origin:node, variables);
					}
					//console.log("CACHE: " + path.slice(0,i+1).join(" ") + " = " + result);
				} else {
					result = node.parts[j].cache;
				}

				//if (origin === undefined || !(origin instanceof Cadence.Entry)) console.log(node);
				//console.log(node.parts[j]);

				// TODO ADD DEPENDENCY HERE TO ALL PARENTS
				if (origin && (origin instanceof Cadence.Entry || origin instanceof Cadence.CacheEntry)) node.addDependency(origin);

				// Is there more path to go?
				if (i < path.length && i > 0) {
					var npath = Array.prototype.concat.apply([result],path.slice(i));
					//console.log(npath);
					return Cadence.search(npath, origin);
				} else {
					return result;
				}
			}
		}

		if (node.name === undefined) {
			variables.pop();
			i--;
			node = node.parent;
		} else {
			if (i == 1) {
				variables.unshift(node.name);
				node = undefined;
				depth(this.tree["undefined"].children);
			} else {
				if (node.parent && node.parent.children["undefined"]) {
					variables.unshift(node.name);
					depth(node.parent.children["undefined"].children);
				} else {
					node = node.parent;
					i--;
				}
			}
		}
	}

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
				
Cadence.define = function(path, def, cond, force) {
	var current = this.tree;
	var parent = undefined;
	var pattern = false;

	for (var i=0; i<path.length; i++) {
		if (path[i] === undefined) pattern = true;
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

	current.pattern = pattern || force;
	current.parts.unshift(new Cadence.Part(def, cond, Date.now()));
	current.expire();

	var pathstr = Cadence.pathToString(path,path.length);
	var cache = Cadence.cache[pathstr];
	if (cache) {
		cache.expire();
	}
}

Cadence.eval = function(str) {
	var result;
	var ast = new Cadence.Parser(str);
	ast.parse();
	eval(ast.generate());
	return result;
}


