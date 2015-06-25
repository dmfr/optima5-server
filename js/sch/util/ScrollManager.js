Ext.define("Sch.util.ScrollManager", {
    singleton: true,
    vthresh: 25,
    hthresh: 25,
    increment: 100,
    frequency: 500,
    animate: true,
    animDuration: 200,
    activeCmp: null,
    activeEl: null,
    targetScroller: null,
    scrollElRegion: null,
    scrollProcess: {},
    pt: null,
    scrollWidth: null,
    scrollHeight: null,
    direction: "both",
    constructor: function() {
        this.doScroll = Ext.Function.bind(this.doScroll, this)
    },
    triggerRefresh: function() {
        if (this.activeEl) {
            this.refreshElRegion();
            this.clearScrollInterval();
            this.onMouseMove()
        }
    },
    doScroll: function() {
        var f = this.scrollProcess,
            e = f.cmp,
            d = f.dir[0],
            b = this.increment,
            h = this.activeCmp.getScrollX(),
            g = this.activeCmp.getScrollY();
        if (d === "r") {
            b = Math.min(b, this.scrollWidth - h - this.activeEl.dom.clientWidth)
        } else {
            if (d === "d") {
                b = Math.min(b, this.scrollHeight - g - this.activeEl.dom.clientHeight)
            }
        }
        b = Math.max(b, 0);
        var c = 0,
            a = 0;
        if (d === "r") {
            c = b
        }
        if (d === "l") {
            c = -b
        }
        if (d === "u") {
            a = -b
        }
        if (d === "d") {
            a = b
        }
        e.scrollBy(c, a, {
            duration: this.animDuration,
            callback: this.triggerRefresh,
            scope: this
        })
    },
    clearScrollInterval: function() {
        var a = this.scrollProcess;
        if (a.id) {
            clearTimeout(a.id)
        }
        a.id = 0;
        a.cmp = null;
        a.dir = ""
    },
    isScrollAllowed: function(a) {
        switch (this.direction) {
            case "both":
                return true;
            case "horizontal":
                return a === "right" || a === "left";
            case "vertical":
                return a === "up" || a === "down";
            default:
                throw "Invalid direction: " + this.direction
        }
    },
    startScrollInterval: function(b, a) {
        if (!this.isScrollAllowed(a)) {
            return
        }
        this.clearScrollInterval();
        this.scrollProcess.cmp = b;
        this.scrollProcess.dir = a;
        this.scrollProcess.id = setTimeout(this.doScroll, this.frequency)
    },
    onMouseMove: function(g) {
        var n = g ? g.getPoint() : this.pt,
            m = n.x,
            l = n.y,
            h = this.scrollProcess,
            d = this.activeCmp.getScrollX(),
            c = this.activeCmp.getScrollY(),
            a, k = this.activeCmp,
            b = this.activeEl,
            j = this.scrollElRegion,
            f = b.dom,
            i = this;
        this.pt = n;
        if (j && j.contains(n) && b.isScrollable()) {
            if (j.bottom - l <= i.vthresh && (this.scrollHeight - c - f.clientHeight > 0)) {
                if (h.cmp != k) {
                    this.startScrollInterval(this.activeCmp, "down")
                }
                return
            } else {
                if (j.right - m <= i.hthresh && (this.scrollWidth - d - f.clientWidth > 0)) {
                    if (h.cmp != k) {
                        this.startScrollInterval(this.activeCmp, "right")
                    }
                    return
                } else {
                    if (l - j.top <= i.vthresh && c > 0) {
                        if (h.cmp != k) {
                            this.startScrollInterval(this.activeCmp, "up")
                        }
                        return
                    } else {
                        if (m - j.left <= i.hthresh && d > 0) {
                            if (h.cmp != k) {
                                this.startScrollInterval(this.activeCmp, "left")
                            }
                            return
                        }
                    }
                }
            }
        }
        this.clearScrollInterval()
    },
    refreshElRegion: function() {
        this.scrollElRegion = this.activeEl.getRegion()
    },
    activate: function(a, b) {
        this.direction = b || "both";
        this.activeCmp = a;
        this.activeEl = a.getEl();
        if (a.scrollManager) {
            this.targetScroller = a.scrollManager.scroller;
            this.scrollWidth = this.targetScroller.getMaxPosition().x;
            this.scrollHeight = this.targetScroller.getMaxPosition().y
        } else {
            this.scrollWidth = this.activeEl.dom.scrollWidth;
            this.scrollHeight = this.activeEl.dom.scrollHeight
        }
        this.refreshElRegion();
        this.activeEl.on("mousemove", this.onMouseMove, this)
    },
    deactivate: function() {
        this.clearScrollInterval();
        this.activeEl.un("mousemove", this.onMouseMove, this);
        this.targetScroller = this.activeEl = this.activeCmp = this.scrollElRegion = this.scrollWidth = this.scrollHeight = null;
        this.direction = "both"
    }
});
