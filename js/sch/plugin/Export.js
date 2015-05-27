Ext.define("Sch.plugin.Export", {
    extend: "Ext.util.Observable",
    alternateClassName: "Sch.plugin.PdfExport",
    alias: "plugin.scheduler_export",
    mixins: ["Ext.AbstractPlugin"],
    requires: ["Ext.XTemplate"],
    lockableScope: "top",
    printServer: undefined,
    tpl: null,
    exportDialogClassName: "Sch.widget.ExportDialog",
    exportDialogConfig: {},
    defaultConfig: {
        format: "A4",
        orientation: "portrait",
        range: "complete",
        showHeader: true,
        singlePageExport: false
    },
    expandAllBeforeExport: false,
    pageSizes: {
        A5: {
            width: 5.8,
            height: 8.3
        },
        A4: {
            width: 8.3,
            height: 11.7
        },
        A3: {
            width: 11.7,
            height: 16.5
        },
        Letter: {
            width: 8.5,
            height: 11
        },
        Legal: {
            width: 8.5,
            height: 14
        }
    },
    openAfterExport: true,
    beforeExport: Ext.emptyFn,
    afterExport: Ext.emptyFn,
    fileFormat: "pdf",
    DPI: 72,
    constructor: function (a) {
        a = a || {};
        if (a.exportDialogConfig) {
            Ext.Object.each(this.defaultConfig, function (c, b, e) {
                var d = a.exportDialogConfig[c];
                if (d) {
                    e[c] = d
                }
            })
        }
        this.callParent([a]);
        if (!this.tpl) {
            this.tpl = new Ext.XTemplate('<!DOCTYPE html><html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type" /><title>{column}/{row}</title>{styles}</head><body class="' + Ext.baseCSSPrefix + 'webkit sch-export {bodyClasses}"><tpl if="showHeader"><div class="sch-export-header" style="width:{totalWidth}px"><h2>{column}/{row}</h2></div></tpl><div class="{componentClasses}" style="height:{bodyHeight}px; width:{totalWidth}px; position: relative !important">{HTML}</div></body></html>', {
                disableFormats: true
            })
        }
        this.addEvents("hidedialogwindow", "showdialogerror", "updateprogressbar");
        this.setFileFormat(this.fileFormat)
    },
    init: function (a) {
        this.scheduler = a;
        a.showExportDialog = Ext.Function.bind(this.showExportDialog, this);
        a.doExport = Ext.Function.bind(this.doExport, this)
    },
    setFileFormat: function (a) {
        if (typeof a !== "string") {
            this.fileFormat = "pdf"
        } else {
            a = a.toLowerCase();
            if (a === "png") {
                this.fileFormat = a
            } else {
                this.fileFormat = "pdf"
            }
        }
    },
    showExportDialog: function () {
        var b = this,
            a = b.scheduler.getSchedulingView();
        if (b.win) {
            b.win.destroy();
            b.win = null
        }
        b.win = Ext.create(b.exportDialogClassName, {
            plugin: b,
            exportDialogConfig: Ext.apply({
                startDate: b.scheduler.getStart(),
                endDate: b.scheduler.getEnd(),
                rowHeight: a.timeAxisViewModel.getViewRowHeight(),
                columnWidth: a.timeAxisViewModel.getTickWidth(),
                defaultConfig: b.defaultConfig
            }, b.exportDialogConfig)
        });
        b.saveRestoreData();
        b.win.show()
    },
    saveRestoreData: function () {
        var b = this.scheduler,
            a = b.getSchedulingView(),
            c = b.normalGrid,
            d = b.lockedGrid;
        this.restoreSettings = {
            width: b.getWidth(),
            height: b.getHeight(),
            rowHeight: a.timeAxisViewModel.getViewRowHeight(),
            columnWidth: a.timeAxisViewModel.getTickWidth(),
            startDate: b.getStart(),
            endDate: b.getEnd(),
            normalWidth: c.getWidth(),
            normalLeft: c.getEl().getStyle("left"),
            lockedWidth: d.getWidth(),
            lockedCollapse: d.collapsed,
            normalCollapse: c.collapsed
        }
    },
    getStylesheets: function () {
        var c = Ext.getDoc().select('link[rel="stylesheet"]'),
            a = Ext.get(Ext.core.DomHelper.createDom({
                tag: "div"
            })),
            b;
        c.each(function (d) {
            a.appendChild(d.dom.cloneNode(true))
        });
        b = a.dom.innerHTML + "";
        return b
    },
    doExport: function (n, j, q) {
        this.mask();
        var K = this,
            p = K.scheduler,
            r = p.getSchedulingView(),
            m = K.getStylesheets(),
            I = n || K.defaultConfig,
            s = p.normalGrid,
            F = p.lockedGrid,
            A = s.headerCt.getHeight();
        K.saveRestoreData();
        s.expand();
        F.expand();
        K.fireEvent("updateprogressbar", 0.1);
        if (this.expandAllBeforeExport && p.expandAll) {
            p.expandAll()
        }
        var J = p.timeAxis.getTicks(),
            t = r.timeAxisViewModel.getTickWidth(),
            D, e, g;
        if (!I.singlePageExport) {
            if (I.orientation === "landscape") {
                D = K.pageSizes[I.format].height * K.DPI;
                g = K.pageSizes[I.format].width * K.DPI
            } else {
                D = K.pageSizes[I.format].width * K.DPI;
                g = K.pageSizes[I.format].height * K.DPI
            }
            var H = 41;
            e = Math.floor(g) - A - (I.showHeader ? H : 0)
        }
        r.timeAxisViewModel.suppressFit = true;
        var E = 0;
        var k = 0;
        if (I.range !== "complete") {
            var d, b;
            switch (I.range) {
            case "date":
                d = new Date(I.dateFrom);
                b = new Date(I.dateTo);
                if (Sch.util.Date.getDurationInDays(d, b) < 1) {
                    b = Sch.util.Date.add(b, Sch.util.Date.DAY, 1)
                }
                d = Sch.util.Date.constrain(d, p.getStart(), p.getEnd());
                b = Sch.util.Date.constrain(b, p.getStart(), p.getEnd());
                break;
            case "current":
                var L = r.getVisibleDateRange();
                d = L.startDate;
                b = L.endDate || r.timeAxis.getEnd();
                if (I.cellSize) {
                    t = I.cellSize[0];
                    if (I.cellSize.length > 1) {
                        r.setRowHeight(I.cellSize[1])
                    }
                }
                break
            }
            p.setTimeSpan(d, b);
            var c = Math.floor(r.timeAxis.getTickFromDate(d));
            var x = Math.floor(r.timeAxis.getTickFromDate(b));
            J = p.timeAxis.getTicks();
            J = Ext.Array.filter(J, function (i, a) {
                if (a < c) {
                    E++;
                    return false
                } else {
                    if (a > x) {
                        k++;
                        return false
                    }
                }
                return true
            })
        }
        this.beforeExport(p, J);
        var C, z, h;
        if (!I.singlePageExport) {
            p.setWidth(D);
            p.setTimeColumnWidth(t);
            r.timeAxisViewModel.setTickWidth(t);
            h = K.calculatePages(I, J, t, D, e);
            z = K.getExportJsonHtml(h, {
                styles: m,
                config: I,
                ticks: J,
                skippedColsBefore: E,
                skippedColsAfter: k,
                printHeight: e,
                paperWidth: D,
                headerHeight: A
            });
            C = I.format
        } else {
            z = K.getExportJsonHtml(null, {
                styles: m,
                config: I,
                ticks: J,
                skippedColsBefore: E,
                skippedColsAfter: k,
                timeColumnWidth: t
            });
            var f = K.getRealSize(),
                v = Ext.Number.toFixed(f.width / K.DPI, 1),
                u = Ext.Number.toFixed(f.height / K.DPI, 1);
            C = v + "in*" + u + "in"
        }
        K.fireEvent("updateprogressbar", 0.4);
        if (K.printServer) {
            if (!K.debug && !K.test) {
                Ext.Ajax.request({
                    type: "POST",
                    url: K.printServer,
                    timeout: 60000,
                    params: Ext.apply({
                        html: {
                            array: z
                        },
                        startDate: p.getStartDate(),
                        endDate: p.getEndDate(),
                        format: C,
                        orientation: I.orientation,
                        range: I.range,
                        fileFormat: K.fileFormat
                    }, this.getParameters()),
                    success: function (a) {
                        K.onSuccess(a, j, q)
                    },
                    failure: function (a) {
                        K.onFailure(a, q)
                    },
                    scope: K
                })
            } else {
                if (K.debug) {
                    var o, G = Ext.JSON.decode(z);
                    for (var B = 0, y = G.length; B < y; B++) {
                        o = window.open();
                        o.document.write(G[B].html);
                        o.document.close()
                    }
                }
            }
        } else {
            throw "Print server URL is not defined, please specify printServer config"
        }
        r.timeAxisViewModel.suppressFit = false;
        K.restorePanel();
        this.afterExport(p);
        if (K.test) {
            return {
                htmlArray: Ext.JSON.decode(z),
                calculatedPages: h
            }
        }
    },
    getParameters: function () {
        return {}
    },
    getRealSize: function () {
        var c = this.scheduler,
            b = c.normalGrid.headerCt.getHeight(),
            a = (b + c.lockedGrid.getView().getEl().down("." + Ext.baseCSSPrefix + "grid-table").getHeight()),
            d = (c.lockedGrid.headerCt.getEl().first().getWidth() + c.normalGrid.body.select("." + Ext.baseCSSPrefix + "grid-table").first().getWidth());
        return {
            width: d,
            height: a
        }
    },
    calculatePages: function (r, s, j, p, b) {
        var t = this,
            i = t.scheduler,
            q = i.lockedGrid,
            c = i.getSchedulingView().timeAxisViewModel.getViewRowHeight(),
            u = q.headerCt,
            o = u.getEl().first().getWidth(),
            h = null,
            k = 0;
        if (o > q.getWidth()) {
            var g = 0,
                d = 0,
                m = 0,
                n = false,
                e;
            h = [];
            q.headerCt.items.each(function (y, w, v) {
                e = y.width;
                if (!m || m + e < p) {
                    m += e;
                    if (w === v - 1) {
                        n = true;
                        var x = p - m;
                        k = Math.floor(x / j)
                    }
                } else {
                    n = true
                } if (n) {
                    d = w;
                    h.push({
                        firstColumnIdx: g,
                        lastColumnIdx: d,
                        totalColumnsWidth: m || e
                    });
                    g = d + 1;
                    m = 0
                }
            })
        } else {
            k = Math.floor((p - o) / j)
        }
        var l = Math.floor(p / j),
            a = Math.ceil((s.length - k) / l),
            f = Math.floor(b / c);
        if (!h || a === 0) {
            a += 1
        }
        return {
            columnsAmountLocked: k,
            columnsAmountNormal: l,
            lockedColumnPages: h,
            rowsAmount: f,
            rowPages: Math.ceil(i.getSchedulingView().store.getCount() / f),
            columnPages: a,
            timeColumnWidth: j,
            lockedGridWidth: o,
            rowHeight: c,
            panelHTML: {}
        }
    },
    getExportJsonHtml: function (f, E) {
        var H = this,
            n = H.scheduler,
            y = [],
            v = new RegExp(Ext.baseCSSPrefix + "ie\\d?|" + Ext.baseCSSPrefix + "gecko", "g"),
            B = Ext.getBody().dom.className.replace(v, ""),
            q = n.el.dom.className,
            m = E.styles,
            F = E.config,
            G = E.ticks,
            o, d, e, p, r;
        if (Ext.isIE) {
            B += " sch-ie-export"
        }
        n.timeAxis.autoAdjust = false;
        if (!F.singlePageExport) {
            var s = f.columnsAmountLocked,
                u = f.columnsAmountNormal,
                l = f.lockedColumnPages,
                h = f.rowsAmount,
                t = f.rowPages,
                a = f.columnPages,
                C = E.paperWidth,
                c = E.printHeight,
                z = E.headerHeight,
                j = null,
                b, g;
            r = f.timeColumnWidth;
            o = f.panelHTML;
            o.skippedColsBefore = E.skippedColsBefore;
            o.skippedColsAfter = E.skippedColsAfter;
            if (l) {
                g = l.length;
                a += g
            }
            for (var A = 0; A < a; A++) {
                if (l && A < g) {
                    if (A === g - 1 && s !== 0) {
                        n.normalGrid.show();
                        j = Ext.Number.constrain((s - 1), 0, (G.length - 1));
                        n.setTimeSpan(G[0].start, G[j].end)
                    } else {
                        n.normalGrid.hide()
                    }
                    var D = l[A];
                    this.showLockedColumns();
                    this.hideLockedColumns(D.firstColumnIdx, D.lastColumnIdx);
                    n.lockedGrid.setWidth(D.totalColumnsWidth + 1)
                } else {
                    if (A === 0) {
                        this.showLockedColumns();
                        if (s !== 0) {
                            n.normalGrid.show()
                        }
                        j = Ext.Number.constrain(s - 1, 0, G.length - 1);
                        n.setTimeSpan(G[0].start, G[j].end)
                    } else {
                        n.lockedGrid.hide();
                        n.normalGrid.show();
                        if (j === null) {
                            j = -1
                        }
                        if (G[j + u]) {
                            n.setTimeSpan(G[j + 1].start, G[j + u].end);
                            j = j + u
                        } else {
                            n.setTimeSpan(G[j + 1].start, G[G.length - 1].end)
                        }
                    }
                }
                n.setTimeColumnWidth(r, true);
                n.getSchedulingView().timeAxisViewModel.setTickWidth(r);
                for (var x = 0; x < t; x += 1) {
                    H.hideRows(h, x);
                    o.dom = n.body.dom.innerHTML;
                    o.k = x;
                    o.i = A;
                    d = H.resizePanelHTML(o);
                    p = H.tpl.apply(Ext.apply({
                        bodyClasses: B,
                        bodyHeight: c + z,
                        componentClasses: q,
                        styles: m,
                        showHeader: F.showHeader,
                        HTML: d.dom.innerHTML,
                        totalWidth: C,
                        headerHeight: z,
                        column: A + 1,
                        row: x + 1
                    }));
                    e = {
                        html: p
                    };
                    y.push(e);
                    H.showRows()
                }
            }
        } else {
            r = E.timeColumnWidth;
            o = f ? f.panelHTML : {};
            n.setTimeSpan(G[0].start, G[G.length - 1].end);
            n.lockedGrid.setWidth(n.lockedGrid.headerCt.getEl().first().getWidth());
            n.setTimeColumnWidth(r);
            n.getSchedulingView().timeAxisViewModel.setTickWidth(r);
            var w = H.getRealSize();
            Ext.apply(o, {
                dom: n.body.dom.innerHTML,
                column: 1,
                row: 1,
                timeColumnWidth: E.timeColumnWidth,
                skippedColsBefore: E.skippedColsBefore,
                skippedColsAfter: E.skippedColsAfter
            });
            d = H.resizePanelHTML(o);
            p = H.tpl.apply(Ext.apply({
                bodyClasses: B,
                bodyHeight: w.height,
                componentClasses: q,
                styles: m,
                showHeader: false,
                HTML: d.dom.innerHTML,
                totalWidth: w.width
            }));
            e = {
                html: p
            };
            y.push(e)
        }
        n.timeAxis.autoAdjust = true;
        return Ext.JSON.encode(y)
    },
    resizePanelHTML: function (f) {
        var k = Ext.get(Ext.core.DomHelper.createDom({
            tag: "div",
            html: f.dom
        })),
            j = this.scheduler,
            d = j.lockedGrid,
            i = j.normalGrid,
            g, e, b;
        if (Ext.isIE6 || Ext.isIE7 || Ext.isIEQuirks) {
            var h = document.createDocumentFragment(),
                a, c;
            if (h.getElementById) {
                a = "getElementById";
                c = ""
            } else {
                a = "querySelector";
                c = "#"
            }
            h.appendChild(k.dom);
            g = d.view.el;
            e = [h[a](c + j.id + "-targetEl"), h[a](c + j.id + "-innerCt"), h[a](c + d.id), h[a](c + d.body.id), h[a](c + g.id)];
            b = [h[a](c + i.id), h[a](c + i.headerCt.id), h[a](c + i.body.id), h[a](c + i.getView().id)];
            Ext.Array.each(e, function (l) {
                if (l !== null) {
                    l.style.height = "100%";
                    l.style.width = "100%"
                }
            });
            Ext.Array.each(b, function (m, l) {
                if (m !== null) {
                    if (l === 1) {
                        m.style.width = "100%"
                    } else {
                        m.style.height = "100%";
                        m.style.width = "100%"
                    }
                }
            });
            k.dom.innerHTML = h.firstChild.innerHTML
        } else {
            g = d.view.el;
            e = [k.select("#" + j.id + "-targetEl").first(), k.select("#" + j.id + "-innerCt").first(), k.select("#" + d.id).first(), k.select("#" + d.body.id).first(), k.select("#" + g.id)];
            b = [k.select("#" + i.id).first(), k.select("#" + i.headerCt.id).first(), k.select("#" + i.body.id).first(), k.select("#" + i.getView().id).first()];
            Ext.Array.each(e, function (m, l) {
                if (m) {
                    m.setHeight("100%");
                    if (l !== 3 && l !== 2) {
                        m.setWidth("100%")
                    }
                }
            });
            Ext.Array.each(b, function (m, l) {
                if (l === 1) {
                    m.setWidth("100%")
                } else {
                    m.applyStyles({
                        height: "100%",
                        width: "100%"
                    })
                }
            })
        }
        return k
    },
    getWin: function () {
        return this.win || null
    },
    hideDialogWindow: function (a) {
        var b = this;
        b.fireEvent("hidedialogwindow", a);
        b.unmask();
        if (b.openAfterExport) {
            window.open(a.url, "ExportedPanel")
        }
    },
    onSuccess: function (c, h, b) {
        var d = this,
            g = d.getWin(),
            a;
        try {
            a = Ext.JSON.decode(c.responseText)
        } catch (f) {
            this.onFailure(c, b);
            return
        }
        d.fireEvent("updateprogressbar", 1, a);
        if (a.success) {
            setTimeout(function () {
                d.hideDialogWindow(a)
            }, g ? g.hideTime : 3000)
        } else {
            d.fireEvent("showdialogerror", g, a.msg, a);
            d.unmask()
        } if (h) {
            h.call(this, c)
        }
    },
    onFailure: function (b, a) {
        var c = this.getWin(),
            d = b.status === 200 ? b.responseText : b.statusText;
        this.fireEvent("showdialogerror", c, d);
        this.unmask();
        if (a) {
            a.call(this, b)
        }
    },
    hideRows: function (e, g) {
        var d = this.scheduler.lockedGrid.view.getNodes(),
            a = this.scheduler.normalGrid.view.getNodes(),
            h = e * g,
            c = h + e;
        for (var f = 0, b = a.length; f < b; f++) {
            if (f < h || f >= c) {
                d[f].className += " sch-none";
                a[f].className += " sch-none"
            }
        }
    },
    showRows: function () {
        this.scheduler.getEl().select(this.scheduler.getSchedulingView().getItemSelector()).each(function (a) {
            a.removeCls("sch-none")
        })
    },
    hideLockedColumns: function (c, e) {
        var d = this.scheduler.lockedGrid.headerCt.items.items;
        for (var b = 0, a = d.length; b < a; b++) {
            if (b < c || b > e) {
                d[b].hide()
            }
        }
    },
    showLockedColumns: function () {
        this.scheduler.lockedGrid.headerCt.items.each(function (a) {
            a.show()
        })
    },
    mask: function () {
        var a = Ext.getBody().mask();
        a.addCls("sch-export-mask")
    },
    unmask: function () {
        Ext.getBody().unmask()
    },
    restorePanel: function () {
        var b = this.scheduler,
            a = this.restoreSettings;
        b.setWidth(a.width);
        b.setHeight(a.height);
        b.setTimeSpan(a.startDate, a.endDate);
        b.setTimeColumnWidth(a.columnWidth, true);
        b.getSchedulingView().setRowHeight(a.rowHeight);
        b.lockedGrid.show();
        b.normalGrid.setWidth(a.normalWidth);
        b.normalGrid.getEl().setStyle("left", a.normalLeft);
        b.lockedGrid.setWidth(a.lockedWidth);
        if (a.lockedCollapse) {
            b.lockedGrid.collapse()
        }
        if (a.normalCollapse) {
            b.normalGrid.collapse()
        }
    },
    destroy: function () {
        if (this.win) {
            this.win.destroy()
        }
    }
});
