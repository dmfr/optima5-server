Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailAutoPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusSmsOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusTchatPanel',

		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusTrsfrFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusJudicFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusLitigFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusClosePanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.SmsPreviewPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 850,
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [],
			buttons: [{
				itemId: 'btnOk',
				hidden: true,
				xtype: 'button',
				text: 'OK',
				icon: 'images/modules/rsiveo-save-16.gif',
				handler: function( btn ) {
					this.handleSubmitEvent() ;
				},
				scope: this
			},{
				itemId: 'btnPreview',
				hidden: true,
				xtype: 'button',
				text: 'Preview',
				icon: 'images/modules/rsiveo-print-16.png',
				handler: function( btn ) {
					this.handlePreview() ;
				},
				scope: this
			},{
				itemId: 'btnPreviewMulti',
				hidden: true,
				xtype: 'button',
				text: 'Preview',
				icon: 'images/modules/rsiveo-print-16.png',
				menu: [{
					icon: 'images/modules/rsiveo-mail-out-16.png',
					text: 'Courrier postal',
					handler: function( btn ) {
						this.handlePreviewMulti('POSTAL') ;
					},
					scope: this
				},{
					icon: 'images/modules/rsiveo-mail-email-16.png',
					text: 'Email',
					handler: function( btn ) {
						this.handlePreviewMulti('EMAIL') ;
					},
					scope: this
				},{
					icon: 'images/modules/rsiveo-mail-sms-16.png',
					text: 'SMS',
					handler: function( btn ) {
						this.handlePreviewMulti('TEL') ;
					},
					scope: this
				}],
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.startAction( this._accId, this._fileFilerecordId, this._fileActionFilerecordId, this._newActionCode ) ;
		},this) ;
		
		this.on('beforedestroy', this.onBeforeDestroy, this) ;
	},
	
	startAction: function( accId, fileFilerecordId, fileActionFilerecordId, newActionCode ) {
		this._accId = accId ;
		this._fileFilerecordId = fileFilerecordId ;
		this._fileActionFilerecordId = fileActionFilerecordId ;
		this._newActionCode = newActionCode ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_open',
				acc_id: accId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var accountRecord = Ext.ux.dams.ModelManager.create( 
						Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAccountModel(),
						ajaxResponse.data
					),
					fileRecord = accountRecord.files().getById(this._fileFilerecordId) ;

				this.onStartResponse(accountRecord, fileRecord) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onStartResponse: function( accountRecord, fileRecord ) {
		this._accountRecord = accountRecord ;
		this._fileRecord = fileRecord ;
		
		
		var currentAction = this.getCurrentAction() ;
		var hasPreview = hasPreviewMulti = false ;
		var afterValues = {} ;
		if( this.isCurrentActionAuto() ) {
			hasPreviewMulti = true ;
			nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailAutoPanel' ;
		} else {
			switch( currentAction.action_id ) {
				case 'MAIL_AUTO' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailAutoPanel' ;
					hasPreviewMulti = true ;
					break ;
					
				case 'AGREE_FOLLOW' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel' ;
					break ;
				case 'LITIG_FOLLOW' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusLitigFollowPanel' ;
					break ;
				case 'JUDIC_FOLLOW' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusJudicFollowPanel' ;
					break ;
				case 'TRSFR_FOLLOW' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusTrsfrFollowPanel' ;
					break ;
				case 'CLOSE_ACK' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusClosePanel' ;
					break ;
				case 'CALL_IN' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel' ;
					break ;
				case 'CALL_OUT' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel' ;
					break ;
				case 'MAIL_IN' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel' ;
					break ;
				case 'MAIL_OUT' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel' ;
					hasPreview = true ;
					break ;
				case 'SMS_OUT' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusSmsOutPanel' ;
					hasPreview = true ;
					break ;
				case 'BUMP' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel' ;
					break ;
				case 'EMAIL_OUT' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel' ;
					hasPreview = true ;
					break;
				case 'TCHAT_OUT' :
					nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusTchatPanel' ;
					break ;
				default :
					break ;
			}
		}
		if( !nowActionClass ) {
			Ext.MessageBox.alert('Error','Error', function() {
				this.destroy() ;
			}) ;
		}
		
		
		this.add(Ext.create(nowActionClass,{
			itemId: 'formNow',
			border: false,
			
			optimaModule: this.optimaModule,
			
			_accountRecord: this._accountRecord,
			_fileRecord: this._fileRecord,
			_actionForm: this,
			
			listeners: {
				change: this.onFormChange,
				scope: this
			}
		})) ;
		if( !this._fileRecord.statusIsSchedLock() && !this.isCurrentActionAuto() ) {
			this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
				itemId: 'formNext',
				border: false,
				
				optimaModule: this.optimaModule,
				
				_accountRecord: this._accountRecord,
				_fileRecord: this._fileRecord,
				_actionForm: this,
				
				listeners: {
					change: this.onFormChange,
					scope: this
				}
			})) ;
		}
		this.down('#btnOk').setVisible(true) ;
		this.down('#btnPreview').setVisible(hasPreview) ;
		this.down('#btnPreviewMulti').setVisible(hasPreviewMulti) ;
		this.fireEvent('mylayout',this) ;
		
		// Titre
		this.setTitle(currentAction.action_txt) ;
		
		// Données
		var formData = {
			action_txt: currentAction.action_txt,
			action_sched: ( this.getCurrentSched() ? Ext.util.Format.date(this.getCurrentSched(),'d/m/Y') : '' ),
			
			scen_code: this.getActiveScenario(),
			scen_code_blank: Ext.isEmpty(this.getActiveScenario()),
			
			tpl_defer_is_on: false
		};
		if( this._formValues ) {
			if( this._formValues['adrtel_default'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrEntryRec.get('adr_type')=='TEL' && adrEntryRec.get('status_is_priority') ) {
							this._formValues['adrtel_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrtel_entity'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrRec.get('adr_entity')==this._formValues['adrtel_entity'] && adrEntryRec.get('adr_type')=='TEL' ) {
							this._formValues['adrtel_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrtel_filerecord_id'] && this.down('#fsAdrTel') ) {
				this.down('#fsAdrTel').expand() ;
			}
			
			if( this._formValues['adrpost_default'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrEntryRec.get('adr_type')=='POSTAL' && adrEntryRec.get('status_is_priority') ) {
							this._formValues['adrpost_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrpost_entity'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrRec.get('adr_entity')==this._formValues['adrpost_entity'] && adrEntryRec.get('adr_type')=='POSTAL' ) {
							this._formValues['adrpost_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrpost_filerecord_id'] && this.down('#fsAdrPost') ) {
				this.down('#fsAdrPost').expand() ;
			}
			
			if( this._formValues['adrmail_default'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrEntryRec.get('adr_type')=='EMAIL' && adrEntryRec.get('status_is_priority') ) {
							this._formValues['adrmail_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrmail_entity'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					adrRec.adrbookentries().each( function(adrEntryRec) {
						if( adrEntryRec.get('status_is_invalid') ) {
							return ;
						}
						if( adrRec.get('adr_entity')==this._formValues['adrmail_entity'] && adrEntryRec.get('adr_type')=='EMAIL' ) {
							this._formValues['adrmail_filerecord_id'] = adrEntryRec.getId() ;
							return false ;
						}
					},this) ;
				},this) ;
			}
			if( this._formValues['adrmail_filerecord_id'] && this.down('#fsAdrMail') ) {
				this.down('#fsAdrMail').expand() ;
			}
			
			Ext.apply(formData,this._formValues) ;
			
			if( (currentAction.action_id=='EMAIL_OUT') && this._formValues.hasOwnProperty('reuse_emailFilerecordId') ) {
				afterValues['reuse_emailFilerecordId'] = this._formValues['reuse_emailFilerecordId'] ;
				afterValues['reuse_action'] = this._formValues['reuse_action'] ;
			}
			
			this._formValues = null ;
		}
		
		this.getForm().setValues(formData) ;

		if( this.down('#formNow') instanceof Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel ) {
			var actionPlusEmailPanel = this.down('#formNow') ;
			var socId = this._accountRecord.get('soc_id') ;
			actionPlusEmailPanel.setFromSoc( socId ) ;
		}
		if( afterValues['reuse_emailFilerecordId'] && (this.down('#formNow') instanceof Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel)  ) {
			var actionPlusEmailPanel = this.down('#formNow') ;
			actionPlusEmailPanel.loadEmailForReuse( afterValues['reuse_emailFilerecordId'] , afterValues['reuse_action'] ) ;
		}
		
		
		// Gestion du template
		var tplField = this.getForm().findField('tpl_id'),
			tplFieldLang = this.getForm().findField('tpl_lang'),
			tplModes = this.down('#cntTplModes'),
			tplDefer = this.down('#cntTplDefer') ;
		if( tplField ) {
			while(true) {
				if( this.isCurrentActionAuto() ) {
					tplField.getStore().clearFilter();
					tplField.setReadOnly(true) ;
					tplField.setValue( this.getCurrentTpl() ) ;
					if( tplFieldLang ) {
						tplFieldLang.setVisible(false) ;
					}
					if( tplModes ) {
						tplModes.setVisible(false) ;
					}
					if( tplDefer ) {
						tplDefer.setVisible(false) ;
					}
					break ;
				} 
				switch( currentAction.action_id ) {
					case 'MAIL_OUT' :
					case 'EMAIL_OUT' :
						tplField.getStore().clearFilter();
						tplField.getStore().filter([{
							property: 'manual_is_on',
							value: true
						}]);
						tplField.setReadOnly(false) ;
						tplField.reset() ;
						break ;
					case 'MAIL_AUTO' :
						tplField.getStore().clearFilter();
						tplField.getStore().filter([{
							property: 'manual_is_on',
							value: false
						}]);
						tplField.setReadOnly(false) ;
						tplField.reset() ;
						break ;
					default :
						tplField.getStore().clearFilter();
						tplField.getStore().filter([{
							property: 'tpl_id',
							operator: 'eq',
							value: ''
						}]);
						tplField.setReadOnly(false) ;
						tplField.reset() ;
						break ;
				}
				break ;
			}
		}
	},

	onFormChange: function(field) {
		if( field ) {
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
	},
	
	
	getActiveScenario: function() {
		return this._fileRecord.get('scen_code') ;
	},
	getCurrentActionFilerecordId: function() {
		if( this._fileActionFilerecordId ) {
			return this._fileActionFilerecordId ;
		}
	},
	getCurrentFilesubFilerecordId: function() {
		if( this._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._fileActionFilerecordId ) ;
			if( nowActionRecord ) {
				return nowActionRecord.get('link_filesub_filerecord_id') ;
			}
		}
	},
	getCurrentAction: function() {
		if( this._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._fileActionFilerecordId ) ;
			nowActionCode = nowActionRecord.get('link_action') ;
		} else {
			nowActionCode = this._newActionCode ;
		}
		if( !nowActionCode ) {
			return null ;
		}
		return Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(nowActionCode) ;
	},
	getCurrentSched: function() {
		if( this._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._fileActionFilerecordId ) ;
			if( nowActionRecord ) {
				return nowActionRecord.get('date_sched') ;
			}
		}
		return null ;
	},
	getCurrentTpl: function() {
		if( this._fileActionFilerecordId ) {
			var nowActionRecord = this._fileRecord.actions().getById( this._fileActionFilerecordId ) ;
			if( nowActionRecord ) {
				return nowActionRecord.get('link_tpl') ;
			}
		}
		return null ;
	},
	isCurrentActionAuto: function() {
		var torf = false ;
		
		// ToDo: scenario line
		if( !this._fileActionFilerecordId ) {
			return false ;
		}
		if( this.getCurrentAction().action_id=='MAIL_OUT' && this.getCurrentTpl() ) {
			return true ;
		}
		return false ;
	},
	
	
	handleSubmitEvent: function() {
		if( this.isCurrentActionAuto() ) {
			this.showLoadmask() ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'action_execMailAutoAction',
					file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
					fileaction_filerecord_id: this._fileActionFilerecordId
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						var error = ajaxResponse.success || 'File not saved !' ;
						Ext.MessageBox.alert('Error',error) ;
						return ;
					}
					var doReload = doReload ;
					this.onSaveHeader(ajaxResponse.file_filerecord_id) ;
				},
				callback: function() {
					this.hideLoadmask() ;
				},
				scope: this
			}) ;
			return ;
		}
		var formPanel = this,
			form = formPanel.getForm() ;
			  
		var errors = [] ;
		
		var postDataObj = form.getValues(false,false,false,true) ;
		var postData = form.getValues() ;
		Ext.apply(postData,{
			fileaction_filerecord_id: this._fileActionFilerecordId,
			link_status: this._fileRecord.get('status'),
			link_action: this.getCurrentAction()['action_id']
		}) ;
		
		// *** Statut SCHEDLOCK : validation action / next
		if( this._fileRecord.statusIsSchedLock() && postDataObj.hasOwnProperty('schedlock_next') ) {
			if( Ext.isEmpty( postData['schedlock_next'] ) ) {
				errors.push('Suivi de l\'action non renseigné') ;
			}
			if( postData['schedlock_next'] == 'agree_summary' ) {
				//console.dir(postDataObj['agree_summary']) ;
				var curMilestoneValid = false ;
				Ext.Array.each( postDataObj['agree_summary'], function(milestone) {
					if( milestone.milestone_status != 'CUR' ) {
						return ;
					}
					if( !Ext.isEmpty(milestone.milestone_date_sched_previous) 
						&& milestone.milestone_date_sched_previous != milestone.milestone_date_sched ) {
						
						// changement de date
						curMilestoneValid = true ;
					}
					if( !Ext.isEmpty(milestone.milestone_commit_record_ids) ) {
						// imputation
						curMilestoneValid = true ;
					}
				}) ;
				if( !curMilestoneValid ) {
					var error = 'Pas d\'action sur l\'échéancier' ;
					errors.push(error) ;
				} else {
					postData['agree_summary'] = postDataObj['agree_summary'] ;
				}
			}
			if( postData['schedlock_next'] == 'resched' 
				&& Ext.isEmpty(postData['schedlock_resched_date']) ) {
				var error = 'Date de report non renseignée' ;
				
				errors.push(error) ;
				this.getForm().findField('schedlock_resched_date').markInvalid(error) ;
			}
			if( postData['schedlock_next'] == 'schednew' 
				&& Ext.isEmpty(postData['schedlock_schednew_date']) ) {
				var error = 'Date prochaine action non renseignée' ;
				
				errors.push(error) ;
				this.getForm().findField('schedlock_schednew_date').markInvalid(error) ;
			}
			if( postData['schedlock_next'] == 'schednew' 
				&& postData.hasOwnProperty('schedlock_schednew_code')
				&& Ext.isEmpty(postData['schedlock_schednew_code']) ) {
				var error = 'Code suivi non renseigné' ;
				
				errors.push(error) ;
				this.getForm().findField('schedlock_schednew_code').markInvalid(error) ;
			}
		}
		
		// *** Statut STANDARD : validation next
		if( !this._fileRecord.statusIsSchedLock() ) {
			if( Ext.isEmpty( postData['next_action'] ) ) {
				var error = 'Prochaine action non renseignée' ;
				errors.push(error) ;
				//this.getForm().findField('next_action').markInvalid(error) ;
			} else if( this.getForm().findField('next_date').isVisible(true) && Ext.isEmpty( postData['next_date'] ) ) {
				var error = 'Date prochaine action non renseignée' ;
				errors.push(error) ;
				this.getForm().findField('next_date').markInvalid(error) ;
			}
		}
		
		
		// ****** Champs statiques ***********
		var postField = this.getForm().findField('adrtel_txt') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrtel_entity_name']) ) {
				var error = 'Destinataire appel' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
			if( Ext.isEmpty(postData['adrtel_txt']) ) {
				var error = 'Numéro d\'appel non renseigné' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		var postField = this.getForm().findField('adrpost_txt') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrpost_entity_name']) ) {
				var error = 'Destinataire courrier' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
			if( Ext.isEmpty(postData['adrpost_txt']) ) {
				var error = 'Adresse non renseignée' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		var postField = this.getForm().findField('adrmail_txt') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrmail_entity_name']) ) {
				var error = 'Destinataire e-mail' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
			if( Ext.isEmpty(postData['adrmail_txt']) ) {
				var error = 'Email non renseigné' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		
		Ext.Array.each(['adrpost_new_entity','adrtel_new_entity','adrmail_new_entity'],function(postName) {
			var postField = this.getForm().findField(postName) ;
			if( postField && postField.isVisible(true) ) {
				if( Ext.isEmpty(postData[postName]) ) {
					var error = 'Non du contact non renseigné' ;
					
					errors.push(error) ;
					postField.markInvalid(error) ;
				}
			}
		},this) ;
		
		var postField = this.getForm().findField('adrpost_result') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrpost_result']) ) {
				var error = 'Type courrier non renseigné' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		var postField = this.getForm().findField('adrtel_result') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrtel_result']) ) {
				var error = 'Résultat appel non renseigné' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		var txtField = this.getForm().findField('txt') ;
		if( txtField && txtField.isVisible(true) ) {
			if( Ext.isEmpty(postData['txt']) && (this.getCurrentAction()['action_id']!='BUMP') ) {
				var error = 'Commentaire non renseigné' ;
				
				errors.push(error) ;
				txtField.markInvalid(error) ;
			}
		}
		
		// ****** Validation Email **********
		if( this.down('#formNow') instanceof Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel ) {
			var actionPlusEmailPanel = this.down('#formNow') ;
			if( actionPlusEmailPanel.checkEmailSendable() === true ) {} else {
				var errorsEmail = actionPlusEmailPanel.checkEmailSendable() ;
				errors = Ext.Array.merge(errors,errorsEmail) ;
			}
		}
		
		
		// ****** Champs dynamiques ***********
		if( postData['link_action'] == 'BUMP' ) {
			if( postData['bumptxt_is_on'] && !Ext.isEmpty(postData['bumptxt_code']) ) {
				var fieldValue = postData['bumptxt_code'],
					fieldTree = this.getForm().findField('bumptxt_code').cfgParamTree,
					fieldNode = fieldTree.getStore().getNodeById(fieldValue),
					fieldTxt = [] ;
				while( true ) {
					if( fieldNode.isRoot() ) {
						break ;
					}
					fieldTxt.push( fieldNode.get('nodeText') ) ;
					fieldNode = fieldNode.parentNode ;
				}
				postData['link_txt'] = fieldTxt.reverse().join(' - ') ;
			}
		}
		switch( postData['next_action'] ) {
			case 'AGREE_START' :
				var fields = ['agree_amount','agree_period','agree_date','agree_datefirst','agree_count'] ;
				Ext.Array.each( fields, function(fieldName) {
					var hasErrors = false ;
					var field = this.getForm().findField(fieldName) ;
					if( field.isVisible(true) && Ext.isEmpty( postData[fieldName] ) ) {
						field.markInvalid('Information non renseignée') ;
						hasErrors = true ;
					}
					if( hasErrors ) {
						errors.push('Echéancier non rempli') ;
					}
				},this) ;
				break ;
				
			case 'CLOSE_ASK' :
				if( Ext.isEmpty( postData['close_code'] ) ) {
					var error = 'Renseigner raison de clôture' ;
					errors.push(error) ;
					this.getForm().findField('close_code').markInvalid(error) ;
					break ;
				}
				var fieldValue = postData['close_code'],
					fieldTree = this.getForm().findField('close_code').cfgParamTree,
					fieldNode = fieldTree.getStore().getNodeById(fieldValue),
					fieldTxt = [] ;
				while( true ) {
					if( fieldNode.isRoot() ) {
						break ;
					}
					fieldTxt.push( fieldNode.get('nodeText') ) ;
					fieldNode = fieldNode.parentNode ;
				}
				postData['close_txt'] = fieldTxt.reverse().join(' - ') ;
				break ;
			
			case 'LITIG_START' :
				if( Ext.isEmpty( postData['litig_code'] ) ) {
					var error = 'Renseigner raison de litige' ;
					errors.push(error) ;
					this.getForm().findField('litig_code').markInvalid(error) ;
					break ;
				}
				var fieldValue = postData['litig_code'],
					fieldTree = this.getForm().findField('litig_code').cfgParamTree,
					fieldNode = fieldTree.getStore().getNodeById(fieldValue),
					fieldTxt = [] ;
				while( true ) {
					if( fieldNode.isRoot() ) {
						break ;
					}
					fieldTxt.push( fieldNode.get('nodeText') ) ;
					fieldNode = fieldNode.parentNode ;
				}
				postData['litig_txt'] = fieldTxt.reverse().join(' - ') ;
				
				if( Ext.isEmpty(postData['litig_nextdate']) ) {
					var error = 'Renseigner date de suivi litige' ;
					errors.push(error) ;
					this.getForm().findField('litig_nextdate').markInvalid(error) ;
					break ;
				}
				break ;
			
			default :
				break ;
		}
		if( this.getCurrentAction()['action_id'] == 'CLOSE_ACK' && postData['schedlock_next'] == 'close' ) {
			while( true ) {
				
				if( Ext.isEmpty( postData['close_code'] ) ) {
					var error = 'Renseigner issue après clôture' ;
					errors.push(error) ;
					this.getForm().findField('close_code').markInvalid(error) ;
					break ;
				}
				var fieldValue = postData['close_code'],
					fieldTree = this.getForm().findField('close_code').cfgParamTree,
					fieldNode = fieldTree.getStore().getNodeById(fieldValue),
					fieldTxt = [] ;
				while( true ) {
					if( fieldNode.isRoot() ) {
						break ;
					}
					fieldTxt.push( fieldNode.get('nodeText') ) ;
					fieldNode = fieldNode.parentNode ;
				}
				postData['close_txt'] = fieldTxt.reverse().join(' - ') ;
				
				break ;
			}
		}
		
		if( this.getCurrentAction()['action_id'] == 'EMAIL_OUT' ) {
			var postDataObj = form.getValues(false,false,false,true) ;
			Ext.apply(postDataObj,{
				file_filerecord_id: this._fileRecord.get('file_filerecord_id')
			}) ;
			var emailRecord = Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel.createEmailRecord(postDataObj),
				emailRecordData = emailRecord.getData(true) ;
			postData['email_record'] = emailRecordData ;
		}

		if( this.getCurrentAction()['action_id'] == 'SMS_OUT' ) {
			var postDataObj = form.getValues(false,false,false,true) ;
			Ext.apply(postDataObj,{
				file_filerecord_id: this._fileRecord.get('file_filerecord_id')
			}) ;
		}
		
		var tplDeferDateField = this.getForm().findField('tpl_defer_date') ;
		if( tplDeferDateField && tplDeferDateField.isVisible(true) ) {
			if( Ext.isEmpty(postData['tpl_defer_date']) ) {
				var error = 'Date différée d\'exécution non renseignée' ;
			
				errors.push(error) ;
				tplDeferDateField.markInvalid(error) ;
			}
		}
		
		var postDataObj = form.getFieldValues() ;
		if( !postDataObj['scen_code_blank'] && postDataObj['tpl_defer_is_on'] ) {
			var error = 'Envoi différé en mode <u>Hors Scénario</u> uniquement' ;
			
			errors.push(error) ;
		}
		
		if( errors.length > 0 ) {
			Ext.MessageBox.alert('Erreur',errors.join('<br>')) ;
			return ;
		}
		
		
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'action_doFileAction',
				_is_new: ( this._fileNew ? 1 : 0 ),
				file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
				data: Ext.JSON.encode(postData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.error || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSaveHeader(ajaxResponse.file_filerecord_id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function(fileId) {
		this.fireEvent('saved',fileId) ;
		this.optimaModule.postCrmEvent('datachange',{}) ;
		this.destroy() ;
	},
	
	
	
	
	handlePreviewMulti: function(adrType) {
		var tplField = this.getForm().findField('tpl_id') ;
		if( !tplField ) {
			return ;
		}
		var tplId = tplField.getValue() ;
		if( Ext.isEmpty(tplId) ) {
			return ;
		}
		
		var tplFieldLang = this.getForm().findField('tpl_lang'),
			tplFieldLangValue = '' ;
		if( tplFieldLang && !Ext.isEmpty(tplFieldLang.getValue()) ) {
			tplFieldLangValue = tplFieldLang.getValue() ;
		}
		
		var postParams = {
			_moduleId: 'spec_rsi_recouveo',
			_action: 'action_execMailAutoPreview',
			file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
			tpl_id: tplId,
			tpl_lang: tplFieldLangValue,
			adr_type: adrType
		} ;
		var filesubFilerecordId = this.getCurrentFilesubFilerecordId() ;
		if( filesubFilerecordId ) {
			Ext.apply(postParams,{
				filesub_filerecord_id: filesubFilerecordId
			});
		}
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: postParams,
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					switch( adrType ) {
						case 'POSTAL' :
							this.handlePreviewEnvelopeDo( jsonResponse.data ) ;
							break ;
						
						case 'EMAIL' :
							this.handlePreviewEmailDo( jsonResponse.tmp_media_id ) ;
							break ;
							
						case 'TEL' :
							this.handlePreviewSmsDo( jsonResponse.data ) ;
							break ;
					}
				} else {
					Ext.MessageBox.alert('Error',jsonResponse.error||'Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	
	
	
	handlePreview: function() {
		if( !this.getCurrentAction() ) {
			return ;
		}
		switch( this.getCurrentAction().action_id ) {
			case 'MAIL_OUT' :
				return this.handlePreviewEnvelope() ;
				break ;
			case 'SMS_OUT' :
				return this.handlePreviewSms() ;
				break ;
			case 'EMAIL_OUT' :
				return this.handlePreviewEmail() ;
				break ;
			default :
				return ;
		}
	},
	handlePreviewSms: function() {
		if( this._readonlyMode ) {
			return ;
		}
		
		if( !(this.down('#formNow') instanceof Optima5.Modules.Spec.RsiRecouveo.ActionPlusSmsOutPanel) ) {
			return ;
		}
		
		var formPanel = this,
			form = formPanel.getForm() ;
		var postDataObj = form.getValues(false,false,false,true) ;
		var adrTel = postDataObj['adrtel_txt'] ;
		
		var smsData = {
			sms_date: Ext.Date.format(new Date(),'Y-m-d'),
			sms_recep_num: adrTel,
			sms_text: postDataObj['sms_content']
		}
		var hasError = false ;
		Ext.Object.each( smsData, function(k,v) {
			if( Ext.isEmpty(v) ) {
				hasError = true ;
			}
		}) ;
		if( hasError ) {
			return ;
		}
		this.handlePreviewSmsDo(smsData) ;
	},
	handlePreviewSmsDo: function(smsData) {
		this.optimaModule.createWindow({
			width:350,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			//title: envDataDocs[0].doc_desc,
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.SmsPreviewPanel',{
				_smsData: smsData,
				optimaModule: this.optimaModule
			})]
		}) ;
	},
	handlePreviewEmail: function(tmpMediaId) {
		if( this._readonlyMode ) {
			return ;
		}
		
		if( !(this.down('#formNow') instanceof Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel) ) {
			return ;
		}
		var actionPlusEmailPanel = this.down('#formNow') ;
		if( actionPlusEmailPanel.checkEmailSendable() === true ) {} else {
			var errors = actionPlusEmailPanel.checkEmailSendable() ;
			Ext.MessageBox.alert('Erreur',errors.join('<br>')) ;
			return ;
		}
		
		var formPanel = this,
			form = formPanel.getForm() ;
			  
		var postDataObj = form.getValues(false,false,false,true) ;
		Ext.apply(postDataObj,{
			file_filerecord_id: this._fileRecord.get('file_filerecord_id')
		}) ;
		var emailRecord = Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel.createEmailRecord(postDataObj),
			emailRecordData = emailRecord.getData(true) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_buildEmail',
				data: Ext.JSON.encode(emailRecordData)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.handlePreviewEmailDo( jsonResponse.tmp_media_id ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handlePreviewEmailDo: function( tmpMediaId ) {
		this.optimaModule.createWindow({
			width:750,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: 'Preview Email',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailMessagePanel',{
				_tmpMediaId: tmpMediaId,
				optimaModule: this.optimaModule,
				_modePreview: true,
				listeners: {
					destroy: function(p) {
						var tmpMediaId = p._tmpMediaId ;
						this.handlePreviewEmailClean(tmpMediaId);
					},
					scope: this
				}
			})]
		}) ;
	},
	handlePreviewEmailClean: function( tmpMediaId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_deleteTmpMedias',
				arr_media_id: Ext.JSON.encode([tmpMediaId])
			},
			success: function(response) {},
			callback: function() {},
			scope: this
		}) ;
	},
	handlePreviewEnvelope: function() {
		if( this._readonlyMode ) {
			return ;
		}
		
		var formPanel = this,
			form = formPanel.getForm() ;
			  
		var errors = [] ;
		
		var postDataObj = form.getValues(false,false,false,true) ;
		var postData = form.getValues() ;
		var tplId = postData['tpl_id'] ;
		var adrName = postData['adrpost_entity_name'] ;
		var adrPostal = postData['adrpost_txt'] ;
		if( Ext.isEmpty(tplId) ) {
			return ;
		}
		
		var inputFields = {} ;
		Ext.Object.each( postData, function(k,v) {
			if( k.indexOf('input_') != 0 ) {
				return ;
			}
			inputFields[k] = v ;
		});
		inputFields['input_attachments'] = '' ;
		var attachmentsField = this.getForm().findField('attachments') ;

		if( attachmentsField ) {
			Ext.Array.each( attachmentsField.getValue(), function(recordData) {
				inputFields['input_attachments'] += '- '+recordData['doc_desc']+'\r\n' ;
			});
		}

		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_getMailOut',
				tpl_id: tplId,
				file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
				adr_name: adrName,
				adr_postal: adrPostal,
				adr_type: 'POSTAL',
				input_fields: Ext.JSON.encode(inputFields)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.handlePreviewEnvelopeDo( jsonResponse.data ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handlePreviewEnvelopeDo: function(recordData) {
		var attachmentsField = this.getForm().findField('attachments') ;
		
		// build virtual envelope
		var envDataDocs = [] ;
		envDataDocs.push( recordData ) ;
		if( attachmentsField ) {
			Ext.Array.each( attachmentsField.getValue(), function(recordData) {
				envDataDocs.push(recordData) ;
			});
		}
		var envData = {
			docs: envDataDocs
		};
		
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: envDataDocs[0].doc_desc,
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',{
				optimaModule: this.optimaModule,
				_envData: envData,
				_deleteMediaId: envDataDocs[0].envdoc_media_id,
				listeners: {
					destroy: this.onPreviewClose,
					scope: this
				}
			})]
		}) ;
	},
	onPreviewClose: function(envPreviewPanel) {
		if( envPreviewPanel._deleteMediaId ) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'doc_delete',
					envdoc_media_id: Ext.JSON.encode([envPreviewPanel._deleteMediaId])
				},
				scope: this
			}) ;
		}
	},
	handlePreviewpDo: function(pageTitle, pageHtml, pageFilename) {
		this.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: pageTitle,
			filename: pageFilename,
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				hidden: true,
				icon: 'images/modules/rsiveo-print-16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			},{
				icon: 'images/modules/rsiveo-save-16.gif',
				text: 'Save as PDF',
				handler: function(btn) {
					var win = btn.up('window'),
						uxIFrame = win.down('#uxIFrame') ;
					
					var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply(exportParams,{
						_moduleId: 'spec_rsi_recouveo',
						_action: 'util_htmlToPdf',
						filename: win.filename,
						html: Ext.JSON.encode(uxIFrame.content)
					}) ;
					Ext.create('Ext.ux.dams.FileDownloader',{
						renderTo: Ext.getBody(),
						requestParams: exportParams,
						requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						requestMethod: 'POST'
					}) ;
				},
				scope: this
			}]
		}); 
	},
	
	
	onBeforeDestroy: function() {
		var attachmentsField = this.getForm().findField('attachments') ;
		if( attachmentsField ) {
			attachmentsField.doDeleteAll() ;
		}
	}
}) ;
