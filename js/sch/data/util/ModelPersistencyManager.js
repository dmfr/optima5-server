    Ext.define("Sch.data.util.ModelPersistencyManager", {
        config: {
            eventStore: null,
            resourceStore: null,
            assignmentStore: null
        },
        eventStoreDetacher: null,
        resourceStoreDetacher: null,
        assignmentStoreDetacher: null,
        constructor: function(a) {
            this.initConfig(a)
        },
        updateEventStore: function(a, c) {
            var b = this;
            Ext.destroyMembers(b, "eventStoreDetacher");
            if (a && a.autoSync) {
                b.eventStoreDetacher = a.on({
                    beforesync: b.onEventStoreBeforeSync,
                    scope: b,
                    destroyable: true,
                    priority: 100
                })
            }
        },
        updateResourceStore: function(a, b) {
            var c = this;
            Ext.destroyMembers(c, "resourceStoreDetacher");
            if (a && a.autoSync) {
                c.resourceStoreDetacher = a.on({
                    beforesync: c.onResourceStoreBeforeSync,
                    scope: c,
                    destroyable: true,
                    priority: 100
                })
            }
        },
        updateAssignmentStore: function(a, b) {
            var c = this;
            Ext.destroyMembers(c, "assignmentStoreDetacher");
            if (a && a.autoSync) {
                c.assignmentStoreDetacher = a.on({
                    beforesync: c.onAssignmentStoreBeforeSync,
                    scope: c,
                    destroyable: true,
                    priority: 100
                })
            }
        },
        onEventStoreBeforeSync: function(a) {
            var b = this;
            b.removeNonPersistableRecordsToCreate(a);
            return b.shallContinueSync(a)
        },
        onResourceStoreBeforeSync: function(a) {
            var b = this;
            b.removeNonPersistableRecordsToCreate(a);
            return b.shallContinueSync(a)
        },
        onAssignmentStoreBeforeSync: function(a) {
            var b = this;
            b.removeNonPersistableRecordsToCreate(a);
            return b.shallContinueSync(a)
        },
        removeNonPersistableRecordsToCreate: function(b) {
            var a = b.create || [],
                d, c;
            for (c = a.length - 1; c >= 0; --c) {
                d = a[c];
                if (!d.isPersistable()) {
                    Ext.Array.remove(a, d)
                }
            }
            if (a.length === 0) {
                delete b.create
            }
        },
        shallContinueSync: function(a) {
            return Boolean((a.create && a.create.length > 0) || (a.update && a.update.length > 0) || (a.destroy && a.destroy.length > 0))
        }
    });
