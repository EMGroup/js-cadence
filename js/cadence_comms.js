cadence.comms = {};
cadence.comms.cmd = "";
cadence.comms.myid = 0;
cadence.comms.service = "js-cadence/service.bin";

cadence.comms.onresult = function() {
	cadence.comms.xmlresult = this.responseXML;
	cadence.comms.processresult(this.responseXML);
	setTimeout("cadence.comms.post()", 1000);
}

cadence.comms.ajax = new cadence.XMLHTTP(cadence.comms.onresult);

cadence.comms.onerror = null;
cadence.comms.onupdate = null;

cadence.comms.post = function() {
	var data;
	if (this.myid != 0) {
		data =  "<cadence id=\"" + this.myid + "\">" + this.cmd + "</cadence>";
	} else {
		data =  "<cadence>" + this.cmd + "</cadence>";
	}
	this.ajax.sendRequest(this.service, data);
	this.cmd = "";
}

cadence.comms.prepost = function(cmd) {
	this.cmd = this.cmd + cmd + "\n";
}

cadence.comms.remote_set = function(node,edge,value) {
	this.prepost("<set node=\""+ node +"\"" + " edge=\""+ edge +"\">"+ value +"</set>");
}

cadence.comms.remote_get = function(node,edge) {
	this.prepost("<get node=\""+ node +"\"" + " edge=\""+ edge +"\"/>");
}

cadence.comms.remote_keys = function(node) {
	this.prepost("<keys node=\"" + node + "\"/>");
}

cadence.comms.processresult = function(xml) {
	var current = xml.documentElement;
	if (current.tagName != "cadence") {
		cadence.error("Received an invalid XML response from server");
		return;
	}
	
	for (current = current.firstChild; current != null; current = current.nextSibling) {
		if (current.tagName == "error") {
			this.onerror(current.textContent);
		} else if (current.tagName == "id") {
			this.myid = parseInt(current.textContent);
		} else if (current.tagName == "update") {
			var node;
			var edge;
			var i = 0;
			for (i=0; i<current.attributes.length; i++) {
				if (current.attributes[i].name == "node") {
					node = current.attributes[i].value;
				} else if (current.attributes[i].name == "edge") {
					edge = current.attributes[i].value;
				}
			}
			
			//cadence.lookup(node,edge).update(current.textContent);
			this.onupdate(node,edge,current.textContent);
		} else if (current.tagName == "keys") {
			var node;
			var i = 0;
			for (i=0; i<current.attributes.length; i++) {
				if (current.attributes[i].name == "node") {
					node = current.attributes[i].value;
				}
			}

			
		}
	}
}
