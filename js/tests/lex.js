var root;
var eden;

function cadenceModule(description) {
	QUnit.module(description, {
		setup: function () {
			
		}
	});
}


cadenceModule("Lexer");

test("Get/Peek characters", function () {
	var stream = new Cadence.Stream("@");
	equal(stream.peek(), 64);
	equal(stream.valid(), true);
	equal(stream.get(), 64);
	equal(stream.valid(), false);
});

test("Skip Whitespace", function() {
	var stream = new Cadence.Stream(" \t\n\n  @");
	stream.skipWhiteSpace();
	equal(stream.get(), 64);
});

test("Parse AlphaNumeric", function() {
	var stream = new Cadence.Stream("5abc");
	var data = new Cadence.SyntaxData();
	equal(stream.parseAlphaNumeric(data), false);
	stream = new Cadence.Stream("abc5(");
	equal(stream.parseAlphaNumeric(data), true);
	equal(data.value, "abc5");
});

test("Parse Number", function() {
	var stream = new Cadence.Stream("abc");
	var data = new Cadence.SyntaxData();
	equal(stream.parseNumber(data), false);
	stream = new Cadence.Stream("567");
	equal(stream.parseNumber(data), true);
	equal(data.value, 567);
	stream = new Cadence.Stream("567.9");
	equal(stream.parseNumber(data), true);
	equal(data.value, 567.9);
	stream = new Cadence.Stream("567.a");
	equal(stream.parseNumber(data), true);
	equal(data.value, 567);
});

test("Read Tokens", function() {
	var stream = new Cadence.Stream("5 6");
	equal(stream.readToken(), "NUMBER");
	equal(stream.data.value, 5);
	equal(stream.readToken(), "NUMBER");
	equal(stream.data.value, 6);
	
	stream = new Cadence.Stream("+=55");
	equal(stream.readToken(), "+=");

	stream = new Cadence.Stream("&&&");
	equal(stream.readToken(), "&&");
	equal(stream.readToken(), "&");

	stream = new Cadence.Stream("abc");
	equal(stream.readToken(), "STRING");
	equal(stream.data.value, "abc");

	stream = new Cadence.Stream("when");
	equal(stream.readToken(), "when");

	stream = new Cadence.Stream("true");
	equal(stream.readToken(), "BOOLEAN");

	stream = new Cadence.Stream("Abc");
	equal(stream.readToken(), "VARIABLE");
	equal(stream.data.value, "Abc");
});


