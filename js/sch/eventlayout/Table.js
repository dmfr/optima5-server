Ext.define("Sch.eventlayout.Table", {
    extend: "Sch.eventlayout.Horizontal",
    timeAxisViewModel: null,
    layoutEventsInBands: function(c) {
        var h = this.timeAxisViewModel;
        var f = h.timeAxis;
        var a = 0;
        do {
            var e = c[0];
            while (e) {
                e.top = this.bandIndexToPxConvertFn.call(this.bandIndexToPxConvertScope || this, a, e.event);
                var b = Math.floor(f.getTickFromDate(e.start));
                var g = this.timeAxisViewModel.getPositionFromDate(f.getAt(b).getStartDate());
                var d = this.timeAxisViewModel.getTickWidth();
                e.left = g;
                e.width = d;
                Ext.Array.remove(c, e);
                e = this.findClosestSuccessor(e, c)
            }
            a++
        } while (c.length > 0);
        return a
    },
    findClosestSuccessor: function(b, m) {
        var f = Infinity,
            c, j = b.end,
            k;
        var h = this.timeAxisViewModel.timeAxis;
        var a = Math.floor(h.getTickFromDate(b.start));
        var g = h.getAt(a);
        for (var e = 0, d = m.length; e < d; e++) {
            k = m[e].start - j;
            if (k >= 0 && k < f && m[e].start >= g.getEndDate()) {
                c = m[e];
                f = k
            }
        }
        return c
    }
});
