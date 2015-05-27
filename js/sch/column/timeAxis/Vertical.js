Ext.define("Sch.column.timeAxis.Vertical", {
    extend: "Ext.grid.column.Column",
    alias: "widget.verticaltimeaxis",
    align: "right",
    draggable: false,
    groupable: false,
    hideable: false,
    sortable: false,
    menuDisabled: true,
    timeAxis: null,
    timeAxisViewModel: null,
    cellTopBorderWidth: null,
    cellBottomBorderWidth: null,
    totalBorderWidth: null,
    enableLocking: false,
    locked: true,
    initComponent: function () {
        this.callParent(arguments);
        this.tdCls = (this.tdCls || "") + " sch-verticaltimeaxis-cell";
        this.scope = this;
        this.totalBorderWidth = this.cellTopBorderWidth + this.cellBottomBorderWidth
    },
    afterRender: function () {
        this.callParent(arguments);
        var a = this.up("panel");
        a.getView().on("resize", this.onContainerResize, this)
    },
    onContainerResize: function (c, b, a) {
        this.timeAxisViewModel.update(a - 21)
    },
    renderer: function (d, b, a, e) {
        var c = this.timeAxisViewModel.getBottomHeader();
        b.style = "height:" + (this.timeAxisViewModel.getTickWidth() - this.totalBorderWidth) + "px";
        if (c.renderer) {
            return c.renderer.call(c.scope || this, a.data.start, a.data.end, b, e)
        } else {
            return Ext.Date.format(a.data.start, c.dateFormat)
        }
    }
});
