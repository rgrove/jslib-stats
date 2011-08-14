exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.jQuery === 'function') {
        results.libs.jQuery = 1;

        if (win.jQuery.fn.jquery) {
            results.versions.jQuery = {};
            results.versions.jQuery[win.jQuery.fn.jquery] = 1;
        }
    }

    callback(null, results);
};
