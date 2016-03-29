# Javascript Cadence

A declarative modelling environment that is based upon principles of observation,
dependency relations and agent actions. The language used is intended to be
highly adaptable to a domain of interest.

Visit: http://emgroup.github.io/js-cadence/

Many example models can be found through clicking on the cloud icon.

## Language Basics

The key language concept involved is that of pattern matching and substitution
until a single result is obtained. Using an `is` keyword, a pattern is given on
the left that, when matched, is translated to the pattern given on the right.

For example:
```
my variable is 5;
```

Doing a search for `my variable` will reduce to 5, as does the following but indirectly:
```
my variable 2 is my variable;
```

If the original `my variable` pattern is subsequently changed then the
`my variable 2` pattern also changes.

Patterns can contain variable components on the left-hand-side that can
then be used on the right-hand-side. These kinds of pattern are abstract and
allow generic patterns to be expressed.

For example:
```
square X is X * X;
my variable is square 5;
```



