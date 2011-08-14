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
