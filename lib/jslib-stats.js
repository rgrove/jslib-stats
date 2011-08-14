var events     = require('events'),
    request    = require('request'),
    WorkerPool = require('./worker-pool'),

    USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.112 Safari/535.1';

function crawl(urls) {
    var emitter = new events.EventEmitter,
        pending = 0,
        pool    = new WorkerPool(__dirname + '/workers/browser.js'),
        results = {};

    pool.on('release', function () {
        pending -= 1;

        if (!pending) {
            pool.drain();

            emitter.emit('complete', {
                results: results,
                urls   : urls
            });
        }
    });

    urls.forEach(function (url) {
        if (!url || !(url = url.trim())) {
            return;
        }

        pending += 1;

        pool.acquire(function (err, worker) {
            if (err) { return error(err, url); }
            fetch(url, worker);
        });
    });

    function error(err, url, worker) {
        var result;

        pending -= 1;

        result = results[url] = {
            status : 'error',
            message: err.message ? err.message : err.toString(),
            data   : typeof err !== 'string' ? err : undefined
        };

        emitter.emit('error', {
            error : err,
            result: result,
            url   : url
        });

        if (worker) {
            pool.release(worker, true);
        }
    }

    function fetch(url, worker) {
        request({
            url    : url,
            headers: {'User-Agent': USER_AGENT},
            timeout: 10000
        }, function (err, res, body) {
            if (err) { return error(err, url, worker); }

            if (res.statusCode < 200 || res.statusCode > 299) {
                return error('HTTP ' + res.statusCode, url, worker);
            }

            var timeout;

            emitter.emit('response', {
                status: res.statusCode,
                url   : url
            });

            worker.onerror = function (e) {
                clearTimeout(timeout);
                error(e.__exception__, url);
                pool.release(worker, true);
            };

            worker.onmessage = function (e) {
                emitter.emit(e.event, e.data);

                if (e.event === 'inspect') {
                    clearTimeout(timeout);
                    results[url] = e.data.result;
                    pool.release(worker, true);
                }
            };

            worker.postMessage({
                html: body,
                url : url
            });

            timeout = setTimeout(function () {
                error('Timed out while inspecting the DOM.', url);
                pool.release(worker, true);
            }, 20000);
        });
    }

    return emitter;
}
exports.crawl = crawl;
