Ext.define("Sch.feature.ColumnLines", {
    extend: "Sch.plugin.Lines",
    requires: ["Ext.data.JsonStore"],
    cls: "sch-column-line",
    showTip: false,
    timeAxisViewModel: null,
    renderingDoneEvent: "columnlinessynced",
    init: function(a) {
        this.timeAxis = a.getTimeAxis();
        this.timeAxisViewModel = a.timeAxisViewModel;
        this.panel = a;
        this.store = new Ext.data.JsonStore({
            fields: ["Date"]
        });
        this.callParent(arguments);
        a.on({
            modechange: this.populate,
            destroy: this.onHostDestroy,
            scope: this
        });
        this.timeAxisViewModel.on("update", this.populate, this);
        this.populate()
    },
    onHostDestroy: function() {
        this.timeAxisViewModel.un("update", this.populate, this)
    },
    populate: function() {
        this.store.setData(this.getData())
    },
    getElementData: function() {
        var a = this.schedulerView;
        if (a.isHorizontal() && a.store.getCount() > 0) {
            return this.callParent(arguments)
        }
        return []
    },
    getData: function() {
        var a = this.panel,
            m = [];
        if (a.isHorizontal()) {
            var k = this.timeAxisViewModel;
            var g = k.columnLinesFor;
            var e = !!(k.headerConfig && k.headerConfig[g].cellGenerator);
            if (e) {
                var o = k.getColumnConfig()[g];
                for (var d = 1, b = o.length; d < b; d++) {
                    m.push({
                        Date: o[d].start
                    })
                }
            } else {
                var c, j, n = k.getColumnConfig(),
                    f;
                if (g === "bottom") {
                    c = "middle"
                } else {
                    if (g === "middle") {
                        c = "top"
                    }
                }
                j = n[c];
                if (j) {
                    var h = k.headerConfig;
                    if (h[c].increment !== h[g].increment || h[c].unit !== h[g].unit) {
                        f = {};
                        Ext.Array.forEach(j, function(i) {
                            f[i.start.getTime()] = 1
                        })
                    }
                }
                k.forEachInterval(g, function(q, l, p) {
                    if (p > 0) {
                        m.push({
                            Date: q,
                            Cls: f && f[q.getTime()] ? "sch-column-line-solid" : ""
                        })
                    }
                })
            }
        }
        return m
    }
});
