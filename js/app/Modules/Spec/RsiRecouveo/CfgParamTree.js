Ext.define('RsiRecouveoCfgParamTreeModel', {
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

Ext.define('Optima5.Modules.Spec.RsiRecouveo.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: null,
	forceValue: false,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('RsiRecouveo:CfgParamTree','No module reference ?') ;
		}
		
		Ext.apply(me,{
			store: {
				model: 'RsiRecouveoCfgParamTreeModel',
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
		if( this.cfgParam_id && this.cfgParam_id.indexOf('ATR_')===0 ) {
			data = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrData(this.cfgParam_id) ;
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
					rootChildren.push({
						nodeId: row.id,
						nodeType: 'entry',
						nodeKey: row.id,
						nodeText: row.text,
						leaf: true
					});
				}) ;
			}) ;
			rootNode = {
				root: true,
				children: rootChildren,
				nodeText: '<b>'+Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(this.cfgParam_id).atr_txt+'</b>',
				expanded: true
			}
		} else if( this.cfgParam_id && this.cfgParam_id.indexOf('OPT_')===0 ) {
			data = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptData(this.cfgParam_id) ;
			var tmpTreeStore = Ext.create('Ext.data.TreeStore',{
				model: 'RsiRecouveoCfgParamTreeModel',
				root: {
					root: true,
					children: [],
					nodeText: '<b>'+Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptHeader(this.cfgParam_id).atr_txt+'</b>'
				},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			}) ;
			while( true ) {
				var cnt = 0 ;
				var parentNode ;
				Ext.Array.each( data, function(row) {
					if( tmpTreeStore.getNodeById( row.id ) ) {
						return ;
					}
					if( Ext.isEmpty(row.parent) ) {
						parentNode = tmpTreeStore.getRootNode() ;
					} else {
						parentNode = tmpTreeStore.getNodeById( row.parent ) ;
					}
					if( !parentNode ) {
						return ;
					}
					cnt++ ;
					parentNode.appendChild({
						nodeId: row.id,
						nodeType: 'entry',
						nodeKey: row.id,
						nodeText: row.text
					});
				}) ;
				if( cnt==0 ) {
					break ;
				}
			}
			tmpTreeStore.getRootNode().cascadeBy( function(node) {
				if( node.childNodes.length == 0 ) {
					node.set('leaf',true) ;
				} else {
					node.expand() ;
				}
			}) ;
			rootNode = tmpTreeStore.getRootNode().copy(undefined,true) ;
		} else {
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
			if( !node.isLeaf() ) {
				return ;
			}
			node.set('checked', (node.getId()==this.value) );
		},this);
		
		this.getView().on('checkchange',function(rec,check){
			var doFireCheckchange = false ;
			if( !check ) {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec==rec && (chrec.isLeaf()||chrec.isRoot()) ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				this.getRootNode().cascadeBy(function(chrec){
					if( chrec != rec && (chrec.isLeaf()||chrec.isRoot()) ) {
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
