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
Ext.require('Ext.calendar.CalendarPanel') ;
Ext.require('Optima5.App');

var op5desktop, op5session ;
Ext.onReady(function () {
	
	/*
	Overrides for fixing clearOnLoad for TreeStore
	http://www.sencha.com/forum/showthread.php?154059-4.0.7-TreePanel-Error-when-reloading-the-treeStore
	http://www.sencha.com/forum/showthread.php?154318-url-is-undefined-on-TreeStore
	*/
	Ext.override(Ext.data.TreeStore, {
		load: function(options) {
			options = options || {};
			options.params = options.params || {};

			var me = this,
				node = options.node || me.tree.getRootNode(),
				root;

			// If there is not a node it means the user hasnt defined a rootnode yet. In this case lets just
			// create one for them.
			if (!node) {
				node = me.setRootNode({
					expanded: true
				});
			}
			if (me.clearOnLoad) {
				node.removeAll(false);
			}

			Ext.applyIf(options, {
				node: node
			});
			options.params[me.nodeParam] = node ? node.getId() : 'root';

			if (node) {
				node.set('loading', true);
			}

			return me.callParent([options]);
		}
	});

	/*
	Problème : erreur au destroy + recréation du FilePanel / BiblePanel
	"this.tempHidden is undefined" Error Workaround 
	http://www.sencha.com/forum/showthread.php?160222-quot-this.tempHidden-is-undefined-quot-Error-Workaround
	*/
	Ext.override(Ext.ZIndexManager, {
		tempHidden: [],
		show: function() {
			var comp, x, y;
			while (comp = this.tempHidden.shift()) {
				x = comp.x;
				y = comp.y;
				comp.show();
				comp.setPosition(x, y);
			}
		}
	});
	
	
	/*
	Edition en ligne du TreeStore (non utilisé dans ParaCRM
	http://stackoverflow.com/questions/9076979/extjs4-treepanel-childnode-editing
			store.indexOf is not a function
			rowIdx = store.indexOf(record);
	http://www.sencha.com/forum/showthread.php?130008-Where-did-Ext.tree.TreeEditor-go/page2
	*/
	Ext.override(Ext.data.AbstractStore,{
		indexOf: Ext.emptyFn
	});
	
	
	
	/*
	4.0.2 only??? layout fit grid scrollbar when used does not scroll content -- when filters change
	http://www.sencha.com/forum/showthread.php?137993-4.0.2-only-layout-fit-grid-scrollbar-when-used-does-not-scroll-content/page4
	
	---- en ligne pour chaque gridpanel -------
	*/
	
	
	
	
	/*
	Désactiver le click droit
	*/
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	
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
	
	Ext.form.FieldSet.override( {
		beforeDestroy: function() {
			this.callParent() ;
		}
	});
	
	Ext.view.DropZone.override( {
		onNodeDrop: function(node, dragZone, e, data) {
			var me = this,
					dropHandled = false,

					// Create a closure to perform the operation which the event handler may use.
					// Users may now set the wait parameter in the beforedrop handler, and perform any kind
					// of asynchronous processing such as an Ext.Msg.confirm, or an Ajax request,
					// and complete the drop gesture at some point in the future by calling either the
					// processDrop or cancelDrop methods.
					dropHandlers = {
						wait: false,
						processDrop: function () {
							me.invalidateDrop();
							me.handleNodeDrop(data, me.overRecord, me.currentPosition);
							dropHandled = true;
							me.fireViewEvent('drop', node, data, me.overRecord, me.currentPosition);
						},

						cancelDrop: function() {
							me.invalidateDrop();
							dropHandled = true;
						}
					},
					performOperation = false;

			if (me.valid) {
					performOperation = me.fireViewEvent('beforedrop', node, data, me.overRecord, me.currentPosition, dropHandlers);
					if (dropHandlers.wait) {
						return;
					}

					if (performOperation !== false) {
						// If either of the drop handlers were called in the event handler, do not do it again.
						if (!dropHandled) {
							dropHandlers.processDrop();
						}
					}
			}
			return performOperation;
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
	PAGING SCROLLER doesn't always sync when set to 0
	*/
	Ext.grid.PagingScroller.override( {
		onElScroll: function(e,t) {
			this.callOverridden(arguments);
			if( t.scrollTop == 0 && !this.syncScroll ) {
				this.syncTo() ;
			}
		}
	});
	
	
	
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
