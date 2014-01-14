Ext.define('DbsPeopleCfgParamTreeModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'nodeKey',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
	extend:'Ext.tree.Panel',
	
	optimaModule: null,
	cfgParam_id: '',
	value: '',
	
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
			useArrows: true,
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
				}
			},
			scope: this
		});
	},
	onAfterLoad: function() {
		this.getStore().getRootNode().cascadeBy(function(node) {
			node.set('checked', (node.getId()==this.value) );
		},this);
		
		this.getView().on('checkchange',function(rec,check){
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
				this.onCheckChange() ;
			}
		},this) ;
	},
	onCheckChange: function() {
		
	}
}) ;