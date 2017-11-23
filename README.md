```
He had found a Nutri-Matic machine which had provided him with
a plastic cup filled with a liquid that was almost, but not quite,
entirely unlike tea.

The way it functioned was very interesting. When the Drink button
was pressed it made an instant but highly detailed examination of
the subject's taste buds, a spectroscopic analysis of the subject's
metabolism and then sent tiny experimental signals down the neural
pathways to the taste centers of the subject's brain to see what
was likely to go down well. However, no one knew quite why it did
this because it invariably delivered a cupful of liquid that was
almost, but not quite, entirely unlike tea.
```
*from The Hitchhiker's Guide to the Galaxy*

# coroutines.js

Green (co-operative) threads for JavaScript! A port of [this library](https://github.com/divs1210/functional-core-async).

## Why

- It makes writing concurrent software much simpler by getting data out
of callbacks through the use of magic portals called `channels`.
- It provides green threads via `go` blocks that can park and be multiplexed
over the event loop, and communicate over channels.

## Usage

### 'THREADS'

```javascript
// a channel
var ch = chan();

// go blocks execute their functions
// on a separate 'thread'.
go(function () {
    // when a value is available on ch, takes it
    // and calls the callback. returns the return value
    // of the callback. can only be used inside go blocks.
    take(ch, function (v) {
        console.log(v);
    });
});

// the above can also be written as
gotake(ch, function (v) {
    console.log(v);
});

// send a value on the channel
// also takes an optional function,
// like gotake
goput(ch, "hi!");
// => hi!

// there's also gocall
gocall(alert, 'hi!');
```
We can spawn thousands of these 'threads', and structure our
code around producers, consumers, and queues.

### Simple Callback

Let's look at an everyday async call to the database to fetch
a string corresponding to the given id:

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
        goput(ch, resp);
    });
    
    return gotake(ch, function (resp) {
        massaged_resp = resp.toUpperCase();
        console.log("via channel/go:" + massaged_resp);
        return massaged_resp;
    });
}
```
In this version, we have modified the callback to just put the response onto
the channel `ch`. We then wait for the response in a separate `go` block, and
return the massaged value. The `go` block returns a channel that will eventually
have `massaged_resp`. So now we can do:

```javascript
var ch = asyncChannel();
gotake(ch, function (v) {
    console.log("escaped callback hell!" + v);
});
```

## The Hot Dog Machine Process You’ve Been Longing For

Here's a port of the [Hot Dog Machine](https://www.braveclojure.com/core-async/)

```javascript
function hotDogMachine(inCh, outCh, hotDogsLeft) {
  if(hotDogsLeft > 0) {
    gotake(inCh, function(input) {
      if(input == 3) {
        goput(outCh, "hot dog", function () {
          hotDogMachine(inCh, outCh, hotDogsLeft-1);
        });
      } else {
        goput(outCh, "wilted lettuce", function () {
          hotDogMachine(inCh, outCh, hotDogsLeft);
        });
      }
    });
  }
}
```
This function starts a new cooperative process that will consume from `inCh`
and put on `outCh`. If input is 3, it dispenses a hot dog and decrements its
count. If input is something else, it despenses wilted lettuce.

```javascript
var inCh = chan();
var outCh = chan();
hotDogMachine(inCh, outCh, 2); // start async process

goput(inCh, "pocket lint");
gotake(outCh, console.log);
// => wilted lettuce

goput(inCh, 3);
gotake(outCh, console.log);
// => hot dog

goput(inCh, 3);
gotake(outCh, console.log);
// => hot dog
```

## TODO
- `alts!`

## License

Copyright © 2017 Divyansh Prakash

Distributed under the Eclipse Public License either version 1.0
