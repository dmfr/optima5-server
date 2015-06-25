    Ext.define("Sch.patches.BufferedRenderer", {
        extend: "Sch.util.Patch",
        requires: ["Ext.grid.plugin.BufferedRenderer"],
        target: "Ext.grid.plugin.BufferedRenderer",
        overrides: {
            onRangeFetched: function() {
                this.tableTopBorderWidth = this.tableTopBorderWidth || 0;
                return this.callParent(arguments)
            },
            refreshSize: function(d, b) {
                var c = this,
                    a = c.view;
                if (a.body.dom) {
                    this.callParent(arguments)
                }
            }
        }
    });
