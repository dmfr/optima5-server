Ext.define("Sch.util.DragTracker", {
    extend: "Ext.dd.DragTracker",
    requires: ["Ext.util.Region"],
    xStep: 1,
    yStep: 1,
    deferredActivation: 0,
    constructor: function() {
        this.callParent(arguments);
        this.on("dragstart", function() {
            var b = this.el;
            var a = {
                scroll: this.onMouseMove,
                pinchstart: this.onMouseUp,
                scope: this
            };
            b.on(a);
            this.on("dragend", function() {
                b.un(a)
            }, this, {
                single: true
            })
        });
        this.moveListener = {
            pinchstart: this.abortWait,
            touchend: this.abortWait,
            mouseup: this.abortWait,
            mousemove: this.onMoveWhileWaiting,
            scope: this,
            capture: true
        }
    },
    setXStep: function(a) {
        this.xStep = a
    },
    startScroll: null,
    deferTimer: null,
    deferTolerance: 10,
    moveListener: null,
    setYStep: function(a) {
        this.yStep = a
    },
    onMoveWhileWaiting: function(d, a) {
        var c = d.getXY();
        var b = this.startXY;
        if (Math.max(Math.abs(b[0] - c[0]), Math.abs(b[1] - c[1])) > this.deferTolerance) {
            this.abortWait();
            this.onMouseUp(d)
        }
    },
    abortWait: function() {
        clearTimeout(this.deferTimer);
        this.deferTimer = null;
        Ext.getDoc().un(this.moveListener)
    },
    getRegion: function() {
        var j = this.startXY,
            f = this.el.getScroll(),
            l = this.getXY(),
            c = l[0],
            b = l[1],
            h = f.left - this.startScroll.left,
            m = f.top - this.startScroll.top,
            i = j[0] - h,
            g = j[1] - m,
            e = Math.min(i, c),
            d = Math.min(g, b),
            a = Math.abs(i - c),
            k = Math.abs(g - b);
        return new Ext.util.Region(d, e + a, d + k, e)
    },
    onMouseDown: function(c, b) {
        if (c.event.touches && c.event.touches.length > 1) {
            return
        }
        c.stopPropagation = Ext.emptyFn;
        this.startXY = c.getXY();
        if (this.deferredActivation) {
            var a = this;
            Ext.getDoc().on(this.moveListener);
            this.deferTimer = setTimeout(function() {
                var d = a.deferredActivation;
                Ext.getDoc().un(a.moveListener);
                a.deferredActivation = false;
                a.onMouseDown(c, b);
                a.deferredActivation = d
            }, this.deferredActivation);
            return
        }
        this.callParent([c, b]);
        this.lastXY = this.startXY;
        this.startScroll = this.el.getScroll()
    },
    onMouseMove: function(g, f) {
        if (this.active && g.type === "mousemove" && Ext.isIE9m && !g.browserEvent.button) {
            g.preventDefault();
            this.onMouseUp(g);
            return
        }
        g.preventDefault();
        var d = g.type === "scroll" ? this.lastXY : g.getXY(),
            b = this.startXY;
        if (!this.active) {
            if (Math.max(Math.abs(b[0] - d[0]), Math.abs(b[1] - d[1])) > this.tolerance) {
                this.triggerStart(g)
            } else {
                return
            }
        }
        var a = d[0],
            h = d[1];
        if (this.xStep > 1) {
            a -= this.startXY[0];
            a = Math.round(a / this.xStep) * this.xStep;
            a += this.startXY[0]
        }
        if (this.yStep > 1) {
            h -= this.startXY[1];
            h = Math.round(h / this.yStep) * this.yStep;
            h += this.startXY[1]
        }
        var c = this.xStep > 1 || this.yStep > 1;
        if (!c || a !== d[0] || h !== d[1]) {
            this.lastXY = [a, h];
            if (this.fireEvent("mousemove", this, g) === false) {
                this.onMouseUp(g)
            } else {
                this.onDrag(g);
                this.fireEvent("drag", this, g)
            }
        }
    }
});
