Ext.define('Optima5.Modules.Spec.DbsTracy.OrderAttachmentsDataview',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:DbsTracy:OrderAttachmentsDataview','No module reference ?') ;
		}
		
		Ext.apply(me,{
			title: 'Attachments',
			layout: 'fit',
			tbar: [{
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
					//bodyPadding: '0 0 0 0',
					items: [{
						xtype: 'filefield',
						width: 450,
						emptyText: 'Select an image',
						fieldLabel: 'Photo',
						name: 'photo-filename',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						},
						listeners: {
							change: {
								fn: this.doUpload,
								scope:this
							}
						}
					}]
				}]
			},'->',{
				iconCls: 'op5-crmbase-datatoolbar-file-export-gallery',
				text: 'Get PDF',
				handler: function(){
					this.handleDownloadPdf() ;
				},
				scope: this
			}],
			items:[{
				xtype: 'dataview',
				store: {
					model: 'DbsTracyAttachmentModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				//frame: true,
				//autoScroll:true,
				//overflowX: 'auto',
				//style: {
					//whiteSpace: 'nowrap'
				//},
				scrollable: 'vertical',

				tpl:[
					'<tpl for=".">',
						'<div class="op5-spec-mrfoxy-attachments-item thumb-box">',
							'<div>{thumb_date}</div>',
							'<a href="#">',
								'<img src="{thumb_url}"/>',
							'</a>',
							'<div>{thumb_caption}</div>',
						'</div>',
					'</tpl>'
				],
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.thumb-box',
				prepareData: function(data) {
					var getParams = me.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data.attachment_filerecord_id,
						thumb: true
					});
					
					Ext.apply(data, {
						thumb_date: Ext.util.Format.date(data.attachment_date,'d/m/Y'),
						thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
						thumb_caption: Ext.util.Format.nl2br( Ext.String.htmlEncode( data.attachment_txt ) )
					});
					return data;
				},
				listeners: {
					itemcontextmenu: {
						fn:function(view, record, item, index, event) {
							//console.log('okokokok') ;
							
							var contextMenuItems = new Array() ;
							contextMenuItems.push({
								iconCls: 'icon-fullscreen',
								text: 'Details',
								handler : function() {
									// console.log( 'Create child node of '+record.get('treenode_key') ) ;
									me.handleEditAttachment(record.get('attachment_filerecord_id')) ;
								},
								scope : me
							});
							contextMenuItems.push('-') ;
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Download file',
								handler : function() {
									me.handleDownload(record.get('attachment_filerecord_id')) ;
								},
								scope : me
							});
							
							var contextMenu = Ext.create('Ext.menu.Menu',{
								items : contextMenuItems,
								listeners: {
									hide: function(menu) {
										Ext.defer(function(){menu.destroy();},10) ;
									}
								}
							}) ;
							
							contextMenu.showAt(event.getXY());
							
						},
						scope:me
					},
					itemdblclick: {
						fn:function(view, record, item, index, event) {
							me.handleEditAttachment(record.get('attachment_filerecord_id')) ;
						},
						scope:me
					},
					render: { 
						fn: this.onDataviewRender,
						scope: me
					}
				}
			}]
		});
		
		this.callParent() ;
	},
	onDataviewRender: function(view) {
		var me = this ;
		
		var viewDropTargetEl =  view.getEl();

		var viewDropTarget = Ext.create('Ext.dd.DropTarget', viewDropTargetEl, {
			ddGroup: 'AttachmentDD'+me.optimaModule.sdomainId,
			notifyEnter: function(ddSource, e, data) {
				var selectedRecord = ddSource.dragData.records[0];
				if( !selectedRecord ) {
					return ;
				}
				//Add some flare to invite drop.
				view.getEl().stopAnimation();
				view.getEl().highlight();
				this.dropStatus = this.dropAllowed ;
				return  ;
			},
			notifyOver: function(ddSource, e, data) {
				return this.dropStatus ;
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					me.handleAssociate(selectedRecord);
					return true;
			}
		});
	},
	
	setOrderRecord: function( orderRecord ) {
		var dvDataview = this.down('dataview') ;
		if( !orderRecord ) {
			this.orderRecord = null ;
			dvDataview.getStore().removeAll() ;
			return ;
		}
		if( orderRecord instanceof DbsTracyFileOrderModel ) {} else {
			Optima5.Helper.logError('Spec:DbsTracy:OrderAttachmentsDataview','No DbsTracyFileOrderModel instance ?') ;
			return ;
		}
		
		this.orderRecord = orderRecord ;
		dvDataview.getStore().loadRawData( Ext.pluck(orderRecord.attachments().getRange(),'data') ) ;
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
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_uploadfile'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading document...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.handleNewAttachment( ajaxData.tmp_id ) ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	
	
	handleNewAttachment: function( tmpId ) {
		var attachmentViewerWindow = this.createAttachmentWindow() ;
		attachmentViewerWindow.loadTmpMedia( tmpId ) ;
	},
	handleEditAttachment: function( filerecordId ) {
		var attachmentViewerWindow = this.createAttachmentWindow() ;
		attachmentViewerWindow.loadFilerecord( filerecordId ) ;
	},
	createAttachmentWindow: function() {
		attachmentViewerWindow = this.optimaModule.createWindow({
			_parentFileCode:'order',
			_parentFilerecordId: this.orderRecord.get('order_filerecord_id')
		},Optima5.Modules.Spec.DbsTracy.AttachmentViewerWindow) ;
		attachmentViewerWindow.on('load',function() {
			attachmentViewerWindow.show() ;
		},this) ;
		attachmentViewerWindow.on('submitok',function() {
			this.optimaModule.postCrmEvent('attachmentschange',{orderFilerecordId:this.orderRecord.get('order_filerecord_id')}) ;
		},this) ;
		return attachmentViewerWindow ;
	},
	
	handleAssociate: function(attachmentRecord) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_attach',
				parent_file_code: 'order',
				parent_filerecord_id: this.orderRecord.get('order_filerecord_id'),
				filerecord_id: attachmentRecord.get('attachment_filerecord_id')
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success ) {
					this.optimaModule.postCrmEvent('attachmentschange',{orderFilerecordId:this.orderRecord.get('order_filerecord_id')}) ;
				}
			},
			scope: this
		});
	},
	handleDownload: function(filerecordId) {
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: filerecordId,
			thumb:'',
			download:true
		});
		
		
		try {
			Ext.destroy(Ext.get('testIframe'));
		}
		catch(e) {}

		Ext.DomHelper.append(document.body, {
			tag: 'iframe',
			id:'testIframe',
			css: 'display:none;visibility:hidden;height:0px;',
			src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
			frameBorder: 0,
			width: 0,
			height: 0
		});
	},
	handleDownloadPdf: function() {
		var me = this ;
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( exportParams, {
			_moduleId: 'spec_dbs_tracy',
			_action: 'attachments_downloadPdf',
			parent_file_code: 'order',
			parent_filerecord_id: this.orderRecord.get('order_filerecord_id'),
		});
		
		
		try {
			Ext.destroy(Ext.get('testIframe'));
		}
		catch(e) {}

		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	}
	
	
});
