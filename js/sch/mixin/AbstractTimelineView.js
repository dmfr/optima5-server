Ext.define("Sch.mixin.AbstractTimelineView", {
    requires: ["Sch.data.TimeAxis", "Sch.view.Horizontal"],
    selectedEventCls: "sch-event-selected",
    readOnly: false,
    horizontalViewClass: "Sch.view.Horizontal",
    timeCellCls: "sch-timetd",
    timeCellSelector: ".sch-timetd",
    eventBorderWidth: 1,
    timeAxis: null,
    timeAxisViewModel: null,
    eventPrefix: null,
    rowHeight: null,
    orientation: "horizontal",
    altColCls: "sch-col-alt",
    horizontal: null,
    vertical: null,
    secondaryCanvasEl: null,
    panel: null,
    displayDateFormat: null,
    el: null,
    _initializeTimelineView: function () {
        if (this.horizontalViewClass) {
            this.horizontal = Ext.create(this.horizontalViewClass, {
                view: this
            })
        }
        if (this.verticalViewClass) {
            this.vertical = Ext.create(this.verticalViewClass, {
                view: this
            })
        }
        this.eventPrefix = (this.eventPrefix || this.getId()) + "-"
    },
    getTimeAxisViewModel: function () {
        return this.timeAxisViewModel
    },
    getFormattedDate: function (a) {
        return Ext.Date.format(a, this.getDisplayDateFormat())
    },
    getFormattedEndDate: function (c, a) {
        var b = this.getDisplayDateFormat();
        if (c.getHours() === 0 && c.getMinutes() === 0 && !(c.getYear() === a.getYear() && c.getMonth() === a.getMonth() && c.getDate() === a.getDate()) && !Sch.util.Date.hourInfoRe.test(b.replace(Sch.util.Date.stripEscapeRe, ""))) {
            c = Sch.util.Date.add(c, Sch.util.Date.DAY, -1)
        }
        return Ext.Date.format(c, b)
    },
    getDisplayDateFormat: function () {
        return this.displayDateFormat
    },
    setDisplayDateFormat: function (a) {
        this.displayDateFormat = a
    },
    fitColumns: function (b) {
        if (this.orientation === "horizontal") {
            this.getTimeAxisViewModel().fitToAvailableWidth(b)
        } else {
            var a = Math.floor((this.panel.getWidth() - Ext.getScrollbarSize().width - 1) / this.headerCt.getColumnCount());
            this.setColumnWidth(a, b)
        }
    },
    getElementFromEventRecord: function (a) {
        return Ext.get(this.eventPrefix + a.internalId)
    },
    getEventNodeByRecord: function (a) {
        return document.getElementById(this.eventPrefix + a.internalId)
    },
    getEventNodesByRecord: function (a) {
        return this.el.select("[id=" + this.eventPrefix + a.internalId + "]")
    },
    getStartEndDatesFromRegion: function (c, b, a) {
        return this[this.orientation].getStartEndDatesFromRegion(c, b, a)
    },
    getTimeResolution: function () {
        return this.timeAxis.getResolution()
    },
    setTimeResolution: function (b, a) {
        this.timeAxis.setResolution(b, a);
        if (this.getTimeAxisViewModel().snapToIncrement) {
            this.refreshKeepingScroll()
        }
    },
    getEventIdFromDomNodeId: function (a) {
        return a.substring(this.eventPrefix.length)
    },
    getDateFromDomEvent: function (b, a) {
        return this.getDateFromXY(b.getXY(), a)
    },
    getSnapPixelAmount: function () {
        return this.getTimeAxisViewModel().getSnapPixelAmount()
    },
    getTimeColumnWidth: function () {
        return this.getTimeAxisViewModel().getTickWidth()
    },
    setSnapEnabled: function (a) {
        this.getTimeAxisViewModel().setSnapToIncrement(a)
    },
    setReadOnly: function (a) {
        this.readOnly = a;
        this[a ? "addCls" : "removeCls"](this._cmpCls + "-readonly")
    },
    isReadOnly: function () {
        return this.readOnly
    },
    setOrientation: function (a) {
        this.orientation = a;
        this.timeAxisViewModel.orientation = a
    },
    getOrientation: function () {
        return this.orientation
    },
    isHorizontal: function () {
        return this.getOrientation() === "horizontal"
    },
    isVertical: function () {
        return !this.isHorizontal()
    },
    getDateFromXY: function (c, b, a) {
        return this.getDateFromCoordinate(this.orientation === "horizontal" ? c[0] : c[1], b, a)
    },
    getDateFromCoordinate: function (c, b, a) {
        if (!a) {
            c = this[this.orientation].translateToScheduleCoordinate(c)
        }
        return this.timeAxisViewModel.getDateFromPosition(c, b)
    },
    getDateFromX: function (a, b) {
        return this.getDateFromCoordinate(a, b)
    },
    getDateFromY: function (b, a) {
        return this.getDateFromCoordinate(b, a)
    },
    getCoordinateFromDate: function (a, b) {
        var c = this.timeAxisViewModel.getPositionFromDate(a);
        if (b === false) {
            c = this[this.orientation].translateToPageCoordinate(c)
        }
        return Math.round(c)
    },
    getXFromDate: function (a, b) {
        return this.getCoordinateFromDate(a, b)
    },
    getYFromDate: function (a, b) {
        return this.getCoordinateFromDate(a, b)
    },
    getTimeSpanDistance: function (a, b) {
        return this.timeAxisViewModel.getDistanceBetweenDates(a, b)
    },
    getTimeSpanRegion: function (a, b) {
        return this[this.orientation].getTimeSpanRegion(a, b)
    },
    getScheduleRegion: function (b, a) {
        return this[this.orientation].getScheduleRegion(b, a)
    },
    getTableRegion: function () {
        throw "Abstract method call"
    },
    getRowNode: function (a) {
        throw "Abstract method call"
    },
    getRecordForRowNode: function (a) {
        throw "Abstract method call"
    },
    getVisibleDateRange: function () {
        return this[this.orientation].getVisibleDateRange()
    },
    setColumnWidth: function (b, a) {
        this[this.orientation].setColumnWidth(b, a)
    },
    findRowByChild: function (a) {
        throw "Abstract method call"
    },
    setBarMargin: function (b, a) {
        this.barMargin = b;
        if (!a) {
            this.refreshKeepingScroll()
        }
    },
    getRowHeight: function () {
        return this.timeAxisViewModel.getViewRowHeight()
    },
    setRowHeight: function (a, b) {
        this.timeAxisViewModel.setViewRowHeight(a, b)
    },
    refreshKeepingScroll: function () {
        throw "Abstract method call"
    },
    scrollVerticallyTo: function (b, a) {
        throw "Abstract method call"
    },
    scrollHorizontallyTo: function (a, b) {
        throw "Abstract method call"
    },
    getVerticalScroll: function () {
        throw "Abstract method call"
    },
    getHorizontalScroll: function () {
        throw "Abstract method call"
    },
    getEl: Ext.emptyFn,
    getSecondaryCanvasEl: function () {
        if (!this.rendered) {
            throw "Calling this method too early"
        }
        if (!this.secondaryCanvasEl) {
            this.secondaryCanvasEl = this.getEl().createChild({
                cls: "sch-secondary-canvas"
            })
        }
        return this.secondaryCanvasEl
    },
    getScroll: function () {
        throw "Abstract method call"
    },
    getOuterEl: function () {
        return this.getEl()
    },
    getRowContainerEl: function () {
        return this.getEl()
    },
    getScheduleCell: function (b, a) {
        return this.getCellByPosition({
            row: b,
            column: a
        })
    },
    getScrollEventSource: function () {
        return this.getEl()
    },
    getViewportHeight: function () {
        return this.getEl().getHeight()
    },
    getViewportWidth: function () {
        return this.getEl().getWidth()
    },
    getDateConstraints: Ext.emptyFn
});
Ext.apply(Sch, {
    VERSION: "2.2.19"
});
