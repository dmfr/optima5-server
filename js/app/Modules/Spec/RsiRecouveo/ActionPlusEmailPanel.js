Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailOutDestField',{
	extend: 'Ext.form.FieldContainer',
	
	mixins: [
		'Ext.form.field.Field'
	],

	_comboboxData: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				itemId: 'cmbAdd',
				xtype: 'combobox',
				width: 175,
				forceSelection: false,
				editable: true,
				queryMode: 'local',
				displayField: 'mail',
				valueField: 'mail',
				store: {
					data: this._comboboxData,
					fields: [{name:'nom', type:'string'}, {name: 'mail', type: 'string'}]
				},
				matchFieldWidth: false,
				listConfig: {
					width: 250,
					getInnerTpl: function(displayField) {
						return '<div style="padding-bottom:6px"><div>{nom}</div><div style="text:10px">Mail&#160;:&#160;{mail}</div></div>' ;
					}
				}
			},{
				itemId: 'btnAdd',
				xtype: 'button',
				iconCls: 'op5-spec-rsiveo-emailheadertags-btn',
				margin: {
					left: 4,
					right: 8
				},
				handler: function() {
					this.handleAdd() ;
				},
				scope: this
			},{
				itemId: 'dvTags',
				xtype: 'dataview',
				cls: 'op5-spec-rsiveo-emailheadertags-field',
				tpl: [
					'<tpl for=".">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-icodelete">',
							'</div>',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{tag}',
							'</div>',
						'</div>',
					'</tpl>'
				],
				itemSelector: 'div.op5-spec-rsiveo-emailheadertags',
				store: {
					data: [],
					fields: [{name:'mail', type:'string'}],

				},
				prepareData: function(data) {
					return data;
				},
				listeners: {
					itemclick: function(dv, record, item, index, e, eOpts) {
						if( e.getTarget('div.op5-spec-rsiveo-emailheadertags-icodelete') ) {
							this.deleteTag(record) ;
						}
					},
					scope: this
					
				}
			}]
		}) ;
		me.mixins.field.constructor.call(me);
		
		me.callParent() ;
	},
	getStore: function() {
		return this.down('#dvTags').getStore() ;
	},
	getRawValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return Ext.JSON.encode(values) ;
	},
	getValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return values ;
	},
	setRawValue: function(jsonValues) {
		if( Ext.isEmpty(jsonValues) ) {
			this.getStore().removeAll() ;
		}
		var values = Ext.JSON.decode( jsonValues ),
			data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	setValue: function(values) {
		if( Ext.isEmpty(values) ) {
			this.getStore().removeAll() ;
		}
		var data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	handleAdd: function() {
		var cmbAdd = this.down('#cmbAdd'),
			dvTags = this.down('#dvTags') ; 
		if( Ext.isEmpty(cmbAdd.getValue()) ) {
			return ;
		}
		var ereg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
		if( !ereg.test(cmbAdd.getValue()) ) {
			cmbAdd.markInvalid('Email invalide') ;
			return ;
		}

		var test = dvTags.getStore().findExact('tag',cmbAdd.getValue(),0);

		if (test == -1){
			dvTags.getStore().insert(0,{
			tag: cmbAdd.getValue().trim()
			});
			cmbAdd.reset() ;			
		}
		if( dvTags.getHeight() > this.getHeight() ) {
			this.setHeight(dvTags.getHeight()) ;
		}
		this.updateLayout() ;
	},
	deleteTag: function(tagRecord) {
		this.down('#dvTags').getStore().remove(tagRecord) ;
	}
});



Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel',{
	extend:'Ext.form.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldButton'],
	
	_fileRecord: null,
	
	initComponent: function() {
/*
		var lstMail = Ext.create('Ext.data.Store', {
			alias: 'store.mailListe',
			model: 'RsiRecouveoComboModel',
			data: [],
			autoload: true
		});
*/
		//	var voila = this._accountRecord.get('adrbook').get('adr_entity');
		var tableau = [];
		this._accountRecord.adrbook().each( function( adrbook ) {
			adrbook.adrbookentries().each( function(adrbookentries) {

				if (adrbookentries.get('adr_type') == 'EMAIL' && adrbookentries.get('status_is_invalid') == false){

					tableau.push({"nom": adrbook.get('adr_entity'), "mail": adrbookentries.get('adr_txt')});
					//emails.add({'nom': adrbook.get('adr_entity'), 'email' : adrbookentries.get('adr_txt')});
					
				}
				
			},this) ;
		},this) ;

		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{	
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 100
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Email sortant</b>'
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsAdrMail',
				title: 'Email',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'container',
					flex: 1,
					layout: 'anchor',
					defaults: {
						anchor: '100%',
						labelWidth: 100
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'EMAIL',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'email_from',
						allowBlank: false,
						fieldLabel: 'Expéditeur',
						anchor: '75%'
					}),
						Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailOutDestField', {
							_comboboxData: tableau,
							fieldLabel: 'Destinataire',
							name: 'email_to'
					}),
						Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailOutDestField', {
							_comboboxData: tableau,
							fieldLabel: 'Copie à',
							name: 'email_cc'
					}),{
						xtype: 'fieldcontainer',
						layout: 'hbox',
						fieldLabel: 'Objet',
						items: [{
							flex: 1, 
							xtype: 'textfield',
							name: 'email_subject'
						},{
							xtype: 'box',
							width: 16
						},{
							xtype: 'checkboxfield',
							boxLabel: 'Ajouter entête',
							value: true,
							name: 'email_outmodel_preprocess_banner'
						}]
					}]
				},{
					xtype: 'box',
					width: 16
				},	{
					xtype: 'container',
					width: 72,
					layout: {
						type: 'hbox',
						align: 'center'
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldButton',{
						name: 'email_attachments',
						optimaModule: this.optimaModule,
						renderTarget: this._actionForm.getEl()
					})]
				}]
			},{
				xtype: 'htmleditor',
				enableColors: true,
				enableAlignements: true,
				name: 'email_body',
				height: 250
			}]
		}) ;
		
		this.callParent() ;
	},
	
	setFromSoc: function(socId) {
		var emailFrom = null ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getEmailAll(), function(emailAccountRow) {
			if( emailAccountRow.link_is_default && Ext.isArray(emailAccountRow.link_SOC) && Ext.Array.contains(emailAccountRow.link_SOC,socId) ) {
				emailFrom = emailAccountRow.email_adr ;
				return false ;
			}
		}) ;
		if( emailFrom != null ) {
			this.getForm().findField('email_from').setValue(emailFrom) ;
		}
	},
	
	loadEmailForReuse: function( origEmailFilerecordId, reuseAction='freply') {
		if( !this.rendered ) {
			this.on('afterrender',function() {
				this.loadEmailForReply(origEmailFilerecordId,reuseAction) ;
			},this,{single:true}) ;
		}
		this.getEl().mask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_getEmailRecord',
				email_filerecord_id: origEmailFilerecordId
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
				this.onLoadEmailForReuse(emailRecord,reuseAction) ;
			},
			callback: function() {
				this.getEl().unmask() ;
			},
			scope: this
		});
	},
	onLoadEmailForReuse: function( origEmailRecord, reuseAction ) {
		var cfgEmailAdrs = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getEmailAll(), function(emailAccountRow) {
			cfgEmailAdrs.push(emailAccountRow.email_adr) ;
		}) ;
		var setEmailFrom,
			setEmailTo,
			setEmailCcArr = [],
			subjectPrefix = '' ;
		switch( reuseAction ) {
			case 'reply' :
			case 'reply_all' :
				subjectPrefix = 'Re' ;
				origEmailRecord.header_adrs().each( function(rec) {
					if( !setEmailFrom && Ext.Array.contains(['to','cc'],rec.get('header')) && Ext.Array.contains(cfgEmailAdrs,rec.get('adr_address')) ) {
						setEmailFrom = rec.get('adr_address') ;
						return ;
					}
					if( Ext.Array.contains(['from'],rec.get('header')) ) {
						setEmailTo = rec.get('adr_address') ;
					}
				}) ;
				
				if( reuseAction=='reply_all' ) {
					origEmailRecord.header_adrs().each( function(rec) {
						if( Ext.Array.contains(['cc','to'], rec.get('header')) && !Ext.Array.contains([setEmailFrom,setEmailTo],rec.get('adr_address')) ) {
							setEmailCcArr.push(rec.get('adr_address')) ;
						}
					}) ;
				}
				
				break ;
				
			case 'transfer' :
				subjectPrefix = 'Tr' ;
				origEmailRecord.header_adrs().each( function(rec) {
					if( !setEmailFrom && Ext.Array.contains(['to','cc'],rec.get('header')) && Ext.Array.contains(cfgEmailAdrs,rec.get('adr_address')) ) {
						setEmailFrom = rec.get('adr_address') ;
						return ;
					}
				}) ;
				break ;
		}

		var bodyHtml = origEmailRecord.get('body_html') ;
		if( Ext.isEmpty(bodyHtml) ) {
			bodyHtml = origEmailRecord.get('body_text') ;
			bodyHtml = Ext.String.htmlEncode(bodyHtml) ;
			bodyHtml = Ext.util.Format.nl2br(bodyHtml) ;
			bodyHtml = '<font face="Monospace">'+bodyHtml+'</font>' ;
		}
		bodyHtml = '<blockquote style="margin-left: 8px; border-left: 4px solid #00C; padding-left: 4px">' + bodyHtml + '</blockquote>' ;
		bodyHtml = '<br><br>' + bodyHtml ;
		// Fill form fields 
		var formData = {} ;
		if( setEmailFrom ) {
			formData['email_from'] = setEmailFrom ;
		}
		if( setEmailTo ) {
			formData['email_to'] = [setEmailTo] ;
		}
		if( setEmailCcArr.length > 0 ) {
			formData['email_cc'] = setEmailCcArr ;
		}
		formData['email_subject'] = subjectPrefix + ': ' + origEmailRecord.get('subject') ;
		formData['email_body'] = bodyHtml.replace(/(\r\n|\n|\r)/gm, "") ;
		this._actionForm.getForm().setValues(formData) ;
		
		if( reuseAction=='transfer' ) {
			var emailAttachmentsField = this._actionForm.getForm().findField('email_attachments') ;
			emailAttachmentsField.doImportFromReuse( origEmailRecord.get('email_filerecord_id') ) ;
		}
		
	},
	
	checkEmailSendable: function() {
		// Ajout To / CC 
		this.getForm().findField('email_to').handleAdd();
		this.getForm().findField('email_cc').handleAdd();
		
		var formValues = this.getForm().getValues(false,false,false,true) ;
		var errors = [] ;
		if( Ext.isEmpty(formValues['email_from']) ) {
			var error = 'Email : adr. source non spécifiée' ;
			errors.push(error) ;
			this.getForm().findField('email_from').markInvalid(error) ;
		}
		if( Ext.isEmpty(formValues['email_to']) ) {
			var error = 'Email : aucun destinataire valide' ;
			errors.push(error) ;
		}
		if( Ext.isEmpty(formValues['email_subject']) ) {
			var error = 'Email : sujet non saisi' ;
			errors.push(error) ;
			this.getForm().findField('email_subject').markInvalid(error) ;
		}
		if( errors.length==0 ) {
			return true ;
		}
		return errors ;
	},
	
	statics: {
		createEmailRecord: function(formValues) {
			var emailRecordData = {} ;
			
			emailRecordData['header_adrs'] = [] ;
			// FROM
			Ext.Array.each(formValues['email_from'], function(emailAdr) {
				var adrDisplay = emailAdr ;
				Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getEmailAll(), function(emailAccountRow) {
					if( emailAccountRow.email_adr==emailAdr ) {
						adrDisplay = emailAccountRow.email_name ;
					}
				}) ;
				emailRecordData['header_adrs'].push({
					header: 'from',
					adr_display: adrDisplay,
					adr_address: emailAdr
				}) ;
			}) ;
			// TO + CC
			Ext.Array.each(['to','cc'], function(headerType) {
				var formKey = 'email_'+headerType ;
				if( !formValues[formKey] ) {
					return ;
				}
				Ext.Array.each(formValues[formKey], function(emailAdr) {
					emailRecordData['header_adrs'].push({
						header: headerType,
						adr_display: emailAdr,
						adr_address: emailAdr
					}) ;
				}) ;
			});
			// Data
			emailRecordData['body_html'] = formValues.email_body ;
			emailRecordData['subject'] = formValues.email_subject;
			emailRecordData['outmodel_preprocess_banner'] = formValues.email_outmodel_preprocess_banner ;
			emailRecordData['outmodel_preprocess_signature'] = true ;
			emailRecordData['outmodel_preprocess_subject'] = true ;
			emailRecordData['outmodel_file_filerecord_id'] = formValues.file_filerecord_id ;
			
			// Attachments
			emailRecordData['attachments'] = [] ;
			if( Ext.isArray(formValues['email_attachments']) ) {
				Ext.Array.each(formValues['email_attachments'], function(media) {
					emailRecordData['attachments'].push({
						filename: media.name,
						outmodel_tmp_media_id: media.tmpMediaId
					}) ;
				}) ;
			}
			
			var emailRecord = Ext.ux.dams.ModelManager.create('RsiRecouveoEmailModel',Ext.clone(emailRecordData)) ;
			return emailRecord ;
		}
	}

}) ;
