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
	
	
	
	op5desktop = new Optima5.CoreDesktop.OptimaDesktop ;
	op5session = new Ext.util.MixedCollection();
});
