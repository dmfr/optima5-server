Ext.define("Sch.panel.SchedulerTree", {
    extend: "Sch.panel.TimelineTreePanel",
    mixins: ["Sch.mixin.SchedulerPanel"],
    alias: ["widget.schedulertree"],
    viewType: "schedulergridview",
    setOrientation: function (a) {
        if (a == "vertical") {
            Ext.Error.raise("Sch.panel.SchedulerTree does not support vertical orientation")
        }
    },
    initComponent: function () {
        this.callParent(arguments);
        this.getSchedulingView()._initializeSchedulerView()
    }
}, function () {
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {})
});
