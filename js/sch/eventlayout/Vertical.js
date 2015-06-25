Ext.define("Sch.eventlayout.Vertical", {
    requires: ["Sch.util.Date"],
    view: null,
    constructor: function(a) {
        Ext.apply(this, a)
    },
    applyLayout: function(a, f) {
        if (a.length === 0) {
            return
        }
        var v = this;
        a.sort(function(j, i) {
            return v.sortEvents(j.event, i.event)
        });
        var d, c, k = this.view,
            m = Sch.util.Date,
            o = 1,
            s, b, h = f - (2 * k.barMargin),
            e, r;
        for (var t = 0, q = a.length; t < q; t++) {
            e = a[t];
            d = e.start;
            c = e.end;
            b = this.findStartSlot(a, e);
            var u = this.getCluster(a, t);
            if (u.length > 1) {
                e.left = b.start;
                e.width = b.end - b.start;
                r = 1;
                while (r < (u.length - 1) && u[r + 1].start - e.start === 0) {
                    r++
                }
                var p = this.findStartSlot(a, u[r]);
                if (p && p.start < 0.8) {
                    u = u.slice(0, r)
                }
            }
            var g = u.length,
                n = (b.end - b.start) / g;
            for (r = 0; r < g; r++) {
                u[r].width = n;
                u[r].left = b.start + (r * n)
            }
            t += g - 1
        }
        for (t = 0, q = a.length; t < q; t++) {
            a[t].width = a[t].width * h;
            a[t].left = k.barMargin + (a[t].left * h)
        }
    },
    findStartSlot: function(c, d) {
        var a = this.getPriorOverlappingEvents(c, d),
            b;
        if (a.length === 0) {
            return {
                start: 0,
                end: 1
            }
        }
        for (b = 0; b < a.length; b++) {
            if (b === 0 && a[0].left > 0) {
                return {
                    start: 0,
                    end: a[0].left
                }
            } else {
                if (a[b].left + a[b].width < (b < a.length - 1 ? a[b + 1].left : 1)) {
                    return {
                        start: a[b].left + a[b].width,
                        end: b < a.length - 1 ? a[b + 1].left : 1
                    }
                }
            }
        }
        return false
    },
    getPriorOverlappingEvents: function(e, f) {
        var g = Sch.util.Date,
            h = f.start,
            b = f.end,
            c = [];
        for (var d = 0, a = Ext.Array.indexOf(e, f); d < a; d++) {
            if (g.intersectSpans(h, b, e[d].start, e[d].end)) {
                c.push(e[d])
            }
        }
        c.sort(this.sortOverlappers);
        return c
    },
    sortOverlappers: function(b, a) {
        return b.left < a.left ? -1 : 1
    },
    getCluster: function(e, g) {
        if (g >= e.length - 1) {
            return [e[g]]
        }
        var c = [e[g]],
            h = e[g].start,
            b = e[g].end,
            a = e.length,
            f = Sch.util.Date,
            d = g + 1;
        while (d < a && f.intersectSpans(h, b, e[d].start, e[d].end)) {
            c.push(e[d]);
            h = f.max(h, e[d].start);
            b = f.min(e[d].end, b);
            d++
        }
        return c
    },
    sortEvents: function(f, d) {
        var g = f.getStartDate(),
            i = f.getEndDate();
        var e = d.getStartDate(),
            h = d.getEndDate();
        var c = (g - e === 0);
        if (c) {
            return i > h ? -1 : 1
        } else {
            return (g < e) ? -1 : 1
        }
    }
});
