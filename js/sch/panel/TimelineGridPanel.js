Ext.define("Sch.panel.TimelineGridPanel", {
    extend: "Ext.grid.Panel",
    mixins: ["Sch.mixin.TimelinePanel"],
    subGridXType: "gridpanel",
    requires: ["Sch.patches.ColumnResize"],
    initComponent: function () {
        this.callParent(arguments);
        this.getSchedulingView()._initializeTimelineView()
    }
}, function () {
    this.override(Sch.mixin.TimelinePanel.prototype.inheritables() || {})
});

