Ext.define("Sch.column.Resource", {
    extend: "Ext.grid.Column",
    alias: "widget.resourcecolumn",
    cls: "sch-resourcecolumn-header",
    align: "center",
    menuDisabled: true,
    hideable: false,
    sortable: false,
    locked: false,
    lockable: false,
    draggable: false,
    enableLocking: false,
    tdCls: "sch-timetd",
    model: null
});

