Ext.define("Sch.eventlayout.Horizontal", {
    timeAxisViewModel: null,
    view: null,
    nbrOfBandsByResource: null,
    constructor: function (a) {
        Ext.apply(this, a);
        this.nbrOfBandsByResource = {}
    },
    clearCache: function (a) {
        if (a) {
            delete this.nbrOfBandsByResource[a.internalId]
        } else {
            this.nbrOfBandsByResource = {}
        }
    },
    getNumberOfBands: function (b, c) {
        if (!this.view.dynamicRowHeight) {
            return 1
        }
        var a = this.nbrOfBandsByResource;
        if (a.hasOwnProperty(b.internalId)) {
            return a[b.internalId]
        }
        return this.calculateNumberOfBands(b, c)
    },
    getRowHeight: function (b, c) {
        var a = this.view;
        var d = this.getNumberOfBands(b, c);
        return (d * this.timeAxisViewModel.rowHeightHorizontal) - ((d - 1) * a.barMargin)
    },
    calculateNumberOfBands: function (e, g) {
        var f = [];
        g = g || this.view.eventStore.getEventsForResource(e);
        var d = this.view.timeAxis;
        for (var b = 0; b < g.length; b++) {
            var c = g[b];
            var h = c.getStartDate();
            var a = c.getEndDate();
            if (h && a && d.timeSpanInAxis(h, a)) {
                f[f.length] = {
                    start: h,
                    end: a
                }
            }
        }
        return this.applyLayout(f, e)
    },
    applyLayout: function (a, b) {
        var c = a.slice();
        c.sort(this.sortEvents);
        return this.nbrOfBandsByResource[b.internalId] = this.layoutEventsInBands(0, c)
    },
    sortEvents: function (e, d) {
        var c = (e.start - d.start === 0);
        if (c) {
            return e.end > d.end ? -1 : 1
        } else {
            return (e.start < d.start) ? -1 : 1
        }
    },
    layoutEventsInBands: function (e, b) {
        var a = this.view;
        do {
            var d = b[0],
                c = e === 0 ? a.barMargin : (e * this.timeAxisViewModel.rowHeightHorizontal - (e - 1) * a.barMargin);
            if (c >= a.cellBottomBorderWidth) {
                c -= a.cellBottomBorderWidth
            }
            while (d) {
                d.top = c;
                Ext.Array.remove(b, d);
                d = this.findClosestSuccessor(d, b)
            }
            e++
        } while (b.length > 0);
        return e
    },
    findClosestSuccessor: function (g, e) {
        var c = Infinity,
            f, a = g.end,
            h;
        for (var d = 0, b = e.length; d < b; d++) {
            h = e[d].start - a;
            if (h >= 0 && h < c) {
                f = e[d];
                c = h
            }
        }
        return f
    }
});
