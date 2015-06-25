Ext.define("Sch.patches.ToolTip", {
    extend: "Sch.util.Patch",
    requires: ["Ext.tip.ToolTip"],
    target: "Ext.tip.ToolTip",
    minVersion: "5.1.0",
    overrides: {
        setTarget: function(d) {
            var b = this,
                a = Ext.get(d),
                c;
            if (b.target) {
                c = Ext.get(b.target);
                b.mun(c, {
                    mouseover: b.onTargetOver,
                    tap: b.onTargetOver,
                    mouseout: b.onTargetOut,
                    mousemove: b.onMouseMove,
                    scope: b
                })
            }
            b.target = a;
            if (a) {
                b.mon(a, {
                    mouseover: b.onTargetOver,
                    tap: b.onTargetOver,
                    mouseout: b.onTargetOut,
                    mousemove: b.onMouseMove,
                    scope: b
                })
            }
            if (b.anchor) {
                b.anchorTarget = b.target
            }
        }
    }
});
