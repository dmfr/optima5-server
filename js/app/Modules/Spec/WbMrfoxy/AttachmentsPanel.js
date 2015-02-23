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

Ext.define('Optima5.Modules.Spec.WbMrfoxy.AttachmentsDataview',{
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


Ext.define('Optima5.Modules.Spec.WbMrfoxy.AttachmentsPanel',{
	extend:'Ext.panel.Panel',
	requires:['Optima5.Modules.Spec.WbMrfoxy.AttachmentViewerWindow'],

	initComponent: function() {
		this.addEvents('proceed') ;
		
		if( (this.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:AttachmentsPanel','No module reference ?') ;
		}
		
		Ext.apply(this,{
			border: false,
			layout:'fit',
			tbar:[{
				itemId: 'tbQuit',
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
				itemId: 'tbUpload',
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: '<b>Upload Document</b>',
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
								fn: this.doUpload,
								scope:this
							}
						}
					}]
				}]
			},{
				itemId: 'tbRefresh',
				text: 'Refresh',
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				handler:function() {
					this.doLoad() ;
				},
				scope:this
			}],
			items:[ Ext.create('Optima5.Modules.Spec.WbMrfoxy.AttachmentsDataview',{
				overflowY: 'auto',
				itemId: 'dvGallery',
				optimaModule: this.optimaModule,
				listeners: {
					itemclick: this.onItemClick,
					itemcontextmenu: this.onItemClick,
					afterrender: function(p) {
						// See : http://stackoverflow.com/questions/14502492/add-listener-to-all-elements-with-a-given-class
						p.getEl().on('dragstart',function(e,elem) {
							console.dir(elem) ;
							e.stopEvent();
						},this,{delegate:'img'});
					},
					/*
					refresh: function(p) {
						Ext.Array.each( p.getNodes(), function(node) {
							var imgEl = Ext.get(node).down('img') ;
							if( !imgEl ) {
								return ;
							}
							imgEl.on('dragstart',function(e) {
								e.stopEvent() ;
							}) ;
						}) ;
					},
					*/
					dragdata: function(p,dragData) {
						var selectedRecord = dragData.records[0];
						if( selectedRecord ) {
							var filerecordId = selectedRecord.get('filerecord_id') ;
							var attachmentRecord = this.attachmentsStore.getById(filerecordId)
							dragData.records = [attachmentRecord] ;
						}
					},
					scope: this
				}
			})]
		});
		
		this.callParent() ;
		this.loadComponents() ;
		
		this.on('afterrender',function(p) {
			p.child('toolbar').child('#tbQuit').setVisible( !( p.up() instanceof Ext.window.Window ) ) ;
		}) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
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
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'attachmentschange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
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
		this.down('#tbUpload').setVisible( !Ext.isEmpty(this.filterCountry) ) ;
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
				_action: 'attachments_uploadfile'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading document...');
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.handleNewAttachment( ajaxData.tmp_id ) ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
	},
	
	handleNewAttachment: function( tmpId ) {
		var attachmentViewerWindow = this.createAttachmentWindow() ;
		attachmentViewerWindow.loadTmpMedia( tmpId, this.filterCountry ) ;
	},
	handleEditAttachment: function( filerecordId ) {
		var attachmentViewerWindow = this.createAttachmentWindow() ;
		attachmentViewerWindow.loadFilerecord( filerecordId ) ;
	},
	createAttachmentWindow: function() {
		attachmentViewerWindow = this.optimaModule.createWindow({
			attachTypesStore:this.attachTypesStore,
			hidden: true
		},Optima5.Modules.Spec.WbMrfoxy.AttachmentViewerWindow) ;
		attachmentViewerWindow.on('load',function() {
			attachmentViewerWindow.show() ;
		},this) ;
		attachmentViewerWindow.on('submitok',function() {
			this.doLoad() ;
		},this) ;
		return attachmentViewerWindow ;
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
	
	handleQuit: function() {
		this.fireEvent('quit') ;
	}
});