Ext.define('DbsLamCfgParamTreeModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'nodeId',
    fields: [
        {name: 'nodeId',  type: 'string'},
		  {name: 'nodeType', type: 'string'},
		  {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'},
		  {name: 'leaf_only', type:'boolean'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsLam.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: null,
	forceValue: false,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('DbsLam:CfgParamTree','No module reference ?') ;
		}
		
		Ext.apply(me,{
			store: {
				model: 'DbsLamCfgParamTreeModel',
				root: {children:[]},
				proxy: {
					type: 'memory' ,
					reader: {
						type: 'json'
					}
				}
			},
			displayField: 'nodeText',
			rootVisible: true,
			useArrows: true
		});
		this.callParent() ;
		me.startLoading() ;
	},
	startLoading: function() {
		if( this.cfgParam_root ) {
			this.doLoading(this.cfgParam_root) ;
			return ;
		}
		var rootNode, rootChildren = [] ;
		switch( this.cfgParam_id ) {
			case 'WHSE' :
				data = Optima5.Modules.Spec.DbsLam.HelperCache.getWhseAll() ;
				Ext.Array.each( data, function(row) {
					rootChildren.push({
						nodeId: row.whse_code,
						nodeType: 'entry',
						nodeKey: row.whse_code,
						nodeText: row.whse_txt,
						leaf: true
					}) ;
				}) ;
				rootNode = {
					root: true,
					children: rootChildren,
					nodeText: '<b>Warehouses</b>',
					expanded: true
				}
				break ;
				
			case 'SOC' :
				data = Optima5.Modules.Spec.DbsLam.HelperCache.getSocAll() ;
				Ext.Array.each( data, function(row) {
					rootChildren.push({
						nodeId: row.soc_code,
						nodeType: 'entry',
						nodeKey: row.soc_code,
						nodeText: row.soc_txt,
						leaf: true
					}) ;
				}) ;
				rootNode = {
					root: true,
					children: rootChildren,
					nodeText: '<b>Customers</b>',
					expanded: true
				}
				break ;
				
			case 'CONTAINER' :
				data = Optima5.Modules.Spec.DbsLam.HelperCache.getContainerTypeAll() ;
				Ext.Array.each( data, function(row) {
					rootChildren.push({
						nodeId: row.container_type,
						nodeType: 'entry',
						nodeKey: row.container_type,
						nodeText: row.container_type_txt,
						leaf: true
					}) ;
				}) ;
				rootNode = {
					root: true,
					children: rootChildren,
					nodeText: '<b>Container Types</b>',
					expanded: true
				}
				break ;
				
			case 'MVTFLOW' :
			case 'MVTFLOWSTEP' :
				data = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflowAll() ;
				var doSteps = (this.cfgParam_id=='MVTFLOWSTEP') ;
				Ext.Array.each( data, function(row) {
					flowChildren = [] ;
					Ext.Array.each( row.steps, function(rowstep) {
						flowChildren.push({
							nodeId: rowstep.step_code,
							nodeType: 'entry',
							nodeKey: rowstep.step_code,
							nodeText: rowstep.step_code + ' : ' + rowstep.step_txt,
							leaf: true
						});
					}) ;
					rootChildren.push({
						nodeId: row.flow_code,
						nodeType: 'treenode',
						nodeKey: row.flow_code,
						nodeText: row.flow_code + ' : ' + row.flow_txt,
						expanded: (doSteps ? true : false),
						leaf: (doSteps ? false : true),
						children: (doSteps ? flowChildren : null)
					}) ;
				}) ;
				rootNode = {
					root: true,
					children: rootChildren,
					nodeText: '<b>Mvt flow / step</b>',
					expanded: true
				}
				break ;
				
				
			case 'TPLTRANSFER' :
			case 'TPLTRANSFERSTEP' :
				data = Optima5.Modules.Spec.DbsLam.HelperCache.getTplTransferAll() ;
				var doSteps = (this.cfgParam_id=='TPLTRANSFERSTEP') ;
				Ext.Array.each( data, function(row) {
					flowChildren = [] ;
					Ext.Array.each( row.steps, function(rowstep) {
						flowChildren.push({
							nodeId: rowstep.transferstep_tpl,
							nodeType: 'entry',
							nodeKey: rowstep.transferstep_tpl,
							nodeText: rowstep.transferstep_idx + ' : ' + rowstep.transferstep_txt,
							leaf: true
						});
					}) ;
					rootChildren.push({
						nodeId: row.transfer_tpl,
						nodeType: 'treenode',
						nodeKey: row.transfer_tpl,
						nodeText: row.transfer_tpl + ' : ' + row.transfer_tpltxt,
						expanded: (doSteps ? true : false),
						leaf: (doSteps ? false : true),
						children: (doSteps ? flowChildren : null)
					}) ;
				}) ;
				rootNode = {
					root: true,
					children: rootChildren,
					nodeText: '<b>Transfer templates</b>',
					expanded: true
				}
				break ;
				
			default :
				rootNode = {
					root: true,
					children: [],
					nodeText: 'Not defined',
					expanded: true
				}
		}
		this.getStore().setRootNode(rootNode) ;
		this.onAfterLoad() ;
		this.fireEvent('load',this) ;
	},
	setRootNode: function(rootNode) {
		this.callParent([rootNode]) ;
		this.onAfterLoad() ;
	},
	onAfterLoad: function() {
		this.getRootNode().cascadeBy(function(node) {
			if( node.isRoot() && Ext.isEmpty(this.value) ) {
				node.set('checked',true) ;
				return ;
			}
			node.set('checked', (node.getId()==this.value) );
		},this);
		
		this.getView().on('checkchange',function(rec,check){
			var doFireCheckchange = false ;
			if( !check ) {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				doFireCheckchange = true ;
			}
			if( rec == this.getRootNode() ) {
				this.value = null ;
			} else {
				this.value = rec.getId() ;
			}
			
			if( doFireCheckchange ) {
				this.fireEvent('change',this.value) ;
			}
		},this) ;
	},
	getValue: function() {
		return this.value ;
	},
	getCheckedNode: function() {
		var storeNode ;
		if( Ext.isEmpty(this.value) ) {
			storeNode = (this.forceValue ? this.getRootNode() : null) ;
		} else {
			storeNode = this.getStore().getNodeById( this.value ) ;
		}
		return storeNode ;
	},
	getNode: function() {
		var storeNode = this.getCheckedNode() ;
		if( storeNode == null ) {
			return null ;
		}
		return storeNode.data ;
	},
	getLeafNodesKey: function() {
		var storeNode = this.getCheckedNode() ;
		if( storeNode == null ) {
			return null ;
		}
		
		var leafs ;
		if( storeNode.isLeaf() ) {
			leafs = [storeNode.data.nodeKey] ;
		} else {
			leafs = [] ;
			storeNode.cascadeBy(function(node) {
				if( node.isLeaf() ) {
					leafs.push(node.data.nodeKey) ;
				}
			});
		}
		return leafs ;
	},
	
	setValue: function( nodeId, silent ) {
		if( !Ext.isEmpty(nodeId) && this.getStore().getNodeById(nodeId) == null ) {
			return ;
		}
		
		this.value = nodeId ;
		if( this.value == null ) {
			this.getRootNode().cascadeBy(function(node) {
				node.set('checked', node.isRoot());
			},this) ;
		} else {
			this.getRootNode().cascadeBy(function(node) {
				node.set('checked', (node.getId()==this.value) );
			},this);
		}
		
		if( silent === undefined || !silent ) {
			this.fireEvent('change',this.value) ;
		}
	},
	
	autoAdvance: function() {
		var setValue ;
		this.getRootNode().cascadeBy( function(node) {
			if( node.childNodes.length > 1 ) {
				return false ;
			}
			if( node.childNodes.length == 1 ) {
				var uniqueChildNode = node.childNodes[0] ;
				if( !uniqueChildNode.isLeaf() ) {
					setValue = uniqueChildNode.getId() ;
				}
			}
			if( !node.get('expandable') ) {
				return false ;
			}
		}) ;
		if( setValue != null ) {
			this.setValue(setValue) ;
		}
	}
}) ;
