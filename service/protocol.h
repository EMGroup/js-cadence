#ifndef _CADENCEPROTOCOL_
#define _CADENCEPROTOCOL_

#include "tinyxml.h"
#include "oid.h"

namespace Cadence {
	class Protocol {
		public:
		static void begin();
		static void end();
		static void error(const char *msg);
		static void update(const char *n, const char *e, const char *v);
		static void id(int i);
		
		static void onGet(TiXmlElement*);
		static void onSet(TiXmlElement*);
		static void onKeys(TiXmlElement*);
	};
};

#endif
