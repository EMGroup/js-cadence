if (Cadence.UI === undefined) Cadence.UI = {};

Cadence.UI.Dialogs = {};

Cadence.UI.Dialogs.browseModels = function(element, callback) {
	var obscurer = $('<div class="cadence-obscurer noselect"></div>');
	var content = $('<div class="cadence-dialog cadence-dialog-browse noselect"></div>');
	

	obscurer.append(content);
	element.appendChild(obscurer.get(0));
}

