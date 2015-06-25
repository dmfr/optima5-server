Ext.define("Sch.column.Resource", {
    extend: "Ext.grid.Column",
    alias: "widget.resourcecolumn",
    align: "center",
    menuDisabled: true,
    hideable: false,
    sortable: false,
    locked: false,
    lockable: false,
    draggable: false,
    enableLocking: false,
    model: null,
    initComponent: function() {
        this.tdCls = (this.tdCls || "") + " sch-timetd";
        this.cls = (this.cls || "") + " sch-resourcecolumn-header";
        this.callParent(arguments)
    }
});
