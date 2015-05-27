Ext.define("Sch.view.TimelineGridView", {
    extend: "Ext.grid.View",
    mixins: ["Sch.mixin.TimelineView"],
    infiniteScroll: false,
    bufferCoef: 5,
    bufferThreshold: 0.2,
    cachedScrollLeftDate: null,
    boxIsReady: false,
    ignoreNextHorizontalScroll: false,
    constructor: function (a) {
        this.callParent(arguments);
        if (this.infiniteScroll) {
            this.on("afterrender", this.setupInfiniteScroll, this, {
                single: true
            })
        }
    },
    setupInfiniteScroll: function () {
        var b = this.panel.ownerCt;
        this.cachedScrollLeftDate = b.startDate || this.timeAxis.getStart();
        var a = this;
        b.calculateOptimalDateRange = function (d, c, g, e) {
            if (e) {
                return e
            }
            var f = Sch.preset.Manager.getPreset(g.preset);
            return a.calculateInfiniteScrollingDateRange(d, f.getBottomHeader().unit, g.increment, g.width)
        };
        this.el.on("scroll", this.onHorizontalScroll, this);
        this.on("resize", this.onSelfResize, this)
    },
    onHorizontalScroll: function () {
        if (this.ignoreNextHorizontalScroll || this.cachedScrollLeftDate) {
            this.ignoreNextHorizontalScroll = false;
            return
        }
        var d = this.el.dom,
            c = this.getWidth(),
            b = c * this.bufferThreshold * this.bufferCoef;
        if ((d.scrollWidth - d.scrollLeft - c < b) || d.scrollLeft < b) {
            var a = Ext.dd.ScrollManager;
            this.shiftToDate(this.getDateFromCoordinate(d.scrollLeft, null, true));
            if (a.proc && a.proc.el === this.el) {
                this.el.stopAnimation()
            }
        }
    },
    refresh: function () {
        this.callParent(arguments);
        if (this.infiniteScroll && !this.scrollStateSaved && this.boxIsReady) {
            this.restoreScrollLeftDate()
        }
    },
    onSelfResize: function (c, d, a, b, e) {
        this.boxIsReady = true;
        if (d != b) {
            this.shiftToDate(this.cachedScrollLeftDate || this.timeAxis.getStart(), this.cachedScrollCentered)
        }
    },
    restoreScrollLeftDate: function () {
        if (this.cachedScrollLeftDate && this.boxIsReady) {
            this.ignoreNextHorizontalScroll = true;
            this.scrollToDate(this.cachedScrollLeftDate);
            this.cachedScrollLeftDate = null
        }
    },
    scrollToDate: function (a) {
        this.cachedScrollLeftDate = a;
        if (this.cachedScrollCentered) {
            this.panel.ownerCt.scrollToDateCentered(a)
        } else {
            this.panel.ownerCt.scrollToDate(a)
        }
        var b = this.el.dom.scrollLeft;
        this.panel.scrollLeftPos = b;
        this.headerCt.el.dom.scrollLeft = b
    },
    saveScrollState: function () {
        this.scrollStateSaved = this.boxIsReady;
        this.callParent(arguments)
    },
    restoreScrollState: function () {
        this.scrollStateSaved = false;
        if (this.infiniteScroll && this.cachedScrollLeftDate) {
            this.restoreScrollLeftDate();
            this.el.dom.scrollTop = this.scrollState.top;
            return
        }
        this.callParent(arguments)
    },
    calculateInfiniteScrollingDateRange: function (e, f, b, a) {
        var g = this.timeAxis;
        var d = this.getWidth();
        a = a || this.timeAxisViewModel.getTickWidth();
        b = b || g.increment || 1;
        f = f || g.unit;
        var h = Sch.util.Date;
        var c = Math.ceil(d * this.bufferCoef / a);
        return {
            start: g.floorDate(h.add(e, f, -c * b), false, f, b),
            end: g.ceilDate(h.add(e, f, Math.ceil((d / a + c) * b)), false, f, b)
        }
    },
    shiftToDate: function (b, c) {
        var a = this.calculateInfiniteScrollingDateRange(b);
        this.cachedScrollLeftDate = b;
        this.cachedScrollCentered = c;
        this.timeAxis.setTimeSpan(a.start, a.end)
    },
    destroy: function () {
        if (this.infiniteScroll && this.rendered) {
            this.el.un("scroll", this.onHorizontalScroll, this)
        }
        this.callParent(arguments)
    }
}, function () {
    this.override(Sch.mixin.TimelineView.prototype.inheritables() || {})
});
