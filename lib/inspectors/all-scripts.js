exports.inspect = function (win, callback) {
    var doc     = win.document,
        results = {scripts: []},
        scripts = Array.prototype.slice.call(doc.getElementsByTagName('script'));

    scripts.forEach(function (node) {
        if (node.src) {
            results.scripts.push(node.src.trim());
        }
    });

    callback(null, results);
};
