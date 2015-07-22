Ext.define("Sch.patches.PartnerScroll", {
    extend: "Sch.util.Patch",
    requires: ["Ext.scroll.Scroller"],
    target: "Ext.scroll.Scroller",
    minVersion: "5.1.0",
    macOnly: true,
    overrides: {
        constructor: function(a) {
            var b = this;
            b.callParent([a]);
            this.doNotCall = {}
        },
        privates: {
            onPartnerScrollEnd: function() {
                this.doNotCall = {}
            },
            invokePartners: function(f, a, e) {
                var c = this._partners,
                    b, d;
                if (!this.suspendSync) {
                    for (d in c) {
                        b = c[d];
                        if (!b.suspendSync && !this.doNotCall[b.scroller.id]) {
                            b.scroller[f](this, a, e)
                        } else {
                            if (!b.scroller.component.isTableView) {
                                delete this.doNotCall[b.scroller.id]
                            }
                        }
                    }
                }
            },
            onPartnerScroll: function(c, a, d) {
                var b = c._partners[this.getId()].axis;
                if (b) {
                    if (b === "x") {
                        d = null
                    } else {
                        if (b === "y") {
                            a = null
                        }
                    }
                }
                this.doNotCall[c.id] = true;
                this.doScrollTo(a, d, null, false)
            }
        }
    }
});
