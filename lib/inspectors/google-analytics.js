exports.inspect = function (win, callback) {
    var results = {libs: {}, versions: {}};

    if (typeof win._gaq === 'object') {
        results.libs['Google Analytics'] = 1;
    }

    callback(null, results);
};
