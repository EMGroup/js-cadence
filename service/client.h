#ifndef _CADENCECLIENT_
#define _CADENCELCIENT_

#include <db.h>

namespace Cadence {
	struct Client_Value {
		char n[16];
		char e[16];
		char v[16];
	};
  
	class Client {
		public:
		static void init(const char*);
		static void final();
		
		static void setID(int id) {
			s_id = id;
		}
		
		static int getID() { return s_id; }
		static void allocateID();
		
		static void valueUpdate(int client, const char *node, const char *edge, const char *value);
		static void sendValues();
		
		private:
		static int s_id;
		static DB *s_valuedb;
		static DB *s_clientdb;
	};
};

#endif
