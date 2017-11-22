# coroutines.js

Coroutines for JavaScript. A port of [this Clojure library](https://github.com/divs1210/functional-core-async).

## Usage

Let's look at an everyday async call to the database to fetch a string
corresponding to the given id -

### Simple Callback
```javascript
function asyncCallback () {
    getUserName('id1', function (resp) {
        var massaged_resp = resp.toUpperCase();
        console.log("via callback:" + massaged_resp);
        console.log("but can't access outside callback :(");
    });
}
```

The function fires an async query to the db and returns immediately.

In this implementation, the response is locked inside the callback
and whatever code needs access to it should be put inside that callback.

This leads to what is called [callback-hell](http://callbackhell.com/),
which can be escaped with the help of `channels` and `go` blocks.

### Channels to The Rescue
```javascript
function asyncChannel () {
    var ch = chan();
    getUserName('id1', function (resp) {
        put(ch, resp);
    });
    
    return gotake(ch, function (resp) {
        massaged_resp = resp.toUpperCase();
        console.log("via channel/go:" + massaged_resp);
        return massaged_resp;
    });
}
```
In this version, we have modified the callback to just put the response onto
the channel `ch`. The db call is made asynchronously and the call to print
is executed immediately afterwards.

We then wait for the response in a separate `go` block, and return the massaged
value. The `go` block returns a channel that will eventually have massaged_resp.
So now we can do:

```javascript
var ch = asyncChannel();
gotake(ch, function (v) {
    console.log("escaped callback hell!" + v);
});
```

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
- parking `put`
- `alts!`

## License

Copyright © 2017 Divyansh Prakash

Distributed under the Eclipse Public License either version 1.0
