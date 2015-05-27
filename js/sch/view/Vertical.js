Ext.define("Sch.view.Vertical", {
    view: null,
    constructor: function (a) {
        Ext.apply(this, a)
    },
    translateToScheduleCoordinate: function (b) {
        var a = this.view;
        return b - a.getEl().getY() + a.getScroll().top
    },
    translateToPageCoordinate: function (d) {
        var b = this.view;
        var c = b.getEl(),
            a = c.getScroll();
        return d + c.getY() - a.top
    },
    getEventRenderData: function (a) {
        var g = a.getStartDate(),
            f = a.getEndDate(),
            i = this.view,
            e = i.timeAxis.getStart(),
            j = i.timeAxis.getEnd(),
            h = Math,
            d = h.floor(i.getCoordinateFromDate(Sch.util.Date.max(g, e))),
            k = h.floor(i.getCoordinateFromDate(Sch.util.Date.min(f, j))),
            c = this.getResourceColumnWidth(a.getResource(), i.eventStore),
            b;
        b = {
            top: h.max(0, h.min(d, k) - i.eventBorderWidth),
            height: h.max(1, h.abs(d - k))
        };
        if (i.managedEventSizing) {
            b.left = i.barMargin;
            b.width = c - (2 * i.barMargin) - i.eventBorderWidth
        }
        b.start = g;
        b.end = f;
        b.startsOutsideView = g < e;
        b.endsOutsideView = f > j;
        return b
    },
    getScheduleRegion: function (d, f) {
        var h = this.view,
            g = d ? Ext.fly(h.getScheduleCell(0, h.resourceStore.indexOf(d))).getRegion() : h.getTableRegion(),
            e = h.timeAxis.getStart(),
            k = h.timeAxis.getEnd(),
            a = h.getDateConstraints(d, f) || {
                start: e,
                end: k
            }, c = this.translateToPageCoordinate(h.getCoordinateFromDate(Sch.util.Date.max(e, a.start))),
            j = this.translateToPageCoordinate(h.getCoordinateFromDate(Sch.util.Date.min(k, a.end))),
            b = g.left + h.barMargin,
            i = (d ? (g.left + this.getResourceColumnWidth(d)) : g.right) - h.barMargin;
        return new Ext.util.Region(Math.min(c, j), i, Math.max(c, j), b)
    },
    getResourceColumnWidth: function (a) {
        return this.view.resourceColumnWidth
    },
    getResourceRegion: function (h, b, g) {
        var j = this.view,
            e = j.resourceStore.indexOf(h) * this.getResourceColumnWidth(h),
            i = j.timeAxis.getStart(),
            m = j.timeAxis.getEnd(),
            a = b ? Sch.util.Date.max(i, b) : i,
            d = g ? Sch.util.Date.min(m, g) : m,
            f = Math.max(0, j.getCoordinateFromDate(a) - j.cellTopBorderWidth),
            l = j.getCoordinateFromDate(d) - j.cellTopBorderWidth,
            c = e + j.cellBorderWidth,
            k = e + this.getResourceColumnWidth(h) - j.cellBorderWidth;
        return new Ext.util.Region(Math.min(f, l), k, Math.max(f, l), c)
    },
    columnRenderer: function (f, r, m, o, q) {
        var p = this.view;
        var e = "";
        if (o === 0) {
            var a = Sch.util.Date,
                k = p.timeAxis,
                n, c, j, g;
            n = [];
            c = p.eventStore.getEventsForResource(m);
            for (j = 0, g = c.length; j < g; j++) {
                var b = c[j],
                    d = b.getStartDate(),
                    h = b.getEndDate();
                if (d && h && k.timeSpanInAxis(d, h)) {
                    n.push(p.generateTplData(b, m, q))
                }
            }
            p.eventLayout.vertical.applyLayout(n, this.getResourceColumnWidth(m));
            e = "&#160;" + p.eventTpl.apply(n);
            if (Ext.isIE) {
                r.tdAttr = 'style="z-index:1000"'
            }
        }
        if (q % 2 === 1) {
            r.tdCls = (r.tdCls || "") + " " + p.altColCls;
            r.cellCls = (r.cellCls || "") + " " + p.altColCls
        }
        return e
    },
    resolveResource: function (c) {
        var a = this.view;
        c = Ext.fly(c).is(a.timeCellSelector) ? c : Ext.fly(c).up(a.timeCellSelector);
        if (c) {
            var d = c.dom ? c.dom : c;
            var b = Ext.Array.indexOf(Array.prototype.slice.call(d.parentNode.children), d);
            if (b >= 0) {
                return a.resourceStore.getAt(b)
            }
        }
        return null
    },
    onEventUpdate: function (b, c) {
        this.renderSingle.call(this, c);
        var a = this.view;
        var d = c.previous;
        if (d && d[c.resourceIdField]) {
            var e = c.getResource(d[c.resourceIdField], a.eventStore);
            this.relayoutRenderedEvents(e)
        }
        this.relayoutRenderedEvents(c.getResource(null, a.eventStore));
        if (a.getSelectionModel().isSelected(c)) {
            a.onEventSelect(c, true)
        }
    },
    onEventAdd: function (b, c) {
        var a = this.view;
        if (c.length === 1) {
            this.renderSingle(c[0]);
            this.relayoutRenderedEvents(c[0].getResource(null, a.eventStore))
        } else {
            a.repaintAllEvents()
        }
    },
    onEventRemove: function (b, c) {
        var a = this.view;
        if (c.length === 1) {
            this.relayoutRenderedEvents(this.getResourceByEventRecord(c[0]))
        } else {
            a.repaintAllEvents()
        }
    },
    relayoutRenderedEvents: function (h) {
        var g = [],
            b = this.view,
            d, a, f, e, c = b.eventStore.getEventsForResource(h);
        if (c.length > 0) {
            for (d = 0, a = c.length; d < a; d++) {
                f = c[d];
                e = b.getEventNodeByRecord(f);
                if (e) {
                    g.push({
                        start: f.getStartDate(),
                        end: f.getEndDate(),
                        id: e.id
                    })
                }
            }
            b.eventLayout.vertical.applyLayout(g, this.getResourceColumnWidth(h));
            for (d = 0; d < g.length; d++) {
                f = g[d];
                Ext.fly(f.id).setStyle({
                    left: f.left + "px",
                    width: f.width + "px"
                })
            }
        }
    },
    renderSingle: function (d) {
        var a = this.view;
        var g = d.getResource(null, a.eventStore);
        var c = a.getEventNodeByRecord(d);
        var f = a.resourceStore.indexOf(g);
        if (c) {
            Ext.fly(c).destroy()
        }
        var b = Ext.fly(a.getScheduleCell(0, f));
        if (!b) {
            return
        }
        var e = a.generateTplData(d, g, f);
        if (!Ext.versions.touch) {
            b = b.first()
        }
        a.eventTpl.append(b, [e])
    },
    getTimeSpanRegion: function (b, g) {
        var d = this.view,
            a = d.getCoordinateFromDate(b),
            f = g ? d.getCoordinateFromDate(g) : a,
            c = d.getTableRegion(),
            e = c ? c.right - c.left : d.getEl().dom.clientWidth;
        return new Ext.util.Region(Math.min(a, f), e, Math.max(a, f), 0)
    },
    getStartEndDatesFromRegion: function (d, c, b) {
        var a = this.view.getDateFromCoordinate(d.top, c),
            e = this.view.getDateFromCoordinate(d.bottom, c);
        if (a && e) {
            return {
                start: Sch.util.Date.min(a, e),
                end: Sch.util.Date.max(a, e)
            }
        } else {
            return null
        }
    },
    setColumnWidth: function (c, b) {
        var a = this.view;
        a.resourceColumnWidth = c;
        a.getTimeAxisViewModel().setViewColumnWidth(c, b);
        a.fireEvent("columnwidthchange", a, c)
    },
    getVisibleDateRange: function () {
        var e = this.view;
        if (!e.rendered) {
            return null
        }
        var c = e.getScroll(),
            b = e.getHeight(),
            d = e.getTableRegion(),
            f = e.timeAxis.getEnd();
        if (d.bottom - d.top < b) {
            var a = e.timeAxis.getStart();
            return {
                startDate: a,
                endDate: f
            }
        }
        return {
            startDate: e.getDateFromCoordinate(c.top, null, true),
            endDate: e.getDateFromCoordinate(c.top + b, null, true) || f
        }
    }
});
