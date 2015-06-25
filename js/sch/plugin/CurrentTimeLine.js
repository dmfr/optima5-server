Ext.define("Sch.plugin.CurrentTimeLine", {
    extend: "Sch.plugin.Lines",
    alias: "plugin.scheduler_currenttimeline",
    mixins: ["Sch.mixin.Localizable"],
    requires: ["Ext.data.JsonStore"],
    updateInterval: 60000,
    showHeaderElements: true,
    autoUpdate: true,
    expandToFitView: true,
    timer: null,
    init: function(c) {
        if (Ext.getVersion("touch")) {
            this.showHeaderElements = false
        }
        var b = new Ext.data.JsonStore({
            fields: ["Date", "Cls", "Text"],
            data: [{
                Date: new Date(),
                Cls: "sch-todayLine",
                Text: this.L("tooltipText")
            }]
        });
        var a = b.first();
        if (this.autoUpdate) {
            this.timer = setInterval(function() {
                a.set("Date", new Date())
            }, this.updateInterval)
        }
        this.store = b;
        this.callParent(arguments)
    },
    destroy: function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null
        }
        if (this.store.autoDestroy) {
            this.store.destroy()
        }
        this.callParent(arguments)
    }
});
