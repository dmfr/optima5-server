Ext.define("Sch.panel.SchedulerGrid", {
    extend: "Sch.panel.TimelineGridPanel",
    mixins: ["Sch.mixin.SchedulerPanel"],
    alias: ["widget.schedulergrid", "widget.schedulerpanel"],
    alternateClassName: "Sch.SchedulerPanel",
    viewType: "schedulergridview",
    initComponent: function() {
        this.callParent(arguments);
        this.getSchedulingView()._initializeSchedulerView()
    }
}, function() {
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {})
});
