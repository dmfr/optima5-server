Ext.define('Optima5.Modules.Spec.DbsTracy.AttachmentsDataview',{
	extend: 'Ext.view.View',
	mixins: {
		draggable   : 'Ext.ux.DataviewDraggable'
	},
	store: {
		model: 'DbsTracyAttachmentModel',
		proxy: {
			type: 'memory' ,
			reader: {
				type: 'json'
			}
		}
	},
	//frame: true,
	//autoScroll:true,
	tpl:[
		'<tpl for=".">',
			'<div class="op5-spec-dbstracy-attachments-item thumb-box">',
				'<div>{thumb_date}</div>',
				'<a href="#">',
					'<img src="{thumb_url}"/>',
				'</a>',
				'<div>{thumb_caption}</div>',
			'</div>',
		'</tpl>'
	],
	trackOver: true,
	itemSelector: 'div.op5-spec-dbstracy-attachments-item',
	prepareData: function(data) {
		var getParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: 'ATTACH_INBOX'+'_'+data.attachment_filerecord_id,
			thumb: true
		});
		
		Ext.apply(data, {
			thumb_date: Ext.util.Format.date(data.attachment_date,'d/m/Y'),
			thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
			thumb_caption: Ext.util.Format.nl2br( Ext.String.htmlEncode( data.attachment_txt ) )
		});
		return data;
	},
	
	initComponent: function() {
		this.mixins.draggable.init(this, {
				ddConfig: {
					ddGroup: 'AttachmentDD'+this.optimaModule.sdomainId
				},
				ghostTpl: this.tpl
		});
		
		this.callParent();
	}
}) ;

Ext.define('Optima5.Modules.Spec.DbsTracy.AttachmentsPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Ext.ux.upload.DD'
	],
	
	initComponent: function() {
		if( (this.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:AttachmentsPanel','No module reference ?') ;
		}
		
		Ext.apply(this,{
			border: false,
			layout:'fit',
			tbar:[{
				itemId: 'tbQuit',
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},'->',{
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
			},{
				itemId: 'tbRefresh',
				text: 'Refresh',
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				handler:function() {
					this.doLoad() ;
				},
				scope:this
			}],
			items:[ Ext.create('Optima5.Modules.Spec.DbsTracy.AttachmentsDataview',{
				overflowY: 'auto',
				itemId: 'dvGallery',
				optimaModule: this.optimaModule,
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
									this.handleEditAttachment(record.get('attachment_filerecord_id')) ;
								},
								scope : this
							});
							contextMenuItems.push('-') ;
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Download file',
								handler : function() {
									this.handleDownload(record.get('attachment_filerecord_id')) ;
								},
								scope : this
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
						scope:this
					},
					itemdblclick: {
						fn:function(view, record, item, index, event) {
							this.handleEditAttachment(record.get('attachment_filerecord_id')) ;
						},
						scope:this
					},
					afterrender: function(p) {
						// See : http://stackoverflow.com/questions/14502492/add-listener-to-all-elements-with-a-given-class
						p.getEl().on('dragstart',function(e,elem) {
							e.stopEvent(); // Stop IMGs from being dragged (std browser behavior)
						},this,{delegate:'img'});
						
						this.afterDataviewRender() ;
					},
					/*
					refresh: function(p) {
						Ext.Array.each( p.getNodes(), function(node) {
							var imgEl = Ext.get(node).down('img') ;
							if( !imgEl ) {
								return ;
							}
							imgEl.on('dragstart',function(e) {
								e.stopEvent() ;
							}) ;
						}) ;
					},
					*/
					dragdata: function(dvDragZone,dragData) {
						var selectedRecord = dragData.records[0];
						if( selectedRecord ) {
							var filerecordId = selectedRecord.get('attachment_filerecord_id') ;
							var attachmentRecord = dvDragZone.dataview.getStore().getById(filerecordId) ;
							dragData.records = [attachmentRecord] ;
						}
					},
					scope: this
				}
			})]
		});
		
		this.callParent() ;
		this.doLoad() ;
		
		this.on('afterrender',function(p) {
			p.child('toolbar').child('#tbQuit').setVisible( !( p.up() instanceof Ext.window.Window ) ) ;
		}) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'attachmentschange' :
				this.doLoad() ;
				break ;
			default: break ;
		}
	},
	afterDataviewRender: function() {
		var me = this ;
		
		return ;
		
		var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( ajaxParams, {
			_moduleId: 'spec_dbs_tracy',
			_action: 'attachments_uploadfile'
		}) ;
		
		me.upload = Ext.create('Ext.ux.upload.DD', {
			dropZone: me.down('#dvGallery'),
			directMethod: '',
			id: me.id,
			url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			params: ajaxParams,
			listeners: {
				dragover: function (el, count) {
					el.getEl().highlight() ;
				},
				dragout: function (el) {
				},
				drop: function (el) {
					var files = me.upload.getTransport().getFiles();
					if( Ext.isEmpty(me.filterCountry) ) {
						Ext.Msg.alert('Error','Target country must be set') ;
						files.removeAll() ;
						return ;
					}
					if (files.count() > 0) {
						me.upload.msgbox = Ext.Msg.wait('Uploading document...');
						me.upload.upload();
					}
				}
			}
		});
		me.upload.getTransport().on('afterupload', function (status, xmlRequest) {
			if( me.upload.msgbox ) {
				me.upload.msgbox.close() ;
			}
			if( status != 200 ) {
				Ext.Msg.alert('Error','Upload failed') ;
				return ;
			}
			var ajaxResponse = Ext.JSON.decode(xmlRequest.target.responseText) ;
			if( !ajaxResponse.success ) {
				Ext.Msg.alert('Error','File processing failed') ;
				return ;
			}
			this.handleNewAttachment( ajaxResponse.data.tmp_id ) ;
		},this) ;
	},
	
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_getInbox'
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success ) {
					this.onLoadResponse(ajaxObj) ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		});
	},
	onLoadResponse: function( ajaxObj ) {
		this.down('#dvGallery').getStore().loadData(ajaxObj.data) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
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
		attachmentViewerWindow.loadFilerecord( 'ATTACH_INBOX',filerecordId ) ;
	},
	createAttachmentWindow: function() {
		attachmentViewerWindow = this.optimaModule.createWindow({
			_parentFileCode:''
		},Optima5.Modules.Spec.DbsTracy.AttachmentViewerWindow) ;
		attachmentViewerWindow.on('load',function() {
			attachmentViewerWindow.show() ;
		},this) ;
		attachmentViewerWindow.on('submitok',function() {
			this.optimaModule.postCrmEvent('attachmentschange',{}) ;
		},this) ;
		return attachmentViewerWindow ;
	},
	
	handleDownload: function(filerecordId) {
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: 'ATTACH_INBOX'+'_'+filerecordId,
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
	
	handleQuit: function() {
		this.destroy() ;
	}
}) ;
