    Ext.define("Sch.view.model.TimeAxis", {
        extend: "Ext.util.Observable",
        requires: ["Ext.Date", "Sch.util.Date", "Sch.preset.Manager"],
        timeAxis: null,
        availableWidth: 0,
        tickWidth: 100,
        snapToIncrement: false,
        forceFit: false,
        headerConfig: null,
        headers: null,
        mainHeader: 0,
        timeAxisColumnWidth: null,
        resourceColumnWidth: null,
        calendarColumnWidth: null,
        timeColumnWidth: null,
        rowHeightHorizontal: null,
        rowHeightVertical: null,
        mode: "horizontal",
        suppressFit: false,
        refCount: 0,
        columnConfig: {},
        viewPreset: null,
        columnLinesFor: "middle",
        eventStore: null,
        originalTickWidth: null,
        constructor: function(a) {
            var c = this;
            Ext.apply(this, a);
            if (this.viewPreset) {
                if (this.viewPreset instanceof Sch.preset.ViewPreset) {
                    this.consumeViewPreset(this.viewPreset)
                } else {
                    var b = Sch.preset.Manager.getPreset(this.viewPreset);
                    b && this.consumeViewPreset(b)
                }
            }
            c.timeAxis.on("reconfigure", c.onTimeAxisReconfigure, c);
            this.callParent(arguments)
        },
        destroy: function() {
            this.timeAxis.un("reconfigure", this.onTimeAxisReconfigure, this)
        },
        onTimeAxisReconfigure: function(a, b) {
            if (!b) {
                this.update()
            }
        },
        reconfigure: function(a) {
            this.headers = null;
            Ext.apply(this, a);
            switch (this.mode) {
                case "horizontal":
                    this.setTickWidth(this.timeColumnWidth);
                    break;
                case "vertical":
                    this.setTickWidth(this.rowHeightVertical);
                    break;
                case "calendar":
                    this.setTickWidth(this.rowHeightVertical);
                    break
            }
            this.fireEvent("reconfigure", this)
        },
        getColumnConfig: function() {
            return this.columnConfig
        },
        update: function(d, b) {
            var e = this.timeAxis,
                c = this.headerConfig;
            this.availableWidth = Math.max(d || this.availableWidth, 0);
            if (!Ext.isNumber(this.availableWidth)) {
                throw "Invalid available width provided to Sch.view.model.TimeAxis"
            }
            if (this.forceFit && this.availableWidth <= 0) {
                return
            }
            this.columnConfig = {};
            for (var f in c) {
                if (c[f].cellGenerator) {
                    this.columnConfig[f] = c[f].cellGenerator.call(this, e.getStart(), e.getEnd())
                } else {
                    this.columnConfig[f] = this.createHeaderRow(f, c[f])
                }
            }
            var a = this.calculateTickWidth(this.originalTickWidth);
            if (!Ext.isNumber(a) || a <= 0) {
                throw "Invalid column width calculated in Sch.view.model.TimeAxis"
            }
            this.updateTickWidth(a);
            if (!b) {
                this.fireEvent("update", this)
            }
        },
        createHeaderRow: function(a, d) {
            var c = [],
                e = this,
                f = d.align,
                b = Ext.Date.clearTime(new Date());
            e.forEachInterval(a, function(k, g, h) {
                var j = {
                    align: f,
                    start: k,
                    end: g,
                    headerCls: ""
                };
                if (d.renderer) {
                    j.header = d.renderer.call(d.scope || e, k, g, j, h, e.eventStore)
                } else {
                    j.header = Ext.Date.format(k, d.dateFormat)
                }
                if (d.unit === Sch.util.Date.DAY && (!d.increment || d.increment === 1)) {
                    j.headerCls += " sch-dayheadercell-" + k.getDay();
                    if (Ext.Date.clearTime(k, true) - b === 0) {
                        j.headerCls += " sch-dayheadercell-today"
                    }
                }
                c.push(j)
            });
            return c
        },
        getDistanceBetweenDates: function(b, a) {
            return Math.round(this.getPositionFromDate(a, true) - this.getPositionFromDate(b))
        },
        getPositionFromDate: function(e, d) {
            if (this.mode === "calendar") {
                var a = this.rowHeightCalendar || this.rowHeightVertical;
                var c = this.getHeaders();
                var b = this.timeAxis.getStart();
                var g = Sch.util.Date;
                var i = g.mergeDates(b, e, c[1].unit);
                var j = g.getDurationInUnit(b, i, c[1].unit, true) * a;
                var k = Math.round(j);
                if (k === 0 && d) {
                    return this.calendarRowsAmount * a
                }
                return k
            } else {
                var h = -1,
                    f = this.timeAxis.getTickFromDate(e);
                if (f >= 0) {
                    h = Math.round(this.tickWidth * (f - this.timeAxis.visibleTickStart))
                }
                return h
            }
        },
        getDateFromPosition: function(i, l) {
            if (this.mode === "calendar") {
                var b = this.rowHeightCalendar || this.rowHeightVertical;
                var h = Sch.util.Date;
                var c = this.timeAxis.getStart();
                var d = this.getHeaders();
                var j = h.add(c, d[0].splitUnit, Math.floor(i[0] / this.calendarColumnWidth));
                var g = this.timeAxis.first();
                var e = (g.get("end") - g.get("start")) / b;
                var k = h.add(j, h.MILLI, Math.round(i[1] * e));
                if (l) {
                    k = this.timeAxis[l + "Date"](k)
                }
                return k
            } else {
                var f = i / this.getTickWidth() + this.timeAxis.visibleTickStart,
                    a = this.timeAxis.getCount();
                if (f < 0 || f > a) {
                    return null
                }
                return this.timeAxis.getDateFromTick(f, l)
            }
        },
        getSingleUnitInPixels: function(a) {
            return Sch.util.Date.getUnitToBaseUnitRatio(this.timeAxis.getUnit(), a) * this.tickWidth / this.timeAxis.increment
        },
        getSnapPixelAmount: function() {
            if (this.snapToIncrement) {
                var a = this.timeAxis.getResolution();
                return (a.increment || 1) * this.getSingleUnitInPixels(a.unit)
            } else {
                return 1
            }
        },
        getTickWidth: function() {
            return this.tickWidth
        },
        setTickWidth: function(b, a) {
            this.originalTickWidth = b;
            this.updateTickWidth(b);
            this.update(null, a)
        },
        updateTickWidth: function(a) {
            this.tickWidth = a;
            switch (this.mode) {
                case "horizontal":
                    this.timeColumnWidth = a;
                    break;
                case "vertical":
                    this.rowHeightVertical = a;
                    break;
                case "calendar":
                    this.rowHeightVertical = a;
                    break
            }
        },
        getTotalWidth: function() {
            return Math.round(this.tickWidth * this.timeAxis.getVisibleTickTimeSpan())
        },
        calculateTickWidth: function(e) {
            var k = this.forceFit;
            var h = this.timeAxis;
            var c = 0,
                g = h.getUnit(),
                j = Number.MAX_VALUE,
                d = Sch.util.Date;
            if (this.snapToIncrement) {
                var f = h.getResolution();
                j = d.getUnitToBaseUnitRatio(g, f.unit) * f.increment
            } else {
                var i = d.getMeasuringUnit(g);
                j = Math.min(j, d.getUnitToBaseUnitRatio(g, i))
            }
            if (!this.suppressFit) {
                var b = Math[k ? "floor" : "round"](this.getAvailableWidth() / h.getVisibleTickTimeSpan());
                c = (k || e < b) ? b : e;
                if (j > 0 && (!k || j < 1)) {
                    var a = Ext.versions.touch && k ? "ceil" : (k ? "floor" : "round");
                    c = Math.round(Math.max(1, Math[a](j * c)) / j)
                }
            } else {
                c = e
            }
            return c
        },
        getAvailableWidth: function() {
            return this.availableWidth
        },
        setAvailableWidth: function(a) {
            this.availableWidth = Math.max(0, a);
            var b = this.calculateTickWidth(this.originalTickWidth);
            if (b !== this.tickWidth) {
                this.update()
            }
        },
        fitToAvailableWidth: function(a) {
            var b = Math.floor(this.availableWidth / this.timeAxis.getVisibleTickTimeSpan());
            this.setTickWidth(b, a)
        },
        setForceFit: function(a) {
            if (a !== this.forceFit) {
                this.forceFit = a;
                this.update()
            }
        },
        setSnapToIncrement: function(a) {
            if (a !== this.snapToIncrement) {
                this.snapToIncrement = a;
                this.update()
            }
        },
        getViewRowHeight: function() {
            var a = this.mode == "horizontal" ? this.rowHeightHorizontal : this.rowHeightVertical;
            if (!a) {
                throw "rowHeight info not available"
            }
            return a
        },
        setViewRowHeight: function(c, a) {
            var d = this.mode === "horizontal";
            var b = "rowHeight" + Ext.String.capitalize(this.mode);
            if (this[b] != c) {
                this[b] = c;
                if (d) {
                    if (!a) {
                        this.fireEvent("update", this)
                    }
                } else {
                    this.setTickWidth(c, a)
                }
            }
        },
        setViewColumnWidth: function(b, a) {
            switch (this.mode) {
                case "horizontal":
                    this.setTickWidth(b, a);
                    break;
                case "vertical":
                    this.resourceColumnWidth = b;
                    break;
                case "calendar":
                    this.calendarColumnWidth = b;
                    break
            }
            if (!a) {
                this.fireEvent("columnwidthchange", this, b)
            }
        },
        getHeaders: function() {
            if (this.headers) {
                return this.headers
            }
            var a = this.headerConfig;
            this.mainHeader = a.top ? 1 : 0;
            return this.headers = [].concat(a.top || [], a.middle || [], a.bottom || [])
        },
        getMainHeader: function() {
            return this.getHeaders()[this.mainHeader]
        },
        getBottomHeader: function() {
            var a = this.getHeaders();
            return a[a.length - 1]
        },
        forEachInterval: function(b, a, d) {
            d = d || this;
            var c = this.headerConfig;
            if (!c) {
                return
            }
            if (b === "top" || (b === "middle" && c.bottom)) {
                var e = c[b];
                this.timeAxis.forEachAuxInterval(e.unit, e.increment, a, d)
            } else {
                this.timeAxis.each(function(g, f) {
                    return a.call(d, g.data.start, g.data.end, f)
                })
            }
        },
        forEachMainInterval: function(a, b) {
            this.forEachInterval("middle", a, b)
        },
        consumeViewPreset: function(a) {
            this.headers = null;
            var b = this.mode == "horizontal";
            Ext.apply(this, {
                headerConfig: a.headerConfig,
                columnLinesFor: a.columnLinesFor || "middle",
                rowHeightHorizontal: a.rowHeight,
                tickWidth: b ? a.timeColumnWidth : a.timeRowHeight || a.timeColumnWidth || 60,
                timeColumnWidth: a.timeColumnWidth,
                rowHeightVertical: a.timeRowHeight || a.timeColumnWidth || 60,
                timeAxisColumnWidth: a.timeAxisColumnWidth,
                resourceColumnWidth: a.resourceColumnWidth || 100
            });
            this.originalTickWidth = this.tickWidth
        }
    })
