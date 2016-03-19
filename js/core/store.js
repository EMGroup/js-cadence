Cadence.Storage = {
	queue: [],

	loadURL: function(url) {
		function doAjax(url) {
			$.ajax({
				url: url,
				type: "get",
				success: function(data){
					var ast = new Cadence.Parser(data);
					ast.parse();
					var oldqueue = Cadence.Storage.queue;
					Cadence.Storage.queue = [];
					eval(ast.generate()).call(undefined);
					Cadence.Storage.queue = Cadence.Storage.queue.concat(oldqueue);

					if (Cadence.Storage.queue.length > 0) {
						doAjax(Cadence.Storage.queue.shift());
					}
				},
				error: function(a){
					console.error(a);
				}
			});
		}

		if (Cadence.Storage.queue.length == 0) {
			doAjax(url);
		} else {
			Cadence.Storage.queue.push(url);
		}
	}
}
