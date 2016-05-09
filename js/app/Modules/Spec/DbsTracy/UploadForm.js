Ext.define('Optima5.Modules.Spec.DbsTracy.UploadForm',{
	extend:'Ext.panel.Panel',
	
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
						fields: ['id'],
						data: [{id:'VL06F'},{id:'LIKP'}]
					},
					valueField: 'id',
					displayField: 'id'
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
		if( this.values ) {
			this.down('form').getForm().setValues(this.values) ;
		}
	},
	handleUpload: function() {
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
		if(baseForm.isValid()){
			var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_dbs_tracy',
				_action: 'upload'
			}) ;
			
			var msgbox = Ext.Msg.wait('Syncing...');
			baseForm.submit({
				timeout: (10 * 60 * 1000),
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Optima5.Modules.Spec.DbsTracy.HelperCache.fetchConfig() ;
					
					Ext.Msg.alert('Success','Success !', function(){
						this.destroy() ;
					},this) ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					Ext.Msg.alert('Error','Error during upload') ;	
				},
				scope: me
			});
		}
	}
}) ;
