#!/usr/bin/env node

var fs    = require('fs'),
    stats = require('jslib-stats'),

    argv     = process.argv.slice(2),
    progress = {},
    stdout   = process.stdout,
    stderr   = process.stderr,

    urlFile  = argv[0],
    outFile  = argv[1];

if (!urlFile || !outFile) {
    stderr.write('Usage: jslib-stats <url list file> <output file>\n');
    process.exit(1);
}

fs.readFile(urlFile, 'utf8', function (err, data) {
    if (err) { throw err; }

    var urls = data.trim().split(/\s+/);

    // Handle signals.
    process.on('SIGINT', function () {
        summary();

        save(progress, function (err) {
            if (err) { throw err; }
            process.exit();
        });
    });

    stderr.write('Crawling ' + urls.length + ' URL(s).\n');

    stats.crawl(urls)
        .on('inspect', function (e) {
            progress[e.url] = e.result;
            stderr.write('.');
        })
        .on('error', function (e) {
            progress[e.url] = e.result;
            stderr.write('!');
        })
        .on('complete', function (e) {
            summary(e.results);

            save(e.results, function (err) {
                if (err) { throw err; }
                process.exit();
            });
        });
});

function save(results, callback) {
    fs.writeFile(outFile, JSON.stringify(results, null, 2) + '\n', 'utf8',
            callback);
}

function summary(results) {
    var summary = {},
        libs, urls;

    results || (results = progress);
    urls = Object.keys(results);

    stderr.write('\nFinished crawling ' + urls.length + ' URL(s).\n');

    urls.forEach(function (url) {
        var result = results[url];

        if (result && result.data && result.data.libs) {
            Object.keys(result.data.libs).forEach(function (name) {
                summary[name] || (summary[name] = 0);
                summary[name] += result.data.libs[name];
            });
        }
    });

    libs = Object.keys(summary);

    libs.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();

        return a < b ? -1 : (a > b ? 1 : 0);
    });

    stderr.write('\n');

    libs.forEach(function (name) {
        stderr.write(name + ': ' + summary[name] + '\n');
    });
}
