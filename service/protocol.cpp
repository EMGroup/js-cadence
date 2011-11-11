#include "protocol.h"
#include "oid.h"
#include "graphdb.h"
#include "observerdb.h"
#include "client.h"
#include <iostream>

void Cadence::Protocol::begin() {
	std::cout << "Content-type: text/xml\n\n";
	std::cout << "<cadence>\n";
}

void Cadence::Protocol::end() {
	std::cout << "</cadence>\n";
}

void Cadence::Protocol::error(const char *msg) {
	std::cout << "\t<error>" << msg << "</error>\n";
}

void Cadence::Protocol::id(int i) {
	std::cout << "\t<id>" << i << "</id>\n";
}

void Cadence::Protocol::update(const char *n, const char *e, const char *v) {
	std::cout << "\t<update node=\"" << n << "\" edge=\"" << e << "\">" << v << "</update>\n";
}

void Cadence::Protocol::onGet(TiXmlElement *el) {
	const char *node;
	const char *edge;
	
	TiXmlAttribute *attrib = el->FirstAttribute();
	do {
		if (strcmp(attrib->Name(), "node") == 0) {
			node = attrib->Value();
		} else if (strcmp(attrib->Name(), "edge") == 0) {
			edge = attrib->Value();
		}
	} while ((attrib = attrib->Next()) != 0);
	ObserverDB::addObserver(node,edge,Client::getID());
	update(node,edge,Cadence::GraphDB::get_value(node,edge));
}

void Cadence::Protocol::onKeys(TiXmlElement *el) {
	const char *node;
	
	TiXmlAttribute *attrib = el->FirstAttribute();
	do {
		if (strcmp(attrib->Name(), "node") == 0) {
			node = attrib->Value();
		}
	} while ((attrib = attrib->Next()) != 0);

	
}

void Cadence::Protocol::onSet(TiXmlElement *el) {
	const char *node;
	const char *edge;
	const char *value;
	
	TiXmlAttribute *attrib = el->FirstAttribute();
	do {
		if (strcmp(attrib->Name(), "node") == 0) {
			node = attrib->Value();
		} else if (strcmp(attrib->Name(), "edge") == 0) {
			edge = attrib->Value();
		}
	} while ((attrib = attrib->Next()) != 0);
	
	TiXmlNode *n = el->FirstChild();
	if ((n != 0) && (n->Type() == TiXmlNode::TINYXML_TEXT)) {
		value = n->Value();
	} else {
		error("Expected a value for 'set'");
		end();
		exit(0);
	}
	
	Cadence::GraphDB::set_value(node,edge,value);
}
