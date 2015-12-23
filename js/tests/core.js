
function cadenceModule(description) {
	QUnit.module(description, {
		setup: function () {
			
		}
	});
}


cadenceModule("Core");

test("Simple Chain", function() {
	Cadence.define(["a","b","c","d"], function() { return 55; }, undefined);
	equal(Cadence.search(["a","b","c","d"]), 55);
	equal(Cadence.search(["a","b","c"]), undefined);
	equal(Cadence.search(["a","c","c","d"]), undefined);
});

test("Variable Chain", function() {
	Cadence.define(["b",undefined,"c","d"], function() { return 66; }, undefined);
	equal(Cadence.search(["b","b","c","d"]), 66);
	equal(Cadence.search(["b","c","c","d"]), 66);
});

test("Variable Chain Used", function() {
	Cadence.define(["c",undefined,"c","d"], function(A) { return A; }, undefined);
	equal(Cadence.search(["c","b","c","d"]), "b");
	equal(Cadence.search(["c","c","c","d"]), "c");
});

test("Multi-Variable Chain Used", function() {
	Cadence.define(["d",undefined,undefined,"d"], function(A,B) { return A+B; }, undefined);
	equal(Cadence.search(["d","b","c","d"]), "bc");
	equal(Cadence.search(["d","c","e","d"]), "ce");
});

test("Multi-Variable Partial Chains", function() {
	Cadence.define([undefined,"+", undefined], function(A,B) { return A+B; }, undefined);
	equal(Cadence.search([2,"+",3,"+",4,"+",5]), 14);
});

test("Conditional Define", function() {
	Cadence.define(["e", undefined], function(A) { return A; }, function(A) { return A < 100; });
	equal(Cadence.search(["e",44]), 44);
	equal(Cadence.search(["e",144]), undefined);
});

test("Multi-Conditional Define", function() {
	Cadence.define(["f", undefined], function(A) { return A; }, function(A) { return A < 100; });
	Cadence.define(["f", undefined], function(A) { return A*2; }, function(A) { return A >= 100; });
	equal(Cadence.search(["f",44]), 44);
	equal(Cadence.search(["f",102]), 204);
});

