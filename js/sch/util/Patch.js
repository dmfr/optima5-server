Ext.define("Sch.util.Patch", {
    target: null,
    minVersion: null,
    maxVersion: null,
    reportUrl: null,
    description: null,
    applyFn: null,
    ieOnly: false,
    macOnly: false,
    overrides: null,
    onClassExtended: function(a, b) {
        if (Sch.disableOverrides) {
            return
        }
        if (b.ieOnly && !Ext.isIE) {
            return
        }
        if (b.macOnly && !Ext.isMac) {
            return
        }
        if ((!b.minVersion || Ext.versions.extjs.equals(b.minVersion) || Ext.versions.extjs.isGreaterThan(b.minVersion)) && (!b.maxVersion || Ext.versions.extjs.equals(b.maxVersion) || Ext.versions.extjs.isLessThan(b.maxVersion))) {
            if (b.applyFn) {
                b.applyFn()
            } else {
                Ext.ClassManager.get(b.target).override(b.overrides)
            }
        }
    }
});
