Ext.define("Sch.field.CellEditor", {
    extend: "Ext.form.field.Text",
    alias: "widget.celleditorfield",
    hidden: true,
    enableKeyEvents: true,
    divider: "-",
    dateFormat: "H",
    getErrors: function(c) {
        var b = this,
            a = b.callParent(arguments);
        if (c == null) {
            return a
        }
        var d = this.getDates(c);
        if (!d[0]) {
            a.push("Start date is incorrect")
        }
        if (!d[1]) {
            a.push("End date is incorrect")
        }
        if (d[1] - d[0] < 0) {
            a.push("Start date is less then end date")
        }
        return a
    },
    getDates: function(e) {
        var d = this;
        var b = e.split(d.divider);
        var f, a;
        if (Ext.isArray(d.dateFormat)) {
            for (var c = 0; c < d.dateFormat.length; c++) {
                f = f || Ext.Date.parse(b[0], d.dateFormat[c]);
                a = a || Ext.Date.parse(b[1], d.dateFormat[c])
            }
        } else {
            f = Ext.Date.parse(b[0], d.dateFormat);
            a = Ext.Date.parse(b[1], d.dateFormat)
        }
        if (!f || !a) {
            return []
        }
        if (d.record) {
            f = Sch.util.Date.mergeDates(d.record.getStartDate(), f, d.bottomUnit);
            a = Sch.util.Date.mergeDates(d.record.getEndDate(), a, d.bottomUnit)
        } else {
            f = Sch.util.Date.mergeDates(d.startDate, f, d.bottomUnit);
            a = Sch.util.Date.mergeDates(d.startDate, a, d.bottomUnit)
        }
        return [f, a]
    }
});
