if (Cadence.UI === undefined) Cadence.UI = {};

Cadence.UI.Dialogs = {};

Cadence.UI.projects = undefined;

Cadence.UI.Dialogs.browseModels = function(element, callback) {
	var obscurer = $('<div class="cadence-obscurer noselect"></div>');
	var content = $('<div class="cadence-dialog cadence-dialog-browse noselect"><div class="cadence-dialog-title"><span class="cadence-project">&#xf07b;</span> Projects</div><div class="cadence-dialog-plisting"></div></div>');
	var plisting = content.find(".cadence-dialog-plisting");

	function updateContents() {
		for (var i=0; i<Cadence.UI.projects.length; i++) {
			console.log(entry);
			var ele = $('<div class="cadence-plisting-entry"></div>');
			var entry = Cadence.UI.projects[i];
			var html = '<img src="'+entry.image+'"></img><div class="cadence-plisting-title">'+entry.title+'</div>';
			if (entry.author) html += '<div class="cadence-plisting-subtitle">by '+entry.author+'</div>';			
			ele.html(html);

			(function(entry) {
			ele.click(function() {
				callback(entry.url, entry.title);
				element.removeChild(obscurer.get(0));
			});
			})(entry);

			plisting.append(ele);
		}
	}

	if (Cadence.UI.projects === undefined) {
		$.get("manifest.json", function(data) {
			Cadence.UI.projects = data;
			updateContents();
		});
		console.log("GET MANI");
	} else {
		updateContents();
	}

	obscurer.append(content);
	element.appendChild(obscurer.get(0));
}

