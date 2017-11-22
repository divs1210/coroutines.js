# coroutines.js

Coroutines for JavaScript. A port of [this Clojure library](https://github.com/divs1210/functional-core-async).


## The Hot Dog Machine Process You’ve Been Longing For

Here's a port of the [Hot Dog Machine](https://www.braveclojure.com/core-async/)

```javascript
function hotDogMachine(inCh, outCh, hc) {
  var recurse = function (hc){
    go(function(){
      hotDogMachine(inCh, outCh, hc);
    });
  }

  if(hc > 0){
    gotake(inCh, function(input){
      if(input == 3){
        put(outCh, "hot dog");
        recurse(hc-1);
      } else {
        put(outCh, "wilted lettuce");
        recurse(hc);
      }
    });
  }
}

var inCh = chan();
var outCh = chan();
var hdm = hotDogMachine(inCh, outCh, 2);

put(inCh, "pocket lint");
gotake(outCh, function(v){
  console.log(v);
});

put(inCh, 3);
gotake(outCh, function(v){
  console.log(v);
});

put(inCh, 3);
gotake(outCh, function(v){
  console.log(v);
});

// => wilted lettuce
// => hot dog
// => hot dog
```

## TODO
- backpressure
- `alts!`

## License

Copyright © 2017 Divyansh Prakash

Distributed under the Eclipse Public License either version 1.0