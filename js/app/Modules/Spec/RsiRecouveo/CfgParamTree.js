Ext.define('RsiRecouveoCfgParamTreeModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'nodeId',
    fields: [
        {name: 'nodeId',  type: 'string'},
		  {name: 'nodeType', type: 'string'},
		  {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'},
		  {name: 'nodeNext', type: 'string'},
		  {name: 'leaf_only', type:'boolean'}
     ]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: null,
	forceValue: false,
		
	selectMode: 'SINGLE',
	
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
		this.on('checkchange',this.onCheckChange,this) ;
		me.startLoading() ;
	},
	startLoading: function() {
		if( this.cfgParam_root ) {
			this.doLoading(this.cfgParam_root) ;
			return ;
		}
		var rootNode, rootChildren = [] ;
		if( this.cfgParam_id && this.cfgParam_id.indexOf('ADR_')===0 && this.accountRecord ) {
			var adrType = this.cfgParam_id.substring(4) ;
			
			var adrbookRootMap = {} ;
			var adrbookEntityNameMap = {} ;
			//adrbookRootMap['Autre'] = [] ;
			this.accountRecord.adrbook().each( function(adrBookRec) {
				adrbookRootMap[adrBookRec.get('adr_entity')] = [] ;
				adrbookEntityNameMap[adrBookRec.get('adr_entity')] = adrBookRec.get('adr_entity_name') ;
				adrBookRec.adrbookentries().each( function(adrBookEntryRec) {
					if( adrBookEntryRec.get('status_is_invalid') ) {
							return ;
					}
					if( adrBookEntryRec.get('adr_type') != adrType ) {
							return ;
					}
					adrbookRootMap[adrBookRec.get('adr_entity')].push( {
						leaf: true,
						
						nodeId: adrBookEntryRec.get('adrbookentry_filerecord_id'),
						nodeType: 'adr',
						nodeKey: adrBookEntryRec.get('adrbookentry_filerecord_id'),
						nodeText: adrBookEntryRec.get('adr_txt')
					} ) ;
				});
			}) ;
			var adrbookRootChildren = [] ;
			Ext.Object.each( adrbookRootMap, function(k,v) {
				adrbookRootChildren.push({
					expanded: false,
					leaf: false,
					
					nodeId: k,
					nodeType: 'entity',
					nodeKey: k,
					nodeText: k,
					nodeNext: adrbookEntityNameMap[k],
					
					children: v
				})
			}) ;
			
			rootNode = {
				root: true,
				expanded: true,
				nodeText: '<b>'+'Saisie autres coordonnées'+'</b>',
				children: adrbookRootChildren
			}; 
			
		} else if( this.cfgParam_id && this.cfgParam_id.indexOf('ATR_')===0 ) {
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
						nodeText: row.text,
						nodeNext: row.next
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
		} else if( this.cfgParam_id && this.cfgParam_id=='SOC' ) {
			data = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getSocAll() ;
			var tmpTreeStore = Ext.create('Ext.data.TreeStore',{
				model: 'RsiRecouveoCfgParamTreeModel',
				root: {
					root: true,
					children: [],
					nodeText: '<b>'+'Liste entités'+'</b>'
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
					if( tmpTreeStore.getNodeById( row.soc_id ) ) {
						return ;
					}
					if( Ext.isEmpty(row.soc_parent_id) ) {
						parentNode = tmpTreeStore.getRootNode() ;
					} else {
						parentNode = tmpTreeStore.getNodeById( row.soc_parent_id ) ;
					}
					if( !parentNode ) {
						return ;
					}
					cnt++ ;
					parentNode.appendChild({
						nodeId: row.soc_id,
						nodeType: 'entry',
						nodeKey: row.soc_id,
						nodeText: row.soc_name
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
			this.allValues=true ;
		} else if( this.cfgParam_id && this.cfgParam_id=='USER' ) {
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getUserAll(), function(userRow) {
				rootChildren.push({
						nodeId: userRow.user_id,
						nodeType: 'entry',
						nodeKey: userRow.user_id,
						nodeText: userRow.user_txt,
						leaf: true
				});
			}) ;
			rootNode = {
				root: true,
				children: rootChildren,
				nodeText: '<b>'+'Affectation utilisateur'+'</b>',
				expanded: true
			}
			this.allValues=true ;
		} else if( this.cfgParam_id && this.cfgParam_id=='ACTIONNEXT' ) {
			data = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionnextData() ;
			var tmpTreeStore = Ext.create('Ext.data.TreeStore',{
				model: 'RsiRecouveoCfgParamTreeModel',
				root: {
					root: true,
					children: [],
					nodeText: '<b>'+'Prochaine action'+'</b>'
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
						nodeText: row.text,
						nodeNext: row.next
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
			this.allValues=true ;
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
				leafs = [storeNode.data.nodeKey] ;
			} else {
				leafs = (this.allValues ? [storeNode.data.nodeKey] : []) ;
				storeNode.cascadeBy(function(node) {
					if( node.isLeaf() || this.allValues ) {
						leafs.push(node.data.nodeKey) ;
					}
				},this);
			}
			allLeafs = Ext.Array.merge(allLeafs,leafs) ;
		},this) ;
		return allLeafs ;
	},
	
	setValue: function( nodeId, silent ) {
		this.value = nodeId ;
		if( this.value == null ) {
			this.getRootNode().cascadeBy(function(node) {
				node.set('checked', node.isRoot());
			},this) ;
		} else if( this.selectMode=='MULTI' ) {
			this.getRootNode().cascadeBy(function(node) {
				if( node.get('checked') === null ) {
					return  ;
				}
				node.set('checked', Ext.Array.contains(this.value, node.getId()) );
			},this);
		} else {
			this.getRootNode().cascadeBy(function(node) {
				if( node.get('checked') === null ) {
					return  ;
				}
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
	},
	
	onCheckChange: function(rec,checked) {
		if( this.selectMode == 'MULTI' ) {
			var doFireCheckchange = true ;
			
			if( rec.isRoot() ) {
				this.getRootNode().cascadeBy(function(chrec){
					if( (chrec.isLeaf()) ) {
						chrec.set('checked',false) ;
					}
					if( (chrec.isRoot()) ) {
						chrec.set('checked',true) ;
					}
				},this);
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
