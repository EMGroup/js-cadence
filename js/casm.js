const NEW = T.New;
const SET = T.Set;
const DEFINE = T.Define;

//Evaluate a list and convert the result into a JavaScript type
function __(input) {
	console.log(input);
	return T.parse(___(input));
}

//Evaluate a list by using as a path through the OD-net
function ___(input) {
	if (typeof input != "object") {
		return T.gen(input);
	} else {
		var oldbase;
		var base;

		if (input == NEW) {
			base = T.create();
		} else {
			base = ___(input[0]);
		}

		var i=0;
		for (i=1; i<input.length; i++) {
			if (input[i] == SET) {
				cadence.set(oldbase,___(input[i-1]),___(input[i+1]));
				i++;
				base = oldbase;
			} else if (input[i] == DEFINE) {
				cadence.define(oldbase,___(input[i-1]),input[i+1]);
				i++;
				base = oldbase;
			} else {
				oldbase = base;
				base = cadence.get(base,___(input[i]));
			}
		}
		return base;
	}
}

function _convertToTokens(input) {
	var i;
	for (i=0; i<input.length; i++) {
		if (typeof input[i] == "object") {
			_convertToTokens(input[i]);
		} else {
			input[i] = T.gen(input[i]);
		}
	}
}

function _convertsplit(oldsplit,newsplit,index) {
	var i;
	for (i=index; i<oldsplit.length; i++) {
		if (oldsplit[i] == "true") { newsplit.push(true); }
		else if (oldsplit[i] == "false") { newsplit.push(false); }
		else if (oldsplit[i] == "new") { newsplit.push(NEW); }
		else if (oldsplit[i] == "=") { newsplit.push(SET); }
		else if (oldsplit[i] == "is") { newsplit.push(DEFINE); }
		else if (oldsplit[i] == "") {}
		else if (oldsplit[i] == "\n") {}
		else if (oldsplit[i] == ")") { return i; }
		else if (oldsplit[i] == "}") { _convertToTokens(newsplit); return i; }
		else if ((oldsplit[i] == "(") || (oldsplit[i] == "{")) {
			var ns = new Array();
			newsplit.push(ns);
			i = _convertsplit(oldsplit,ns,i+1);
		} else {
			newsplit.push(oldsplit[i]);
		}
	}
	return i;
}

//Parse a string as a path through the OD-net
function _(input) {
	var mysplit = input.split(" ");
	var ns = new Array();
	_convertsplit(mysplit,ns,0);
	return __(ns);
}
