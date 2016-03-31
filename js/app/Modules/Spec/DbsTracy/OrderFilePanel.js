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
		'Optima5.Modules.Spec.DbsTracy.CfgParamField',
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
					this.handleSaveHeader() ;
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
				itemId: 'pHeaderForm',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items: [Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
					cfgParam_id: 'SOC',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					fieldLabel: '<b>Company</b>',
					name: 'id_soc',
					allowBlank: false,
					anchor: '',
					width: 325
				}),{
					xtype: 'textfield',
					fieldLabel: '<b>DN #</b>',
					anchor: '',
					width: 250,
					name: 'id_doc',
					allowBlank: false
				},{
					xtype: 'textfield',
					fieldLabel: 'PO #',
					anchor: '',
					width: 250,
					name: 'ref_po',
					allowBlank: false
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>',
					name: 'atr_consignee',
					allowBlank: false
				},{
					xtype: 'textarea',
					fieldLabel: '<b>Location</b>',
					name: 'txt_location'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: '<b>Priority</b>',
					anchor: '',
					width: 200,
					name: 'atr_priority',
					allowBlank: false
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
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_l',
							width: 50,
							allowBlank: false
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>W:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_w',
							width: 50,
							allowBlank: false
						},{
							xtype: 'box',
							html: '&#160;&#160;<b>H:</b>&#160;'
						},{
							xtype: 'numberfield',
							hideTrigger:true,
							name: 'vol_dim_h',
							width: 50,
							allowBlank: false
						}]
					},{
						xtype: 'numberfield',
						hideTrigger:true,
						xtype: 'textfield',
						anchor: '',
						width: 120,
						fieldLabel: 'NbParcels',
						allowBlank: false,
						name: 'vol_count'
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
	
	newOrder: function() {
		this._orderNew = true ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_doc').set
		
		//gOrders
		//this.down('#pOrdersGrid').getEl().mask() ;
		
		//gEvents
		//this.down('#pEvents').getEl().mask() ;
	},
	loadOrder: function( filerecordId ) {
		this.showLoadmask() ;
	},
	onLoadOrder: function( orderRecord ) {
		this.hideLoadmask() ;
		this._orderFilerecordId = orderRecord.getId() ;
		
		//fHeader
		
		
		//gOrders
		
		//gEvents
		
	},
	doReload: function() {
		this.loadOrder( this._orderFilerecordId ) ;
	},
	
	handleSaveHeader: function() {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		recordData['vol_dims'] = recordData['vol_dim_l'] + ' x ' + recordData['vol_dim_w'] + ' x ' + recordData['vol_dim_h'] ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_tracy',
			_action: 'order_setHeader',
			_is_new: ( this._orderNew ? 1 : 0 ),
			order_filerecord_id: ( this._orderNew ? null : this._orderFilerecordId ),
			data: Ext.JSON.encode(recordData)
		} ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','File not saved !') ;
					return ;
				}
				this.onSaveHeader(ajaxResponse.id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(savedId) {
		this.fireEvent('datachange',this) ;
		
		if( this._orderNew ) {
			this.loadOrder(savedId) ;
		} else {
			this.destroy() ;
		}
	}
});
