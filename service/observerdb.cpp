#include "client.h"
#include "observerdb.h"
#include "protocol.h"
#include "graphdb.h"
#include <stdio.h>
#include <stdlib.h>

DB *Cadence::ObserverDB::s_obsdb = 0;

void Cadence::ObserverDB::init(const char *dbname) {
	int res;
	if ((res = db_create(&s_obsdb, NULL, 0)) != 0) {
		Cadence::Protocol::error("Unable to initialise Database");
		Cadence::Protocol::end();
		exit(0);
	}
	s_obsdb->set_flags(s_obsdb, DB_DUP);
	
	if ((res = s_obsdb->open(s_obsdb, NULL, dbname, "observerdb", DB_HASH, DB_CREATE, 0664)) != 0) 		{	
		Cadence::Protocol::error("Unable to open observer database");
		Cadence::Protocol::end();
		exit(0);	
	}
}

void Cadence::ObserverDB::final(){
	s_obsdb->close(s_obsdb,0);
}

void Cadence::ObserverDB::addObserver(const char *n, const char *e, int client) {
	
	DBT key,data;
	graph_pair pair;
	memset(&pair, 0, sizeof(pair));
	strcpy(pair.n,n);
	strcpy(pair.e,e);
	
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)&pair;
	key.size = sizeof(graph_pair);
	data.data = (char*)&client;
	data.size = sizeof(client);
	
	if (s_obsdb->get(s_obsdb, NULL, &key, &data, DB_GET_BOTH) == DB_NOTFOUND) {
	
		char temp[50];
		sprintf(temp, "AO: %s.%s = %d", n,e,client);
		Cadence::Protocol::error(temp);
	
		int res = s_obsdb->put(s_obsdb, NULL, &key, &data, 0);
		if (res != 0) {
			Cadence::Protocol::error("Unable to save observers");
		}
	} else {
		Cadence::Protocol::error("Already watching");
	}
}

void Cadence::ObserverDB::notifyValue(const char *node, const char *edge, const char *v) {
	DBC *cursor;
	s_obsdb->cursor(s_obsdb, NULL, &cursor, 0);
	
	DBT key,data;
	graph_pair pair;
	memset(&pair, 0, sizeof(pair));
	strcpy(pair.n,node);
	strcpy(pair.e,edge);
	
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)&pair;
	key.size = sizeof(graph_pair);
	data.size = 0;
	data.data = 0;
	
	int *val;
	
	int res;
	
	res = cursor->c_get(cursor, &key, &data, DB_FIRST);
	while (res == 0) {
		val = (int*)data.data;

		db_recno_t c;
		cursor->c_count(cursor, &c, 0);
		
		char temp[50];
		sprintf(temp, "N: %s.%s = %d and count is %d", node,edge,*val,(int)c);
		Cadence::Protocol::error(temp);
		
		Client::valueUpdate(*val, node, edge, v);
	
		//cursor->c_del(cursor, 0);
		res = cursor->c_get(cursor, &key, &data, DB_NEXT_DUP);
	}
	
	cursor->c_close(cursor);
	
	//else {
	//	if (res != DB_NOTFOUND) Cadence::Protocol::error("Unable to read data");
	//	return 0;
	//}
}

