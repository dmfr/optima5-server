Ext.define('QsqlDescModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type: 'string'},
		{name: 'sql_database',  type: 'string'},
		{name: 'sql_view',  type: 'string'},
		{name: 'sql_field',   type: 'string'},
		{name: 'sql_field_type',   type: 'string'},
		{name: 'text', type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QsqlPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbaseqsql',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryResultPanel'
	] ,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QsqlPanel','No module reference ?') ;
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
	
	
	qsqlNew: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
			_subaction: 'init',
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
					me.addComponents( Ext.decode(response.responseText).transaction_id, Ext.decode(response.responseText).data ) ;
				}
			},
			scope: this
		});
	},
	qsqlOpen: function( qsqlId ) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
			_subaction: 'init',
			qsql_id: qsqlId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.qsql_id = qsqlId ;
					me.qsql_name = Ext.decode(response.responseText).data.qsql_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText).transaction_id, Ext.decode(response.responseText).data ) ;
				}
			},
			scope: this
		});
	},
	
	
	addComponents: function( transactionId, ajaxData ){
		var me = this ;
		
		me.removeAll();
		
		me.transaction_id = transactionId ;
		me.fireEvent('qtransactionopen',this,me.transaction_id) ;
		if( ajaxData.qsql_id && ajaxData.qsql_id > 0 ) {
			me.qsql_id = ajaxData.qsql_id ;
			me.qsql_name =  ajaxData.qsql_name ;
		}
		
		var treeCfg = {} ;
		Ext.apply( treeCfg, {
			itemId: 'tViews',
			xtype: 'treepanel',
			title: 'Available views',
			flex: 1,
			useArrows: true,
			rootVisible: false,
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					itemId: 'btnSdomain',
					xtype: 'button',
					disabled: false,
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<b>Available Sdomains</b>',
					menu: {
						xtype: 'menu',
						items: [{
							itemId: 'tDomains',
							xtype: 'treepanel',
							width:250,
							height:300,
							store: {
								fields: ['id','text'],
								root: {
									root: true,
									id: '',
									text: '<b>Available Sdomains</b>',
									expanded: true,
									children: []
								},
								proxy: {
									type: 'memory' ,
									reader: {
										type: 'json'
									}
								}
							},
							displayField: 'text',
							rootVisible: true,
							useArrows: true,
							listeners: {
								checkchange: {
									fn: function(rec,check) {
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
									}
								},
								change: {
									fn: function(selectedValue) {
										this.filterTreeviewDatabase( selectedValue ) ;
									},
									scope: this
								}
							}
						}]
					}
				}]
			}],
			store: {
				model: 'QsqlDescModel',
				nodeParam: 'id',
				root: {children:[]}
			},
			columns: [{
				xtype: 'treecolumn', //this is so we know which column will show the tree
				text: 'View/Field',
				flex: 2,
				sortable: false,
				dataIndex: 'text',
				menuDisabled: false
			},{
				hidden: true,
				text: 'Type',
				flex: 1,
				sortable: false,
				dataIndex: 'sql_field_type',
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
			flex: 2,
			title: 'SQL Query string',
			xtype:'form',
			layout: 'fit',
			dockedItems: [{
				xtype: 'form',
				layout: 'hbox',
				dock: 'top',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: '2px 8px',
				defaults: {
					listeners: {
						change: function() {
							this.addComponentsEvalForm();
						},
						scope: me
					}
				},
				items: [{
					itemId: 'fIsRw',
					xtype: 'checkbox',
					boxLabel: 'Read / write',
					value: ajaxData.data_sqlwrite,
					readOnly: ajaxData.auth_readonly
				},{
					xtype: 'box',
					width: 24
				},{
					itemId: 'fIsSuperUser',
					xtype: 'checkbox',
					boxLabel: '<font color="red">SuperUser</font>',
					value: ajaxData.data_sqlsu,
					readOnly: ajaxData.auth_readonly
				}]
			}],
			items: [{
				itemId: 'fQuerystring',
				xtype: 'textareafield',
				fieldCls: 'op5-crmbase-query-sql-textarea',
				grow: true,
				name: 'message',
				value: ajaxData.data_sqlquerystring,
				readOnly: ajaxData.auth_readonly,
				anchor: '100%',
				listeners: {
					change: function() {
						this.setDirty(true) ;
					},
					render: this.addComponentsOnRenderTextarea,
					scope: this
				}
			}]
		}) ;
		
		if( me.loadMask ) {
			me.loadMask.hide() ;
		}
		me.setDirty(false);
		
		// current Sdomain
		me.addComponentsEvalForm() ;
		
		me.fetchMetaData() ;
	},
	addComponentsEvalForm: function() {
		var me = this ;
		me.down('#fIsSuperUser').setVisible( me.down('#fIsRw').getValue() ) ;
	},
	addComponentsOnRenderTextarea: function(field) {
		var me = this ;
		
		var gridPanelDropTargetEl =  field.bodyEl.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'TreeToGrids'+me.getId(),
			notifyEnter: function(ddSource, e, data) {
				//Add some flare to invite drop.
				field.bodyEl.down('textarea').stopAnimation();
				field.bodyEl.down('textarea').highlight();
			},
			notifyDrop: function(ddSource, e, data){
				var selectedRecord = ddSource.dragData.records[0];
				
				var toInsert ;
				if( !Ext.isEmpty(selectedRecord.get('sql_field')) ) {
					toInsert = ' `'+selectedRecord.get('sql_field')+'` ' ;
				} else {
					toInsert = ' `'+selectedRecord.get('sql_database')+'`.`'+selectedRecord.get('sql_view')+'` ' ;
				}
				me.jsInsertTextAtCursor( field.bodyEl.down('textarea').dom, toInsert ) ;
			}
		});
	},
	
	fetchMetaData: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
			_subaction: 'metadata',
			_transaction_id: me.transaction_id,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				var ajaxData = Ext.decode(response.responseText).data ;
				
				this.cfgAjaxData = ajaxData ;
				
				var sdomainsChidren = [] ;
				Ext.Array.each( ajaxData.db_sdomains, function( sdomainRow ) {
					sdomainsChidren.push({
						leaf: true,
						checked: false,
						id: sdomainRow.sdomain_id,
						text: sdomainRow.sdomain_id
					}) ;
				}) ;
				this.down('#tViews').down('#tDomains').getStore().setRoot({
					root: true,
					id: '',
					text: '<b>Available Sdomains</b>',
					expanded: true,
					children: sdomainsChidren
				});
				this.filterTreeviewDatabase( this.optimaModule.getSdomainRecord().get('sdomain_id') ) ;
			},
			scope: this
		});
	},
	
	filterTreeviewDatabase: function(sdomainId, doLock) {
		// ajaxData
		var ajaxData = this.cfgAjaxData ;
		
		var sqlDatabase = null ;
		Ext.Array.each( ajaxData.db_sdomains, function( sdomainRow ) {
			if( sdomainRow.sdomain_id == sdomainId ) {
				sqlDatabase = sdomainRow.database_name ;
				return ;
			}
		},this) ;
		
		// Build tree store
		var rootViews = [] ;
		Ext.Array.each( ajaxData.db_schema, function(viewRow) {
			if( viewRow.database_name != sqlDatabase ) {
				return ;
			}
			var viewFields = [] ;
			Ext.Array.each( viewRow.view_fields, function(viewField) {
				viewFields.push({
					id: viewRow.view_name + '::' + viewField.field_name,
					text: viewField.field_name,
					sql_database: viewRow.database_name,
					sql_view: viewRow.view_name,
					sql_field: viewField.field_name,
					sql_field_type: viewField.field_type,
					leaf: true
				});
			});
			rootViews.push({
				id: viewRow.view_name,
				text: '<b>'+viewRow.view_name+'</b>',
				sql_database: viewRow.database_name,
				sql_view: viewRow.view_name,
				children: viewFields,
				expanded: false,
				expandable: true
			});
		}) ;
		var rootData = {
			root: true,
			children: rootViews,
			expanded: true
		} ;
		
		this.down('#tViews').getStore().setRootNode(rootData) ;
		
		this.down('toolbar').down('#btnSdomain').setText( '<b>'+sdomainId+'</b>' ) ;
		if( doLock ) {
			this.down('toolbar').down('#btnSdomain').setDisabled() ;
		}
	},
	
	jsInsertTextAtCursor: function(el, text) {
		var val = el.value, endIndex, range;
		if (typeof el.selectionStart != "undefined" && typeof el.selectionEnd != "undefined") {
			endIndex = el.selectionEnd;
			el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
			el.selectionStart = el.selectionEnd = endIndex + text.length;
		} else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
			el.focus();
			range = document.selection.createRange();
			range.collapse(false);
			range.text = text;
			range.select();
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
			case 'toggle_autorun' :
				var isAutorun = actionParam ;
				me.remoteActionSubmit( me.remoteActionToggleAutorun, me, [isAutorun]  ) ;
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
			_action: 'queries_qsqlTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
					  
			data_sqlquerystring: Ext.JSON.encode(me.down('#fQuerystring').getValue()),
			data_sqlwrite: ( me.down('#fIsRw').getValue() ? 1 : 0 ),
			data_sqlsu: ( me.down('#fIsSuperUser').getValue() ? 1 : 0 )
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
			_action: 'queries_qsqlTransaction',
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
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qsql_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionSaveAs: function( newQueryName ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'saveas',
			qsql_name: newQueryName
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
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qsql_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionDelete: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
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
			_action: 'queries_qsqlTransaction',
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
						qType:'qsql',
						queryId:me.qsql_id
					}) ;
				}
			},
			scope: me
		});
	},
	remoteActionToggleAutorun: function( isAutorun ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qsqlTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'toggle_autorun',
			isAutorun: isAutorun
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('toggleautorunquery',{
						qType:'qsql',
						queryId:me.qsql_id
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
			_action: 'queries_qsqlTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (10 * 60 * 1000),
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
					me.fireEvent( 'qresultready', this, me.transaction_id, ajaxData.RES_id ) ;
				}
			},
			scope: me
		});
	},
	
	setDirty: function(torf) {
		this.dirtyEdit = torf ;
	},
	isDirty: function() {
		return this.dirtyEdit ;
	}
});
