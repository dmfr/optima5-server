Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Ext.calendar' : './js/ext/calendar',
		'Optima5' : './js/app'
		}
});
Ext.require('Ext.*') ;
Ext.require('Optima5.App');

var op5desktop, op5session ;
Ext.onReady(function () {
	/*
	Load record for multi-select COMBO
	http://www.sencha.com/forum/archive/index.php/t-202456.html?s=ef437a00595a4b216c80d979879ef5fc
	http://stackoverflow.com/questions/6299164/using-ext-form-basic-loadrecord-to-load-data-into-combo-box-fields-with-remote-s
	*/
	Ext.form.field.ComboBox.override( {
		setValue: function(v) {
			if( Ext.JSON.decode(v,true) != null ) {
				arguments[0] = Ext.JSON.decode(v) ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	DATE FIELD : treat 0000-00-00 as null
	*/
	Ext.form.field.Date.override( {
		setValue: function() {
			if( arguments[0] == '0000-00-00' ) {
				arguments[0] = null ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	TreeViewDragDrop : containerScroll 
	*/
	Ext.tree.plugin.TreeViewDragDrop.override( {
		onViewRender : function(view) {
			var me = this;
			
			if (me.enableDrag) {
					me.dragZone = new Ext.tree.ViewDragZone({
						view: view,
						ddGroup: me.dragGroup || me.ddGroup,
						dragText: me.dragText,
						repairHighlightColor: me.nodeHighlightColor,
						repairHighlight: me.nodeHighlightOnRepair
					});
			}
			
			if (me.enableDrop) {
				me.dropZone = new Ext.tree.ViewDropZone({
					view: view,
					ddGroup: me.dropGroup || me.ddGroup,
					allowContainerDrops: me.allowContainerDrops,
					appendOnly: me.appendOnly,
					allowParentInserts: me.allowParentInserts,
					expandDelay: me.expandDelay,
					dropHighlightColor: me.nodeHighlightColor,
					dropHighlight: me.nodeHighlightOnDrop,
					containerScroll: me.containerScroll
				});
			}
		}
	});
	
	/*
	 * Bug EXTJSIV-4601
	 * http://www.sencha.com/forum/showthread.php?158328-Possible-bug-in-TreeStore-ExtJs-4.0.7-(setRootNode-registerNode-includeChildren)
	 */
	Ext.data.Tree.override( {
    setRootNode : function(node) {
        var me = this;

        me.root = node;

        if (me.fireEvent('beforeappend', null, node) !== false) {
            node.set('root', true);
            node.updateInfo();
            // root node should never be phantom or dirty, so commit it
            node.commit();

            node.on({
                scope: me,
                insert: me.onNodeInsert,
                append: me.onNodeAppend,
                remove: me.onNodeRemove
            });

            me.relayEvents(node, [
                /**
                 * @event append
                 * @inheritdoc Ext.data.NodeInterface#append
                 */
                "append",

                /**
                 * @event remove
                 * @inheritdoc Ext.data.NodeInterface#remove
                 */
                "remove",

                /**
                 * @event move
                 * @inheritdoc Ext.data.NodeInterface#move
                 */
                "move",

                /**
                 * @event insert
                 * @inheritdoc Ext.data.NodeInterface#insert
                 */
                "insert",

                /**
                 * @event beforeappend
                 * @inheritdoc Ext.data.NodeInterface#beforeappend
                 */
                "beforeappend",

                /**
                 * @event beforeremove
                 * @inheritdoc Ext.data.NodeInterface#beforeremove
                 */
                "beforeremove",

                /**
                 * @event beforemove
                 * @inheritdoc Ext.data.NodeInterface#beforemove
                 */
                "beforemove",

                /**
                 * @event beforeinsert
                 * @inheritdoc Ext.data.NodeInterface#beforeinsert
                 */
                "beforeinsert",

                /**
                 * @event expand
                 * @inheritdoc Ext.data.NodeInterface#expand
                 */
                "expand",

                /**
                 * @event collapse
                 * @inheritdoc Ext.data.NodeInterface#collapse
                 */
                "collapse",

                /**
                 * @event beforeexpand
                 * @inheritdoc Ext.data.NodeInterface#beforeexpand
                 */
                "beforeexpand",

                /**
                 * @event beforecollapse
                 * @inheritdoc Ext.data.NodeInterface#beforecollapse
                 */
                "beforecollapse" ,

                /**
                 * @event sort
                 * @inheritdoc Ext.data.NodeInterface#event-sort
                 */
                "sort",

                /**
                 * @event rootchange
                 * Fires whenever the root node is changed in the tree.
                 * @param {Ext.data.Model} root The new root
                 */
                "rootchange"
            ]);

            me.nodeHash = {};
            me.registerNode(node,true);
            me.fireEvent('append', null, node);
            me.fireEvent('rootchange', node);
        }

        return node;
    }
	}) ;
	
	/*
	Désactiver le click droit
	*/
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
