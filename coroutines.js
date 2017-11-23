"use strict";

// CONSTANTS
// =========
const NIL = 'coroutines.js/nil';
const PARKING_TAKE = 'coroutines.js/take';
const PARKING_PUT = 'coroutines.js/put';

// CHANNELS
// ========
/*
Width is 1 by default.
*/
function chan (width) {
  return {w: width || 1,
          c: []};
}


// CHANNEL OPERATIONS
// ==================
/*
Retuns a value from chan if available,
else NIL.
*/
function poll (chan) {
  if (chan.c.length > 0)
    return chan.c.shift();
  return NIL;
}

/*
Parking take - use inside go blocks
or use gotake.
*/
function take (chan, bodyFn) {
  return {t: PARKING_TAKE,
          c: chan,
          f: bodyFn};
}

/*
Parking put - use inside go blocks
or use goput. body is optional.
*/
function put (chan, val, bodyFn) {
  var bodyFn = bodyFn || function () {};
  return {t: PARKING_PUT,
          c: chan,
          v: val,
          f: bodyFn};
}


// ASYNC EXECUTOR
// ==============
const jobQueue = [];

function scheduleJob (f, ok) {
  jobQueue.push([f, ok]);
}

function execute () {
  if (jobQueue.length < 1)
    return;

  var job = jobQueue.shift();
  var f = job[0];
  var ok = job[1];
  var res = f();

  if (res != null && res.t == PARKING_TAKE) {
    var c = res.c;
    var v = poll(c);
    if (v != NIL) {
      var f = res.f;
      ok(f(v));
    } else {
      scheduleJob(function () {return res;}, ok);
    }
  } else if (res != null && res.t == PARKING_PUT) {
    var c = res.c;
    var v = res.v;
    if (c.c.length < c.w) {
      c.c.push(v);
      ok(res.f());
    } else {
      scheduleJob(function () {return res;}, ok);
    }
  } else {
    ok(res);
  }
}

const asyncExecutor = setInterval(function (){
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
    c.c.push(v);
  });
  return c;
}


/*
Takes a function and args, and calls it
in a separate 'thread'. Returns a channel.
*/
function gocall () {
  var f = arguments[0];
  var args = Array.prototype.slice.call(arguments, 1);
  return go(function () {
    return f.apply(null, args);
  });
}


/*
A combination of go and take.
Takes something from c and calls
then(received_value), returning a channel
that will eventually contain the result.
*/
function gotake (chan, then) {
  return gocall(take, chan, then);
}


/*
A combination of go and put.
Puts v on c and calls then(), returning
a channel that will eventually contain
the result.
then is optional, like in put.
*/
function goput (chan, val, then) {
  return gocall(put, chan, val, then);
}
