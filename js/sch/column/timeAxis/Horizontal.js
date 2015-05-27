Ext.define("Sch.column.timeAxis.Horizontal", {
    extend: "Ext.grid.column.Column",
    alias: "widget.timeaxiscolumn",
    draggable: false,
    groupable: false,
    hideable: false,
    sortable: false,
    fixed: true,
    menuDisabled: true,
    cls: "sch-simple-timeaxis",
    tdCls: "sch-timetd",
    enableLocking: false,
    requires: ["Sch.view.HorizontalTimeAxis"],
    timeAxisViewModel: null,
    headerView: null,
    hoverCls: "",
    ownHoverCls: "sch-column-header-over",
    trackHeaderOver: true,
    compactCellWidthThreshold: 20,
    initComponent: function () {
        this.callParent(arguments)
    },
    afterRender: function () {
        var a = this;
        a.headerView = new Sch.view.HorizontalTimeAxis({
            model: a.timeAxisViewModel,
            containerEl: a.titleEl,
            hoverCls: a.ownHoverCls,
            trackHeaderOver: a.trackHeaderOver,
            compactCellWidthThreshold: a.compactCellWidthThreshold
        });
        a.headerView.on("refresh", a.onTimeAxisViewRefresh, a);
        a.ownerCt.on("afterlayout", function () {
            a.mon(a.ownerCt, "resize", a.onHeaderContainerResize, a);
            if (this.getWidth() > 0) {
                if (a.getAvailableWidthForSchedule() === a.timeAxisViewModel.getAvailableWidth()) {
                    a.headerView.render()
                } else {
                    a.timeAxisViewModel.update(a.getAvailableWidthForSchedule())
                }
                a.setWidth(a.timeAxisViewModel.getTotalWidth())
            }
        }, null, {
            single: true
        });
        this.enableBubble("timeheaderclick", "timeheaderdblclick", "timeheadercontextmenu");
        a.relayEvents(a.headerView, ["timeheaderclick", "timeheaderdblclick", "timeheadercontextmenu"]);
        a.callParent(arguments)
    },
    initRenderData: function () {
        var a = this;
        a.renderData.headerCls = a.renderData.headerCls || a.headerCls;
        return a.callParent(arguments)
    },
    destroy: function () {
        if (this.headerView) {
            this.headerView.destroy()
        }
        this.callParent(arguments)
    },
    onTimeAxisViewRefresh: function () {
        this.headerView.un("refresh", this.onTimeAxisViewRefresh, this);
        this.setWidth(this.timeAxisViewModel.getTotalWidth());
        this.headerView.on("refresh", this.onTimeAxisViewRefresh, this)
    },
    getAvailableWidthForSchedule: function () {
        var c = this.ownerCt.getWidth();
        var a = this.ownerCt.items;
        for (var b = 1; b < a.length; b++) {
            c -= a.get(b).getWidth()
        }
        return c - Ext.getScrollbarSize().width - 1
    },
    onResize: function () {
        this.callParent(arguments);
        this.timeAxisViewModel.setAvailableWidth(this.getAvailableWidthForSchedule())
    },
    onHeaderContainerResize: function () {
        this.timeAxisViewModel.setAvailableWidth(this.getAvailableWidthForSchedule());
        this.headerView.render()
    },
    refresh: function () {
        this.timeAxisViewModel.update(null, true);
        this.headerView.render()
    }
});
