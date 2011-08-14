var htmlparser = require('htmlparser'),
    jsdom      = require('jsdom'),
    worker     = require('worker').worker,

    config  = require('../../conf/config'),
    util    = require('../util'),

    inspectors = config.inspectors.map(function (name) {
        return require('../inspectors/' + name);
    });

worker.onmessage = function (e) {
    var html = e.html,
        url  = e.url;

    load(html, url, function (err, win) {
        if (err) { throw err; }

        worker.postMessage({
            event: 'load',
            data : {url: url}
        });

        inspect(win, function (err, result) {
            if (err) { throw err; }

            worker.postMessage({
                event: 'inspect',
                data : {
                    result: {
                        status: 'success',
                        data  : result
                    },

                    url: url
                }
            });
        });
    });
};

function load(html, url, callback) {
    var doc, win;

    try {
        doc = jsdom.jsdom(html, null, {
            features: {
                FetchExternalResources  : ['script'],
                ProcessExternalResources: ['script'],
                MutationEvents          : '2.0',
                QuerySelector           : false
            },

            parser: htmlparser,
            url   : url // if we don't pass the URL, relative requests will fail
        });

        win = doc.createWindow();
    } catch (ex) {
        callback(ex);
        return;
    }

    if (/^(?:complete|loaded)/.test(doc.readyState)) {
        setTimeout(function () {
            callback(null, win);
        }, 1000);
    } else {
        win.addEventListener('load', function (e) {
            setTimeout(function () {
                callback(null, win);
            }, 1000);
        }, false);
    }
}

function inspect(win, callback) {
    var results   = {},
        remaining = inspectors.length,
        aborted;

    inspectors.forEach(function (inspector) {
        inspector.inspect(win, afterInspect);
    });

    function afterInspect(err, result) {
        if (aborted) { return; }

        if (err) {
            aborted = true;
            callback(err);
            return;
        }

        remaining -= 1;
        util.mix(results, result);

        if (!remaining) {
            callback(null, results);
        }
    }
}
