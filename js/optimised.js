Cadence.opt = {
	map: function(origin, X, A) {
		var res = new Array(A.length);
		var i = A.length;
		while(i--) res[i] = Cadence.search([X, A[i]], origin);
		return res;
	}
};
