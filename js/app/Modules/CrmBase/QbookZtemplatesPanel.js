Ext.define('Optima5.Modules.CrmBase.QbookZtemplatesPanel' ,{
	extend: 'Ext.panel.Panel',
	
	parentQbookPanel: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.parentQbookPanel) instanceof Optima5.Modules.CrmBase.QbookPanel ) {} else {
			Optima5.Helper.logError('CrmBase:QbookZtemplatesPanel','No module reference ?') ;
		}
		me.optimaModule = me.parentQbookPanel.optimaModule ;
		
		Ext.apply( me, {
			title: 'Ztemplates loader',
			layout: 'border',
			items:[{
				xtype: 'gridpanel',
				itemId: 'mZtemplatesList',
				region: 'center',
				flex: 1,
				layout: 'fit',
				border:false,
				tbar:[{
					iconCls:'op5-crmbase-qbookztemplates-new',
					text:'Define template',
					handler: function() {
						me.setFormpanelRecord(null) ;
					},
					scope:me
				}],
				store: {
					model: 'QbookZtemplateModel',
					proxy: me.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_action: 'queries_qbookTransaction',
							_transaction_id: me.parentQbookPanel.transaction_id,
							_subaction: 'ztplman_getZtemplatesList'
						},
						reader: {
							type: 'json',
							rootProperty: 'data',
							totalProperty: 'total'
						}
					}),
					autoLoad:true
				},
				columns: [{
					text: 'Template title',
					width:150,
					sortable: false,
					dataIndex: 'ztemplate_name',
					menuDisabled: true,
					renderer: function( value, metaData ) {
						metaData.style = 'font-weight: bold' ;
						return value ;
					}
				},{
					text: 'Meta: Filename',
					width: 250,
					sortable: false,
					dataIndex: 'ztemplate_metadata_filename',
					menuDisabled: true
				},{
					text: 'Meta: Date',
					width: 150,
					sortable: false,
					dataIndex: 'ztemplate_metadata_date',
					menuDisabled: true,
					align:'center'
				}],
				listeners: {
					itemclick:function( view, record, item, index, event ) {
						me.setFormpanelRecord( record ) ;
					},
					scope:me
				}
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				flex: 1,
				itemId:'mZtemplateFormContainer',
				tbar:[{
					itemId:'btnSave',
					iconCls:'op5-crmbase-qbookztemplate-save',
					text:'Save',
					handler: me.handleBtnSave,
					scope:me
				},{
					itemId:'btnDl',
					iconCls:'op5-crmbase-qbookztemplate-dl',
					text:'Download',
					handler: me.handleBtnDl,
					scope:me
				},'->',{
					itemId:'btnDelete',
					iconCls:'op5-crmbase-qbookztemplate-delete',
					text:'Delete',
					handler: me.handleBtnDelete,
					scope:me
				}],
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:me
				}
			}]
		}) ;
		
		me.on('show',function() {
			me.getComponent('mZtemplatesList').getStore().load() ;
		},me) ;
		me.on('hide',function() {
			me.destroyFormpanel() ;
		},me);
		
		me.callParent() ;
	},
	setSizeFromParent: function() {
		var me = this,
			parentQbookPanel = me.parentQbookPanel ;
			
		me.setSize({
			width: parentQbookPanel.getSize().width - 20,
			height: (parentQbookPanel.getSize().height - 20) / 2
		}) ;
	},
	setFormpanelRecord: function( ztemplateRecord ) {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer') ;
		
		// *** Build form ***
		eastpanel.add({
			xtype: 'form',
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 100,
				anchor: '100%'
			},
			frame:false,
			border: false,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			items: [{
				xtype:'textfield',
				name:'ztemplate_name',
				fieldLabel:'Template title'
			},{
				xtype:'fieldset',
				title: 'HTML resource',
				defaults: {
					labelAlign: 'left',
					labelWidth: 75
				},
				items:[{
					xtype: 'filefield',
					name: 'ztemplate_resource_binary',
					fieldLabel: 'UploadFile',
					buttonText: '...',
					listeners: {
						change: {
							fn: me.doUpload,
							scope:me
						}
					}
				},{
					xtype:'hiddenfield',
					name: 'ztemplate_resource_upload',
					fieldLabel: 'Filename',
					value: 'false'
				},{
					xtype:'displayfield',
					name: 'ztemplate_metadata_filename',
					fieldLabel: 'Filename'
				},{
					xtype:'displayfield',
					name: 'ztemplate_metadata_date',
					fieldLabel: 'Date'
				}]
			}]
		}) ;
		var eastpanelForm = eastpanel.child('form').getForm(),
			eastpanelToolbar = eastpanel.child('toolbar') ;
		
		eastpanelForm.reset() ;
		// **** Mask / unmask buttons ****
		if( ztemplateRecord == null ) {
			eastpanelToolbar.getComponent('btnSave').setVisible(true) ;
			eastpanelToolbar.getComponent('btnDl').setVisible(false) ;
			eastpanelToolbar.getComponent('btnDelete').setVisible(false) ;
			eastpanel.setTitle( 'New ztemplate' );
			eastpanel._data = {
				is_new: true,
				qbook_ztemplate_ssid: null
			}; 
			eastpanelForm.setValues({
				ztemplate_metadata_filename: '<i>not set</i>'
			});
		} else {
			eastpanelToolbar.getComponent('btnSave').setVisible(true) ;
			eastpanelToolbar.getComponent('btnDl').setVisible(true) ;
			eastpanelToolbar.getComponent('btnDelete').setVisible(true) ;
			eastpanel.setTitle( 'Edit: '+ztemplateRecord.get('ztemplate_name') );
			eastpanel._data = {
				is_new: false,
				qbook_ztemplate_ssid: ztemplateRecord.get('qbook_ztemplate_ssid')
			}; 
			eastpanelForm.loadRecord(ztemplateRecord) ;
		}
		eastpanel._empty = false ;
		eastpanel.expand() ;
	},
	destroyFormpanel: function(animate) {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer') ;
		
		eastpanel._empty = true ;
		eastpanel.setTitle('') ;
		eastpanel.removeAll() ;
		eastpanel.collapse(null,animate) ;
	},
	
	doUpload: function() {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer'),
			eastpanelForm = eastpanel.child('form').getForm() ;
			
		if(eastpanelForm.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_action: 'queries_qbookTransaction',
				_transaction_id: me.parentQbookPanel.transaction_id,
				_subaction: 'ztplman_uploadTmpResource'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading template...');
			eastpanelForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form, action){
					msgbox.close() ;
					
					var response = Ext.JSON.decode(action.response.responseText) ;
					form.setValues({
						ztemplate_resource_upload: 'true',
						ztemplate_metadata_filename: response.data.ztemplate_metadata_filename,
						ztemplate_metadata_date: response.data.ztemplate_metadata_date
					}) ;
				},
				failure: function(form, action){
					msgbox.close() ;
					
					var str = 'Error during upload' ;
					if( action.response.responseText ) {
						var response = Ext.JSON.decode(action.response.responseText) ;
						if( response != null && response.failure != null ) {
							str =  response.failure ;
						}
					}
					Ext.Msg.alert('Failed', str) ;
				},
				scope: me
			});
		}
	},
	handleBtnSave: function() {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer'),
			eastpanelForm = eastpanel.child('form').getForm() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.parentQbookPanel.transaction_id,
			_subaction: 'ztplman_setZtemplate',
			edit_action: (eastpanel._data.is_new ? 'new' : 'edit'),
			qbook_ztemplate_ssid: (eastpanel._data.is_new ? 0 : eastpanel._data.qbook_ztemplate_ssid),
			form_values: Ext.JSON.encode(eastpanelForm.getValues(false,false,false,true))
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: this.onSubmitResponse,
			scope: this
		});
	},
	handleBtnDl: function() {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer'),
			eastpanelForm = eastpanel.child('form').getForm() ;
			
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_action: 'queries_qbookTransaction',
			_transaction_id: me.parentQbookPanel.transaction_id,
			_subaction: 'ztplman_dlZtemplateResource',
			edit_action: (eastpanel._data.is_new ? 'new' : 'edit'),
			qbook_ztemplate_ssid: eastpanel._data.qbook_ztemplate_ssid
		}) ;
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	handleBtnDelete: function() {
		Ext.Msg.confirm('Delete template', 'Discard selected ztemplate ?', function(btn){
			if( btn == 'yes' ) {
				this.handleBtnDeleteDo() ;
			}
		},this) ;
	},
	handleBtnDeleteDo: function() {
		var me = this,
			eastpanel = me.getComponent('mZtemplateFormContainer'),
			eastpanelForm = eastpanel.child('form').getForm() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_qbookTransaction',
			_transaction_id: me.parentQbookPanel.transaction_id,
			_subaction: 'ztplman_setZtemplate',
			edit_action: 'delete',
			qbook_ztemplate_ssid: eastpanel._data.qbook_ztemplate_ssid
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: this.onSubmitResponse,
			scope: this
		});
	},
	onSubmitResponse: function(response) {
		var me = this ;
		if( Ext.decode(response.responseText).success == false ) {
			Ext.Msg.alert('Failed', 'Failed');
		}
		else {
			me.destroyFormpanel(true) ;
			me.getComponent('mZtemplatesList').getStore().load() ;
		}
	}
}) ;