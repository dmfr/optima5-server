    Ext.define("Sch.patches.TreeStore", {
        extend: "Sch.util.Patch",
        requires: ["Ext.data.TreeStore"],
        target: "Ext.data.TreeStore",
        minVersion: "5.1.0",
        overrides: {
            getRejectRecords: function() {
                return this.getModifiedRecords()
            },
            rejectChanges: function() {
                this.removed = this.removedNodes;
                this.callParent(arguments)
            },
            remove: function(b) {
                if (b.isModel) {
                    b.remove()
                } else {
                    if (b instanceof Array && b[0].isModel) {
                        for (var a = 0; a < b.length; a++) {
                            b[a].remove()
                        }
                    } else {
                        this.callParent(arguments)
                    }
                }
            }
        }
    });
