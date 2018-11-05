Ext.define('Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',{
	extend: 'Ext.panel.Panel',
	
	_mediaId: null,
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'border',
			items:[{
				itemId: 'cntPage',
				region: 'center',
				flex: 1,
				xtype: 'panel',
				cls: 'ux-noframe-bg',
				layout: 'fit',
				items: []
			},{
				title: 'Pages',
				region: 'west',
				collapsible: true,
				collapsed: false,
				width: 222,
				layout: 'fit',
				xtype: 'panel',
				items: [{
					border: false,
					itemId: 'dvThumbnails',
					xtype: 'dataview',
					selectionModel: {
						mode: 'SINGLE'
					},
					store: {
						model: 'RsiRecouveoEnvelopeDocumentPreviewModel',
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
								//'<div>{thumb_date}</div>',
								'<a href="#">',
									'<img src="{thumb_url}"/>',
								'</a>',
								'<div>Page&#160;<b>{thumb_page}</b></div>',
							'</div>',
						'</tpl>'
					],
					trackOver: true,
					overItemCls: 'x-item-over',
					itemSelector: 'div.thumb-box',
					prepareData: function(data) {
						Ext.apply(data, {
							thumb_page: data.page_idx,
							thumb_url: 'data:image/jpeg;base64,'+data.thumb_base64
						});
						return data;
					},
					listeners: {
						selectionchange: {
							fn: function(view, records) {
								if( records.length != 1 ) {
									return ;
								}
								this.setPageIdx( records[0].get('page_idx') ) ;
							},
							scope: this
						},
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
										this.handleDownload(record.get('attachment_media_id')) ;
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
						}
					}
				}]
			}]
		});
		
		this.callParent() ;
		
		if( this._mediaId ) {
			this.loadMedia( this._mediaId ) ;
		}
	},
	loadMedia: function( mediaId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_getPreview',
				envdoc_media_id: mediaId
			},
			success: function(response) {
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				if( ajaxResponse.success ) {
					this.onLoadMedia(mediaId, ajaxResponse.data) ;
				}
			},
			scope: this
		}) ;
	},
	onLoadMedia: function( mediaId, ajaxData ) {
		this._mediaId = mediaId ;
		
		this.down('#dvThumbnails').getStore().loadData(ajaxData) ;
		this.down('#dvThumbnails').getSelectionModel().select(0) ;
	},
	setPageIdx: function( pageIdx ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_getPage',
				envdoc_media_id: this._mediaId,
				page_idx: pageIdx
			},
			success: function(response) {
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				if( ajaxResponse.success ) {
					this.setPageOnJpeg(ajaxResponse.data) ;
				}
			},
			scope: this
		}) ;
	},
	setPageOnJpeg: function( jpegBase64 ) {
		var cntPage = this.down('#cntPage') ;
		cntPage.removeAll() ;
		cntPage.add({
			xtype: 'container',
			scrollable: true,
			items: [{
				xtype: 'image',
				src: 'data:image/jpeg;base64,' + jpegBase64
			}]
		});
		this.hideLoadmask() ;
	},
	handleDownload: function() {
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'doc_downloadPdf',
			envdoc_media_id: this._mediaId
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}) ;
