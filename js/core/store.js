Cadence.Storage = {
	loadURL: function(url) {
		$.ajax({
			url: url,
			type: "get",
			success: function(data){
				var ast = new Cadence.Parser(data);
				ast.parse();
				eval(ast.generate());
			},
			error: function(a){
				console.error(a);
			}
		});
	}
}
