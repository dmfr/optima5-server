Ext.define("Sch.data.mixin.EventStore", {
    model: "Sch.model.Event",
    config: {
        model: "Sch.model.Event"
    },
    requires: ["Sch.util.Date"],
    isEventStore: true,
    setResourceStore: function (a) {
        if (this.resourceStore) {
            this.resourceStore.un({
                beforesync: this.onResourceStoreBeforeSync,
                write: this.onResourceStoreWrite,
                scope: this
            })
        }
        this.resourceStore = a;
        if (a) {
            a.on({
                beforesync: this.onResourceStoreBeforeSync,
                write: this.onResourceStoreWrite,
                scope: this
            })
        }
    },
    onResourceStoreBeforeSync: function (b, c) {
        var a = b.create;
        if (a) {
            for (var e, d = a.length - 1; d >= 0; d--) {
                e = a[d];
                e._phantomId = e.internalId
            }
        }
    },
    onResourceStoreWrite: function (c, b) {
        if (b.wasSuccessful()) {
            var d = this,
                a = b.getRecords();
            Ext.each(a, function (e) {
                if (e._phantomId && !e.phantom) {
                    d.each(function (f) {
                        if (f.getResourceId() === e._phantomId) {
                            f.assign(e)
                        }
                    })
                }
            })
        }
    },
    isDateRangeAvailable: function (f, a, b, d) {
        var c = true,
            e = Sch.util.Date;
        this.forEachScheduledEvent(function (h, g, i) {
            if (e.intersectSpans(f, a, g, i) && d === h.getResource() && (!b || b !== h)) {
                c = false;
                return false
            }
        });
        return c
    },
    getEventsInTimeSpan: function (d, b, a) {
        if (a !== false) {
            var c = Sch.util.Date;
            return this.queryBy(function (g) {
                var f = g.getStartDate(),
                    e = g.getEndDate();
                return f && e && c.intersectSpans(f, e, d, b)
            })
        } else {
            return this.queryBy(function (g) {
                var f = g.getStartDate(),
                    e = g.getEndDate();
                return f && e && (f - d >= 0) && (b - e >= 0)
            })
        }
    },
    forEachScheduledEvent: function (b, a) {
        this.each(function (e) {
            var d = e.getStartDate(),
                c = e.getEndDate();
            if (d && c) {
                return b.call(a || this, e, d, c)
            }
        }, this)
    },
    getTotalTimeSpan: function () {
        var a = new Date(9999, 0, 1),
            b = new Date(0),
            c = Sch.util.Date;
        this.each(function (d) {
            if (d.getStartDate()) {
                a = c.min(d.getStartDate(), a)
            }
            if (d.getEndDate()) {
                b = c.max(d.getEndDate(), b)
            }
        });
        a = a < new Date(9999, 0, 1) ? a : null;
        b = b > new Date(0) ? b : null;
        return {
            start: a || null,
            end: b || a || null
        }
    },
    getEventsForResource: function (e) {
        var c = [],
            d, f = e.getId() || e.internalId;
        for (var b = 0, a = this.getCount(); b < a; b++) {
            d = this.getAt(b);
            if (d.data[d.resourceIdField] == f) {
                c.push(d)
            }
        }
        return c
    },
    append: function (a) {
        throw "Must be implemented by consuming class"
    },
    getModel: function () {
        return this.model
    }
});
