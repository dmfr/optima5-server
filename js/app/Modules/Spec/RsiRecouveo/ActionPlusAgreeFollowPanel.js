Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		// Unallocated records
		var toAllocatePaymentRecords = [] ;
		this._accountRecord.files().each( function(accountFileRecord) {
			if( accountFileRecord.statusIsSchedLock() ) {
				return ;
			}
			if( accountFileRecord.get('status_closed_end') ) {
				return ;
			}
			accountFileRecord.records().each( function(accountFileRecordRecord) {
				if( accountFileRecordRecord.get('amount') >= 0 ) {
					return ;
				}
				toAllocatePaymentRecords.push( accountFileRecordRecord.getData() ) ;
			},this) ;
		},this) ;
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'fieldset',
					title: 'Suivi de la promesse',
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [{
						xtype: 'hiddenfield',
						name: 'schedlock_next',
						valueOrig: 'agree_summary',
						value: 'agree_summary'
					},{
						xtype: 'displayfield',
						fieldLabel: 'Action',
						name: 'action_txt',
						value: ''
					},{
						hidden: true,
						xtype: 'displayfield',
						fieldLabel: 'Prévue le',
						name: 'action_sched',
						value: '',
						listeners: {
							change: function(field,val) {
								//field.setVisible( !Ext.isEmpty(val) ) ;
							}
						}
					},{
						xtype: 'checkboxfield',
						boxLabel: '<font color="red">Annuler échéancier</font>',
						listeners: {
							change: function(field,val) {
								this.down('#formSummary').down('treepanel').setVisible(!val) ;
								this.getForm().findField('schedlock_next').setValue( val ? 'end' : this.getForm().findField('schedlock_next').valueOrig ) ;
							},
							scope: this
						}
					}]
				},{
					xtype: 'fieldset',
					padding: 5,
					title: 'Paiements non affectés',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%'
					},
					items: [{
						itemId: 'pRecordsGrid',
						xtype: 'grid',
						height: 220,
						selModel: {
							//selType: 'checkboxmodel',
							//mode: 'MULTI'
						},
						columns: [{
							text: 'Libellé',
							dataIndex: 'record_ref',
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
							data: toAllocatePaymentRecords,
							sorters:[{
								property: 'date_value',
								direction: 'DESC'
							}],
							filters:[{
								property: 'amount',
								operator: 'lt',
								value: 0
							}]
						},
						viewConfig: {
							plugins: {
								ptype: 'gridviewdragdrop',
								ddGroup: 'RsiRecouveoAgreeRecordsTreeDD',
								dragText: 'Glisser paiements pour associer',
								appendOnly: true,
								enableDrop: false,
								enableDrag: true
							}
						}
					}]
				}]
			},{
				xtype: 'box',
				width: 16
			},
			Ext.create('Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel',{
				flex: 1,
				
				itemId: 'formSummary',
				//title: 'Echeancier',
				cls: 'ux-noframe-bg',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 0,
				
				name: 'agree_summary',
				
				optimaModule: this.optimaModule
			})]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
		
		var agreeSummaryPanel = this.down('#formSummary') ;
		if( agreeSummaryPanel instanceof Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel ) {
			var fileFilerecordId = this._actionForm._fileFilerecordId,
				fileactionFilerecordId = this._actionForm._fileActionFilerecordId,
				fileRecord = this._fileRecord ;
			
			agreeSummaryPanel.setupFromFile( fileRecord||fileFilerecordId, fileactionFilerecordId ) ;
		}
	},
	
	onFormChange: function(form,field) {
		/*
		if( field.getName() == 'schedlock_next' ) {
			var fieldValue = form.getValues()['schedlock_next'] ;
			this.getForm().findField('schedlock_resched_date').setVisible( fieldValue=='resched' ) ;
			this.down('#rightEmpty').setVisible( fieldValue!='confirm' ) ;
			this.down('#rightRecords').setVisible( fieldValue=='confirm' ) ;
			
		}
		this.fireEvent('change',field) ;
		*/
	}
}) ;
