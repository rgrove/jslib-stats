/**
Manages a pool of reusable worker processes.

@module worker-pool
@requires worker
**/

var events   = require('events'),
    nodeUtil = require('util'),
    workers  = require('worker'),

    util = require('./util');

// Duckpunch WorkerChild to make it actually terminate child processes.
workers._WorkerChild.prototype.terminate = function () {
    this.child.stdin.end();
    this.child.kill();
};

/**
Manages a pool of reusable worker processes.

@example

    // Create a new pool in which the workers will execute `worker-file.js`.
    var pool = new WorkerPool('worker-file.js');

    // Acquire a worker. If no workers exist yet, one will be spun up. If an
    // existing worker is available, it will be reused. If all workers are busy,
    // the callback won't be called until one becomes available.
    pool.acquire(function (err, worker) {
        if (err) { throw err; }

        // Listen for messages from the worker.
        worker.onmessage = function (msg) {
            console.log(msg);
        };

        // Send a message to the worker.
        worker.postMessage({foo: 'bar'});

        // Release the worker back into the pool.
        pool.release(worker);
    });

@class WorkerPool
@extends EventEmitter
@param {String} filename File that should be executed for each worker process.
@param {Object} [options] Configuration options.
  @param {Number} [options.size=5] Maximum number of workers to allocate.
**/
function WorkerPool(filename, options) {
    this.allocated = [];
    this.available = [];
    this.filename  = filename;

    this.options = util.merge({size: 5}, options || {});

    events.EventEmitter.call(this);
    this.setMaxListeners(0);
}

nodeUtil.inherits(WorkerPool, events.EventEmitter);

/**
Acquires a worker. If no workers exist yet, a new one will be spun up. If an
existing worker is available, it will be reused. If all existing workers are
busy, the callback won't be called until one becomes available.

When you're finished with a worker you've acquired, be sure to call `release()`
to release it back into the pool.

@method acquire
@param {Object} [options] Configuration options. If provided, these will
    override any options given when this WorkerPool was instantiated.
  @param {Number} [options.size=5] Maximum number of workers to allocate.
@param {Function} callback Callback function.
  @param {Error|null} callback.err Error or `null`.
  @param {Worker} callback.worker Allocated worker ready to be used.
**/
WorkerPool.prototype.acquire = function (options, callback) {
    var self = this,
        worker;

    if (typeof options === 'function') {
        callback = options;
        options  = {};
    }

    options = util.merge(this.options, options || {});

    // If all workers are currently allocated, wait a while and then try again.
    if (this.allocated.length >= this.options.size) {
        this.once('release', function () {
            self.acquire(options, callback);
        });

        return;
    }

    // If an existing worker is available, reuse it.
    if (this.available.length) {
        worker = this.available.shift();
        this.allocated.push(worker);
    } else {
        // No existing worker was available, so spin up a new one.
        worker = new workers.Worker(this.filename);
        this.allocated.push(worker);
    }

    this.emit('acquire', {worker: worker});
    callback(null, worker);
};

/**
Drains the pool by canceling all pending `acquire()` callbacks and terminating
all workers.

@method drain
**/
WorkerPool.prototype.drain = function () {
    var worker;

    this.removeAllListeners('release');

    while (worker = this.allocated.pop()) {
        worker.terminate();
    }

    while (worker = this.available.pop()) {
        worker.terminate();
    }

    this.emit('drain');
};

/**
Returns `true` if the given worker is in this pool and is currently allocated,
`false` otherwise.

@method isAllocated
@param {Worker} Worker instance.
@return {Boolean} `true` if the given worker is allocated, `false` otherwise.
**/
WorkerPool.prototype.isAllocated = function (worker) {
    return this.allocated.indexOf(worker) !== -1;
};

/**
Returns `true` if the given worker is in this pool and is currently avaialble,
`false` otherwise.

@method isAvailable
@param {Worker} Worker instance.
@return {Boolean} `true` if the given worker is available, `false` otherwise.
**/
WorkerPool.prototype.isAvailable = function (worker) {
    return this.available.indexOf(worker) !== -1;
};

/**
Returns `true` if the given worker is in this pool, `false` otherwise.

@method isInPool
@param {Worker} Worker instance.
@return {Boolean} `true` if the given worker is in this pool, `false` otherwise.
**/
WorkerPool.prototype.isInPool = function (worker) {
    return this.isAllocated(worker) || this.isAvailable(worker);
};

/**
Releases the given worker back into the pool.

@method release
@param {Worker} Worker instance to release.
@param {Boolean} [terminate=false] If `true`, the worker will be terminated
  instead of being made available for reuse.
**/
WorkerPool.prototype.release = function (worker, terminate) {
    var index = this.allocated.indexOf(worker);

    if (index === -1) {
        return;
    }

    this.allocated.splice(index, 1);

    if (terminate) {
        worker.terminate();
        worker = undefined;
    } else {
        delete worker.onerror;
        delete worker.onmessage;

        this.available.push(worker);
    }

    this.emit('release', {worker: worker});
};

module.exports = WorkerPool;
