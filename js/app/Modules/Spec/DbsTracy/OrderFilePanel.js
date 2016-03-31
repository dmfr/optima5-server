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
					name: 'id_dn',
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
				itemId: 'pStepsGrid',
				columns: [{
					text: 'Code',
					width: 90,
					dataIndex: 'step_code',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Step',
					width: 80,
					dataIndex: 'step_txt'
				},{
					text: 'Status',
					width: 50,
					dataIndex: 'status_is_ok',
					editor:{ xtype:'checkboxfield' }
				},{
					text: 'Date OK',
					width: 160,
					dataIndex: 'date_actual',
					editor:{ xtype:'datetimefield' }
				}],
				plugins: [{
					ptype: 'rowediting',
					listeners: {
						edit: this.onAfterEditStep,
						scope: this
					}
				}],
				store: {
					model: 'DbsTracyFileOrderStepModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					listeners: {
						datachanged: function(store) {
							store.each( function(record) {
								var flow = Optima5.Modules.Spec.DbsTracy.HelperCache.getOrderflowByStep( record.get('step_code') ) ;
								if( flow == null ) {
									return ;
								}
								var curStep = null ;
								Ext.Array.each( flow.steps, function(step) {
									if( step.step_code == record.get('step_code') ) {
										curStep = step ;
										return false ;
									}
								});
								if( curStep == null ) {
									return ;
								}
								record.data['step_txt'] = curStep.step_txt ;
							}) ;
						}
					}
				}
			},{
				flex: 2,
				itemId: 'pAttachments',
				title: 'Attachments',
				xtype: 'panel',
				layout: 'fit',
				items: {
					xtype: 'dataview',
					itemId: 'pAttachmentsDv',
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
		
		this.on('afterrender', function() {
			if( this._orderNew ) {
				this.newOrder() ;
			} else {
				this.loadOrder( this._orderFilerecordId ) ;
			}
		},this) ;
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
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(false) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().mask() ;
		this.down('#pStepsGrid').getStore().removeAll() ;
		
		//gAttachments
		this.down('#pAttachmentsDv').getEl().mask() ;
		this.down('#pAttachmentsDv').getStore().removeAll() ;
	},
	loadOrder: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords',
				filter_orderFilerecordId_arr: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadOrder(Ext.ux.dams.ModelManager.create('DbsTracyFileOrderModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadOrder: function( orderRecord ) {
		this._orderFilerecordId = orderRecord.getId() ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().findField('id_dn').setReadOnly(true) ;
		this.down('#pHeaderForm').getForm().loadRecord(orderRecord) ;
		
		//gSteps
		this.down('#pStepsGrid').getEl().unmask() ;
		this.down('#pStepsGrid').getStore().loadRawData(orderRecord.steps().getRange()) ;
		
		//gAttachments
		this.down('#pAttachmentsDv').getEl().unmask() ;
		this.down('#pAttachmentsDv').getStore().loadData(orderRecord.attachments().getRange()) ;
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
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_setHeader',
				_is_new: ( this._orderNew ? 1 : 0 ),
				order_filerecord_id: ( this._orderNew ? null : this._orderFilerecordId ),
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
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
			this.fireEvent('candestroy',this) ;
		}
	},
	
	onAfterEditStep: function(editor,editEvent) {
		return ;
		var me = this,
			crmFields = {},
			editedRecord = editEvent.record ;
		
		if( editedRecord.get('filerecord_id') == -1 ) {
			editedRecord.set('filerecord_id',0);
		}
			
		Ext.Object.each( me.gridCfg.grid_fields , function(k,v) {
			if( v.link_bible && !v.is_raw_link ) {
				return ;
			}
			
			if( editedRecord.data[v.field] != null && v.file_field != null ) {
				var fieldCode = 'field_'+v.file_field ;
				switch( v.type ) {
					case 'date' :
						crmFields[fieldCode] = Ext.Date.format(editedRecord.data[v.field], 'Y-m-d H:i:s') ;
						break ;
						
					default :
						crmFields[fieldCode] = editedRecord.data[v.field] ;
						break ;
				}
			}
		}) ;
		
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_setFileGrid_raw',
			data: Ext.JSON.encode(crmFields),
			file_code: this.fileId,
			is_new: ( editedRecord.get('filerecord_id')>0 ? 0 : 1 ),
			filerecord_id: editedRecord.get('filerecord_id')
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					var filerecordId = Ext.decode(response.responseText).filerecord_id ;
					editedRecord.set('filerecord_id',filerecordId) ;
					editedRecord.set(me.fileId+'_id',filerecordId) ;
				}
			},
			scope: this
		});
	},
});
