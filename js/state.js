Cadence.parsePath = function(path) {
	var ast = new Cadence.Parser("["+path+"];");
	ast.parse();
	return eval(ast.script.definitions[0].components[0].generate());
}

Cadence.findConcreteNode = function(path) {
	var node;
	var i = 0;
	function depth(current) {
		// Follow rest of the path from the base
		for (; i<path.length; i++) {
			var newcur = current[path[i]];
			if (newcur === undefined) {
				//newcur = current["undefined"];
				//if (newcur === undefined) {
					break;
				//}

				//variables.push(path[i]);
			}
			current = newcur.children;
			node = newcur;
		}
	}

	depth(this.tree);
	return node;
}

Cadence.concretePaths = function(path) {
	var res = [];

	var node = Cadence.tree;
	if (path) {
		if (typeof path == "string") path = Cadence.parsePath(path);
		node = Cadence.findConcreteNode(path);
		if (node === undefined) {
			return res;
		}
		node = node.children;
	}

	function deepPath(base, node) {
		for (var a in node) {
			if (a != "__VARIABLE__" && node.hasOwnProperty(a)) {
				var merge = base.concat([a]);
				if (node[a].parts.length > 0) {
					res.push(merge);
				}
				deepPath(merge, node[a].children);
			}
		}
	}
	deepPath([], node);
	return res;
}

Cadence.prettyPath = function(path) {
	var res = "";
	for (var i=0; i<path.length; i++) {
		var type = typeof path[i];
		if (type == "object") {
			if (Array.isArray(path[i])) {
				res += "["+Cadence.pathToString(path[i], path[i].length) + "]";
			} else {
				return undefined;
			}
		}
		if (typeof path[i] == "string" && path[i].indexOf(" ") >= 0) {
			res += "\""+path[i]+"\"";
		} else {
			res += path[i];
		}
		if (i < path.length-1) res += " ";
	}
	return res;
}

Cadence.concretePathStrings = function(path) {
	var paths = Cadence.concretePaths(path);
	for (var i=0; i<paths.length; i++) {
		paths[i] = Cadence.prettyPath(paths[i]);
	}
	return paths;
}
