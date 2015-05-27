Ext.define("Sch.mixin.AbstractSchedulerPanel", {
    requires: ["Sch.model.Event", "Sch.model.Resource", "Sch.data.EventStore", "Sch.data.ResourceStore", "Sch.util.Date"],
    eventBarIconClsField: "",
    enableEventDragDrop: true,
    resourceColumnClass: "Sch.column.Resource",
    resourceColumnWidth: null,
    allowOverlap: true,
    startParamName: "startDate",
    endParamName: "endDate",
    passStartEndParameters: false,
    variableRowHeight: true,
    eventRenderer: null,
    eventRendererScope: null,
    eventStore: null,
    resourceStore: null,
    onEventCreated: function (a) {},
    initStores: function () {
        var a = this.resourceStore || this.store;
        if (!a) {
            Ext.Error.raise("You must specify a resourceStore config")
        }
        if (!this.eventStore) {
            Ext.Error.raise("You must specify an eventStore config")
        }
        this.store = Ext.StoreManager.lookup(a);
        this.resourceStore = this.store;
        this.eventStore = Ext.StoreManager.lookup(this.eventStore);
        if (!this.eventStore.isEventStore) {
            Ext.Error.raise("Your eventStore should be a subclass of Sch.data.EventStore (or consume the EventStore mixin)")
        }
        this.resourceStore.eventStore = this.eventStore;
        if (this.passStartEndParameters) {
            this.eventStore.on("beforeload", this.applyStartEndParameters, this)
        }
    },
    _initializeSchedulerPanel: function () {
        this.initStores();
        if (this.eventBodyTemplate && Ext.isString(this.eventBodyTemplate)) {
            this.eventBodyTemplate = new Ext.XTemplate(this.eventBodyTemplate)
        }
    },
    getResourceStore: function () {
        return this.resourceStore
    },
    getEventStore: function () {
        return this.eventStore
    },
    applyStartEndParameters: function (b, a) {
        a.params = a.params || {};
        a.params[this.startParamName] = this.getStart();
        a.params[this.endParamName] = this.getEnd()
    },
    createResourceColumns: function (b) {
        var a = [];
        var c = this;
        this.resourceStore.each(function (d) {
            a.push(Ext.create(c.resourceColumnClass, {
                renderer: c.mainRenderer,
                scope: c,
                width: b || 100,
                text: d.getName(),
                model: d
            }))
        });
        return a
    }
});
