Ext.define("Sch.panel.SchedulerTree", {
    extend: "Sch.panel.TimelineTreePanel",
    mixins: ["Sch.mixin.SchedulerPanel"],
    alias: ["widget.schedulertree"],
    viewType: "schedulergridview",
    setOrientation: function() {
        return this.setMode.apply(this, arguments)
    },
    setMode: function(a) {
        if (a !== "horizontal") {
            Ext.Error.raise("Sch.panel.SchedulerTree only support horizontal mode")
        }
    },
    initComponent: function() {
        this.callParent(arguments);
        this.getSchedulingView()._initializeSchedulerView()
    }
}, function() {
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {})
});
