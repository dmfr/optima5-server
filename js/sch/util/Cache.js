Ext.define("Sch.util.Cache", {
    cache: null,
    constructor: function() {
        this.cache = {}
    },
    key: function(b) {
        var a;
        if (b instanceof Ext.data.Model) {
            a = b.getId().toString()
        } else {
            if (b === undefined || b === null) {
                a = "[ undefined / null ]"
            } else {
                a = (b).toString()
            }
        }
        return a
    },
    get: function(b, c) {
        var d = this,
            a;
        b = d.key(b);
        a = d.cache.hasOwnProperty(b) && d.cache[b];
        if (!a && c) {
            a = c()
        } else {
            if (!a) {
                a = []
            }
        }
        d.cache[b] = a;
        return a
    },
    add: function(c, b) {
        var d = this,
            a = d.key(c);
        if (!d.cache.hasOwnProperty(a)) {
            d.cache[a] = d.get(c)
        }
        Ext.Array.include(d.cache[a], b);
        return d
    },
    remove: function(b, a) {
        var c = this;
        b = c.key(b);
        if (c.cache.hasOwnProperty(b)) {
            Ext.Array.remove(c.cache[b], a)
        }
        return c
    },
    move: function(c, d, a) {
        var b = this;
        c = b.key(c);
        d = b.key(d);
        if (c != d && arguments.length >= 3) {
            b.remove(c, a);
            b.add(d, a)
        } else {
            if (c != d && b.cache.hasOwnProperty(c) && b.cache.hasOwnProperty(d)) {
                b.cache[d] = Ext.Array.union(b.cache[d], b.cache[c]);
                b.cache[c] = []
            } else {
                if (c != d && b.cache.hasOwnProperty(c)) {
                    b.cache[d] = b.cache[c];
                    b.cache[c] = []
                }
            }
        }
    },
    clear: function(a) {
        var b = this;
        if (!arguments.length) {
            b.cache = {}
        } else {
            a = b.key(a);
            if (b.cache.hasOwnProperty(a)) {
                delete b.cache[a]
            }
        }
        return b
    },
    uncache: function(b) {
        var c = this,
            a;
        for (a in c.cache) {
            if (c.cache.hasOwnProperty(a)) {
                c.cache[a] = Ext.Array.remove(c.cache[a], b)
            }
        }
        return c
    }
});
