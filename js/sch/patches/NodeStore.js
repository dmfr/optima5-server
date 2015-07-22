    Ext.define("Sch.patches.NodeStore", {
        extend: "Sch.util.Patch",
        requires: ["Ext.data.NodeStore"],
        target: "Ext.data.NodeStore",
        ieOnly: true,
        maxVersion: "5.1.1",
        overrides: {
            afterEdit: function(a, b) {
                if (this.getNode() && b) {
                    if (Ext.Array.indexOf(b, "loaded") !== -1) {
                        return this.add(this.retrieveChildNodes(a))
                    }
                    if (Ext.Array.indexOf(b, "expanded") !== -1) {
                        return this.filter()
                    }
                    if (Ext.Array.indexOf(b, "sorted") !== -1) {
                        return this.sort()
                    }
                }
                Ext.data.Store.prototype.afterEdit.apply(this, arguments)
            }
        }
    });
