function Agent(name,func) {
	this.agentname = name;
	this.func = func;
	this.triggers = new Array();
}

Agent.prototype.addTrigger = function(node,edge) {
	this.triggers.push(new TokenPair(node,edge));
	var t = cadence.lookup(node,edge);
	if (t !== undefined) { t.agent(this.func); }
}

