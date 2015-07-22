Ext.define("Sch.patches.View", {
    extend: "Sch.util.Patch",
    requires: ["Ext.view.View"],
    target: "Ext.view.View",
    minVersion: "5.1.0",
    overrides: {
        handleEvent: function(d) {
            var c = this,
                b = c.keyEventRe.test(d.type),
                a = c.getNavigationModel();
            d.view = c;
            if (b) {
                d.item = a.getItem();
                d.record = a.getRecord()
            }
            if (!d.item) {
                d.item = d.getTarget(c.itemSelector)
            }
            if (d.item && !d.record) {
                d.record = c.getRecord(d.item)
            }
            if (c.processUIEvent(d) !== false) {
                c.processSpecialEvent(d)
            }
            if (b && !Ext.fly(d.target).isInputField()) {
                if (d.getKey() === d.SPACE || d.isNavKeyPress(true)) {
                    d.preventDefault()
                }
            }
        }
    }
});
