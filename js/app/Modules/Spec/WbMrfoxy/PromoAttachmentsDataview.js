Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoAttachmentsDataview',{
	extend:'Ext.panel.Panel',
	requires:[],

	initComponent: function() {
		var me = this ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No module reference ?') ;
		}
		if( (me.rowRecord) instanceof WbMrfoxyPromoModel ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No WbMrfoxyPromoModel instance ?') ;
		}
		
		Ext.apply(me,{
			title: 'Attachments',
			headerPosition: 'left',
			layout: 'fit',
			items:[{
				xtype: 'dataview',
				store: {
					autoLoad: true,
					autoSync: false,
					model: 'WbMrfoxyAttachmentModel',
					proxy: me.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_wb_mrfoxy',
							_action: 'promo_getAttachments',
							promo_filerecordId: me.rowRecord.get('_filerecord_id'),
							doc_type: 'PROMO_ACK'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				//frame: true,
				//autoScroll:true,
				overflowX: 'auto',
				style: {
					whiteSpace: 'nowrap'
				},
				tpl:[
					'<tpl for=".">',
						'<div class="op5-spec-mrfoxy-attachments-item thumb-box">',
							'<div>{thumb_date}</div>',
							'<a href="#">',
								'<img src="{thumb_url}"/>',
							'</a>',
						'</div>',
					'</tpl>'
				],
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.thumb-box',
				prepareData: function(data) {
					var getParams = me.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data.media_id,
						thumb: true
					});
					
					Ext.apply(data, {
						thumb_date: data.doc_date,
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
									me.showPhoto(record.get('media_id')) ;
								},
								scope : me
							});
							contextMenuItems.push({
								iconCls: 'icon-save',
								text: 'Downlaod file',
								handler : function() {
									me.downloadPhoto(record.get('media_id')) ;
								},
								scope : me
							});
							contextMenuItems.push('-') ;
							contextMenuItems.push({
								iconCls: 'icon-bible-delete',
								text: 'Discard invoice',
								handler : function() {
									me.discardItem(record.get('filerecord_id')) ;
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
							me.showPhoto(record.get('media_id')) ;
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
				this.dropStatus = (me.validateRecord(selectedRecord) ? this.dropAllowed : this.dropNotAllowed) ;
				return  ;
			},
			notifyOver: function(ddSource, e, data) {
				return this.dropStatus ;
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					if( !me.validateRecord(selectedRecord) ) {
						Ext.Msg.alert('Error','Incompatible (country and/or type) attachment !') ;
						return false ;
					}
					me.associateRecord(selectedRecord)
					return true;
			}
		});
	},
	
	validateRecord: function( attachmentRecord ) {
		if( attachmentRecord.get('country_code') != this.rowRecord.get('country_code') ) {
			return false ;
		}
		if( attachmentRecord.get('doc_type') != 'PROMO_ACK' ) {
			return false ;
		}
		return true ;
	},
	associateRecord: function( attachmentRecord ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_associateAttachment',
				attach_filerecordId: attachmentRecord.get('filerecord_id'),
				promo_filerecordId: this.rowRecord.get('_filerecord_id')
			},
			success : function(){
				this.down('dataview').getStore().load() ;
				this.optimaModule.postCrmEvent('attachmentschange') ;
			},
			scope: this
		});
	},
	
	discardItem: function( filerecordId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'promo_discardAttachment',
				attach_filerecordId: filerecordId
			},
			success : function(){
				this.down('dataview').getStore().load() ;
				this.optimaModule.postCrmEvent('attachmentschange') ;
			},
			scope: this
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
