Ext.define('Optima5.Modules.Spec.RsiRecouveo.InboxPanel',{
	extend:'Ext.window.Window',
	
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
			items:[{
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
					xtype: 'hiddenfield',
					name: '_has_upload'
				},{
					xtype:'fieldset',
					itemId: 'fsSession',
					hidden: true,
					title: 'Session de saisie',
					defaults: {
						listeners: {
							change: function(field) {
								this.onSessionParams() ;
							},
							scope: this
						}
					},
					items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'OPT_MAILIN',
						cfgParam_emptyDisplayText: 'Type courrier',
						optimaModule: this.optimaModule,
						name: 'opt_mailin',
						allowBlank: false,
						fieldLabel: 'Type courrier'
					}),{
						xtype: 'datefield',
						format: 'Y-m-d',
						fieldLabel: 'Date de réception',
						name: 'date_recep'
					}]
				},{
					xtype:'fieldset',
					hidden: true,
					itemId: 'fsDocInput',
					title: '<div class="op5-spec-rsiveo-closeheader-wrap" style="position:relative">'
						+ '<div class="op5-spec-rsiveo-closeheader-btn">'
						+ '</div>'
						+ '&#160;&#160;&#160;Saisie pli'
						+ '</div>',
					listeners: {
						afterrender: function(cmp) {
							var headerEl = cmp.getEl(),
								btnCloseEl = headerEl.down('.op5-spec-rsiveo-closeheader-btn') ;
							btnCloseEl.on('click',function() {
								this.onSessionParams() ;
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
						xtype: 'textfield',
						name: 'env_search',
						fieldLabel: 'Ref.enveloppe',
						enableKeyEvents: true,
						listeners: {
							specialkey: function(textfield,event) {
								if(event.getKey() == event.ENTER) {
									event.stopEvent() ;
									textfield.fireEvent('select',textfield,textfield.getValue()) ;
								}
							},
							select: this.onEnvSearchSelect,
							scope: this
						}
					},{
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
						name: 'display_env_ref',
						fieldLabel: 'Ref.enveloppe',
						fieldCls:'op5-spec-rsiveo-boldtext'
					},{
						xtype: 'hiddenfield',
						name: 'ref_account'
					},{
						xtype: 'hiddenfield',
						name: 'ref_mailout'
					},{
						xtype: 'filefield',
						emptyText: 'Choisir fichier local',
						fieldLabel: 'Fichier',
						name: 'doc_src',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						},
					},{
						xtype: 'fieldcontainer',
						itemId: 'cntSubmit',
						layout: {
							type: 'hbox',
							pack: 'center'
						},
						items: [{
							xtype: 'button',
							text: 'Valider ?',
							itemId: 'submitBtn',
							handler: function() {
								this.handleSubmit() ;
							},
							scope: this
						}]
					}]
				}]
			}]
		});
		
		this.callParent() ;
		this.resetForm() ;
		
		this.on('afterrender',function(thisForm, options){
			this.keyNav = Ext.create('Ext.util.KeyNav', this.el, {
				enter: function() {
					this.handleSubmit() ;
				},
				scope: this
			});
		}) ;
	},
	resetForm: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
			  
		formPanel.down('#fsSession').setVisible(true);
		formPanel.down('#fsDocInput').setVisible(false);
		formPanel.down('#cntSubmit').setVisible(false);
	},
	onSessionParams: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm(),
			values = form.getFieldValues() ;
		
		var optMailInData = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptData('OPT_MAILIN'),
			optMailInRow = null ;
		Ext.Array.each( optMailInData, function(row) {
			if( row['id'] == values['opt_mailin'] ) {
				optMailInRow = row ;
			}
		}) ;
		
		var fsDocInput = formPanel.down('#fsDocInput') ;
		fsDocInput.setVisible(false) ;
		Ext.Array.each( fsDocInput.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		}); 
		
		var goMode = null ;
		form.findField('_has_upload').setValue(0) ;
		if( optMailInRow && values['date_recep'] ) {
			if( optMailInRow['parent'] == 'NOK' ) {
				fsDocInput.setVisible(true) ;
				form.findField('env_search').setVisible(true) ;
				form.findField('env_search').focus() ;
			}
			if( optMailInRow['id'] == 'MAIL_OK' ) {
				fsDocInput.setVisible(true) ;
				form.findField('acc_search').setVisible(true) ;
				form.findField('_has_upload').setValue(1) ;
			}
		}
		
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
				var setValues = {
					display_acc_soc: accountRow.soc_txt,
					display_acc_id: accountRow.acc_id,
					display_acc_name: accountRow.acc_txt,
					ref_account: accountRow.acc_id
				};
				this.setDocInput(setValues) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onEnvSearchSelect: function(textfield,envref) {
		var envelopeRow = null ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_getEnvGrid',
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				Ext.Array.each( ajaxResponse.data, function(envRow) {
					if( envRow.env_ref == envref ) {
						envelopeRow = envRow ;
					}
				}) ;
				if( !envelopeRow ) {
					var formPanel = this.down('form'),
						form = this.down('form').getForm() ;
					form.findField('env_search').markInvalid('Courrier non reconnu') ;
					form.findField('env_search').focus() ;
					form.findField('env_search').selectText() ;
					return ;
				}
				this.onEnvSearchFound(envelopeRow) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onEnvSearchFound: function(envelopeRow) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_open',
				acc_id: envelopeRow.recep_ref
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				var accountRow = ajaxResponse.data ;
				var setValues = {
					display_acc_soc: accountRow.soc_txt,
					display_acc_id: accountRow.acc_id,
					display_acc_name: accountRow.acc_txt,
					display_env_ref: envelopeRow.env_ref,
					ref_account: accountRow.acc_id,
					ref_mailout: envelopeRow.env_ref
				};
				this.setDocInput(setValues) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	setDocInput: function(formValues) {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
			  
		var fsDocInput = formPanel.down('#fsDocInput') ;
		fsDocInput.setVisible(true) ;
		Ext.Array.each( fsDocInput.query('field'), function(field) {
			field.reset() ;
			field.setVisible(false) ;
		});
		
		Ext.Object.each(formValues, function(k,v) {
			var field = form.findField(k) ;
			if( !field ) {
				return ;
			}
			field.setValue(v) ;
			if( field.getName().indexOf('display_')===0 ) {
				field.setVisible(true) ;
			}
		}) ;
		
		form.findField('doc_src').reset() ;
		form.findField('doc_src').setVisible( form.findField('_has_upload').getValue() == 1 ) ;
		form.findField('doc_src').allowBlank = !(form.findField('_has_upload').getValue() == 1) ;
		
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
			var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_postInbox'
			}) ;
			form.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					this.down('#submitBtn').setVisible(false) ;
					this.down('#cntSubmit').add({
						xtype: 'button',
						itemId: 'validateBtn',
						text: 'Validé',
						icon: 'images/modules/rsiveo-greenTick-16.gif'
					})
					Ext.Function.defer(function(){
						this.onSessionParams() ;
						this.down('#validateBtn').setVisible(false) ;
						this.down('#submitBtn').setVisible(true) ;
					}, 2010, this) ;
				},
				failure: function(form, action) {
					this.hideLoadmask() ;
					var msg = 'Erreur' ;
					if( action.response.responseText ) {
						msg = Ext.JSON.decode(action.response.responseText).error ;
					}
					Ext.Msg.alert('Erreur',msg) ;
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
