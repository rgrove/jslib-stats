exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.Prototype === 'object') {
        results.libs.Prototype = 1;

        if (win.Prototype.Version) {
            results.versions.Prototype = {};
            results.versions.Prototype[win.Prototype.Version] = 1;
        }
    }

    callback(null, results);
};
