Ext.define('Optima5.Modules.CrmBase.FilePanelGallery',{
	extend : 'Ext.panel.Panel',
	
	requires : ['Ext.Img','Ext.ux.dams.FileDownloader'],
			  
	alias : 'widget.op5crmbasefilegallery',
			  
	storeKeyField : 'filerecord_id',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelGallery','No module reference ?') ;
		}
		
		Ext.apply( me, {
			layout: 'fit',
			items: [{
				xtype: 'dataview',
				store: me.store,
				scrollable: true,
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
						media_id: me.fileId + '_' + data.filerecord_id,
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
									me.showPhoto(me.fileId + '_' + record.get(me.storeKeyField)) ;
								},
								scope : me
							});
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Downlaod file',
								handler : function() {
									me.downloadPhoto(me.fileId + '_' + record.get(me.storeKeyField)) ;
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
							me.showPhoto(me.fileId + '_' + record.get(me.storeKeyField)) ;
						},
						scope:me
					}
				}
			}]
		}) ;
		
		me.callParent() ;
	},
	
	prepareData: function( data ) {
		var me = this.up('op5crmbasefilegallery') ;
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: me.fileId + '_' + data.filerecord_id,
			thumb: true
		});
		
		Ext.apply(data, {
			thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams)
		});
		return data;
	},
	
	showPhoto: function( mediaId ) {
		var me = this ;
		
		var getParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: mediaId,
			thumb: ''
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
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: getParams,
			requestAction: 'server/backend_media.php',
			requestMethod: 'GET'
		}) ;
	}
	
});
