Ext.define('QueryFieldsTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field_code',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_text',   type: 'string'},
		{name: 'field_text_full',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_type_text',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'field_linkbible_type',   type: 'string'}
	]
});

Ext.define('Optima5.Modules.ParaCRM.QueryPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmquery',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QuerySubpanelWhere',
		'Optima5.Modules.ParaCRM.QuerySubpanelGroup',
		'Optima5.Modules.ParaCRM.QuerySubpanelSelect',
		
		'Optima5.Modules.ParaCRM.QueryResultPanel'
	] ,
			  
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
		
		me.queryPanelCfg = {} ;
		Ext.apply(me.queryPanelCfg,{
			
			
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
	},

	queryNew: function( targetFileId ) {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_subaction: 'init',
			target_file_code: targetFileId,
			is_new: 'true'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
					// this.openEditFormWindow( {}, Ext.decode(response.responseText).transaction_id ) ;
				}
			},
			scope: this
		});
	},
	queryOpen: function( queryId ) {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_subaction: 'init',
			query_id: queryId,
			is_new: 'false'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.query_id = queryId ;
					me.query_name = Ext.decode(response.responseText).query_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	addComponents: function( ajaxParams ){
		var me = this ;
		
		var treeCfg = {} ;
		Ext.apply( treeCfg, {
			xtype: 'treepanel',
			title: 'Core Team Projects',
			flex: 1,
			useArrows: true,
			rootVisible: false,
			store: {
				model: 'QueryFieldsTreeModel',
				nodeParam: 'field_code',
				root: ajaxParams.treefields_root
			},
			columns: [{
				xtype: 'treecolumn', //this is so we know which column will show the tree
				text: 'Task',
				flex: 2,
				sortable: false,
				dataIndex: 'field_text',
				menuDisabled: true
			},{
				text: 'Assigned To',
				flex: 1,
				sortable: false,
				dataIndex: 'field_type_text',
				menuDisabled: true
			}],
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			},
			viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'TreeToGrids'
					}
			}
		}) ;
		
		me.add(treeCfg) ;
		me.add({
			xtype:'panel',
			flex: 2 ,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[ Ext.apply( Ext.create('Optima5.Modules.ParaCRM.QuerySubpanelWhere',{whereFields: ajaxParams.data_wherefields}) , {
				flex:1 ,
				border:false
			}),Ext.apply( Ext.create('Optima5.Modules.ParaCRM.QuerySubpanelGroup',{groupFields: ajaxParams.data_groupfields}) , {
				flex:1 ,
				border:false
			}),Ext.apply( Ext.create('Optima5.Modules.ParaCRM.QuerySubpanelSelect',{selectFields: ajaxParams.data_selectfields}) , {
				flex:1 ,
				border:false
			})],
			autoDestroy: true
		}) ;
	},
	getTreeStore: function() {
		var me = this ;
		
		return me.query('>treepanel')[0].getStore() ;
	},
			  
	remoteAction: function( actionCode, newQueryName ) {
		var me = this ;
		switch( actionCode ) {
			case 'submit' :
				me.remoteActionSubmit( Ext.emptyFn, me ) ;
				break ;
			case 'save' :
				me.remoteActionSubmit( me.remoteActionSave, me ) ;
				break ;
			case 'saveas' :
				me.remoteActionSubmit( me.remoteActionSaveAs, me, [newQueryName] ) ;
				break ;
			case 'delete' :
				me.remoteActionSubmit( me.remoteActionDelete, me ) ;
				break ;
				
			case 'run' :
				me.remoteActionSubmit( me.remoteActionRun, me ) ;
				break ;
				
			default :
				break ;
		}
	},
	remoteActionSubmit: function( callback, callbackScope, callbackArguments ) {
		var me = this ;
		
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
					  
			data_wherefields: Ext.JSON.encode(me.query('op5paracrmquerywhere')[0].saveGetArray() ) ,
			data_groupfields: Ext.JSON.encode(me.query('op5paracrmquerygroup')[0].saveGetArray() ) ,
			data_selectfields: Ext.JSON.encode(me.query('op5paracrmqueryselect')[0].saveGetArray() )
		});
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					callback.call( me, callbackArguments ) ;
				}
			},
			scope: me
		});
	},
	remoteActionSave: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'save'
		});
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).query_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionSaveAs: function( newQueryName ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'saveas',
			query_name: newQueryName
		});
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).query_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionDelete: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'delete'
		});
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).query_id) ;
					me.destroyPanel() ;
				}
			},
			scope: me
		});
	},
	remoteActionRun: function() {
		var me = this ;
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				msgbox.close() ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					// do something to open window
					me.openQueryResultPanel( Ext.decode(response.responseText).RES_id ) ;
				}
			},
			scope: me
		});
	},
	openQueryResultPanel: function( resultId ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_builderTransaction',
			_transaction_id : me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.ParaCRM.QueryResultPanel',{
			ajaxBaseParams: baseAjaxParams,
			RES_id: resultId
		}) ;
		var queryResultPanelWindow = op5desktop.getDesktop().createWindow({
			title:'(Query) '+me.query_name ,
			width:800,
			height:600,
			iconCls: 'parapouet',
			animCollapse:false,
			border: false,

			layout: {
				type: 'card',
				align: 'stretch'
			},
			items: [ queryResultPanel ]
		}) ;
		queryResultPanelWindow.show() ;
		
		queryResultPanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	}

});