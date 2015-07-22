Ext.define("Sch.widget.ExportDialogForm", {
    extend: "Ext.form.Panel",
    requires: ["Ext.data.Store", "Ext.XTemplate", "Ext.ProgressBar", "Ext.form.field.ComboBox", "Ext.form.field.Date", "Ext.form.FieldContainer", "Ext.form.field.Checkbox", "Sch.widget.ResizePicker"],
    border: false,
    bodyPadding: "10 10 0 10",
    autoHeight: true,
    initComponent: function() {
        var a = this;
        a.fieldDefaults = Ext.applyIf(a.fieldDefaults || {}, {
            labelAlign: "left",
            labelWidth: 120,
            anchor: "99%"
        });
        a.items = a.createFields();
        a.items.push(a.progressBar || a.createProgressBar());
        a.callParent(arguments);
        a.onRangeChange(null, a.dialogConfig.exportConfig.range);
        a.onExporterChange(a.exportersField, a.exportersField.getValue());
        a.on({
            hideprogressbar: a.hideProgressBar,
            showprogressbar: a.showProgressBar,
            updateprogressbar: a.updateProgressBar,
            scope: a
        })
    },
    isValid: function() {
        var a = this;
        if (a.rangeField.getValue() === "date") {
            return a.dateFromField.isValid() && a.dateToField.isValid()
        }
        return true
    },
    getValues: function(e, c, d, b) {
        var a = this.callParent(arguments);
        a.showHeader = !!a.showHeader;
        a.showFooter = !!a.showFooter;
        var f = this.resizePicker.getValues();
        if (!e) {
            a.cellSize = f
        } else {
            a += "&cellSize[0]=" + f[0] + "&cellSize[1]=" + f[1]
        }
        return a
    },
    createFields: function() {
        var e = this,
            a = e.dialogConfig,
            g = '<table class="sch-fieldcontainer-label-wrap"><td width="1" class="sch-fieldcontainer-label">',
            f = '<td><div class="sch-fieldcontainer-separator"></div></table>',
            b = [];
        e.rangeField = new Ext.form.field.ComboBox({
            value: a.exportConfig.range,
            triggerAction: "all",
            cls: "sch-export-dialog-range",
            forceSelection: true,
            editable: false,
            fieldLabel: a.rangeFieldLabel,
            name: "range",
            queryMode: "local",
            displayField: "name",
            valueField: "value",
            store: new Ext.data.Store({
                fields: ["name", "value"],
                data: [{
                    name: a.completeViewText,
                    value: "complete"
                }, {
                    name: a.dateRangeText,
                    value: "date"
                }, {
                    name: a.currentViewText,
                    value: "current"
                }]
            }),
            listeners: {
                change: e.onRangeChange,
                scope: e
            }
        });
        e.resizePicker = new Sch.widget.ResizePicker({
            dialogConfig: a,
            margin: "10 20"
        });
        e.resizerHolder = new Ext.form.FieldContainer({
            fieldLabel: a.scrollerDisabled ? a.adjustCols : a.adjustColsAndRows,
            labelAlign: "top",
            hidden: true,
            labelSeparator: "",
            beforeLabelTextTpl: g,
            afterLabelTextTpl: f,
            layout: "vbox",
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [e.resizePicker]
        });
        e.dateFromField = new Ext.form.field.Date({
            fieldLabel: a.dateRangeFromText,
            baseBodyCls: "sch-exportdialogform-date",
            name: "dateFrom",
            format: a.dateRangeFormat || Ext.Date.defaultFormat,
            allowBlank: false,
            maxValue: a.endDate,
            minValue: a.startDate,
            value: a.startDate
        });
        e.dateToField = new Ext.form.field.Date({
            fieldLabel: a.dateRangeToText,
            name: "dateTo",
            format: a.dateRangeFormat || Ext.Date.defaultFormat,
            baseBodyCls: "sch-exportdialogform-date",
            allowBlank: false,
            maxValue: a.endDate,
            minValue: a.startDate,
            value: a.endDate
        });
        e.datesHolder = new Ext.form.FieldContainer({
            fieldLabel: a.specifyDateRange,
            labelAlign: "top",
            hidden: true,
            labelSeparator: "",
            beforeLabelTextTpl: g,
            afterLabelTextTpl: f,
            layout: "vbox",
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [e.dateFromField, e.dateToField]
        });
        if (a.showHeaderField) {
            e.showHeaderField = new Ext.form.field.Checkbox({
                fieldLabel: e.dialogConfig.showHeaderLabel,
                cls: "sch-export-dialog-header",
                name: "showHeader",
                checked: !!a.exportConfig.showHeader,
                checkedValue: true,
                uncheckedValue: false
            })
        }
        if (a.showFooterField) {
            e.showFooterField = new Ext.form.field.Checkbox({
                fieldLabel: e.dialogConfig.showFooterLabel,
                cls: "sch-export-dialog-footer",
                name: "showFooter",
                checked: !!a.exportConfig.showFooter,
                checkedValue: true,
                uncheckedValue: false
            })
        }
        e.exportersField = new Ext.form.field.ComboBox({
            value: a.defaultExporter,
            triggerAction: "all",
            cls: "sch-export-dialog-exporter",
            forceSelection: true,
            editable: false,
            fieldLabel: a.exportersFieldLabel,
            name: "exporterId",
            queryMode: "local",
            displayField: "name",
            valueField: "value",
            store: e.buildExporterStore(a.exporters),
            listeners: {
                change: e.onExporterChange,
                scope: e
            }
        });
        e.formatField = new Ext.form.field.ComboBox({
            value: a.exportConfig.format,
            triggerAction: "all",
            forceSelection: true,
            editable: false,
            fieldLabel: a.formatFieldLabel,
            name: "format",
            queryMode: "local",
            store: a.pageFormats || ["A5", "A4", "A3", "Letter", "Legal"]
        });
        var d = a.exportConfig.orientation === "portrait" ? 'class="sch-none"' : "",
            c = a.exportConfig.orientation === "landscape" ? 'class="sch-none"' : "";
        e.orientationField = new Ext.form.field.ComboBox({
            value: a.exportConfig.orientation,
            triggerAction: "all",
            componentCls: "sch-exportdialogform-orientation",
            forceSelection: true,
            editable: false,
            fieldLabel: e.dialogConfig.orientationFieldLabel,
            afterSubTpl: new Ext.XTemplate('<span id="sch-exportdialog-imagePortrait" ' + c + '></span><span id="sch-exportdialog-imageLandscape" ' + d + "></span>"),
            name: "orientation",
            displayField: "name",
            valueField: "value",
            queryMode: "local",
            store: new Ext.data.Store({
                fields: ["name", "value"],
                data: [{
                    name: a.orientationPortraitText,
                    value: "portrait"
                }, {
                    name: a.orientationLandscapeText,
                    value: "landscape"
                }]
            }),
            listeners: {
                change: function(i, h) {
                    switch (h) {
                        case "landscape":
                            Ext.fly("sch-exportdialog-imagePortrait").toggleCls("sch-none");
                            Ext.fly("sch-exportdialog-imageLandscape").toggleCls("sch-none");
                            break;
                        case "portrait":
                            Ext.fly("sch-exportdialog-imagePortrait").toggleCls("sch-none");
                            Ext.fly("sch-exportdialog-imageLandscape").toggleCls("sch-none");
                            break
                    }
                }
            }
        });
        b.push(e.rangeField);
        b.push(e.resizerHolder);
        b.push(e.datesHolder);
        b.push(e.exportersField);
        b.push(e.formatField);
        b.push(e.orientationField);
        if (a.showHeaderField) {
            b.push(e.showHeaderField)
        }
        if (a.showFooterField) {
            b.push(e.showFooterField)
        }
        return b
    },
    buildExporterStore: function(c) {
        var e = [];
        for (var b = 0, a = c.length; b < a; b++) {
            var d = c[b];
            e.push({
                name: d.getName(),
                value: d.getExporterId()
            })
        }
        return Ext.create("Ext.data.Store", {
            fields: ["name", "value"],
            data: e
        })
    },
    createProgressBar: function() {
        return this.progressBar = new Ext.ProgressBar({
            text: this.config.progressBarText,
            animate: true,
            hidden: true,
            margin: "4px 0 10px 0"
        })
    },
    onRangeChange: function(b, a) {
        switch (a) {
            case "complete":
                this.datesHolder.hide();
                this.resizerHolder.hide();
                break;
            case "date":
                this.datesHolder.show();
                this.resizerHolder.hide();
                break;
            case "current":
                this.datesHolder.hide();
                this.resizerHolder.show();
                this.resizePicker.expand(true);
                break
        }
    },
    onExporterChange: function(b, a) {
        switch (a) {
            case "singlepage":
                this.disableFields(true);
                break;
            default:
                this.disableFields(false)
        }
    },
    disableFields: function(b) {
        var a = this;
        if (a.showHeaderField) {
            a.showHeaderField.setDisabled(b)
        }
        a.formatField.setDisabled(b);
        a.orientationField.setDisabled(b)
    },
    showProgressBar: function() {
        if (this.progressBar) {
            this.progressBar.show()
        }
    },
    hideProgressBar: function() {
        if (this.progressBar) {
            this.progressBar.hide()
        }
    },
    updateProgressBar: function(a, b) {
        if (this.progressBar) {
            this.progressBar.updateProgress(a);
            if (b) {
                this.progressBar.updateText(b)
            }
        }
    }
});
