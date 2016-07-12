Ext.define('Optima5.Modules.Spec.DbsPeople.UploadForm',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsPeople.CfgParamField'],
	
	initComponent: function() {
		Ext.apply(this, {
			title: 'Upload form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			layout: {
				type:'hbox',
				align:'stretch'
			},
			items:[{
				xtype:'form',
				border: false,
				bodyPadding: '5px 5px',
				bodyCls: 'ux-noframe-bg',
				flex: 1,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 80,
					anchor: '100%'
				},
				items:[{
					xtype: 'filefield',
					width: 450,
					emptyText: 'Select a file',
					fieldLabel: 'Source',
					name: 'file_upload',
					buttonText: '',
					allowBlank: false,
					buttonConfig: {
						iconCls: 'upload-icon'
					}
				},{
					xtype: 'combobox',
					name: 'file_model',
					fieldLabel: 'Model',
					queryMode: 'local',
					forceSelection: true,
					allowBlank: false,
					editable: false,
					store: {
						fields: ['upload_id','upload_name'],
						data: []
					},
					valueField: 'upload_id',
					displayField: 'upload_name'
				}]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.handleUpload() ;
				},
				scope: this
			}]
		});
		this.callParent() ;
		this.fetchModels() ;
	},
	fetchModels: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'upload_getLibrary'
			},
			callback: function() {
				this.getEl().unmask() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText) ;
				if( json.success ) {
					this.down('form').getForm().findField('file_model').getStore().loadData(json.data) ;
				}
			},
			scope: this
		});
	},
	handleUpload: function() {
		var me = this ;
		
		var uploadform = this.down('form') ;
		
		var baseForm = uploadform.getForm() ;
		if( !baseForm.isValid() ) {
			return ;
		}
		
		Ext.Msg.confirm('WARNING','Proceed ?', function(btn) {
			if( btn == 'yes') {
				this.doUpload() ;
			}
		},this) ;
	},
	doUpload: function() {
		var me = this ;
		
		var uploadform = this.down('form') ;
		
		var baseForm = uploadform.getForm() ;
		
		var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_people',
			_action: 'upload_do'
		}) ;
		
		var msgbox = Ext.Msg.wait('Syncing...');
		baseForm.submit({
			timeout: (10 * 60 * 1000),
			url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			params: ajaxParams,
			success : function(form,action){
				msgbox.close() ;
				
				Ext.Msg.alert('Success','Success !', function(){
					this.destroy() ;
				},this) ;
			},
			failure: function(form,action) {
				var error = null ;
				if( action.response.responseText ) {
					var json = Ext.JSON.decode(action.response.responseText) ;
					if( json.error ) {
						error = json.error ;
					}
				}
				if( !error ) {
					error = 'Error during upload' ;
				}
				msgbox.close() ;
				Ext.Msg.alert('Error',error) ;	
			},
			scope: me
		});
	}
}) ;
