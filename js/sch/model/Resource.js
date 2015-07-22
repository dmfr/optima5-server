    Ext.define("Sch.model.Resource", {
        extend: "Sch.model.Customizable",
        idProperty: "Id",
        config: Ext.versions.touch ? {
            idProperty: "Id"
        } : null,
        nameField: "Name",
        customizableFields: [{
            name: "Name",
            type: "string"
        }],
        getInternalId: function() {
            return this.internalId
        },
        getResourceStore: function() {
            return this.joined && this.joined[0]
        },
        getEventStore: function() {
            var a = this.getResourceStore();
            return a && a.getEventStore() || this.parentNode && this.parentNode.getEventStore()
        },
        getAssignmentStore: function() {
            var a = this.getEventStore();
            return a && a.getAssignmentStore()
        },
        getEvents: function(a) {
            var b = this;
            a = a || b.getEventStore();
            return a && a.getEventsForResource(b) || []
        },
        getAssignments: function() {
            var b = this,
                a = b.getEventStore();
            return a && a.getAssignmentsForResource(b)
        },
        isPersistable: function() {
            var a = this.parentNode;
            return !a || !a.phantom || (a.isRoot && a.isRoot())
        }
    });
