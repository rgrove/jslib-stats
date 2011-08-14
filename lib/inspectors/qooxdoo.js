exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.qx === 'object') {
        results.libs.qooxdoo = 1;

        if (win.qx.$$environment) {
            results.versions.qooxdoo = {};
            results.versions.qooxdoo[win.qx.$$environment['qx.version']] = 1;
        }
    }

    callback(null, results);
};
