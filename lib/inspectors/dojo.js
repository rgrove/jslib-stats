exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.dojo === 'object') {
        results.libs.Dojo = 1;

        if (win.dojo.version) {
            results.versions.Dojo = {};
            results.versions.Dojo[win.dojo.version.toString()] = 1;
        }
    }

    callback(null, results);
};
