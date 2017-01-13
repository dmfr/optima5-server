Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateAgreePanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateClosePanel',
		'Optima5.Modules.Spec.RsiRecouveo.FileCreateLitigPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		
		var atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrColumns.push({
				text: atrRecord.bible_code.substring(4),
				dataIndex: atrRecord.bible_code,
				width:85,
				align: 'center'
			}) ;
		}) ;
		
		Ext.apply(this,{
			width: 950,
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				itemId: 'cntLeft',
				xtype: 'container',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items:[{
					border: false,
					itemId: 'pLeftForm',
					xtype: 'form',
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 5,
					layout: 'anchor',
					fieldDefaults: {
						anchor: '100%',
						labelWidth: 120
					},
					items: {
						xtype: 'fieldset',
						title: 'Attributs',
						items: [{
							xtype: 'hiddenfield',
							name: 'acc_id',
							fieldLabel: 'Compte Acht.'
						},{
							xtype: 'displayfield',
							name: 'acc_txt',
							fieldLabel: 'Compte Acht.'
						},{
							xtype: 'hiddenfield',
							name: 'new_action_id',
							fieldLabel: 'Compte Acht.'
						},{
							xtype: 'displayfield',
							name: 'new_action_txt',
							fieldLabel: 'Action'
						}]
					}
				},{
					flex: 1,
					itemId: 'pLeftGrid',
					xtype: 'grid',
					store: {
						model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getRecordModel(),
						data: [],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					},
					columns: Ext.Array.merge([{
						dataIndex: 'record_id',
						text: 'Fact/Paiment',
						width: 150
					},{
						dataIndex: 'status_id',
						text: 'Stat',
						width: 60
					}],atrColumns)
				}]
			},{
				xtype: 'box',
				cls: 'ux-noframe-bg',
				width: 16
			},{
				flex: 1,
				cls: 'ux-noframe-bg',
				itemId: 'cntRight',
				xtype: 'container',
				layout: 'fit'
			}],
			buttons: [{
				itemId: 'btnOk',
				hidden: true,
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.handleSubmitNew() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.startNew( this._accId, this._arr_recordIds, this._newActionCode ) ;
		},this) ;
	},
	
	startNew: function( accId, arr_recordIds, newActionCode ) {
		this._accId = accId ;
		this._arr_recordIds = arr_recordIds ;
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
				this.onStartResponse(
					Ext.ux.dams.ModelManager.create( 
						Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAccountModel(),
						ajaxResponse.data
					)
				) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onStartResponse: function( accountRecord ) {
		this._accountRecord = accountRecord ;
		
		var newAction = this.getNewAction(),
			newActionClass = null ;
		switch( newAction.action_id ) {
			case 'AGREE_START' :
				newActionClass = 'Optima5.Modules.Spec.RsiRecouveo.FileCreateAgreePanel' ;
				break ;
			case 'LITIG_START' :
				newActionClass = 'Optima5.Modules.Spec.RsiRecouveo.FileCreateLitigPanel' ;
				break ;
			case 'CLOSE_ASK' :
				newActionClass = 'Optima5.Modules.Spec.RsiRecouveo.FileCreateClosePanel' ;
				break ;
			case 'BUMP' :
				newActionClass = 'Ext.panel.Panel' ;
				break ;
			default :
				break ;
		}
		if( !newActionClass ) {
			Ext.MessageBox.alert('Error','Error', function() {
				this.destroy() ;
			}) ;
		}
		
		
		// Form panel
		var formData = {
			new_action_id: newAction.action_id,
			new_action_txt: newAction.action_txt,
			acc_id: accountRecord.get('acc_id'),
			acc_txt: '<b>'+accountRecord.get('acc_id')+'</b>'
		};
		this.getForm().setValues(formData) ;
		
		
		// Grid panel
		/* Checks :
		 *  - source file : no lock status
		 *  - each Atr : 1 value
		 */
		var pLeftGridData = [],
			controlHasLock = false,
			controlMapAtrValues = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			controlMapAtrValues[atrId] = [] ;
		}) ;
		accountRecord.files().each( function(fileRecord) {
			fileRecord.records().each( function(recordRecord) {
				if( !Ext.Array.contains( this._arr_recordIds, recordRecord.getId() ) ) {
					return ;
				}
				
				// Controle
				Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
					if( !Ext.Array.contains(controlMapAtrValues[atrId],recordRecord.get(atrId)) ) {
						controlMapAtrValues[atrId].push(recordRecord.get(atrId)) ;
					}
				}) ;
				var statusRow = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusRowId(fileRecord.get('status')) ;
				if( !statusRow || statusRow.sched_lock ) {
					controlHasLock = true ;
				}
				
				var row = recordRecord.getData() ;
				row.status_id = statusRow.status_id ;
				pLeftGridData.push( row ) ;
			},this);
		},this);
		
		var pLeftGrid = this.down('#pLeftGrid'),
			pLeftGridControlError = false ;
		if( controlHasLock ) {
			pLeftGridControlError = true ;
			pLeftGrid.headerCt.down('[dataIndex="status_id"]').tdCls = 'op5-spec-dbspeople-realvalidgrid-tdcolor-durationless' ;
		}
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			if( controlMapAtrValues[atrId].length != 1 ) {
				pLeftGrid.headerCt.down('[dataIndex="'+atrId+'"]').tdCls = 'op5-spec-dbspeople-realvalidgrid-tdcolor-durationless' ;
				pLeftGridControlError = true ;
			}
		}) ;
		pLeftGrid.getStore().loadRawData(pLeftGridData) ;
		
		
		
		
		
		// Right panel
		var cntRight = this.down('#cntRight') ;
		cntRight.removeAll() ;
		cntRight.add(Ext.create(newActionClass,{
			bodyCls: 'ux-noframe-bg',
			border: false,
			
			optimaModule: this.optimaModule,
			
			listeners: {
				change: this.onFormChange,
				scope: this
			}
		})) ;
		var formData = {} ;
		switch( newAction.action_id ) {
			case 'AGREE_START' :
				formData['agree_amount'] = 0 ;
				accountRecord.files().each( function(fileRecord) {
					fileRecord.records().each( function(recordRecord) {
						if( !Ext.Array.contains( this._arr_recordIds, recordRecord.getId() ) ) {
							return ;
						}
						
						formData['agree_amount'] += recordRecord.get('amount') ;
					},this);
				},this);
				this.getForm().setValues(formData) ;
				break ;
		}
		
		if( !pLeftGridControlError ) {
			this.down('#btnOk').setVisible(true) ;
		} else {
			Ext.MessageBox.alert('Erreur','Factures sélectionnées incompatibles') ;
		}
		this.fireEvent('mylayout',this) ;
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
	
	
	getNewAction: function() {
		var nowActionCode = this._newActionCode ;
		return Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionRowId(nowActionCode) ;
	},
	
	
	handleSubmitNew: function() {
		var formPanel = this,
			form = formPanel.getForm(),
			formData = form.getValues() ;
			  
		var errors = [] ;
		
		
		// ****** Champs dynamiques ***********
		switch( formData['next_action'] ) {
			case 'AGREE_START' :
				var fields = ['agree_amount','agree_period','agree_date','agree_datefirst','agree_count'] ;
				Ext.Array.each( fields, function(fieldName) {
					var hasErrors = false ;
					var field = this.getForm().findField(fieldName) ;
					if( field.isVisible() && Ext.isEmpty( formData[fieldName] ) ) {
						field.markInvalid('Information non renseignée') ;
						hasErrors = true ;
					}
					if( hasErrors ) {
						errors.push('Echéancier non rempli') ;
					}
				},this) ;
				break ;
			case 'CLOSE_ASK' :
				if( Ext.isEmpty( formData['close_code'] ) ) {
					var error = 'Renseigner raison de clôture' ;
					errors.push(error) ;
					this.getForm().findField('close_code').markInvalid(error) ;
					break ;
				}
				var fieldValue = formData['close_code'],
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
				formData['close_txt'] = fieldTxt.reverse().join(' - ') ;
				break ;
			
			case 'LITIG_START' :
				if( Ext.isEmpty( formData['litig_code'] ) ) {
					var error = 'Renseigner raison de litige' ;
					errors.push(error) ;
					this.getForm().findField('litig_code').markInvalid(error) ;
					break ;
				}
				var fieldValue = formData['litig_code'],
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
				formData['litig_txt'] = fieldTxt.reverse().join(' - ') ;
				
				if( Ext.isEmpty(formData['litig_nextdate']) ) {
					var error = 'Renseigner date de suivi litige' ;
					errors.push(error) ;
					this.getForm().findField('litig_nextdate').markInvalid(error) ;
					break ;
				}
				break ;
			
			default :
				break ;
		}
		
		if( errors.length > 0 ) {
			Ext.MessageBox.alert('Erreur',errors.join('<br>')) ;
			return ;
		}
		
		
		
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_createForAction',
				
				acc_id: this._accId,
				arr_recordIds: Ext.JSON.encode(this._arr_recordIds),
				new_action_code: this._newActionCode,
				form_data: Ext.JSON.encode(formData)
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
	onSaveHeader: function(newFileId) {
		this.fireEvent('created',newFileId) ;
		this.optimaModule.postCrmEvent('datachange',{}) ;
		this.destroy() ;
	}
}) ;
