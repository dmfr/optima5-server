Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailMessageLinkPanel',{
	extend:'Ext.panel.Panel',
	
	initCloseFieldsetCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-dbslam-closeheader',
			html: [
				'<div class="op5-spec-dbslam-closeheader-wrap" style="position:relative">',
					'<div class="op5-spec-dbslam-closeheader-btn">',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			height: 500,
			width: 400,
			items:[]
		});
		
		this.callParent() ;
		if( this._emailFilerecordId ) {
			this.loadEmailRecord(this._emailFilerecordId) ;
		}
	},
	loadEmailRecord: function(emailFilerecordId) {
		this._emailRecord = null ;
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
				email_filerecord_id: emailFilerecordId
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
		if( !emailRecord.get('link_is_on') ) {
			this.buildInputForm(emailRecord) ;
		} else {
			this.buildUnlinkForm(emailRecord) ;
			this.displayLink(emailRecord) ;
		}
	},
	
	
	buildInputForm: function() {
		this.removeAll() ;
		this.add([{
			border: false,
			flex:1,
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 15,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 120,
				anchor: '100%'
			},
			items:[{
				height: 24,
				xtype: 'component',
				tpl: [
					/*
					'<div class="op5-spec-dbslam-livelogo">',
						'<span>{title}</span>',
						'<div class="op5-spec-dbslam-livelogo-left"></div>',
						'<div class="op5-spec-dbslam-livelogo-right"></div>',
					'</div>'
					*/
				],
				data: {title: '&#160;'}
			},{
				xtype:'fieldset',
				itemId: 'cntAccount',
				title: '<div class="op5-spec-rsiveo-closeheader-wrap" style="position:relative">'
					+ '<div class="op5-spec-rsiveo-closeheader-btn">'
					+ '</div>'
					+ '&#160;&#160;&#160;Recherche Compte'
					+ '</div>',
				listeners: {
					afterrender: function(cmp) {
						var headerEl = cmp.getEl(),
							btnCloseEl = headerEl.down('.op5-spec-rsiveo-closeheader-btn') ;
						btnCloseEl.on('click',function() {
							this.buildInputForm() ;
						},this) ;
					},
					scope: this
				},
				items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.SearchCombo',{
					optimaModule: this.optimaModule,
					
					fieldLabel: 'Compte débiteur',
					name: 'acc_search',
					hidden: true,
					
					itemId: 'btnSearch',
					width: 150,
					listeners: {
						select: this.onAccSearchSelect,
						scope: this
					}
				}),{
					xtype: 'displayfield',
					name: 'display_acc_soc',
					fieldLabel: 'Entité',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'displayfield',
					name: 'display_acc_id',
					fieldLabel: 'Compte',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'displayfield',
					name: 'display_acc_name',
					fieldLabel: 'Débiteur',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'hiddenfield',
					name: 'ref_account'
				}]
			},{
				xtype:'fieldset',
				itemId: 'cntFile',
				title: 'Dossier cible',
				items: [{
					xtype: 'combobox',
					name: 'file_select',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['file_filerecord_id','file_desc'],
						data : []
					},
					queryMode: 'local',
					displayField: 'file_desc',
					valueField: 'file_filerecord_id'
				}]
			},{
				xtype:'fieldset',
				itemId: 'cntAdrbook',
				title: 'Enregistrement du contact',
				items: [{
					xtype: 'combobox',
					name: 'adrbook_entity_select',
					fieldLabel: 'Nom du contact',
					forceSelection: false,
					editable: true,
					store: {
						fields: ['adr_entity'],
						data : []
					},
					queryMode: 'local',
					displayField: 'adr_entity',
					valueField: 'adr_entity'
				}]
			},{
				xtype: 'fieldcontainer',
				padding: '24px 24px',
				itemId: 'cntSubmit',
				layout: {
					type: 'hbox',
					pack: 'center'
				},
				items: [{
					xtype: 'button',
					text: 'Associer',
					handler: function() {
						this.handleSubmit() ;
					},
					scope: this
				}]
			}]
		}]) ;
		
		var formPanel = this.down('form'),
			form = formPanel.getForm() ;
		var cntAccount = formPanel.down('#cntAccount') ;
		cntAccount.setVisible(false) ;
		Ext.Array.each( cntAccount.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		});
		form.findField('acc_search').setVisible(true) ;
		cntAccount.setVisible(true) ;
		
		formPanel.down('#cntFile').setVisible(false);
		formPanel.down('#cntAdrbook').setVisible(false);
		formPanel.down('#cntSubmit').setVisible(false);
	},
	

	onAccSearchSelect: function(searchcombo,selrec) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_open',
				acc_id: selrec.get('acc_id')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				var accountRow = ajaxResponse.data ;
				this.setAccount(accountRow) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	setAccount: function(accountRow) {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
			  
		// *** #cntAccount *** 
		var cntAccount = formPanel.down('#cntAccount') ;
		cntAccount.setVisible(true) ;
		Ext.Array.each( cntAccount.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		});
		
		var setValues = {
			display_acc_soc: accountRow.soc_txt,
			display_acc_id: accountRow.acc_id,
			display_acc_name: accountRow.acc_txt,
			ref_account: accountRow.acc_id
		};
		Ext.Object.each(setValues, function(k,v) {
			var field = form.findField(k) ;
			if( !field ) {
				return ;
			}
			field.setValue(v) ;
			if( field.getName().indexOf('display_')===0 ) {
				field.setVisible(true) ;
			}
		}) ;
		// ************************
		
		
		
		
		
		// ******** cntFile **********
		var filesData = [] ;
		Ext.Array.each( accountRow.files, function(fileRow) {
			if( fileRow.status_closed_void || fileRow.status_closed_end ) {
				return ;
			}
			if( Ext.isEmpty(fileRow.file_filerecord_id) || fileRow.file_filerecord_id == 0 ) {
				return ;
			}
			var text = fileRow.status_txt + '(' + Ext.Date.format(Ext.Date.parse(fileRow.date_open,'Y-m-d H:i:s'),'d/m/Y') + ')' + ' / ' + Math.round(fileRow.inv_amount_due) + ' €' ;
			filesData.push({
				file_filerecord_id: fileRow.file_filerecord_id,
				file_desc: text
			});
		}) ;
		form.findField('file_select').getStore().loadData(filesData) ;
		if( filesData.length==1 ) {
			form.findField('file_select').setValue( filesData[0]['file_filerecord_id'] ) ;
		}
		form.findField('file_select').allowBlank = !(filesData.length>0) ;
		formPanel.down('#cntFile').setVisible(true);
		// ******************************
		
		
		// ******** cntAdrbook *************
		var adrbookData = [],
			preselect = null ;
		Ext.Array.each( accountRow.adrbook, function(adrbookRow) {
			adrbookData.push({adr_entity: adrbookRow.adr_entity}) ;
			Ext.Array.each( adrbookRow.adrbookentries, function(adrbookentryRow) {
				if( adrbookentryRow.adr_type=='EMAIL' && adrbookentryRow.adr_txt==this._emailRecord.getFromAddress() ) {
					preselect = adrbookRow.adr_entity ;
				}
			},this);
		},this);
		form.findField('adrbook_entity_select').getStore().loadData(adrbookData) ;
		if( preselect ) {
			form.findField('adrbook_entity_select').setValue( preselect ) ;
		}
		formPanel.down('#cntAdrbook').setVisible(true);
		// ***********************************
			  
			  
		formPanel.down('#cntAdrbook').setVisible(true);
		
		
		formPanel.down('#cntSubmit').setVisible(true);
		this.focus() ;
	},
	handleSubmit: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
		if( !formPanel.down('#cntSubmit').isVisible() ) {
			return ;
		}
		if(form.isValid()){
			this.showLoadmask() ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'mail_associateFile',
					email_filerecord_id: this._emailRecord.getId(),
					data: Ext.JSON.encode( form.getFieldValues() )
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						var msg = 'Erreur' ;
						if( ajaxResponse.error ) {
							msg = ajaxResponse.error ;
						}
						Ext.MessageBox.alert('Error',msg) ;
						return ;
					}
					this.fireEvent('saved',this) ;
					this.destroy() ;
				},
				callback: function() {
					this.hideLoadmask() ;
				},
				scope: this
			});
		}
	},
	
	
	
	
	
	
	
	buildUnlinkForm: function() {
		this.removeAll() ;
		this.add([{
			border: false,
			flex:1,
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 15,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 120,
				anchor: '100%'
			},
			items:[{
				height: 24,
				xtype: 'component',
				tpl: [
					/*
					'<div class="op5-spec-dbslam-livelogo">',
						'<span>{title}</span>',
						'<div class="op5-spec-dbslam-livelogo-left"></div>',
						'<div class="op5-spec-dbslam-livelogo-right"></div>',
					'</div>'
					*/
				],
				data: {title: '&#160;'}
			},{
				xtype:'fieldset',
				itemId: 'cntDisplay',
				title: 'Données associées',
				items:[{
					xtype: 'displayfield',
					name: 'display_acc_soc',
					fieldLabel: 'Entité',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'displayfield',
					name: 'display_acc_id',
					fieldLabel: 'Compte',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'displayfield',
					name: 'display_acc_name',
					fieldLabel: 'Débiteur',
					fieldCls:'op5-spec-rsiveo-boldtext'
				},{
					xtype: 'displayfield',
					name: 'display_file_ref',
					fieldLabel: 'Dossier',
					fieldCls:'op5-spec-rsiveo-boldtext'
				}]
			},{
				xtype: 'fieldcontainer',
				padding: '24px 24px',
				itemId: 'cntSubmit',
				layout: {
					type: 'hbox',
					pack: 'center'
				},
				items: [{
					xtype:'button',
					text: 'Annuler<br>Association',
					icon: 'images/op5img/ico_delete_16.gif',
					listeners: {
						click: function() {
							this.handleUnlink() ;
						},
						scope: this
					},
					iconAlign: 'top',
					width: 115,
					padding: 10
				}]
			}]
		}]) ;
		
		var formPanel = this.down('form'),
			form = formPanel.getForm() ;
		var cntDisplay = formPanel.down('#cntDisplay') ;
		cntDisplay.setVisible(false) ;
		Ext.Array.each( cntDisplay.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		});
		cntDisplay.setVisible(true) ;
		
		formPanel.down('#cntSubmit').setVisible(false);
	},
	displayLink: function(emailRecord) {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
			  
		// *** cntDisplay *** 
		var cntDisplay = formPanel.down('#cntDisplay') ;
		cntDisplay.setVisible(true) ;
		Ext.Array.each( cntDisplay.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		});
		
		var setValues = {
			display_acc_soc: emailRecord.get('link_soc_txt'),
			display_acc_id: emailRecord.get('link_account'),
			display_acc_name: emailRecord.get('link_account_txt'),
			display_file_ref: emailRecord.get('link_file_ref')
		};
		Ext.Object.each(setValues, function(k,v) {
			var field = form.findField(k) ;
			if( !field ) {
				return ;
			}
			field.setValue(v) ;
			if( field.getName().indexOf('display_')===0 ) {
				field.setVisible(true) ;
			}
		}) ;
		// ************************
		
		formPanel.down('#cntSubmit').setVisible(true);
		this.focus() ;
	},
	handleUnlink: function(confirmed) {
		if( !confirmed ) {
			Ext.MessageBox.confirm('Confirmation','Annuler l\'association ?', function(btn) {
				if( btn =='yes' ) {
					this.handleUnlink(true) ;
				}
			},this) ;
			return ;
		}
		if(confirmed){
			this.showLoadmask() ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'mail_associateCancel',
					email_filerecord_id: this._emailRecord.getId()
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						var msg = 'Erreur' ;
						if( ajaxResponse.error ) {
							msg = ajaxResponse.error ;
						}
						Ext.MessageBox.alert('Error',msg) ;
						return ;
					}
					this.fireEvent('saved',this) ;
					this.destroy() ;
				},
				callback: function() {
					this.hideLoadmask() ;
				},
				scope: this
			});
		}
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
	}
}) ;
