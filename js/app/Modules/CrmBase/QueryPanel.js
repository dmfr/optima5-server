Ext.define('QueryFieldsTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field_code',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_text',   type: 'string'},
		{name: 'field_text_full',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_type_text',   type: 'string'},
		{name: 'field_linktype',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'field_linkbible_type',   type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QueryPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbasequery',
			  
	requires: [
		'Optima5.Modules.CrmBase.QuerySubpanelWhere',
		'Optima5.Modules.CrmBase.QuerySubpanelGroup',
		'Optima5.Modules.CrmBase.QuerySubpanelSelect',
		'Optima5.Modules.CrmBase.QuerySubpanelProgress',
		
		'Optima5.Modules.CrmBase.QueryResultPanel'
	] ,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			autoDestroy: true
		}) ;
		
		me.callParent() ;
	},
	
	
	queryNew: function( targetFileId ) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_builderTransaction',
			_subaction: 'init',
			target_file_code: targetFileId,
			is_new: 'true'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
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
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_builderTransaction',
			_subaction: 'init',
			query_id: queryId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
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
		
		me.removeAll();
		
		me.transaction_id = ajaxParams.transaction_id ;
		if( ajaxParams.query_id && ajaxParams.query_id > 0 ) {
			me.query_id = ajaxParams.query_id ;
			me.query_name =  ajaxParams.query_name ;
		}
		
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
			viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'TreeToGrids'+me.getId()
					}
			}
		}) ;
		
		me.add(treeCfg) ;
		me.add({
			xtype:'panel',
			layout: 'border',
			flex: 2,
			items:[{
				xtype:'panel',
				region:'center',
				flex: 3,
				border:false,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items:[ Ext.create('Optima5.Modules.CrmBase.QuerySubpanelWhere', {
					optimaModule: me.optimaModule,
					whereFields: ajaxParams.data_wherefields,
					flex:1 ,
					border:false
				}),Ext.create('Optima5.Modules.CrmBase.QuerySubpanelGroup', {
					optimaModule: me.optimaModule,
					groupFields: ajaxParams.data_groupfields,
					flex:1 ,
					border:false
				}),Ext.create('Optima5.Modules.CrmBase.QuerySubpanelSelect', {
					optimaModule: me.optimaModule,
					selectFields: ajaxParams.data_selectfields ,
					flex:1 ,
					border:false
				})]
			},Ext.create('Optima5.Modules.CrmBase.QuerySubpanelProgress',{
				optimaModule: me.optimaModule,
				flex:1,
				region: 'south',
				border:false,
				progressFields: ajaxParams.data_progressfields,
				listeners: {
					expand: function(progresspanel) {
						//me.doLayout() ;
					},
					collapse : function( progresspanel ) {
						progresspanel.setFormpanelRecord(null);
						progresspanel.store.removeAll() ;
					},
					scope: me
				},
				collapsible: true,
				collapsed: (ajaxParams.data_progressfields.length == 0)? true:false
			})],
			autoDestroy: true
		}) ;
		
		if( me.loadMask ) {
			me.loadMask.hide() ;
		}
	},
	getQueryPanelTreeStore: function() {
		var me = this ;
		
		return me.query('>treepanel')[0].getStore() ;
	},
			  
	remoteAction: function( actionCode, actionParam ) {
		var me = this ;
		switch( actionCode ) {
			case 'submit' :
				me.remoteActionSubmit( Ext.emptyFn, me ) ;
				break ;
			case 'save' :
				me.remoteActionSubmit( me.remoteActionSave, me ) ;
				break ;
			case 'saveas' :
				var newQueryName = actionParam ;
				me.remoteActionSubmit( me.remoteActionSaveAs, me, [newQueryName] ) ;
				break ;
			case 'delete' :
				me.remoteActionSubmit( me.remoteActionDelete, me ) ;
				break ;
				
			case 'toggle_publish' :
				var isPublished = actionParam ;
				me.remoteActionSubmit( me.remoteActionTogglePublish, me, [isPublished]  ) ;
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
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
					  
			data_wherefields: Ext.JSON.encode(me.query('op5crmbasequerywhere')[0].saveGetArray() ) ,
			data_groupfields: Ext.JSON.encode(me.query('op5crmbasequerygroup')[0].saveGetArray() ) ,
			data_selectfields: Ext.JSON.encode(me.query('op5crmbasequeryselect')[0].saveGetArray() ),
			data_progressfields: Ext.JSON.encode(me.query('op5crmbasequeryprogress')[0].saveGetArray() )
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
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
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'save'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
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
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'saveas',
			query_name: newQueryName
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
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
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'delete'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querydelete',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querydelete',true ) ;
					me.destroy() ;
				}
			},
			scope: me
		});
	},
	remoteActionTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'toggle_publish',
			isPublished: isPublished
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('togglepublishquery',{
						qType:'query',
						queryId:me.query_id
					}) ;
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
			_action: 'queries_builderTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				msgbox.close() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
				}
				else {
					// do something to open window
					me.openQueryResultPanel( ajaxData.RES_id ) ;
				}
			},
			scope: me
		});
	},
	openQueryResultPanel: function( resultId ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: 'queries_builderTransaction',
			_transaction_id : me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: resultId
		}) ;
		me.optimaModule.createWindow({
			title:me.query_name ,
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			items: [ queryResultPanel ]
		}) ;
		
		queryResultPanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	}
});