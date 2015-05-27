Ext.define("Sch.plugin.Lines", {
    extend: "Sch.feature.AbstractTimeSpan",
    alias: "plugin.scheduler_lines",
    cls: "sch-timeline",
    showTip: true,
    innerTpl: null,
    prepareTemplateData: null,
    side: null,
    init: function (a) {
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl)
        }
        this.side = a.rtl ? "right" : "left";
        var b = this.innerTpl;
        if (!this.template) {
            this.template = new Ext.XTemplate('<tpl for=".">', '<div id="{id}" ' + (this.showTip ? 'title="{[this.getTipText(values)]}" ' : "") + 'class="{$cls}" style="' + this.side + ':{left}px;top:{top}px;height:{height}px;width:{width}px">' + (b ? "{[this.renderInner(values)]}" : "") + "</div>", "</tpl>", {
                getTipText: function (c) {
                    return a.getSchedulingView().getFormattedDate(c.Date) + " " + (c.Text || "")
                },
                renderInner: function (c) {
                    return b.apply(c)
                }
            })
        }
        this.callParent(arguments)
    },
    getElementData: function (m, q, c) {
        var t = this.store,
            j = this.schedulerView,
            p = j.isHorizontal(),
            f = c || t.getRange(),
            h = [],
            r, a, o = j.getTimeSpanRegion(m, null, this.expandToFitView),
            k, b, e;
        if (Ext.versions.touch) {
            r = "100%"
        } else {
            r = p ? o.bottom - o.top : 1
        }
        a = p ? 1 : o.right - o.left;
        for (var g = 0, d = f.length; g < d; g++) {
            k = f[g];
            b = k.get("Date");
            if (b && Sch.util.Date.betweenLesser(b, m, q)) {
                var n = j.getCoordinateFromDate(b);
                e = Ext.apply({}, this.getTemplateData(k));
                e.id = this.getElementId(k);
                e.$cls = this.getElementCls(k, e);
                e.width = a;
                e.height = r;
                if (p) {
                    e.left = n
                } else {
                    e.top = n
                }
                h.push(e)
            }
        }
        return h
    },
    getHeaderElementData: function (c) {
        var a = this.timeAxis.getStart(),
            k = this.timeAxis.getEnd(),
            m = this.schedulerView.isHorizontal(),
            g = [],
            h, b, j, e;
        c = c || this.store.getRange();
        for (var f = 0, d = c.length; f < d; f++) {
            h = c[f];
            b = h.get("Date");
            if (b && Sch.util.Date.betweenLesser(b, a, k)) {
                j = this.getHeaderElementPosition(b);
                e = this.getTemplateData(h);
                g.push(Ext.apply({
                    id: this.getHeaderElementId(h),
                    side: m ? this.side : "top",
                    cls: this.getHeaderElementCls(h, e),
                    position: j
                }, e))
            }
        }
        return g
    }
});
