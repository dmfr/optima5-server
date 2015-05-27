Ext.define("Sch.widget.ExportDialogForm", {
    extend: "Ext.form.Panel",
    requires: ["Ext.data.Store", "Ext.ProgressBar", "Ext.form.field.ComboBox", "Ext.form.field.Date", "Ext.form.FieldContainer", "Ext.form.field.Checkbox", "Sch.widget.ResizePicker"],
    border: false,
    bodyPadding: "10 10 0 10",
    autoHeight: true,
    initComponent: function () {
        var a = this;
        if (Ext.getVersion("extjs").isLessThan("4.2.1")) {
            if (typeof Ext.tip !== "undefined" && Ext.tip.Tip && Ext.tip.Tip.prototype.minWidth != "auto") {
                Ext.tip.Tip.prototype.minWidth = "auto"
            }
        }
        a.createFields();
        Ext.apply(this, {
            fieldDefaults: {
                labelAlign: "left",
                labelWidth: 120,
                anchor: "99%"
            },
            items: [a.rangeField, a.resizerHolder, a.datesHolder, a.showHeaderField, a.exportToSingleField, a.formatField, a.orientationField, a.progressBar || a.createProgressBar()]
        });
        a.callParent(arguments);
        a.onRangeChange(null, a.dialogConfig.defaultConfig.range);
        a.on({
            hideprogressbar: a.hideProgressBar,
            showprogressbar: a.showProgressBar,
            updateprogressbar: a.updateProgressBar,
            scope: a
        })
    },
    isValid: function () {
        var a = this;
        if (a.rangeField.getValue() === "date") {
            return a.dateFromField.isValid() && a.dateToField.isValid()
        }
        return true
    },
    getValues: function (e, c, d, b) {
        var a = this.callParent(arguments);
        var f = this.resizePicker.getValues();
        if (!e) {
            a.cellSize = f
        } else {
            a += "&cellSize[0]=" + f[0] + "&cellSize[1]=" + f[1]
        }
        return a
    },
    createFields: function () {
        var d = this,
            a = d.dialogConfig,
            f = '<table class="sch-fieldcontainer-label-wrap"><td width="1" class="sch-fieldcontainer-label">',
            e = '<td><div class="sch-fieldcontainer-separator"></div></table>';
        d.rangeField = new Ext.form.field.ComboBox({
            value: a.defaultConfig.range,
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
                change: d.onRangeChange,
                scope: d
            }
        });
        d.resizePicker = new Sch.widget.ResizePicker({
            dialogConfig: a,
            margin: "10 20"
        });
        d.resizerHolder = new Ext.form.FieldContainer({
            fieldLabel: a.scrollerDisabled ? a.adjustCols : a.adjustColsAndRows,
            labelAlign: "top",
            hidden: true,
            labelSeparator: "",
            beforeLabelTextTpl: f,
            afterLabelTextTpl: e,
            layout: "vbox",
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [d.resizePicker]
        });
        d.dateFromField = new Ext.form.field.Date({
            fieldLabel: a.dateRangeFromText,
            baseBodyCls: "sch-exportdialogform-date",
            name: "dateFrom",
            format: a.dateRangeFormat || Ext.Date.defaultFormat,
            allowBlank: false,
            maxValue: a.endDate,
            minValue: a.startDate,
            value: a.startDate
        });
        d.dateToField = new Ext.form.field.Date({
            fieldLabel: a.dateRangeToText,
            name: "dateTo",
            format: a.dateRangeFormat || Ext.Date.defaultFormat,
            baseBodyCls: "sch-exportdialogform-date",
            allowBlank: false,
            maxValue: a.endDate,
            minValue: a.startDate,
            value: a.endDate
        });
        d.datesHolder = new Ext.form.FieldContainer({
            fieldLabel: a.specifyDateRange,
            labelAlign: "top",
            hidden: true,
            labelSeparator: "",
            beforeLabelTextTpl: f,
            afterLabelTextTpl: e,
            layout: "vbox",
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [d.dateFromField, d.dateToField]
        });
        d.showHeaderField = new Ext.form.field.Checkbox({
            xtype: "checkboxfield",
            boxLabel: d.dialogConfig.showHeaderLabel,
            name: "showHeader",
            checked: !! a.defaultConfig.showHeaderLabel
        });
        d.exportToSingleField = new Ext.form.field.Checkbox({
            xtype: "checkboxfield",
            boxLabel: d.dialogConfig.exportToSingleLabel,
            name: "singlePageExport",
            checked: !! a.defaultConfig.singlePageExport
        });
        d.formatField = new Ext.form.field.ComboBox({
            value: a.defaultConfig.format,
            triggerAction: "all",
            forceSelection: true,
            editable: false,
            fieldLabel: a.formatFieldLabel,
            name: "format",
            queryMode: "local",
            store: ["A5", "A4", "A3", "Letter", "Legal"]
        });
        var c = a.defaultConfig.orientation === "portrait" ? 'class="sch-none"' : "",
            b = a.defaultConfig.orientation === "landscape" ? 'class="sch-none"' : "";
        d.orientationField = new Ext.form.field.ComboBox({
            value: a.defaultConfig.orientation,
            triggerAction: "all",
            baseBodyCls: "sch-exportdialogform-orientation",
            forceSelection: true,
            editable: false,
            fieldLabel: d.dialogConfig.orientationFieldLabel,
            afterSubTpl: new Ext.XTemplate('<span id="sch-exportdialog-imagePortrait" ' + b + '></span><span id="sch-exportdialog-imageLandscape" ' + c + "></span>"),
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
                change: function (h, g) {
                    switch (g) {
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
        })
    },
    createProgressBar: function () {
        return this.progressBar = new Ext.ProgressBar({
            text: this.config.progressBarText,
            animate: true,
            hidden: true,
            margin: "4px 0 10px 0"
        })
    },
    onRangeChange: function (b, a) {
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
    showProgressBar: function () {
        if (this.progressBar) {
            this.progressBar.show()
        }
    },
    hideProgressBar: function () {
        if (this.progressBar) {
            this.progressBar.hide()
        }
    },
    updateProgressBar: function (a) {
        if (this.progressBar) {
            this.progressBar.updateProgress(a)
        }
    }
});
