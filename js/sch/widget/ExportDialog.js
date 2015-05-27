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
    plugin: null,
    buttonsPanel: null,
    buttonsPanelScope: null,
    progressBar: null,
    dateRangeFormat: "",
    constructor: function (a) {
        Ext.apply(this, a.exportDialogConfig);
        Ext.Array.forEach(["generalError", "title", "formatFieldLabel", "orientationFieldLabel", "rangeFieldLabel", "showHeaderLabel", "orientationPortraitText", "orientationLandscapeText", "completeViewText", "currentViewText", "dateRangeText", "dateRangeFromText", "pickerText", "dateRangeToText", "exportButtonText", "cancelButtonText", "progressBarText", "exportToSingleLabel"], function (b) {
            if (b in a) {
                this[b] = a[b]
            }
        }, this);
        this.title = this.L("title");
        this.config = Ext.apply({
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
            exportToSingleLabel: this.L("exportToSingleLabel"),
            orientationPortraitText: this.L("orientationPortraitText"),
            orientationLandscapeText: this.L("orientationLandscapeText"),
            completeViewText: this.L("completeViewText"),
            adjustCols: this.L("adjustCols"),
            adjustColsAndRows: this.L("adjustColsAndRows"),
            specifyDateRange: this.L("specifyDateRange"),
            dateRangeFormat: this.dateRangeFormat,
            defaultConfig: this.defaultConfig
        }, a.exportDialogConfig);
        this.callParent(arguments)
    },
    initComponent: function () {
        var b = this,
            a = {
                hidedialogwindow: b.destroy,
                showdialogerror: b.showError,
                updateprogressbar: function (c) {
                    b.fireEvent("updateprogressbar", c)
                },
                scope: this
            };
        b.form = b.buildForm(b.config);
        Ext.apply(this, {
            items: b.form,
            fbar: b.buildButtons(b.buttonsPanelScope || b)
        });
        b.callParent(arguments);
        b.plugin.on(a)
    },
    afterRender: function () {
        var a = this;
        a.relayEvents(a.form.resizePicker, ["change", "changecomplete", "select"]);
        a.form.relayEvents(a, ["updateprogressbar", "hideprogressbar", "showprogressbar"]);
        a.callParent(arguments)
    },
    buildButtons: function (a) {
        return [{
            xtype: "button",
            scale: "medium",
            text: this.L("exportButtonText"),
            handler: function () {
                if (this.form.isValid()) {
                    this.fireEvent("showprogressbar");
                    this.plugin.doExport(this.form.getValues())
                }
            },
            scope: a
        }, {
            xtype: "button",
            scale: "medium",
            text: this.L("cancelButtonText"),
            handler: function () {
                this.destroy()
            },
            scope: a
        }]
    },
    buildForm: function (a) {
        return new Sch.widget.ExportDialogForm({
            progressBar: this.progressBar,
            dialogConfig: a
        })
    },
    showError: function (b, a) {
        var c = b,
            d = a || c.L("generalError");
        c.fireEvent("hideprogressbar");
        Ext.Msg.alert("", d)
    }
});
