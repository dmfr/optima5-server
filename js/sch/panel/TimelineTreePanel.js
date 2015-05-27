    Ext.define("Sch.panel.TimelineTreePanel", {
        extend: "Ext.tree.Panel",
        requires: ["Ext.grid.Panel", "Ext.data.TreeStore", "Sch.mixin.FilterableTreeView", "Sch.patches.ColumnResizeTree"],
        mixins: ["Sch.mixin.TimelinePanel"],
        useArrows: true,
        rootVisible: false,
        lockedXType: "treepanel",
        initComponent: function () {
            this.callParent(arguments);
            this.getSchedulingView()._initializeTimelineView()
        }
    }, function () {
        this.override(Sch.mixin.TimelinePanel.prototype.inheritables() || {})
    }) ;

