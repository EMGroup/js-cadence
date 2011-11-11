#include "graphdb.h"
#include "protocol.h"
#include "observerdb.h"

DB *Cadence::GraphDB::s_db = 0;
Cadence::graph_entry Cadence::GraphDB::s_entrybuf;

void Cadence::GraphDB::init(const char *dbname) {
	int res;
	if ((res = db_create(&s_db, NULL, 0)) != 0) {
		Cadence::Protocol::error("Unable to initialise Database");
		Cadence::Protocol::end();
		exit(0);
	}
	
	if ((res = s_db->open(s_db, NULL, dbname, "graphdb", DB_HASH, DB_CREATE, 0664)) != 0) 		{	
		Cadence::Protocol::error("Unable to open graph database");
		Cadence::Protocol::end();
		exit(0);	
	}
}

void Cadence::GraphDB::final(){
	s_db->close(s_db,0);
}

Cadence::graph_entry *Cadence::GraphDB::get(const char *n, const char *e) {
	DBT key,data;
	graph_pair pair;
	memset(&pair, 0, sizeof(pair));
	strcpy(pair.n,n);
	strcpy(pair.e,e);
	
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)&pair;
	key.size = sizeof(graph_pair);
	data.size = 0;
	data.data = 0;
	
	int res;
	if ((res = s_db->get(s_db, NULL, &key, &data, 0)) == 0) {
		return (graph_entry*)data.data;
	} else {
		if (res != DB_NOTFOUND) Cadence::Protocol::error("Unable to read data");
		return 0;
	}
}

void Cadence::GraphDB::set(const char *n, const char *e, const graph_entry *v) {
	DBT key,data;
	graph_pair pair;
	memset(&pair, 0, sizeof(pair));
	strcpy(pair.n,n);
	strcpy(pair.e,e);
	
	memset(&key, 0, sizeof(key));
	memset(&data, 0, sizeof(data));
	key.data = (char*)&pair;
	key.size = sizeof(graph_pair);
	data.data = (char*)v;
	data.size = sizeof(graph_entry);
	int res = s_db->put(s_db, NULL, &key, &data, 0);
	if (res != 0) {
		Cadence::Protocol::error("Unable to save data");
	}
}

void Cadence::GraphDB::set_value(const char *n, const char *e, const char *v) {
	Cadence::graph_entry *ent = get(n,e);
	if (ent == 0) {
		Cadence::graph_entry ent2;
		strcpy(ent2.cached,v);
		ent2.flags = 0;
		ent2.definition = 0;
		ent2.dependants = 0;
		ent2.description = 0;
		ent2.owner = 0;		
		set(n,e,&ent2);
	} else {
		strcpy(ent->cached,v);
		set(n,e,ent);
	}
	
	ObserverDB::notifyValue(n,e,v);
}
