#include "client.h"
#include "protocol.h"

int Cadence::Client::s_id = 0;

DB *Cadence::Client::s_valuedb = 0;
DB *Cadence::Client::s_clientdb = 0;

void Cadence::Client::init(const char *dbname) {
	int res;
	if ((res = db_create(&s_valuedb, NULL, 0)) != 0) {
		Cadence::Protocol::error("Unable to initialise Database");
		Cadence::Protocol::end();
		exit(0);
	}
	s_valuedb->set_flags(s_valuedb, DB_DUP);
	
	if ((res = s_valuedb->open(s_valuedb, NULL, dbname, "clientvaluedb", DB_HASH, DB_CREATE, 0664)) != 0) 		{	
		Cadence::Protocol::error("Unable to open client value database");
		Cadence::Protocol::end();
		exit(0);	
	}


	if ((res = db_create(&s_clientdb, NULL, 0)) != 0) {
		Cadence::Protocol::error("Unable to initialise Database");
		Cadence::Protocol::end();
		exit(0);
	}
	
	if ((res = s_clientdb->open(s_clientdb, NULL, dbname, "clientdb", DB_HASH, DB_CREATE, 0664)) != 0) 		{	
		Cadence::Protocol::error("Unable to open client value database");
		Cadence::Protocol::end();
		exit(0);	
	}
}

void Cadence::Client::final(){
	s_valuedb->close(s_valuedb,0);
	s_clientdb->close(s_clientdb,0);
}

void Cadence::Client::allocateID() {
	DBT key,data;
		
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)"lastid";
	key.size = sizeof("lastid");

	int lid;
	int res = s_clientdb->get(s_clientdb, NULL, &key, &data, 0);
	if (res != 0) {
		lid = 2;
		
	} else {
		lid = *((int*)data.data);
		lid = lid + 1;		
	}
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)"lastid";
	key.size = sizeof("lastid");
	data.data = &lid;
	data.size = sizeof(lid);

	s_clientdb->put(s_clientdb, NULL, &key, &data, 0);
	s_id = lid - 1;
	Cadence::Protocol::id(s_id);
}

void Cadence::Client::valueUpdate(int client, const char *n, const char *e, const char *v) {
	
	if (client != s_id) {
		DBT key,data;
		Client_Value entry;
		memset(&entry, 0, sizeof(entry));
		strcpy(entry.n,n);
		strcpy(entry.e,e);
		strcpy(entry.v,v);
		
		memset(&key, 0, sizeof(key));
		memset(&data, 0, sizeof(data));
		key.data = (char*)&client;
		key.size = sizeof(client);
		data.data = (char*)&entry;
		data.size = sizeof(entry);
		int res = s_valuedb->put(s_valuedb, NULL, &key, &data, 0);
		if (res != 0) {
			Cadence::Protocol::error("Unable to save client cache");
		}
	} else {
		Cadence::Protocol::update(n,e,v);
	}
}

void Cadence::Client::sendValues() {
	DBC *cursor;
	s_valuedb->cursor(s_valuedb, NULL, &cursor, 0);
	
	DBT key,data;
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)&s_id;
	key.size = sizeof(s_id);
	data.size = 0;
	data.data = 0;
	
	Client_Value *val;
	
	int res;
	u_int32_t fl = DB_FIRST;
	
	while ((res = cursor->c_get(cursor, &key, &data, fl)) == 0) {
		val = (Client_Value*)data.data;
		Cadence::Protocol::update(val->n,val->e,val->v);
		//fl = DB_NEXT_DUP;
		cursor->c_del(cursor, 0);
		//key.data = (char*)&s_id;
		//key.size = sizeof(s_id);
	}
	
	cursor->c_close(cursor);
	
	//else {
	//	if (res != DB_NOTFOUND) Cadence::Protocol::error("Unable to read data");
	//	return 0;
	//}
}

