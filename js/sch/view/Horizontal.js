Ext.define("Sch.view.Horizontal", {
    requires: ["Ext.util.Region", "Ext.Element", "Sch.util.Date"],
    view: null,
    constructor: function (a) {
        Ext.apply(this, a)
    },
    translateToScheduleCoordinate: function (a) {
        var b = this.view;
        if (b.rtl) {
            return b.getTimeAxisColumn().getEl().getRight() - a
        }
        return a - b.getEl().getX() + b.getScroll().left
    },
    translateToPageCoordinate: function (a) {
        var b = this.view;
        return a + b.getEl().getX() - b.getScroll().left
    },
    getEventRenderData: function (a, b, c) {
        var h = b || a.getStartDate(),
            g = c || a.getEndDate() || h,
            j = this.view,
            f = j.timeAxis.getStart(),
            k = j.timeAxis.getEnd(),
            i = Math,
            e = j.getXFromDate(Sch.util.Date.max(h, f)),
            l = j.getXFromDate(Sch.util.Date.min(g, k)),
            d = {};
        if (this.view.rtl) {
            d.right = i.min(e, l)
        } else {
            d.left = i.min(e, l)
        }
        d.width = i.max(1, i.abs(l - e)) - j.eventBorderWidth;
        if (j.managedEventSizing) {
            d.top = i.max(0, (j.barMargin - ((Ext.isIE && !Ext.isStrict) ? 0 : j.eventBorderWidth - j.cellTopBorderWidth)));
            d.height = j.timeAxisViewModel.rowHeightHorizontal - (2 * j.barMargin) - j.eventBorderWidth
        }
        d.start = h;
        d.end = g;
        d.startsOutsideView = h < f;
        d.endsOutsideView = g > k;
        return d
    },
    getScheduleRegion: function (e, g) {
        var c = Ext.Element.prototype.getRegion ? "getRegion" : "getPageBox",
            j = this.view,
            i = e ? Ext.fly(j.getRowNode(e))[c]() : j.getTableRegion(),
            f = j.timeAxis.getStart(),
            l = j.timeAxis.getEnd(),
            b = j.getDateConstraints(e, g) || {
                start: f,
                end: l
            }, d = this.translateToPageCoordinate(j.getXFromDate(Sch.util.Date.max(f, b.start))),
            k = this.translateToPageCoordinate(j.getXFromDate(Sch.util.Date.min(l, b.end))),
            h = i.top + j.barMargin,
            a = i.bottom - j.barMargin - j.eventBorderWidth;
        return new Ext.util.Region(h, Math.max(d, k), a, Math.min(d, k))
    },
    getResourceRegion: function (j, e, i) {
        var m = this.view,
            d = m.getRowNode(j),
            f = Ext.fly(d).getOffsetsTo(m.getEl()),
            k = m.timeAxis.getStart(),
            o = m.timeAxis.getEnd(),
            c = e ? Sch.util.Date.max(k, e) : k,
            g = i ? Sch.util.Date.min(o, i) : o,
            h = m.getXFromDate(c),
            n = m.getXFromDate(g),
            l = f[1] + m.cellTopBorderWidth,
            a = f[1] + Ext.fly(d).getHeight() - m.cellBottomBorderWidth;
        if (!Ext.versions.touch) {
            var b = m.getScroll();
            l += b.top;
            a += b.top
        }
        return new Ext.util.Region(l, Math.max(h, n), a, Math.min(h, n))
    },
    columnRenderer: function (d, q, k, n, p) {
        var o = this.view;
        var b = o.eventStore.getEventsForResource(k);
        if (b.length === 0) {
            return
        }
        var h = o.timeAxis,
            m = [],
            g, e;
        for (g = 0, e = b.length; g < e; g++) {
            var a = b[g],
                c = a.getStartDate(),
                f = a.getEndDate();
            if (c && f && h.timeSpanInAxis(c, f)) {
                m[m.length] = o.generateTplData(a, k, n)
            }
        }
        if (o.dynamicRowHeight) {
            var j = o.eventLayout.horizontal;
            j.applyLayout(m, k);
            q.rowHeight = j.getRowHeight(k, b)
        }
        return o.eventTpl.apply(m)
    },
    resolveResource: function (b) {
        var a = this.view;
        var c = a.findRowByChild(b);
        if (c) {
            return a.getRecordForRowNode(c)
        }
        return null
    },
    getTimeSpanRegion: function (b, h, g) {
        var d = this.view,
            c = d.getXFromDate(b),
            e = h ? d.getXFromDate(h) : c,
            a, f;
        f = d.getTableRegion();
        if (g) {
            a = Math.max(f ? f.bottom - f.top : 0, d.getEl().dom.clientHeight)
        } else {
            a = f ? f.bottom - f.top : 0
        }
        return new Ext.util.Region(0, Math.max(c, e), a, Math.min(c, e))
    },
    getStartEndDatesFromRegion: function (g, d, c) {
        var b = this.view;
        var f = b.rtl;
        var a = b.getDateFromCoordinate(f ? g.right : g.left, d),
            e = b.getDateFromCoordinate(f ? g.left : g.right, d);
        if (a && e || c && (a || e)) {
            return {
                start: a,
                end: e
            }
        }
        return null
    },
    onEventAdd: function (n, m) {
        var h = this.view;
        var e = {};
        for (var g = 0, c = m.length; g < c; g++) {
            var a = m[g].getResources(h.eventStore);
            for (var f = 0, d = a.length; f < d; f++) {
                var b = a[f];
                e[b.getId()] = b
            }
        }
        Ext.Object.each(e, function (j, i) {
            h.repaintEventsForResource(i)
        })
    },
    onEventRemove: function (k, e) {
        var h = this.view;
        var j = this.resourceStore;
        var f = Ext.tree && Ext.tree.View && h instanceof Ext.tree.View;
        if (!Ext.isArray(e)) {
            e = [e]
        }
        var g = function (i) {
            if (h.store.indexOf(i) >= 0) {
                h.repaintEventsForResource(i)
            }
        };
        for (var d = 0; d < e.length; d++) {
            var a = e[d].getResources(h.eventStore);
            if (a.length > 1) {
                Ext.each(a, g, this)
            } else {
                var b = h.getEventNodeByRecord(e[d]);
                if (b) {
                    var c = h.resolveResource(b);
                    if (Ext.Element.prototype.fadeOut) {
                        Ext.get(b).fadeOut({
                            callback: function () {
                                g(c)
                            }
                        })
                    } else {
                        Ext.Anim.run(Ext.get(b), "fade", {
                            out: true,
                            duration: 500,
                            after: function () {
                                g(c)
                            },
                            autoClear: false
                        })
                    }
                }
            }
        }
    },
    onEventUpdate: function (c, d, b) {
        var e = d.previous;
        var a = this.view;
        if (e && e[d.resourceIdField]) {
            var f = d.getResource(e[d.resourceIdField], a.eventStore);
            if (f) {
                a.repaintEventsForResource(f, true)
            }
        }
        var g = d.getResources(a.eventStore);
        Ext.each(g, function (h) {
            a.repaintEventsForResource(h, true)
        })
    },
    setColumnWidth: function (c, b) {
        var a = this.view;
        a.getTimeAxisViewModel().setViewColumnWidth(c, b);
        a.fireEvent("columnwidthchange", a, c)
    },
    getVisibleDateRange: function () {
        var d = this.view;
        if (!d.getEl()) {
            return null
        }
        var c = d.getTableRegion(),
            b = d.timeAxis.getStart(),
            f = d.timeAxis.getEnd(),
            e = d.getWidth();
        if ((c.right - c.left) < e) {
            return {
                startDate: b,
                endDate: f
            }
        }
        var a = d.getScroll();
        return {
            startDate: d.getDateFromCoordinate(a.left, null, true),
            endDate: d.getDateFromCoordinate(a.left + e, null, true)
        }
    }
});
