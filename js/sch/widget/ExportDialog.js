Ext.define("Sch.widget.ExportDialog", {
    alternateClassName: "Sch.widget.PdfExportDialog",
    extend: "Ext.window.Window",
    requires: ["Sch.widget.ExportDialogForm"],
    mixins: ["Sch.mixin.Localizable"],
    alias: "widget.exportdialog",
    modal: false,
    width: 350,
    cls: "sch-exportdialog",
    frame: false,
    layout: "fit",
    draggable: true,
    padding: 0,
    myConfig: null,
    plugin: null,
    buttonsPanel: null,
    buttonsPanelScope: null,
    progressBar: null,
    dateRangeFormat: "",
    showHeaderField: true,
    showFooterField: false,
    constructor: function(a) {
        Ext.apply(this, a.exportDialogConfig);
        this.plugin = a.plugin;
        this.title = this.L("title");
        this.myConfig = Ext.apply({
            progressBarText: this.L("progressBarText"),
            dateRangeToText: this.L("dateRangeToText"),
            pickerText: this.L("pickerText"),
            dateRangeFromText: this.L("dateRangeFromText"),
            dateRangeText: this.L("dateRangeText"),
            currentViewText: this.L("currentViewText"),
            formatFieldLabel: this.L("formatFieldLabel"),
            orientationFieldLabel: this.L("orientationFieldLabel"),
            rangeFieldLabel: this.L("rangeFieldLabel"),
            showHeaderLabel: this.L("showHeaderLabel"),
            showFooterLabel: this.L("showFooterLabel"),
            exportersFieldLabel: this.L("exportersFieldLabel"),
            orientationPortraitText: this.L("orientationPortraitText"),
            orientationLandscapeText: this.L("orientationLandscapeText"),
            completeViewText: this.L("completeViewText"),
            adjustCols: this.L("adjustCols"),
            adjustColsAndRows: this.L("adjustColsAndRows"),
            specifyDateRange: this.L("specifyDateRange"),
            dateRangeFormat: this.dateRangeFormat,
            exportConfig: this.exportConfig,
            showHeaderField: this.showHeaderField,
            showFooterField: this.showFooterField,
            pageFormats: this.getPageFormats()
        }, a.exportDialogConfig);
        this.callParent(arguments)
    },
    getPageFormats: function() {
        var b = this.plugin.pageSizes,
            d = [];
        Ext.Object.each(b, function(e, f) {
            d.push({
                width: f.width,
                height: f.height,
                name: e
            })
        });
        d.sort(function(f, e) {
            return f.width - e.width
        });
        var a = [];
        for (var c = 0; c < d.length; c++) {
            a.push(d[c].name)
        }
        return a
    },
    initComponent: function() {
        var b = this,
            a = {
                hidedialogwindow: b.destroy,
                showdialogerror: b.showError,
                updateprogressbar: function(c, d) {
                    if (arguments.length == 2) {
                        b.fireEvent("updateprogressbar", c, undefined)
                    } else {
                        b.fireEvent("updateprogressbar", c, d)
                    }
                },
                scope: this
            };
        b.form = b.buildForm(b.myConfig);
        Ext.apply(this, {
            items: b.form,
            fbar: b.buildButtons(b.buttonsPanelScope || b)
        });
        b.callParent(arguments);
        b.plugin.on(a)
    },
    afterRender: function() {
        var a = this;
        a.relayEvents(a.form.resizePicker, ["change", "changecomplete", "select"]);
        a.form.relayEvents(a, ["updateprogressbar", "hideprogressbar", "showprogressbar"]);
        a.callParent(arguments)
    },
    buildButtons: function(a) {
        return [{
            xtype: "button",
            scale: "medium",
            text: this.L("exportButtonText"),
            handler: function() {
                if (this.form.isValid()) {
                    this.fireEvent("showprogressbar");
                    var c = this.form.getValues();
                    c.exporterId = c.exporterId;
                    var b = this.dateRangeFormat || Ext.Date.defaultFormat;
                    if (c.dateFrom && !Ext.isDate(c.dateFrom)) {
                        c.dateFrom = Ext.Date.parse(c.dateFrom, b)
                    }
                    if (c.dateTo && !Ext.isDate(c.dateTo)) {
                        c.dateTo = Ext.Date.parse(c.dateTo, b)
                    }
                    this.plugin.doExport(c)
                }
            },
            scope: a
        }, {
            xtype: "button",
            scale: "medium",
            text: this.L("cancelButtonText"),
            handler: function() {
                this.destroy()
            },
            scope: a
        }]
    },
    buildForm: function(a) {
        return new Sch.widget.ExportDialogForm({
            progressBar: this.progressBar,
            dialogConfig: a
        })
    },
    showError: function(b, a) {
        var c = b,
            d = a || c.L("generalError");
        c.fireEvent("hideprogressbar");
        Ext.Msg.alert("", d)
    }
});
