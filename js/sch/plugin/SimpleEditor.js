Ext.define("Sch.plugin.SimpleEditor", {
    extend: "Ext.Editor",
    alias: "plugin.scheduler_simpleeditor",
    requires: ["Ext.form.TextField"],
    mixins: ["Ext.AbstractPlugin", "Sch.mixin.Localizable"],
    lockableScope: "top",
    cls: "sch-simpleeditor",
    allowBlur: false,
    delegate: ".sch-event-inner",
    dataIndex: null,
    completeOnEnter: true,
    cancelOnEsc: true,
    ignoreNoChange: true,
    height: 19,
    autoSize: {
        width: "boundEl"
    },
    initComponent: function () {
        this.field = this.field || {
            xtype: "textfield",
            selectOnFocus: true
        };
        this.callParent(arguments)
    },
    init: function (a) {
        this.scheduler = a.getSchedulingView();
        a.on("afterrender", this.onSchedulerRender, this);
        this.scheduler.registerEventEditor(this);
        this.dataIndex = this.dataIndex || this.scheduler.getEventStore().model.prototype.nameField
    },
    edit: function (a, b) {
        b = b || this.scheduler.getElementFromEventRecord(a);
        this.startEdit(b.child(this.delegate));
        this.record = a;
        this.setValue(this.record.get(this.dataIndex))
    },
    onSchedulerRender: function (a) {
        this.on({
            startedit: this.onStartEdit,
            complete: function (e, f, d) {
                var b = this.record;
                var c = this.scheduler.eventStore;
                b.set(this.dataIndex, f);
                if (c.indexOf(b) < 0) {
                    if (this.scheduler.fireEvent("beforeeventadd", this.scheduler, b) !== false) {
                        c.append(b)
                    }
                }
                this.onAfterEdit()
            },
            canceledit: this.onAfterEdit,
            hide: function () {
                if (this.dragProxyEl) {
                    this.dragProxyEl.hide()
                }
            },
            scope: this
        });
        a.on({
            eventdblclick: function (b, c, d) {
                if (!a.isReadOnly()) {
                    this.edit(c)
                }
            },
            dragcreateend: this.onDragCreateEnd,
            scope: this
        })
    },
    onStartEdit: function () {
        if (!this.allowBlur) {
            Ext.getBody().on("mousedown", this.onMouseDown, this);
            this.scheduler.on("eventmousedown", function () {
                this.cancelEdit()
            }, this)
        }
    },
    onAfterEdit: function () {
        if (!this.allowBlur) {
            Ext.getBody().un("mousedown", this.onMouseDown, this);
            this.scheduler.un("eventmousedown", function () {
                this.cancelEdit()
            }, this)
        }
    },
    onMouseDown: function (b, a) {
        if (this.editing && this.el && !b.within(this.el)) {
            this.cancelEdit()
        }
    },
    onDragCreateEnd: function (b, a) {
        if (!this.dragProxyEl && this.scheduler.dragCreator) {
            this.dragProxyEl = this.scheduler.dragCreator.getProxy()
        }
        this.scheduler.onEventCreated(a);
        if (a.get(this.dataIndex) === "") {
            a.set(this.dataIndex, this.L("newEventText"))
        }
        this.edit(a, this.dragProxyEl)
    }
});
