Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton' ,{
	extend: 'Optima5.Modules.Spec.DbsPeople.CfgParamButton',
	
	initComponent: function() {
		Ext.apply(this,{
			icon: 'images/op5img/ico_kuser_16.gif',
			text: 'Equipes',
			cfgParam_id: 'team'
		});
		this.callParent() ;
	},
	doAuthCleanup: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			treeStore = cfgParamTree.getStore(),
			treeNode = treeStore.getRootNode() ;
		
		var nodesToRemove = [] ;
		treeNode.cascadeBy( function(node) {
			if( node.isLeaf() && !Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperQueryTeam(node.get('nodeKey')) ) {
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