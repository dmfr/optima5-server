Ext.define('Optima5.Modules.CrmBase.DataFormPanelGallery',{
	extend : 'Ext.panel.Panel',
	alias : 'widget.op5crmbasedataformpanelgallery',

	requires : ['Ext.Img'],

	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No module reference ?') ;
		}
		if( !me.transactionID ) {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No transaction ID ?') ;
		}
		
		this.modelname = this.id+'-'+'dynModel' ;
		Ext.define(this.modelname,{
			extend: 'Ext.data.Model',
			fields: [
				{name: '_media_id',  type: 'string'},
				{name: 'filerecord_id',  type: 'int'},
				{name: 'media_title',  type: 'string'},
				{name: 'media_date',  type: 'date'},
				{name: 'media_mimetype',  type: 'string'}
			]
		}) ;
		
		
		this.linkstore = Ext.create('Ext.data.Store', {
			autoLoad: true,
			autoSync: false,
			model: this.modelname,
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams:{
					_action:'data_editTransaction',
					_transaction_id : me.transactionID,
					_subaction:'subfileGallery_get',
					subfile_code:me.itemId
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			})
		}) ;
		
		
		Ext.apply( me, {
			autoScroll:true,
			frame: true,
			items: [{
				xtype: 'dataview',
				store: this.linkstore,
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
				emptyText: 'No images to display',
				prepareData: function(data) {
					var getParams = me.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data._media_id,
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
									me.showPhoto(record.get('_media_id')) ;
								},
								scope : me
							});
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Downlaod file',
								handler : function() {
									me.downloadPhoto(record.get('_media_id')) ;
								},
								scope : me
							});
							
							if( !me.readOnly ) {
								contextMenuItems.push('-') ;
								contextMenuItems.push({
									iconCls: 'icon-bible-delete',
									text: 'Delete photo',
									handler : function() {
										me.deleteItem(record.get('_media_id')) ;
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
							me.showPhoto(record.get('_media_id')) ;
						},
						scope:me
					}
				}
			}]
		}) ;
		
		
		if( !me.readOnly ) {
			Ext.apply(me,{
				dockedItems: [{
					xtype: 'form',
					dock: 'top',
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
			});
		}
		
		
		
		this.on('destroy',function(){
			var model = Ext.ModelManager.getModel(this.modelname);
			Ext.ModelManager.unregister(model);
		},this) ;
		
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
		var uploadform = this.getDockedItems('form')[0] ;
		var fileuploadfield = uploadform.query('> filefield')[0] ;
		var baseForm = uploadform.getForm() ;
		if(baseForm.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_action:'data_editTransaction',
				_transaction_id : me.transactionID,
				_subaction:'subfileGallery_upload',
				subfile_code:me.itemId
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading your photo...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(){
					msgbox.close() ;
					me.linkstore.load() ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	deleteItem: function( mediaId ) {
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action:'data_editTransaction',
				_transaction_id : me.transactionID,
				_subaction:'subfileGallery_delete',
				subfile_code:me.itemId,
				_media_id:mediaId
			},
			success : function(){
				me.linkstore.load() ;
			},
			scope: me
		});
	},
			  
	showPhoto: function( mediaId ) {
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: mediaId,
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
	downloadPhoto: function(mediaId) {
		var me = this ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: mediaId,
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