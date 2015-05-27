Ext.define("Sch.feature.ColumnLines", {
    extend: "Sch.plugin.Lines",
    requires: ["Ext.data.JsonStore"],
    cls: "sch-column-line",
    showTip: false,
    timeAxisViewModel: null,
    renderingDoneEvent: "columnlinessynced",
    init: function (a) {
        this.timeAxis = a.getTimeAxis();
        this.timeAxisViewModel = a.timeAxisViewModel;
        this.panel = a;
        this.store = new Ext.data.JsonStore({
            fields: ["Date"]
        });
        this.store.loadData = this.store.loadData || this.store.setData;
        this.callParent(arguments);
        a.on({
            orientationchange: this.populate,
            destroy: this.onHostDestroy,
            scope: this
        });
        this.timeAxisViewModel.on("update", this.populate, this);
        this.populate()
    },
    onHostDestroy: function () {
        this.timeAxisViewModel.un("update", this.populate, this)
    },
    populate: function () {
        this.store.loadData(this.getData())
    },
    getElementData: function () {
        var a = this.schedulerView;
        if (a.isHorizontal() && a.store.getCount() > 0) {
            return this.callParent(arguments)
        }
        return []
    },
    getData: function () {
        var b = this.panel,
            g = [];
        if (b.isHorizontal()) {
            var h = this.timeAxisViewModel;
            var e = h.columnLinesFor;
            var f = !! (h.headerConfig && h.headerConfig[e].cellGenerator);
            if (f) {
                var c = h.getColumnConfig()[e];
                for (var d = 1, a = c.length; d < a; d++) {
                    g.push({
                        Date: c[d].start
                    })
                }
            } else {
                h.forEachInterval(e, function (l, j, k) {
                    if (k > 0) {
                        g.push({
                            Date: l
                        })
                    }
                })
            }
        }
        return g
    }
});
