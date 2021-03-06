Ext.define("Sch.plugin.HeaderZoom", {
    extend: "Sch.util.DragTracker",
    mixins: ["Ext.AbstractPlugin"],
    alias: "plugin.scheduler_headerzoom",
    lockableScope: "top",
    scheduler: null,
    proxy: null,
    headerRegion: null,
    init: function(a) {
        this.scheduler = a;
        this.onModeChange();
        a.on("modechange", this.onModeChange, this)
    },
    onOrientationChange: function() {
        return this.onModeChange.apply(this, arguments)
    },
    onModeChange: function() {
        var a = this.scheduler.down("timeaxiscolumn");
        if (a) {
            if (a.rendered) {
                this.onTimeAxisColumnRender(a)
            } else {
                a.on({
                    afterrender: this.onTimeAxisColumnRender,
                    scope: this
                })
            }
        }
    },
    onTimeAxisColumnRender: function(a) {
        this.proxy = a.el.createChild({
            cls: "sch-drag-selector"
        });
        this.initEl(a.el)
    },
    onStart: function(a) {
        this.proxy.show();
        this.headerRegion = this.scheduler.normalGrid.headerCt.getRegion()
    },
    onDrag: function(b) {
        var c = this.headerRegion;
        var a = this.getRegion().constrainTo(c);
        a.top = c.top;
        a.bottom = c.bottom;
        this.proxy.setBox(a)
    },
    onEnd: function(g) {
        if (this.proxy) {
            this.proxy.setDisplayed(false);
            var b = this.scheduler;
            var d = b.timeAxis;
            var f = this.getRegion();
            var c = b.getSchedulingView().timeAxisViewModel.getBottomHeader().unit;
            var a = b.getSchedulingView().getStartEndDatesFromRegion(f);
            b.zoomToSpan({
                start: d.floorDate(a.start, false, c, 1),
                end: d.ceilDate(a.end, false, c, 1)
            })
        }
    },
    destroy: function() {
        if (this.proxy) {
            Ext.destroy(this.proxy);
            this.proxy = null
        }
        this.callParent(arguments)
    }
});
