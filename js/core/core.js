
Cadence.Entry = function(parent, name) {
	this.parent = parent;
	this.name = name;
	this.children = {};
	this.parts = [];
}

Cadence.tree = {};


Cadence.search = function(path, base, index) {
	var current = this.tree;
	var node;
	var i;
	var variables = [];

	// Apply base first
	if (base !== undefined) {
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
	}

	for (i=(index)?index:0; i<path.length; i++) {
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

	while(node) {
		var result;
		for (var j=0; j<node.parts.length; j++) {
			if (node.parts[j].condition === undefined || node.parts[j].condition.apply(undefined, variables)) {
				result = node.parts[j].definition.apply(undefined, variables);

				// Is there more path to go?
				if (i < path.length) {
					return Cadence.search(path, result, i);
				} else {
					return result;
				}
			}
		}

		if (node.name === undefined) variables.pop();
		i--;
		node = node.parent;
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

	current.parts.push({definition: def, condition: cond});
}


