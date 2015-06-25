Ext.define("Sch.plugin.Export", {
    extend: "Ext.util.Observable",
    alternateClassName: "Sch.plugin.PdfExport",
    alias: "plugin.scheduler_export",
    mixins: ["Ext.AbstractPlugin", "Sch.mixin.Localizable"],
    requires: ["Ext.XTemplate", "Sch.plugin.exporter.SinglePage", "Sch.plugin.exporter.MultiPage", "Sch.plugin.exporter.MultiPageVertical"],
    lockableScope: "top",
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
    DPI: 72,
    printServer: undefined,
    timeout: 60000,
    headerTpl: null,
    headerTplDataFn: null,
    headerTplDataFnScope: null,
    tpl: null,
    footerTpl: null,
    footerTplDataFn: null,
    footerTplDataFnScope: null,
    exportDialogClassName: "Sch.widget.ExportDialog",
    exportDialogConfig: {},
    exporterConfig: null,
    exportConfig: {
        format: "A4",
        orientation: "portrait",
        range: "complete",
        showHeader: true,
        showFooter: false
    },
    expandAllBeforeExport: false,
    translateURLsToAbsolute: true,
    openAfterExport: true,
    beforeExport: Ext.emptyFn,
    afterExport: Ext.emptyFn,
    fileFormat: "pdf",
    defaultExporter: "multipage",
    exporters: undefined,
    callbacks: undefined,
    constructor: function(a) {
        var b = this;
        a = a || {};
        b.exportersIndex = {};
        if (a.exportDialogConfig) {
            Ext.Object.each(this.exportConfig, function(d, c, f) {
                var e = a.exportDialogConfig[d];
                if (e) {
                    f[d] = e
                }
            })
        }
        b.callParent([a]);
        b.setFileFormat(b.fileFormat);
        if (!b.exporters) {
            b.exporters = b.buildExporters()
        }
        b.initExporters();
        b.bindExporters()
    },
    init: function(a) {
        var b = this;
        a.showExportDialog = Ext.Function.bind(b.showExportDialog, b);
        a.doExport = Ext.Function.bind(b.doExport, b);
        b.scheduler = a
    },
    initExporters: function() {
        var c = this,
            b = c.exporters;
        for (var a = 0; a < b.length; a++) {
            if (!(b[a] instanceof Sch.plugin.exporter.AbstractExporter)) {
                b[a] = c.createExporter(b[a])
            }
        }
    },
    bindExporters: function() {
        var b = this.exporters;
        for (var a = 0; a < b.length; a++) {
            this.bindExporter(b[a])
        }
    },
    bindExporter: function(b) {
        var a = this;
        a.mon(b, {
            commitpage: a.onPageCommit,
            collectrows: a.onRowCollected,
            scope: a
        })
    },
    unbindExporter: function(b) {
        var a = this;
        a.mun(b, {
            commitpage: a.onPageCommit,
            collectrows: a.onRowCollected,
            scope: a
        })
    },
    buildExporters: function() {
        return ["Sch.plugin.exporter.SinglePage", "Sch.plugin.exporter.MultiPage", "Sch.plugin.exporter.MultiPageVertical"]
    },
    getExporterConfig: function(c, b) {
        var d = this;
        var a = Ext.apply({
            translateURLsToAbsolute: d.translateURLsToAbsolute,
            expandAllBeforeExport: d.expandAllBeforeExport,
            DPI: d.DPI
        }, d.exporterConfig);
        if (d.headerTpl) {
            a.headerTpl = d.headerTpl
        }
        if (d.headerTplDataFn) {
            a.headerTplDataFn = d.headerTplDataFn;
            a.headerTplDataFnScope = d.headerTplDataFnScope
        }
        if (d.tpl) {
            a.tpl = d.tpl
        }
        if (d.footerTpl) {
            a.footerTpl = d.footerTpl
        }
        if (d.footerTplDataFn) {
            a.footerTplDataFn = d.footerTplDataFn;
            a.footerTplDataFnScope = d.footerTplDataFnScope
        }
        return a
    },
    createExporter: function(b, a) {
        var c = this,
            d = c.getExporterConfig(b, a);
        if (Ext.isObject(b)) {
            return Ext.create(Ext.apply(d, b))
        } else {
            return Ext.create(b, Ext.apply(d, a))
        }
    },
    registerExporter: function(b, a) {
        if (!(b instanceof Sch.plugin.exporter.AbstractExporter)) {
            b = this.createExporter.apply(this, arguments)
        }
        this.exporters.push(b);
        this.bindExporter(b)
    },
    getExporter: function(b) {
        if (!b) {
            return
        }
        var a = this.exportersIndex[b];
        if (a) {
            return a
        }
        a = this.exportersIndex[b] = Ext.Array.findBy(this.exporters, function(c) {
            return c.getExporterId() == b
        });
        return a
    },
    getExporters: function() {
        return this.exporters
    },
    setFileFormat: function(a) {
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
    showExportDialog: function() {
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
                defaultExporter: b.defaultExporter,
                exporters: b.exporters,
                exportConfig: b.exportConfig
            }, b.exportDialogConfig)
        });
        b.win.show()
    },
    getExportConfig: function(b) {
        var c = this;
        var a = Ext.apply({
            fileFormat: c.fileFormat,
            exporterId: c.defaultExporter,
            beforeExport: Ext.Function.bind(c.beforeExport, c),
            afterExport: Ext.Function.bind(c.afterExport, c)
        }, b, c.exportConfig);
        a.DPI = a.DPI || c.DPI;
        a.pageSize = Ext.apply({}, c.pageSizes[a.format]);
        a.pageSize.width *= a.DPI;
        a.pageSize.height *= a.DPI;
        return a
    },
    doExport: function(d, h, a, e) {
        var f = this,
            c = f.scheduler,
            b = f.getExportConfig(d);
        f.callbacks = {
            success: h || Ext.emptyFn,
            failure: a || Ext.emptyFn,
            scope: e || f
        };
        var g = f.exporter = f.getExporter(b.exporterId);
        if (g && f.fireEvent("beforeexport", c, g, b) !== false) {
            f.mask();
            f.exporter.extractPages(c, b, function(i) {
                f.fireEvent("updateprogressbar", 0.8, this.L("requestingPrintServer"));
                f.doRequest(i, b)
            }, f)
        }
    },
    onRowCollected: function(c, d, b, a) {
        this.fireEvent("updateprogressbar", 0.2 * (b + 1) / a, Ext.String.format(this.L("fetchingRows"), b + 1, a))
    },
    onPageCommit: function(d, c, b, a) {
        a = Math.max(b, a);
        this.fireEvent("updateprogressbar", 0.2 + 0.6 * b / a, Ext.String.format(this.L("builtPage"), b, a))
    },
    onExportSuccess: function(a) {
        var e = this,
            f = e.getWin(),
            d = e.callbacks,
            c = d && d.success,
            b = d && d.scope || e;
        e.fireEvent("updateprogressbar", 1);
        e.unmask();
        c && c.apply(b, arguments);
        setTimeout(function() {
            e.fireEvent("hidedialogwindow", a);
            if (e.openAfterExport) {
                window.open(a.url, "ExportedPanel")
            }
        }, f ? f.hideTime : 3000)
    },
    onExportFailure: function(f, a) {
        var e = this,
            g = this.getWin(),
            d = e.callbacks,
            c = d && d.failure,
            b = d && d.scope || e;
        c && c.call(b, f);
        e.fireEvent("showdialogerror", g, f, a);
        e.unmask()
    },
    doRequest: function(a, b) {
        var f = this,
            g = f.scheduler;
        if (!f.test && !f.debug) {
            if (f.printServer) {
                var j = {
                    type: "POST",
                    url: f.printServer,
                    timeout: f.timeout,
                    params: Ext.apply({
                        html: {
                            array: Ext.JSON.encode(a)
                        },
                        startDate: g.getStartDate(),
                        endDate: g.getEndDate(),
                        format: f.exporter.getPaperFormat(),
                        orientation: b.orientation,
                        range: b.range,
                        fileFormat: f.fileFormat
                    }, this.getParameters()),
                    success: f.onRequestSuccess,
                    failure: f.onRequestFailure,
                    scope: f
                };
                Ext.apply(j, this.getAjaxConfig(j));
                Ext.Ajax.request(j)
            } else {
                f.onExportFailure("Print server URL is not defined, please specify printServer config")
            }
        } else {
            if (f.debug) {
                var c = a || [];
                for (var e = 0, d = c.length; e < d; e++) {
                    var h = window.open();
                    h.document.write(c[e].html);
                    h.document.close()
                }
            }
            f.onExportSuccess(f.testResponse || {
                success: true,
                url: "foo",
                htmlArray: a
            })
        }
    },
    onRequestSuccess: function(b) {
        var c = this,
            a;
        try {
            a = Ext.JSON.decode(b.responseText)
        } catch (d) {
            c.onExportFailure("Wrong server response received");
            return
        }
        if (a.success) {
            c.onExportSuccess(a)
        } else {
            c.onExportFailure(a.msg, a)
        }
    },
    onRequestFailure: function(a) {
        var b = this,
            c = a.status === 200 ? a.responseText : a.statusText;
        b.onExportFailure(c, a)
    },
    getParameters: function() {
        return {}
    },
    getAjaxConfig: function(a) {
        return {}
    },
    getWin: function() {
        return this.win || null
    },
    mask: function() {
        var a = Ext.getBody().mask();
        a.addCls("sch-export-mask")
    },
    unmask: function() {
        Ext.getBody().unmask()
    },
    destroy: function() {
        this.callParent(arguments);
        if (this.win) {
            this.win.destroy()
        }
    }
});
