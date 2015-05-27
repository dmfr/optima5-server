Ext.define("Sch.plugin.ResourceZones", {
    extend: "Sch.plugin.Zones",
    alias: "plugin.scheduler_resourcezones",
    innerTpl: null,
    store: null,
    cls: "sch-resourcezone",
    init: function (a) {
        this.uniqueCls = this.uniqueCls || ("sch-timespangroup-" + Ext.id());
        this.scheduler = a;
        a.on("destroy", this.onSchedulerDestroy, this);
        a.registerRenderer(this.renderer, this);
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl)
        }
        var b = this.innerTpl;
        if (!this.template) {
            this.template = new Ext.XTemplate('<tpl for="."><div id="' + this.uniqueCls + '-{id}" class="' + this.cls + " " + this.uniqueCls + ' {Cls}" style="' + (a.rtl ? "right" : "left") + ':{start}px;width:{width}px;top:{start}px;height:{width}px;{style}">' + (b ? "{[this.renderInner(values)]}" : "") + "</div></tpl>", {
                renderInner: function (c) {
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
    onSchedulerDestroy: function () {
        this.store.un(this.storeListeners)
    },
    fullRefresh: function () {
        this.scheduler.getSchedulingView().refresh()
    },
    renderer: function (c, b, a, d) {
        if (this.scheduler.getOrientation() === "horizontal" || d === 0) {
            return this.renderZones(a)
        }
        return ""
    },
    renderZones: function (f) {
        var a = this.store,
            c = this.scheduler,
            h = c.timeAxis.getStart(),
            b = c.timeAxis.getEnd(),
            e = [],
            d, g;
        a.each(function (i) {
            d = i.getStartDate();
            g = i.getEndDate();
            if (i.getResource(null, c.eventStore) === f && d && g && Sch.util.Date.intersectSpans(d, g, h, b)) {
                var k = c.getSchedulingView()[c.getOrientation()].getEventRenderData(i);
                var l, j;
                if (c.getOrientation() === "horizontal") {
                    l = c.rtl ? k.right : k.left;
                    j = k.width
                } else {
                    l = k.top;
                    j = k.height
                }
                e[e.length] = Ext.apply({
                    id: i.internalId,
                    start: l,
                    width: j,
                    Cls: i.getCls()
                }, i.data)
            }
        });
        return this.template.apply(e)
    },
    refreshSingle: function (i, g) {
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
