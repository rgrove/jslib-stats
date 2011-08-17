jslib-stats
===========

This is a Node.js-based command line tool that crawls a list of URLs and spits
out statistics about JavaScript libraries in use on each page.

Instead of just looking at script URLs, we actually generate a DOM and execute
the JavaScript on each page, then run configurable "inspector" JS that looks for
actual JavaScript objects to determine which libraries (and library versions)
are in use, regardless of how they're loaded.

In theory, this should result in fewer false positives than simply performing
string comparisons against script URLs. It also allows us to extract much more
detailed statistics, such as the exact versions of the libraries being used.

While this approach is excellent at reducing false positives, false negatives
are currently a problem. We rely on [jsdom](https://github.com/tmpvar/jsdom) to
generate the DOM and run the JavaScript on each page, and jsdom isn't perfect.
It's sometimes unable to deal with quirky markup, and occasionally has problems
executing scripts that are loaded using certain post-onload script injection
techniques. Please keep this in mind when considering the results.


Installing
----------

    git://github.com/rgrove/jslib-stats.git
    cd jslib-stats
    npm link
    npm link jslib-stats


Usage
-----

To use jslib-stats, execute `jslib-stats` and pass the name of a URL list file
(it should contain one URL per line) and an output file to which JSON result
data should be written.

    $ jslib-stats conf/lists/test.txt results.json

Progress info and a final result tally are output to stderr.

    Crawling 12 URL(s).
    ............
    Finished crawling 12 URL(s).

    Dojo: 1
    Google Analytics: 2
    jQuery: 3
    MooTools: 2
    Prototype: 1
    YUI: 3

The `results.json` file will contain JSON data that looks like this:

```json
{
  "http://jquery.com/": {
    "status": "success",
    "data": {
      "scripts": [
        "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js",
        "http://static.jquery.com/files/rocker/scripts/custom.js",
        "http://static.jquery.com/donate/donate.js"
      ],
      "libs": {
        "jQuery": 1
      },
      "versions": {
        "jQuery": {
          "1.4.2": 1
        }
      }
    }
  },
  "http://search.yahoo.com/": {
    "status": "success",
    "data": {
      "scripts": [
        "http://a.l.yimg.com/a/lib/s9/syc_metro_201106221439.js"
      ],
      "libs": {
        "YUI": 1
      },
      "versions": {
        "YUI": {
          "3.3.0": 1
        }
      }
    }
  }
}
```


Inspectors
----------

Libraries are detected by "inspectors", which are JavaScript functions that
receive a live `window` object for a given page, inspect it to determine what
JS libraries are on the page (and optionally what versions of those libraries),
and return a results object.

Inspectors are Node.js modules and live in the `lib/inspectors` directory. To
activate one or more inspectors, just add its filename (minus the .js suffix) to
the `inspectors` array in `conf/config.js`.

By way of example, here's the YUI inspector, which lives in
`lib/inspectors/yui.js`:

```js
exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    // YUI 3.
    if (typeof win.YUI === 'function') {
        results.libs.YUI = 1;

        if (win.YUI.version) {
            results.versions.YUI = {};
            results.versions.YUI[win.YUI.version] = 1;
        }
    }

    // YUI 2.
    if (typeof win.YAHOO === 'object') {
        results.libs.YUI || (results.libs.YUI = 0);
        results.libs.YUI += 1;

        if (win.YAHOO.VERSION) {
            results.versions.YUI || (results.versions.YUI = {});
            results.versions.YUI[win.YAHOO.VERSION] = 1;
        }
    }

    callback(null, results);
};
```


Known Issues
------------

Yes.

This is still very experimental. I wouldn't trust the numbers it generates yet,
but with improvements (including upstream improvements to jsdom), it might one
day be an accurate way to gather JavaScript library usage numbers.


Contributing
------------

Please fork this repo, create a topic branch for your change, then open a pull
request describing what your change does and why I should pull it.


License
-------

Copyright (c) 2011 by Ryan Grove (ryan@wonko.com).

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
