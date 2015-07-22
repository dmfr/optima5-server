Ext.define("Sch.patches.TouchScroll", {
    extend: "Sch.util.Patch",
    requires: ["Ext.scroll.TouchScroller"],
    target: "Ext.scroll.TouchScroller",
    minVersion: "5.1.0",
    overrides: {
        privates: {
            onEvent: function(b) {
                var a = this;
                if (!a[a.listenerMap[b.type]]) {
                    return
                }
                return this.callParent(arguments)
            }
        }
    }
});
