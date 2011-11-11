#ifndef _CADENCEGRAPHDB_
#define _CADENCEGRAPHDB_

#include "oid.h"
#include <db.h>

namespace Cadence {
	struct graph_pair {
		char n[16];
		char e[16];
	};

	struct graph_oid {
		char o[16];
	};
		
	struct graph_entry {
		char cached[16];
		unsigned int definition;
		unsigned char flags;
		unsigned int description;
		unsigned int dependants;
		unsigned short owner;
	};

	class GraphDB {
		public:
		static void init(const char*);
		static void final();
		
		static graph_entry *get(const char *, const char *);
		static void set(const char *, const char *, const graph_entry *);
		
		static const char *get_value(const char *n, const char *e) {
			graph_entry *ent = get(n,e);
			if (ent == 0) return "null";
			else return ent->cached;
		};
		static void set_value(const char *n, const char *e, const char *v);

		static void get_keys(const char *n, int &count, graph_oid **keys);
		
		private:
		static DB *s_db;
		static graph_entry s_entrybuf;
	};
};

#endif
