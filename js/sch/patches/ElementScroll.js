Ext.define("Sch.patches.ElementScroll", {
    override: "Sch.mixin.TimelineView",
    _onAfterRender: function () {
        this.callParent(arguments);
        if (Ext.versions.extjs.isLessThan("4.2.1") || Ext.versions.extjs.isGreaterThan("4.2.2")) {
            return
        }
        this.el.scroll = function (i, a, c) {
            if (!this.isScrollable()) {
                return false
            }
            i = i.substr(0, 1);
            var h = this,
                e = h.dom,
                g = i === "r" || i === "l" ? "left" : "top",
                b = false,
                d, f;
            if (i === "r" || i === "t" || i === "u") {
                a = -a
            }
            if (g === "left") {
                d = e.scrollLeft;
                f = h.constrainScrollLeft(d + a)
            } else {
                d = e.scrollTop;
                f = h.constrainScrollTop(d + a)
            } if (f !== d) {
                this.scrollTo(g, f, c);
                b = true
            }
            return b
        }
    }
});
