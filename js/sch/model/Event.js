Ext.define("Sch.model.Event", {
    extend: "Sch.model.Range",
    customizableFields: [{
        name: "Id"
    }, {
        name: "ResourceId"
    }, {
        name: "Draggable",
        type: "boolean",
        persist: false,
        defaultValue: true
    }, {
        name: "Resizable",
        persist: false,
        defaultValue: true
    }],
    resourceIdField: "ResourceId",
    draggableField: "Draggable",
    resizableField: "Resizable",
    getResource: function (c, b) {
        if (this.stores && this.stores.length > 0) {
            var a = (b || this.stores[0]).resourceStore;
            c = c || this.get(this.resourceIdField);
            if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore) {
                return a.getNodeById(c) || a.getRootNode().findChildBy(function (d) {
                    return d.internalId === c
                })
            } else {
                return a.getById(c) || a.data.map[c]
            }
        }
        return null
    },
    setResource: function (a) {
        this.set(this.resourceIdField, (a instanceof Ext.data.Model) ? a.getId() || a.internalId : a)
    },
    assign: function (a) {
        this.setResource.apply(this, arguments)
    },
    unassign: function (a) {},
    isDraggable: function () {
        return this.getDraggable()
    },
    isAssignedTo: function (a) {
        return this.getResource() === a
    },
    isResizable: function () {
        return this.getResizable()
    },
    isPersistable: function () {
        var b = this.getResources();
        var a = true;
        Ext.each(b, function (c) {
            if (c.phantom) {
                a = false;
                return false
            }
        });
        return a
    },
    forEachResource: function (d, c) {
        var a = this.getResources();
        for (var b = 0; b < a.length; b++) {
            if (d.call(c || this, a[b]) === false) {
                return
            }
        }
    },
    getResources: function (a) {
        var b = this.getResource(null, a);
        return b ? [b] : []
    }
});

