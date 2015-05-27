    Ext.define("Sch.model.Resource", {
        extend: "Sch.model.Customizable",
        idProperty: "Id",
        config: Ext.versions.touch ? {
            idProperty: "Id"
        } : null,
        nameField: "Name",
        customizableFields: ["Id", {
            name: "Name",
            type: "string"
        }],
        getEventStore: function () {
            return this.stores[0] && this.stores[0].eventStore || this.parentNode && this.parentNode.getEventStore()
        },
        getEvents: function (d) {
            var c = [],
                e, f = this.getId() || this.internalId;
            d = d || this.getEventStore();
            for (var b = 0, a = d.getCount(); b < a; b++) {
                e = d.getAt(b);
                if (e.data[e.resourceIdField] === f) {
                    c.push(e)
                }
            }
            return c
        }
    });

