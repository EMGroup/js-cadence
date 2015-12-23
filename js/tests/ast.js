
function cadenceModule(description) {
	QUnit.module(description, {
		setup: function () {
			
		}
	});
}


cadenceModule("AST");

test("AST Path - Generate", function() {
	var ast = new Cadence.AST.Path();
	ast.addComponent("a");
	ast.addComponent("b");
	
});

