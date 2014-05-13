Ext.define('DbsPeopleCfgParamTreeModel', {
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

Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: null,
	forceValue: false,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('DbsPeople:CfgParamTree','No module reference ?') ;
		}
		
		Ext.apply(me,{
			store: {
				model: 'DbsPeopleCfgParamTreeModel',
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
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'cfg_getTree',
				cfgParam_id: this.cfgParam_id
			},
			success: function(response) {
				var jsonResponse = Ext.decode(response.responseText) ;
				if( jsonResponse.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					this.getStore().setRootNode(jsonResponse.dataRoot) ;
					this.onAfterLoad() ;
					this.fireEvent('load',this) ;
				}
			},
			scope: this
		});
	},
	onAfterLoad: function() {
		this.getRootNode().cascadeBy(function(node) {
			if( node.isRoot() && this.value==null ) {
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
		if( this.value == null ) {
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
	
	autoAdvance: function() {
		var setValue ;
		this.getRootNode().cascadeBy( function(node) {
			if( node.childNodes.length > 1 ) {
				return false ;
			}
			setValue = node.getId() ;
			if( !node.get('expandable') ) {
				return false ;
			}
		}) ;
		if( setValue != null ) {
			this.value = setValue ;
			this.getRootNode().cascadeBy(function(node) {
				node.set('checked', (node.getId()==this.value) );
			},this);
			this.fireEvent('change',this.value) ;
		}
	}
}) ;