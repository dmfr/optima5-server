Ext.define('Optima5.Modules.Spec.DbsEmbramach.CfgParamSocButton' ,{
	extend: 'Optima5.Modules.Spec.DbsEmbramach.CfgParamButton',
	
	initComponent: function() {
		Ext.apply(this,{
			cfgParam_id: 'SOC',
			icon: 'images/op5img/ico_blocs_small.gif',
			text: 'Companies',
		});
		this.callParent() ;
	},
	doAuthCleanup: function() {
		console.trace() ;
		console.dir(this) ;
		var cfgParamTree = this.treepanel,
			treeStore = cfgParamTree.getStore(),
			treeNode = treeStore.getRootNode() ;
		
		var nodesToRemove = [] ;
		treeNode.cascadeBy( function(node) {
			if( node.isLeaf() && !Optima5.Modules.Spec.DbsEmbramach.HelperCache.authHelperQuerySoc(node.get('nodeKey')) ) {
				nodesToRemove.push(node) ;
			}
		}) ;
		Ext.Array.each( nodesToRemove, function(node) {
			while(true) {
				parentNode = node.parentNode ;
				node.remove() ;
				node = parentNode ;
				if( node == null ){
					break ;
				}
				if( node.hasChildNodes() ) {
					break ;
				}
			}
		}) ;
		cfgParamTree.forceValue = true ;
		cfgParamTree.autoAdvance() ;
	}
}) ;
