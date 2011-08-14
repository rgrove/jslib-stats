exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win.__qc === 'object') {
        results.libs.Quantcast = 1;
    }

    callback(null, results);
};
