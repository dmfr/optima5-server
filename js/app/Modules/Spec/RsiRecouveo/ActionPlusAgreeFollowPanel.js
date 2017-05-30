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
				xtype: 'fieldset',
				title: 'Suivi de la promesse',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
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
							field.setVisible( !Ext.isEmpty(val) ) ;
						}
					}
				},{
					xtype      : 'fieldcontainer',
					fieldLabel : 'Echéance',
					defaultType: 'radiofield',
					defaults: {
						flex: 1
					},
					layout: 'vbox',
					items: [
						{
							boxLabel  : 'Valider cette échéance<br><i>Identifier le paiement ci-contre</i>',
							name      : 'schedlock_next',
							inputValue: 'confirm'
						}, {
							boxLabel  : 'Reporter l\'échéance',
							name      : 'schedlock_next',
							inputValue: 'resched'
						}, {
							boxLabel  : '<font color="red">Annuler la promesse</font><br><i>Retour dossier "en cours"</i>',
							name      : 'schedlock_next',
							inputValue: 'end'
						}
					]
				},{
					hidden: true,
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'schedlock_resched_date',
					fieldLabel: 'Date prévue'
				}]
			},{
				xtype: 'box',
				width: 16
			},{
				itemId: 'rightEmpty',
				hidden: false,
				flex: 1,
				xtype: 'box'
			},{
				hidden: true,
				itemId: 'rightRecords',
				flex: 1,
				xtype: 'fieldset',
				padding: 5,
				title: 'Enregistrements',
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
					}
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
	},
	
	onFormChange: function(form,field) {
		if( field.getName() == 'schedlock_next' ) {
			var fieldValue = form.getValues()['schedlock_next'] ;
			this.getForm().findField('schedlock_resched_date').setVisible( fieldValue=='resched' ) ;
			this.down('#rightEmpty').setVisible( fieldValue!='confirm' ) ;
			this.down('#rightRecords').setVisible( fieldValue=='confirm' ) ;
			
		}
		this.fireEvent('change',field) ;
	}
}) ;
