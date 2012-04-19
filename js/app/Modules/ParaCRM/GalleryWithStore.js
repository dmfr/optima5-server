Ext.define('Optima5.Modules.ParaCRM.GalleryWithStore',{
	extend : 'Ext.panel.Panel',

	requires : ['Ext.Img'],

	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			autoScroll:true,
			frame: true,
			items: [{
				xtype: 'dataview',
				store: me.store,
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
				prepareData: me.prepareData,
				listeners: {
					itemcontextmenu: {
						fn:function(view, record, item, index, event) {
							//console.log('okokokok') ;
							
							contextMenuItems = new Array() ;
							contextMenuItems.push({
								iconCls: 'icon-fullscreen',
								text: 'Show photo',
								handler : function() {
									// console.log( 'Create child node of '+record.get('treenode_key') ) ;
									me.showPhoto(record.get(me.storeKeyField)) ;
								},
								scope : me
							});
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Downlaod file',
								handler : function() {
									me.downloadPhoto(record.get(me.storeKeyField)) ;
								},
								scope : me
							});

							var contextMenu = Ext.create('Ext.menu.Menu',{
								items : contextMenuItems
							}) ;
							
							contextMenu.showAt(event.getXY());
							
						},
						scope:me
					},
					itemdblclick: {
						fn:function(view, record, item, index, event) {
							me.showPhoto(record.get(me.storeKeyField)) ;
						},
						scope:me
					}
				}
			}]
		}) ;
		
		this.callParent() ;
	},
	prepareData: function( data ) {
		return data;
	},
			  
	showPhoto: function( mediaId ) {
		var me = this ;
		var getParams = new Object() ;
		Ext.apply( getParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_moduleAccount: '',
			media_id: mediaId,
			thumb:''
		});
		
		var getSizeParams = new Object() ;
		Ext.apply( getSizeParams, getParams );
		Ext.apply( getSizeParams, {
			getsize:'true'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend_media.php',
			params: getSizeParams,
			method:'GET',
			succCallback : function(response) {
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
				
				
				var imageviewerWindow = op5desktop.getDesktop().createWindow({
					title:'Image Viewer',
					width:dispwidth,
					height:dispheight,
					iconCls: 'parapouet',
					animCollapse:false,
					border: false,

					layout: {
						type: 'card',
						align: 'stretch'
					},
					items: [{
						xtype:'image',
						src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
						resizable: false
					}]
				}) ;
				imageviewerWindow.show() ;
			},
			scope: me
		});
		
		
		
		//console.dir(imageviewerWindow) ;
		
	},
	downloadPhoto: function(mediaId) {
		var me = this ;
		var getParams = new Object() ;
		Ext.apply( getParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_moduleAccount: '',
			media_id: mediaId,
			thumb:'',
			download:'true'
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