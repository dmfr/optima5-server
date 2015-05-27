Ext.define("Sch.plugin.Pan", {
    extend: "Ext.AbstractPlugin",
    alias: "plugin.scheduler_pan",
    lockableScope: "top",
    enableVerticalPan: true,
    statics: {
        KEY_SHIFT: 1,
        KEY_CTRL: 2,
        KEY_ALT: 4,
        KEY_ALL: 7
    },
    disableOnKey: 0,
    panel: null,
    constructor: function (a) {
        Ext.apply(this, a)
    },
    init: function (a) {
        this.panel = a.normalGrid || a;
        this.view = a.getSchedulingView();
        this.view.on("afterrender", this.onRender, this)
    },
    onRender: function (a) {
        this.view.el.on("mousedown", this.onMouseDown, this)
    },
    onMouseDown: function (d, c) {
        var b = this.self,
            a = this.disableOnKey;
        if ((d.shiftKey && (a & b.KEY_SHIFT)) || (d.ctrlKey && (a & b.KEY_CTRL)) || (d.altKey && (a & b.KEY_ALT))) {
            return
        }
        if (d.getTarget("." + this.view.timeCellCls, 10) && !d.getTarget(this.view.eventSelector)) {
            this.mouseX = d.getPageX();
            this.mouseY = d.getPageY();
            Ext.getBody().on("mousemove", this.onMouseMove, this);
            Ext.getDoc().on("mouseup", this.onMouseUp, this);
            if (Ext.isIE || Ext.isGecko) {
                Ext.getBody().on("mouseenter", this.onMouseUp, this)
            }
            d.stopEvent()
        }
    },
    onMouseMove: function (d) {
        d.stopEvent();
        var a = d.getPageX(),
            f = d.getPageY(),
            c = a - this.mouseX,
            b = f - this.mouseY;
        this.panel.scrollByDeltaX(-c);
        this.mouseX = a;
        this.mouseY = f;
        if (this.enableVerticalPan) {
            this.panel.scrollByDeltaY(-b)
        }
    },
    onMouseUp: function (a) {
        Ext.getBody().un("mousemove", this.onMouseMove, this);
        Ext.getDoc().un("mouseup", this.onMouseUp, this);
        if (Ext.isIE || Ext.isGecko) {
            Ext.getBody().un("mouseenter", this.onMouseUp, this)
        }
    }
});
