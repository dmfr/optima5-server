Ext.define('WbMrfoxyPromoAttachmentModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'filerecord_id',  type: 'int'}
	]
}) ;
Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoAttachmentsDataview',{
	extend:'Ext.panel.Panel',
	requires:[],

	initComponent: function() {
		var me = this ;
		me.addEvents('proceed') ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No module reference ?') ;
		}
		if( (me.rowRecord) instanceof WbMrfoxyPromoModel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No WbMrfoxyPromoModel instance ?') ;
		}
		
		Ext.apply(me,{
			title: 'Attachments',
			tbar:[{
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: 'Attach Img',
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
								fn: me.doUpload,
								scope:me
							}
						}
					}]
				}]
			}],
			items:[{
				xtype: 'dataview',
				store: {
					autoLoad: true,
					autoSync: false,
					model: 'WbMrfoxyPromoAttachmentModel',
					proxy: me.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_wb_mrfoxy',
							_action: 'promo_getAttachments',
							_filerecord_id: me.rowRecord.get('_filerecord_id')
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					})
				},
				//frame: true,
				//autoScroll:true,
				tpl:[
					'<tpl for=".">',
						'<div class="thumb-box">',
								'<a href="#{id}">',
									'<img src="{thumb_url}">',
								'</a>',
						'</div>',
					'</tpl>',
					'<div class="x-clear"></div>'
				],
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.thumb-box',
				prepareData: function(data) {
					var getParams = me.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data.filerecord_id,
						thumb: true
					});
					
					Ext.apply(data, {
						thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams)
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
								text: 'Show photo',
								handler : function() {
									// console.log( 'Create child node of '+record.get('treenode_key') ) ;
									me.showPhoto(record.get('filerecord_id')) ;
								},
								scope : me
							});
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Downlaod file',
								handler : function() {
									me.downloadPhoto(record.get('filerecord_id')) ;
								},
								scope : me
							});
							
							if( !me.readOnly ) {
								contextMenuItems.push('-') ;
								contextMenuItems.push({
									iconCls: 'icon-bible-delete',
									text: 'Delete photo',
									handler : function() {
										me.deleteItem(record.get('filerecord_id')) ;
									},
									scope : me
								});
							}
							
							var contextMenu = Ext.create('Ext.menu.Menu',{
								items : contextMenuItems,
								listeners: {
									hide: function(menu) {
										menu.destroy() ;
									}
								}
							}) ;
							
							contextMenu.showAt(event.getXY());
							
						},
						scope:me
					},
					itemdblclick: {
						fn:function(view, record, item, index, event) {
							me.showPhoto(record.get('filerecord_id')) ;
						},
						scope:me
					}
				}
			}]
		});
		
		this.callParent() ;
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
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_uploadAttachment',
				_filerecord_id: me.rowRecord.get('_filerecord_id')
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading your photo...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					me.down('dataview').getStore().load() ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	deleteItem: function( filerecordId ) {
		var me = this ;
		Ext.Msg.confirm('Delete','Delete attachment ?', function(buttonStr) {
			if( buttonStr != 'yes' ) {
				return ;
			}
			me.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'promo_deleteAttachment',
					filerecord_id: filerecordId
				},
				success : function(){
					me.down('dataview').getStore().load() ;
				},
				scope: me
			});
		},this) ;
	},
			  
	showPhoto: function( filerecordId ) {
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: filerecordId,
			thumb:''
		});
		
		var getSizeParams = new Object() ;
		Ext.apply( getSizeParams, getParams );
		Ext.apply( getSizeParams, {
			getsize:'true'
		});
		Ext.Ajax.request({
			url: 'server/backend_media.php',
			params: getSizeParams,
			method:'GET',
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					return ;
				}
				var width = parseInt( Ext.decode(response.responseText).width ) ;
				var height = parseInt( Ext.decode(response.responseText).height ) ;
				
				if( height > 600 ) {
					var dispheight = ( (height * 600) / height ) ;
					var dispwidth = ( (width * 600) / height ) ;
				}
				else {
					var dispheight = height ;
					var dispwidth = width ;
				}
				
				
				var imageviewerWindow = me.optimaModule.createWindow({
					title:'Image Viewer',
					width:dispwidth,
					height:dispheight,
					iconCls: 'op5-crmbase-dataformwindow-photo-icon',
					animCollapse:false,
					border: false,
					items: [{
						xtype:'image',
						src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
						resizable: false
					}]
				}) ;
			},
			scope: me
		});
		
		
		
		//console.dir(imageviewerWindow) ;
		
	},
	downloadPhoto: function(filerecordId) {
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
	}
});