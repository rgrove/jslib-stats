exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.MooTools === 'object') {
        results.libs.MooTools = 1;

        if (win.MooTools.version) {
            results.versions.MooTools = {};
            results.versions.MooTools[win.MooTools.version] = 1;
        }
    }

    callback(null, results);
};
