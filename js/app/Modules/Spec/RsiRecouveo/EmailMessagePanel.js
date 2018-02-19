Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailMessageHeaderComponent',{
	extend: 'Ext.Component',
	//height: 200,
	cls: 'op5-spec-rsiveo-emailheader',
	tpl: [
		'<div class="op5-spec-rsiveo-emailheader-wrap" style="position:relative">',
			'<tpl if="this.hasRows(adr_from)">', 
			'<div class="op5-spec-rsiveo-emailheader-caption">',
				'<span class="op5-spec-rsiveo-emailheader-captiontitle">Expediteur :</span>',
				'<span class="op5-spec-rsiveo-emailheader-captionbody">' ,
					'<tpl for="adr_from">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{.}',
							'</div>',
						'</div>',
					'</tpl>',
				'</span>',
			'</div>',
			'</tpl>',
			'<tpl if="this.hasRows(adr_to)">', 
			'<div class="op5-spec-rsiveo-emailheader-caption">',
				'<span class="op5-spec-rsiveo-emailheader-captiontitle">Destinataire :</span>',
				'<span class="op5-spec-rsiveo-emailheader-captionbody">' ,
					'<tpl for="adr_to">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{.}',
							'</div>',
						'</div>',
					'</tpl>',
				'</span>',
			'</div>',
			'</tpl>',
			'<tpl if="this.hasRows(adr_cc)">', 
			'<div class="op5-spec-rsiveo-emailheader-caption">',
				'<span class="op5-spec-rsiveo-emailheader-captiontitle">Copie(s) :</span>',
				'<span class="op5-spec-rsiveo-emailheader-captionbody">' ,
					'<tpl for="adr_cc">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{.}',
							'</div>',
						'</div>',
					'</tpl>',
				'</span>',
			'</div>',
			'</tpl>',
			'<tpl if="subject">', 
			'<div class="op5-spec-rsiveo-emailheader-caption">',
				'<span class="op5-spec-rsiveo-emailheader-captiontitle">Titre :</span>',
				'<span class="op5-spec-rsiveo-emailheader-captionbody op5-spec-rsiveo-emailheader-captionbodytext">' ,
				'{subject}',
				'</span>',
			'</div>',
			'</tpl>',
			'<tpl if="date_str">', 
			'<div class="op5-spec-rsiveo-emailheader-caption">',
				'<span class="op5-spec-rsiveo-emailheader-captiontitle">Date :</span>',
				'<span class="op5-spec-rsiveo-emailheader-captionbody op5-spec-rsiveo-emailheader-captionbodytext">' ,
				'{date_str}',
				'</span>',
			'</div>',
			'</tpl>',
			'<div class="op5-spec-rsiveo-emailheader-icon"></div>',
			'<div class="op5-spec-rsiveo-emailheader-actions-top">',
				'<tpl if="action_link">',
				'<div class="op5-spec-rsiveo-emailheader-action-btn op5-spec-rsiveo-emailheader-action-btn-link">',
				'</div>',
				'</tpl>',
			'</div>',
			'<div class="op5-spec-rsiveo-emailheader-actions-bottom">',
				'<tpl if="action_attachments">',
				'<div class="op5-spec-rsiveo-emailheader-action-btn op5-spec-rsiveo-emailheader-action-btn-attachments">',
				'</div>',
				'</tpl>',
			'</div>',
		'</div>',
		{
			// XTemplate configuration:
			disableFormats: true,
			// member functions:
			hasRows: function(arr){
				return (Ext.isArray(arr) && (arr.length>0));
			}
		}
	],
	
	initComponent: function() {
		Ext.apply(this,{
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		}) ;
	},
	update: function() {
		this.callParent(arguments) ;
		if( this.rendered ) {
			this.attachEvents() ;
		} else {
			this.on('afterrender',function() {
				this.attachEvents() ;
			},this) ;
		}
	},
	attachEvents: function() {
		var me=this,
			el = this.getEl(),
			btnLinkEl = el.down('.op5-spec-rsiveo-emailheader-action-btn-link'),
			btnAttachmentsEl = el.down('.op5-spec-rsiveo-emailheader-action-btn-attachments') ;
		
		if( btnLinkEl ) {
			btnLinkEl.un('click',me.onClickBtn,me) ;
			btnLinkEl.on('click',me.onClickBtn,me) ;
		}
		if( btnAttachmentsEl ) {
			btnAttachmentsEl.un('click',me.onClickBtn,me) ;
			btnAttachmentsEl.on('click',me.onClickBtn,me) ;
		}
	},
	onClickBtn: function(event,htmlElement) {
		var el = Ext.get(htmlElement) ;
		if( el && el.hasCls('op5-spec-rsiveo-emailheader-action-btn-link') ) {
			this.fireEvent('emailaction',this,'link') ;
		}
		if( el && el.hasCls('op5-spec-rsiveo-emailheader-action-btn-attachments') ) {
			this.fireEvent('emailaction',this,'attachments') ;
		}
	},
	
	onDestroy: function() {
		
	}
}) ;

Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailMessagePanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.EmailMessageLinkPanel'],
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: []
		});
		
		this.callParent() ;
		if( this._emailFilerecordId ) {
			this.loadEmailRecord(this._emailFilerecordId,null) ;
		}
		if( this._tmpMediaId ) {
			this.loadEmailRecord(null, this._tmpMediaId) ;
		}
	},
	loadEmailRecord: function( emailFilerecordId, tmpMediaId ) {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_getEmailRecord',
				email_filerecord_id: emailFilerecordId,
				tmp_media_id: tmpMediaId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				/*
				this.down('#pEast').removeAll();
				this.down('#pEast').setTitle( ajaxResponse.subject ) ;
				this.down('#pEast').add(Ext.create('Ext.ux.dams.IFrameContent',{
					itemId: 'uxIFrame',
					content:ajaxResponse.html
				})) ;
				this.down('#pEast').expand() ;
				*/
				
				var emailRecord = Ext.ux.dams.ModelManager.create('RsiRecouveoEmailModel',ajaxResponse.data) ;
				this.setEmailRecord(emailRecord) ;
			},
			scope: this
		});
	},
	setEmailRecord: function( emailRecord ) {
		this._emailRecord = emailRecord ;
		this.setTitle( emailRecord.get('subject') ) ;
		var headerData = {
			adr_from: [],
			adr_to: [],
			adr_cc: [],
			//subject: emailRecord.get('subject'),
			date_str: Ext.Date.format( emailRecord.get('date'),'d/m/Y H:i'),
			action_link: true,
			action_attachments: (emailRecord.attachments().getCount()>0)
		} ;
		emailRecord.header_adrs().each( function(adr) {
			switch( adr.get('header') ) {
				case 'from' :
					headerData['adr_from'].push( adr.get('adr_display') ) ;
					break ;
				case 'to' :
					headerData['adr_to'].push( adr.get('adr_display') ) ;
					break ;
				case 'cc' :
					headerData['adr_cc'].push( adr.get('adr_display') ) ;
					break ;
				default :
					return ;
			}
		}) ;
		
		var bodyHtml = emailRecord.get('body_html') ;
		if( Ext.isEmpty(bodyHtml) ) {
			bodyHtml = emailRecord.get('body_text') ;
			bodyHtml = Ext.String.htmlEncode(bodyHtml) ;
			bodyHtml = Ext.util.Format.nl2br(bodyHtml) ;
			bodyHtml = '<font face="Monospace">'+bodyHtml+'</font>' ;
		}
		
		this.removeAll() ;
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailMessageHeaderComponent',{
			//height: 100,
			data: headerData,
			listeners: {
				emailaction: this.onEmailAction,
				scope: this
			}
		}),Ext.create('Ext.ux.dams.IFrameContent',{
			itemId: 'iframeBody',
			flex: 1,
			content: bodyHtml
		})) ;
	},
	onEmailAction: function(cmp,action) {
		switch( action ) {
			case 'link' :
				this.openLinkActionPopup() ;
				break ;
			case 'attachments' :
				this.openAttachmentsPanel() ;
				break ;
		}
	},
	openAttachmentsPanel: function() {
		var attachmentsData = this._emailRecord.getData(true)['attachments'] ;
		
		var attachmentsPanel = Ext.create('Ext.grid.Panel',{
			width: 300,
			height: 300,
			title: 'Pièces jointes',
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			columns: [{
				flex: 1,
				text: 'Fichier',
				dataIndex: 'filename'
			},{
				align: 'center',
				xtype:'actioncolumn',
				width:28,
				disabledCls: 'x-item-invisible',
				items: [{
					iconCls: 'op5-spec-rsiveo-datatoolbar-file-export-excel',
					tooltip: 'Télécharger',
					handler: function(grid, rowIndex, colIndex, item, e) {
						var rec = grid.getStore().getAt(rowIndex),
							attachmentIdx = rec.get('multipart_attachment_idx') ;
						this.handleDownloadAttachment(attachmentIdx) ;
					},
					scope: this
				}]
			}],
			store: {
				model: 'RsiRecouveoEmailAttachmentDescModel',
				data: attachmentsData
			}
		}) ;
		Ext.create('Ext.menu.Menu', {
			listeners: {
				hide: {
					fn: function(menu) {
						menu.destroy();
					}
				}
			},
			defaults: {
				clickHideDelay: 1  
			},
			items: attachmentsPanel
		}).showBy(this.down('#iframeBody'), 'tr-tr');
	},
	handleDownloadAttachment: function(attachmentIdx) {
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'mail_downloadEmailAttachment',
			email_filerecord_id: this._emailRecord.get('email_filerecord_id'),
			tmp_media_id: this._emailRecord.get('tmp_media_id'),
			multipart_attachment_idx: attachmentIdx
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	openLinkActionPopup: function() {
		if( this._emailRecord.get('email_filerecord_id') > 0 ) {} else {
			return ;
		}
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailMessageLinkPanel',{
			_emailFilerecordId: this._emailRecord.get('email_filerecord_id'),
			
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		createPanel.on('saved', function(p) {
			this.fireEvent('saved',this) ;
			this.destroy() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.createPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.createPanel = createPanel ;
	},
	onDestroy: function() {
		if( this.attachmentsPanel ) {
			this.attachmentsPanel.destroy() ;
		}
		if( this.createPanel ) {
			this.createPanel.destroy() ;
		}
	}
}) ;











