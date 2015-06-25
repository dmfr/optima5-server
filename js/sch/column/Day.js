Ext.define("Sch.column.Day", {
    extend: "Ext.grid.column.Column",
    alias: "widget.weekview-day",
    align: "center",
    start: null,
    end: null,
    draggable: false,
    groupable: false,
    hideable: false,
    sortable: false,
    menuDisabled: true,
    enableLocking: false,
    flex: 1,
    resizable: false,
    tdCls: "sch-timetd",
    initComponent: function() {
        var a = new Date();
        this.addCls("sch-daycolumn-header");
        if (this.isWeekend()) {
            this.addCls("sch-daycolumn-header-weekend");
            this.tdCls = (this.tdCls || "") + " sch-daycolumn-weekend"
        }
        if (this.start.getDate() === a.getDate() && this.start.getMonth() === a.getMonth() && this.start.getYear() === a.getYear()) {
            this.addCls("sch-daycolumn-header-today");
            this.tdCls = (this.tdCls || "") + " sch-daycolumn-today"
        }
        this.callParent(arguments)
    },
    isWeekend: function() {
        var a = this.start.getDay();
        return a === 6 || a === 0
    }
});
