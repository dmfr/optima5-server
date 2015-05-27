Ext.define("Sch.util.ScrollManager", {
    singleton: true,
    vthresh: 25,
    hthresh: 25,
    increment: 100,
    frequency: 500,
    animate: true,
    animDuration: 0.4,
    activeEl: null,
    scrollElRegion: null,
    scrollProcess: {},
    pt: null,
    constructor: function () {
        this.doScroll = Ext.Function.bind(this.doScroll, this)
    },
    triggerRefresh: function () {
        if (this.activeEl) {
            this.refreshElRegion();
            this.clearScrollInterval();
            this.onMouseMove()
        }
    },
    doScroll: function () {
        var a = this.scrollProcess,
            b = a.el;
        b.scroll(a.dir[0], this.increment, {
            duration: this.animDuration,
            callback: this.triggerRefresh,
            scope: this
        })
    },
    clearScrollInterval: function () {
        var a = this.scrollProcess;
        if (a.id) {
            clearTimeout(a.id)
        }
        a.id = 0;
        a.el = null;
        a.dir = ""
    },
    startScrollInterval: function (b, a) {
        if (Ext.versions.extjs.isLessThan("4.2.2")) {
            if (a[0] === "r") {
                a = "left"
            } else {
                if (a[0] === "l") {
                    a = "right"
                }
            }
        }
        this.clearScrollInterval();
        this.scrollProcess.el = b;
        this.scrollProcess.dir = a;
        this.scrollProcess.id = setTimeout(this.doScroll, this.frequency)
    },
    onMouseMove: function (d) {
        var k = d ? d.getPoint() : this.pt,
            j = k.x,
            h = k.y,
            f = this.scrollProcess,
            a, b = this.activeEl,
            i = this.scrollElRegion,
            c = b.dom,
            g = this;
        this.pt = k;
        if (i && i.contains(k) && b.isScrollable()) {
            if (i.bottom - h <= g.vthresh && (c.scrollHeight - c.scrollTop - c.clientHeight > 0)) {
                if (f.el != b) {
                    this.startScrollInterval(b, "down")
                }
                return
            } else {
                if (i.right - j <= g.hthresh && (c.scrollWidth - c.scrollLeft - c.clientWidth > 0)) {
                    if (f.el != b) {
                        this.startScrollInterval(b, "right")
                    }
                    return
                } else {
                    if (h - i.top <= g.vthresh && b.dom.scrollTop > 0) {
                        if (f.el != b) {
                            this.startScrollInterval(b, "up")
                        }
                        return
                    } else {
                        if (j - i.left <= g.hthresh && b.dom.scrollLeft > 0) {
                            if (f.el != b) {
                                this.startScrollInterval(b, "left")
                            }
                            return
                        }
                    }
                }
            }
        }
        this.clearScrollInterval()
    },
    refreshElRegion: function () {
        this.scrollElRegion = this.activeEl.getRegion()
    },
    register: function (a) {
        this.activeEl = Ext.get(a);
        this.refreshElRegion();
        this.activeEl.on("mousemove", this.onMouseMove, this)
    },
    unregister: function (a) {
        this.clearScrollInterval();
        this.activeEl.un("mousemove", this.onMouseMove, this);
        this.activeEl = this.scrollElRegion = null
    }
});
