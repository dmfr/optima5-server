Ext.define("Sch.plugin.Zones", {
    extend: "Sch.feature.AbstractTimeSpan",
    alias: "plugin.scheduler_zones",
    requires: ["Sch.model.Range"],
    innerTpl: null,
    cls: "sch-zone",
    side: null,
    init: function (a) {
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl)
        }
        this.side = a.rtl ? "right" : "left";
        var b = this.innerTpl;
        if (!this.template) {
            this.template = new Ext.XTemplate('<tpl for="."><div id="{id}" class="{$cls}" style="' + this.side + ':{left}px;top:{top}px;height:{height}px;width:{width}px;{style}">' + (b ? "{[this.renderInner(values)]}" : "") + "</div></tpl>", {
                renderInner: function (c) {
                    return b.apply(c)
                }
            })
        }
        if (Ext.isString(this.innerHeaderTpl)) {
            this.innerHeaderTpl = new Ext.XTemplate(this.innerHeaderTpl)
        }
        this.callParent(arguments)
    },
    getElementData: function (h, d, r, f) {
        var g = this.schedulerView,
            s = [],
            c = g.getTimeSpanRegion(h, d, this.expandToFitView),
            k = this.schedulerView.isHorizontal(),
            b, m, a, j, n, e;
        r = r || this.store.getRange();
        for (var q = 0, p = r.length; q < p; q++) {
            b = r[q];
            m = b.getStartDate();
            a = b.getEndDate();
            e = this.getTemplateData(b);
            if (m && a && Sch.util.Date.intersectSpans(m, a, h, d)) {
                var t = g.getCoordinateFromDate(Sch.util.Date.max(m, h));
                var o = g.getCoordinateFromDate(Sch.util.Date.min(a, d));
                j = Ext.apply({}, e);
                j.id = this.getElementId(b);
                j.$cls = this.getElementCls(b, e);
                if (k) {
                    j.left = t;
                    j.top = c.top;
                    j.width = f ? 0 : o - t;
                    j.height = c.bottom - c.top;
                    j.style = f ? ("border-left-width:" + (o - t) + "px") : ""
                } else {
                    j.left = c.left;
                    j.top = t;
                    j.height = f ? 0 : o - t;
                    j.width = c.right - c.left;
                    j.style = f ? ("border-top-width:" + (o - t) + "px") : ""
                }
                s.push(j)
            }
        }
        return s
    },
    getHeaderElementId: function (b, a) {
        return this.callParent([b]) + (a ? "-start" : "-end")
    },
    getHeaderElementCls: function (b, d, a) {
        var c = b.clsField || this.clsField;
        if (!d) {
            d = this.getTemplateData(b)
        }
        return "sch-header-indicator sch-header-indicator-" + (a ? "start " : "end ") + this.uniqueCls + " " + (d[c] || "")
    },
    getZoneHeaderElementData: function (b, h, f, a) {
        var c = a ? f.getStartDate() : f.getEndDate(),
            e = null,
            g, i, d;
        if (c && Sch.util.Date.betweenLesser(c, b, h)) {
            g = this.getHeaderElementPosition(c);
            i = this.schedulerView.isHorizontal();
            d = this.getTemplateData(f);
            e = Ext.apply({
                id: this.getHeaderElementId(f, a),
                cls: this.getHeaderElementCls(f, d, a),
                isStart: a,
                side: i ? this.side : "top",
                position: g
            }, d)
        }
        return e
    },
    getHeaderElementData: function (b) {
        var a = this.timeAxis.getStart(),
            h = this.timeAxis.getEnd(),
            e = [],
            g, d, j;
        b = b || this.store.getRange();
        for (var f = 0, c = b.length; f < c; f++) {
            g = b[f];
            d = this.getZoneHeaderElementData(a, h, g, true);
            if (d) {
                e.push(d)
            }
            j = this.getZoneHeaderElementData(a, h, g, false);
            if (j) {
                e.push(j)
            }
        }
        return e
    },
    updateZoneHeaderElement: function (a, b) {
        a.dom.className = b.cls;
        if (this.schedulerView.isHorizontal()) {
            this.setElementX(a, b.position)
        } else {
            a.setTop(b.position)
        }
    },
    updateHeaderElement: function (c) {
        var a = this.timeAxis.getStart(),
            g = this.timeAxis.getEnd(),
            f = Ext.get(this.getHeaderElementId(c, true)),
            e = Ext.get(this.getHeaderElementId(c, false)),
            d = this.getZoneHeaderElementData(a, g, c, true),
            b = this.getZoneHeaderElementData(a, g, c, false);
        if (!(f && b) || !(e && b)) {
            Ext.destroy(f, e);
            this.renderHeaderElementsInternal([c])
        } else {
            if (f) {
                if (!d) {
                    Ext.destroy(f)
                } else {
                    this.updateZoneHeaderElement(f, d)
                }
            }
            if (e) {
                if (!b) {
                    Ext.destroy(e)
                } else {
                    this.updateZoneHeaderElement(e, b)
                }
            }
        }
    }
});
