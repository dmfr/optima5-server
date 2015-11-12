Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachAdminPanel',{
	extend:'Optima5.Modules.Spec.DbsEmbramach.MachPanel',
	
	initComponent: function() {
		Ext.apply(this,{
			tbar:[{
				hidden: this.noDestroy,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doRefresh() ;
				},
				scope: this
			},'->',{
				hidden: !Optima5.Modules.Spec.DbsEmbramach.HelperCache.authHelperHasAll(),
				itemId: 'tbUpload',
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: '<b>Upload Document</b>',
				menu: [{
					xtype: 'form',
					frame: true,
					defaults: {
							anchor: '100%',
							allowBlank: false,
							msgTarget: 'side',
							labelWidth: 50
					},
					dockedItems: [{
						xtype: 'toolbar',
						dock: 'bottom',
						ui: 'footer',
						defaults: {minWidth: 100},
						items: [
							{ xtype: 'component', flex: 1 },
							{ xtype: 'button', text: 'Upload' , handler:this.doUpload, scope:this }
						]
					}],
					items: [{
						xtype: 'combobox',
						name: 'file_model',
						fieldLabel: 'Model',
						forceSelection: true,
						allowBlank: false,
						editable: false,
						store: {
							fields: ['id'],
							data: [
								{id: 'VL06F_active'},
								{id: 'VL06F_closed'},
								{id: 'ZLORSD015'},
								{id: 'Z080P'}
							]
						},
						valueField: 'id',
						displayField: 'id'
					},{
						xtype: 'filefield',
						width: 450,
						emptyText: 'Select a file',
						fieldLabel: 'Source',
						name: 'file_upload',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						}
					}]
				}]
			},{
				itemId: 'xlsExport',
				text: 'Export XLS',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function() {
					this.doDownload() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_info_small.gif',
				text: 'Légende',
				menuAlign: 'tr-br?',
				menu: {
					xtype:'menu',
					items:[{
						xtype:'dataview',
						cls: 'op5-spec-dbsembramach-colorinfo',
						tpl: new Ext.XTemplate(
							'<tpl for=".">',
								'<div class="op5-spec-dbsembramach-colorinfo-item">',
									'{text}',
									'<div class="op5-spec-dbsembramach-colorinfo-item-icon {iconCls}"></div>',
								'</div>',
							'</tpl>'
						),
						itemSelector: 'div.op5-spec-dbsembramach-colorinfo-item',
						store: {
							fields: ['iconCls', 'text'],
							data:[
								{iconCls: 'op5-spec-dbsembramach-gridcell-green-legend', text:'On-time'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-orange-legend', text:'On-time, imminent ETA'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-red-legend', text:'Late'},
								{iconCls: 'op5-spec-dbsembramach-gridcell-bold-legend', text:'Current step'}
							]
						},
						//frame: true,
						width:200,
						height:200
					}]
				}
			}]
		}) ;
		this.callParent() ;
	},
	
	doQuit: function() {
		if( !this.noDestroy ) {
			this.destroy() ;
		}
	},
	doRefresh: function() {
		this.doLoad(true) ;
	},
	doUpload: function( dummyfield ) {
		var me = this ;
		var msg = function(title, msg) {
			Ext.Msg.show({
					title: title,
					msg: msg,
					minWidth: 200,
					modal: true,
					icon: Ext.Msg.INFO,
					buttons: Ext.Msg.OK
			});
		};
		var uploadform = this.down('toolbar').down('form') ;
		var fileuploadfield = uploadform.query('> filefield')[0] ;
		var baseForm = uploadform.getForm() ;
		if(baseForm.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_upload'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading source...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.doRefresh() ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	
	doDownload: function() {
		var me = this ;
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_embramach',
			_action: 'mach_getGridXls',
			flow_code: this.flowCode
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
}) ;