
Cadence.Entry = function(parent, name) {
	this.parent = parent;
	this.name = name;
	this.children = {};
	this.parts = [];
}

Cadence.tree = {};


Cadence.search = function(path) { //, base, index) {
	var current = this.tree;
	var node;
	var i;
	var variables = [];
	/*if (base) {
		base = base.concat(path);
	}*/

	// Apply base first
	/*if (base !== undefined) {
		var newcur = current[base];
		if (newcur === undefined) {
			newcur = current["undefined"];
			if (newcur === undefined) {
				return undefined;
			}

			variables.push(base);
		}
		current = newcur.children;
		node = newcur;
	}*/

	// Follow rest of the path from the base
	for (i=0; i<path.length; i++) {
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

	// Check all the parts and roll back if not matched
	while(node) {
		var result;
		for (var j=0; j<node.parts.length; j++) {
			if (node.parts[j].condition === undefined || node.parts[j].condition.apply(undefined, variables)) {
				result = node.parts[j].definition.apply(undefined, variables);

				// Is there more path to go?
				if (i < path.length && i > 0) {
					var npath = Array.prototype.concat.apply([result],path.slice(i));
					//console.log(npath);
					return Cadence.search(npath);
				} else {
					return result;
				}
			}
		}

		if (node.name === undefined) variables.pop();
		i--;
		node = node.parent;
	}

	// No match in unflattened form. So flatten first nested element
	//path = path.concat.apply([], path);
	for (var i=0; i<path.length; i++) {
		if (path[i] instanceof Array) {
			path = path.slice(0,i).concat(path[i]).concat(path.slice(i+1));
			return Cadence.search(path);
		}
	}
}
				
Cadence.define = function(path, def, cond) {
	var current = this.tree;
	var parent = undefined;

	for (var i=0; i<path.length; i++) {
		if (current[path[i]] === undefined) {
			current[path[i]] = new Cadence.Entry(parent, path[i]);
		}

		if (i < path.length-1) {
			parent = current[path[i]];
			current = current[path[i]].children;
		} else {
			current = current[path[i]];
		}
	}

	current.parts.unshift({definition: def, condition: cond, timestamp: Date.now()});
}


