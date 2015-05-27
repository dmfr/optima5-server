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
        timeColumnWidth: null,
        rowHeightHorizontal: null,
        rowHeightVertical: null,
        orientation: "horizontal",
        suppressFit: false,
        refCount: 0,
        columnConfig: {},
        viewPreset: null,
        columnLinesFor: "middle",
        constructor: function (a) {
            var c = this;
            Ext.apply(this, a);
            if (this.viewPreset) {
                var b = Sch.preset.Manager.getPreset(this.viewPreset);
                b && this.consumeViewPreset(b)
            }
            c.addEvents("update");
            c.timeAxis.on("reconfigure", c.onTimeAxisReconfigure, c);
            this.callParent(arguments)
        },
        destroy: function () {
            this.timeAxis.un("reconfigure", this.onTimeAxisReconfigure, this)
        },
        onTimeAxisReconfigure: function (b, a, c) {
            if (!c) {
                this.update()
            }
        },
        reconfigure: function (a) {
            this.headers = null;
            Ext.apply(this, a);
            if (this.orientation == "horizontal") {
                this.setTickWidth(this.timeColumnWidth)
            } else {
                this.setTickWidth(this.rowHeightVertical)
            }
            this.fireEvent("reconfigure", this)
        },
        getColumnConfig: function () {
            return this.columnConfig
        },
        update: function (d, b) {
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
            var a = this.calculateTickWidth(this.getTickWidth());
            if (!Ext.isNumber(a) || a <= 0) {
                throw "Invalid column width calculated in Sch.view.model.TimeAxis"
            }
            this.updateTickWidth(a);
            if (!b) {
                this.fireEvent("update", this)
            }
        },
        createHeaderRow: function (a, d) {
            var c = [],
                e = this,
                f = d.align,
                b = Ext.Date.clearTime(new Date());
            e.forEachInterval(a, function (k, g, h) {
                var j = {
                    align: f,
                    start: k,
                    end: g,
                    headerCls: ""
                };
                if (d.renderer) {
                    j.header = d.renderer.call(d.scope || e, k, g, j, h)
                } else {
                    j.header = Ext.Date.format(k, d.dateFormat)
                } if (d.unit === Sch.util.Date.DAY && (!d.increment || d.increment === 1)) {
                    j.headerCls += " sch-dayheadercell-" + k.getDay();
                    if (Ext.Date.clearTime(k, true) - b === 0) {
                        j.headerCls += " sch-dayheadercell-today"
                    }
                }
                c.push(j)
            });
            return c
        },
        getDistanceBetweenDates: function (b, a) {
            return Math.round(this.getPositionFromDate(a) - this.getPositionFromDate(b))
        },
        getPositionFromDate: function (a) {
            var c = -1,
                b = this.timeAxis.getTickFromDate(a);
            if (b >= 0) {
                c = Math.round(this.tickWidth * (b - this.timeAxis.visibleTickStart))
            }
            return c
        },
        getDateFromPosition: function (a, d) {
            var c = a / this.getTickWidth() + this.timeAxis.visibleTickStart,
                b = this.timeAxis.getCount();
            if (c < 0 || c > b) {
                return null
            }
            return this.timeAxis.getDateFromTick(c, d)
        },
        getSingleUnitInPixels: function (a) {
            return Sch.util.Date.getUnitToBaseUnitRatio(this.timeAxis.getUnit(), a) * this.tickWidth / this.timeAxis.increment
        },
        getSnapPixelAmount: function () {
            if (this.snapToIncrement) {
                var a = this.timeAxis.getResolution();
                return (a.increment || 1) * this.getSingleUnitInPixels(a.unit)
            } else {
                return 1
            }
        },
        getTickWidth: function () {
            return this.tickWidth
        },
        setTickWidth: function (b, a) {
            this.updateTickWidth(b);
            this.update(null, a)
        },
        updateTickWidth: function (a) {
            this.tickWidth = a;
            if (this.orientation == "horizontal") {
                this.timeColumnWidth = a
            } else {
                this.rowHeightVertical = a
            }
        },
        getTotalWidth: function () {
            return Math.round(this.tickWidth * this.timeAxis.getVisibleTickTimeSpan())
        },
        calculateTickWidth: function (d) {
            var j = this.forceFit;
            var g = this.timeAxis;
            var b = 0,
                f = g.getUnit(),
                i = Number.MAX_VALUE,
                c = Sch.util.Date;
            if (this.snapToIncrement) {
                var e = g.getResolution();
                i = c.getUnitToBaseUnitRatio(f, e.unit) * e.increment
            } else {
                var h = c.getMeasuringUnit(f);
                i = Math.min(i, c.getUnitToBaseUnitRatio(f, h))
            }
            var a = Math[j ? "floor" : "round"](this.getAvailableWidth() / g.getVisibleTickTimeSpan());
            if (!this.suppressFit) {
                b = (j || d < a) ? a : d;
                if (i > 0 && (!j || i < 1)) {
                    b = Math.round(Math.max(1, Math[j ? "floor" : "round"](i * b)) / i)
                }
            } else {
                b = d
            }
            return b
        },
        getAvailableWidth: function () {
            return this.availableWidth
        },
        setAvailableWidth: function (a) {
            this.availableWidth = Math.max(0, a);
            var b = this.calculateTickWidth(this.tickWidth);
            if (b !== this.tickWidth) {
                this.setTickWidth(b)
            }
        },
        fitToAvailableWidth: function (a) {
            var b = Math.floor(this.availableWidth / this.timeAxis.getVisibleTickTimeSpan());
            this.setTickWidth(b, a)
        },
        setForceFit: function (a) {
            if (a !== this.forceFit) {
                this.forceFit = a;
                this.update()
            }
        },
        setSnapToIncrement: function (a) {
            if (a !== this.snapToIncrement) {
                this.snapToIncrement = a;
                this.update()
            }
        },
        getViewRowHeight: function () {
            var a = this.orientation == "horizontal" ? this.rowHeightHorizontal : this.rowHeightVertical;
            if (!a) {
                throw "rowHeight info not available"
            }
            return a
        },
        setViewRowHeight: function (c, a) {
            var d = this.orientation === "horizontal";
            var b = "rowHeight" + Ext.String.capitalize(this.orientation);
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
        setViewColumnWidth: function (b, a) {
            if (this.orientation === "horizontal") {
                this.setTickWidth(b, a)
            } else {
                this.resourceColumnWidth = b
            }
        },
        getHeaders: function () {
            if (this.headers) {
                return this.headers
            }
            var a = this.headerConfig;
            this.mainHeader = a.top ? 1 : 0;
            return this.headers = [].concat(a.top || [], a.middle || [], a.bottom || [])
        },
        getMainHeader: function () {
            return this.getHeaders()[this.mainHeader]
        },
        getBottomHeader: function () {
            var a = this.getHeaders();
            return a[a.length - 1]
        },
        forEachInterval: function (b, a, d) {
            d = d || this;
            var c = this.headerConfig;
            if (!c) {
                return
            }
            if (b === "top" || (b === "middle" && c.bottom)) {
                var e = c[b];
                this.timeAxis.forEachAuxInterval(e.unit, e.increment, a, d)
            } else {
                this.timeAxis.each(function (g, f) {
                    return a.call(d, g.data.start, g.data.end, f)
                })
            }
        },
        forEachMainInterval: function (a, b) {
            this.forEachInterval("middle", a, b)
        },
        consumeViewPreset: function (a) {
            this.headers = null;
            var b = this.orientation == "horizontal";
            Ext.apply(this, {
                headerConfig: a.headerConfig,
                columnLinesFor: a.columnLinesFor || "middle",
                rowHeightHorizontal: a.rowHeight,
                tickWidth: b ? a.timeColumnWidth : a.timeRowHeight || a.timeColumnWidth || 60,
                timeColumnWidth: a.timeColumnWidth,
                rowHeightVertical: a.timeRowHeight || a.timeColumnWidth || 60,
                timeAxisColumnWidth: a.timeAxisColumnWidth,
                resourceColumnWidth: a.resourceColumnWidth || 100
            })
        }
    }) ;

