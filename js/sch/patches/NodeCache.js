    Ext.define("Sch.patches.NodeCache", {
        extend: "Sch.util.Patch",
        requires: ["Ext.view.NodeCache"],
        target: "Ext.view.NodeCache",
        minVersion: "5.1.0",
        overrides: {
            scroll: function(d, c, b) {
                var a;
                if (d.length === 0) {
                    a = []
                } else {
                    a = this.callParent(arguments)
                }
                return a
            }
        }
    });
