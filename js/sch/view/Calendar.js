Ext.define("Sch.view.Calendar", {
    requires: ["Ext.util.Region"],
    view: null,
    constructor: function(a) {
        Ext.apply(this, a)
    },
    getColumnBy: function(b, e) {
        var d = this.view.panel.headerCt.getGridColumns();
        var a = [];
        for (var c = 0; c < d.length; c++) {
            if (b.call(this, d[c])) {
                if (e !== true) {
                    a.push(d[c])
                } else {
                    a.push({
                        column: d[c],
                        index: c
                    })
                }
            }
        }
        return a
    },
    getEventColumns: function(a, b) {
        return this.getColumnBy(function(c) {
            return !(a.getEndDate() <= c.start || a.getStartDate() >= c.end)
        }, b)
    },
    getColumnEvents: function(b) {
        var a = [];
        this.view.eventStore.each(function(c) {
            if (!(c.getEndDate() <= b.start || c.getStartDate() >= b.end)) {
                a.push(c)
            }
        });
        return a
    },
    getColumnByResource: function(b, a) {
        return this.getColumnBy(function(c) {
            return c.start == b.start
        }, a)[0]
    },
    translateToScheduleCoordinate: function(b) {
        var a = this.view;
        if (Ext.isArray(b)) {
            return [b[0] - a.getEl().getX() + a.getScroll().left, b[1] - a.getEl().getY() + a.getScroll().top]
        } else {
            return b - a.getEl().getY() + a.getScroll().top
        }
    },
    translateToPageCoordinate: function(d) {
        var b = this.view;
        var c = b.getEl(),
            a = c.getScroll();
        if (Ext.isArray(d)) {
            return [d[0] + c.getX() - a.left, d[1] + c.getY() - a.top]
        } else {
            return d + c.getY() - a.top
        }
    },
    getDateFromXY: function(c, b, a) {
        var d = c;
        if (!a) {
            d = this.translateToScheduleCoordinate(d)
        }
        return this.view.timeAxisViewModel.getDateFromPosition(d, b)
    },
    getEventRenderData: function(a, b, i) {
        var j = a.getStartDate(),
            h = a.getEndDate(),
            l = this.view,
            c = l.panel.headerCt.getGridColumns(),
            g = c[i].start,
            m = c[i].end,
            k = Math;
        var f = Math.floor(l.getCoordinateFromDate(Sch.util.Date.max(j, g)));
        var n = Math.floor(l.timeAxisViewModel.getPositionFromDate(Sch.util.Date.min(h, m), true));
        var e = this.getCalendarColumnWidth();
        var d;
        if (n === 0) {
            n = l.getStore().getCount() * l.getRowHeight()
        }
        d = {
            top: k.max(0, k.min(f, n) - l.eventBorderWidth),
            height: k.max(1, k.abs(f - n))
        };
        if (l.managedEventSizing) {
            d.left = l.barMargin;
            d.width = e - (2 * l.barMargin) - l.eventBorderWidth
        }
        d.start = j;
        d.end = h;
        d.startsOutsideView = j < g;
        d.endsOutsideView = h > m;
        return d
    },
    getScheduleRegion: function(f, c) {
        var b = this.view,
            h = f ? this.getColumnByResource(f).getRegion() : b.getTableRegion(),
            a = this.translateToPageCoordinate(0),
            e = this.translateToPageCoordinate(b.getStore().getCount() * b.getRowHeight()),
            g = h.left + b.barMargin,
            d = h.right - b.barMargin;
        return new Ext.util.Region(Math.min(a, e), d, Math.max(a, e), g)
    },
    getCalendarColumnWidth: function(a) {
        return this.view.timeAxisViewModel.calendarColumnWidth
    },
    getResourceRegion: function(h, b, g) {
        var j = this.view,
            e = j.resourceStore.indexOf(h) * this.getCalendarColumnWidth(),
            i = j.timeAxis.getStart(),
            m = j.timeAxis.getEnd(),
            a = b ? Sch.util.Date.max(i, b) : i,
            d = g ? Sch.util.Date.min(m, g) : m,
            f = Math.max(0, j.getCoordinateFromDate(a) - j.cellTopBorderWidth),
            l = j.getCoordinateFromDate(d) - j.cellTopBorderWidth,
            c = e + j.cellBorderWidth,
            k = e + this.getCalendarColumnWidth() - j.cellBorderWidth;
        return new Ext.util.Region(Math.min(f, l), k, Math.max(f, l), c)
    },
    columnRenderer: function(d, n, g, h, m) {
        var j = this.view;
        var c = "";
        if (h === 0) {
            var k, b, f, e;
            k = [];
            b = this.getColumnEvents(n.column);
            for (f = 0, e = b.length; f < e; f++) {
                var a = b[f];
                k.push(j.generateTplData(a, g, m))
            }
            j.eventLayout.vertical.applyLayout(k, this.getCalendarColumnWidth());
            c = "&#160;" + j.eventTpl.apply(k)
        }
        if (m % 2 === 1) {
            n.tdCls = (n.tdCls || "") + " " + j.altColCls;
            n.cellCls = (n.cellCls || "") + " " + j.altColCls
        }
        return c
    },
    resolveResource: function(d) {
        var a = this.view;
        d = Ext.fly(d).is(a.timeCellSelector) ? d : Ext.fly(d).up(a.timeCellSelector);
        if (d) {
            var e = d.dom ? d.dom : d;
            var b = 0;
            if (Ext.isIE8m) {
                e = e.previousSibling;
                while (e) {
                    if (e.nodeType === 1) {
                        b++
                    }
                    e = e.previousSibling
                }
            } else {
                b = Ext.Array.indexOf(Array.prototype.slice.call(e.parentNode.children), e)
            }
            if (b >= 0) {
                var c = a.panel.headerCt.getGridColumns()[b];
                return {
                    start: c.start,
                    end: c.end
                }
            }
        }
    },
    onEventUpdate: function(c, d) {
        this.renderSingle.call(this, d);
        var e = d.previous || {};
        var b = new Sch.model.Event({
            StartDate: e.StartDate || d.getStartDate(),
            EndDate: e.EndDate || d.getEndDate()
        });
        this.relayoutRenderedEvents(b);
        this.relayoutRenderedEvents(d);
        var a = this.view;
        var f = a.getEventSelectionModel();
        f.forEachEventRelatedSelection(d, function(g) {
            a.onEventBarSelect(g)
        })
    },
    onEventAdd: function(b, c) {
        var a = this.view;
        if (c.length === 1) {
            this.renderSingle(c[0]);
            this.relayoutRenderedEvents(c[0])
        } else {
            a.repaintAllEvents()
        }
    },
    onEventRemove: function(b, c) {
        var a = this.view;
        if (c.length === 1) {
            this.relayoutRenderedEvents(c[0])
        } else {
            a.repaintAllEvents()
        }
    },
    relayoutRenderedEvents: function(b) {
        var c = this,
            a = c.getEventColumns(b, true);
        Ext.each(a, function(d) {
            c.repaintEventsForColumn(d.column, d.index)
        })
    },
    renderSingle: function(c) {
        var a = this.view;
        var d = this.view.resourceStore.first();
        var b = this.getEventColumns(c, true);
        Ext.each(a.getElementsFromEventRecord(c), function(e) {
            Ext.fly(e).destroy()
        });
        Ext.each(b, function(f) {
            var e = Ext.fly(a.getScheduleCell(0, f.index));
            if (!e) {
                return
            }
            var g = a.generateTplData(c, d, f.index);
            if (!Ext.versions.touch) {
                e = e.first()
            }
            a.eventTpl.append(e, [g])
        })
    },
    repaintEventsForColumn: function(d, m) {
        var n = this;
        var q = n.getColumnEvents(d);
        var o = n.view;
        var h = [],
            j, e, a, c, b, g;
        if (q.length > 0) {
            for (j = 0, e = q.length; j < e; j++) {
                a = q[j];
                c = o.getElementsFromEventRecord(a)[0];
                if (!c) {
                    return
                }
                var k = c.id.split("-");
                k.pop();
                b = a.getStartDate();
                g = a.getEndDate();
                h.push({
                    start: b < d.start ? d.start : b,
                    end: g > d.end ? d.end : g,
                    event: a,
                    id: k.join("-")
                })
            }
        }
        o.eventLayout.vertical.applyLayout(h, d.getWidth());
        var p = Ext.get(Ext.DomQuery.selectNode("tr:nth-child(1)", o.el.dom));
        for (j = 0; j < h.length; j++) {
            a = h[j];
            var f = Ext.get(Ext.DomQuery.selectNode("td:nth-child(" + (m + 1) + ") [id^=" + a.id + "-]", p.dom));
            f && f.setStyle({
                left: a.left + "px",
                width: Math.max(a.width, 0) + "px"
            })
        }
    },
    getTimeSpanRegion: function(a, d) {
        var f = this.view,
            c = f.getCoordinateFromDate(a),
            g = d ? f.getCoordinateFromDate(d, true, true) : c;
        var b = this.getColumnBy(function(j) {
            return j.start <= a && j.end > a
        })[0];
        var e = this.getColumnBy(function(j) {
            return j.start < d && j.end >= d
        })[0];
        var i = this.translateToScheduleCoordinate([b.getX(), 0]);
        var h = this.translateToScheduleCoordinate([e ? e.getRegion().right : b.getWidth() + i[0], 0]);
        return new Ext.util.Region(Math.min(c, g), h[0], Math.max(c, g), i[0])
    },
    getStartEndDatesFromRegion: function(d, c, b) {
        var a = this.view.getDateFromCoordinate([d.left, d.top], c),
            e = this.view.getDateFromCoordinate([d.left, d.bottom], c);
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
        a.calendarColumnWidth = c;
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
