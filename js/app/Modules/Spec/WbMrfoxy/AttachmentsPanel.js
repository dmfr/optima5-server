Ext.define('WbMrfoxyAttachmentDataviewModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'type_separator', type: 'boolean' },
		{name: 'type_media', type: 'boolean' },
		{name: 'separator_txt',  type: 'string'},
		{name: 'separator_iconurl',  type: 'string'},
		{name: 'filerecord_id',  type: 'int'},
		{name: 'filerecord_caption',  type: 'string'},
		{name: 'filerecord_date',  type: 'string'}
	]
}) ;
Ext.define('WbMrfoxyAttachmentTypeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'attachtype',
	fields: [
		{name: 'attachtype', type: 'string'},
		{name: 'attachtype_txt', type: 'string'},
		{name: 'is_invoice', type: 'boolean'}
	]
}) ;
Ext.define('WbMrfoxyAttachmentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'filerecord_id',
	fields: [
		{name: 'filerecord_id',  type: 'int'},
		{name: 'country_code',  type: 'string'},
		{name: 'doc_date',  type: 'string'},
		{name: 'doc_type',  type: 'string'},
		{name: 'invoice_txt',  type: 'string'},
		{name: 'invoice_amount',  type: 'string'},
		{
			name: 'invoice_currency',
			type: 'string',
			convert: function(v, record) {
				var countryRecord = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById( record.data.country_code ) ;
				if( countryRecord ) {
					return countryRecord.data.country_currency ;
				}
				return '?' ;
			}
		}
	]
}) ;
Ext.define('Optima5.Modules.Spec.WbMrfoxy.AttachmentsPanel',{
	extend:'Ext.panel.Panel',
	requires:[],

	initComponent: function() {
		this.addEvents('proceed') ;
		
		if( (this.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:PromoBaselinePanel','No module reference ?') ;
		}
		
		Ext.apply(this,{
			border: false,
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCountry',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbCountrySelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'country_code', type: 'string'},
								{name: 'country_text', type: 'string'},
								{name: 'country_iconurl', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'country_text',
						rootVisible: true,
						useArrows: true
					}]
				}
			},'->',{
				itemId: 'tbAttach',
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: 'Attach Img',
				handler: function(){
					this.handleNewAttachment() ;
				},
				scope: this
			},{
				itemId: 'tbRefresh',
				text: 'Refresh',
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				handler:function() {
					this.doLoad() ;
				},
				scope:this
			}],
			items:[{
				itemId: 'dvGallery',
				xtype: 'dataview',
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
							'<div class="op5-spec-mrfoxy-attachments-item thumb-box">',
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
				optimaModule: this.optimaModule,
				prepareData: function(data) {
					var getParams = this.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data.filerecord_id,
						thumb: true
					});
					
					Ext.apply(data, {
						thumb_date: data.filerecord_date,
						thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
						thumb_caption: data.filerecord_caption
					});
					return data;
				},
				listeners: {
					itemclick: this.onItemClick,
					itemcontextmenu: this.onItemClick,
					scope: this
				}
			}]
		});
		
		this.callParent() ;
		this.loadComponents() ;
	},
	loadComponents: function() {
		var me = this,
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		countryChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll(), function(rec) {
			countryChildren.push({
				leaf:true,
				checked: false,
				country_code: rec.get('country_code'),
				country_text: rec.get('country_display'),
				country_iconurl: rec.get('country_iconurl'),
				icon: rec.get('country_iconurl')
			});
		}, me) ;
		tbCountrySelect.setRootNode({
			root: true,
			children: countryChildren,
			expanded: true,
			country_code:'',
			country_text:'<b>'+'All countries'+'</b>',
			country_iconurl:'images/op5img/ico_planet_small.gif',
			checked:true,
			icon: 'images/op5img/ico_planet_small.gif'
		});
		
		tbCountrySelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectCountry() ;
			}
		},this) ;
		this.onSelectCountry(true) ;
		
		this.attachTypesStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			model: 'WbMrfoxyAttachmentTypeModel',
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'attachments_cfgGetTypes'
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			}),
			listeners: {
				load: function() {
					this.doLoad() ; // DIRTY: should use onLoad/ready mechanism
				},
				scope: this
			}
		}) ;
		
		this.doToolbar() ;
		// this.doLoad() ;
	},
	
	onSelectCountry: function(silent) {
		var tbCountry = this.query('#tbCountry')[0],
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		tbCountrySelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				tbCountry.setIcon( chrec.get('country_iconurl') ) ;
				tbCountry.setText( chrec.get('country_text') ) ;
				
				this.filterCountry = chrec.get('country_code') ;
				if( !silent ) {
					this.doToolbar() ;
					this.doLoad() ;
				}
				
				return false ;
			}
		},this);
	},
	
	doToolbar: function() {
		this.down('#tbAttach').setVisible( !Ext.isEmpty(this.filterCountry) ) ;
	},
	
	
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'attachments_getList',
				filter_country: this.filterCountry
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
		this.attachmentsStore = Ext.create('Ext.data.Store',{
			model: 'WbMrfoxyAttachmentModel',
			data: ajaxObj.data,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			},
			sorters: [{
				property : 'doc_date',
				direction: 'DESC'
			}]
		}) ;
		
		var filterCountry = this.filterCountry ;
		
		var attachTypesTxt = {}, attachTypesIsInvoice = {} ;
		this.attachTypesStore.each( function(attachTypeRecord) {
			attachTypesTxt[attachTypeRecord.getId()] = attachTypeRecord.get('attachtype_txt') ;
			attachTypesIsInvoice[attachTypeRecord.getId()] = attachTypeRecord.get('is_invoice') ;
		}) ;
		
		if( Ext.isEmpty(filterCountry) ) {
			var obj_countryCode_attachmentRecords = {} ;
			this.attachmentsStore.each( function(attachmentRecord) {
				var countryCode = attachmentRecord.get('country_code') ;
				if( !obj_countryCode_attachmentRecords.hasOwnProperty(countryCode) ) {
					obj_countryCode_attachmentRecords[countryCode] = [] ;
				}
				obj_countryCode_attachmentRecords[countryCode].push( attachmentRecord ) ;
			}) ;
			
			var dataviewData = [] ;
			Ext.Object.each( obj_countryCode_attachmentRecords, function(countryCode,attachmentRecords) {
				var dataObj = {
					type_separator: true
				} ;
				var countryRecord = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById( countryCode ) ;
				if( countryRecord != null ) {
					Ext.apply( dataObj, {
						separator_iconurl: countryRecord.data.country_iconurl,
						separator_txt: countryRecord.data.country_display
					} ) ;
				}
				dataviewData.push(dataObj) ;
				
				
				Ext.Array.each( attachmentRecords, function(attachmentRecord) {
					var filerecordCaption = '' ;
					filerecordCaption += attachTypesTxt[attachmentRecord.get('doc_type')] ;
					if( attachTypesIsInvoice[attachmentRecord.get('doc_type')] ) {
						filerecordCaption += '<br>' ;
						filerecordCaption += Ext.util.Format.number(attachmentRecord.get('invoice_amount'),'0,0') + '&#160;' + attachmentRecord.get('invoice_currency') ;
					}
					
					var dataObj = {
						type_media: true,
						filerecord_id: attachmentRecord.get('filerecord_id'),
						filerecord_date: attachmentRecord.get('doc_date'),
						filerecord_caption: filerecordCaption
					} ;
					dataviewData.push(dataObj) ;
				}) ;
			});
		} else {
			var obj_docType_attachmentRecords = {} ;
			
			this.attachmentsStore.each( function(attachmentRecord) {
				var countryCode = attachmentRecord.get('country_code'),
					docType = attachmentRecord.get('doc_type') ;
				if( countryCode != filterCountry ) {
					return ;
				}
				if( !obj_docType_attachmentRecords.hasOwnProperty(docType) ) {
					obj_docType_attachmentRecords[docType] = [] ;
				}
				obj_docType_attachmentRecords[docType].push( attachmentRecord ) ;
			}) ;
			
			var dataviewData = [] ;
			Ext.Object.each( obj_docType_attachmentRecords, function(docType,attachmentRecords) {
				var dataObj = {
					type_separator: true
				} ;
				Ext.apply( dataObj, {
					separator_txt: attachTypesTxt[docType]
				} ) ;
				dataviewData.push(dataObj) ;
				
				Ext.Array.each( attachmentRecords, function(attachmentRecord) {
					var filerecordCaption = '' ;
					if( attachTypesIsInvoice[attachmentRecord.get('doc_type')] ) {
						filerecordCaption += attachmentRecord.get('invoice_txt').substr(0,30) ;
						filerecordCaption += '<br>' ;
						filerecordCaption += Ext.util.Format.number(attachmentRecord.get('invoice_amount'),'0,0') + '&#160;' + attachmentRecord.get('invoice_currency') ;
					}
					
					var dataObj = {
						type_media: true,
						filerecord_id: attachmentRecord.get('filerecord_id'),
						filerecord_date: attachmentRecord.get('doc_date'),
						filerecord_caption: filerecordCaption
					} ;
					dataviewData.push(dataObj) ;
				}) ;
			},this);
		}
		
		this.down('#dvGallery').getStore().loadData(dataviewData) ;
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
	
	
	/*
	 * Event detail floating window
	 */
	onItemClick: function( dataview, record, node, index, clickEl ) {
		var filerecordId = record.get('filerecord_id') ;
			
		if( !(filerecordId > 0) ) {
			return ;
		}
			
		if( !this.itemDetailPanel ) {
			this.itemDetailPanel = Ext.create('Ext.panel.Panel', {
				id: this.id + '-itemdetailpanel',
				title: '...',
				layout: 'fit',
				floating: true,
				width: 300,
				height: 150,
				renderTo: Ext.getBody(),
				tools: [{
					type: 'close',
					handler: function(e, t, p) {
						p.ownerCt.hide();
					}
				}],
				items: [{
					itemId: 'cmpData',
					xtype: 'component',
					cls: 'ux-noframe-bg',
					tpl: [
						'<div class="op5-crmbase-filecalendar-eventdetail">',
							'<tpl if="crmFields">',
								'<table class="op5-crmbase-filecalendar-eventdetail-tbl" cellpadding="0" cellspacing="0">',
								'<tpl for="crmFields">',
									'<tr>',
										'<td class="op5-crmbase-filecalendar-eventdetail-tdlabel">{fieldLabel}</td>',
										'<td class="op5-crmbase-filecalendar-eventdetail-tdvalue"><b>{fieldValue}</b></td>',
									'</tr>',
								'</tpl>',
								'</table>',
							'</tpl>',
						'</div>'
					]
				}],
				bbar:[{
					iconCls: 'icon-fullscreen',
					text: 'Show photo',
					handler : function(btn) {
						var p = btn.up('panel') ;
						p.fireEvent('actionshow',p) ;
					}
				},{
					iconCls:'op5-crmbase-dataformwindow-icon',
					text:'Edit',
					handler: function(btn) {
						var p = btn.up('panel') ;
						p.fireEvent('actionedit',p) ;
					}
				},'->',{
					iconCls:'op5-crmbase-qtoolbar-file-delete',
					text:'Delete',
					handler: function(btn) {
						var p = btn.up('panel') ;
						p.fireEvent('actiondelete',p) ;
					}
				}],
				listeners:{
					hide: this.onItemDetailHide,
					
					actionshow: function(p) {
						var filerecordId = p.filerecordId ;
						this.showPhoto(filerecordId) ;
					},
					actionedit: function(p) {
						var filerecordId = p.filerecordId ;
						this.itemDetailPanel.hide() ;
						this.handleEditAttachment(filerecordId) ;
					},
					actiondelete: function(p) {
						var filerecordId = p.filerecordId ;
						this.deleteItem(filerecordId) ;
					},
					
					scope: this
				}
			});
		}
		
		var attachmentRecord = this.attachmentsStore.getById(filerecordId),
			crmFields = [] ;
		if( attachmentRecord == null ) {
			return ;
		}
		crmFields.push({
			fieldLabel: 'Doc.Date',
			fieldValue: attachmentRecord.get('doc_date')
		}) ;
		crmFields.push({
			fieldLabel: 'Type',
			fieldValue: (this.attachTypesStore.getById(attachmentRecord.get('doc_type')) ? this.attachTypesStore.getById(attachmentRecord.get('doc_type')).get('attachtype_txt') : '?')
		}) ;
		var isInvoice = (this.attachTypesStore.getById(attachmentRecord.get('doc_type')) ? this.attachTypesStore.getById(attachmentRecord.get('doc_type')).get('is_invoice') : false) ;
		if( isInvoice ) {
			crmFields.push({
				fieldLabel: 'Invoice Txt',
				fieldValue: attachmentRecord.get('invoice_txt')
			}) ;
			crmFields.push({
				fieldLabel: 'Invoice Amount',
				fieldValue: Ext.util.Format.number(attachmentRecord.get('invoice_amount'),'0,0') + '&#160;' + attachmentRecord.get('invoice_currency')
			}) ;
		}
		
		this.itemDetailPanel.filerecordId = filerecordId ;
		this.itemDetailPanel.setTitle('File #'+filerecordId) ;
		this.itemDetailPanel.child('#cmpData').update({
			crmFields: crmFields
		}) ;
		this.itemDetailPanel.showAt(clickEl.getXY()) ;
		
		// monitor clicking and mousewheel
		this.mon(Ext.getDoc(), {
				mousewheel: this.itemDetailHideIf,
				mouseup: this.itemDetailHideIf,
				scope: this
		});
	},
	onItemDetailHide: function( p ) {
		var hideIf = this.itemDetailHideIf,
			doc = Ext.getDoc() ;
			
		doc.un('mousewheel', hideIf, this);
		doc.un('mouseup', hideIf, this);
		this.stopOneClick = true ;
	},
	itemDetailHideIf: function(e) {
		if( !this.isDestroyed && !e.within(this.itemDetailPanel.el, false, true) ) {
			this.itemDetailPanel.hide();
			
			this.mon(Ext.getDoc(),'click',function(e) {
				this.stopOneClick = false ;
			},this,{single:true}) ;
		}
	},
	
	handleNewAttachment: function() {
		var attachmentRecord = Ext.create('WbMrfoxyAttachmentModel',{
			country_code: this.filterCountry
		});
		this.handleAttachment(attachmentRecord) ;
	},
	handleEditAttachment: function( filerecordId ) {
		var attachmentRecord = this.attachmentsStore.getById(filerecordId) ;
		if( attachmentRecord ) {
			this.handleAttachment(attachmentRecord) ;
		}
	},
	handleAttachment: function( attachmentRecord ) {
		var uploadForm = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			width: 500,
			height: 300,
			floating: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			title: 'Attachment',
			bodyPadding: '10px 10px',
			bodyCls: 'ux-noframe-bg',
			cls: 'ux-noframe-bg',
			border: false,
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 110,
				anchor: '100%',
				submitValue: false
			},
			layout: 'anchor',
			items: [{
				xtype:'hiddenfield',
				name:'filerecord_id'
			},{
				itemId: 'fsUpload',
				xtype:'fieldset',
				defaults: {
					anchor: '100%',
					labelWidth: 75
				},
				title: 'Upload source',
				items:[{
					xtype: 'filefield',
					submitValue: true,
					emptyText: 'Select a file',
					fieldLabel: 'File path',
					name: 'photo-filename',
					buttonText: '',
					buttonConfig: {
						iconCls: 'upload-icon'
					}
				}]
			},{
				xtype: 'colorcombo',
				queryMode: 'local',
				forceSelection: true,
				editable: false,
				displayField: 'country_display',
				valueField: 'country_code',
				iconUrlField: 'country_iconurl',
				store: {
					fields: ['country_code','country_display','country_iconurl','country_currency'],
					data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll()
				},
				allowBlank: false,
				readOnly: true,
				fieldLabel: 'Country',
				name : 'country_code',
				itemId : 'country_code'
			},{
				xtype: 'datefield',
				fieldLabel: 'Document Date',
				name: 'doc_date',
				allowBlank: false,
				format: 'Y-m-d',
				startDay: 1,
				anchor: '',
				width: 230
			},{
				xtype: 'combobox',
				fieldLabel: 'Attachment Type',
				name: 'doc_type',
				forceSelection: true,
				allowBlank: false,
				editable: false,
				store: this.attachTypesStore,
				queryMode: 'local',
				displayField: 'attachtype_txt',
				valueField: 'attachtype',
				listeners:{
					change: function(field){ field.up('form').calcLayout(); }
				}
			},{
				itemId: 'fsInvoice',
				xtype:'fieldset',
				defaults: {
					anchor: '100%',
					labelWidth: 75
				},
				title: 'Invoices data',
				items:[{
					xtype: 'textfield',
					name:'invoice_txt',
					fieldLabel: 'Description'
				},{
					xtype: 'fieldcontainer',
					layout:{
						type: 'hbox',
						align: 'stretch'
					},
					itemId: 'mechanics_mono_discount',
					fieldLabel: 'Amount',
					items:[{
						xtype: 'numberfield',
						name:'invoice_amount',
						anchor: '',
						width: 80,
						minValue: 0
					},{
						xtype:'displayfield',
						name: 'invoice_currency',
						padding: '0px 10px'
					}]
				}]
			}],
			buttons: [
				{ xtype: 'button', text: 'Submit' , handler:function(btn){ btn.up('form').handleSubmit();} }
			],
			
			calcLayout: function() {
				var formPanel = this,
					form = formPanel.getForm(),
					formValues = form.getValues(false,false,false,true),
					typeField = form.findField('doc_type'),
					typeValue = typeField.getValue(),
					isInvoice = (Ext.isEmpty(typeValue) ? false : typeField.getStore().getById(typeValue).get('is_invoice')),
					countryField = form.findField('country_code'),
					countryValue = countryField.getValue(),
					countryCurrency = (Ext.isEmpty(countryValue) ? '' : countryField.getStore().getById(countryValue).get('country_currency')) ;
				
				formPanel.down('#fsUpload').setVisible( !(formValues.filerecord_id > 0) ) ;
				form.findField('photo-filename').allowBlank = (formValues.filerecord_id > 0) ;
				formPanel.down('#fsInvoice').setVisible(isInvoice) ;
				form.findField('invoice_amount').allowBlank = !isInvoice ;
				form.findField('invoice_currency').setValue(countryCurrency) ;
				
				var countryCode = formValues.country_code
			},
			
			handleSubmit: function() {
				var formPanel = this,
					baseForm = this.getForm() ;
				if(baseForm.isValid()){
					var ajaxParams = this.optimaModule.getConfiguredAjaxParams(),
						formValues = baseForm.getValues(false,false,false,true) ;
					Ext.apply( ajaxParams, {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'attachments_upload',
						data: Ext.JSON.encode(formValues)
					}) ;
					
					if( !(formValues.filerecord_id > 0) ) {
						var msgbox = Ext.Msg.wait('Uploading...') ;
					}
					baseForm.submit({
						url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						params: ajaxParams,
						success : function(){
							if( !Ext.isEmpty(msgbox) ) {
								msgbox.close() ;
							}
							Ext.menu.Manager.hideAll();
							this.fireEvent('submitok') ;
							this.destroy();
						},
						failure: function(fp, o) {
							if( msgbox ) {
								msgbox.close() ;
							}
							Ext.Msg.alert('Error','Error during transaction') ;
						},
						scope: formPanel
					});
				}
			}
		});
		uploadForm.on('submitok',function() {
			this.doLoad() ;
		},this) ;
		uploadForm.on('destroy',function() {
			this.getEl().unmask() ;
		},this,{single:true}) ;
		this.getEl().mask() ;
		
		uploadForm.loadRecord(attachmentRecord) ;
		uploadForm.calcLayout() ;
		
		uploadForm.show();
		uploadForm.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	deleteItem: function( filerecordId ) {
		Ext.Msg.confirm('Delete','Delete this item ?', function(buttonStr) {
			if( buttonStr != 'yes' ) {
				return ;
			}
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'attachments_delete',
					filerecord_id: filerecordId
				},
				success : function(){
					this.doLoad() ;
				},
				scope: this
			});
		},this) ;
	},
			  
	showPhoto: function( filerecordId ) {
		var getParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: filerecordId,
			thumb:''
		});
		
		var getParamsDownload = {} ;
		Ext.apply( getParamsDownload, getParams ) ;
		Ext.apply( getParamsDownload, {
			download: true
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
				
				
				var imageviewerWindow = this.optimaModule.createWindow({
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
					}],
					tbar: [{
						iconCls: 'icon-save',
						text: 'Download file',
						handler: function() {
							Ext.create('Ext.ux.dams.FileDownloader',{
								renderTo: Ext.getBody(),
								requestParams: getParamsDownload,
								requestAction: 'server/backend_media.php',
								requestMethod: 'GET'
							}) ;
						}
					}]
				}) ;
			},
			scope: this
		});
	},
	
	handleQuit: function() {
		this.fireEvent('quit') ;
	}
});