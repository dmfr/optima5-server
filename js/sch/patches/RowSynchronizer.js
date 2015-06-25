    Ext.define("Sch.patches.RowSynchronizer", {
        extend: "Sch.util.Patch",
        requires: ["Ext.grid.locking.RowSynchronizer"],
        target: "Ext.grid.locking.RowSynchronizer",
        minVersion: "5.1.0",
        overrides: Ext.versions.extjs.isGreaterThan("5.1.0") ? {
            finish: function(a) {
                if (!a) {
                    return
                }
                return this.callParent(arguments)
            }
        } : {}
    });
