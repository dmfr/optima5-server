Ext.define("Sch.plugin.EventTools", {
    extend: "Ext.Container",
    mixins: ["Ext.AbstractPlugin"],
    lockableScope: "top",
    alias: "plugin.scheduler_eventtools",
    hideDelay: 500,
    align: "right",
    defaults: {
        xtype: "tool",
        baseCls: "sch-tool",
        overCls: "sch-tool-over",
        width: 20,
        height: 20,
        visibleFn: Ext.emptyFn
    },
    hideTimer: null,
    lastPosition: null,
    cachedSize: null,
    offset: {
        x: 0,
        y: 1
    },
    autoRender: true,
    floating: true,
    hideMode: "offsets",
    hidden: true,
    getRecord: function () {
        return this.record
    },
    init: function (a) {
        if (!this.items) {
            throw "Must define an items property for this plugin to function correctly"
        }
        this.addCls("sch-event-tools");
        this.scheduler = a;
        a.on({
            eventresizestart: this.onOperationStart,
            eventresizeend: this.onOperationEnd,
            eventdragstart: this.onOperationStart,
            eventdrop: this.onOperationEnd,
            eventmouseenter: this.onEventMouseEnter,
            eventmouseleave: this.onContainerMouseLeave,
            scope: this
        })
    },
    onRender: function () {
        this.callParent(arguments);
        this.scheduler.mon(this.el, {
            mouseenter: this.onContainerMouseEnter,
            mouseleave: this.onContainerMouseLeave,
            scope: this
        })
    },
    onEventMouseEnter: function (g, a, f) {
        var c = false;
        var h;
        this.record = a;
        this.items.each(function (i) {
            h = i.visibleFn(a) !== false;
            i.setVisible(h);
            if (h) {
                c = true
            }
        }, this);
        if (!c) {
            return
        }
        if (!this.rendered) {
            this.doAutoRender()
        }
        var e = f.getTarget(g.eventSelector);
        var d = Ext.fly(e).getBox();
        this.doLayout();
        var b = this.getSize();
        this.lastPosition = [f.getXY()[0] - (b.width / 2), d.y - b.height - this.offset.y];
        this.onContainerMouseEnter()
    },
    onContainerMouseEnter: function () {
        window.clearTimeout(this.hideTimer);
        this.setPosition.apply(this, this.lastPosition);
        this.show()
    },
    onContainerMouseLeave: function () {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = Ext.defer(this.hide, this.hideDelay, this)
    },
    onOperationStart: function () {
        this.scheduler.un("eventmouseenter", this.onEventMouseEnter, this);
        window.clearTimeout(this.hideTimer);
        this.hide()
    },
    onOperationEnd: function () {
        this.scheduler.on("eventmouseenter", this.onEventMouseEnter, this)
    }
});
