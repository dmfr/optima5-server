Ext.define("Sch.column.Summary", {
    extend: "Ext.grid.column.Column",
    alias: ["widget.summarycolumn", "plugin.scheduler_summarycolumn"],
    mixins: ["Ext.AbstractPlugin"],
    alternateClassName: "Sch.plugin.SummaryColumn",
    init: Ext.emptyFn,
    lockableScope: "top",
    showPercent: false,
    nbrDecimals: 1,
    sortable: false,
    fixed: true,
    menuDisabled: true,
    width: 80,
    dataIndex: "_sch_not_used",
    timeAxis: null,
    eventStore: null,
    constructor: function (a) {
        this.scope = this;
        this.callParent(arguments)
    },
    beforeRender: function () {
        this.callParent(arguments);
        var a = this.up("tablepanel[lockable=true]");
        this.timeAxis = a.getTimeAxis();
        a.lockedGridDependsOnSchedule = true;
        this.eventStore = a.getEventStore()
    },
    renderer: function (j, a, g) {
        var h = this.timeAxis,
            e = this.eventStore,
            f = h.getStart(),
            i = h.getEnd(),
            c = 0,
            b = this.calculate(e.getEventsForResource(g), f, i);
        if (b <= 0) {
            return ""
        }
        if (this.showPercent) {
            var d = Sch.util.Date.getDurationInMinutes(f, i);
            return (Math.round((b * 100) / d)) + " %"
        } else {
            if (b > 1440) {
                return (b / 1440).toFixed(this.nbrDecimals) + " " + Sch.util.Date.getShortNameOfUnit("DAY")
            }
            if (b >= 30) {
                return (b / 60).toFixed(this.nbrDecimals) + " " + Sch.util.Date.getShortNameOfUnit("HOUR")
            }
            return b + " " + Sch.util.Date.getShortNameOfUnit("MINUTE")
        }
    },
    calculate: function (c, g, d) {
        var e = 0,
            b, a, f = Sch.util.Date;
        Ext.each(c, function (h) {
            b = h.getStartDate();
            a = h.getEndDate();
            if (f.intersectSpans(g, d, b, a)) {
                e += f.getDurationInMinutes(f.max(b, g), f.min(a, d))
            }
        });
        return e
    }
});
