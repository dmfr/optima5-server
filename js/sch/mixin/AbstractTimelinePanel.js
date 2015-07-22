Ext.define("Sch.mixin.AbstractTimelinePanel", {
    requires: ["Sch.data.TimeAxis", "Sch.view.model.TimeAxis", "Sch.feature.ColumnLines", "Sch.preset.Manager"],
    mixins: ["Sch.mixin.Zoomable"],
    orientation: "horizontal",
    weekStartDay: 1,
    snapToIncrement: false,
    readOnly: false,
    forceFit: false,
    eventResizeHandles: "both",
    timeAxis: null,
    autoAdjustTimeAxis: true,
    timeAxisViewModel: null,
    crudManager: null,
    viewPreset: "weekAndDay",
    calendarViewPreset: "week",
    trackHeaderOver: true,
    startDate: null,
    endDate: null,
    startTime: 0,
    endTime: 24,
    columnLines: true,
    getDateConstraints: Ext.emptyFn,
    snapRelativeToEventStartDate: false,
    trackMouseOver: false,
    readRowHeightFromPreset: true,
    eventBorderWidth: 1,
    getOrientation: function() {
        return this.getMode.apply(this, arguments)
    },
    getMode: function() {
        return this.mode
    },
    isHorizontal: function() {
        return this.getMode() === "horizontal"
    },
    isVertical: function() {
        return !this.isHorizontal()
    },
    cellBorderWidth: 1,
    cellTopBorderWidth: 1,
    cellBottomBorderWidth: 1,
    renderers: null,
    _initializeTimelinePanel: function() {
        this.mode = this.mode || this.orientation || "horizontal";
        if (this.mode === "calendar") {
            this.oldViewPreset = this.viewPreset;
            this.viewPreset = this.calendarViewPreset
        }
        var c = this.viewPreset && Sch.preset.Manager.getPreset(this.viewPreset);
        if (!c) {
            throw "You must define a valid view preset object. See Sch.preset.Manager class for reference"
        }
        this.initializeZooming();
        this.renderers = [];
        if (this.readRowHeightFromPreset) {
            this.readRowHeightFromPreset = !this.rowHeight
        }
        if (!this.timeAxis) {
            this.timeAxis = new Sch.data.TimeAxis({
                autoAdjust: this.autoAdjustTimeAxis,
                mode: this.mode === "calendar" ? "calendar" : "plain"
            })
        }
        if (!this.timeAxisViewModel || !(this.timeAxisViewModel instanceof Sch.view.model.TimeAxis)) {
            var a = Ext.apply({
                mode: this.mode,
                snapToIncrement: this.snapToIncrement,
                forceFit: this.forceFit,
                timeAxis: this.timeAxis,
                eventStore: this.getEventStore(),
                viewPreset: this.viewPreset
            }, this.timeAxisViewModel || {});
            this.timeAxisViewModel = new Sch.view.model.TimeAxis(a)
        }
        this.timeAxisViewModel.on("update", this.onTimeAxisViewModelUpdate, this);
        this.timeAxisViewModel.refCount++;
        this.on("destroy", this.onPanelDestroyed, this);
        var b;
        switch (this.mode) {
            case "horizontal":
                b = ["sch-horizontal"];
                break;
            case "vertical":
                b = ["sch-vertical", "sch-vertical-resource"];
                break;
            case "calendar":
                b = ["sch-vertical", "sch-calendar"];
                break
        }
        this.addCls([].concat.apply(["sch-timelinepanel"], b))
    },
    onTimeAxisViewModelUpdate: function() {
        var a = this.getSchedulingView();
        if (a && a.viewReady) {
            a.refreshKeepingScroll();
            this.fireEvent("viewchange", this)
        }
    },
    onPanelDestroyed: function() {
        var a = this.timeAxisViewModel;
        a.un("update", this.onTimeAxisViewModelUpdate, this);
        a.refCount--;
        if (a.refCount <= 0) {
            a.destroy()
        }
    },
    getSchedulingView: function() {
        throw "Abstract method call"
    },
    setReadOnly: function(a) {
        this.getSchedulingView().setReadOnly(a)
    },
    isReadOnly: function() {
        return this.getSchedulingView().isReadOnly()
    },
    switchViewPreset: function() {
        this.setViewPreset.apply(this, arguments)
    },
    setViewPreset: function(i, a, d, f, b) {
        var e = this.timeAxis;
        if (this.fireEvent("beforeviewchange", this, i, a, d) !== false) {
            var h = this.getMode() === "horizontal";
            if (Ext.isString(i)) {
                this.viewPreset = i;
                i = Sch.preset.Manager.getPreset(i)
            }
            if (!i) {
                throw "View preset not found"
            }
            if (!(f && e.isConfigured)) {
                var c = {
                    weekStartDay: this.weekStartDay,
                    startTime: this.startTime,
                    endTime: this.endTime
                };
                if (f) {
                    if (e.getCount() === 0 || a) {
                        c.start = a || new Date()
                    }
                } else {
                    c.start = a || e.getStart()
                }
                c.end = d;
                e.consumeViewPreset(i);
                e.reconfigure(c, true);
                this.timeAxisViewModel.reconfigure({
                    headerConfig: i.headerConfig,
                    columnLinesFor: i.columnLinesFor || "middle",
                    rowHeightHorizontal: this.readRowHeightFromPreset ? i.rowHeight : (this.rowHeight || this.timeAxisViewModel.getViewRowHeight()),
                    tickWidth: h ? i.timeColumnWidth : i.timeRowHeight || i.timeColumnWidth || 60,
                    timeColumnWidth: i.timeColumnWidth,
                    rowHeightVertical: i.timeRowHeight || i.timeColumnWidth || 60,
                    timeAxisColumnWidth: i.timeAxisColumnWidth,
                    resourceColumnWidth: this.resourceColumnWidth || i.resourceColumnWidth || 100
                })
            }
            var g = this.getSchedulingView();
            g.setDisplayDateFormat(i.displayDateFormat);
            if (this.getMode() === "vertical") {
                g.setColumnWidth(this.resourceColumnWidth || i.resourceColumnWidth || 100, true)
            }
            if (!b) {
                if (h) {
                    g.scrollHorizontallyTo(0)
                } else {
                    g.scrollVerticallyTo(0)
                }
            }
        }
    },
    getViewPreset: function() {
        return this.viewPreset
    },
    getStart: function() {
        return this.getStartDate()
    },
    getStartDate: function() {
        return this.timeAxis.getStart()
    },
    getEnd: function() {
        return this.getEndDate()
    },
    getEndDate: function() {
        return this.timeAxis.getEnd()
    },
    setTimeColumnWidth: function(b, a) {
        this.timeAxisViewModel.setTickWidth(b, a)
    },
    getTimeColumnWidth: function() {
        return this.timeAxisViewModel.getTickWidth()
    },
    getRowHeight: function() {
        return this.timeAxisViewModel.getViewRowHeight()
    },
    shiftNext: function(a) {
        this.suspendLayouts && this.suspendLayouts();
        this.timeAxis.shiftNext(a);
        this.suspendLayouts && this.resumeLayouts(true)
    },
    shiftPrevious: function(a) {
        this.suspendLayouts && this.suspendLayouts();
        this.timeAxis.shiftPrevious(a);
        this.suspendLayouts && this.resumeLayouts(true)
    },
    goToNow: function() {
        this.setTimeSpan(new Date())
    },
    setTimeSpan: function(b, a) {
        if (this.timeAxis) {
            this.timeAxis.setTimeSpan(b, a)
        }
    },
    setStart: function(a) {
        this.setTimeSpan(a)
    },
    setEnd: function(a) {
        this.setTimeSpan(null, a)
    },
    getTimeAxis: function() {
        return this.timeAxis
    },
    scrollToDate: function(c, b) {
        var a = this.getSchedulingView();
        var d = a.getCoordinateFromDate(c, true);
        this.scrollToCoordinate(d, c, b, false)
    },
    scrollToDateCentered: function(c, b) {
        var a = this.getSchedulingView();
        var e = 0;
        if (this.mode === "horizontal") {
            e = a.getBox().width / 2
        } else {
            e = a.getBox().height / 2
        }
        var d = Math.round(a.getCoordinateFromDate(c, true) - e);
        this.scrollToCoordinate(d, c, b, true)
    },
    scrollToCoordinate: function(g, e, d, c) {
        var b = this.getSchedulingView();
        var f = this;
        if (g < 0) {
            if (this.infiniteScroll) {
                b.shiftToDate(e, c)
            } else {
                var a = (this.timeAxis.getEnd() - this.timeAxis.getStart()) / 2;
                this.setTimeSpan(new Date(e.getTime() - a), new Date(e.getTime() + a));
                if (c) {
                    f.scrollToDateCentered(e, d)
                } else {
                    f.scrollToDate(e, d)
                }
            }
            return
        }
        if (this.mode === "horizontal") {
            b.scrollHorizontallyTo(g, d)
        } else {
            b.scrollVerticallyTo(g, d)
        }
        b.fireEvent("scroll", this, g)
    },
    getViewportCenterDate: function() {
        return this.getSchedulingView().getViewportCenterDate()
    },
    addCls: function() {
        throw "Abstract method call"
    },
    removeCls: function() {
        throw "Abstract method call"
    },
    registerRenderer: function(b, a) {
        this.renderers.push({
            fn: b,
            scope: a
        })
    },
    deregisterRenderer: function(b, a) {
        Ext.each(this.renderers, function(c, d) {
            if (b === c) {
                Ext.Array.removeAt(this.renderers, d);
                return false
            }
        })
    }
});
