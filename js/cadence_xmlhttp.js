
cadence.XMLHTTP = function (callback) {
	this.http = getXmlHttpObject();
	this.callbackfunc = callback;
}

cadence.XMLHTTP.prototype.sendRequest = function (url, content) {
	this.http.callback = this.callbackfunc;
	this.http.onreadystatechange = function () {
		if (this.readyState == 4) {
			this.callback();
		}
	}
	this.http.open("POST", url, true); 
	this.http.send(content);
}

function getXmlHttpObject() {
	var o;
	
	if (window.XMLHttpRequest !== undefined)
		return new XMLHttpRequest();
	
	try
	{
		return new ActiveXObject("Msxml2.XMLHTTP");
	}
	catch (e)
	{
		try
		{
			return new ActiveXObject("Microsoft.XMLHTTP");
		}
		catch (e)
		{
			return null;
		}
	}
	
	return null;
}

