Ext.define("Sch.feature.DragDrop", {
    requires: ["Ext.XTemplate", "Sch.feature.SchedulerDragZone"],
    validatorFn: function(b, a, c, f, d) {
        return true
    },
    validatorFnScope: null,
    dragConfig: null,
    constructor: function(b, a) {
        Ext.apply(this, a);
        this.schedulerView = b;
        b.eventDragZone = new Sch.feature.SchedulerDragZone(b.ownerCt.el, Ext.apply({
            ddGroup: b.id,
            schedulerView: b,
            validatorFn: this.validatorFn,
            validatorFnScope: this.validatorFnScope
        }, this.dragConfig));
        this.schedulerView.on("destroy", this.cleanUp, this);
        this.callParent([a])
    },
    cleanUp: function() {
        var a = this.schedulerView;
        if (a.eventDragZone) {
            a.eventDragZone.destroy()
        }
    }
});
