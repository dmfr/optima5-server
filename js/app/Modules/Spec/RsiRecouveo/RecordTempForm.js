Ext.define('Optima5.Modules.Spec.RsiRecouveo.RecordTempForm',{
	extend:'Ext.form.Panel',
	
	requires: [],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 450,
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: 'anchor',
			fieldDefaults: {
				anchor: '100%',
				labelWidth: 80
			},
			items: [{
				xtype: 'fieldset',
				title: 'Sélection base pièces',
				items: [{
					itemId: 'pRecordsGrid',
					xtype: 'grid',
					height: 185,
					margin: '0px 0px 10px 0px',
					selModel: {
						selType: 'checkboxmodel',
						mode: 'MULTI'
					},
					columns: [{
						text: 'Libellé',
						dataIndex: 'record_id',
						width: 130
					},{
						text: 'Date',
						dataIndex: 'date_value',
						align: 'center',
						width: 80,
						renderer: Ext.util.Format.dateRenderer('d/m/Y')
					},{
						text: 'Montant',
						dataIndex: 'amount',
						align: 'right',
						width: 80
					}],
					store: {
						model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getRecordModel(),
						data: [],
						sorters:[{
							property: 'date_value',
							direction: 'DESC'
						}]
					},
					listeners: {
						selectionchange: this.onSelectionChange,
						scope: this
					}
				}]
			},{
				xtype: 'fieldset',
				title: 'Pièce à créer',
				items: [{
					xtype: 'textfield',
					name: 'recordTemp_id',
					fieldLabel: 'Libellé pièce',
					allowBlank: false
				},{
					xtype: 'numberfield',
					hideTrigger: true,
					name: 'recordTemp_amount',
					fieldLabel: 'Montant',
					anchor: '',
					width: 175,
					allowBlank: false
				}]
			}],
			buttons: [{
				itemId: 'btnOk',
				xtype: 'button',
				text: 'OK',
				icon: 'images/modules/rsiveo-save-16.gif',
				handler: function( btn ) {
					this.doSubmit() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.doStart( this._accId, this._fileFilerecordId ) ;
		},this) ;
		
		this.on('beforedestroy', this.onBeforeDestroy, this) ;
	},
	
	doStart: function( accId, fileFilerecordId ) {
		this._accId = accId ;
		this._fileFilerecordId = fileFilerecordId ;
		
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
		this._fileRecord = accountRecord.files().getById( this._fileFilerecordId ) ;
		
		var pRecordsGridData = [] ;
		this._fileRecord.records().each( function(recordRecord) {
			var row = recordRecord.getData() ;
			pRecordsGridData.push( row ) ;
		},this);
		this.down('#pRecordsGrid').getStore().loadRawData(pRecordsGridData) ;
		
		this.fireEvent('mylayout',this) ;
	},
	
	onSelectionChange: function(selModel,records) {
		var form = this.getForm() ;
		if( records || records.length==0 ) {
			form.reset() ;
		}
		
		var fileIds=[], amount=0 ;
		Ext.Array.each( records, function(record) {
			fileIds.push( record.get('record_id') ) ;
			amount += record.get('amount') ;
		}) ;
		
		var lib = 'Recouveo'+': '+fileIds.join(' + '),
			amount = Math.round( amount * 100 * -1 ) / 100 ;
		form.findField('recordTemp_amount').setValue(amount) ;
		form.findField('recordTemp_id').setValue(lib) ;
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
	
	doSubmit: function() {
		var form = this.getForm(),
			formValues = form.getFieldValues() ;
		if( !form.isValid() ) {
			return ;
		}
		
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_createRecordTemp',
				acc_id : this._accountRecord.get('acc_id'),
				data: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				var doReload = doReload ;
				this.onSubmitDone() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onSubmitDone: function() {
		this.fireEvent('saved') ;
		this.optimaModule.postCrmEvent('datachange',{}) ;
		this.destroy() ;
	},
	
	onBeforeDestroy: function() {
		var attachmentsField = this.getForm().findField('attachments') ;
		if( attachmentsField ) {
			attachmentsField.doDeleteAll() ;
		}
	}
}) ;
