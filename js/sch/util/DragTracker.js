Ext.define("Sch.util.DragTracker", {
    extend: "Ext.dd.DragTracker",
    xStep: 1,
    yStep: 1,
    constructor: function () {
        this.callParent(arguments);
        this.on("dragstart", function () {
            var a = this.el;
            a.on("scroll", this.onMouseMove, this);
            this.on("dragend", function () {
                a.un("scroll", this.onMouseMove, this)
            }, this, {
                single: true
            })
        })
    },
    setXStep: function (a) {
        this.xStep = a
    },
    startScroll: null,
    setYStep: function (a) {
        this.yStep = a
    },
    getRegion: function () {
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
    onMouseDown: function (f, d) {
        if (this.disabled || f.dragTracked) {
            return
        }
        var c = f.getXY(),
            g, b, a = c[0],
            h = c[1];
        if (this.xStep > 1) {
            g = this.el.getX();
            a -= g;
            a = Math.round(a / this.xStep) * this.xStep;
            a += g
        }
        if (this.yStep > 1) {
            b = this.el.getY();
            h -= b;
            h = Math.round(h / this.yStep) * this.yStep;
            h += b
        }
        this.dragTarget = this.delegate ? d : this.handle.dom;
        this.startXY = this.lastXY = [a, h];
        this.startRegion = Ext.fly(this.dragTarget).getRegion();
        this.startScroll = this.el.getScroll();
        if (this.fireEvent("mousedown", this, f) === false || this.fireEvent("beforedragstart", this, f) === false || this.onBeforeStart(f) === false) {
            return
        }
        this.mouseIsDown = true;
        f.dragTracked = true;
        if (this.preventDefault !== false) {
            f.preventDefault()
        }
        Ext.getDoc().on({
            scope: this,
            mouseup: this.onMouseUp,
            mousemove: this.onMouseMove,
            selectstart: this.stopSelect
        });
        if (this.autoStart) {
            this.timer = Ext.defer(this.triggerStart, this.autoStart === true ? 1000 : this.autoStart, this, [f])
        }
    },
    onMouseMove: function (g, f) {
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
