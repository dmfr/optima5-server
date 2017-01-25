Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 800,
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
				handler: function( btn ) {
					this.handleSubmitEvent() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.startAction( this._accId, this._fileFilerecordId, this._fileActionFilerecordId, this._newActionCode ) ;
		},this) ;
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
		switch( currentAction.action_id ) {
			case 'AGREE_FOLLOW' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel' ;
				break ;
			case 'LITIG_FOLLOW' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusLitigFollowPanel' ;
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
				break ;
			case 'BUMP' :
				nowActionClass = 'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel' ;
				break ;
			default :
				break ;
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
		if( !this._fileRecord.statusIsSchedLock() ) {
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
		this.fireEvent('mylayout',this) ;
		
		// Données
		var formData = {
			action_txt: currentAction.action_txt,
			action_sched: ( this.getCurrentSched() ? Ext.util.Format.date(this.getCurrentSched(),'d/m/Y') : '' )
		};
		if( this._formValues ) {
			if( this._formValues['adrtel_entity'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					if( adrRec.get('status_is_invalid') ) {
						return ;
					}
					if( adrRec.get('adr_entity')==this._formValues['adrtel_entity'] && adrRec.get('adr_type')=='TEL' ) {
						this._formValues['adrtel_filerecord_id'] = adrRec.getId() ;
						return false ;
					}
				},this) ;
			}
			if( this._formValues['adrpost_entity'] ) {
				this._accountRecord.adrbook().each( function( adrRec ) {
					if( adrRec.get('status_is_invalid') ) {
						return ;
					}
					if( adrRec.get('adr_entity')==this._formValues['adrpost_entity'] && adrRec.get('adr_type')=='POST' ) {
						this._formValues['adrpost_filerecord_id'] = adrRec.getId() ;
						return false ;
					}
				},this) ;
			}
			
			Ext.apply(formData,this._formValues) ;
			
			this._formValues = null ;
		}
		this.getForm().setValues(formData) ;
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
	
	
	handleSubmitEvent: function() {
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
			if( this.down('#rightRecords') && this.down('#rightRecords').isVisible(true) ) {
				if( this.down('#rightRecords').down('grid').getSelectionModel().getSelection().length != 1 ) {
					errors.push('Enregistrement comptable non sélectionné') ;
				} else {
					var rec = this.down('#rightRecords').down('grid').getSelectionModel().getSelection()[0] ;
					postData['schedlock_confirm_txt'] = rec.get('record_id') ;
				}
			}
		}
		
		// *** Statut STANDARD : validation next
		if( !this._fileRecord.statusIsSchedLock() ) {
			if( Ext.isEmpty( postData['next_action'] ) ) {
				var error = 'Prochaine action non renseignée' ;
				errors.push(error) ;
				this.getForm().findField('next_action').markInvalid(error) ;
			} else if( this.getForm().findField('next_date').isVisible(true) && Ext.isEmpty( postData['next_date'] ) ) {
				var error = 'Date prochaine action non renseignée' ;
				errors.push(error) ;
				this.getForm().findField('next_date').markInvalid(error) ;
			}
		}
		
		
		// ****** Champs statiques ***********
		var postField = this.getForm().findField('adrtel_txt') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrtel_txt']) ) {
				var error = 'Numéro d\'appel non renseigné' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
		var postField = this.getForm().findField('adrpost_txt') ;
		if( postField && postField.isVisible(true) ) {
			if( Ext.isEmpty(postData['adrpost_txt']) ) {
				var error = 'Adresse non renseignée' ;
				
				errors.push(error) ;
				postField.markInvalid(error) ;
			}
		}
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
			if( Ext.isEmpty(postData['txt']) ) {
				var error = 'Commentaire non renseigné' ;
				
				errors.push(error) ;
				txtField.markInvalid(error) ;
			}
		}
		
		
		// ****** Champs dynamiques ***********
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
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSaveHeader() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSaveHeader: function() {
		this.fireEvent('saved',this._fileRecord.get('file_filerecord_id')) ;
		this.optimaModule.postCrmEvent('datachange',{}) ;
		this.destroy() ;
	}
}) ;
