
Cadence.Entry = function(parent, name) {
	this.parent = parent;
	this.name = name;
	this.children = {};
	this.parts = [];
}

Cadence.tree = {};


Cadence.search = function(path) { //, base, index) {
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
			if (node.parts[j].condition === undefined || node.parts[j].condition.apply(undefined, variables)) {
				result = node.parts[j].definition.apply(undefined, variables);
				//console.log("MATCH FOUND: ");
				//console.log(node.parts[j]);

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

		if (node.name === undefined) {
			variables.pop();
			i--;
			node = node.parent;
		} else {
			if (i == 1) {
				variables.unshift(node.name);
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

Cadence.eval = function(str) {
	var ast = new Cadence.Parser(str);
	ast.parse();
	return eval(ast.generate());
}


