"use strict";

// CONSTANTS
// =========
const NIL = 'async.js/nil';
const PARKING_TAKE = 'async.js/take';


// CHANNELS
// ========
function chan () {
  return [];
}


// CHANNEL OPERATIONS
// ==================
/*
Retuns a value from chan if available,
else NIL.
*/
function poll (chan) {
  if (chan.length > 0)
    return chan.shift();
  return NIL;
}

/*
Parking take - use inside go blocks
or with gotake.
*/
function take (chan, bodyFn) {
  return {t: PARKING_TAKE,
          c: chan,
          f: bodyFn};
}

/*
Put a value on to chan.
*/
function put (chan, val) {
  chan.push(val);
}


// ASYNC EXECUTOR
// ==============
var jobQueue = chan();

function scheduleJob (f, ok) {
  put(jobQueue, [f, ok]);
}

function execute () {
  if (jobQueue.length < 1)
    return;

  var job = jobQueue.shift();
  var f = job[0];
  var ok = job[1];
  var res = f();

  if (res && res.t == PARKING_TAKE) {
    var c = res.c;
    var v = poll(c);
    if (v != NIL) {
      var f = res.f;
      ok(f(v));
    } else {
      scheduleJob(function () {return res;}, ok);
    }
  } else {
    ok(res);
  }
}

var asyncExecutor = setInterval(function (){
  try {
    execute();
  } catch (e){
    console.log(e);
  }
}, 1);


// Lightweight Threads
// ===================
/*
Executes f asynchronously, returns
a channel that will eventually contain
the result.
*/
function go (f) {
  var c = chan();
  scheduleJob(f, function (v) {
    put(c, v);
  });
  return c;
}

/*
A combination of go and take,
Takes something from c and calls
then(received_value), returning a channel
that will eventually contain the result.
*/
function gotake (c, then) {
  return go(function () {
    return take(c, then);
  });
}