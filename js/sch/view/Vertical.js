Ext.define("Sch.view.Vertical", {
    view: null,
    constructor: function(a) {
        Ext.apply(this, a)
    },
    translateToScheduleCoordinate: function(b) {
        var a = this.view;
        return b - a.getEl().getY() + a.getScroll().top
    },
    translateToPageCoordinate: function(d) {
        var b = this.view;
        var c = b.getEl(),
            a = c.getScroll();
        return d + c.getY() - a.top
    },
    getDateFromXY: function(c, b, a) {
        var d = c[1];
        if (!a) {
            d = this.translateToScheduleCoordinate(d)
        }
        return this.view.timeAxisViewModel.getDateFromPosition(d, b)
    },
    getEventRenderData: function(a, b, h) {
        var i = a.getStartDate(),
            g = a.getEndDate(),
            k = this.view,
            f = k.timeAxis.getStart(),
            l = k.timeAxis.getEnd(),
            j = Math,
            e = j.floor(k.getCoordinateFromDate(Sch.util.Date.max(i, f))),
            m = j.floor(k.getCoordinateFromDate(Sch.util.Date.min(g, l))),
            d = this.getResourceColumnWidth(b),
            c;
        c = {
            top: j.max(0, j.min(e, m) - k.eventBorderWidth),
            height: j.max(1, j.abs(e - m))
        };
        if (k.managedEventSizing) {
            c.left = k.barMargin;
            c.width = d - (2 * k.barMargin) - k.eventBorderWidth
        }
        c.start = i;
        c.end = g;
        c.startsOutsideView = i < f;
        c.endsOutsideView = g > l;
        return c
    },
    getScheduleRegion: function(d, f) {
        var h = this.view,
            g = d ? Ext.fly(h.getScheduleCell(0, h.resourceStore.indexOf(d))).getRegion() : h.getTableRegion(),
            e = h.timeAxis.getStart(),
            k = h.timeAxis.getEnd(),
            a = h.getDateConstraints(d, f) || {
                start: e,
                end: k
            },
            c = this.translateToPageCoordinate(h.getCoordinateFromDate(Sch.util.Date.max(e, a.start))),
            j = this.translateToPageCoordinate(h.getCoordinateFromDate(Sch.util.Date.min(k, a.end))),
            b = g.left + h.barMargin,
            i = (d ? (g.left + this.getResourceColumnWidth(d)) : g.right) - h.barMargin;
        return new Ext.util.Region(Math.min(c, j), i, Math.max(c, j), b)
    },
    getResourceColumnWidth: function(a) {
        return this.view.timeAxisViewModel.resourceColumnWidth
    },
    getResourceRegion: function(h, b, g) {
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
    columnRenderer: function(f, r, m, o, q) {
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
            e = "&#160;" + p.eventTpl.apply(n)
        }
        if (q % 2 === 1) {
            r.tdCls = (r.tdCls || "") + " " + p.altColCls;
            r.cellCls = (r.cellCls || "") + " " + p.altColCls
        }
        return e
    },
    resolveResource: function(f) {
        var e = this,
            b = e.view,
            d, c, a;
        d = Ext.fly(f).is(b.eventSelector) && f || Ext.fly(f).up(b.eventSelector, null, true);
        if (d) {
            a = b.getResourceRecordFromDomId(d.id)
        } else {
            f = Ext.fly(f).is(b.timeCellSelector) ? f : Ext.fly(f).up(b.timeCellSelector, null, true);
            c = -1;
            if (f && Ext.isIE8m) {
                f = f.previousSibling;
                while (f) {
                    if (f.nodeType === 1) {
                        c++
                    }
                    f = f.previousSibling
                }
            } else {
                if (f) {
                    c = Ext.Array.indexOf(Array.prototype.slice.call(f.parentNode.children), f)
                }
            }
            a = c >= 0 && b.resourceStore.getAt(c) || null
        }
        return a
    },
    onEventUpdate: function(l, a) {
        var i = this;
        var g = a.previous || {};
        var j = i.view;
        var f = j.timeAxis;
        var b = a.getStartDate();
        var h = a.getEndDate();
        var c = g.StartDate || b;
        var e = g.EndDate || h;
        var k = c && e && f.timeSpanInAxis(c, e);
        var d;
        if (a.resourceIdField in g && k) {
            d = l.getResourceStore().getById(g[a.resourceIdField]);
            d && i.relayoutRenderedEvents(d)
        }
        if ((b && h && f.timeSpanInAxis(b, h)) || k) {
            i.renderSingle(a);
            Ext.Array.forEach(a.getResources(), function(m) {
                i.relayoutRenderedEvents(m);
                j.getEventSelectionModel().isSelected(a) && j.onEventBarSelect(a, true)
            })
        }
    },
    onEventAdd: function(c, f) {
        var e = this,
            b = e.view,
            d, a, g;
        if (f.length === 1) {
            d = f[0];
            a = d.getStartDate();
            g = d.getEndDate();
            if (a && g && b.timeAxis.timeSpanInAxis(a, g)) {
                e.renderSingle(d);
                Ext.Array.forEach(c.getResourcesForEvent(d), function(h) {
                    e.relayoutRenderedEvents(h)
                })
            }
        } else {
            b.repaintAllEvents()
        }
    },
    onEventRemove: function(k, j) {
        var g = this,
            h = g.view,
            a, c, e, d, f, b;
        for (b = false, d = 0, f = j.length; !b && d < f; d++) {
            a = j[d];
            c = a.getStartDate();
            e = a.getEndDate();
            b = c && e && h.timeAxis.timeSpanInAxis(c, e);
            b && h.repaintAllEvents()
        }
    },
    relayoutRenderedEvents: function(d) {
        var c = [],
            a = this.view,
            b = a.eventStore.getEventsForResource(d);
        Ext.Array.forEach(a.eventStore.getEventsForResource(d), function(f) {
            var e = a.getElementsFromEventRecord(f, d);
            e.length && c.push({
                start: f.getStartDate(),
                end: f.getEndDate(),
                event: f,
                node: e[0]
            })
        });
        a.eventLayout.vertical.applyLayout(c, this.getResourceColumnWidth(d));
        Ext.Array.forEach(c, function(e) {
            e.node.setStyle({
                left: e.left + "px",
                width: e.width + "px"
            });
            a.fireEvent("eventrepaint", a, e.event, e.node)
        })
    },
    renderSingle: function(d) {
        var c = this,
            b = c.view,
            a = d.getStartDate(),
            f = d.getEndDate(),
            e;
        Ext.Array.forEach(b.getElementsFromEventRecord(d), function(g) {
            g.destroy()
        });
        if (a && f && b.timeAxis.timeSpanInAxis(a, f)) {
            Ext.Array.forEach(d.getResources(), function(j) {
                var i = b.resourceStore.indexOf(j),
                    g = Ext.fly(b.getScheduleCell(0, i)),
                    h;
                if (g) {
                    h = b.generateTplData(d, j, i);
                    b.eventTpl.append(g.first(), [h])
                }
            })
        }
    },
    getTimeSpanRegion: function(b, g) {
        var d = this.view,
            a = d.getCoordinateFromDate(b),
            f = g ? d.getCoordinateFromDate(g) : a,
            c = d.getTableRegion(),
            e = c ? c.right - c.left : d.getEl().dom.clientWidth;
        return new Ext.util.Region(Math.min(a, f), e, Math.max(a, f), 0)
    },
    getStartEndDatesFromRegion: function(d, c, b) {
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
    setColumnWidth: function(c, b) {
        var a = this.view;
        a.resourceColumnWidth = c;
        a.getTimeAxisViewModel().setViewColumnWidth(c, b)
    },
    getVisibleDateRange: function() {
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
