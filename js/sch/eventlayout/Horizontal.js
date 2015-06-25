Ext.define("Sch.eventlayout.Horizontal", {
    nbrOfBandsByResource: null,
    bandIndexToPxConvertFn: null,
    bandIndexToPxConvertScope: null,
    constructor: function(a) {
        Ext.apply(this, a);
        this.nbrOfBandsByResource = {}
    },
    clearCache: function(a) {
        if (a) {
            delete this.nbrOfBandsByResource[a.internalId]
        } else {
            this.nbrOfBandsByResource = {}
        }
    },
    getNumberOfBands: function(c, b) {
        var a = this.nbrOfBandsByResource;
        if (a.hasOwnProperty(c.internalId)) {
            return a[c.internalId]
        }
        var e = Ext.isFunction(b) ? b() : b;
        var d = Ext.Array.map(e, function(f) {
            return {
                start: f.getStartDate(),
                end: f.getEndDate(),
                event: f
            }
        });
        return this.applyLayout(d, c)
    },
    applyLayout: function(a, c) {
        var d = a.slice();
        var b = this;
        d.sort(function(f, e) {
            return b.sortEvents(f.event, e.event)
        });
        return this.nbrOfBandsByResource[c.internalId] = this.layoutEventsInBands(d)
    },
    sortEvents: function(f, d) {
        var g = f.getStartDate();
        var e = d.getStartDate();
        var c = (g - e === 0);
        if (c) {
            return f.getEndDate() > d.getEndDate() ? -1 : 1
        } else {
            return (g < e) ? -1 : 1
        }
    },
    layoutEventsInBands: function(b) {
        var a = 0;
        do {
            var c = b[0];
            while (c) {
                c.top = this.bandIndexToPxConvertFn.call(this.bandIndexToPxConvertScope || this, a, c.event);
                Ext.Array.remove(b, c);
                c = this.findClosestSuccessor(c, b)
            }
            a++
        } while (b.length > 0);
        return a
    },
    findClosestSuccessor: function(a, j) {
        var f = Infinity,
            b, g = a.end,
            h, c = a.end - a.start === 0;
        for (var e = 0, d = j.length; e < d; e++) {
            h = j[e].start - g;
            if (h >= 0 && h < f && (h > 0 || j[e].end - j[e].start > 0 || !c)) {
                b = j[e];
                f = h
            }
        }
        return b
    }
});
