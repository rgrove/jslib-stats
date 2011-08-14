/**
Returns a new object containing a deep merge of the enumerable properties of all
passed objects. Properties in later arguments take precedence over properties
with the same name in earlier arguments. Object values are deep-cloned. Array
values are _not_ deep-cloned.

@method merge
@param {Object} obj* One or more objects to merge.
@return {Object} New object with merged values from all other objects.
@static
**/
function merge() {
    var args   = Array.prototype.slice.call(arguments),
        target = {};

    args.unshift(target);
    mix.apply(this, args);

    return target;
}
exports.merge = merge;

/**
Like `merge()`, but augments the first passed object with a deep merge of the
enumerable properties of all other passed objects, rather than returning a
brand new object.

@method mix
@param {Object} target Object to receive mixed-in properties.
@param {Object} obj* One or more objects to mix into _target_.
@return {Object} Reference to the same _target_ object that was passed in.
@static
**/
function mix() {
    var args   = Array.prototype.slice.call(arguments),
        target = args.shift(),
        i, key, keys, len, source, value;

    while ((source = args.shift())) {
        keys = Object.keys(source);

        for (i = 0, len = keys.length; i < len; ++i) {
            key   = keys[i];
            value = source[key];

            if (typeof value === 'object' && !Array.isArray(value)) {
                typeof target[key] === 'object' || (target[key] = {});
                mix(target[key], value);
            } else {
                target[key] = value;
            }
        }
    }

    return target;
}
exports.mix = mix;
