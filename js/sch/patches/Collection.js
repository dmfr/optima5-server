Ext.define("Sch.patches.Collection", {
    extend: "Sch.util.Patch",
    requires: ["Ext.util.Collection"],
    target: "Ext.util.Collection",
    minVersion: "5.1.0",
    overrides: {
        updateKey: function(b, e) {
            var a = this,
                d = a.map,
                g = a.indices,
                c = a.getSource(),
                f;
            if (c && !c.updating) {
                c.updateKey(b, e)
            } else {
                if (d[e] && (f = a.getKey(b)) !== e) {
                    if (e in d || d[f] !== b) {
                        if (e in d) {
                            delete d[e]
                        }
                        a.updating++;
                        a.generation++;
                        d[f] = b;
                        if (g) {
                            g[f] = g[e];
                            delete g[e]
                        }
                        a.notify("updatekey", [{
                            item: b,
                            newKey: f,
                            oldKey: e
                        }]);
                        a.updating--
                    }
                }
            }
        }
    }
});
