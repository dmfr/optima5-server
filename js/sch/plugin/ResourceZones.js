Ext.define("Sch.plugin.ResourceZones", {
    extend: "Sch.plugin.Zones",
    alias: "plugin.scheduler_resourcezones",
    innerTpl: null,
    store: null,
    cls: "sch-resourcezone",
    init: function(a) {
        this.uniqueCls = this.uniqueCls || ("sch-timespangroup-" + Ext.id());
        this.scheduler = a;
        a.registerRenderer(this.renderer, this);
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl)
        }
        var b = this.innerTpl;
        if (!this.template) {
            this.template = new Ext.XTemplate('<tpl for="."><div id="' + this.uniqueCls + '-{id}" class="' + this.cls + " " + this.uniqueCls + ' {Cls}" style="' + (a.rtl ? "right" : "left") + ':{start}px;width:{width}px;top:{start}px;height:{width}px;{style}">' + (b ? "{[this.renderInner(values)]}" : "") + "</div></tpl>", {
                renderInner: function(c) {
                    return b.apply(c)
                }
            })
        }
        this.storeListeners = {
            load: this.fullRefresh,
            datachanged: this.fullRefresh,
            clear: this.fullRefresh,
            add: this.fullRefresh,
            remove: this.fullRefresh,
            update: this.refreshSingle,
            addrecords: this.fullRefresh,
            removerecords: this.fullRefresh,
            updaterecord: this.refreshSingle,
            scope: this
        };
        this.store.on(this.storeListeners)
    },
    destroy: function() {
        this.store.un(this.storeListeners);
        this.callParent(arguments)
    },
    fullRefresh: function() {
        this.scheduler.getSchedulingView().refresh()
    },
    renderer: function(c, b, a, d) {
        if (this.scheduler.getOrientation() === "horizontal" || d === 0) {
            return this.renderZones(a)
        }
        return ""
    },
    renderZones: function(e) {
        var c = this.store,
            h = this.scheduler,
            k = h.timeAxis.getStart(),
            o = h.timeAxis.getEnd(),
            g = [],
            m = e.getEvents(c),
            p, d;
        for (var f = 0, l = m.length; f < l; f++) {
            var j = m[f];
            p = j.getStartDate();
            d = j.getEndDate();
            if (p && d && Sch.util.Date.intersectSpans(p, d, k, o)) {
                var n = h.getSchedulingView()[h.getOrientation()].getEventRenderData(j);
                var b, a;
                if (h.getMode() === "horizontal") {
                    b = h.rtl ? n.right : n.left;
                    a = n.width
                } else {
                    b = n.top;
                    a = n.height
                }
                g[g.length] = Ext.apply({
                    id: j.internalId,
                    start: b,
                    width: a,
                    Cls: j.getCls()
                }, j.data)
            }
        }
        return this.template.apply(g)
    },
    refreshSingle: function(i, g) {
        var c = Ext.get(this.uniqueCls + "-" + g.internalId);
        if (c) {
            var e = this.scheduler,
                f = e.timeAxis.getStart(),
                j = e.timeAxis.getEnd();
            var b = Sch.util.Date.max(f, g.getStartDate()),
                d = Sch.util.Date.min(j, g.getEndDate()),
                k = g.getCls();
            var h = e.getSchedulingView().getCoordinateFromDate(b);
            var a = e.getSchedulingView().getCoordinateFromDate(d) - h;
            c.dom.className = this.cls + " " + this.uniqueCls + " " + (k || "");
            c.setStyle({
                left: h + "px",
                top: h + "px",
                height: a + "px",
                width: a + "px"
            })
        }
    }
});
