/*
Generates and maps Cadence tokens to and from javascript types.

All elements in an OD-net are tokens which abstracts from any specific type system.
*/

var TOKEN_SPECIAL = 0;
var TOKEN_WORD = 1;
var TOKEN_NUMBER = 2;
var TOKEN_GENERIC = 100;

var T = {};
T._last = 0;

T.word = function(string) {
	return "t1-"+string;
}

T.number = function(num) {
	return "t2-"+num;
}

T.raw = function(a,b) {
	return "t"+a+"-"+b;
}

T.gen = function(a) {
	var type = typeof a;
	if (type == "string") {
		return this.word(a);
	} else if (type == "number") {
		return this.number(a);
	} else if (type == "boolean") {
		if (a == true) { return this.True; }
		else { return this.False; }
	} else {
		return this.Null;
	}
}

T.parse = function(a) {
	var type = a.substr(0,3);
	if (type == "t0-") {
		if (a == this.Null) {
			return undefined;
		} else if (a == this.True) {
			return true;
		} else if (a == this.False) {
			return false;
		}
	} else if (type == "t1-") {
		return a.substr(3,a.length);
	} else if (type == "t2-") {
		return parseFloat(a.substr(3,a.length));
	} else {
		return cadence.nodes[a];
	}
}

T.create = function() {
	return this.raw(TOKEN_GENERIC, this._last++);
}

T.Null = "t0-0";
T.True = "t0-1";
T.False = "t0-2";
T.Set = "t0-3";
T.New = "t0-4";
T.Define = "t0-5";

function TokenPair(a,b) {
	this.a = a;
	this.b = b;
}

