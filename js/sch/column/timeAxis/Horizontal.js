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
    afterRender: function() {
        var b = this;
        var a = b.titleEl.createChild({
            cls: "sch-horizontaltimeaxis-ct"
        });
        b.headerView = new Sch.view.HorizontalTimeAxis({
            model: b.timeAxisViewModel,
            containerEl: a,
            hoverCls: b.ownHoverCls,
            trackHeaderOver: b.trackHeaderOver,
            compactCellWidthThreshold: b.compactCellWidthThreshold
        });
        b.headerView.on("refresh", b.onTimeAxisViewRefresh, b);
        b.ownerCt.on("afterlayout", function() {
            if (!b.ownerCt) {
                return
            }
            b.mon(b.ownerCt, "resize", b.onHeaderContainerResize, b);
            if (this.getWidth() > 0) {
                if (b.getAvailableWidthForSchedule() === b.timeAxisViewModel.getAvailableWidth()) {
                    b.headerView.render()
                } else {
                    b.timeAxisViewModel.update(b.getAvailableWidthForSchedule())
                }
                b.setWidth(b.timeAxisViewModel.getTotalWidth())
            }
        }, null, {
            single: true
        });
        this.enableBubble("timeheaderclick", "timeheaderdblclick", "timeheadercontextmenu");
        b.relayEvents(b.headerView, ["timeheaderclick", "timeheaderdblclick", "timeheadercontextmenu"]);
        b.callParent(arguments);
        b.focusable = false
    },
    initRenderData: function() {
        var a = this;
        a.renderData.headerCls = a.renderData.headerCls || a.headerCls;
        return a.callParent(arguments)
    },
    destroy: function() {
        if (this.headerView) {
            this.headerView.destroy()
        }
        this.callParent(arguments)
    },
    onTimeAxisViewRefresh: function() {
        this.headerView.un("refresh", this.onTimeAxisViewRefresh, this);
        this.setWidth(this.timeAxisViewModel.getTotalWidth());
        this.headerView.on("refresh", this.onTimeAxisViewRefresh, this)
    },
    getAvailableWidthForSchedule: function() {
        var d = this.ownerCt.isVisible(true) ? this.ownerCt.getWidth() : (this.ownerCt.lastBox && this.ownerCt.lastBox.width || 0),
            a = this.ownerCt.items,
            c;
        for (var b = 1; b < a.length; b++) {
            c = a.get(b);
            if (!c.hidden) {
                d -= c.isVisible(true) ? c.getWidth() : (c.lastBox && c.lastBox.width || 0)
            }
        }
        return d - Ext.getScrollbarSize().width - 1
    },
    onResize: function() {
        this.callParent(arguments);
        this.timeAxisViewModel.setAvailableWidth(this.getAvailableWidthForSchedule())
    },
    onHeaderContainerResize: function() {
        this.timeAxisViewModel.setAvailableWidth(this.getAvailableWidthForSchedule());
        this.headerView.render()
    },
    refresh: function() {
        this.timeAxisViewModel.update(null, true);
        this.headerView.render()
    }
});
