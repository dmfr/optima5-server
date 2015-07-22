    Ext.define("Sch.model.Assignment", {
        extend: "Sch.model.Customizable",
        idProperty: "Id",
        customizableFields: [{
            name: "ResourceId"
        }, {
            name: "EventId"
        }],
        resourceIdField: "ResourceId",
        eventIdField: "EventId",
        getInternalId: function() {
            return this.internalId
        },
        getAssignmentStore: function() {
            return this.joined && this.joined[0]
        },
        getEventStore: function() {
            var a = this.getAssignmentStore();
            return a && a.getEventStore()
        },
        getResourceStore: function() {
            var a = this.getEventStore();
            return a && a.getResourceStore()
        },
        getEvent: function(a) {
            var b = this;
            a = a || b.getEventStore();
            return a && a.getModelById(b.getEventId())
        },
        getResource: function(b) {
            var a = this;
            b = b || a.getResourceStore();
            return b && b.getModelById(a.getResourceId())
        },
        getEventName: function(a) {
            var b = this.getEvent(a);
            return b && b.getName() || ""
        },
        getResourceName: function(a) {
            var b = this.getResource(a);
            return b && b.getName() || ""
        },
        isPersistable: function() {
            var b = this,
                a = b.getEvent(),
                c = b.getResource();
            return a && !a.phantom && c && !c.phantom
        },
        fullCopy: function() {
            return this.copy.apply(this, arguments)
        }
    });
