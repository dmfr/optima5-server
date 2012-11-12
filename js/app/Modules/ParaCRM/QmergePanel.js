Ext.define('QueryModel', {
	extend: 'Ext.data.Model',
	idProperty: 'query_id',
	fields: [
		{name: 'query_id',  type: 'int'},
		{name: 'query_name',   type: 'string'},
		{name: 'target_file_code',   type: 'string'}
	],
	hasMany: [{ 
		model: 'QueryWhereModel',
		name: 'fields_where',
		associationKey: 'fields_where'
	},{
		model: 'QueryGroupModel',
		name: 'fields_group',
		associationKey: 'fields_group'
	},{
		model: 'QuerySelectModel',
		name: 'fields_select',
		associationKey: 'fields_select'
	},{
		model: 'QueryProgressModel',
		name: 'fields_progress',
		associationKey: 'fields_progress'
	}]
});


Ext.define('Optima5.Modules.ParaCRM.QmergePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmqmerge',
			  
	requires: [] ,
			  
	bibleQueriesStore: null,
			  
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true
		}) ;
		
		me.qmergePanelCfg = {} ;
		Ext.apply(me.qmergePanelCfg,{
			
			
		});
		
		me.callParent() ;
		
		me.on({
			scope: me,
			activate: me.createPanel,
			deactivate: me.destroyPanel
		});
	},
			  
			  
	
	
	createPanel: function(){
		var me = this ;
		
		me.isActive = true ;
		
		me.removeAll();
	},
	destroyPanel: function(){
		var me = this ;
		
		me.isActive = false ;
		me.removeAll();
		me.bibleQueriesStore = null ;
	},

	qmergeNew: function() {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
	},
	qmergeOpen: function( qmergeId ) {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
	}
});