Ext.define("Sch.feature.DragDrop", {
    requires: ["Ext.XTemplate", "Sch.feature.SchedulerDragZone"],
    validatorFn: function (b, a, c, f, d) {
        return true
    },
    validatorFnScope: null,
    dragConfig: null,
    eventDragZone: null,
    constructor: function (d, a) {
        Ext.apply(this, a);
        this.schedulerView = d;
        var b = !! document.elementFromPoint;
        if (b) {
            this.initProxyLessDD()
        } else {
            if (typeof console !== "undefined") {
                var e = console;
                e.log("WARNING: Your browser does not support document.elementFromPoint required for the Drag drop feature")
            }
        }
        this.schedulerView.on("destroy", this.cleanUp, this);
        this.callParent([a])
    },
    cleanUp: function () {
        var a = this.schedulerView;
        if (a.eventDragZone) {
            a.eventDragZone.destroy()
        }
        if (a.dropZone) {
            a.dropZone.destroy()
        }
    },
    initProxyLessDD: function () {
        var a = this.schedulerView;
        a.eventDragZone = new Sch.feature.SchedulerDragZone(a.ownerCt.el, Ext.apply({
            ddGroup: a.id,
            schedulerView: a,
            validatorFn: this.validatorFn,
            validatorFnScope: this.validatorFnScope
        }, this.dragConfig))
    }
});
