Ext.define("Sch.plugin.EventEditor", {
    extend: "Ext.form.Panel",
    mixins: ["Ext.AbstractPlugin", "Sch.mixin.Localizable"],
    alias: ["widget.eventeditor", "plugin.scheduler_eventeditor"],
    lockableScope: "normal",
    requires: ["Sch.util.Date", "Ext.form.Label"],
    hideOnBlur: true,
    startDateField: null,
    startTimeField: null,
    durationField: null,
    timeConfig: null,
    dateConfig: null,
    durationConfig: null,
    durationUnit: null,
    durationText: null,
    triggerEvent: "eventdblclick",
    fieldsPanelConfig: null,
    dateFormat: "Y-m-d",
    timeFormat: "H:i",
    cls: "sch-eventeditor",
    border: false,
    shadow: false,
    dynamicForm: true,
    eventRecord: null,
    hidden: true,
    collapsed: true,
    currentForm: null,
    schedulerView: null,
    resourceRecord: null,
    preventHeader: true,
    floating: true,
    hideMode: "offsets",
    ignoreCls: "sch-event-editor-ignore-click",
    readOnly: false,
    layout: {
        type: "vbox",
        align: "stretch"
    },
    constrain: false,
    constructor: function (a) {
        a = a || {};
        Ext.apply(this, a);
        this.durationUnit = this.durationUnit || Sch.util.Date.HOUR;
        this.addEvents("beforeeventdelete", "beforeeventsave");
        this.callParent(arguments)
    },
    initComponent: function () {
        if (!this.fieldsPanelConfig) {
            throw "Must define a fieldsPanelConfig property"
        }
        Ext.apply(this, {
            fbar: this.buttons || this.buildButtons(),
            items: [{
                    xtype: "container",
                    layout: "hbox",
                    height: 35,
                    border: false,
                    cls: "sch-eventeditor-timefields",
                    items: this.buildDurationFields()
                },
                Ext.applyIf(this.fieldsPanelConfig, {
                    flex: 1,
                    activeItem: 0
                })
            ]
        });
        this.callParent(arguments)
    },
    init: function (a) {
        this.ownerCt = a;
        this.schedulerView = a.getView();
        this.eventStore = this.schedulerView.getEventStore();
        this.schedulerView.on({
            afterrender: this.onSchedulerRender,
            destroy: this.onSchedulerDestroy,
            dragcreateend: this.onDragCreateEnd,
            scope: this
        });
        if (this.triggerEvent) {
            this.schedulerView.on(this.triggerEvent, this.onActivateEditor, this)
        }
        this.schedulerView.registerEventEditor(this)
    },
    onSchedulerRender: function () {
        this.render(Ext.getBody());
        if (this.hideOnBlur) {
            this.mon(Ext.getDoc(), "mousedown", this.onMouseDown, this)
        }
    },
    show: function (g, i) {
        var h = this.schedulerView.isReadOnly();
        if (h !== this.readOnly) {
            Ext.Array.each(this.query("field"), function (j) {
                j.setReadOnly(h)
            });
            this.saveButton.setVisible(!h);
            this.deleteButton.setVisible(!h);
            this.readOnly = h
        }
        if (this.deleteButton) {
            this.deleteButton.setVisible(!h && this.eventStore.indexOf(g) >= 0)
        }
        this.eventRecord = g;
        this.durationField.setValue(Sch.util.Date.getDurationInUnit(g.getStartDate(), g.getEndDate(), this.durationUnit));
        var e = g.getStartDate();
        this.startDateField.setValue(e);
        this.startTimeField.setValue(e);
        var f = this.schedulerView.up("[floating=true]");
        if (f) {
            this.getEl().setZIndex(f.getEl().getZIndex() + 1);
            f.addCls(this.ignoreCls)
        }
        this.callParent();
        i = i || this.schedulerView.getElementFromEventRecord(g);
        this.alignTo(i, this.schedulerView.getOrientation() == "horizontal" ? "bl" : "tl-tr", this.getConstrainOffsets(i));
        this.expand(!this.constrain);
        if (this.constrain) {
            this.doConstrain(Ext.util.Region.getRegion(Ext.getBody()))
        }
        var c, d = g.get("EventType");
        if (d && this.dynamicForm) {
            var b = this.items.getAt(1),
                a = b.query("> component[EventType=" + d + "]");
            if (!a.length) {
                throw "Can't find form for EventType=" + d
            }
            if (!b.getLayout().setActiveItem) {
                throw "Can't switch active component in the 'fieldsPanel'"
            }
            c = a[0];
            if (!(c instanceof Ext.form.Panel)) {
                throw "Each child component of 'fieldsPanel' should be a 'form'"
            }
            b.getLayout().setActiveItem(c)
        } else {
            c = this
        }
        this.currentForm = c;
        c.getForm().loadRecord(g)
    },
    getConstrainOffsets: function (a) {
        return [0, 0]
    },
    onSaveClick: function () {
        var e = this,
            h = e.eventRecord,
            a = this.currentForm.getForm();
        if (a.isValid() && this.fireEvent("beforeeventsave", this, h) !== false) {
            var c = e.startDateField.getValue(),
                i, b = e.startTimeField.getValue(),
                g = e.durationField.getValue();
            if (c && g >= 0) {
                if (b) {
                    Sch.util.Date.copyTimeValues(c, b)
                }
                i = Sch.util.Date.add(c, this.durationUnit, g)
            } else {
                return
            }
            var d = h.getResources(this.eventStore);
            var f = (d.length > 0 && d[0]) || this.resourceRecord;
            if (!this.schedulerView.allowOverlap && !this.schedulerView.isDateRangeAvailable(c, i, h, f)) {
                return
            }
            h.beginEdit();
            var j = h.endEdit;
            h.endEdit = Ext.emptyFn;
            a.updateRecord(h);
            h.endEdit = j;
            h.setStartEndDate(c, i);
            h.endEdit();
            if (this.eventStore.indexOf(this.eventRecord) < 0) {
                if (this.schedulerView.fireEvent("beforeeventadd", this.schedulerView, h) !== false) {
                    this.eventStore.append(h)
                }
            }
            e.collapse(null, true)
        }
    },
    onDeleteClick: function () {
        if (this.fireEvent("beforeeventdelete", this, this.eventRecord) !== false) {
            this.eventStore.remove(this.eventRecord)
        }
        this.collapse(null, true)
    },
    onCancelClick: function () {
        this.collapse(null, true)
    },
    buildButtons: function () {
        this.saveButton = new Ext.Button({
            text: this.L("saveText"),
            scope: this,
            handler: this.onSaveClick
        });
        this.deleteButton = new Ext.Button({
            text: this.L("deleteText"),
            scope: this,
            handler: this.onDeleteClick
        });
        this.cancelButton = new Ext.Button({
            text: this.L("cancelText"),
            scope: this,
            handler: this.onCancelClick
        });
        return [this.saveButton, this.deleteButton, this.cancelButton]
    },
    buildDurationFields: function () {
        this.startDateField = new Ext.form.field.Date(Ext.apply({
            width: 90,
            allowBlank: false,
            format: this.dateFormat
        }, this.dateConfig || {}));
        this.startDateField.getPicker().addCls(this.ignoreCls);
        this.startTimeField = new Ext.form.field.Time(Ext.apply({
            width: 70,
            allowBlank: false,
            format: this.timeFormat
        }, this.timeConfig || {}));
        this.startTimeField.getPicker().addCls(this.ignoreCls);
        this.durationField = new Ext.form.field.Number(Ext.apply({
            width: 45,
            value: 0,
            minValue: 0,
            allowNegative: false
        }, this.durationConfig || {}));
        this.durationLabel = new Ext.form.Label({
            text: this.getDurationText()
        });
        return [this.startDateField, this.startTimeField, this.durationField, this.durationLabel]
    },
    onActivateEditor: function (b, a) {
        this.show(a)
    },
    onMouseDown: function (a) {
        if (this.collapsed || a.within(this.getEl()) || a.getTarget("." + this.ignoreCls, 9) || a.getTarget(this.schedulerView.eventSelector)) {
            return
        }
        this.collapse()
    },
    onSchedulerDestroy: function () {
        this.destroy()
    },
    onDragCreateEnd: function (b, a, c) {
        if (!this.dragProxyEl && this.schedulerView.dragCreator) {
            this.dragProxyEl = this.schedulerView.dragCreator.getProxy()
        }
        this.resourceRecord = c;
        this.schedulerView.onEventCreated(a);
        this.show(a, this.dragProxyEl)
    },
    hide: function () {
        this.callParent(arguments);
        var a = this.dragProxyEl;
        if (a) {
            a.hide()
        }
    },
    afterCollapse: function () {
        this.hide();
        this.callParent(arguments)
    },
    getDurationText: function () {
        if (this.durationText) {
            return this.durationText
        }
        return Sch.util.Date.getShortNameOfUnit(Sch.util.Date.getNameOfUnit(this.durationUnit))
    }
});
