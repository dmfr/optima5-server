Ext.define("Sch.view.Horizontal", {
    requires: ["Ext.util.Region", "Ext.Element", "Sch.util.Date"],
    view: null,
    constructor: function(a) {
        Ext.apply(this, a)
    },
    translateToScheduleCoordinate: function(a) {
        var b = this.view;
        if (b.rtl) {
            return b.getHorizontalTimeAxisColumn().getEl().getRight() - a
        }
        return a - b.getEl().getX() + b.getScroll().left
    },
    translateToPageCoordinate: function(a) {
        var b = this.view;
        return a + b.getEl().getX() - b.getScroll().left
    },
    getDateFromXY: function(c, b, a) {
        var d = c[0];
        if (!a) {
            d = this.translateToScheduleCoordinate(d)
        }
        return this.view.timeAxisViewModel.getDateFromPosition(d, b)
    },
    getEventRenderData: function(a) {
        var f = a.getStartDate(),
            e = a.getEndDate() || f,
            h = this.view,
            c = h.timeAxis.getStart(),
            i = h.timeAxis.getEnd(),
            g = Math,
            d = h.getXFromDate(Sch.util.Date.max(f, c)),
            j = h.getXFromDate(Sch.util.Date.min(e, i)),
            b = {};
        if (this.view.rtl) {
            b.right = g.min(d, j)
        } else {
            b.left = g.min(d, j)
        }
        b.width = g.max(1, g.abs(j - d)) - h.eventBorderWidth;
        if (h.managedEventSizing) {
            b.top = g.max(0, (h.barMargin - ((Ext.isIE && !Ext.isStrict) ? 0 : h.eventBorderWidth - h.cellTopBorderWidth)));
            b.height = h.timeAxisViewModel.rowHeightHorizontal - (2 * h.barMargin) - h.eventBorderWidth
        }
        b.start = f;
        b.end = e;
        b.startsOutsideView = f < c;
        b.endsOutsideView = e > i;
        return b
    },
    getScheduleRegion: function(e, g) {
        var c = Ext.Element.prototype.getRegion ? "getRegion" : "getPageBox",
            j = this.view,
            i = e ? Ext.fly(j.getRowNode(e))[c]() : j.getTableRegion(),
            f = j.timeAxis.getStart(),
            l = j.timeAxis.getEnd(),
            b = j.getDateConstraints(e, g) || {
                start: f,
                end: l
            },
            d = this.translateToPageCoordinate(j.getXFromDate(Sch.util.Date.max(f, b.start))),
            k = this.translateToPageCoordinate(j.getXFromDate(Sch.util.Date.min(l, b.end))),
            h = i.top + j.barMargin,
            a = i.bottom - j.barMargin - j.eventBorderWidth;
        return new Ext.util.Region(h, Math.max(d, k), a, Math.min(d, k))
    },
    getResourceRegion: function(j, e, i) {
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
    columnRenderer: function(c, k, f, g, j) {
        var i = this.view;
        var b = i.eventStore.filterEventsForResource(f, function(l) {
            return i.timeAxis.isRangeInAxis(l)
        });
        if (b.length === 0) {
            return
        }
        var h = Ext.Array.map(b, function(l) {
            return i.generateTplData(l, f, g)
        });
        if (i.dynamicRowHeight) {
            var e = i.eventLayout.horizontal;
            var d = e.applyLayout(h, f, this.layoutEventVertically, this);
            var a = (d * i.timeAxisViewModel.rowHeightHorizontal) - ((d - 1) * i.barMargin);
            i.cellTopBorderWidth - i.cellBottomBorderWidth;
            k.rowHeight = a
        }
        return i.eventTpl.apply(h)
    },
    layoutEventVertically: function(d, b) {
        var a = this.view;
        var c = d === 0 ? a.barMargin : (d * a.timeAxisViewModel.rowHeightHorizontal - (d - 1) * a.barMargin);
        if (c >= a.cellBottomBorderWidth) {
            c -= a.cellBottomBorderWidth
        }
        return c
    },
    resolveResource: function(e) {
        var d = this,
            b = d.view,
            c, a;
        c = Ext.fly(e).is(b.eventSelector) && e || Ext.fly(e).up(b.eventSelector, null, true);
        if (c) {
            a = b.getResourceRecordFromDomId(c.id)
        } else {
            e = b.findRowByChild(e);
            a = e && b.getRecordForRowNode(e) || null
        }
        return a
    },
    getTimeSpanRegion: function(b, h, g) {
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
    getStartEndDatesFromRegion: function(g, d, c) {
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
    onEventAdd: function(q, p) {
        var o = this.view,
            h = {},
            a, b, n, c, e, m, d, g, f;
        for (m = 0, d = p.length; m < d; m++) {
            a = p[m];
            b = a.getStartDate();
            n = a.getEndDate();
            if (b && n && o.timeAxis.timeSpanInAxis(b, n)) {
                c = p[m].getResources(o.eventStore);
                for (g = 0, f = c.length; g < f; g++) {
                    e = c[g];
                    h[e.getId()] = e
                }
            }
        }
        Ext.Object.each(h, function(j, i) {
            o.repaintEventsForResource(i)
        })
    },
    onEventRemove: function(i, d) {
        var f = this,
            g = f.view,
            h = f.resourceStore,
            c = g.eventStore,
            b, a;
        b = Ext.Array.unique(Ext.Array.flatten(Ext.Array.map(d, function(j) {
            return c.getResourcesForEvent(j)
        })));

        function e(j) {
            g.store.indexOf(j) >= 0 && g.repaintEventsForResource(j)
        }
        if (b.length > 1) {
            Ext.Array.forEach(b, e)
        } else {
            if (b.length == 1) {
                a = Ext.Array.flatten(Ext.Array.map(d, function(j) {
                    return g.getElementsFromEventRecord(j, null, null, true)
                }));
                a = new Ext.CompositeElementLite(a);
                a.fadeOut({
                    callback: function() {
                        e(b[0])
                    }
                })
            }
        }
    },
    onEventUpdate: function(d, e) {
        var h = e.previous || {};
        var j = this.view;
        var g = j.timeAxis;
        var a = e.getStartDate();
        var i = e.getEndDate();
        var b = h.StartDate || a;
        var f = h.EndDate || i;
        var k = b && f && g.timeSpanInAxis(b, f);
        var c;
        if (e.resourceIdField in h && k) {
            c = d.getResourceStore().getById(h[e.resourceIdField]);
            c && j.repaintEventsForResource(c, true)
        }
        if ((a && i && g.timeSpanInAxis(a, i)) || k) {
            Ext.Array.forEach(e.getResources(), function(l) {
                j.repaintEventsForResource(l, true)
            })
        }
    },
    setColumnWidth: function(c, b) {
        var a = this.view;
        a.getTimeAxisViewModel().setViewColumnWidth(c, b)
    },
    getVisibleDateRange: function() {
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
