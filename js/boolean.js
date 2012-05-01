//Boolean AND structure

//__([true,"and",SET,[NEW]]);
//__([true,"and",true,SET,true]);
//__([true,"and",false,SET,false]);
//__([false,"and",SET,[NEW]]);
//__([false,"and",true,SET,false]);
//__([false,"and",false,SET,false]);

_("true and = ( new )");
_("true and true = true");
_("true and false = false");
_("false and = ( new )");
_("false and true = false");
_("false and false = false");

//Boolean OR structure
_("true or = ( new )");
_("true or true = true");
_("true or false = true");
_("false or = ( new )");
_("false or true = true");
_("false or false = false");

_("test a = ( new )");

