#ifndef _CADENCEOBSERVER_
#define _CADENCEOBSERVER_

#include <db.h>

namespace Cadence {
	class ObserverDB {
		public:
		static void init(const char*);
		static void final();
		
		static void addObserver(const char *node, const char *edge, int client);
		static void notifyValue(const char *node, const char *edge, const char *v);
		
		private:
		static DB *s_obsdb;
	};
};

#endif
