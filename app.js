Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Optima5' : './js/app'
		}
});

Ext.require('Optima5.CoreDesktop.OptimaDesktop');
// Ext.ns('Optima5.Modules');

var op5desktop, op5session ;
Ext.onReady(function () {
	
	// console.dir( Ext.Loader.history ) ;
	
	/*
	Overrides for fixing clearOnLoad for TreeStore
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
	
	Ext.override(Ext.data.AbstractStore,{
		indexOf: Ext.emptyFn
	});
	
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	op5desktop = new Optima5.CoreDesktop.OptimaDesktop ;
	op5session = new Ext.util.MixedCollection();
});
