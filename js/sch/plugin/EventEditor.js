Ext.define("Sch.plugin.EventEditor", {
    extend: "Ext.form.Panel",
    mixins: ["Ext.AbstractPlugin", "Sch.mixin.Localizable"],
    alias: ["widget.eventeditor", "plugin.scheduler_eventeditor"],
    lockableScope: "normal",
    requires: ["Sch.util.Date", "Ext.util.Region", "Ext.form.Label", "Ext.form.field.Date", "Ext.form.field.Time"],
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
    dragProxyEl: null,
    constrain: false,
    constructor: function(a) {
        a = a || {};
        Ext.apply(this, a);
        this.durationUnit = this.durationUnit || Sch.util.Date.HOUR;
        this.callParent(arguments)
    },
    initComponent: function() {
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
            }, Ext.applyIf(this.fieldsPanelConfig, {
                flex: 1,
                activeItem: 0
            })]
        });
        this.callParent(arguments)
    },
    init: function(a) {
        this.ownerCt = a;
        this.schedulerView = a.getView();
        this.eventStore = this.schedulerView.getEventStore();
        this.schedulerView.on({
            afterrender: this.onSchedulerRender,
            dragcreateend: this.onDragCreateEnd,
            scope: this
        });
        this.schedulerView.on("eventrepaint", this.onEventRepaint, this);
        if (this.triggerEvent) {
            this.schedulerView.on(this.triggerEvent, this.onActivateEditor, this)
        }
        this.schedulerView.registerEventEditor(this)
    },
    onSchedulerRender: function() {
        this.render(Ext.getBody());
        if (this.hideOnBlur) {
            this.mon(Ext.getDoc(), "mousedown", this.onMouseDown, this)
        }
    },
    show: function(g, i) {
        var h = this.schedulerView.isReadOnly();
        if (h !== this.readOnly) {
            Ext.Array.forEach(this.query("field"), function(j) {
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
        this.durationField.setValue(Sch.util.Date.getDurationInUnit(g.getStartDate(), g.getEndDate(), this.durationUnit, true));
        var e = g.getStartDate();
        this.startDateField.setValue(e);
        this.startTimeField.setValue(e);
        var f = this.schedulerView.up("[floating=true]");
        if (f) {
            this.getEl().setZIndex(f.getEl().getZIndex() + 1);
            f.addCls(this.ignoreCls)
        }
        this.callParent();
        i = i || this.schedulerView.getElementsFromEventRecord(g)[0];
        this.alignTo(i, this.schedulerView.getMode() == "horizontal" ? "bl" : "tl-tr", this.getConstrainOffsets(i));
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
    getConstrainOffsets: function(a) {
        return [0, 0]
    },
    onSaveClick: function() {
        var i = this,
            g = i.eventRecord,
            a = i.currentForm.getForm();
        if (a.isValid() && i.fireEvent("beforeeventsave", i, g) !== false) {
            var c = i.startDateField.getValue(),
                h, b = i.startTimeField.getValue(),
                e = i.durationField.getValue();
            if (c && e >= 0) {
                if (b) {
                    Sch.util.Date.copyTimeValues(c, b)
                }
                h = Sch.util.Date.add(c, i.durationUnit, e)
            } else {
                return
            }
            if (!i.schedulerView.allowOverlap) {
                var d = g.getResources(i.eventStore);
                var f = false;
                d = d.length > 0 ? d : [i.resourceRecord];
                Ext.each(d, function(j) {
                    return f = !i.schedulerView.isDateRangeAvailable(c, h, g, j)
                });
                if (f) {
                    return
                }
            }
            i.schedulerView.un("eventrepaint", i.onEventRepaint, i);
            i.onBeforeSave(g);
            g.beginEdit();
            a.updateRecord(g);
            g.setStartEndDate(c, h);
            g.endEdit();
            if (i.eventStore.indexOf(i.eventRecord) < 0) {
                if (i.schedulerView.fireEvent("beforeeventadd", i.schedulerView, g) !== false) {
                    i.eventStore.append(g)
                }
            }
            i.onAfterSave(g);
            i.collapse(null, true);
            i.schedulerView.on("eventrepaint", i.onEventRepaint, i)
        }
    },
    onBeforeSave: function(a) {},
    onAfterSave: function(a) {},
    onDeleteClick: function() {
        if (this.fireEvent("beforeeventdelete", this, this.eventRecord) !== false) {
            this.eventStore.remove(this.eventRecord)
        }
        this.collapse(null, true)
    },
    onCancelClick: function() {
        this.collapse(null, true)
    },
    buildButtons: function() {
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
    buildDurationFields: function() {
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
    onActivateEditor: function(b, a) {
        this.show(a)
    },
    onMouseDown: function(a) {
        if (this.collapsed || a.within(this.getEl()) || a.getTarget("." + this.ignoreCls, 9) || a.getTarget(this.schedulerView.eventSelector)) {
            return
        }
        this.collapse()
    },
    onDragCreateEnd: function(c, b, d, f, a) {
        this.dragProxyEl = a;
        this.resourceRecord = d;
        this.schedulerView.onEventCreated(b);
        this.show(b, this.dragProxyEl)
    },
    hide: function() {
        this.callParent(arguments);
        var a = this.dragProxyEl;
        if (a) {
            a.hide()
        }
    },
    afterCollapse: function() {
        this.hide();
        this.callParent(arguments)
    },
    getDurationText: function() {
        if (this.durationText) {
            return this.durationText
        }
        return Sch.util.Date.getShortNameOfUnit(Sch.util.Date.getNameOfUnit(this.durationUnit))
    },
    onEventRepaint: function(b, a) {
        if (!this.getCollapsed() && a === this.eventRecord) {
            this.show(a)
        }
    }
});
