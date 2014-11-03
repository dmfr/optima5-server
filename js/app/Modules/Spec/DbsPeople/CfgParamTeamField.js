Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamTeamField' ,{
	extend: 'Optima5.Modules.Spec.DbsPeople.CfgParamField',
	
	cfgParam_id: 'team',
	cfgParam_emptyDisplayText: 'Equipes',
	
	doAuthCleanup: function() {
		var cfgParamTree = this.cfgParamTree,
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
