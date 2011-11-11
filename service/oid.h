#ifndef _CADENCEOID_
#define _CADENCEOID_

namespace Cadence {
	struct OID {
		unsigned int perm_flags;
		unsigned int a;
		unsigned int b;
		unsigned int c;
		
		static OID generate(char *);
		static OID generate(int perm_flags, int a, int b, int c);
		static OID generate(int pa, int pb, int pc) { OID r; r.a = pa; r.b = pb; r.c = pc; return r; }
	};
};

#endif
