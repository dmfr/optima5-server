Ext.define('Optima5.Modules.Spec.DbsTracy.OrderAttachmentsDataview',{
	extend: 'Ext.view.View',
	mixins: {
		draggable   : 'Ext.ux.DataviewDraggable'
	},
	store: {
		model: 'WbMrfoxyAttachmentDataviewModel',
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
			'<tpl if="type_separator">',
				'<div class="x-clear"></div>',
				'<div class="op5-spec-mrfoxy-attachments-separator"',
				'<tpl if="separator_iconurl">',
					' style="background-image:url({separator_iconurl})"',
				'</tpl>',
				'>{separator_txt}</div>',
				'<div class="op5-spec-mrfoxy-attachments-item" style="display:none"></div>',
			"</tpl>",
		
			'<tpl if="type_media">',
				'<div class="op5-spec-mrfoxy-attachments-item thumb-box',
				'<tpl if="thumb_red">',
				' thumb-box-red',
				'</tpl>',
				'">',
						'<div>{thumb_date}</div>',
						'<a href="#">',
							'<img src="{thumb_url}"/>',
						'</a>',
						'<div>{thumb_caption}</div>',
				'</div>',
			'</tpl>',
		'</tpl>'
	],
	trackOver: true,
	itemSelector: 'div.op5-spec-mrfoxy-attachments-item',
	prepareData: function(data) {
		var getParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: data.filerecord_id,
			thumb: true
		});
		
		Ext.apply(data, {
			thumb_date: data.filerecord_date,
			thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
			thumb_caption: data.filerecord_caption,
			thumb_red: data.filerecord_blocked
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


Ext.define('Optima5.Modules.Spec.DbsTracy.OrderFilePanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamText'
	],
	
	initComponent: function() {
		
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
				},
				scope:this
			},{
				iconCls:'op5-sdomains-menu-updateschema',
				text:'<b>Validate</b>',
				handler: function() {
				},
				scope:this
			}],
			items:[{
				flex: 3,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items: [{
					xtype: 'textfield',
					fieldLabel: '<b>DN #</b>',
					anchor: '',
					width: 250,
					value: ''
				},{
					xtype: 'textfield',
					fieldLabel: 'PO #',
					anchor: '',
					width: 250,
					value: ''
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>'
				},{
					xtype: 'textarea',
					fieldLabel: '<b>Location</b>'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: '<b>Priority</b>',
					anchor: '',
					width: 200
				},{
					xtype: 'fieldset',
					title: 'Volume details',
					items: [{
						fieldLabel: 'Dimensions',
						xtype: 'fieldcontainer',
						layout: {
							type: 'hbox',
							align: 'center'
						},
						items: [{
							xtype: 'box',
							html: '&#160;&#160;<b>L:</b>&#160;'
						},{
							xtype: 'textfield',
							name: 'vol_dim_l',
							width: 50
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>W:</b>&#160;'
						},{
							xtype: 'textfield',
							name: 'vol_dim_w',
							width: 50
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>H:</b>&#160;'
						},{
							xtype: 'textfield',
							name: 'vol_dim_h',
							width: 50
						}]
					},{
						xtype: 'textfield',
						anchor: '',
						width: 120,
						fieldLabel: 'NbParcels'
					}]
				}]
			},{
				flex: 3,
				xtype: 'grid',
				columns: [{
					text: 'DN #',
					width: 75,
					dataIndex: 'tmp_dn'
				},{
					text: 'PO #',
					width: 75,
					dataIndex: 'tmp_po'
				},{
					text: 'Status',
					width: 100,
					renderer: function(v,m,record) {
						var tmpProgress = record.get('tmp_status_percent') / 100 ;
						var tmpText = record.get('tmp_status_text') ;
							var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
							b.updateProgress(tmpProgress,tmpText);
							v = Ext.DomHelper.markup(b.getRenderTree());
							b.destroy() ;
						return v;
					}
				},{
					text: 'Parcels',
					width: 60,
					dataIndex: 'tmp_parcels'
				},{
					text: 'Dimensions',
					width: 150,
					dataIndex: 'tmp_dims'
				}],
				store: {
					fields: ['tmp_dn','tmp_po','tmp_status_percent','tmp_status_text','tmp_parcels','tmp_dims'],
					data: [{
						tmp_dn: '132465',
						tmp_po: '879878',
						tmp_status_percent: 20,
						tmp_status_text: 'WaitDocuments',
						tmp_parcels: '1',
						tmp_dims: '250 x 350 x 1200'
					},{
						tmp_dn: '540000',
						tmp_po: '879899',
						tmp_status_percent: 35,
						tmp_status_text: 'Ready',
						tmp_parcels: '2',
						tmp_dims: '400 x 500 x 500'
					}]
				}
			},{
				flex: 2,
				title: 'Attachments',
				xtype: 'panel',
				layout: 'fit',
				items: {
					xtype: 'dataview',
					store: {
						fields: ['url_id'],
						data: [{
							url_id: 'test1'
						},{
							url_id: 'test2'
						},{
							url_id: 'test3'
						},{
							url_id: 'test4'
						},{
							url_id: 'test5'
						}]
					},
					scrollable: 'vertical',
					
					tpl:[
						'<tpl for=".">',
							'<div class="op5-spec-dbstracy-attachments-item thumb-box">',
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
						Ext.apply(data, {
							thumb_date: '<b>'+data.url_id+'</b>',
							thumb_url: '/demo/'+data.url_id+'.thumb.jpg'
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
										this.showPhoto(record.get('url_id')) ;
									},
									scope : this
								});
								contextMenuItems.push({
									iconCls: 'icon-save',
									text: 'Downlaod file',
									handler : function() {
										this.downloadPhoto(record.get('filerecord_id')) ;
									},
									scope : this
								});
								contextMenuItems.push('-') ;
								contextMenuItems.push({
									iconCls: 'icon-bible-delete',
									text: 'Discard invoice',
									handler : function() {
										this.discardItem(record.get('filerecord_id')) ;
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
								this.showPhoto(record.get('url_id')) ;
							},
							scope:this
						},
						render: { 
							//fn: this.onDataviewRender,
							scope: this
						}
					}
				}
			}]
		}) ;
		this.callParent() ;
	},
	showPhoto: function( url_id ) {
		var imageviewerWindow = this.optimaModule.createWindow({
			title:'Image Viewer',
			width:800,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-photo-icon',
			animCollapse:false,
			border: false,
			items: [{
				xtype:'image',
				src: '/demo/' + url_id + '.jpg',
				resizable: false
			}]
		}) ;
	}
});
