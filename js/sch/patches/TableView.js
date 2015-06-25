Ext.define("Sch.patches.TableView", {
    extend: "Sch.util.Patch",
    requires: ["Ext.view.Table"],
    target: "Ext.view.Table",
    minVersion: "5.1.0",
    overrides: {
        getLastFocused: function() {
            var a = this.callParent(arguments);
            return a || this.navigationModel.lastFocused
        }
    }
});
