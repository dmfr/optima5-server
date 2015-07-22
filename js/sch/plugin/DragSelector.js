Ext.define("Sch.plugin.DragSelector", {
    extend: "Sch.util.DragTracker",
    alias: "plugin.scheduler_dragselector",
    mixins: ["Ext.AbstractPlugin"],
    requires: ["Sch.util.ScrollManager"],
    lockableScope: "top",
    schedulerView: null,
    eventData: null,
    sm: null,
    proxy: null,
    bodyRegion: null,
    constructor: function(a) {
        a = a || {};
        Ext.applyIf(a, {
            onBeforeStart: this.onBeforeStart,
            onStart: this.onStart,
            onDrag: this.onDrag,
            onEnd: this.onEnd
        });
        this.callParent(arguments)
    },
    init: function(b) {
        var a = this.schedulerView = b.getSchedulingView();
        a.on({
            afterrender: this.onSchedulingViewRender,
            scope: this
        })
    },
    onBeforeStart: function(a) {
        return !a.getTarget(".sch-event") && a.ctrlKey
    },
    onStart: function(b) {
        var c = this.schedulerView;
        this.proxy.show();
        this.bodyRegion = c.getScheduleRegion();
        var a = [];
        c.getEventNodes().each(function(d) {
            a[a.length] = {
                region: d.getRegion(),
                node: d.dom
            }
        });
        this.eventData = a;
        this.sm.deselectAll();
        Sch.util.ScrollManager.activate(c)
    },
    onDrag: function(h) {
        var j = this.sm,
            f = this.eventData,
            b = this.getRegion().constrainTo(this.bodyRegion),
            c, d, a, g;
        this.proxy.setBox(b);
        for (c = 0, a = f.length; c < a; c++) {
            d = f[c];
            g = b.intersect(d.region);
            if (g && !d.selected) {
                d.selected = true;
                j.selectNode(d.node, true)
            } else {
                if (!g && d.selected) {
                    d.selected = false;
                    j.deselectNode(d.node)
                }
            }
        }
    },
    onEnd: function(a) {
        if (this.proxy) {
            this.proxy.setDisplayed(false)
        }
        Sch.util.ScrollManager.deactivate()
    },
    onSchedulingViewRender: function(a) {
        this.sm = a.getEventSelectionModel();
        this.initEl(this.schedulerView.el);
        this.proxy = a.el.createChild({
            cls: "sch-drag-selector"
        })
    },
    destroy: function() {
        if (this.proxy) {
            Ext.destroy(this.proxy)
        }
        this.callParent(arguments)
    }
});
