#include <iostream>
#include <stdlib.h>
#include <stdio.h>
#include "tinyxml.h"
#include "protocol.h"
#include "graphdb.h"
#include "client.h"
#include "observerdb.h"

int main(int argc, char *argv[]) {
	char *strContentLength = getenv("CONTENT_LENGTH");
	int contentLength;
	if (strContentLength == 0) contentLength = 0;
	else contentLength = atoi(strContentLength);
	char *content = 0;

	Cadence::Protocol::begin();
	
	Cadence::GraphDB::init("cadence.db");
	Cadence::Client::init("cache.db");
	Cadence::ObserverDB::init("cache.db");
	
	if (contentLength == 0) {
		Cadence::Protocol::error("Null Content");
		Cadence::Protocol::end();
		return 0;
	}
		
	content = new char[contentLength];
	fread(content,1,contentLength,stdin);
	
	TiXmlDocument doc;
	doc.Parse(content);
	TiXmlNode *el = doc.RootElement();
	if (el == 0) {
		Cadence::Protocol::error("Not a valid XML message");
		Cadence::Protocol::end();
		return 0;
	}
	if (strcmp(el->Value(), "cadence") != 0) {
			Cadence::Protocol::error("Cadence tag required");
			Cadence::Protocol::end();
			return 0;
	}
	
	TiXmlAttribute *attrib = ((TiXmlElement*)el)->FirstAttribute();
	bool hasid = false;
	if (attrib != 0) {
		if (strcmp(attrib->Name(), "id") == 0) {
			Cadence::Client::setID(atoi(attrib->Value()));
			Cadence::Client::sendValues();
			hasid = true;
		}
	}
	if (!hasid) {
		Cadence::Client::allocateID();
	}
	
	for (el = el->FirstChild(); el != 0; el = el->NextSibling()) {
		if (el->Type() == TiXmlNode::TINYXML_ELEMENT) {
			if (strcmp(el->Value(), "get") == 0) Cadence::Protocol::onGet((TiXmlElement*)el);
			else if (strcmp(el->Value(), "set") == 0) Cadence::Protocol::onSet((TiXmlElement*)el);
			else if (strcmp(el->Value(), "keys") == 0) Cadence::Protocol::onKeys((TiXmlElement*)el);
			else Cadence::Protocol::error("Unknown Request");
		}
	}
	
	Cadence::GraphDB::final();
	Cadence::Client::final();
	Cadence::ObserverDB::final();
	Cadence::Protocol::end();
	return 0;
}

