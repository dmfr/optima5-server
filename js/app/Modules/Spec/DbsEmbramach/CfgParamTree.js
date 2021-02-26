Ext.define('DbsEmbramachCfgParamTreeModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'nodeId',
    fields: [
        {name: 'nodeId',  type: 'string'},
		  {name: 'nodeType', type: 'string'},
		  {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'},
		  {name: 'nodeCls',  type: 'string'},
		  {name: 'leaf_only', type:'boolean'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsEmbramach.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: null,
	forceValue: false,
		
	selectMode: 'SINGLE',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('DbsEmbramach:CfgParamTree','No module reference ?') ;
		}
		
		Ext.apply(me,{
			store: {
				model: 'DbsEmbramachCfgParamTreeModel',
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
		this.on('checkchange',this.onCheckChange,this) ;
		this.on('added',function() {
			this.startLoading() ;
		},this,{single:true}) ;
	},
	startLoading: function() {
		if( this.cfgParam_root ) {
			this.doLoading(this.cfgParam_root) ;
			return ;
		}
		var rootNode, rootChildren = [] ;
		var startCfgParam_id = null ;
		if( this.cfgParam_id.startsWith('WRN_') ) {
			var data = Optima5.Modules.Spec.DbsEmbramach.HelperCache.getListData('LIST_'+this.cfgParam_id) ;
			var map_nodeCode_rows = {} ;
			Ext.Array.each( data, function(row) {
				if( !map_nodeCode_rows.hasOwnProperty(row.node) ) {
					map_nodeCode_rows[row.node] = [] ;
				}
				map_nodeCode_rows[row.node].push(row) ;
			}) ;
			Ext.Object.each( map_nodeCode_rows, function(node,rows) {
				flowChildren = [] ;
				Ext.Array.each( rows, function(row) {
					flowChildren.push({
						nodeId: row.id,
						nodeType: 'entry',
						nodeKey: row.id,
						nodeText: row.text,
						leaf: true
					});
				}) ;
				rootChildren.push({
					nodeId: 't_'+node,
					nodeType: 'treenode',
					nodeKey: node,
					nodeText: node,
					expanded: true,
					children: flowChildren
				}) ;
			}) ;
			rootNode = {
				root: true,
				children: rootChildren,
				nodeText: '<b>Reason codes</b>',
				expanded: true
			}
			
			startCfgParam_id = 'WRN' ;
		}
		switch( startCfgParam_id || this.cfgParam_id ) {
			case 'WRN' :
				break ;
			case 'FILTER_LATENESS' :
				rootNode = {
					root: true,
					children: [{
						nodeId: 'ACTIVE',
						nodeText: 'In-process',
						expanded: true,
						children: [{
							nodeId: 'ACTIVE_RED',
							nodeText: 'KO',
							iconCls: 'op5-spec-dbsembramach-gridcell-red-legend',
							icon:Ext.BLANK_IMAGE_URL,
							leaf: true
						},{
							nodeId: 'ACTIVE_ORANGE',
							nodeText: 'At risk',
							iconCls: 'op5-spec-dbsembramach-gridcell-orange-legend',
							icon:Ext.BLANK_IMAGE_URL,
							leaf: true
						},{
							nodeId: 'ACTIVE_GREEN',
							nodeText: 'Ongoing',
							iconCls: 'op5-spec-dbsembramach-gridcell-green-legend',
							icon:Ext.BLANK_IMAGE_URL,
							leaf: true
						}]
					},{
						nodeId: 'CLOSED',
						nodeText: 'Closed (< 24h)',
						expanded: true,
						children: [{
							nodeId: 'CLOSED_KO',
							nodeText: 'KO',
							iconCls: 'op5-spec-dbsembramach-gridcell-red-legend',
							icon:Ext.BLANK_IMAGE_URL,
							leaf: true
						},{
							nodeId: 'CLOSED_YES',
							nodeText: 'YES',
							iconCls: 'op5-spec-dbsembramach-gridcell-green-legend',
							icon:Ext.BLANK_IMAGE_URL,
							leaf: true
						}]
					}],
					nodeText: '<b>Filter status</b>',
					expanded: true
				}
				break ;
				
			case 'SOC' :
				var data = Optima5.Modules.Spec.DbsEmbramach.HelperCache.getSocAll() ;
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
			if( !node.isLeaf() && !this.allValues ) {
				return ;
			}
			node.set('checked', (this.selectMode == 'MULTI' ? (!!this.value && Ext.Array.contains(this.value, node.getId())) : (node.getId()==this.value)) );
		},this);
	},
	getValue: function() {
		return this.value ;
	},
	getCheckedNode: function() {
		if( this.selectMode == 'MULTI' ) {
			return null ;
		}
		var storeNode ;
		if( Ext.isEmpty(this.value) ) {
			storeNode = (this.forceValue ? this.getRootNode() : null) ;
		} else {
			storeNode = this.getStore().getNodeById( this.value ) ;
		}
		return storeNode ;
	},
	getCheckedNodes: function() {
		if( this.selectMode != 'MULTI' ) {
			return null ;
		}
		var storeNodes = [] ;
		if( Ext.isEmpty(this.value) ) {
			if( !this.forceValue ) {
				return null ;
			}
			storeNodes.push( this.getRootNode() ) ;
		} else {
			Ext.Array.each( this.value, function(val) {
				storeNodes.push( this.getStore().getNodeById( val ) ) ;
			},this) ;
		}
		return storeNodes ;
	},
	getLeafNodesKey: function() {
		var storeNodes = ( this.selectMode=='MULTI' ? this.getCheckedNodes() : (this.getCheckedNode() ? [this.getCheckedNode()]:[]) ) ;
		if( storeNodes == null || storeNodes.length==0 ) {
			return null ;
		}
		
		var allLeafs = [] ;
		Ext.Array.each( storeNodes, function(storeNode) {
			var leafs ;
			if( storeNode.isLeaf() ) {
				leafs = [storeNode.getId()] ;
			} else {
				leafs = (this.allValues ? [storeNode.getId()] : []) ;
				storeNode.cascadeBy(function(node) {
					if( node.isLeaf() || this.allValues ) {
						leafs.push(node.getId()) ;
					}
				},this);
			}
			allLeafs = Ext.Array.merge(allLeafs,leafs) ;
		},this) ;
		return allLeafs ;
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
				if( node.getId()==this.value ) {
					node.set('checked', true );
					node.cascadeBy(function(lnode) {
						lnode.set('checked',true);
					});
					return false ;
				} else {
					node.set('checked', false );
				}
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
				setValue = uniqueChildNode.getId() ;
			}
			if( !node.get('expandable') ) {
				return false ;
			}
		}) ;
		if( setValue != null ) {
			this.setValue(setValue) ;
		}
	},
	
	onCheckChange: function(rec,checked) {
		if( this.selectMode == 'MULTI' ) {
			var doFireCheckchange = true ;
			
			if( rec.isRoot() ) {
				this.getRootNode().cascadeBy(function(chrec){
					if( (chrec.isRoot()) ) {
						chrec.set('checked',true) ;
					} else if( chrec.isLeaf() || this.allValues ) {
						chrec.set('checked',false) ;
					}
				},this);
			} else {
				rec.cascadeBy( function(chrec) {
					chrec.set('checked',checked) ;
				}) ;
				if( !checked ) {
					var upRecord = rec ;
					while( upRecord.parentNode ) {
						upRecord.parentNode.set('checked',checked) ;
						upRecord = upRecord.parentNode
					}
				}
			}
			
			var recs = [] ;
			this.getRootNode().cascadeBy(function(chrec){
				if( (chrec.isLeaf() && chrec.get('checked')) ) {
					recs.push(chrec.getId()) ;
				}
			},this);
			this.getRootNode().set('checked',recs.length==0) ;
			this.value = recs ;
		} else {
			var doFireCheckchange = false ;
			if( !checked ) {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec==rec && (this.allValues||chrec.isLeaf()||chrec.isRoot()) ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec != rec && (this.allValues||chrec.isLeaf()||chrec.isRoot()) ) {
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
		}
		
		if( doFireCheckchange ) {
			this.fireEvent('change',this.value) ;
		}
	}
}) ;
