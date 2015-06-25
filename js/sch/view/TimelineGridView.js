Ext.define("Sch.view.TimelineGridView", {
    extend: "Ext.grid.View",
    mixins: ["Sch.mixin.TimelineView"],
    infiniteScroll: false,
    bufferCoef: 5,
    bufferThreshold: 0.2,
    cachedScrollLeftDate: null,
    boxIsReady: false,
    ignoreNextHorizontalScroll: false,
    constructor: function(a) {
        this.callParent(arguments);
        if (this.infiniteScroll) {
            this.on("boxready", this.setupInfiniteScroll, this)
        }
        if (this.timeAxisViewModel) {
            this.relayEvents(this.timeAxisViewModel, ["columnwidthchange"])
        }
    },
    indexInStore: function(a) {
        if (a instanceof Ext.data.Model) {
            return this.indexOf(a)
        } else {
            return this.indexOf(this.getRecord(a))
        }
    },
    setupInfiniteScroll: function() {
        var f = this.panel.ownerCt;
        this.cachedScrollLeftDate = f.startDate || this.timeAxis.getStart();
        if (Ext.supports.Touch && Ext.os.is.Windows) {
            var a = this.panel.headerCt.scrollable;
            var b = this.scrollable;
            try {
                Ext.GlobalEvents.un("idle", a.onIdle, a);
                Ext.GlobalEvents.un("idle", b.onIdle, b)
            } catch (d) {
                Ext.log("Cannot unsubscribe required listener, zooming may be broken")
            }
        }
        var c = this;
        f.calculateOptimalDateRange = function(g, e, j, h) {
            if (h) {
                return h
            }
            var i = Sch.preset.Manager.getPreset(j.preset);
            return c.calculateInfiniteScrollingDateRange(g, i.getBottomHeader().unit, j.increment, j.width)
        };
        this.bindInfiniteScrollListeners()
    },
    bindInfiniteScrollListeners: function() {
        if (this.scrollManager) {
            this.scrollManager.scroller.on("scroll", this.onHorizontalScroll, this)
        } else {
            this.el.on("scroll", this.onHorizontalScroll, this)
        }
        this.on("resize", this.onSelfResize, this)
    },
    unbindInfiniteScrollListeners: function() {
        if (this.scrollManager) {
            this.scrollManager.scroller.un("scroll", this.onHorizontalScroll, this)
        } else {
            this.el.un("scroll", this.onHorizontalScroll, this)
        }
        this.un("resize", this.onSelfResize, this)
    },
    onHorizontalScroll: function() {
        if (this.ignoreNextHorizontalScroll || this.cachedScrollLeftDate) {
            this.ignoreNextHorizontalScroll = false;
            return
        }
        var e = this.el.dom,
            c = this.getWidth(),
            d = this.getScroll().left,
            b = this.scrollManager ? this.scrollManager.scroller.getMaxPosition().x : e.scrollWidth,
            a = c * this.bufferThreshold * this.bufferCoef;
        if ((b - d - c < a) || d < a) {
            this.shiftToDate(this.getDateFromCoordinate(d, null, true));
            this.el.stopAnimation()
        }
    },
    refresh: function() {
        this.callParent(arguments);
        if (this.infiniteScroll && !this.scrollStateSaved && this.boxIsReady) {
            this.restoreScrollLeftDate()
        }
    },
    onSelfResize: function(c, d, a, b, e) {
        this.boxIsReady = true;
        if (d !== b) {
            this.shiftToDate(this.cachedScrollLeftDate || this.getVisibleDateRange().startDate, this.cachedScrollCentered)
        }
    },
    restoreScrollLeftDate: function() {
        if (this.cachedScrollLeftDate && this.boxIsReady) {
            this.ignoreNextHorizontalScroll = true;
            this.scrollToDate(this.cachedScrollLeftDate);
            this.cachedScrollLeftDate = null
        }
    },
    scrollToDate: function(a) {
        this.cachedScrollLeftDate = a;
        if (this.cachedScrollCentered) {
            this.panel.ownerCt.scrollToDateCentered(a)
        } else {
            this.panel.ownerCt.scrollToDate(a)
        }
        var b = this.getScroll().left;
        this.panel.scrollLeftPos = b;
        this.headerCt.el.dom.scrollLeft = b
    },
    saveScrollState: function() {
        this.scrollStateSaved = this.boxIsReady;
        this.callParent(arguments)
    },
    restoreScrollState: function() {
        this.scrollStateSaved = false;
        if (this.infiniteScroll && this.cachedScrollLeftDate) {
            this.restoreScrollLeftDate();
            this.el.dom.scrollTop = this.scrollState.top;
            return
        }
        this.callParent(arguments)
    },
    calculateInfiniteScrollingDateRange: function(e, f, b, a) {
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
    shiftToDate: function(c, b) {
        var a = this.calculateInfiniteScrollingDateRange(c);
        this.cachedScrollLeftDate = c;
        this.cachedScrollCentered = b;
        this.timeAxis.setTimeSpan(a.start, a.end)
    },
    destroy: function() {
        if (this.infiniteScroll && this.rendered) {
            this.unbindInfiniteScrollListeners()
        }
        this.callParent(arguments)
    }
});
