const SVGNS = 'http://www.w3.org/2000/svg';

function CadenceGraph(base, element) {
	this.ele = document.getElementById(element);
	this.svgnode = document.createElementNS(SVGNS,'svg');
	this.svgnode.setAttribute("width","500px");
	this.svgnode.setAttribute("height","500px");
	this.width = 450;
	this.height = 450;
	this.base = base;
	this.startx = 250;
	this.starty = 250;
	this.ele.appendChild(this.svgnode);
	//this.draw();
	this.nodes = new Array();
	this.edges = new Array();

	var edgegroup = document.createElementNS(SVGNS,'g');
	edgegroup.setAttribute("transform","translate("+this.startx.toString()+","+this.starty.toString()+")");
	this.edgegroup = edgegroup;
	this.svgnode.appendChild(edgegroup);

	var basegroup = document.createElementNS(SVGNS,'g');
	basegroup.setAttribute("id","cgraphgroup");
	basegroup.setAttribute("transform","translate("+this.startx.toString()+","+this.starty.toString()+")");
	this.basegroup = basegroup;
	this.svgnode.appendChild(basegroup);

	this.addNode(T.gen(base),0);

	this.update();
}

CadenceGraph.prototype.addNode = function(node,offset, parent) {
	//Add to main list of nodes
	//Add edge to parent
	//Init to default state, position etc.


	//First check if node already exists
	var i;
	for (i=0; i<this.nodes.length; i++) {
		if (this.nodes[i].token == node) {
			//Add a new parent
			return this.nodes[i];
		}
	}

	var svgnode = document.createElementNS(SVGNS,'circle');

	if (parent !== undefined) {
		svgnode.x = parent.x+offset;
		svgnode.y = parent.y - 100;
		parent.edges.push(svgnode);
	} else {
		svgnode.x = offset;
		svgnode.y = 0;
	}
	svgnode.mass = CGRAPH_MASS;
	svgnode.vx = 0.0;
	svgnode.vy = 0.0;
	svgnode.edges = new Array();
	svgnode.pedges = new Array();
	svgnode.token = node;
	svgnode.expanded = false;
	svgnode.cgraph = this;
	svgnode.parent = parent;

	svgnode.setAttribute("cx", svgnode.x.toString());
	svgnode.setAttribute("cy", svgnode.y.toString());
	svgnode.setAttribute("r", (svgnode.mass * CGRAPH_MASS_SCALE).toString());
	svgnode.setAttribute("fill", "#a0bfea");
	svgnode.setAttribute("stroke-width","2");
	svgnode.setAttribute("stroke", "#144b96");
	svgnode.setAttribute("onclick", "nodeClick(evt)");

	this.nodes.push(svgnode);
	this.basegroup.appendChild(svgnode);

	return svgnode;
}

CadenceGraph.prototype.expandNode = function(node) {
	if (node.expanded == true) { return; }

	var cnode = cadence.nodes[node.token];
	if (cnode === undefined) { return; }
	if (cnode.edges === undefined) { return; }

	var x;
	var i=0;
	for (x in cnode.edges) {
		var nnode = this.addNode(cnode.edges[x].getvalue(),10*(i+1), node);

		var edge = document.createElementNS(SVGNS,'line');
		if (cnode.edges[x].definition === undefined) {
			edge.setAttribute("stroke","#144b96");
		} else {
			edge.setAttribute("stroke","red");
		}
		edge.setAttribute("stroke-width","1");
		edge.setAttribute("x1",node.x.toString());
		edge.setAttribute("y1",node.y.toString());
		edge.setAttribute("x2",nnode.x.toString());
		edge.setAttribute("y2",nnode.y.toString());
		edge.target = nnode;
		edge.src = node;

		this.edgegroup.appendChild(edge);
		this.edges.push(edge);

		i++;
	}

	node.expanded = true;
}

function calc_radius2(a,b) {
	var dx = a.x-b.x;
	var dy = a.y-b.y;
	return (dx*dx)+(dy*dy);
}

function calc_radius(a,b) {
	return Math.sqrt(calc_radius2(a,b));	
}

var CGRAPH_KE = 500.0; //Coulomb constant
var CGRAPH_K = -0.9; //Spring constant
var CGRAPH_EDGELENGTH = 100; //Default edge length desired
var CGRAPH_DAMPING = 0.98; //Viscosity
var CGRAPH_INTERVAL = 100; //ms interval between updates
var CGRAPH_TIMESTEP = (CGRAPH_INTERVAL / 1000);
var CGRAPH_KINETIC = 20; //minimum kinetic energy target.
var CGRAPH_MASS = 2;
var CGRAPH_MASS_SCALE = 4;
var CGRAPH_MASS_SELECTED = 5;

function f_a(x,k) {
	return (x*x) / k;
}

function f_r(x,k) {
	return (k*k) / x;
}

CadenceGraph.prototype.update = function() {

	var area = this.width*this.height;
	var k = Math.sqrt(area/this.nodes.length);
	//var totalke = 0;
	
	/*var i;
	for (i=0; i<this.nodes.length; i++) {
		var dispx = 0;
		var dispy = 0;
		var j;
		//Calculate repulsive forces
		for (j=0; j<this.nodes.length; j++) {
			if (this.nodes[i] == this.nodes[j]) { continue; }

			var dx = this.nodes[i].x - this.nodes[j].x;
			var dy = this.nodes[i].y - this.nodes[j].y;
			var dlength = Math.sqrt(dx*dx + dy*dy);
			dispx += (dx/dlength) * f_r(dlength,k);
			dispy += (dy/dlength) * f_r(dlength,k);
		}

		//Calculate attractive forces
		if (this.nodes[i].edges !== undefined) {
		for (j=0; j<this.nodes[i].edges.length; j++) {
			if (this.nodes[i] == this.nodes[i].edges[j]) { continue; }

			var dx = this.nodes[i].x - this.nodes[i].edges[j].x;
			var dy = this.nodes[i].y - this.nodes[i].edges[j].y;
			var dlength = Math.sqrt(dx*dx + dy*dy);
			dispx -= (dx/dlength) * f_a(dlength,k);
			dispy -= (dy/dlength) * f_a(dlength,k);
		}
		}

		var displength = Math.sqrt(dispx*dispx + dispy*dispy);

		if (displength > 0) {
			this.nodes[i].x += (dispx/displength) * dispx;
			this.nodes[i].y += (dispy/displength) * dispy;
			this.nodes[i].x = Math.min(this.width/2,Math.max(-this.width/2,this.nodes[i].x));
			this.nodes[i].y = Math.min(this.height/2,Math.max(-this.height/2,this.nodes[i].y));
		}

		totalke += displength;

		this.nodes[i].setAttribute("cx",this.nodes[i].x.toString());
		this.nodes[i].setAttribute("cy",this.nodes[i].y.toString());

		if (this.nodes[i].parent !== undefined) {
			this.nodes[i].pedge.setAttribute("x1",this.nodes[i].parent.x.toString());
			this.nodes[i].pedge.setAttribute("y1",this.nodes[i].parent.y.toString());
			this.nodes[i].pedge.setAttribute("x2",this.nodes[i].x.toString());
			this.nodes[i].pedge.setAttribute("y2",this.nodes[i].y.toString());
		}		
	}

	if (totalke > 5) {
		var me = this;
		setTimeout(function() {me.update();}, CGRAPH_INTERVAL);
		console.log("KE = "+totalke);
	}*/

	//Iterate over all nodes and update forces and positions.
	//Set timeout until total energy is low enough.
	var totalke = 0;

	var i;
	var j;

	for (i=0; i<this.nodes.length; i++) {
		var nx = 0;
		var ny = 0;
		for (j=0; j<this.nodes.length; j++) {
			if (i==j) { continue; }
	
			//console.log("Force C: "+f);
			var dx = this.nodes[i].x - this.nodes[j].x;
			var dy = this.nodes[i].y - this.nodes[j].y;
			
			var dlength2 = dx*dx + dy*dy;
			var dlength = Math.sqrt(dlength2);
			var f = CGRAPH_KE * ((this.nodes[i].mass * this.nodes[j].mass) / dlength2);
			nx += (dx/dlength) * f;
			ny += (dy/dlength) * f;
		}

		for (j=0; j<this.nodes[i].edges.length; j++) {
			if (this.nodes[i] == this.nodes[i].edges[j]) { continue; }

			var f = CGRAPH_K * (calc_radius(this.nodes[i],this.nodes[i].edges[j]) - CGRAPH_EDGELENGTH);
			//console.log("Force S: "+f);
			var dx = this.nodes[i].x - this.nodes[i].edges[j].x;
			var dy = this.nodes[i].y - this.nodes[i].edges[j].y;

			var dlength2 = dx*dx + dy*dy;
			var dlength = Math.sqrt(dlength2);
			var f = CGRAPH_K * (dlength - k);
			nx += (dx/dlength) * f;
			ny += (dy/dlength) * f;
		}

		//Include edge to parent
		if ((this.nodes[i] != this.nodes[i].parent) && (this.nodes[i].parent !== undefined)) {

			var f = CGRAPH_K * (calc_radius(this.nodes[i],this.nodes[i].parent) - CGRAPH_EDGELENGTH);
			//console.log("Force S: "+f);
			var dx = this.nodes[i].x - this.nodes[i].parent.x;
			var dy = this.nodes[i].y - this.nodes[i].parent.y;

			var dlength2 = dx*dx + dy*dy;
			var dlength = Math.sqrt(dlength2);
			var f = CGRAPH_K * (dlength - k);
			nx += (dx/dlength) * f;
			ny += (dy/dlength) * f;
		}

		this.nodes[i].vx = (this.nodes[i].vx + CGRAPH_TIMESTEP * nx) * CGRAPH_DAMPING;
		this.nodes[i].vy = (this.nodes[i].vy + CGRAPH_TIMESTEP * ny) * CGRAPH_DAMPING;
		this.nodes[i].x += CGRAPH_TIMESTEP * this.nodes[i].vx;
		this.nodes[i].y += CGRAPH_TIMESTEP * this.nodes[i].vy;

		this.nodes[i].x = Math.min(this.width/2,Math.max((-this.width)/2,this.nodes[i].x));
		this.nodes[i].y = Math.min(this.height/2,Math.max((-this.height)/2,this.nodes[i].y));

		this.nodes[i].setAttribute("cx",this.nodes[i].x.toString());
		this.nodes[i].setAttribute("cy",this.nodes[i].y.toString());

		totalke += this.nodes[i].mass * ((this.nodes[i].vx * this.nodes[i].vx) + (this.nodes[i].vy * this.nodes[i].vy));
	}

	for (j=0; j<this.edges.length; j++) {
		this.edges[j].setAttribute("x1",this.edges[j].src.x.toString());
		this.edges[j].setAttribute("y1",this.edges[j].src.y.toString());
		this.edges[j].setAttribute("x2",this.edges[j].target.x.toString());
		this.edges[j].setAttribute("y2",this.edges[j].target.y.toString());
	}

	totalke = totalke / this.nodes.length;
	//console.log("Kinetic = "+totalke);
	if (totalke > (CGRAPH_KINETIC)) {
		var me = this;
		setTimeout(function() {me.update();}, CGRAPH_INTERVAL);
	}
}










///====================================================

/*CadenceGraph.prototype.draw = function() {
	var basegroup = document.createElementNS(SVGNS,'g');
	basegroup.setAttribute("id","cgraphgroup");
	basegroup.setAttribute("transform","translate("+this.startx.toString()+","+this.starty.toString()+")");

	//Chrome browser bug fix
	//var dummyanim = document.createElementNS(SVGNS,'animation');
	//dummyanim.setAttribute("begin","indefinite");
	//dummyanim.setAttribute("id","noop");
	//basegroup.dummy = dummyanim;
	//basegroup.appendChild(dummyanim);

	basegroup.anim = document.createElementNS(SVGNS,'animateTransform');
	basegroup.anim.setAttribute("attributeName","transform");
	basegroup.anim.setAttribute("attributeType","XML");
	basegroup.anim.setAttribute("type","translate");
	basegroup.anim.setAttribute("fill","freeze");
	basegroup.anim.setAttribute("begin","indefinite");
	basegroup.anim.setAttribute("dur","1s");
	basegroup.anim.setAttribute("from","0,0");
	basegroup.anim.setAttribute("to",this.startx.toString()+","+this.starty.toString());
	//basegroup.anim.setAttribute("additive","sum");
	basegroup.x = this.startx;
	basegroup.y = this.starty;
	basegroup.appendChild(basegroup.anim);

	var base = document.createElementNS(SVGNS,'circle');
	base.setAttribute("cx", "0");
	base.setAttribute("cy", "0");
	base.setAttribute("r", "20");
	base.setAttribute("fill", "red");
	base.setAttribute("stroke-width","2");
	base.setAttribute("stroke", "black");
	base.setAttribute("onclick", "nodeClick(evt)");
	base.token = T.gen(this.base);
	base.cgraph = this;
	base.x = 0;
	base.y = 0;
	this.current = base;
	basegroup.appendChild(base);
	this.basegroup = basegroup;
	this.svgnode.appendChild(basegroup);

	//draw the children
	this.drawChildren(base);

	//basegroup.anim.beginElement();
}

function invertangle(ang) {
	var res = ang + (Math.PI);
	if (res >= (2*Math.PI)) {
		res = res - (2*Math.PI);
	}
	return res;
}

CadenceGraph.prototype.drawChildren = function(parent) {
	if (parent.alreadyhaschildren == true) { return; }

	//Number of children
	var children = cadence.nodes[parent.token];
	var num = 0;

	if (children === undefined) { return; }

	var x;
	for (x in children.edges) {
		num++;
	}

	if (parent.parent !== undefined) { num++; }

	var degs = (2*Math.PI) / num;

	console.log("Drawing " + num + " children");

	parent.graphchildren = new Array();

	var i = 0;
	for (x in children.edges) {
		var child = document.createElementNS(SVGNS,'circle');
		child.setAttribute("r", "5");
		child.setAttribute("fill", "blue");
		child.setAttribute("stroke-width","1");
		child.setAttribute("stroke", "black");
		child.setAttribute("onclick", "nodeClick(evt)");
		child.token = children.edges[x].getvalue();
		child.cgraph = this;
		child.parent = parent;
		child.angle = degs*i + (Math.PI/2);

		if (child.angle == invertangle(parent.angle)) {
			i++;
			child.angle = degs*i + (Math.PI/2);
		}

		child.x = parent.x + (60 * Math.sin(child.angle));
		child.y = parent.y + (60 * Math.cos(child.angle));
		child.setAttribute("cx", child.x.toString());
		child.setAttribute("cy", child.y.toString());
		i++;
		parent.graphchildren.push(child);

		//Now draw lines
		var child2 = document.createElementNS(SVGNS,'line');
		child2.setAttribute("stroke-width","1");
		child2.setAttribute("stroke","black");
		child2.setAttribute("x1",parent.x.toString());
		child2.setAttribute("y1",parent.y.toString());
		child2.setAttribute("x2",child.x.toString());
		child2.setAttribute("y2",child.y.toString());
		this.basegroup.appendChild(child2);
		this.basegroup.appendChild(child);
	}

	parent.alreadyhaschildren = true;
}*/

function nodeClick(evt) {
	var node = evt.target;
	/*if (node != node.cgraph.current) {
		node.cgraph.current.setAttribute("r","10");
		node.cgraph.current.setAttribute("fill", "purple");
		node.setAttribute("r","20");
		node.setAttribute("fill","red");
		node.cgraph.current = node;
		//now draw children.
		node.cgraph.drawChildren(node);
		//translate the view.

		node.cgraph.basegroup.anim.setAttribute("from",node.cgraph.basegroup.x.toString()+","+node.cgraph.basegroup.y.toString());
		node.cgraph.basegroup.x = node.cgraph.startx-node.x;
		node.cgraph.basegroup.y = node.cgraph.starty-node.y;
		node.cgraph.basegroup.anim.setAttribute("to",node.cgraph.basegroup.x.toString()+","+node.cgraph.basegroup.y.toString());
		node.cgraph.basegroup.anim.beginElement();
	}*/

	node.cgraph.expandNode(node);
	node.mass = CGRAPH_MASS_SELECTED;
	node.setAttribute("r",(node.mass * CGRAPH_MASS_SCALE).toString());
	node.setAttribute("fill","red");
	if (node.cgraph.current !== undefined) {
		node.cgraph.current.mass = CGRAPH_MASS;
		node.cgraph.current.setAttribute("r",(node.cgraph.current.mass * CGRAPH_MASS_SCALE).toString());
		node.cgraph.current.setAttribute("fill","#a0bfea");
	}
	node.cgraph.current = node;
	node.cgraph.update();	

	console.log("Node is " + T.parse(node.token));
}
